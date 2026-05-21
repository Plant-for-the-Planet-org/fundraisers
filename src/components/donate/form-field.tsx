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
      <Label className='text-sm font-medium text-foreground'>{label}</Label>

      {children}

      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  );
};
