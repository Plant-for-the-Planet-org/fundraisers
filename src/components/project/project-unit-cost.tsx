import type { ProjectUnit } from '@/lib/types/payment-options';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';

interface ProjectUnitCostProps {
  /** Cost of one unit in major currency units, e.g. `1.5`. */
  unitCost: number;
  /** Unit the cost applies to. */
  unit: ProjectUnit;
  currency: string;
  className?: string;
}

/**
 * Cost of a single unit as one metadata item ("€1.50 per tree"), placed
 * beneath the project owner in the hero. Always one line — it reads as a
 * single figure, wrapping would break that.
 */
export function ProjectUnitCost({
  unitCost,
  unit,
  currency,
  className,
}: ProjectUnitCostProps) {
  const t = useTranslations('Project.hero');
  const locale = useLocale();

  return (
    <p
      className={cn(
        'flex shrink-0 flex-row items-center gap-2 whitespace-nowrap text-base leading-tight',
        className
      )}
    >
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
