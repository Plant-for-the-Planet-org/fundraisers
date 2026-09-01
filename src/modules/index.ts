/**
 * Modules registry — the single point where `src/lib/types/fundraiser.ts`
 * learns about each module's settings shape.
 *
 * When a module migrates into `src/modules/<id>/`, add its settings type
 * to `FundraiserModules` here. The fundraiser type composes from this
 * registry; lib does not reach into individual module folders.
 *
 * Each module's barrel (`@/modules/<id>`) is still the consumption surface
 * for its components, hooks, and metadata. This file is type-only.
 */

import type { StageModuleSettings } from './stage';

import { stageModule } from './stage';

export type { StageModuleSettings, StageSlide } from './stage';

export interface FundraiserModules {
  stage?: StageModuleSettings | null;
}

/**
 * Shape of a module's metadata as exposed by its `module.ts`.
 * Fields are optional; a module only needs the ones it uses.
 */
export interface ModuleDescriptor {
  readonly id: string;
  readonly settingsKey: string;
  readonly localeNamespace?: string;
  readonly route?: { readonly segment: string };
  /**
   * What happens to this module's settings when a fundraiser is cloned.
   * `copy` (the default) carries them over as they are; `reset` drops the slot
   * so the clone falls back to the module's own defaults. Pick `reset` for
   * settings that only make sense for the original, such as anything tied to
   * donations already received.
   */
  readonly clone?: 'copy' | 'reset';
}

/**
 * All registered modules. Iterated by core helpers (e.g. the i18n loader)
 * to discover modules' contributions. Add new modules to this list as
 * they migrate into `src/modules/`.
 */
export const registeredModules: readonly ModuleDescriptor[] = [stageModule];
