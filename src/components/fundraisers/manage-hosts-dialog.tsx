'use client';

import type { DragEndEvent } from '@dnd-kit/core';
import type {
  FundraiserHost,
  FundraiserHostRole,
  FundraiserHostStatus,
} from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  addFundraiserHost,
  removeFundraiserHost,
  resendFundraiserHostInvite,
  updateFundraiserHost,
} from '@/lib/api/fundraiser-hosts-service';
import { platformUserMessage } from '@/lib/api/http-error-classifier';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/utils/images';
import { useAuthStore } from '@/stores/auth-store';
import { useHostedFundraisersStore } from '@/stores/hosted-fundraisers-store';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FallbackAvatar } from '@/components/ui/fallback-avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ManageHostsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundraiserId: string;
  hosts: FundraiserHost[];
  onHostsChange: (hosts: FundraiserHost[]) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function countActiveAdmins(hosts: FundraiserHost[]): number {
  return hosts.filter(h => h.status === 'active' && h.role === 'admin').length;
}

function countPublicHosts(hosts: FundraiserHost[]): number {
  // Match the backend's last-public guard (countActivePublicHosts): an invited
  // host is not publicly displayable, so it does not count toward the guarantee.
  return hosts.filter(h => h.isPublic && h.status === 'active').length;
}

/**
 * The host's standing, when it is anything other than a plain active host.
 *
 * Colour carries the same meaning as the platform's own backend table: amber is waiting on an
 * answer, red is a no, grey is a deadline that ran out.
 */
function StatusBadge({
  status,
  label,
}: {
  status: FundraiserHostStatus;
  label: string | null;
}) {
  if (!label || status === 'active') return null;

  const tone = {
    invited:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    declined: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    expired:
      'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground',
  }[status];

  return (
    <span
      className={cn(
        'shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium',
        tone
      )}
    >
      {label}
    </span>
  );
}

/** Name comes from the linked profile; invited hosts show their email. */
function hostName(host: FundraiserHost, unknownLabel: string): string {
  return host.user?.name ?? host.invitedEmail ?? unknownLabel;
}

