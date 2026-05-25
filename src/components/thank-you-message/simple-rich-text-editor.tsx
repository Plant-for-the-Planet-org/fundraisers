'use client';

import type { ReactNode } from 'react';

import { useEffect } from 'react';
import { Bold, Italic, Underline as UnderlineIcon } from 'lucide-react';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils/cn';

interface SimpleRichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: ReactNode;
  title: string;
}

const INACTIVE_STATE = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
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

export function SimpleRichTextEditor({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Write your message...',
  className,
}: SimpleRichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        code: false,
        codeBlock: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
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
        class:
          'min-h-[80px] p-3 text-sm text-foreground leading-[1.625] focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  const activeState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) return INACTIVE_STATE;
      return {
        isBold: currentEditor.isActive('bold'),
        isItalic: currentEditor.isActive('italic'),
        isUnderline: currentEditor.isActive('underline'),
      };
    },
  });
  const toolbarState = activeState ?? INACTIVE_STATE;

  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return <div className='h-[120px] w-full bg-transparent' />;
  }

  return (
    <div
      className={cn(
        'border border-input rounded-md bg-card/5 backdrop-blur-sm',
        className
      )}
    >
      <div className='border-b border-input p-2 flex items-center gap-1 bg-muted/10'>
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
      </div>

      <EditorContent
        editor={editor}
        className='
          [&_.ProseMirror]:bg-transparent
          [&_.ProseMirror]:text-foreground
          [&_.ProseMirror]:border-0
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:min-h-[80px]
          [&_.ProseMirror_p]:text-foreground
          [&_.ProseMirror_p]:my-2
          [&_.ProseMirror_p:first-child]:mt-0
          [&_.ProseMirror_p:last-child]:mb-0
          [&_.ProseMirror_strong]:font-semibold
          [&_.ProseMirror_em]:italic
          [&_.ProseMirror_u]:underline
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
