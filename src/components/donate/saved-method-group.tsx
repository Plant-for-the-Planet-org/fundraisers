'use client';

import type { PaymentMethodId } from '@/lib/types/payment-methods';
import type { SavedMethodViewModel } from '@/components/donate/saved-method-view-model';
import type { VisibleMethodOption } from '@/components/donate/use-payment-method-options';

import { useTranslations } from 'next-intl';
import { TriangleAlert } from 'lucide-react';
import {
  MethodFeeDetails,
  RadioDot,
} from '@/components/donate/payment-method-option';
import { NEW_METHOD_TRANSLATION_KEYS } from '@/components/donate/payment-methods-helpers';
import {
  NewMethodOption,
  SavedPaymentMethodOption,
} from '@/components/donate/saved-payment-method-option';

interface SavedMethodGroupProps {
  /** The generic payment method this group is built around (card / SEPA). */
  method: VisibleMethodOption;
  /** Saved instances of `method`, already filtered and shaped for rendering. */
  savedForMethod: SavedMethodViewModel[];
  /** The currently selected saved-method id; '' when none is active. */
  selectedSavedMethodId: string;
  /** The currently selected generic payment method id. */
  selectedPaymentMethod: PaymentMethodId;
  /** Whether this donation is recurring (drives the expiring-soon hint). */
  isSubscription: boolean;
  /** Whether processing-fee details should be shown. */
  feeCollectionEnabled: boolean;
  /** Called when a saved method row is chosen. */
  onSavedMethodSelect: (savedMethodId: string, typeId: PaymentMethodId) => void;
  /** Called when the "use a new …" row is chosen. */
  onNewMethodSelect: (methodId: PaymentMethodId) => void;
  /** Called when the group header/container is chosen, selecting the preferred saved method. */
  onSavedGroupSelect: (methodId: PaymentMethodId) => void;
}

/**
 * Renders a generic payment method together with its saved instances nested
 * beneath it as a subsection: a non-selectable type header, each saved card /
 * SEPA mandate as a selectable row, and a "use a new …" option.
 */
export function SavedMethodGroup({
  method,
  savedForMethod,
  selectedSavedMethodId,
  selectedPaymentMethod,
  isSubscription,
  feeCollectionEnabled,
  onSavedMethodSelect,
  onNewMethodSelect,
  onSavedGroupSelect,
}: SavedMethodGroupProps) {
  const t = useTranslations('Fundraisers.donate.paymentMethods');

  // A generic option is only "selected" when no saved method is active — a
  // saved card and the generic card share the same id.
  const isGenericSelected =
    selectedPaymentMethod === method.id && !selectedSavedMethodId;

  // Clicking the header selects the preferred saved method.
  // If a saved method is already selected, preserve that choice.
  const hasSelectedSavedInGroup = savedForMethod.some(
    s => s.id === selectedSavedMethodId
  );
  const handleHeaderSelect = () => {
    if (hasSelectedSavedInGroup) return;
    onSavedGroupSelect(method.id);
  };

  const HeaderLogo = method.logo;
  const newMethodTranslationKey = NEW_METHOD_TRANSLATION_KEYS[method.id];
  // Only types with a configured "Use a new …" label render the saved-method
  // group at all — savedByType.get(method.id) is only populated for those types
  // via the REUSABLE_TYPES filter in useSavedPaymentMethods. The fallback to
  // the generic method label keeps the option labelled even if a new reusable
  // type is added before its copy lands.
  const newMethodLabel = newMethodTranslationKey
    ? t(newMethodTranslationKey as never)
    : method.label;

  return (
    <div className='rounded-lg border border-border bg-muted/40'>
      {/* Clicking the header selects the type's preferred saved method.
          The saved instances and the "use a new …" row below select a
          specific option; the radio dot mirrors whichever is active. */}
      <div className='flex items-center justify-between gap-3 border-b border-border px-3 py-2.5'>
        <button
          type='button'
          onClick={handleHeaderSelect}
          aria-pressed={selectedPaymentMethod === method.id}
          className='flex flex-1 items-center gap-3 text-left'
        >
          <RadioDot isSelected={selectedPaymentMethod === method.id} />
          {HeaderLogo && (
            <div className='flex h-5 w-12 shrink-0 items-center justify-center'>
              <HeaderLogo textColor='#4d5153' />
            </div>
          )}
          <div className='flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5'>
            <span className='text-sm font-medium'>{method.label}</span>
            {method.lastUsedLabel && (
              <span className='px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full'>
                {method.lastUsedLabel}
              </span>
            )}
          </div>
        </button>
        {feeCollectionEnabled && method.feeText && (
          <MethodFeeDetails
            feeText={method.feeText}
            feeTooltip={method.feeTooltip}
          />
        )}
      </div>
      <div className='space-y-2 p-3'>
        <div className='space-y-2 pl-6'>
          {savedForMethod.map(saved => {
            // Warn right under the card it refers to — but only when
            // it's selected for a recurring donation, where a later
            // charge could fail once the card lapses.
            const showRecurringHint =
              isSubscription &&
              saved.isExpiringSoon &&
              selectedSavedMethodId === saved.id;
            return (
              <div key={saved.id} className='space-y-2'>
                <SavedPaymentMethodOption
                  typeId={saved.typeId}
                  brand={saved.brand}
                  last4={saved.last4}
                  expiryDate={saved.expiryDate}
                  isExpiringSoon={saved.isExpiringSoon}
                  expiringSoonLabel={saved.expiringSoonLabel}
                  ariaLabel={saved.ariaLabel}
                  isSelected={selectedSavedMethodId === saved.id}
                  onSelect={() => onSavedMethodSelect(saved.id, saved.typeId)}
                />
                {showRecurringHint && (
                  <p className='flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-700'>
                    <span className='flex h-5 shrink-0 items-center'>
                      <TriangleAlert
                        className='h-3.5 w-3.5'
                        aria-hidden='true'
                      />
                    </span>
                    <span>{t('saved.expiringSoonRecurringHint')}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <NewMethodOption
          label={newMethodLabel}
          isSelected={isGenericSelected}
          onSelect={() => onNewMethodSelect(method.id)}
        />
      </div>
    </div>
  );
}
