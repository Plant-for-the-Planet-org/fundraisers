'use client';

import type { ChangeEvent, FocusEvent, KeyboardEvent, Ref } from 'react';
import type {
  AddressSuggestion,
  ResolvedAddress,
} from '@/lib/api/geocoder-service';

import { useEffect, useId, useRef, useState } from 'react';
import {
  MIN_SUGGEST_LENGTH,
  resolveAddressSuggestion,
  suggestAddresses,
} from '@/lib/api/geocoder-service';
import { Input } from '../ui/input';

const DEBOUNCE_MS = 300;

type AddressAutocompleteInputProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputRef: Ref<HTMLInputElement>;
  country: string | undefined;
  onAddressResolved: (address: ResolvedAddress) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Street address input with suggestions from the geocoder.
 * The donor picks the country first, so every lookup is scoped to that country.
 * Picking a suggestion fills the street, city, zip and state fields in one go.
 */
export const AddressAutocompleteInput = ({
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  country,
  onAddressResolved,
  placeholder,
  className,
}: AddressAutocompleteInputProps) => {
  const uid = useId();
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Set once the donor picks a suggestion so the resulting value change does not trigger another lookup.
  const skipNextLookupRef = useRef(false);

  useEffect(() => {
    if (skipNextLookupRef.current) {
      skipNextLookupRef.current = false;
      return;
    }
    if (value.trim().length < MIN_SUGGEST_LENGTH) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      abortRef.current = controller;
      suggestAddresses(value, country, controller.signal)
        .then(result => {
          if (controller.signal.aborted) return;
          setSuggestions(result);
          setActiveIndex(0);
        })
        .catch(() => {
          // Suggestions are a convenience; the donor can always type the address by hand.
          if (!controller.signal.aborted) setSuggestions([]);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, country]);

  useEffect(() => {
    if (!isOpen || !listboxRef.current) return;
    const activeOption = listboxRef.current.querySelector<HTMLElement>(
      `#${CSS.escape(`address-suggestion-${activeIndex}-${uid}`)}`
    );
    activeOption?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex, uid]);

  const handleSelect = async (suggestion: AddressSuggestion) => {
    abortRef.current?.abort();
    setIsOpen(false);
    setSuggestions([]);
    skipNextLookupRef.current = true;
    onChange(suggestion.text);

    try {
      const resolved = await resolveAddressSuggestion(suggestion);
      if (!resolved) return;
      skipNextLookupRef.current = true;
      onAddressResolved(resolved);
    } catch {
      // Keep the suggestion text as the street address if the lookup fails.
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (!suggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
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
      const active = suggestions[activeIndex];
      if (active) void handleSelect(active);
    }
  };

  const showList = isOpen && suggestions.length > 0;
  // The list is hidden rather than unmounted on blur. The donate dialog traps focus, and Radix refocuses the dialog surface if DOM nodes are removed while focus is moving from this input to another field. Unmounting here would make the next field need a second click.
  const hasList = suggestions.length > 0;
  const listboxId = `address-suggestions-${uid}`;

  return (
    <div className='relative'>
      <Input
        ref={inputRef}
        name={name}
        value={value}
        autoComplete='street-address'
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const next = event.target.value;
          onChange(next);
          setIsOpen(true);
          if (next.trim().length < MIN_SUGGEST_LENGTH) {
            abortRef.current?.abort();
            setSuggestions([]);
          }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={(_event: FocusEvent<HTMLInputElement>) => {
          setIsOpen(false);
          onBlur();
        }}
        onKeyDown={handleKeyDown}
        role='combobox'
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete='list'
        aria-activedescendant={
          showList ? `address-suggestion-${activeIndex}-${uid}` : undefined
        }
        placeholder={placeholder}
        className={className}
      />

      {hasList && (
        <div
          id={listboxId}
          ref={listboxRef}
          role='listbox'
          hidden={!isOpen}
          className='absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg'
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.magicKey}
              id={`address-suggestion-${index}-${uid}`}
              type='button'
              role='option'
              aria-selected={index === activeIndex}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${index === activeIndex ? 'bg-gray-50' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={event => {
                event.preventDefault();
                void handleSelect(suggestion);
              }}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
