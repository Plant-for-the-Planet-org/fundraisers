'use client';

import { Button } from '@/components/ui/button';

interface SignInWithButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export function SignInWithButton({
  icon,
  label,
  onClick,
}: SignInWithButtonProps) {
  return (
    <Button
      variant='outline'
      className='w-full h-12 border-border'
      size='lg'
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}
