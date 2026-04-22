# Fundraiser Edit Page

Documents the implementation, data flow, and architecture of the fundraiser edit page at `/dashboard/fundraisers/edit/[slug]`.

---

## Overview

The edit page lets an authenticated **owner host** update an existing fundraiser. It reuses the same form body as the create page (`FundraiserFormBody`) but differs in three ways:

1. **Data source** — the form is hydrated from an authenticated `GET /fundraisers/:slug` call rather than built from defaults
2. **Authorization** — only users listed as an `owner` in `fundraiser.hosts` are allowed through; everyone else sees an unauthorized screen
3. **Submission** — the submit button issues `PUT /fundraisers/:id` with **only the dirty fields** of the form, keeping the payload minimal

The edit page is client-rendered end to end: the route is gated by `AuthGuard`, the fundraiser is fetched client-side with the user's access token, and the form state is managed by `react-hook-form` with a Zod resolver.

---

## File Structure

```
src/
  app/
    (standard)/
      dashboard/
        fundraisers/
          edit/
            [slug]/
              page.tsx                        ← route entry; AuthGuard + status-aware body
  components/
    fundraisers/
      edit-fundraiser-form-context.tsx        ← FormProvider; builds defaults from the fundraiser
      fundraiser-form-body.tsx                ← shared create/edit layout (mode='create' | 'edit')
      fundraiser-form-schema.ts               ← shared Zod schema + create/edit default builders
      update-fundraiser-button.tsx            ← submit button; PUT with dirty-field payload
      use-fundraiser-for-edit.ts              ← client hook: fetch + authorize; returns state machine
  lib/
    api/
      fundraiser-service.ts                   ← getFundraiserAuthenticated, updateFundraiser
    utils/
      fundraiser-data-builder.ts              ← buildUpdateFundraiserRequest (dirty-field projection)
      fundraiser.ts                           ← getDaysLeft, getFundraiserUrl
locales/
  en/fundraisers.json                         ← Fundraisers.edit.* translation keys
  de/fundraisers.json
```

---

## Data flow — step by step

### Happy path (owner opens their own fundraiser)

```
1. Browser requests /dashboard/fundraisers/edit/<slug>
2. AuthGuard renders; waits for auth store to initialize and an accessToken to be present
3. EditFundraiserBody calls useFundraiserForEdit(slug):
     - status = 'loading'
     - getFundraiserAuthenticated(slug, token) → Fundraiser
     - isUserAuthorized(fundraiser, userId) checks hosts for { role: 'owner', user.id === userId }
     - status = 'ready'
4. EditFundraiserContent mounts:
     - extractInitialExtraProjects(fundraiser) — strips the workspace's default cause from
       projectAllocations to seed the "extra projects" list
     - EditFundraiserFormProvider wraps with FormProvider + Zod resolver
       - defaultValues come from fundraiserToFormValues(fundraiser)
       - useThemeStore.setSelectedTheme(buildTheme(...)) so the preview matches
     - FundraiserFormBody mode='edit' renders the shared layout
       - WorkspaceSelector is disabled (country/workspace change is not supported on edit)
       - ImageSelector autoLoadDefault=false (existing image is already hydrated)
       - GoalPreview receives totalRaised and endDate from the fetched fundraiser so
         the sidebar shows real progress and days-left instead of the create-mode stubs
     - UpdateFundraiserButton is passed as the submitButton slot
5. User edits some fields → react-hook-form tracks formState.dirtyFields
6. User clicks Update fundraiser:
     - handleSubmit runs Zod validation
     - buildUpdateFundraiserRequest(values, dirtyFields, imageFile) projects only dirty fields
     - If the image changed, imageFile is base64-encoded via imageToBase64
     - updateFundraiser(id, request, token) → PUT /fundraisers/:id
     - reset(values) resets the form's dirty baseline to the submitted values
     - Toast success
```

### Non-happy paths

`useFundraiserForEdit` returns a tagged status the page renders explicitly:

