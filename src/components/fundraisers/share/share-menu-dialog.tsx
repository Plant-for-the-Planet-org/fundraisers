'use client';

import type { LucideIcon } from 'lucide-react';
import type { ShareData } from '@/lib/share/build-share-data';

import { useTranslations } from 'next-intl';
import { Instagram, Linkedin, MessageCircle, QrCode } from 'lucide-react';
import { SHARE_TARGETS } from '@/lib/share/targets';
import { CopyLinkButton } from '@/components/fundraisers/copy-link-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ShareMenuDialogProps {
  data: ShareData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AppKey = 'whatsapp' | 'instagram' | 'linkedin' | 'qrCode';

interface PlaceholderApp {
  id: string;
  labelKey: AppKey;
  Icon: LucideIcon;
  /** Ring background — a solid brand color or a gradient (Instagram). */
  ring: string;
  /** Glyph color. */
  fg: string;
}

/**
 * Visual app row. Each slot is wired to a real {@link SHARE_TARGETS} entry when
 * one exists (matched by `id`) — WhatsApp is live; the rest stay inert dummies
 * with placeholder glyphs until their platform branches land. QR generation is
 * a separate follow-up.
 */
const PLACEHOLDER_APPS: PlaceholderApp[] = [
  {
    id: 'whatsapp',
    labelKey: 'whatsapp',
    Icon: MessageCircle,
    ring: '#25D366',
    fg: '#25D366',
  },
  {
    id: 'instagram',
    labelKey: 'instagram',
    Icon: Instagram,
    ring: 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)',
    fg: '#d62976',
  },
  {
    id: 'linkedin',
    labelKey: 'linkedin',
    Icon: Linkedin,
    ring: '#0A66C2',
    fg: '#0A66C2',
  },
  {
    id: 'qrCode',
    labelKey: 'qrCode',
    Icon: QrCode,
    ring: 'hsl(var(--border))',
    fg: 'hsl(var(--foreground))',
  },
];

/**
 * Fallback share surface, shown when native Web Share is unavailable.
 *
 * Centered "Share via" card: a row of round app icons (placeholders for now)
 * above the fundraiser link + Copy link.
 */
export function ShareMenuDialog({
  data,
  open,
  onOpenChange,
}: ShareMenuDialogProps) {
  const t = useTranslations('Fundraisers.share');
  const tApps = useTranslations('Fundraisers.share.apps');

  const targetById = new Map(SHARE_TARGETS.map(target => [target.id, target]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle className='text-center'>{t('via')}</DialogTitle>
          <DialogDescription className='sr-only'>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className='flex items-center justify-center gap-4'>
          {PLACEHOLDER_APPS.map(app => {
            const target = targetById.get(app.id);
            // Real brand glyph for wired slots; lucide dummy otherwise.
            const Icon = target?.icon ?? app.Icon;
            return (
              <button
                key={app.id}
                type='button'
                aria-label={tApps(app.labelKey)}
                onClick={() => {
                  // Inert until the slot's platform branch lands a target.
                  if (!target) return;
                  void target.run(data);
                  onOpenChange(false);
                }}
                className='rounded-full p-[2px] transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'
                style={{ background: app.ring }}
              >
                {/* Color on the span; both lucide and brand glyphs use currentColor. */}
                <span
                  className='flex size-11 items-center justify-center rounded-full bg-background'
                  style={{ color: app.fg }}
                >
                  <Icon className='size-5' />
                </span>
              </button>
            );
          })}
        </div>

        <div className='flex items-center gap-2'>
          <Input
            readOnly
            value={data.url}
            aria-label={t('linkLabel')}
            className='flex-1'
          />
          <CopyLinkButton url={data.url} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
