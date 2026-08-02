import type { ProjectUnit } from '@/lib/types/payment-options';

import { useLocale, useTranslations } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';

interface ProjectUnitCostProps {
  /** Cost of one unit in major currency units, e.g. `1.5`. */
  unitCost: number;
  /** Unit the cost applies to. */
  unit: ProjectUnit;
  currency: string;
}

/**
 * Cost of a single unit as one inline metadata item ("€1.50 per tree"), sized
 * to sit next to the project owner in the hero row.
 */
export function ProjectUnitCost({
  unitCost,
  unit,
  currency,
}: ProjectUnitCostProps) {
  const t = useTranslations('Project.hero');
  const locale = useLocale();

  return (
    <p className='flex flex-row items-center gap-2 text-base leading-tight'>
      <span>
        {t.rich('unitCost', {
          unit,
          cost: formatCurrencyFromDecimal(unitCost, currency, locale),
          amount: chunks => (
            <strong className='font-semibold text-foreground'>{chunks}</strong>
          ),
          label: chunks => (
            <span className='text-muted-foreground'>{chunks}</span>
          ),
        })}
      </span>
    </p>
  );
}