| Status         | Condition                                                         | UI                                                |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| `idle`         | Initial render before the effect runs                             | `<Loader text="Loading fundraiser..." />`         |
| `loading`      | Fetch in flight                                                   | `<Loader text="Loading fundraiser..." />`         |
| `ready`        | Fetch succeeded and the user is an owner                          | `<EditFundraiserContent fundraiser={...} />`      |
| `not-found`    | `PlatformAPIError` with `status === 404`                          | "Fundraiser not found" + back-to-dashboard button |
| `unauthorized` | `401` / `403` from API, **or** user is not an owner of the record | "You don't have permission..." screen             |
| `error`        | Any other failure                                                 | Error title + `errorMessage` + back-to-dashboard  |

---

## Modules

### `src/app/(standard)/dashboard/fundraisers/edit/[slug]/page.tsx`

Client component. The file is intentionally thin:

1. Unwraps the route `params` promise with `React.use`
2. Wraps the body in `AuthGuard` so the page is never rendered for anonymous users
3. `EditFundraiserBody` maps the `useFundraiserForEdit` state to the five UI branches above
4. `EditFundraiserContent` is split out so the `useMemo` for `initialExtraProjects` only runs once the fundraiser is known

`extractInitialExtraProjects` filters out the workspace's default cause (resolved via `getDefaultCauseId(workspaceCountry)`) because that allocation is treated implicitly by `ProjectSelection` and should not appear in the "extra projects" UI.

---

### `src/components/fundraisers/use-fundraiser-for-edit.ts`

Custom hook encapsulating the fetch + authorization lifecycle. Returns a discriminated union of statuses so the caller renders a branch per status rather than juggling multiple booleans.

**Auth wait:** the effect short-circuits while `isAuthInitializing` is true or `accessToken` is missing; status stays `idle`. Once the token is available, a cancellation-guarded async IIFE runs:

```ts
const abort = { cancelled: false };
// ...
return () => {
  abort.cancelled = true;
};
```

Every state update checks `abort.cancelled` first so a resolved fetch for a stale slug cannot overwrite the current state.

**Authorization rule:** `isUserAuthorized` requires a host entry where `host.user?.id === userId` **and** `host.role === 'owner'`. Admin hosts are not allowed to edit — this mirrors the platform contract and is the reason an extra `unauthorized` status exists alongside the HTTP `401`/`403` branch.

**Error mapping:** `PlatformAPIError` statuses are folded into `not-found` / `unauthorized`; everything else becomes `error` with the error's `message` surfaced to the UI.

---

### `src/components/fundraisers/edit-fundraiser-form-context.tsx`

`'use client'` component that hosts the form state for the edit page. It mirrors `CreateFundraiserFormProvider` but builds its `defaultValues` from a `Fundraiser` instead of static defaults.

Responsibilities:

- `useMemo(fundraiserToFormValues(fundraiser))` so the defaults are stable across re-renders
- Registers the fields that are not directly bound to an `<input>`: `image`, `currency`, `projectAllocations`
- Syncs the theme preview by calling `setSelectedTheme(buildTheme(fundraiser.settings?.theme ?? null))` on mount and whenever `fundraiser.settings?.theme` changes
- Installs a `beforeunload` guard while `formState.isDirty` — users get the browser's native "unsaved changes" confirmation if they try to navigate away. The listener is removed as soon as the form is clean again (e.g. after a successful save calls `reset(values)`)
- In development, mounts `@hookform/devtools` for inspecting form state

---

### `src/components/fundraisers/fundraiser-form-schema.ts`

The single source of truth for the fundraiser form shape, shared by create and edit. Exports:

- `fundraiserFormSchema` — the Zod schema used by both flows
- `FundraiserFormValues` — `z.infer<typeof fundraiserFormSchema>`
- `buildDefaultCreateValues(pathname)` — produces the blank-form defaults for create; picks an initial theme via `getThemeForPath(pathname)` so first paint matches the route
- `fundraiserToFormValues(fundraiser)` — produces the defaults for edit; maps API shape → form shape

Noteworthy schema details:

