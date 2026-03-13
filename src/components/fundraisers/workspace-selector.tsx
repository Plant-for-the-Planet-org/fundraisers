'use client';

import type { CreateFundraiserFormValues } from './create-fundraiser-form-context';

import { useLocale, useTranslations } from 'next-intl';
import { useController, useFormContext } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAllowedCountries,
  getCurrencyForCountry,
  type AllowedCountry,
} from '@/lib/utils/country-currency';

export function WorkspaceSelector() {
  const locale = useLocale();
  const t = useTranslations('Fundraisers.create.countryEntity');

  const { setValue } = useFormContext<CreateFundraiserFormValues>();
  const { field } = useController<CreateFundraiserFormValues, 'country'>({
    name: 'country',
  });

  const handleCountryChange = (country: string) => {
    field.onChange(country);
    setValue('currency', getCurrencyForCountry(country as AllowedCountry));
  };

  const countries = getAllowedCountries(locale).map(c =>
    c.code === 'ROW' ? { ...c, name: t('restOfWorld') } : c
  );

  const selected = countries.find(c => c.code === field.value);

  return (
    <div className='workspace-selector flex flex-col gap-2'>
      <label className='text-sm font-medium' htmlFor='form-country'>
        {t('label')}
      </label>
      <Select value={field.value} onValueChange={handleCountryChange}>
        <SelectTrigger
          className='w-full bg-transparent border-border hover:bg-muted/5'
          id='form-country'
        >
          <SelectValue>
            {selected && (
              <span className='flex items-center gap-2'>
                <span
                  className="font-['Twemoji_Country_Flags',sans-serif]"
                  aria-hidden='true'
                >
                  {selected.flag}
                </span>
                <span>{selected.name}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          position='popper'
          align='start'
          sideOffset={4}
          className='max-h-80 bg-background border-border'
        >
          {countries.map(country => (
            <SelectItem
              key={country.code}
              value={country.code}
              layout='block'
              className='pr-2 py-2 focus:bg-muted data-[state=checked]:bg-muted **:data-[slot=select-item-indicator]:hidden'
            >
              <div className='flex items-center justify-between gap-4 w-full'>
                <span className='flex items-center gap-2'>
                  <span
                    className="font-['Twemoji_Country_Flags',sans-serif]"
                    aria-hidden='true'
                  >
                    {country.flag}
                  </span>
                  <span className='font-medium'>{country.name}</span>
                </span>
                <span
                  className='text-xs text-muted-foreground'
                  aria-label={t('currencyLabel', {
                    currency: country.currency,
                  })}
                >
                  {country.currency}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
