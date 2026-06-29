'use client';

import type { ReactNode } from 'react';

import { useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AArrowDown,
  AArrowUp,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Video,
} from 'lucide-react';
import Placeholder from '@tiptap/extension-placeholder';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils/cn';
import { parseVideoUrl } from '@/lib/video/parse-video-url';
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
const FONT_SIZE_STEPS = [12, 14, 16, 18, 20, 24, 30] as const;
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
        // Keep editor focus on toolbar interactions so selection/active-state is preserved.
        event.preventDefault();
        if (disabled) return;
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
      VideoEmbedNode,
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
  const videoErrorId = useId();
  const [isVideoInputOpen, setIsVideoInputOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [hasVideoError, setHasVideoError] = useState(false);

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
  const cycleAlign = () => {
    const index = Math.max(
      0,
      ALIGN_OPTIONS.findIndex(option => option.value === toolbarState.align)
    );
    const next = ALIGN_OPTIONS[(index + 1) % ALIGN_OPTIONS.length];
    editor.chain().focus().setTextAlign(next.value).run();
  };

  return (
    <div
      className={cn(
        'border border-input rounded-md bg-card/5 backdrop-blur-sm',
        className
      )}
    >
      <div className='border-b border-input p-2 flex items-center gap-1 flex-wrap bg-muted/10'>
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

        <div className='w-px h-6 bg-border mx-1' />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
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

        <div className='w-px h-6 bg-border mx-1' />

        <ToolbarButton
          onClick={() => applyFontStep(-1)}
          disabled={toolbarState.fontSize <= MIN_FONT_SIZE}
          title='Decrease font size'
        >
          <AArrowDown className='h-4 w-4' />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => applyFontStep(1)}
          disabled={toolbarState.fontSize >= MAX_FONT_SIZE}
          title='Increase font size'
        >
          <AArrowUp className='h-4 w-4' />
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

      <EditorContent
        editor={editor}
        className='
          rich-quote
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
          [&_.ProseMirror_blockquote]:text-muted-foreground
          [&_.ProseMirror_hr]:my-6
          [&_.ProseMirror_hr]:border-0
          [&_.ProseMirror_hr]:border-t-2
          [&_.ProseMirror_hr]:border-t-border
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