- `description` uses `refine(v => getRichTextTextContent(v).length > 0)` so an empty `<p></p>` HTML string fails validation the same way empty text would
- `goalAmount` enforces `GOAL_AMOUNT_MIN` with error key `minAmount` and a required error key `required` — the form reads these keys via `next-intl`
- `status` is either `draft` or `active`; `fundraiserToFormValues` maps from the API's `canDonate` boolean (`canDonate ? 'active' : 'draft'`)
- `country` is narrowed to `AllowedCountry`; anything outside the allow-list is coerced to `'ROW'`

`buildExistingSelectedImage` converts the fundraiser's stored image reference into the form's `SelectedImage` shape. Absolute URLs are used as-is; relative refs are resolved through `getImageUrl('fundraiser', 'large' | 'small', image)`. The result is tagged `source: 'upload'` / `uploadStatus: 'completed'` so `ImageSelector` treats it as an already-uploaded image.

---

### `src/components/fundraisers/fundraiser-form-body.tsx`

Shared layout for the create and edit forms. Takes a `mode: 'create' | 'edit'` and a `submitButton` ReactNode, plus optional `initialExtraProjects` / `initialAllocations` used to seed `ProjectSelection` on edit and optional `totalRaised` / `endDate` forwarded to `GoalPreview` on edit.

Three edit-specific branches via `const isEditMode = mode === 'edit'`:

- `ImageSelector autoLoadDefault={!isEditMode}` — on edit the image is hydrated from the fundraiser, so the "load a default image" behavior is off
- `WorkspaceSelector disabled={isEditMode}` — the workspace (and therefore country/currency) is immutable after creation
- `GoalPreview isEditMode totalRaised endDate` — the sidebar preview is hydrated from server data in edit mode; on create it falls back to a stubbed preview derived from the watched goal amount (see `goal-preview.tsx` below)

All other sections (`Title`, `ContributionSettings`, `DescriptionInput`, `GoalInput`, `WorkspaceInfo`, `ProjectSelection`, `ThemeSettings`, `Options`, `DonorsPreview`) are mode-agnostic and read from the form context.

---

### `src/components/fundraisers/goal-preview.tsx`

Sidebar preview showing raised amount, progress bar, and days-left. Reads `goalAmount` and `currency` from the form context via `useWatch` and branches on the `isEditMode` prop:

- **Create mode** — `raisedAmount` is a 40% stub of the watched goal, `progressPercentage` is locked at `PREVIEW_PROGRESS_PERCENTAGE = 40`, and `daysLeft` is the `PREVIEW_DAYS_LEFT = 42` placeholder. The preview updates live as the user types the goal.
- **Edit mode** — uses the server values passed in by `FundraiserFormBody`:
  - `raisedAmount = toSafeNumber(totalRaised)` — `undefined`/`null`/`NaN` collapse to `0`
  - `progressPercentage = min(100, round(raisedAmount / goalAmount * 100))`, guarded against a zero or missing goal
  - `daysLeft = getDaysLeft(endDate)` from `@/lib/utils/fundraiser`; if `endDate` is missing the preview falls back to `PREVIEW_DAYS_LEFT` rather than crashing

Why `goalAmount` still comes from the form even in edit mode: the user can change the goal, and the progress bar should re-scale live against the new target while `raisedAmount` stays anchored to the server value.

`isEditMode` is passed in as a precomputed boolean (not the raw `mode` string) to keep the component decoupled from the create/edit vocabulary — it only cares whether it has real data or needs to stub.

---

### `src/components/fundraisers/update-fundraiser-button.tsx`

Renders the submit button and owns the submission flow.

**Short-circuits:**

- No `accessToken` → no-op
- `!formState.isDirty` → no-op (the button is also `disabled` in this state)

**Image handling:** the image is considered dirty only if both of these are true:

1. `formState.dirtyFields.image` is truthy
2. The current image's `url` differs from the baseline image's `url` (guards against RHF marking the field dirty when the object identity changed but the content did not)

