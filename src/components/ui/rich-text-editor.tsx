'use client';

import type { ReactNode } from 'react';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AArrowDown,
  AArrowUp,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ExternalLink,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Unlink,
  Video,
} from 'lucide-react';
import { Extension, getMarkRange } from '@tiptap/core';
import { Link } from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils/cn';
import {
  isAllowedEditorLinkHref,
  isValidExternalHref,
  normalizeLinkHref,
  openInNewTab,
  shouldAutoLinkHref,
} from '@/lib/utils/link-intent';
import { parseVideoUrl } from '@/lib/video/parse-video-url';
import { ImageEmbedNode } from '@/components/ui/image-embed-node';
import { showPopupBlockedToast } from '@/components/ui/popup-blocked-toast';
import { VideoEmbedNode } from '@/components/ui/video-embed-node';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  /** Extra classes applied to the editable area (`contenteditable` div) where the user types (e.g. `pr-10` to reserve space for an character counter). */
  editableAreaClassName?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  /** Optional actions rendered right-aligned in the toolbar (e.g. a suggestions button). */
  extraToolbarActions?: ReactNode;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: ReactNode;
  title: string;
}

// Font-size ladder (px). "Normal" text is DEFAULT_FONT_SIZE and is stored with
// no inline size at all, so untouched content stays byte-identical. The stepper
// walks this ladder and is capped at the first/last entry. Keep these values in
// sync with the `font-size` allow-list in `sanitize-html.ts`.
const FONT_SIZE_STEPS = [12, 14, 15, 16, 18, 20, 24, 30] as const;
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = FONT_SIZE_STEPS[0];
const MAX_FONT_SIZE = FONT_SIZE_STEPS[FONT_SIZE_STEPS.length - 1];

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left', Icon: AlignLeft },
  { value: 'center', label: 'Center', Icon: AlignCenter },
  { value: 'right', label: 'Right', Icon: AlignRight },
] as const;

const INACTIVE_EDITOR_STATE = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrike: false,
  isSubscript: false,
  isSuperscript: false,
  isBulletList: false,
  isOrderedList: false,
  isBlockquote: false,
  isLink: false,
  linkHref: '',
  align: 'left' as 'left' | 'center' | 'right',
  fontSize: DEFAULT_FONT_SIZE,
} as const;

/** Parses a stored `fontSize` (e.g. `"18px"`) into a number, falling back to the default. */
function parseFontSize(value: string | undefined): number {
  if (!value) return DEFAULT_FONT_SIZE;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_FONT_SIZE;
}

/** Returns the next size on the ladder in `direction` (+1 larger / -1 smaller), clamped to the ladder. */
function nextFontSize(current: number, direction: 1 | -1): number {
  const exactIndex = FONT_SIZE_STEPS.indexOf(
    current as (typeof FONT_SIZE_STEPS)[number]
  );
  let nextIndex: number;
  if (exactIndex !== -1) {
    nextIndex = exactIndex + direction;
  } else if (direction === 1) {
    // Not on the ladder: step up to the first larger entry.
    const i = FONT_SIZE_STEPS.findIndex(step => step > current);
    nextIndex = i === -1 ? FONT_SIZE_STEPS.length - 1 : i;
  } else {
    // Step down to the last smaller entry.
    const i = [...FONT_SIZE_STEPS].reverse().findIndex(step => step < current);
    nextIndex = i === -1 ? 0 : FONT_SIZE_STEPS.length - 1 - i;
  }
  const clamped = Math.min(Math.max(nextIndex, 0), FONT_SIZE_STEPS.length - 1);
  return FONT_SIZE_STEPS[clamped];
}

/**
 * Keeps the text being linked visibly highlighted while the link input row
 * has keyboard focus. Without this, the browser clears the native selection
 * highlight the instant focus moves to the URL field, so the host loses any
 * visual cue of what they're about to link. The range lives in the
 * extension's own storage (TipTap's mechanism for state that isn't React
 * state) rather than a React ref, so nothing here ever reads a ref during
 * render — the component below only ever writes to `editor.storage` from an
 * effect.
 */
