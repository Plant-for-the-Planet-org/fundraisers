'use client';

import type { DayButton } from 'react-day-picker';

import * as React from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { useLocale } from 'next-intl';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

// Stable across renders — react-day-picker returns the same class-name map.
const defaultClassNames = getDefaultClassNames();

// Base styles for calendar day states:
// - Default: inherited text color, transparent background
// - Today: subtle highlight
// - Hover: outlined circled
// - Selected: solid primary fill
const dayButtonClassName = [
  // Selected (single).
  'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground',
  'data-[selected-single=true]:hover:bg-primary data-[selected-single=true]:hover:text-primary-foreground',
  // Range.
  'data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground',
  'data-[range-middle=true]:hover:bg-accent data-[range-middle=true]:hover:text-accent-foreground',
  'data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground',
  'data-[range-start=true]:hover:bg-primary data-[range-start=true]:hover:text-primary-foreground',
  'data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground',
  'data-[range-end=true]:hover:bg-primary data-[range-end=true]:hover:text-primary-foreground',
  // Today: emphasized without using the selected state.
  'data-[today=true]:bg-primary/35 data-[today=true]:font-medium data-[today=true]:text-primary',
  'dark:data-[today=true]:bg-primary/60',
  'dark:data-[today=true]:text-primary-foreground',
  // Hover — hollow blue circle for the default state.
  'hover:bg-transparent hover:text-foreground hover:ring-1 hover:ring-inset hover:ring-primary',
  'dark:hover:bg-transparent dark:hover:text-foreground',
  // Keyboard focus ring.
  'group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50',
  'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px]',
  // Layout & shape — circular by default so today/hover/selected all align.
  'flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-full font-normal leading-none',
  // Range corner radii override the circular base within a range.
  'data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md',
  '[&>span]:text-xs [&>span]:opacity-70',
].join(' ');

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
  const locale = useLocale();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'group/calendar bg-background p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: date =>
          date.toLocaleString(locale, { month: 'short' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn(
          'relative flex flex-col gap-4 md:flex-row',
          defaultClassNames.months
        ),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          'size-(--cell-size) select-none p-0 aria-disabled:opacity-50',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          'flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium',
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          'has-focus:border-ring border-input has-focus:ring-ring/50 relative rounded-md border shadow-xs has-focus:ring-[3px]',
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          'bg-popover absolute inset-0 opacity-0',
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground',
          defaultClassNames.caption_label
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal',
          defaultClassNames.weekday
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        week_number_header: cn(
          'w-(--cell-size) select-none',
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          'text-muted-foreground select-none text-[0.8rem]',
          defaultClassNames.week_number
        ),
        day: cn(
          '[&[data-selected=true]_button]:rounded-full [&:last-child[data-selected=true]_button]:rounded-r-md',
          props.showWeekNumber
            ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-md'
            : '[&:first-child[data-selected=true]_button]:rounded-l-md',
          defaultClassNames.day
        ),
        range_start: cn(
          'bg-accent rounded-l-md',
          defaultClassNames.range_start
        ),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('bg-accent rounded-r-md', defaultClassNames.range_end),
        today: defaultClassNames.today,
        outside: cn(
          'text-muted-foreground aria-selected:text-muted-foreground',
          defaultClassNames.outside
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot='calendar'
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          const Icon =
            orientation === 'left'
              ? ChevronLeftIcon
              : orientation === 'right'
                ? ChevronRightIcon
                : ChevronDownIcon;

          return <Icon className={cn('size-4', className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className='flex size-(--cell-size) items-center justify-center text-center'>
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant='ghost'
      size='icon'
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      // Don't apply the today highlight to the selected date.
      data-today={modifiers.today && !modifiers.selected}
      className={cn(dayButtonClassName, defaultClassNames.day, className)}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