When the image is genuinely new and sourced from Unsplash, `unsplashClient.trackDownload(downloadLocation)` is called (fire-and-forget; a warning is logged on failure but never blocks the submit). The image is then base64-encoded via `imageToBase64` and attached as `imageFile`.

**Payload:** `buildUpdateFundraiserRequest(values, dirtyFields, imageFile)` is called after the image work so the `imageFile` addition is the last step. On success, `reset(values)` clears the dirty state so the `beforeunload` guard detaches and a second immediate click is a no-op. Toasts use `Fundraisers.edit.formSubmission.*` translation keys.

---

### `src/lib/utils/fundraiser-data-builder.ts`

`buildUpdateFundraiserRequest` performs a dirty-field projection from `FundraiserFormValues` onto `UpdateFundraiserRequest`. Each scalar field (`title`, `description`, `goalAmount`, `visibility`) is copied only when its dirty flag is set.

Two compound fields need custom "is this dirty?" logic:

- **`settings.theme`** — `isThemeDirty` walks the nested dirty object and returns true if any theme sub-field is dirty; when true, the **full** theme object is sent (the API replaces the whole object, so partial updates would drop unmodified fields)
- **`projectAllocations`** — `isProjectAllocationsDirty` handles both the "array reference changed" and "a single allocation field changed" cases by checking if the dirty tracker is an array and, if so, scanning each entry

`imageFile`, when present, is always included (the caller has already decided that a new image exists).

Fields not supported in the update payload (e.g. `country`, `currency`, `status`, `startDate`, `endDate`, `tags`, `content`, `metadata`, `settings.modules`) are simply absent from `UpdateFundraiserRequest` — the create request (`buildCreateFundraiserRequest`) remains the only place that sets those.

---

### `src/lib/api/fundraiser-service.ts`

Two edit-related exports:

- **`getFundraiserAuthenticated(slug, token)`** — `GET /fundraisers/:slug` with `Authorization: Bearer`. Shared with the view flow (`FundraiserAuthRetry`); used by `useFundraiserForEdit` for the edit flow.
- **`updateFundraiser(id, data, token)`** — `PUT /fundraisers/:id` with `Authorization: Bearer`. Returns the updated `Fundraiser`.

---

## Why the form schema lives in its own file

Originally the Zod schema was colocated with `CreateFundraiserFormProvider`. The edit flow would have had two options: duplicate the schema, or import it from the create context — which would pull the create-only defaults/providers into the edit bundle.

Extracting `fundraiser-form-schema.ts` keeps the schema, the form value type, **and** the two default-value builders (`buildDefaultCreateValues`, `fundraiserToFormValues`) in one place. The create and edit providers each import only what they need; the schema stays a single source of truth for field shape and validation rules.

---

## Why the form body is mode-aware

An earlier sketch had two sibling components (`CreateFundraiserFormBody`, `EditFundraiserFormBody`) that rendered nearly identical layouts. They immediately drifted — ordering tweaks in one were missed in the other.

`FundraiserFormBody mode={'create' | 'edit'}` centralizes the layout and pushes the only real differences (workspace disabled, image default-load suppressed, submit button slot, project seeding) through the `mode` flag and a `submitButton` prop. Sections that need their own mode-awareness (e.g. `Options mode={mode}`) receive it explicitly.

---

## Why owner-only authorization

Platform policy restricts editing to users with an `owner` host role. The client performs the check defensively in `isUserAuthorized` so admins and other non-owner viewers get the unauthorized screen before they can type into the form, instead of seeing a cryptic `403` at submit time. The server remains authoritative — this is UX, not security.

---

## Translation keys

Keys live under `Fundraisers.edit.*` in `locales/en/fundraisers.json` and `locales/de/fundraisers.json`:

- `loading`
- `notFoundTitle`, `notFoundDescription`
- `unauthorizedTitle`, `unauthorizedDescription`
- `backToDashboard`
- `formSubmission.buttonProcessing`, `formSubmission.buttonSubmit`
- `formSubmission.successMessage`, `formSubmission.errorMessage`
