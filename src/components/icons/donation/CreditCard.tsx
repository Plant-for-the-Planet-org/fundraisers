import { type ReactElement } from 'react';
import { CreditCard as CreditCardIcon } from 'lucide-react';

interface Props {
  textColor?: string;
}

function CreditCard({ textColor }: Props): ReactElement {
  return <CreditCardIcon size={18} color={textColor} aria-hidden='true' />;
}

export default CreditCard;
