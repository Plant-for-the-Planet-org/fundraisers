import { Check } from 'lucide-react';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { useId } from 'react';

interface CheckboxFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export const CheckboxField = ({
  checked,
  onChange,
  label,
  description,
}: CheckboxFieldProps) => {
  const id = useId();

  return (
    <label htmlFor={id} className='flex items-start gap-3 cursor-pointer'>
      <input
        id={id}
        type='checkbox'
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className='sr-only'
      />

      <div
        className={cn(
          'w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center transition-all',
          'focus-visible:ring-2 focus-visible:ring-offset-2',
          checked ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'
        )}
      >
        {checked && <Check className='w-3 h-3 text-white' />}
      </div>

      <div className='flex-1 space-y-1'>
        <Label className='text-sm font-medium text-gray-700'>{label}</Label>
        {description && <p className='text-sm text-gray-500'>{description}</p>}
      </div>
    </label>
  );
};
