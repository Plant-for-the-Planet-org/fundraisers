# PRD: Rich-text link support with external-redirect warning

## Problem Statement

Fundraiser hosts write descriptions (and thank-you notes) in a rich-text editor, but they cannot add links. They want to point donors to related pages — their organisation, a campaign, an email address. Today there is no way to do that from the toolbar.

Separately, when a donor eventually clicks an outbound link, they would be sent straight off the fundraiser page. The fundraiser page exists primarily to drive donations, so sending a donor away with no friction and no notice is both a conversion risk and a trust/safety gap — donors should know when they are leaving startplanting.org.

## Solution

Add link support to the shared rich-text editor so hosts can select text and turn it into a link, edit it, remove it, or open it — all from an inline toolbar row, no dialogs while editing.

On the rendered fundraiser page, every link click is intercepted with a clear warning (shadcn AlertDialog) that tells the donor where they are going and what will happen. A 10-second countdown auto-opens web links in a new tab (so the donor keeps the fundraiser page open behind them); the donor can also go immediately or stay. The copy adapts to the link type (web / mail / phone). If the browser blocks the new tab, the donor gets a Sonner toast with the link and a copy button so they are never stuck.

## User Stories

### Host — authoring links

1. As a host, I want a Link button in the description editor toolbar, so that I can add links to my story.
2. As a host, I want a Link button in the thank-you note editor toolbar, so that I can add links to my thank-you message.
3. As a host, I want to select some text and click the Link button, so that the selected text becomes the clickable link.
4. As a host, I want an inline URL input to appear near the toolbar (not a modal), so that adding a link feels consistent with adding a video.
5. As a host, I want to press Enter to set the link, so that I can add it quickly with the keyboard.
6. As a host, I want to press Escape to close the input, so that I can cancel without adding a link.
7. As a host, I want to click inside an existing link, so that the same input row opens pre-filled with its current URL for editing.
8. As a host, I want icon-only buttons in the link input row, so that the row stays compact.
9. As a host, I want a "set/confirm" icon button, so that I can apply the URL I typed.
10. As a host, I want an "unlink" icon button, so that I can remove the link while keeping the text.
11. As a host, I want an "open in new tab" icon button, so that I can verify the link goes where I expect while editing.
12. As a host, I want typing a bare domain (e.g. `example.com`) to become an `https` link, so that I don't have to type the protocol.
13. As a host, I want pasted URLs to become links automatically, so that I don't have to link them manually.
14. As a host, I do NOT want any redirect warning while editing, so that my own links don't interrupt me.
15. As a host, I want the link I saved to render as a real link on the published fundraiser page, so that donors can use it.
16. As a host, I want links to survive saving (not silently stripped) in both the description and the thank-you note, so that my content is preserved.

### Donor — clicking links on the rendered page

17. As a donor, I want clicking a link to show a warning first, so that I know I'm about to leave the fundraiser page.
18. As a donor, I want the warning to name the destination domain, so that I can decide whether I trust it.
19. As a donor, I want a countdown showing when I'll be redirected, so that I know what will happen if I do nothing.
20. As a donor, I want a web link to open in a new tab after the countdown, so that the fundraiser page stays open behind me.
21. As a donor, I want a "Go to Link" primary button, so that I can proceed immediately without waiting.
22. As a donor, I want a "Stay Here" button, so that I can cancel and keep reading / donating.
23. As a donor, I want the dialog to close once the link opens, so that I'm not left with a stale dialog.
24. As a donor clicking a `mailto:` link, I want the dialog to say it will open my mail app and the action to read "Go to Mail", so that the message matches what actually happens.
25. As a donor clicking a `tel:` link, I want the dialog to say it will open my phone app and the action to read "Go to Phone", so that the message matches what actually happens.
26. As a donor clicking a mail/phone link, I want it to open only when I click the action button (no silent auto-fire), so that my mail/phone app isn't launched without my intent.
27. As a donor whose browser blocked the new tab, I want a toast telling me the popup was blocked, so that I understand why nothing opened.
28. As a donor whose popup was blocked, I want the toast to contain the actual link I can click, so that I can still reach the destination in a new tab.
29. As a donor whose popup was blocked, I want a copy button in the toast, so that I can copy the URL if clicking still doesn't work.
30. As a donor, I want the popup-blocked toast to appear only when a popup is genuinely blocked, so that I'm not shown false warnings.

### Cross-cutting

31. As a user in any supported locale, I want all warning and toast text translated, so that the experience is consistent with the rest of the app.
32. As a screen-reader user, I want the warning presented as an accessible dialog with a clear primary action, so that I can understand and act on it.

## Implementation Decisions

