'use client';

import type { PaymentMethodId } from '@/lib/types/payment-methods';
import type { SavedMethodOption } from '@/components/donate/saved-method-option';
import type { VisibleMethodOption } from '@/components/donate/use-payment-method-options';

import { useId } from 'react';
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
  savedInstancesForMethod: SavedMethodOption[];
  /** The currently selected saved-method id; '' when none is active. */
  selectedSavedMethodId: string;
  /** The currently selected generic payment method id. */
  selectedPaymentMethod: PaymentMethodId;
  /** Whether this donation is recurring (drives the expiring-soon hint). */
  isSubscription: boolean;
  /** Whether processing-fee details should be shown for this donation. */
  showFeeDetails: boolean;
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
  savedInstancesForMethod,
  selectedSavedMethodId,
  selectedPaymentMethod,
  isSubscription,
  showFeeDetails,
  onSavedGroupSelect,
}: SavedMethodGroupProps) {
  const t = useTranslations('Fundraisers.donate.paymentMethods');
  const feeDescriptionId = useId();
  const hasFeeTooltip =
    showFeeDetails && !!method.feeText && !!method.feeTooltip;

  // A generic option is only "selected" when no saved method is active — a
  // saved card and the generic card share the same id.
  const isGenericSelected =
    selectedPaymentMethod === method.id && !selectedSavedMethodId;

  // Clicking the header selects the preferred saved method.
  // If a saved method is already selected, preserve that choice.
  const hasSelectedSavedInGroup = savedInstancesForMethod.some(
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
    ? t(newMethodTranslationKey)
    : method.label;

  return (
    <div className='rounded-lg border border-border bg-muted/40'>
      {/* Clicking the header selects the type's preferred saved method.
          The saved instances and the "use a new …" row below select a
          specific option; the radio dot mirrors whichever is active. */}
      <div className='flex items-center justify-between gap-3 border-b border-border px-3 py-2.5'>
        {/* A pointer shortcut: clicking the type row picks the preferred saved method. Keyboard users reach every row with the arrow keys, so this row is not focusable at all and stays out of the accessibility tree. A button would still take focus when clicked, and aria-hidden on a focusable element is a violation. Each saved row below names its own type, so nothing is lost by hiding this. */}
        <div
          aria-hidden='true'
          onClick={handleHeaderSelect}
          className='flex flex-1 cursor-pointer items-center gap-3'
        >
          <RadioDot isSelected={selectedPaymentMethod === method.id} />
          {HeaderLogo && (
            <div className='flex h-4 w-12 shrink-0 items-center justify-center text-muted-foreground'>
              <HeaderLogo textColor='currentColor' />
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
        </div>
        {showFeeDetails && method.feeText && (
          <MethodFeeDetails
            feeText={method.feeText}
            feeTooltip={method.feeTooltip}
            tooltipFocusable={false}
          />
        )}
        {hasFeeTooltip && (
          <span id={feeDescriptionId} className='sr-only'>
            {method.feeTooltip}
          </span>
        )}
      </div>
      {/* Nesting is visual only. `radiogroup` owns nothing but `radio`, and a `group` in between makes some screen readers count set position within it ("1 of 2" instead of the real place in the list). Each row names its own type, and the fee text is attached to each row below. */}
      <div className='space-y-2 p-3'>
        <div className='space-y-2 pl-6'>
          {savedInstancesForMethod.map(saved => {
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
                  savedMethodId={saved.id}
                  typeId={saved.typeId}
                  brand={saved.brand}
                  last4={saved.last4}
                  expiryDate={saved.expiryDate}
                  isExpiringSoon={saved.isExpiringSoon}
                  expiringSoonLabel={saved.expiringSoonLabel}
                  ariaLabel={saved.ariaLabel}
                  isSelected={selectedSavedMethodId === saved.id}
                  describedById={hasFeeTooltip ? feeDescriptionId : undefined}
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
          methodId={method.id}
          label={newMethodLabel}
          isSelected={isGenericSelected}
          describedById={hasFeeTooltip ? feeDescriptionId : undefined}
        />
      </div>
    </div>
  );
}
