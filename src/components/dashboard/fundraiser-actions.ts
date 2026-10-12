import type { Fundraiser, FundraiserStatus } from '@/lib/types/fundraiser';

import {
  isFundraiserOwnerOrAdmin,
  isStageModeEnabled,
} from '@/lib/utils/fundraiser';

export interface ActionVisibility {
  /** A draft can be taken live. */
  publish: boolean;
  edit: boolean;
  clone: boolean;
  copyLink: boolean;
  pause: boolean;
  resume: boolean;
  stageMode: boolean;
  delete: boolean;
}

// Viewers can clone. It only reads the original and creates a separate
// fundraiser they own, so it is not the write access their role withholds.
const NON_OWNER_ACTIONS: ActionVisibility = {
  publish: false,
  edit: false,
  clone: true,
  copyLink: true,
  pause: false,
  resume: false,
  stageMode: false,
  delete: false,
};

// Status drives edit/pause/resume; Stage Mode is orthogonal (it depends on the
// fundraiser's module settings, not its status) and is layered on afterwards.
type StatusActions = Omit<ActionVisibility, 'stageMode'>;

const OWNER_ACTIONS_BY_STATUS: Record<FundraiserStatus, StatusActions> = {
  active: {
    publish: false,
    edit: true,
    clone: true,
    copyLink: true,
    pause: true,
    resume: false,
    delete: true,
  },
  paused: {
    publish: false,
    edit: true,
    clone: true,
    copyLink: true,
    pause: false,
    resume: true,
    delete: true,
  },
  draft: {
    publish: true,
    edit: true,
    clone: true,
    copyLink: true,
    pause: false,
    resume: false,
    delete: true,
  },
  // Completed fundraisers stay editable so hosts can still refine copy (e.g.
  // description, thank-you message) after the campaign ends. Cancelled is a
  // deliberate termination and remains locked.
  completed: {
    publish: false,
    edit: true,
    clone: true,
    copyLink: true,
    pause: false,
    resume: false,
    delete: true,
  },
  // Cloning stays available on a cancelled fundraiser: the original is locked,
  // but its setup is still the fastest way to start the campaign again.
  cancelled: {
    publish: false,
    edit: false,
    clone: true,
    copyLink: true,
    pause: false,
    resume: false,
    delete: true,
  },
  // Archived fundraisers are not returned by the list API, so this is a defensive check.
  archived: {
    publish: false,
    edit: false,
    clone: false,
    copyLink: true,
    pause: false,
    resume: false,
    delete: false,
  },
};

export function getAvailableActions(
  fundraiser: Fundraiser,
  currentUserId: string | null
): ActionVisibility {
  if (!isFundraiserOwnerOrAdmin(fundraiser, currentUserId)) {
    return NON_OWNER_ACTIONS;
  }
  return {
    ...OWNER_ACTIONS_BY_STATUS[fundraiser.status],
    stageMode: isStageModeEnabled(fundraiser),
  };
}