**Editor (shared `RichTextEditor`, used by both description and thank-you)**

- Enable the TipTap `Link` extension (bundled with StarterKit v3). Configure explicitly: `openOnClick: false` (clicking a link in the editor opens the edit row, it does not navigate), `autolink: true`, `linkOnPaste: true`, `defaultProtocol: 'https'`, and HTML attributes `target="_blank"`, `rel="noopener noreferrer nofollow"`.
- Add a Link toolbar button that opens an inline URL-input row, mirroring the existing video-embed input-row pattern (Enter to confirm, Escape to close, error/empty handling).
- The input row shows three icon-only buttons: confirm/set (applies `setLink`), unlink (`unsetLink`), and open-in-new-tab (native anchor behaviour, NOT `window.open`).
- Clicking inside an existing link opens the same row pre-filled with the current href for editing.
- Both description and thank-you get identical link behaviour; no per-surface gating.

**Sanitizer (`sanitize-html.ts`)**

- `sanitizeThankYouHtml`: add `<a>` to allowed tags, allow `a` attributes `href`/`title`/`rel`, allow schemes `http`/`https`/`mailto`/`tel`, and apply the same `transformTags` that forces `target="_blank"` and `rel="nofollow ugc noopener noreferrer"` — mirroring the description sanitizer.
- `sanitizeDescriptionHtml`: add `tel` to the allowed schemes (it already permits `<a>`, `http`/`https`/`mailto`, rel/target transform).

**Rendered view (`RichTextContent`)**

- Becomes a client component so it can intercept link clicks.
- A single delegated click handler on the container: if the click lands on (or inside) an `<a>`, prevent default and open the external-redirect AlertDialog with the href.
- The dialog is a shared shadcn `AlertDialog` with a 10-second countdown, a primary action button, and a "Stay Here" cancel.

**Link-intent logic (new pure util — single seam)**

- A pure function maps a URL to its "intent": scheme classification (`web` / `mail` / `tel`), destination label (domain for web, address/number otherwise), the action-button label ("Go to Link" / "Go to Mail" / "Go to Phone"), the dialog body copy key, and whether it auto-fires on countdown end.
- `web` (`http`/`https`): countdown auto-opens in a new tab via `window.open(url, '_blank', 'noopener,noreferrer')`. Detect block by inspecting the returned window reference (null / immediately closed).
- `mail`/`tel`: dialog still shows with adapted copy, but does NOT auto-fire — the donor must click the action button, which navigates to the `mailto:`/`tel:` URL (protocol handoff, no tab, no popup-block path).
- Popup-block path (web only): show a Sonner custom toast containing a block notice, an `<a href target="_blank" rel="noopener noreferrer nofollow">` link (same new-tab behaviour), and a copy-icon button reusing the existing copy pattern.

**i18n**

- All new strings added via next-intl. Use `t.rich` for any string containing an inline element (e.g. the destination link inside the toast/dialog body), per project convention.

## Testing Decisions

- The repo has no automated test framework and, per project convention, correctness is verified with `npm run type-check` and `npm run lint`, then the reviewer checks the UI. No test framework will be added for this feature.
- Good verification here focuses on observable behaviour at the seams:
  - **Sanitizer**: given host-authored HTML with links, the output preserves allowed schemes and strips disallowed ones, and forces `target`/`rel` — for both description and thank-you. This is the highest, purest seam and the most security-relevant.
  - **Link-intent util**: given a URL, it returns the correct intent (scheme, label, action text, auto-fire flag). Pure input/output.
  - **Rendered view**: clicking a link opens the dialog; the countdown/auto-open and the popup-block toast fallback behave as specified. Manual/reviewer verification.
- If the project later adopts a unit-test runner, the sanitizer and link-intent util are the natural first candidates because they are pure and carry the security and correctness weight.

## Out of Scope

- **Domain whitelist / allowed-domains list** — deferred. Every domain is allowed for now. No allow-list gate at save time.
- **Link tracking / registry** — deferred. No storage of "which links were used" for later audit or takedown.
- **Whitelist management UI** — deferred.
- **Bubble-menu editing** — not used; the inline toolbar row covers add/edit/remove.
- **Any change to thank-you note being link-free** — reversed; thank-you now supports links identically to description.

## Further Notes

- The Link extension is already bundled via StarterKit v3 and, because the current editor config does not disable it, autolink may already be partially active; this PRD makes the configuration explicit rather than relying on defaults.
- The new-tab-only rule for donor clicks is deliberate: the fundraiser page's primary goal is donations, so the donor should never be navigated away in the same tab.
- The popup-block detection must be real (based on the `window.open` return value), never a blanket toast, to avoid false "blocked" messaging.
