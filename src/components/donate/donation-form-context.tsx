'use client';

import type { ReactNode, RefObject } from 'react';
import type { Control } from 'react-hook-form';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { AllowedCountry } from '@/lib/utils/country-currency';
import type { DonationData } from './donate-overlay';
import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DONATION_FORM_ERRORS } from '@/lib/types/donation-form-errors';
import { getWorkspaceProfile } from '@/lib/workspaces/registry';

const DevTool =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@hookform/devtools').then(m => m.DevTool), {
        ssr: false,
      })
    : null;

const donationFormFields = z.object({
  firstname: z.string().trim(),
  lastname: z.string().trim(),
  email: z.string().trim(),
  // Address fields — validated conditionally in superRefine based on whether selectedAddressId is present
  address: z.string().trim(),
  address2: z.string().trim().optional(),
  addressType: z.enum(['primary', 'mailing', 'other']).optional(),
  zipCode: z.string().trim(),
  state: z.string().trim().optional(),
  city: z.string().trim(),
  country: z.string().trim(),
  // Preferences
  isAnonymous: z.boolean(),
  selectedAddressId: z.string().optional(),
  makeMonthly: z.boolean(),
  willAbsorbFee: z.boolean(),
  selectedPaymentMethod: z.enum(
    [
      'card',
      'sepa_debit',
      'apple_pay',
      'google_pay',
      'paypal',
      'bank_transfer',
      'planet_cash',
    ],
    { message: DONATION_FORM_ERRORS['paymentMethod.required'] }
  ),
  // When set, the donor picked a saved card/SEPA method — holds its Stripe
  // payment method id (`pm_...`) to reuse as the donation source. The empty
  // string is the canonical "no saved method" sentinel (never undefined), so
  // reads can rely on a plain truthiness check; defaults to '' below.
  selectedSavedMethodId: z.string(),
  isCompany: z.boolean(),
  companyName: z.string().trim().optional(),
  tin: z.string().trim().optional(),
});

export type DonationFormValues = z.infer<typeof donationFormFields>;

function createDonationFormSchema(
  workspaceCountry: AllowedCountry | undefined
) {
  const requiresTin = workspaceCountry
    ? getWorkspaceProfile(workspaceCountry).requiresTin
    : false;

  return donationFormFields.superRefine((values, ctx) => {
    const hasAddressId =
      !!values.selectedAddressId?.trim() && values.selectedAddressId !== 'new';

    // When no addressId is provided (guest user), require personal + address fields
    if (!hasAddressId) {
      if (!values.firstname) {
        ctx.addIssue({
          code: 'custom',
          message: DONATION_FORM_ERRORS['firstName.required'],
          path: ['firstname'],
        });
      }
      if (!values.lastname) {
        ctx.addIssue({
          code: 'custom',
          message: DONATION_FORM_ERRORS['lastName.required'],
          path: ['lastname'],
        });
      }
      if (!values.email) {
        ctx.addIssue({
          code: 'custom',
          message: DONATION_FORM_ERRORS['email.required'],
          path: ['email'],
        });
      } else if (!z.email().safeParse(values.email).success) {
        ctx.addIssue({
          code: 'custom',
          message: DONATION_FORM_ERRORS['email.invalid'],
          path: ['email'],
        });
      }
      if (!values.address) {
        ctx.addIssue({
          code: 'custom',
          message: DONATION_FORM_ERRORS['address.required'],
          path: ['address'],
        });
      }
      if (!values.zipCode) {
        ctx.addIssue({
          code: 'custom',
          message: DONATION_FORM_ERRORS['zipCode.required'],
          path: ['zipCode'],
        });
      }
      if (!values.city) {
        ctx.addIssue({
          code: 'custom',
          message: DONATION_FORM_ERRORS['city.required'],
          path: ['city'],
        });
      }
      if (!values.country) {
        ctx.addIssue({
          code: 'custom',
          message: DONATION_FORM_ERRORS['country.required'],
          path: ['country'],
        });
      }
    }

    if (values.isCompany && !values.companyName?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: DONATION_FORM_ERRORS['companyName.required'],
        path: ['companyName'],
      });
    }

    if (requiresTin && !values.tin?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: DONATION_FORM_ERRORS['tin.required'],
        path: ['tin'],
      });
    }
  });
}

interface DonationFormContextValue {
  fundraiser: Fundraiser;
  donationData: DonationData;
  paymentOptions: PaymentOptions;
  /**
   * `true` once `paymentOptions` reflects the user's auth state — see
   * `usePaymentOptions`. Components that key off auth-protected fields
   * (e.g. `lastPaymentMethod`) should defer reads until this is `true`.
   */
  paymentOptionsReady: boolean;
  onSubmit: (values: DonationFormValues) => void;
  sepaFormRef: RefObject<StripeSepaFormHandle | null>;
  cardFormRef: RefObject<StripeCardFormHandle | null>;
}

