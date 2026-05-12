import type { ReactElement } from 'react';

import { Wallet } from 'lucide-react';

interface Props {
  textColor?: string;
}

function PlanetCashIcon({ textColor }: Props): ReactElement {
  return <Wallet size={20} color={textColor ?? '#4d5153'} />;
}

export default PlanetCashIcon;
