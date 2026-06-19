'use client';

import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildTheme } from '@/lib/theme/build-theme';
import { useThemeStore } from '@/stores/theme-store';
import { EditProjectDetailsProvider } from './bundle-selection/edit-project-details-context';
import {
  fundraiserFormSchema,
  fundraiserToFormValues,
} from './fundraiser-form-schema';

const DevTool =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@hookform/devtools').then(m => m.DevTool), {
        ssr: false,
      })
    : null;

interface EditFundraiserFormProviderProps {
  fundraiser: Fundraiser;
  children: ReactNode;
}

export function EditFundraiserFormProvider({
  fundraiser,
  children,
}: EditFundraiserFormProviderProps) {
  const defaultValues = useMemo(
    () => fundraiserToFormValues(fundraiser),
    [fundraiser]
  );

  const methods = useForm<FundraiserFormValues>({
    resolver: zodResolver(fundraiserFormSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    methods.register('image');
    methods.register('currency');
    methods.register('projectAllocations');
  }, [methods]);

  const setSelectedTheme = useThemeStore(state => state.setSelectedTheme);
  useEffect(() => {
    setSelectedTheme(buildTheme(fundraiser.settings?.theme ?? null));
  }, [fundraiser.settings?.theme, setSelectedTheme]);

  const isDirty = methods.formState.isDirty;

  // Warn the user before leaving the page if the form has unsaved changes.
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <FormProvider {...methods}>
      <EditProjectDetailsProvider allocations={fundraiser.projectAllocations}>
        {children}
      </EditProjectDetailsProvider>
      {/* {DevTool !== null && (
        <DevTool control={methods.control as unknown as Control} />
      )} */}
    </FormProvider>
  );
}
