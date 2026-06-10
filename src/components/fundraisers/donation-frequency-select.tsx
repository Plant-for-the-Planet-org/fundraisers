'use client';

import type { DonationFrequency } from '@/lib/types/donation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

interface FrequencyOption {
  value: DonationFrequency;
  label: string;
}

interface DonationFrequencySelectProps {
  options: FrequencyOption[];
  selectedOption: FrequencyOption;
  onOptionChange: (option: FrequencyOption) => void;
}

export function DonationFrequencySelect({
  options,
  selectedOption,
  onOptionChange,
}: DonationFrequencySelectProps) {
  const handleValueChange = (value: string) => {
    const option = options.find(item => item.value === value);
    if (option) {
      onOptionChange(option);
    }
  };

  return (
    <Select value={selectedOption.value} onValueChange={handleValueChange}>
      <SelectTrigger
        data-component='donation-frequency-select'
        className='h-auto w-fit gap-2.5 rounded-none border-0 bg-transparent px-0 py-0 text-sm font-semibold text-foreground shadow-none transition-opacity hover:opacity-70 focus-visible:ring-0 data-[size=default]:h-auto data-[state=open]:ring-0 dark:bg-transparent dark:hover:bg-transparent [&_svg]:text-foreground! [&_svg]:opacity-100'
      >
        {selectedOption.label}
      </SelectTrigger>
      <SelectContent
        position='popper'
        align='end'
        sideOffset={4}
        className='border-border'
      >
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
