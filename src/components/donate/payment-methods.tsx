'use client';

import type { SetValueConfig } from 'react-hook-form';
import type { PaymentMethodId } from '@/lib/types/payment-methods';
import type { DonationFormValues } from '@/components/donate/donation-form-context';

import { useCallback, useEffect, useRef } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useDonationForm } from '@/components/donate/donation-form-context';
import { PaymentEntryForms } from '@/components/donate/payment-entry-forms';
import { PaymentMethodOption } from '@/components/donate/payment-method-option';
import { PaymentMethodsSkeleton } from '@/components/donate/payment-methods-skeleton';
import { SavedMethodGroup } from '@/components/donate/saved-method-group';
import { useFieldError } from '@/components/donate/use-field-error';
import { usePaymentMethodOptions } from '@/components/donate/use-payment-method-options';

// Programmatic syncs (initial selection, stale-method cleanup) are not user
// edits, so they must not mark the field dirty/touched or trigger validation.
const SILENT_SYNC: SetValueConfig = {
  shouldDirty: false,
  shouldTouch: false,
  shouldValidate: false,
};

export function PaymentMethods() {
  const t = useTranslations('Fundraisers.donate.paymentMethods');
  const translateError = useFieldError();

  const { paymentOptionsReady, cardFormRef, sepaFormRef } = useDonationForm();
  const { control, setValue } = useFormContext<DonationFormValues>();
  const { errors } = useFormState({ control, name: 'selectedPaymentMethod' });
  const paymentMethodError = translateError(
    errors.selectedPaymentMethod?.message
  );
  const selectedPaymentMethod = useWatch({
    control,
    name: 'selectedPaymentMethod',
  });
  const selectedSavedMethodId = useWatch({
    control,
    name: 'selectedSavedMethodId',
  });

  const {
    visibleMethodOptions,
    savedMethodOptions,
    savedByType,
    pickPreferredSaved,
    lastUsedMethodId,
    savedMethodsReady,
    feeCollectionEnabled,
    isSubscription,
  } = usePaymentMethodOptions();

  useEffect(() => {
    if (visibleMethodOptions.length === 0) return;

    // Wait for BOTH the auth-protected payment options and the saved-methods
    // fetch before pre-selecting. Picking the generic "card" first and only
    // swapping to a saved card once that fetch lands makes the full card entry
    // form flash on screen for a frame. Initializing once both are ready sets
    // the method and its saved-method id together in one batched update, so the
    // entry form renders directly in its final state. While not ready, no radio
    // shows selected — the user briefly sees the list with nothing filled in.
    if (!paymentOptionsReady || !savedMethodsReady) return;

    const selectedOption = visibleMethodOptions.find(
      m => m.id === selectedPaymentMethod
    );
    const isSelectedMethodEnabled =
      selectedOption !== undefined && !selectedOption.disabled;

    // A valid method is already selected — leave it (and any saved-method
    // choice the donor has made) alone.
    if (isSelectedMethodEnabled) return;

    const enabledOptions = visibleMethodOptions.filter(m => !m.disabled);
    const candidates =
      enabledOptions.length > 0 ? enabledOptions : visibleMethodOptions;

    const isLastUsedAvailable =
      lastUsedMethodId !== null &&
      candidates.some(m => m.id === lastUsedMethodId);

    const initialMethodId = isLastUsedAvailable
      ? lastUsedMethodId
      : candidates[0].id;

    setValue('selectedPaymentMethod', initialMethodId, SILENT_SYNC);

    // Auto-select the preferred saved method (default or first available)
    // instead of defaulting to "use a new payment method".
    const preferredSaved = pickPreferredSaved(initialMethodId);
    setValue('selectedSavedMethodId', preferredSaved?.id ?? '', SILENT_SYNC);
  }, [
    visibleMethodOptions,
    selectedPaymentMethod,
    setValue,
    lastUsedMethodId,
    paymentOptionsReady,
    pickPreferredSaved,
    savedMethodsReady,
  ]);

  // Keep `selectedSavedMethodId` valid for the current payment method.
  //
  // Clear it when:
  // - the saved method no longer exists after a refetch
  // - its payment type is no longer selected (for example after a currency change)
  //
  // This prevents submitting a stale `pm_...` id for the wrong payment method.
  useEffect(() => {
    if (!selectedSavedMethodId) return;
    if (!savedMethodsReady) return;
    const match = savedMethodOptions.find(s => s.id === selectedSavedMethodId);
    if (!match || match.typeId !== selectedPaymentMethod) {
      setValue('selectedSavedMethodId', '', SILENT_SYNC);
    }
  }, [
    savedMethodOptions,
    savedMethodsReady,
    selectedPaymentMethod,
    selectedSavedMethodId,
    setValue,
  ]);

  const handleMethodSelect = useCallback(
    (methodId: PaymentMethodId) => {
      setValue('selectedPaymentMethod', methodId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      // Entering new details — clear any previously selected saved method.
      setValue('selectedSavedMethodId', '', { shouldDirty: true });
    },
    [setValue]
  );

  const handleSavedMethodSelect = useCallback(
    (savedMethodId: string, typeId: PaymentMethodId) => {
      setValue('selectedPaymentMethod', typeId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue('selectedSavedMethodId', savedMethodId, { shouldDirty: true });
    },
    [setValue]
  );

  // Clicking the payment method group selects the preferred saved method.
  // Expiring cards are skipped. If no valid saved method exists, users can
  // enter new payment details.
  const handleSavedGroupSelect = useCallback(
    (methodId: PaymentMethodId) => {
      const preferred = pickPreferredSaved(methodId);
      if (!preferred) {
        handleMethodSelect(methodId);
        return;
      }
      handleSavedMethodSelect(preferred.id, methodId);
    },
    [pickPreferredSaved, handleMethodSelect, handleSavedMethodSelect]
  );

  // Reference to the form section so we can scroll to it.
  const formSectionRef = useRef<HTMLDivElement>(null);

  // When the user selects a new payment method, show the form, scroll to it,
  // and move focus into its first field.
  const handleNewMethodSelect = useCallback(
    (methodId: PaymentMethodId) => {
      handleMethodSelect(methodId);
      // Wait for React to render the form, then scroll and focus.
      requestAnimationFrame(() => {
        formSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        // Move keyboard focus into the freshly revealed entry form so a
        // keyboard user lands on the first field instead of being stranded on
        // the radio (WCAG 2.4.3). The form's focus() defers until its Stripe
        // element finishes mounting.
        if (methodId === 'card') cardFormRef.current?.focus?.();
        else if (methodId === 'sepa_debit') sepaFormRef.current?.focus?.();
      });
    },
    [handleMethodSelect, cardFormRef, sepaFormRef]
  );

  if (!paymentOptionsReady) return <PaymentMethodsSkeleton />;

  if (visibleMethodOptions.length === 0) {
    return (
      <div className='space-y-3'>
        <div className='space-y-2'>
          <h2 className='text-foreground text-base font-medium'>
            {t('title')}
          </h2>
          <p className='text-muted-foreground text-sm'>{t('description')}</p>
        </div>
        <div className='border border-border rounded-lg p-4 text-sm text-muted-foreground'>
          {t('empty')}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <h2 className='text-foreground font-medium'>{t('title')}</h2>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>

      <div className='border border-border rounded-lg'>
        <div className='space-y-3 p-4'>
          {visibleMethodOptions.map(method => {
            const savedForMethod = savedByType.get(method.id);

            // No saved methods for this type — render the option on its own.
            if (!savedForMethod) {
              // A generic option is only "selected" when no saved method is
              // active — a saved card and the generic card share the same id.
              const isGenericSelected =
                selectedPaymentMethod === method.id && !selectedSavedMethodId;

              return (
                <PaymentMethodOption
                  key={method.id}
                  methodId={method.id}
                  methodLabel={method.label}
                  methodLogo={method.logo}
                  isSelected={isGenericSelected}
                  showFeeDetails={feeCollectionEnabled}
                  methodFeeText={method.feeText}
                  methodFeeTooltip={method.feeTooltip}
                  lastUsedLabel={method.lastUsedLabel}
                  remark={method.remark}
                  disabled={method.disabled}
                  onSelect={handleMethodSelect}
                />
              );
            }

            return (
              <SavedMethodGroup
                key={method.id}
                method={method}
                savedForMethod={savedForMethod}
                selectedSavedMethodId={selectedSavedMethodId}
                selectedPaymentMethod={selectedPaymentMethod}
                isSubscription={isSubscription}
                feeCollectionEnabled={feeCollectionEnabled}
                onSavedMethodSelect={handleSavedMethodSelect}
                onNewMethodSelect={handleNewMethodSelect}
                onSavedGroupSelect={handleSavedGroupSelect}
              />
            );
          })}
        </div>
      </div>

      {paymentMethodError && (
        <p className='text-sm text-destructive'>{paymentMethodError}</p>
      )}

      <div ref={formSectionRef} className='scroll-mt-4'>
        <PaymentEntryForms />
      </div>
    </div>
  );
}
