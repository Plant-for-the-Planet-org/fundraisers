// App-level feature flags. Each is ON by default and turned off via an env var,
// so a deploy can hide a feature without a code change.
//
// These are read in Server Components (e.g. the top-bar Header), so the vars are
// plain server env vars — no NEXT_PUBLIC_ prefix and never shipped to the client.

// The ForestCloud app switcher — the waffle in the top bar that opens the grid
// of ForestCloud apps. On unless FC_APP_SWITCHER is explicitly "false".
export const FC_APP_SWITCHER = process.env.FC_APP_SWITCHER !== 'false';
