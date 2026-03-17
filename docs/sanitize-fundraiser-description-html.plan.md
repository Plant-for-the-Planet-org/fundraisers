---
name: sanitize-fundraiser-description-html
overview: Design a safe, read-only HTML rendering flow for fundraiser descriptions that still uses dangerouslySetInnerHTML while minimizing XSS risk.
todos:
  - id: analyze-description-data-flow
    content: Identify where fundraiser description HTML is produced and how it reaches DescriptionDisplay, classifying it as trusted or untrusted.
    status: completed
  - id: add-sanitizer-utility
    content: Create a server-safe sanitizeDescriptionHtml utility with a strict allowlist of tags and attributes for descriptions.
    status: completed
  - id: introduce-safehtml-type
    content: Introduce a SafeHtml branded type and make sanitizer return it.
    status: completed
  - id: update-descriptiondisplay-props
    content: Refine DescriptionDisplay props to accept only SafeHtml and continue using dangerouslySetInnerHTML.
    status: completed
  - id: sanitize-in-loader-layer
    content: Update data loading or API layer to sanitize description HTML before passing to UI components.
    status: completed
  - id: add-tests-for-sanitizer-and-component
    content: Add unit tests for the sanitizer behavior and a snapshot test for DescriptionDisplay rendering.
    status: completed
  - id: optional-hardening-csp-logging
    content: Consider CSP tightening and logging stripped dangerous content for defense in depth.
    status: completed
isProject: false
---

## Goal

Design a small, focused HTML sanitization and rendering pipeline so `DescriptionDisplay` can continue using `dangerouslySetInnerHTML` while keeping XSS risk as low as reasonably possible.

## 1) Understand current data flow & constraints

- **Identify HTML source**: Confirm where the `value` prop for `DescriptionDisplay` comes from (API response, DB field, CMS, etc.), and whether it is already sanitized upstream.
- **Document trust boundaries**:
  - Treat any content that ultimately originates from end users as **untrusted**.
  - Treat internal, hardcoded HTML snippets as **trusted** but still run through the same pipeline for consistency.
- **Clarify allowed formatting**: List the minimal formatting features you actually need (e.g. `p`, `ul/ol/li`, `strong`, `em`, `blockquote`, `a` with http/https, `br`). This will drive a tight sanitization allowlist.

## 2) Introduce a shared HTML sanitizer utility

- **Create a dedicated sanitizer module** in the `fundraiser` app, for example:
  - `[fundraiser/src/lib/utils/sanitize-html.ts](fundraiser/src/lib/utils/sanitize-html.ts)`.
- **Use a well-maintained library** instead of hand-rolling:
  - Prefer a small, SSR-friendly sanitizer like `sanitize-html` (Node/SSR compatible) or similar, avoiding DOM APIs that require `window`.
- **Configure a strict allowlist**:
  - Allow only the tags and attributes required for description formatting.
  - Disallow all `script` tags, `style` tags, inline event handlers (e.g. `onclick`), and `javascript:`/`data:` URLs.
  - Example configuration sketch:

```ts
// sanitize-html.ts
import sanitizeHtml from "sanitize-html";

const DESCRIPTION_ALLOWED_TAGS = [
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "u",
  "s",
  "blockquote",
  "br",
  "span",
  "a",
  "h2",
  "h3",
];

const DESCRIPTION_ALLOWED_ATTR = {
  a: ["href", "title", "target", "rel"],
  "*": ["class"],
};

export function sanitizeDescriptionHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: DESCRIPTION_ALLOWED_TAGS,
    allowedAttributes: DESCRIPTION_ALLOWED_ATTR,
    allowedSchemes: ["http", "https", "mailto"],
  });
}
```

- **Keep sanitizer server-safe**:
  - Ensure the sanitizer does not depend on `window` so it can be used in server components and route handlers.

## 3) Introduce a "safe HTML" abstraction

- **Create a branded type** to mark already-sanitized HTML, e.g. in `[fundraiser/src/lib/types/safe-html.ts](fundraiser/src/lib/types/safe-html.ts)`:

```ts
// safe-html.ts
export type SafeHtml = string & { __brand: "SafeHtml" };

export function toSafeHtml(html: string): SafeHtml {
  return html as SafeHtml;
}
```

- **Wrap the sanitizer output**:

```ts
import { SafeHtml, toSafeHtml } from "../types/safe-html";

export function sanitizeDescriptionHtml(dirty: string): SafeHtml {
  const clean = sanitizeHtml(dirty, {
    /* config */
  });
  return toSafeHtml(clean);
}
```

- **Update data-loading layer** so that any place that prepares description HTML for the UI returns `SafeHtml` rather than a plain `string` (e.g. loader functions in `lib/api` or `lib/utils`).

## 4) Wire DescriptionDisplay to only accept SafeHtml

- **Narrow the component prop** in `[fundraiser/src/components/fundraisers/description.tsx](fundraiser/src/components/fundraisers/description.tsx)` from `string | null` to `SafeHtml | null`:

```ts
import type { SafeHtml } from "@/lib/types/safe-html";

interface DescriptionDisplayProps {
  value: SafeHtml | null;
  className?: string;
}
```

- **Keep render logic but trust only sanitized input**:
  - Continue using `dangerouslySetInnerHTML={{ __html: value }}` exactly as now.
  - Rely on the type system to make it impossible to accidentally pass unsanitized strings into the component from TypeScript code.

## 5) Decide where sanitization happens (single source of truth)

- **Preferred approach: sanitize in loaders or API layer**:
  - Whenever fundraiser data is assembled (e.g. `getFundraiserById`), call `sanitizeDescriptionHtml` there and expose `descriptionHtml: SafeHtml` to the UI.
  - This ensures **all usages** of description HTML (not just this component) are sanitized consistently.
- **Alternative (short term) approach**:
  - If refactoring loaders is too big initially, you can keep `DescriptionDisplay` accepting a `string`, but internally call `sanitizeDescriptionHtml` just before rendering.
  - Plan to migrate to the `SafeHtml` approach later so that other components using the same HTML also benefit.

## 6) Add tests and a small regression harness

- **Unit tests for sanitizer config** in e.g. `[fundraiser/src/lib/utils/__tests__/sanitize-html.test.ts](fundraiser/src/lib/utils/__tests__/sanitize-html.test.ts)`:
  - Verify that valid formatting (paragraphs, lists, emphasis, links) is preserved.
  - Verify that `<script>`, `on` attributes, and `javascript:` URLs are stripped or neutralized.
  - Verify that malformed HTML does not break rendering.
- **Snapshot test for DescriptionDisplay**:
  - Render `DescriptionDisplay` with known `SafeHtml` content and assert on the output HTML structure.

## 7) Harden broader security posture (optional but recommended)

- **CSP**: Ensure the app’s HTTP headers (Next.js middleware or hosting config) set a Content Security Policy that blocks inline scripts and disallows unknown domains. This limits damage even if some malicious HTML slips through.
- **No dynamic script injection**: Avoid future features that add `<script>` or inline event handlers via descriptions; keep descriptions strictly presentational.
- **Logging & monitoring**: If feasible, log when sanitizer strips dangerous content (e.g. presence of `script`, `onload`, `javascript:`) to detect abuse patterns.

## 8) Rollout steps

- Implement the sanitizer utility and type.
- Migrate the relevant loader/API code to provide `SafeHtml` descriptions.
- Update `DescriptionDisplay` to use the `SafeHtml` prop and keep `dangerouslySetInnerHTML`.
- Add and run tests.
- Perform a manual QA pass with sample content (including intentionally malicious snippets) to verify that the UI still looks right and that attacks are neutralized.
