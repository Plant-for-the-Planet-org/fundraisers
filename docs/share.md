# Sharing

Images and videos people share for a fundraiser, the link preview other apps show, and the `?ref=` code that tells a host whose shares bring visits and donations.

## Pieces

| Where | What |
| --- | --- |
| `src/lib/share/formats.ts` | Every size we make, with its safe zone: the area the app's own buttons never cover. |
| `src/lib/share/channels.ts` | Platform → ways to share on it (Instagram Story, Instagram post, …): the size, image or video, and the UTM tags. |
| `src/lib/share/render/` | The renderer. One `drawShareFrame(g, t, options)` draws any format at time `t`, in the browser and on the server. |
| `src/lib/share/share-data.ts` | Turns a fundraiser into the text on the image, with the public page's rules for the goal and for naming donors. |
| `src/lib/share/cta.ts` | Button texts, and the text a season suggests. |
| `src/lib/share/video.ts` | Encodes the animation to MP4 in the browser (WebCodecs, through `mediabunny`). |
| `src/components/share/share-studio.tsx` | The UI: host variant in the dashboard Share tab, donor variant on the thank-you screen and in the fundraiser page's Share images dialog. |
| `src/app/api/share-image/[slug]` | The link preview image, drawn on the server with `@napi-rs/canvas`. |
| `src/lib/share/render/theme-background.ts` | The fundraiser page's background (base, wash, decoration, animation) rebuilt for a canvas. |
| `src/lib/share/render/avatars.ts` | Donor avatars: the profile photo, or the app's generated avatar (same icon and colour as `FallbackAvatar`). |
| `src/app/api/share/photo/[slug]` | The fundraiser's images from our origin (cover photo, theme background, photos of the donors on the image), so a canvas that draws them can still be exported. |

## Formats and safe zones

All vertical formats are 1080×1920 and differ only in what the app covers. The layout fills whatever zone it gets; a tight zone shrinks the ring first, then drops the avatars, then scales the text. The wide formats (ring beside the text) keep the ring and only drop the avatars, then scale the text.

| Format | Size | Zone (x, y, w, h) | Used for |
| --- | --- | --- | --- |
| `story` | 1080×1920 | 65, 250, 950, 1420 | Instagram, Facebook, WhatsApp Status |
| `tiktok` | 1080×1920 | 150, 140, 780, 1380 | TikTok: narrowed on both sides so the column stays centred and clear of the buttons |
| `shorts` | 1080×1920 | 120, 380, 840, 1160 | YouTube Shorts |
| `post` | 1080×1350 | 60, 70, 960, 1210 | 4:5 feed posts. The Instagram grid crops to 3:4, about 34px per side |
| `banner` | 1200×630 | 60, 40, 1080, 550 | Link previews, LinkedIn wide posts, email |
| `wide` | 1200×676 | 60, 50, 1080, 576 | X feed images and videos. 676, not 675, because H.264 video needs an even height |

The zones come from creator guides, not official specs. Check a new format with `guides: true`, which draws the zone.

## Background, text and avatars

- The plain style and Birthday draw on the fundraiser page's own background, as ThemeShell paints it: white or black base, then the preset gradient (Tailwind classes, read with `tailwind-colors.ts`), custom gradient or solid colour, then the pattern, image or logo, then the page's animation. Christmas and Halloween bring their own colours.
- Button and badge text follow the page's rule: dark on light accents, white on dark ones (`contrast.ts`).
- Fonts are the theme's title and body fonts: read from the page in the browser, downloaded from Google Fonts on the server.
- Donors come from the top list first (grouped per person when the host turns that on, which is the default), then recent donations, like the public donor strip.
- The host line names the first active host who chose to be public. Unlike the page's host list, it never falls back to a private host when no host is public, since the dashboard's copy of a fundraiser lists private hosts too.
- No text runs past its column. A word too wide for it, such as a German compound, makes the name up to a fifth smaller so the word stays whole. A word that needs more (a name with no spaces, in Japanese say) breaks between characters, and a name longer than three lines ends in "…". The host, amount, donor and link lines shrink to fit, down to 70% of their size; past that, `fillText` narrows them.
- Nothing raised yet: the badge says "New", the amount line shows the goal, and a dashed empty avatar invites the first gift. An ended fundraiser thanks people, with confetti. Over the goal, the badge shows the real percentage.

## Seasons