const DonationFormContext = createContext<DonationFormContextValue | null>(
  null
);

interface DonationFormProviderProps {
  fundraiser: Fundraiser;
  donationData: DonationData;
  paymentOptions: PaymentOptions;
  paymentOptionsReady: boolean;
  onSubmit: (values: DonationFormValues) => void;
  sepaFormRef: RefObject<StripeSepaFormHandle | null>;
  cardFormRef: RefObject<StripeCardFormHandle | null>;
  isOpen: boolean;
  children: ReactNode;
}

/**
 * Owns the single RHF `useForm` instance for the donate overlay and makes static overlay data (fundraiser, donationData, paymentOptions) available to all children without prop drilling.
 *
 * Resets the form automatically when `isOpen` becomes false.
 */
export function DonationFormProvider({
  fundraiser,
  donationData,
  paymentOptions,
  paymentOptionsReady,
  onSubmit,
  sepaFormRef,
  cardFormRef,
  isOpen,
  children,
}: DonationFormProviderProps) {
  const schema = useMemo(
    () => createDonationFormSchema(fundraiser.workspace?.country),
    [fundraiser.workspace?.country]
  );

  const methods = useForm<DonationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstname: '',
      lastname: '',
      companyName: '',
      email: '',
      address: '',
      address2: '',
      selectedAddressId: '',
      zipCode: '',
      city: '',
      state: '',
      country: '',
      isAnonymous: false,
      isCompany: false,
      tin: '',
      makeMonthly: false,
      willAbsorbFee: false,
      addressType: 'primary',
      selectedSavedMethodId: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Registers fields that are controlled programmatically so they appear in RHF DevTools.
  // No cleanup: plain `unregister` removes field values, causing RHF to recompute `isValid` — required fields fail Zod and the wallet button becomes disabled (visible immediately in React StrictMode).
  // Use `unregister(name, { keepValue: true })` if cleanup is ever added.
  useEffect(() => {
    methods.register('country');
    methods.register('selectedPaymentMethod');
    methods.register('selectedSavedMethodId');
    methods.register('willAbsorbFee');
    methods.register('makeMonthly');
  }, [methods]);

  useEffect(() => {
    if (!isOpen) methods.reset();
  }, [isOpen, methods]);

  return (
    <DonationFormContext.Provider
      value={{
        fundraiser,
        donationData,
        paymentOptions,
        paymentOptionsReady,
        onSubmit,
        sepaFormRef,
        cardFormRef,
      }}
    >
      <FormProvider {...methods}>
        {children}
        {DevTool !== null && (
          <DevTool control={methods.control as unknown as Control} />
        )}
      </FormProvider>
    </DonationFormContext.Provider>
  );
}

/**
 * Returns static overlay data: `fundraiser`, `donationData`, `paymentOptions`,
 * and the `onSubmit` handler.
 *
 * Use this hook for anything that is **not** form state.
 * For form state use `useFormContext<DonationFormValues>()` from react-hook-form.
 *
 * ---
 *
 * ### Choosing between `register`, `useController`, and `control`
 *
 * **`register`** — native HTML inputs (text, email, checkbox).
 * RHF reads the value directly from the DOM on change/blur.
 * @example
 * const { register } = useFormContext<DonationFormValues>();
 * <input type="text" {...register('firstname')} />
 * <input type="checkbox" {...register('isAnonymous')} />
 *
 * **`useController`** — custom or non-native inputs (dropdowns, toggles,
 * Stripe Elements) that cannot be wired with `register` because they don't
 * expose a native `onChange`/`ref`. Prefer this over `setValue` — it
 * registers the field on mount so the RHF DevTool sees it immediately, and
 * `field.onChange` updates the value atomically.
 * @example
 * const { field } = useController<DonationFormValues, 'country'>({ name: 'country' });
 * <CountryDropdown value={field.value} onChange={field.onChange} />
 *
 * // Partial update (e.g. keeping other nested fields intact):
 * field.onChange({ ...field.value, someKey: newValue });
 *
 * **`control`** — the `control` object from `useFormContext` is passed to
 * `useController` (or RHF's `<Controller>`) when calling them outside of a
 * component that already has `useFormContext` in scope. In practice you
 * rarely need to pass it explicitly — `useController` reads it from context
 * automatically when used inside `FormProvider`.
 * @example
 * // Only needed when useController is called outside FormProvider scope:
 * const { control } = useFormContext<DonationFormValues>();
 * const { field } = useController({ name: 'country', control });
 *
 * ---
 *
 * @example
 * // Trigger submission (typically in DonateCTA)
 * const { onSubmit } = useDonationForm();
 * const { handleSubmit } = useFormContext<DonationFormValues>();
 * <Button onClick={handleSubmit(onSubmit)}>Donate</Button>
 */
export function useDonationForm() {
  const ctx = useContext(DonationFormContext);
  if (!ctx) {
    throw new Error('useDonationForm must be used within DonationFormProvider');
  }
  return ctx;
}
