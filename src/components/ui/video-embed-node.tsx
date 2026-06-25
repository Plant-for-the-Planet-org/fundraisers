'use client';

import type { NodeViewProps } from '@tiptap/react';
import type { VideoAspect, VideoProvider } from '@/lib/video/parse-video-url';

import { useTranslations } from 'next-intl';
import {
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  X,
} from 'lucide-react';
import { Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { cn } from '@/lib/utils/cn';
import {
  ASPECT_CLASS,
  buildThumbnailUrl,
  isValidVideo,
  normalizeAspect,
  parseVideoUrl,
} from '@/lib/video/parse-video-url';

const PROVIDER_LABELS: Record<VideoProvider, string> = {
  youtube: 'YouTube',
  cloudflare: 'Cloudflare Stream',
};

const ASPECT_OPTIONS: {
  value: VideoAspect;
  labelKey: 'aspectLandscape' | 'aspectPortrait' | 'aspectSquare';
  Icon: typeof Square;
}[] = [
  { value: '16:9', labelKey: 'aspectLandscape', Icon: RectangleHorizontal },
  { value: '9:16', labelKey: 'aspectPortrait', Icon: RectangleVertical },
  { value: '1:1', labelKey: 'aspectSquare', Icon: Square },
];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoEmbed: {
      setVideoEmbed: (attrs: {
        provider: VideoProvider;
        videoId: string;
        aspect?: VideoAspect;
      }) => ReturnType;
    };
  }
}

/**
 * Authoring-side preview block shown inside the editor. Renders a thumbnail +
 * provider badge so the creator sees what they embedded; the real player is
 * built later at display time by `VideoEmbed`.
 */
function VideoEmbedNodeView({
  node,
  deleteNode,
  updateAttributes,
}: NodeViewProps) {
  const t = useTranslations('Common.videoEmbed.editor');
  const provider = node.attrs.provider as string;
  const videoId = node.attrs.videoId as string;
  const aspectRatio = normalizeAspect(node.attrs.aspect as string);
  const valid = isValidVideo(provider, videoId);

  return (
    <NodeViewWrapper className='my-3' data-drag-handle contentEditable={false}>
      <div
        className={cn(
          'group relative w-full overflow-hidden rounded-xl border border-border bg-muted',
          ASPECT_CLASS[aspectRatio],
          aspectRatio !== '16:9' && 'mx-auto max-w-[360px]',
          'select-none'
        )}
      >
        {valid && (
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{
              backgroundImage: `url("${buildThumbnailUrl(
                provider as VideoProvider,
                videoId
              )}")`,
            }}
          />
        )}
        <div className='absolute inset-0 bg-black/30' />

        <div className='absolute inset-0 flex items-center justify-center'>
          <span className='flex h-14 w-14 items-center justify-center rounded-full bg-black/60'>
            <Play className='h-6 w-6 text-white' aria-hidden='true' />
          </span>
        </div>

        {valid && (
          <span className='absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white'>
            {PROVIDER_LABELS[provider as VideoProvider]}
          </span>
        )}

        {/* Aspect-ratio switcher — manual, because YouTube never exposes the
            true source aspect (only Shorts are reliably vertical). */}
        <div className='absolute bottom-2 right-2 flex items-center gap-0.5 rounded-md bg-black/60 p-0.5'>
          {ASPECT_OPTIONS.map(({ value, labelKey, Icon }) => (
            <button
              key={value}
              type='button'
              onClick={() => updateAttributes({ aspect: value })}
              title={t(labelKey)}
              aria-label={t(labelKey)}
              aria-pressed={aspectRatio === value}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded text-white transition-colors',
                aspectRatio === value ? 'bg-white/30' : 'hover:bg-white/20'
              )}
            >
              <Icon className='h-3.5 w-3.5' aria-hidden='true' />
            </button>
          ))}
        </div>

        <button
          type='button'
          onClick={() => deleteNode()}
          title={t('removeVideo')}
          aria-label={t('removeVideo')}
          className='absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100'
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

/**
 * TipTap node for embedded videos.
 *
 * - Serializes to an inert `<video-embed data-video-provider data-video-id>`
 *   marker (never an iframe), which both sanitizers allow.
 * - Auto-converts a pasted YouTube/Cloudflare URL into the node.
 */
export const VideoEmbedNode = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      provider: {
        default: null,
        parseHTML: element => element.getAttribute('data-video-provider'),
        renderHTML: attributes =>
          attributes.provider
            ? { 'data-video-provider': attributes.provider }
            : {},
      },
      videoId: {
        default: null,
        parseHTML: element => element.getAttribute('data-video-id'),
        renderHTML: attributes =>
          attributes.videoId ? { 'data-video-id': attributes.videoId } : {},
      },
      aspect: {
        default: '16:9',
        parseHTML: element =>
          normalizeAspect(element.getAttribute('data-video-aspect')),
        renderHTML: attributes => ({
          'data-video-aspect': normalizeAspect(attributes.aspect),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'video-embed' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video-embed', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedNodeView);
  },

  addCommands() {
    return {
      setVideoEmbed:
        attrs =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              provider: attrs.provider,
              videoId: attrs.videoId,
              aspect: attrs.aspect ?? '16:9',
            },
          }),
    };
  },

  addProseMirrorPlugins() {
    const type = this.type;
    return [
      new Plugin({
        key: new PluginKey('videoEmbedPaste'),
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain')?.trim();
            if (!text) return false;

            const parsed = parseVideoUrl(text);
            if (!parsed) return false;

            const node = type.create({
              provider: parsed.provider,
              videoId: parsed.id,
              aspect: parsed.aspect,
            });
            view.dispatch(view.state.tr.replaceSelectionWith(node));
            return true;
          },
        },
      }),
    ];
  },
});