A season is a set of optional drawing hooks (`render/types.ts`, `Season`): palette, background, ring ticks, ring tip, behind the photo, on the photo, on the button, around the button. The plain theme is the season with no hooks. Christmas and Halloween bring their own palette; Birthday keeps the fundraiser's.

Christmas wording follows the fundraiser's project purposes (`cta.ts`), since not every project plants trees. Mixed or unknown purposes get the neutral "A gift for the planet".

## Sizes

Images export at twice the format's size (a story is 2160×3840) so text stays sharp after the app scales it; videos stay at the format's size, and the link preview at 1200×630, as a JPEG.

File names come from `shareFileName` (`file-name.ts`): the slug, the format, the format's size and the scale, such as `klumforest_story_1080x1920_2x.png`. A video has no scale part (`klumforest_story_1080x1920.mp4`). The host's zip is `klumforest_share-images.zip`, with the same names inside.

## Sharing a file

Files are made as soon as a choice changes, not on the tap: Safari only opens the share sheet right after a tap. Where the share sheet takes files (most phones), the button opens it. Elsewhere, such as most desktop browsers, it downloads the file.

Either way it copies first: the link alone for a story, TikTok or Short, which cannot carry a link in its text, and the caption with the link for a post. The tip under the button then says what was copied, but only when the copy worked. When it did not (some in-app browsers block the clipboard), a "Could not copy" toast shows and the tip gives only the channel's advice. A post whose advice is only to put the link in the text (`tipOnlyIfCopyFails` in `channels.ts`) shows it only after a failed copy, since the copied caption already holds the link. The tip is a `role="status"` region, so screen readers read it out.

The host's Caption card says the same: for a story, TikTok or Short its hint says that only the link is copied.

The first file waits for the fonts and the background (`ready`), and for the photo, the donors and, while "Show donors" is on, their avatars (`settled`). Each counts once it has loaded or failed, and after 2.5 s the file is made anyway. So within those 2.5 s a quick tap does not share a plain circle where the photo goes. Anything that arrives later still changes the file, and the 2x image and the 8 s video are made again. The preview does not wait; it fills in as things arrive. The host's zip waits the same way.

If the image cannot be made, the button says "Try again" and the tip line says "Could not make the image.", so screen readers hear it too. A tap tries again. On WhatsApp "Message", which shares only the link, the Share button keeps working and the download button turns into "Try again" instead. While busy, these buttons use `aria-disabled` rather than `disabled`, so a keyboard user who taps Try again keeps focus on the button. iOS Safari can hit this: it caps the memory all canvases may hold, and then gives no drawing context. So each canvas a file is drawn on, the video's included, is shrunk to 0×0 once done, which frees its memory at once rather than at the next garbage collection.

The donor studio starts on "Any app" Story where the share sheet takes files, and on "Any app" Post where the file is downloaded instead. `useCanShareFiles` knows the answer on the studio's first render (it only mounts in the browser), so the first file is made for the right format and nothing flashes. The host's Share tab always starts on Story.

## After a donation

