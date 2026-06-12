import type { RefObject } from 'react';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationData } from './donate-overlay';
import type { DonationFormValues } from './donation-form-context';
import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { useCallback } from 'react';
import { INITIAL_DONATION_STATE } from '@/lib/types/donation-submit';
import { useBankTransferFlow } from './donation-submit/use-bank-transfer-flow';
import { usePayPalFlow } from './donation-submit/use-paypal-flow';
import { usePlanetCashFlow } from './donation-submit/use-planet-cash-flow';
import { useStripeFlow } from './donation-submit/use-stripe-flow';
import { useSubmissionCore } from './donation-submit/use-submission-core';
import { useWalletFlow } from './donation-submit/use-wallet-flow';

/**
 * Encapsulates the full donation submission flow:
 * assembles form data, builds the payload, submits via the appropriate
 * strategy (PlanetCash vs. standard two-step), and classifies the
 * payment response into a UI action.
 *
 * Returns `{ state, onSubmit, reset }`.
 */
export function useDonationSubmit(
  donationData: DonationData,
  fundraiser: Fundraiser,
  paymentOptions: PaymentOptions,
  sepaFormRef: RefObject<StripeSepaFormHandle | null>,
  cardFormRef: RefObject<StripeCardFormHandle | null>,
  onPaymentValidationFailed?: () => void
) {
  const core = useSubmissionCore(donationData, fundraiser, paymentOptions);
  const { donationState, setDonationState, rotateIdempotencyKeys } = core;

  const { onSubmit: onStripeSubmit } = useStripeFlow(core, {
    sepaFormRef,
    cardFormRef,
    onPaymentValidationFailed,
  });
  const { onSubmit: onPlanetCashSubmit } = usePlanetCashFlow(core);
  const { onSubmit: onBankTransferSubmit } = useBankTransferFlow(core);
  const { onPayPalCreateOrder, onPayPalApproved, onPayPalError } =
    usePayPalFlow(core);
  const { onWalletConfirm, onWalletError, onWalletCancel } =
    useWalletFlow(core);

  // Single form submit handler: dispatches by selected method to the prepaid
  // PlanetCash path, the offline bank-transfer path, or the Stripe path
  // (card / SEPA / saved methods).
  const onSubmit = useCallback(
    (values: DonationFormValues) => {
      switch (values.selectedPaymentMethod) {
        case 'planet_cash':
          return onPlanetCashSubmit(values);
        case 'bank_transfer':
          return onBankTransferSubmit(values);
        default:
          return onStripeSubmit(values);
      }
    },
    [onPlanetCashSubmit, onBankTransferSubmit, onStripeSubmit]
  );

  const reset = useCallback(() => {
    setDonationState(INITIAL_DONATION_STATE);
    rotateIdempotencyKeys();
  }, [rotateIdempotencyKeys, setDonationState]);

  return {
    donationState,
    onSubmit,
    onPayPalCreateOrder,
    onPayPalApproved,
    onPayPalError,
    onWalletConfirm,
    onWalletError,
    onWalletCancel,
    reset,
  };
}
