// TODO: temporary card brand marks — replace with the official brand icons
// (or fall back to plain text labels) before this ships broadly.
import type { ReactElement } from 'react';

import { CreditCard as GenericCard } from 'lucide-react';

type CardBrand = string | null | undefined;

const COMMON_PROPS = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '32',
  height: '20',
  viewBox: '0 0 32 20',
  'aria-hidden': true,
};

function VisaMark(): ReactElement {
  return (
    <svg {...COMMON_PROPS}>
      <rect width='32' height='20' rx='3' fill='#1A1F71' />
      <path
        fill='#fff'
        d='M13.4 13.6h-1.9l1.2-7.2h1.9l-1.2 7.2zm6.7-7.1c-.4-.1-1-.3-1.7-.3-1.9 0-3.3 1-3.3 2.4 0 1 1 1.6 1.7 1.9.8.4 1 .6 1 .9 0 .5-.6.7-1.1.7-.7 0-1.1-.1-1.7-.4l-.2-.1-.3 1.6c.4.2 1.2.4 2 .4 2 0 3.4-1 3.4-2.5 0-.8-.5-1.5-1.7-2-.7-.3-1.1-.5-1.1-.9 0-.3.3-.6 1.1-.6.6 0 1.1.1 1.4.3l.2.1.3-1.5zm2.5 4.6c.2-.4.8-2.2.8-2.2l.2.5s.4 1.5.4 1.7h-1.4zm2.4-4.7h-1.5c-.5 0-.8.1-1 .6l-2.8 6.6h2l.4-1.1h2.4c.1.3.2 1.1.2 1.1h1.7L25 6.4zm-15.8 0L8.9 11.3l-.2-1c-.4-1.2-1.4-2.5-2.6-3.1l1.7 6.4h2l3-7.2h-2z'
      />
    </svg>
  );
}

function MastercardMark(): ReactElement {
  return (
    <svg {...COMMON_PROPS}>
      <rect width='32' height='20' rx='3' fill='#fff' stroke='#E5E7EB' />
      <circle cx='13' cy='10' r='5' fill='#EB001B' />
      <circle cx='19' cy='10' r='5' fill='#F79E1B' />
      <path fill='#FF5F00' d='M16 6.2a5 5 0 010 7.6 5 5 0 010-7.6z' />
    </svg>
  );
}

function AmexMark(): ReactElement {
  return (
    <svg {...COMMON_PROPS}>
      <rect width='32' height='20' rx='3' fill='#1F72CD' />
      <text
        x='16'
        y='13'
        textAnchor='middle'
        fontFamily='Arial, Helvetica, sans-serif'
        fontSize='6.5'
        fontWeight='700'
        fill='#fff'
        letterSpacing='0.3'
      >
        AMEX
      </text>
    </svg>
  );
}

function DiscoverMark(): ReactElement {
  return (
    <svg {...COMMON_PROPS}>
      <rect width='32' height='20' rx='3' fill='#fff' stroke='#E5E7EB' />
      <path d='M0 12h32v5a3 3 0 01-3 3H3a3 3 0 01-3-3v-5z' fill='#FF6000' />
      <circle cx='22' cy='12' r='4' fill='#FF6000' />
    </svg>
  );
}

function DinersMark(): ReactElement {
  return (
    <svg {...COMMON_PROPS}>
      <rect width='32' height='20' rx='3' fill='#fff' stroke='#E5E7EB' />
      <circle cx='16' cy='10' r='5' fill='#0079BE' />
      <path d='M14 6.2v7.6a4 4 0 010-7.6z' fill='#fff' />
      <path d='M18 6.2v7.6a4 4 0 000-7.6z' fill='#fff' />
    </svg>
  );
}

function JcbMark(): ReactElement {
  return (
    <svg {...COMMON_PROPS}>
      <rect width='32' height='20' rx='3' fill='#fff' stroke='#E5E7EB' />
      <rect x='8' y='4' width='5' height='12' rx='1' fill='#0E4C96' />
      <rect x='13.5' y='4' width='5' height='12' rx='1' fill='#BE0029' />
      <rect x='19' y='4' width='5' height='12' rx='1' fill='#007B40' />
    </svg>
  );
}

function UnionPayMark(): ReactElement {
  return (
    <svg {...COMMON_PROPS}>
      <rect width='32' height='20' rx='3' fill='#fff' stroke='#E5E7EB' />
      <path d='M7 4h6v8a4 4 0 01-8 0V5a1 1 0 011-1z' fill='#01798A' />
      <path d='M13 4h6v8a4 4 0 01-8 0V5a1 1 0 011-1z' fill='#024381' />
      <path d='M19 4h6v8a4 4 0 01-8 0V5a1 1 0 011-1z' fill='#DD0228' />
    </svg>
  );
}

function EftposAuMark(): ReactElement {
  return (
    <svg {...COMMON_PROPS}>
      <rect width='32' height='20' rx='3' fill='#fff' stroke='#E5E7EB' />
      <text
        x='16'
        y='13'
        textAnchor='middle'
        fontFamily='Arial, Helvetica, sans-serif'
        fontSize='6'
        fontWeight='700'
        fill='#E5202E'
        letterSpacing='0.2'
      >
        eftpos
      </text>
    </svg>
  );
}

function CardBrandIcon({ brand }: { brand: CardBrand }) {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return <VisaMark />;
    case 'mastercard':
      return <MastercardMark />;
    case 'amex':
    case 'american_express':
    case 'american-express':
      return <AmexMark />;
    case 'discover':
      return <DiscoverMark />;
    case 'diners':
    case 'diners_club':
      return <DinersMark />;
    case 'jcb':
      return <JcbMark />;
    case 'unionpay':
    case 'union_pay':
      return <UnionPayMark />;
    case 'eftpos_au':
    case 'eftpos':
      return <EftposAuMark />;
    default:
      return <GenericCard className='h-5 w-5 text-muted-foreground' />;
  }
}

export default CardBrandIcon;