- The thank-you screen shows the donor studio flat inside the "Share this fundraiser" card, with Copy Link beside the title: platforms, formats, the preview and the Share or Download button (in the fundraiser's accent), in one column and with no inner cards.
- That Copy Link copies the page's own link with `utm_source=thank_you`, `utm_medium=copy_link` and, for a signed-in donor, their own `ref` code. It is built by the same hook as the page's Copy Link (`useFundraiserShareUrl`), with `thank_you` as the source.
- The studio loads donors, photos and fonts and makes an 8 s video, so it only mounts once the card comes within about a screen of view (an IntersectionObserver on the overlay's scroll container). That still leaves time to make the file before the donor taps Share. Until then a placeholder of about the same height holds its place.
- After a completed payment, an "Include my contribution" box (ticked by default) adds a pill under the amount on the image ("I just gave €50!") and changes the caption to `I just gave €50 to "<name>". Join me:`. The quotes make any title read as a name.
- The amount raised on the image always counts the gift, ticked or not, because the page's totals were loaded before it. So "Be the first to give" never shows right after giving. Nothing reloads the fundraiser after a donation (the overlay never leaves the page), so the gift is not counted twice.
- A pending bank transfer or a payment still processing has no box, since no money has moved yet. Nor does an ended fundraiser.
- The link preview never shows a gift, so the WhatsApp "Message" preview, which only sends the text, leaves the gift line out too.

## On the fundraiser page

- A "Share images" button sits beside each Copy Link button on a public fundraiser, for every visitor. It is hidden while the page cannot take donations on a fundraiser that has not ended (paused, for example, or when the payment options did not load), because the images and captions ask people to give. It uses the same rule as the donation form (`canReceiveDonations`). It opens a dialog with the flat donor studio, without a gift; a host (owner or admin) also gets a link to the dashboard Share tab. The page cannot know whether the visitor gave, so the caption is a plain ask ("Please support …"), and a host gets "I'm fundraising for …".
- On an ended fundraiser, the Share button in the ended section opens the same dialog. The studio then shows its ended state: "Thank you!" on the image and the concluded caption, for hosts too.
- The dialog has Copy Link beside its title, as on the thank-you card. It and the page's sidebar Copy Link copy the same link (`useFundraiserShareUrl`): the page's own path with `utm_source=fundraiser`, `utm_medium=copy_link` and the viewer's own `ref` code, never the tags or code from the link the viewer came in on. If the copy fails, the error toast shows that link, so nobody falls back to the address bar.
- The donor studio lays itself out by its own width, with a container query, not by the viewport. From about 670px it puts the choices on the left and the preview, size line and Share or Download button on the right. The dialog is up to 768px wide on larger screens, so it gets two columns; the thank-you card's 512px column stays one.
- Side by side, the dialog caps the preview's height by the viewport (`fitHeight`, in dvh), so on a 1280×800 laptop the whole dialog fits, Share button included.
- On phones the dialog is full screen and one column, and the Share or Download button stays pinned to its bottom (`pinActions`). The thank-you card does not pin it.
- The dialog and the thank-you card both load the studio and its renderer with `next/dynamic` (on the first open, or once the card is near), so neither is in the page's first bundle.
- Both wrap the loaded studio in `StudioErrorBoundary`. If its code fails to load (a new deploy, a weak connection), both keep their title and Copy Link, and the dialog also asks to reload the page, instead of the route's error page replacing everything.

## Link preview

`generateMetadata` on `/raise/[slug]` points `og:image` at `/api/share-image/<slug>?l=<locale>&v=<version>`. The route draws the banner in the fundraiser's theme with live progress.

- `v` is a content version (`shareImageVersion`, server): a 12-character hash of what the banner draws. So the URL changes only when the image would, and a crawler that caches images by URL (LinkedIn, Facebook, X) fetches the new one the next time it reads the page. A preview already posted never changes.
- It hashes a fixed list of values, never the whole API object, so every server and every restart agree: the title, the public host name, the cover photo, the currency, the goal as shown, the amount raised after currency conversion, the donor row (first names, avatars and the donor count), whether the fundraiser has ended (worked out, since an end date can pass), the theme (accent, mode, fonts, every background setting), the leaderboard settings that decide the donor row (grouping the top list per donor included), the printed link, and the design version. The locale has its own `l`.
- So a donor who renames, removes a photo or turns anonymous gets a new URL too, even on an ended fundraiser that gets no more gifts.
- The page and the route compute the version the same way, from the same leaderboard (`loadShareLeaderboard`, with `SHARE_LEADERBOARD_LIMIT`). It is loaded only when the image can show donors. `SHARE_LEADERBOARD_LIMIT` is the page's own limit (`LEADERBOARD_PAGE_LIMIT`), so when the page body loads the leaderboard on the server it is the same request as the metadata's, and Next makes it once. If that call fails, the page uses the hash without donors, and the route redirects to the current one.
- The route loads the fundraiser and, when needed, the leaderboard (tried twice) on every request. It answers the current URL with the image, a JPEG at quality 85, and `Cache-Control: public, max-age=31536000, s-maxage=86400, immutable`, rendering once per version (in memory, up to 200 renders). Browsers may keep it for a year. The CDN keeps it for a day only, because while it holds a URL the route does not run: a donor who turns anonymous stays on the old image until the CDN lets it go.
- A render that missed a font, or an image whose download may work later (a network error, a timeout, a 408, 429 or 5xx), is partial. It gets `public, max-age=60, s-maxage=60` and stays in memory for a minute, then the next request renders it again. An image that is refused for good (a host not on the list, SVG, a 404) does not count, so it never keeps a preview off the long cache.
- Any other URL (an old `v`, none, a made-up one, a locale we do not have, or the fundraiser's GUID instead of its slug) gets a 302 to the current URL, kept for 5 minutes by browsers and the CDN (`s-maxage`), without a render. So a random `v` cannot force renders. An old `v` the CDN still holds keeps its image for up to a day before it redirects.
- Fonts come from Google Fonts on the server, once per process; a failed download falls back to a system font for that render, which makes it partial. If the fundraiser or its donor row cannot be loaded, or the render throws, the route redirects to the cover photo, or the default image, with `no-store`, so a link never previews blank and the next request tries again. It redirects to the cover only when the server may fetch from its host (`isServerImageUrl`), so our domain never redirects to just any URL in a fundraiser's image field.

The design version, `SHARE_IMAGE_DESIGN_VERSION` in `render/design-version.ts`, is in every hash. Bump it whenever the banner would look different for the same fundraiser: layout, colours, fonts or wording. Every preview then gets a new URL.
Without a bump the old image stays: each URL is cached as immutable, so a fundraiser keeps its old preview until something on it changes, and an ended one keeps it for good.

- `share-banner.test.ts` guards it. It builds sample banners through the server's own path (`prepareShareBanner`, with the real English and German strings) and draws them into a fake canvas that writes down every call. Text is as wide as its length times its font size, so fonts and machines do not matter. The hash of that record must match the entry for the current version in `render/design-fingerprints.json`.
- The samples are live, new, ended and without a goal, in both locales, and on a pattern, an image, a logo, a custom gradient and a solid colour, with each animation. The test also prints every label in both locales (`shareBannerLabels`), with both plural forms, so a wording change fails it even in a branch no sample draws.
- When it fails, bump the version and add its entry, keeping the older ones. The failure message prints the new entry; `PRINT_SHARE_FINGERPRINTS=1 npx vitest run src/lib/share/server/share-banner.test.ts --reporter=verbose` prints it too.

Next streams metadata into `<body>` for normal browsers and puts it in `<head>` only for crawlers that read HTML alone. `htmlLimitedBots` in `next.config.ts` sets that list to `LINK_PREVIEW_BOTS` (`preview-bots.ts`): Next's own list (`HTML_LIMITED_BOT_UA_RE`, imported from `next/dist`, so it follows upgrades) plus Pinterest (`Pinterestbot` and `Pinterest/0.`, not the Pinterest app's own browser), Mastodon, Misskey, Pleroma, Akkoma, Matrix (`Synapse`), Viber, Telegram, Bluesky, Snapchat, Teams and Outlook (`MicrosoftPreview`), XING, Mattermost, KakaoTalk (`kakaotalk-scrap`), Embedly and Iframely.

## Fetching images on the server

`fetchAllowedImage` (server) only contacts the platform CDN or a host on its own image list, checks each redirect hop again, caps the size, and accepts raster image types only, never SVG. So the photo route passes on nothing that could run as a page on our origin, and every response also carries `nosniff` and a `sandbox` CSP.

Its list is narrower than the form's (`isAllowedImageUrl`) and a URL must pass both: named image hosts such as `images.unsplash.com`, `<source>.imgix.net` and S3 buckets, never a whole domain like `amazonaws.com`. A theme background on any other host, or in SVG, still shows on the page, but share images draw without it.

Before the server canvas decodes a downloaded image, `fitsDecodeBudget` reads its size from the file header, because a tiny file can claim gigabytes. It refuses more than about 40 megapixels and any format it cannot read, AVIF included, so the link preview draws without that image.

## Ref codes

`?ref=<code>` on a link says whose share it is.

- The code is the sharer's own, from the profile (`referralCode`, a placeholder name until the platform returns it; see `referral.ts`). Until then links carry no `ref`.
- Only codes that look like one (`isValidRefCode`) are used or counted.
- Nothing is stored on the device: the landing page sends a `share_visit` event, and the donation events read the code from the URL at submit time, like the UTM tags. The overlay never leaves the page, so the URL still has it.
- Insights counts `share_visit` and `donation_completed` per code (see `docs/insights.md`). The host's own code shows as "Your links"; others show their code until the platform offers a name lookup.

## Donors on the image

Only when the leaderboard is on, shown and not anonymised, and at least 3 public donors exist. First names only; anonymous donors are left out.

The photo route serves a donor's photo only for someone `pickShareDonors` puts on the image. The studio, the link preview and the photo route all load the leaderboard with `SHARE_LEADERBOARD_LIMIT`, so they pick the same people.
