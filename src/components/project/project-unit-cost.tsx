import { useLocale, useTranslations } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { SectionHeader } from '@/components/fundraisers/typography';

interface ProjectUnitCostProps {
  /** Cost of one unit in major currency units, e.g. `1.5`. */
  unitCost: number;
  /** Unit the cost applies to, e.g. `"tree"` or `"m2"`. */
  unit: string;
  currency: string;
}

/**
 * Cost of a single unit, labelled by the project's unit ("Cost Per Tree").
 */
export function ProjectUnitCost({
  unitCost,
  unit,
  currency,
}: ProjectUnitCostProps) {
  const t = useTranslations('Project.hero');
  const locale = useLocale();

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>{t('unitCostLabel', { unit })}</SectionHeader>
      <p className='text-foreground'>
        {formatCurrencyFromDecimal(unitCost, currency, locale)}
      </p>
    </div>
  );
}
