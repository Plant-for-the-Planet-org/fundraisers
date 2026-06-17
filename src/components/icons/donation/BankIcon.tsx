import { type ReactElement } from 'react';
import { Landmark } from 'lucide-react';

interface Props {
  textColor?: string;
}

function BankIcon({ textColor }: Props): ReactElement {
  return <Landmark size={18} color={textColor} aria-hidden='true' />;
}

export default BankIcon;
