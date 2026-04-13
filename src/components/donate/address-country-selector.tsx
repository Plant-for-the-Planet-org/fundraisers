'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getAllCountries, searchCountries } from '@/lib/utils/country';
import { CountryFlag } from '../ui/country-flag';
import { Input } from '../ui/input';
import { FormField } from './form-field';

type AddressCountrySelectorProps = {
  country: string | undefined;
  onCountryChange: (code: string) => void;
  onCountryBlur: () => void;
  error?: string;
  label?: string;
  placeholder?: string;
  noResultsText?: string;
};

export const AddressCountrySelector = ({
  country,
  onCountryChange,
  onCountryBlur,
  error,
  label,
  placeholder,
  noResultsText,
}: AddressCountrySelectorProps) => {
  const locale = useLocale();
  const tDonate = useTranslations('Donate.userAddress');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const uid = useId();

  // Intentionally uses the full donate country source; do not couple with workspace selector data.
  const allCountries = getAllCountries(locale);
  const selectedCountry = allCountries.find(c => c.code === country);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredCountries = useMemo(
    () => (query.trim() ? searchCountries(query, locale) : allCountries),
    [query, locale, allCountries]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !listboxRef.current || filteredCountries.length === 0)
      return;

    const activeCountry = filteredCountries[activeIndex];
    if (!activeCountry) return;

    const activeOptionId = `country-selector-option-${activeCountry.code}-${uid}`;
    const activeOption = listboxRef.current.querySelector<HTMLElement>(
      `#${CSS.escape(activeOptionId)}`
    );
    activeOption?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex, filteredCountries]);

  const handleSelectCountry = (code: string) => {
    const countryOption = allCountries.find(c => c.code === code);
    onCountryChange(code);
    setQuery(countryOption?.name ?? code);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredCountries.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => Math.min(prev + 1, filteredCountries.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      const activeCountry = filteredCountries[activeIndex];
      if (activeCountry) {
        handleSelectCountry(activeCountry.code);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setQuery(selectedCountry?.name ?? '');
    }
  };

  const listboxId = `country-selector-listbox-${uid}`;
  const inputValue = isOpen ? query : (selectedCountry?.name ?? '');
  const activeCountry = filteredCountries[activeIndex];
  const activeDescendantId =
    isOpen && activeCountry
      ? `country-selector-option-${activeCountry.code}-${uid}`
      : undefined;

  const resolvedLabel = label ?? tDonate('country.label');
  const resolvedPlaceholder = placeholder ?? tDonate('country.selectCountry');
  const resolvedNoResults = noResultsText ?? tDonate('country.noResults');

  return (
    <FormField label={resolvedLabel} error={error}>
      <div className='relative mt-2' ref={containerRef}>
        <Input
          value={inputValue}
          onFocus={() => {
            setQuery(selectedCountry?.name ?? '');
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onChange={event => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setIsOpen(false);
            setQuery(selectedCountry?.name ?? '');
            onCountryBlur();
          }}
          role='combobox'
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete='list'
          aria-activedescendant={activeDescendantId}
          placeholder={resolvedPlaceholder}
          className='border-gray-300 focus:border-gray-500 focus:ring-gray-500'
        />

        {isOpen && (
          <div
            id={listboxId}
            ref={listboxRef}
            role='listbox'
            className='absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg'
          >
            {filteredCountries.length > 0 ? (
              filteredCountries.map((countryOption, index) => (
                <button
                  key={countryOption.code}
                  id={`country-selector-option-${countryOption.code}-${uid}`}
                  type='button'
                  role='option'
                  aria-selected={countryOption.code === country}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${index === activeIndex ? 'bg-gray-50' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={event => {
                    event.preventDefault();
                    handleSelectCountry(countryOption.code);
                  }}
                >
                  <CountryFlag flag={countryOption.flag} />
                  <span>{countryOption.name}</span>
                </button>
              ))
            ) : (
              <div className='px-3 py-2 text-sm text-muted-foreground'>
                {resolvedNoResults}
              </div>
            )}
          </div>
        )}
      </div>
    </FormField>
  );
};
