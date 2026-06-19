import type { LineItem } from '../types/donation';
import type { ProjectAllocation } from '../types/fundraiser';
import type { SelectedProject } from '../types/project-selection';

import { MIN_DEFAULT_CAUSE_PERCENT } from '../constants/project-selection';
import { calculateProjectAllocations } from '../utils/project-allocation';

export interface LineItemCalculationResult {
  lineItems: LineItem[];
  totalAmount: number;
  totalPercentage: number;
}

export class LineItemCalculator {
  /**
   * Calculate line items from total amount and project allocations
   *
   * @param totalAmountInCents - Total donation amount in cents
   * @param projectAllocations - Array of project allocations with percentages
   * @returns Calculated line items with proper rounding
   */
  static calculateLineItems(
    totalAmountInCents: number,
    projectAllocations: ProjectAllocation[]
  ): LineItemCalculationResult {
    // Validate inputs
    if (totalAmountInCents <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    if (!projectAllocations || projectAllocations.length === 0) {
      throw new Error('Project allocations cannot be empty');
    }

    // Validate percentages
    const totalPercentage = projectAllocations.reduce((sum, allocation) => {
      if (allocation.percentage < 0 || allocation.percentage > 100) {
        throw new Error(
          `Invalid percentage: ${allocation.percentage}. Must be between 0 and 100`
        );
      }
      return sum + allocation.percentage;
    }, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(
        `Project allocations must sum to 100%, got ${totalPercentage}%`
      );
    }

    // Convert total amount from cents to full currency units
    const totalAmount = totalAmountInCents / 100;

    // Calculate individual project amounts
    const lineItems: LineItem[] = [];
    let calculatedTotal = 0;

    // Calculate amounts for each project
    for (let i = 0; i < projectAllocations.length; i++) {
      const allocation = projectAllocations[i];
      if (!allocation) {
        continue;
      } // Skip undefined allocations

      let projectAmount: number;

      if (i === projectAllocations.length - 1) {
        // For the last project, use remaining amount to handle rounding
        projectAmount = Math.round((totalAmount - calculatedTotal) * 100) / 100;
      } else {
        // Calculate amount based on percentage and round to 2 decimal places
        const rawAmount = (totalAmount * allocation.percentage) / 100;
        projectAmount = Math.round(rawAmount * 100) / 100;
        calculatedTotal += projectAmount;
      }

      // Ensure amount is not negative due to rounding
      if (projectAmount < 0) {
        projectAmount = 0;
      }

      lineItems.push({
        project: allocation.project.id,
        amount: projectAmount,
      });
    }

    return {
      lineItems,
      totalAmount,
      totalPercentage,
    };
  }
}

/**
 * Removes non-donatable projects and recalculates the remaining percentages
 * using the same allocation logic as the fundraiser create/edit form.
 *
 * If all regular projects are non-donatable, the Support Project receives 100%.
 *
 * Returns the original allocations unchanged when all projects are donatable.
 *
 * @param projectAllocations - Original fundraiser allocations
 * @param defaultCauseId - Support Project id
 * @returns Donatable allocations with updated percentages
 */
function redistributeToDonatableProjects(
  projectAllocations: ProjectAllocation[],
  defaultCauseId: string
): ProjectAllocation[] {
  const donatable = projectAllocations.filter(
    allocation => allocation.project.allowDonations !== false
  );

  // Nothing excluded — keep the original allocations and percentages as-is.
  if (donatable.length === projectAllocations.length) {
    return projectAllocations;
  }

  // Keep the Support Project first so it receives any rounding remainder,
  // matching the create/edit form behavior.
  const orderedDonatable = [
    ...donatable.filter(allocation => allocation.project.id === defaultCauseId),
    ...donatable.filter(allocation => allocation.project.id !== defaultCauseId),
  ];

  const selectedProjects: SelectedProject[] = orderedDonatable.map(
    allocation => ({
      id: allocation.project.id,
      name: allocation.project.name,
      description: allocation.project.description,
    })
  );

  const recalculated = calculateProjectAllocations(
    selectedProjects,
    defaultCauseId,
    MIN_DEFAULT_CAUSE_PERCENT
  );

  const percentageById = new Map(
    recalculated.map(allocation => [allocation.id, allocation.percentage])
  );

  return donatable.map(allocation => ({
    ...allocation,
    percentage:
      percentageById.get(allocation.project.id) ?? allocation.percentage,
  }));
}

/**
 * Convenience function for calculating line items
 *
 * Non-donatable projects are dropped and their share is redistributed across
 * the remaining donatable projects before the amounts are computed.
 *
 * @param totalAmountInCents - Total donation amount in cents
 * @param projectAllocations - Array of project allocations
 * @param defaultCauseId - The Support Project id for the fundraiser's country
 * @returns Calculated and validated line items
 */
export function calculateLineItems(
  totalAmountInCents: number,
  projectAllocations: ProjectAllocation[],
  defaultCauseId: string
): LineItem[] {
  const donatableAllocations = redistributeToDonatableProjects(
    projectAllocations,
    defaultCauseId
  );
  const result = LineItemCalculator.calculateLineItems(
    totalAmountInCents,
    donatableAllocations
  );
  return result.lineItems;
}
