'use client';

import type { Control } from 'react-hook-form';
import type { ReactNode } from 'react';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationData } from './donate-overlay';

import { createContext, useContext, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { DONATION_FORM_ERRORS } from '@/lib/types/donation-form-errors';

const DevTool =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@hookform/devtools').then(m => m.DevTool), {
        ssr: false,
      })
    : null;

export const donationFormSchema = z
  .object({
    firstname: z
      .string()
      .trim()
      .min(1, { error: DONATION_FORM_ERRORS['firstName.required'] }),
    lastname: z
      .string()
      .trim()
      .min(1, { error: DONATION_FORM_ERRORS['lastName.required'] }),
    email: z
      .string()
      .trim()
      .min(1, { error: DONATION_FORM_ERRORS['email.required'] })
      .pipe(z.email({ error: DONATION_FORM_ERRORS['email.invalid'] })),
    // Address fields — optional at schema level; DonorInfo adds conditional validation based on auth state
    address: z.string().trim(),
    address2: z.string().trim().optional(),
    addressType: z.enum(['primary', 'mailing', 'other']),
    zipCode: z.string().trim(),
    state: z.string().trim().optional(),
    city: z.string().trim(),
    country: z.string(),
    // Preferences
    isAnonymous: z.boolean(),
    selectedAddressId: z.string().min(1).optional(),
    makeMonthly: z.boolean(),
    coverFees: z.boolean(),
    selectedPaymentMethod: z.string().optional(),
    isCompany: z.boolean(),
    companyName: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.isCompany && !values.companyName?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: DONATION_FORM_ERRORS['companyName.required'],
        path: ['companyName'],
      });
    }
  });

export type DonationFormValues = z.infer<typeof donationFormSchema>;

interface DonationFormContextValue {
  fundraiser: Fundraiser;
  donationData: DonationData;
  paymentOptions: PaymentOptions;
  onSubmit: (values: DonationFormValues) => void;
}

const DonationFormContext = createContext<DonationFormContextValue | null>(
  null
);

interface DonationFormProviderProps {
  fundraiser: Fundraiser;
  donationData: DonationData;
  paymentOptions: PaymentOptions;
  onSubmit: (values: DonationFormValues) => void;
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
  onSubmit,
  isOpen,
  children,
}: DonationFormProviderProps) {
  const methods = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema),
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
      makeMonthly: false,
      coverFees: false,
      selectedPaymentMethod: '',
      addressType: 'primary',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  methods.register('country');
  methods.register('selectedPaymentMethod');

  useEffect(() => {
    if (!isOpen) methods.reset();
  }, [isOpen, methods]);

  return (
    <DonationFormContext.Provider
      value={{ fundraiser, donationData, paymentOptions, onSubmit }}
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
