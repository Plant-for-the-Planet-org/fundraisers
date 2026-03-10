'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FrequencyOption {
  value: string;
  label: string;
}

interface DonationFrequencyDropdownProps {
  options: FrequencyOption[];
  selectedOption: FrequencyOption;
  onOptionChange: (option: FrequencyOption) => void;
}

export function DonationFrequencyDropdown({
  options,
  selectedOption,
  onOptionChange,
}: DonationFrequencyDropdownProps) {
  return (
    <DropdownMenu data-component='donation-frequency-dropdown'>
      <DropdownMenuTrigger className='flex items-center gap-2.5 text-zinc-700 text-sm font-semibold hover:opacity-70 transition-opacity'>
        {selectedOption.label}
        <ChevronDown className='w-4 h-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='border-border'>
        {options.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onOptionChange(option)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
