import type { ModuleDescriptor } from '..';
import type { StageModuleSettings } from './settings';

export const STAGE_MODULE_ID = 'stage' as const;

export const stageModule = {
  id: STAGE_MODULE_ID,
  settingsKey: 'stage',
  localeNamespace: 'stage',
  route: { segment: 'stage' },
} as const satisfies ModuleDescriptor;

// Currently unused, is this needed?
export const stageDefaultSettings: StageModuleSettings = {
  enabled: false,
  locale: 'en',
  title: '',
  description: '',
  partner_logo_url: '',
  slides: [],
  show_impact: true,
  show_progress_bar: true,
};
