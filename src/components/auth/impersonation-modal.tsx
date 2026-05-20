'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { userService } from '@/lib/api/user-service';
import { useAuthStore } from '@/stores/auth-store';
import { useImpersonationStore } from '@/stores/impersonation-store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImpersonationModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImpersonationModal({ open, onClose }: ImpersonationModalProps) {
  const t = useTranslations('Auth');
  const start = useImpersonationStore(state => state.start);
  const accessToken = useAuthStore(state => state.accessToken);

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next && !isSubmitting) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Enter a valid email');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('Pin must be 4 digits');
      return;
    }
    if (!accessToken) {
      setError('You are not signed in');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await userService.validateImpersonation(
        accessToken,
        trimmedEmail,
        pin
      );

      if (profile.email?.toLowerCase() !== trimmedEmail.toLowerCase()) {
        setError(
          'Profile email did not match. Check the email and pin and try again.'
        );
        setIsSubmitting(false);
        return;
      }

      start(trimmedEmail, pin);
      onClose();
      window.location.reload();
    } catch (err) {
      if (err instanceof PlatformAPIError) {
        if (err.status === 401 || err.status === 403) {
          setError('Invalid email or support pin');
        } else if (err.status === 404) {
          setError('No user found with that email');
        } else {
          setError(err.message || 'Validation failed');
        }
      } else {
        setError('Validation failed. Try again.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('impersonation.title')}</DialogTitle>
          <DialogDescription>
            Sign in as another user for support. Enter their email and support
            pin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='impersonate-email'>User email</Label>
            <Input
              id='impersonate-email'
              type='email'
              autoComplete='off'
              placeholder='user@example.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='impersonate-pin'>Support pin</Label>
            <Input
              id='impersonate-pin'
              type='text'
              inputMode='numeric'
              autoComplete='off'
              maxLength={4}
              placeholder='Support pin'
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              disabled={isSubmitting}
              required
            />
          </div>
          {error && <p className='text-sm text-destructive'>{error}</p>}
          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Validating...' : 'Impersonate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
