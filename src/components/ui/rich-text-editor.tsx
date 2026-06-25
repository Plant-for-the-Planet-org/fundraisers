'use client';

import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
  Video,
} from 'lucide-react';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
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
  children: ReactNode;
  title: string;
}

const INACTIVE_EDITOR_STATE = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrike: false,
  isBulletList: false,
  isOrderedList: false,
  isBlockquote: false,
} as const;

function ToolbarButton({
  onClick,
  isActive = false,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type='button'
      onMouseDown={event => {
        // Keep editor focus on toolbar interactions so selection/active-state is preserved.
        event.preventDefault();
        onClick();
      }}
      className={cn(
        'h-8 w-8 rounded-md p-0 inline-flex items-center justify-center transition-colors',
        'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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
          'min-h-[120px] p-3 text-sm text-foreground leading-[1.625] focus:outline-none',
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
        isBulletList: currentEditor.isActive('bulletList'),
        isOrderedList: currentEditor.isActive('orderedList'),
        isBlockquote: currentEditor.isActive('blockquote'),
      };
    },
  });
  const toolbarState = activeState ?? INACTIVE_EDITOR_STATE;

  const [isVideoInputOpen, setIsVideoInputOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [hasVideoError, setHasVideoError] = useState(false);

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
    setVideoUrl('');
    setHasVideoError(false);
    setIsVideoInputOpen(false);
  };

  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return <div className='h-[171px] w-full bg-transparent' />;
  }

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
          onClick={() => setIsVideoInputOpen(open => !open)}
          isActive={isVideoInputOpen}
          title='Embed video (YouTube, Cloudflare Stream)'
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
                  setIsVideoInputOpen(false);
                }
              }}
              placeholder='Paste a YouTube or Cloudflare Stream link'
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
              Add
            </button>
          </div>
          {hasVideoError && (
            <span className='text-xs text-destructive'>
              Enter a valid YouTube or Cloudflare Stream link.
            </span>
          )}
        </div>
      )}

      <EditorContent
        editor={editor}
        className='
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
          [&_.ProseMirror_blockquote]:my-3
          [&_.ProseMirror_blockquote]:py-2
          [&_.ProseMirror_blockquote]:ml-4
          [&_.ProseMirror_blockquote]:pl-4
          [&_.ProseMirror_blockquote]:border-l-4
          [&_.ProseMirror_blockquote]:border-l-border
          [&_.ProseMirror_blockquote]:italic
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