const SelectionHighlight = Extension.create({
  name: 'selectionHighlight',
  addStorage() {
    return { range: null as { from: number; to: number } | null };
  },
  addProseMirrorPlugins() {
    // Arrow function so `this` stays the extension instance (its storage),
    // instead of aliasing `this` to a local variable.
    return [
      new Plugin({
        key: new PluginKey('selectionHighlight'),
        props: {
          decorations: state => {
            const range = this.storage.range;
            if (!range || range.from === range.to) return null;
            return DecorationSet.create(state.doc, [
              Decoration.inline(range.from, range.to, {
                class: 'link-target-highlight',
              }),
            ]);
          },
        },
      }),
    ];
  },
});

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type='button'
      disabled={disabled}
      onMouseDown={event => {
        if (disabled) return;
        // Keep editor focus on toolbar interactions so selection/active-state is preserved.
        event.preventDefault();
        onClick();
      }}
      className={cn(
        'h-8 w-8 rounded-md p-0 inline-flex items-center justify-center transition-colors',
        'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-40',
        isActive && 'bg-muted'
      )}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Tell your story...',
  className,
  editableAreaClassName,
  ariaInvalid = false,
  ariaDescribedBy,
  extraToolbarActions,
}: RichTextEditorProps) {
  // Lets the Mod-k keyboard shortcut (registered once on the extension below)
  // reach the current React setters that open the link input row. Reassigned
  // each render so it never goes stale.
  const openLinkInputRef = useRef<(href: string) => void>(() => {});

  // See closeLinkInput below — guards the link URL input's onBlur against
  // firing (with a stale value) as a side effect of the input unmounting.
  const suppressNextLinkBlurRef = useRef(false);

  // Custom Link extension: same config as before, plus a Mod-k shortcut that
  // opens the link input (prefilled from the link under the cursor). `useEditor`
  // reads its extensions once (empty deps), so recreating this object per render
  // is harmless — only the first instance is used.
  const linkExtension = Link.extend({
    addKeyboardShortcuts() {
      return {
        'Mod-k': () => {
          const href = (this.editor.getAttributes('link').href as string) ?? '';
          openLinkInputRef.current(href);
          return true;
        },
      };
    },
  }).configure({
    openOnClick: false,
    enableClickSelection: true,
    autolink: true,
    linkOnPaste: true,
    defaultProtocol: 'https',
    isAllowedUri: isAllowedEditorLinkHref,
    shouldAutoLink: shouldAutoLinkHref,
    HTMLAttributes: {
      target: '_blank',
      rel: 'noopener noreferrer nofollow',
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        heading: false,
        // StarterKit bundles its own Link and registers it unless this is
        // false. `linkExtension` below is the configured one we actually want
        // (openOnClick off, Mod-k shortcut) — leaving both on registers two
        // marks named `link`, which TipTap warns about and which double-binds
        // the autolink/paste plugins.
        link: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      FontSize,
      // Sub/superscript are mutually exclusive — applying one clears the other,
      // so text can never be both at once (which renders nonsensically).
      Subscript.extend({ excludes: 'superscript' }),
      Superscript.extend({ excludes: 'subscript' }),
      TextAlign.configure({
        types: ['paragraph'],
      }),
      linkExtension,
      SelectionHighlight,
      VideoEmbedNode,
      ImageEmbedNode,
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[120px] p-3 text-base text-foreground leading-[1.625] focus:outline-none',
          editableAreaClassName
        ),
        ...(ariaInvalid ? { 'aria-invalid': 'true' } : {}),
        ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
      },
    },
    immediatelyRender: false,
  });

  const activeState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) {
        return INACTIVE_EDITOR_STATE;
      }

      return {
        isBold: currentEditor.isActive('bold'),
        isItalic: currentEditor.isActive('italic'),
        isUnderline: currentEditor.isActive('underline'),
        isStrike: currentEditor.isActive('strike'),
        isSubscript: currentEditor.isActive('subscript'),
        isSuperscript: currentEditor.isActive('superscript'),
        isBulletList: currentEditor.isActive('bulletList'),
        isOrderedList: currentEditor.isActive('orderedList'),
        isBlockquote: currentEditor.isActive('blockquote'),
        isLink: currentEditor.isActive('link'),
        linkHref: (currentEditor.getAttributes('link').href as string) ?? '',
        align: currentEditor.isActive({ textAlign: 'center' })
          ? ('center' as const)
          : currentEditor.isActive({ textAlign: 'right' })
            ? ('right' as const)
            : ('left' as const),
        fontSize: parseFontSize(
          currentEditor.getAttributes('textStyle').fontSize
        ),
      };
    },
  });
  const toolbarState = activeState ?? INACTIVE_EDITOR_STATE;

  const t = useTranslations('Common.videoEmbed.editor');
  const tLink = useTranslations('Common');
  const videoErrorId = useId();
  const linkErrorId = useId();
  const [isVideoInputOpen, setIsVideoInputOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [hasLinkError, setHasLinkError] = useState(false);

  const closeVideoInput = () => {
    setVideoUrl('');
    setHasVideoError(false);
    setIsVideoInputOpen(false);
  };

  const insertVideo = () => {
    const parsed = parseVideoUrl(videoUrl);
    if (!parsed || !editor) {
      setHasVideoError(true);
      return;
    }
    editor
      .chain()
      .focus()
      .setVideoEmbed({
        provider: parsed.provider,
        videoId: parsed.id,
        aspect: parsed.aspect,
      })
      .run();
    closeVideoInput();
  };

  const closeLinkInput = () => {
    // Removing a focused element from the DOM fires a native blur on it as a
    // side effect (browsers move focus away when it's disconnected) — which
    // would otherwise re-trigger the auto-commit-on-blur handler below with a
    // stale closure (still seeing the URL from just before this close/apply).
    // Set the flag here, the single choke point every close path already
    // goes through, so that follow-on blur is recognised and ignored once.
    suppressNextLinkBlurRef.current = true;
    setLinkUrl('');
    setHasLinkError(false);
    setIsLinkInputOpen(false);
  };

  const openLinkInput = (href: string) => {
    setLinkUrl(href);
    setHasLinkError(false);
    setIsLinkInputOpen(true);
  };
  // Keep the ref pointing at the current opener so the Mod-k shortcut (bound
  // once on the extension) always calls the live setters. Done in an effect so
  // the ref is never written during render.
  useEffect(() => {
    openLinkInputRef.current = openLinkInput;
  });

  // Drives the SelectionHighlight plugin. This is a real effect (not done
  // inline in openLinkInput/the render-time adjustment below) because it
  // dispatches into ProseMirror — a side effect on an external system, which
  // must not happen during React's render phase. A plugin's `decorations()`
  // only reruns as part of a ProseMirror state transition, so mutating
  // storage alone wouldn't repaint anything; dispatching a no-op transaction
  // is the standard way to trigger that recompute on demand. Re-runs if the
  // underlying link changes while the row stays open (moving from one link
  // straight into another without closing it first).
  useEffect(() => {
    if (!editor) return;
    // `Editor.storage`'s type only knows about extensions declared through
    // TipTap's module-augmentation mechanism; a plain cast is simpler here
    // than adding that boilerplate for one small piece of internal state.
    const storage = (
      editor.storage as unknown as {
        selectionHighlight: { range: { from: number; to: number } | null };
      }
    ).selectionHighlight;

    if (!isLinkInputOpen) {
      // TipTap extension storage is mutable-by-design (it isn't React state) —
      // this is the documented way to feed a value into a plugin's decorations.
      // eslint-disable-next-line react-hooks/immutability
      storage.range = null;
      editor.view.dispatch(editor.state.tr);
      return;
    }

    const { from, to } = editor.state.selection;
    // A real selection highlights as-is; a collapsed cursor inside an
    // existing link highlights that link's whole range instead, since
    // there's nothing else to show the host what they're editing.
    // eslint-disable-next-line react-hooks/immutability -- see note above
    storage.range =
      from === to
        ? (getMarkRange(
            editor.state.selection.$from,
            editor.schema.marks.link
          ) ?? null)
        : { from, to };
    editor.view.dispatch(editor.state.tr);
  }, [editor, isLinkInputOpen, toolbarState.linkHref]);

  // Clicking inside an existing link opens the same row, prefilled — mirrors
  // clicking the toolbar button, without requiring it. Adjusted during render
  // (not an effect) since this only needs to react to cursor-position
  // transitions, not synchronize with an external system.
  const [lastSeenLink, setLastSeenLink] = useState<{
    isLink: boolean;
    href: string;
  }>({ isLink: toolbarState.isLink, href: toolbarState.linkHref });
  if (
    toolbarState.isLink !== lastSeenLink.isLink ||
    toolbarState.linkHref !== lastSeenLink.href
  ) {
    setLastSeenLink({
      isLink: toolbarState.isLink,
      href: toolbarState.linkHref,
    });
    if (toolbarState.isLink) {
      openLinkInput(toolbarState.linkHref);
    }
  }

  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return <div className='h-[171px] w-full bg-transparent' />;
  }

  const applyFontStep = (direction: 1 | -1) => {
    const target = nextFontSize(toolbarState.fontSize, direction);
    const chain = editor.chain().focus();
    if (target === DEFAULT_FONT_SIZE) {
      chain.unsetFontSize().run();
    } else {
      chain.setFontSize(`${target}px`).run();
    }
  };

  const currentAlignOption =
    ALIGN_OPTIONS.find(option => option.value === toolbarState.align) ??
    ALIGN_OPTIONS[0];
  const CurrentAlignIcon = currentAlignOption.Icon;

  // Single button cycles through the alignments (left → center → right → left),
  // Instagram-style, instead of opening a menu. The icon reflects the current
  // alignment so the button stays self-describing.
  const toggleBlockquote = () => {
    if (toolbarState.isBlockquote) {
      editor.chain().focus().toggleBlockquote().run();
      return;
    }
    // Single chain keeps toggle-on as one undo step. setItalic applies to the
    // selection if text is selected, or stores a pending mark for cursor-only.
    editor
      .chain()
      .focus()
      .toggleBlockquote()
      .setTextAlign('center')
      .setItalic()
      .run();
  };

  const cycleAlign = () => {
    const index = ALIGN_OPTIONS.findIndex(
      option => option.value === toolbarState.align
    );
    if (index === -1) return;
    const next = ALIGN_OPTIONS[(index + 1) % ALIGN_OPTIONS.length];
    editor.chain().focus().setTextAlign(next.value).run();
  };

  // Same check `/external` uses as its defensive backstop — this is the
  // actual gate: an unsupported link (tel:, javascript:, an empty string,
  // a domain-shaped-but-fake string, ...) never gets saved in the first
  // place. Shared by the explicit "set" action and the auto-commit-on-blur
  // behaviour below, so both agree on what counts as valid.
  const getNormalizedLinkUrlIfValid = (): string | null => {
    const normalized = normalizeLinkHref(linkUrl);
    return linkUrl.trim() && isValidExternalHref(normalized)
      ? normalized
      : null;
  };

  const applyLink = () => {
    const normalized = getNormalizedLinkUrlIfValid();
    if (!normalized) {
      setHasLinkError(true);
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: normalized })
      .run();
    setLastSeenLink({ isLink: true, href: normalized });
    closeLinkInput();
  };

  // Committing shouldn't require the explicit "set" click: once the URL is
  // valid, moving on — clicking elsewhere in the editor, clicking outside it
  // entirely, or tabbing away — should save it and close the row on its own.
  // An invalid/empty URL is discarded quietly instead (no error nagging the
  // host just for clicking away). The row's own buttons are unaffected: they
  // use onMouseDown+preventDefault (see ToolbarButton) specifically so
  // clicking them never blurs this input in the first place.
  const handleLinkInputBlur = () => {
    if (suppressNextLinkBlurRef.current) {
      suppressNextLinkBlurRef.current = false;
      return;
    }
    if (getNormalizedLinkUrlIfValid()) {
      applyLink();
    } else {
      closeLinkInput();
    }
    // This blur already happened, so closeLinkInput's suppression flag has no
    // follow-on blur to consume it. Do not leak it into the next edit session.
    suppressNextLinkBlurRef.current = false;
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    closeLinkInput();
  };

  const openLinkInNewTab = () => {
    if (!toolbarState.linkHref) return;
    if (!openInNewTab(toolbarState.linkHref)) {
      showPopupBlockedToast(toolbarState.linkHref);
    }
  };

  return (
    <div
      className={cn(
        'border border-input rounded-md bg-base/20 dark:bg-white/10 backdrop-blur-sm',
        className
      )}
    >
      <div className='border-b border-input p-1 flex items-center gap-0.5 flex-wrap bg-base/60 dark:bg-white/10'>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={toolbarState.isBold}
          title='Bold (Ctrl+B)'
        >
          <Bold className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={toolbarState.isItalic}
          title='Italic (Ctrl+I)'
        >
          <Italic className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={toolbarState.isUnderline}
          title='Underline (Ctrl+U)'
        >
          <UnderlineIcon className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={toolbarState.isStrike}
          title='Strikethrough'
        >
          <Strikethrough className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            isLinkInputOpen
              ? closeLinkInput()
              : openLinkInput(toolbarState.linkHref)
          }
          isActive={isLinkInputOpen || toolbarState.isLink}
          title={tLink('linkEditor.toolbarButton')}
        >
          <LinkIcon className='h-4 w-4' />
        </ToolbarButton>

        <div className='w-px h-6 bg-border mx-1' />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={toolbarState.isBulletList}
          title='Bullet List'
        >
          <List className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={toolbarState.isOrderedList}
          title='Numbered List'
        >
          <ListOrdered className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleBlockquote}
          isActive={toolbarState.isBlockquote}
          title='Quote'
        >
          <Quote className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title='Horizontal Line'
        >
          <Minus className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={cycleAlign}
          isActive={toolbarState.align !== 'left'}
          title={`Align: ${currentAlignOption.label} (click to cycle)`}
        >
          <CurrentAlignIcon className='h-4 w-4' />
        </ToolbarButton>

        <div className='w-px h-6 bg-border mx-1' />

        <ToolbarButton
          onClick={() => applyFontStep(1)}
          disabled={toolbarState.fontSize >= MAX_FONT_SIZE}
          title='Increase font size'
        >
          <AArrowUp className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => applyFontStep(-1)}
          disabled={toolbarState.fontSize <= MIN_FONT_SIZE}
          title='Decrease font size'
        >
          <AArrowDown className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={toolbarState.isSuperscript}
          title='Superscript'
        >
          <SuperscriptIcon className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={toolbarState.isSubscript}
          title='Subscript'
        >
          <SubscriptIcon className='h-4 w-4' />
        </ToolbarButton>

        <div className='w-px h-6 bg-border mx-1' />

        <ToolbarButton
          onClick={() =>
            isVideoInputOpen ? closeVideoInput() : setIsVideoInputOpen(true)
          }
          isActive={isVideoInputOpen}
          title={t('toolbarButton')}
        >
          <Video className='h-4 w-4' />
        </ToolbarButton>

        {extraToolbarActions && (
          <div className='ml-auto flex items-center gap-1'>
            {extraToolbarActions}
          </div>
        )}
      </div>

      {isVideoInputOpen && (
        <div className='flex flex-col gap-1 border-b border-input bg-muted/10 p-2'>
          <div className='flex items-center gap-2'>
            <input
              type='url'
              autoFocus
              value={videoUrl}
              onChange={event => {
                setVideoUrl(event.target.value);
                setHasVideoError(false);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  insertVideo();
                } else if (event.key === 'Escape') {
                  closeVideoInput();
                }
              }}
              placeholder={t('urlPlaceholder')}
              aria-label={t('urlLabel')}
              aria-invalid={hasVideoError}
              aria-describedby={hasVideoError ? videoErrorId : undefined}
              className={cn(
                'flex-1 rounded-md border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                hasVideoError ? 'border-destructive' : 'border-input'
              )}
            />
            <button
              type='button'
              onMouseDown={event => {
                event.preventDefault();
                insertVideo();
              }}
              className='inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            >
              {t('add')}
            </button>
          </div>
          {hasVideoError && (
            <span id={videoErrorId} className='text-xs text-destructive'>
              {t('invalidUrl')}
            </span>
          )}
        </div>
      )}

      {isLinkInputOpen && (
        <div className='flex flex-col gap-1 border-b border-input bg-muted/10 p-2'>
          <div className='flex items-center gap-2'>
            <input
              type='url'
              autoFocus
              value={linkUrl}
              onChange={event => {
                setLinkUrl(event.target.value);
                setHasLinkError(false);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyLink();
                } else if (event.key === 'Escape') {
                  closeLinkInput();
                }
              }}
              onBlur={handleLinkInputBlur}
              placeholder={tLink('linkEditor.urlPlaceholder')}
              aria-label={tLink('linkEditor.urlLabel')}
              aria-invalid={hasLinkError}
              aria-describedby={hasLinkError ? linkErrorId : undefined}
              className={cn(
                'flex-1 rounded-md border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                hasLinkError ? 'border-destructive' : 'border-input'
              )}
            />
            <ToolbarButton
              onClick={applyLink}
              title={tLink('linkEditor.setLink')}
            >
              <Check className='h-4 w-4' />
            </ToolbarButton>
            <ToolbarButton
              onClick={removeLink}
              disabled={!toolbarState.isLink}
              title={tLink('linkEditor.unlink')}
            >
              <Unlink className='h-4 w-4' />
            </ToolbarButton>
            <ToolbarButton
              onClick={openLinkInNewTab}
              disabled={!toolbarState.linkHref}
              title={tLink('linkEditor.openInNewTab')}
            >
              <ExternalLink className='h-4 w-4' />
            </ToolbarButton>
          </div>
          {hasLinkError && (
            <span id={linkErrorId} className='text-xs text-destructive'>
              {tLink('linkEditor.invalidUrl')}
            </span>
          )}
        </div>
      )}

      <EditorContent
        editor={editor}
        // Capture-phase guard: a stored link is a real `<a href target="_blank">`
        // in the contenteditable DOM, and the browser would navigate it on
        // click. Cancelling the default here (before ProseMirror / the anchor's
        // own default) stops navigation for every click path, while letting the
        // event continue so ProseMirror still selects the link and opens the
        // input row. Links are followed only via the row's open-in-new-tab
        // button.
        onClickCapture={event => {
          const target = event.target;
          if (target instanceof Element && target.closest('a')) {
            event.preventDefault();
          }
        }}
        className='
          rich-quote
          rich-links
          [&_.ProseMirror]:bg-transparent
          [&_.ProseMirror]:text-foreground
          [&_.ProseMirror]:border-0
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:min-h-[120px]
          [&_.ProseMirror_p]:text-foreground
          [&_.ProseMirror_p]:my-3
          [&_.ProseMirror_p:first-child]:mt-0
          [&_.ProseMirror_p:last-child]:mb-0
          [&_.ProseMirror_strong]:font-semibold
          [&_.ProseMirror_em]:italic
          [&_.ProseMirror_u]:underline
          [&_.ProseMirror_s]:line-through
          [&_.ProseMirror_ul]:my-3
          [&_.ProseMirror_ul]:pl-6
          [&_.ProseMirror_ul]:list-disc
          [&_.ProseMirror_ol]:my-3
          [&_.ProseMirror_ol]:pl-6
          [&_.ProseMirror_ol]:list-decimal
          [&_.ProseMirror_li]:my-1
          [&_.ProseMirror_hr]:border-t
          [&_.ProseMirror_hr]:border-t-section-divider
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
        '
      />
    </div>
  );
}
