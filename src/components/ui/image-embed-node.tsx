'use client';

import type { NodeViewProps } from '@tiptap/react';

import { useTranslations } from 'next-intl';
import { ImageOff, Trash2 } from 'lucide-react';
import { Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import {
  looksLikeImageUrl,
  normalizeImageSrc,
} from '@/lib/image/parse-image-url';
import { cn } from '@/lib/utils/cn';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageEmbed: {
      setImageEmbed: (attrs: { src: string; alt?: string }) => ReturnType;
    };
  }
}

/**
 * Authoring-side preview shown inside the editor: the real image, a remove
 * button, and an alt-text field. Alt text is editable here rather than in the
 * toolbar row because it belongs to the placed image, and a description shown
 * to every donor should not be a hidden setting.
 */
function ImageEmbedNodeView({
  node,
  deleteNode,
  updateAttributes,
}: NodeViewProps) {
  const t = useTranslations('Common.imageEmbed.editor');
  const alt = (node.attrs.alt as string) ?? '';
  // Render the validated URL, never the stored string — see normalizeImageSrc.
  const safeSrc = normalizeImageSrc(node.attrs.src as string);

  return (
    <NodeViewWrapper className='my-3' data-drag-handle contentEditable={false}>
      <div className='flex flex-col gap-2'>
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-xl border border-border bg-muted',
            'select-none'
          )}
        >
          {safeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={safeSrc}
              alt={alt}
              className='block h-auto w-full'
              draggable={false}
            />
          ) : (
            <div className='flex flex-col items-center justify-center gap-2 px-6 py-10 text-center'>
              <ImageOff
                className='h-5 w-5 text-muted-foreground'
                aria-hidden='true'
              />
              <span className='text-xs text-muted-foreground'>
                {t('invalidUrl')}
              </span>
            </div>
          )}
        </div>

        {/* Controls sit under the image rather than floating over it, so nothing
            covers the picture the host is judging. Remove lives here too — an
            atom node can also be deleted by selecting it and pressing
            Backspace, but that is not discoverable enough to be the only way. */}
        <div className='flex items-center gap-2'>
          <input
            type='text'
            value={alt}
            onChange={event => updateAttributes({ alt: event.target.value })}
            placeholder={t('altPlaceholder')}
            aria-label={t('altLabel')}
            className='flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
          />
          <button
            type='button'
            onClick={() => deleteNode()}
            title={t('removeImage')}
            aria-label={t('removeImage')}
            className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            <Trash2 className='h-3.5 w-3.5' aria-hidden='true' />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * TipTap node for embedded images.
 *
 * - Serializes to an inert `<image-embed data-image-src data-image-alt>` marker
 *   (never an `<img>`), which both sanitizers allow. The `<img>` is built by
 *   `ImageEmbed` at display time from the re-validated src.
 * - Auto-converts a pasted approved-host image URL into the node, using the
 *   stricter `looksLikeImageUrl` (extension required) rather than the toolbar's
 *   `parseImageUrl`, so pasting an ordinary allowed-host page link still behaves
 *   like a link. StarterKit's Link extension declares `priority: 1000` against
 *   this node's default 100, so its `linkOnPaste` runs first and wins whenever
 *   there is a selection — pasting a URL over selected text links that text,
 *   which is what the option is for. With an empty selection Link bails out and
 *   this handler inserts the image. `VideoEmbedNode` behaves the same way.
 */
export const ImageEmbedNode = Node.create({
  name: 'imageEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('data-image-src'),
        renderHTML: attributes =>
          attributes.src ? { 'data-image-src': attributes.src } : {},
      },
      alt: {
        default: '',
        parseHTML: element => element.getAttribute('data-image-alt') ?? '',
        renderHTML: attributes =>
          attributes.alt ? { 'data-image-alt': attributes.alt } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'image-embed' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['image-embed', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageEmbedNodeView);
  },

  addCommands() {
    return {
      setImageEmbed:
        attrs =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src: attrs.src, alt: attrs.alt ?? '' },
          }),
    };
  },

  addProseMirrorPlugins() {
    const type = this.type;
    return [
      new Plugin({
        key: new PluginKey('imageEmbedPaste'),
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain')?.trim();
            if (!text) return false;

            const parsed = looksLikeImageUrl(text);
            if (!parsed) return false;

            const node = type.create({ src: parsed.src, alt: '' });
            view.dispatch(view.state.tr.replaceSelectionWith(node));
            return true;
          },
        },
      }),
    ];
  },
});
