import {
  Amex,
  Diners,
  Discover,
  Generic,
  JCB,
  Maestro,
  Mastercard,
  UnionPay,
  Visa,
} from 'react-svg-credit-card-payment-icons/icons/flat';

type CardBrand = string | null | undefined;

const SIZE = { width: 32, height: 20 } as const;

// Maps Stripe `card.brand` values to the official brand icons from
// react-svg-credit-card-payment-icons.
function CardBrandIcon({ brand }: { brand: CardBrand }) {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return <Visa {...SIZE} />;
    case 'mastercard':
      return <Mastercard {...SIZE} />;
    case 'amex':
    case 'american_express':
    case 'american-express':
      return <Amex {...SIZE} />;
    case 'discover':
      return <Discover {...SIZE} />;
    case 'diners':
    case 'diners_club':
      return <Diners {...SIZE} />;
    case 'jcb':
      return <JCB {...SIZE} />;
    case 'unionpay':
    case 'union_pay':
      return <UnionPay {...SIZE} />;
    case 'maestro':
      return <Maestro {...SIZE} />;
    // Stripe also returns `eftpos_au`, which has no dedicated mark — fall back
    // to the generic card artwork.
    default:
      return <Generic {...SIZE} />;
  }
}

export default CardBrandIcon;