export function ManageHostsDialog({
  open,
  onOpenChange,
  fundraiserId,
  hosts,
  onHostsChange,
}: ManageHostsDialogProps) {
  const t = useTranslations('Fundraisers.form.hosts');
  // `user.sub` is set to the platform profile id, matching `host.user.id`.
  const currentUserId = useAuthStore(state => state.user?.sub);
  const accessToken = useAuthStore(state => state.accessToken);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !accessToken) return;

    const oldIndex = hosts.findIndex(h => h.id === active.id);
    const newIndex = hosts.findIndex(h => h.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = hosts; // snapshot for rollback if persistence fails
    const reordered = arrayMove(hosts, oldIndex, newIndex);
    // Optimistic: stamp each host's new index so local `displayOrder` stays in
    // sync with what we persist. The PATCH diff below still reads the original
    // `reordered` objects (pre-stamp), so only genuinely moved rows are sent.
    onHostsChange(
      reordered.map((host, index) => ({ ...host, displayOrder: index }))
    );

    try {
      await Promise.all(
        reordered.flatMap((host, index) =>
          host.displayOrder === index
            ? []
            : [
                updateFundraiserHost(
                  fundraiserId,
                  host.id,
                  { displayOrder: index },
                  accessToken
                ),
              ]
        )
      );
    } catch (err) {
      console.error('Reordering hosts failed:', err);
      onHostsChange(previous); // revert to the pre-drag order
      toast.error(t('toastReorderError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='border-border sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className='-mr-2 flex max-h-[55vh] flex-col gap-0.5 overflow-y-auto pr-2'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={hosts.map(h => h.id)}
              strategy={verticalListSortingStrategy}
            >
              {hosts.map(host => (
                <HostRow
                  key={host.id}
                  host={host}
                  fundraiserId={fundraiserId}
                  hosts={hosts}
                  isSelf={
                    host.user?.id != null && host.user.id === currentUserId
                  }
                  token={accessToken}
                  onHostsChange={onHostsChange}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <AddHostForm
          fundraiserId={fundraiserId}
          hosts={hosts}
          token={accessToken}
          onHostsChange={onHostsChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function HostRow({
  host,
  fundraiserId,
  hosts,
  isSelf,
  token,
  onHostsChange,
}: {
  host: FundraiserHost;
  fundraiserId: string;
  hosts: FundraiserHost[];
  isSelf: boolean;
  token: string | null;
  onHostsChange: (hosts: FundraiserHost[]) => void;
}) {
  const t = useTranslations('Fundraisers.form.hosts');
  const format = useFormatter();
  const [isSaving, setIsSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: host.id });

  const role = host.role;
  const name = hostName(host, t('unknownHost'));
  const avatarUrl = host.user?.avatar
    ? getImageUrl('profile', 'thumb', host.user.avatar)
    : null;

  // Mirror the backend guardrails so the UI never offers an action the API
  // would reject. The backend remains the source of truth.
  // - last admin: a fundraiser must keep at least one admin.
  // - last public: a fundraiser must keep at least one public host (any role).
  const isLastAdmin = role === 'admin' && countActiveAdmins(hosts) <= 1;
  const isLastPublic = host.isPublic && countPublicHosts(hosts) <= 1;

  // The platform allows a resend from `invited` and `expired` only. A decline is final until the
  // row is removed, and an active host has nothing left to accept.
  const canResend = host.status === 'invited' || host.status === 'expired';
  const statusLabel = {
    active: null,
    invited: t('invited'),
    declined: t('declined'),
    expired: t('expired'),
  }[host.status];
  const inviteDeadline = host.inviteExpiresAt
    ? format.dateTime(new Date(host.inviteExpiresAt), { dateStyle: 'medium' })
    : null;

  const replaceHost = (updated: FundraiserHost) =>
    onHostsChange(hosts.map(h => (h.id === host.id ? updated : h)));

  const handleError = (err: unknown) => {
    console.error('Host update failed:', err);
    // The platform explains its own refusals, and a status code cannot tell them apart: the caps,
    // the draft rule and the resend cooldown all arrive as 409 with the same code, and only the
    // sentence says which one happened.
    toast.error(
      platformUserMessage(err) ??
        (err instanceof PlatformAPIError && err.status === 409
          ? t('toastDuplicate')
          : t('toastError'))
    );
  };

  const handleRoleChange = async (next: FundraiserHostRole) => {
    if (!token || next === role) return;
    setIsSaving(true);
    try {
      replaceHost(
        await updateFundraiserHost(fundraiserId, host.id, { role: next }, token)
      );
      // A role change is always to another host (self-demotion is API-rejected), so it does not change the current user's own access. Reset anyway as cheap insurance in case host rules change.
      useHostedFundraisersStore.getState().reset();
      toast.success(t('toastUpdated'));
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublicChange = async (next: boolean) => {
    if (!token) return;
    setIsSaving(true);
    try {
      replaceHost(
        await updateFundraiserHost(
          fundraiserId,
          host.id,
          { isPublic: next },
          token
        )
      );
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResend = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const updated = await resendFundraiserHostInvite(
        fundraiserId,
        host.id,
        token
      );
      replaceHost(updated);
      toast.success(
        t('toastResent', {
          email: updated.invitedEmail ?? host.invitedEmail ?? '',
        })
      );
    } catch (err) {
      console.error('Resending a host invitation failed:', err);
      toast.error(
        platformUserMessage(err) ??
          (err instanceof PlatformAPIError && err.status === 409
            ? t('toastResendRefused')
            : t('toastError'))
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await removeFundraiserHost(fundraiserId, host.id, token);
      // Removing a host can remove the current user's own admin access.
      useHostedFundraisersStore.getState().reset();
      onHostsChange(hosts.filter(h => h.id !== host.id));
      toast.success(t('toastRemoved'));
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-1.5 py-2 hover:bg-accent',
        isDragging && 'bg-accent opacity-80'
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type='button'
        aria-label={t('reorder')}
        className='cursor-grab text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      <Avatar className='h-7 w-7 shrink-0'>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} loading='lazy' />}
        <FallbackAvatar seed={host.id} />
      </Avatar>

      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='truncate text-sm font-medium text-foreground'>
            {name}
          </span>
          {isSelf && (
            <span className='shrink-0 text-xs text-muted-foreground'>
              {t('you')}
            </span>
          )}
          <StatusBadge status={host.status} label={statusLabel} />
        </div>
        {inviteDeadline && canResend && (
          <span className='truncate text-xs text-muted-foreground'>
            {host.status === 'expired'
              ? t('inviteLapsed', { date: inviteDeadline })
              : t('inviteExpires', { date: inviteDeadline })}
          </span>
        )}
        {host.status === 'declined' && (
          <span className='truncate text-xs text-muted-foreground'>
            {t('resendDeclinedHint')}
          </span>
        )}
      </div>

      <Select
        value={role}
        onValueChange={value => handleRoleChange(value as FundraiserHostRole)}
        disabled={isSaving || isLastAdmin}
      >
        <SelectTrigger className='h-auto w-fit gap-1 border-transparent px-1.5 py-1 text-xs text-muted-foreground shadow-none hover:bg-background'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='admin'>{t('roleAdmin')}</SelectItem>
          <SelectItem value='viewer'>{t('roleViewer')}</SelectItem>
        </SelectContent>
      </Select>

      <button
        type='button'
        disabled={isSaving || isLastPublic}
        aria-label={host.isPublic ? t('visibilityOn') : t('visibilityOff')}
        title={isLastPublic ? t('lastPublicHint') : undefined}
        onClick={() => handlePublicChange(!host.isPublic)}
        className={cn(
          'shrink-0 rounded-md p-1 transition-colors disabled:cursor-not-allowed',
          host.isPublic
            ? 'text-blue-500'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {host.isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>

      {canResend && (
        <button
          type='button'
          disabled={isSaving}
          aria-label={t('resend')}
          title={t('resend')}
          onClick={handleResend}
          className='shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed'
        >
          <Send size={16} />
        </button>
      )}

      <button
        type='button'
        disabled={isSaving || isLastAdmin || isLastPublic}
        aria-label={t('remove')}
        title={
          isLastAdmin
            ? t('lastAdminHint')
            : isLastPublic
              ? t('lastPublicHint')
              : t('remove')
        }
        onClick={handleRemove}
        className='shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 disabled:opacity-0'
      >
        {isSaving ? (
          <Loader2 className='animate-spin' size={16} />
        ) : (
          <Trash2 size={16} />
        )}
      </button>
    </div>
  );
}

function AddHostForm({
  fundraiserId,
  hosts,
  token,
  onHostsChange,
}: {
  fundraiserId: string;
  hosts: FundraiserHost[];
  token: string | null;
  onHostsChange: (hosts: FundraiserHost[]) => void;
}) {
  const t = useTranslations('Fundraisers.form.hosts');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FundraiserHostRole>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailIsValid = EMAIL_PATTERN.test(email.trim());

  const handleAdd = async () => {
    if (!token || !emailIsValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const created = await addFundraiserHost(
        fundraiserId,
        {
          email: email.trim(),
          role,
          // New hosts are public by default so they appear on the fundraiser
          // page right away; togglable per row afterwards.
          isPublic: true,
        },
        token
      );
      onHostsChange([...hosts, created]);
      setEmail('');
      setRole('viewer');
      toast.success(
        created.status === 'invited'
          ? t('toastInvited', { email: created.invitedEmail ?? email.trim() })
          : t('toastAdded')
      );
    } catch (err) {
      console.error('Add host failed:', err);
      // The platform's own sentence first, where it wrote one. Adding a host can be refused for
      // several reasons that all arrive as 409 — the fundraiser is still a draft, it already has 20
      // invitations waiting, this person has hit their daily limit — and telling all of them "this
      // person is already a host" would be wrong for every one of them.
      //
      // A duplicate is the case with no sentence: it is raised as a validation failure (HTTP 400),
      // whose text sits under `parameters.errors` and reads like an assertion rather than something
      // to show somebody. Since the email is already format-checked client-side, it is the only
      // realistic validation failure on add.
      const isDuplicate =
        err instanceof PlatformAPIError &&
        (err.status === 400 || err.status === 409);
      toast.error(
        platformUserMessage(err) ??
          (isDuplicate ? t('toastDuplicate') : t('toastError'))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex items-center gap-2 border-t border-border pt-4'>
      <Plus size={18} className='shrink-0 text-muted-foreground' />
      <Input
        type='email'
        value={email}
        placeholder={t('emailPlaceholder')}
        className='flex-1'
        onChange={event => setEmail(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') handleAdd();
        }}
      />
      <Select
        value={role}
        onValueChange={value => setRole(value as FundraiserHostRole)}
      >
        <SelectTrigger className='w-28 text-sm'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='admin'>{t('roleAdmin')}</SelectItem>
          <SelectItem value='viewer'>{t('roleViewer')}</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type='button'
        disabled={!emailIsValid || isSubmitting}
        onClick={handleAdd}
      >
        {isSubmitting && <Loader2 className='animate-spin' size={16} />}
        {t('addButton')}
      </Button>
    </div>
  );
}
