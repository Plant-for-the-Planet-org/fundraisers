'use client';
import { Label } from '../ui/label';

type FormFieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

export const FormField = ({ label, error, children }: FormFieldProps) => {
  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium text-gray-700'>{label}</Label>

      {children}

      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  );
};
