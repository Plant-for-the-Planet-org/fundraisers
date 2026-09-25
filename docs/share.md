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
| `src/components/share/share-studio.tsx` | The UI: host variant in the dashboard Share tab, donor variant on the thank-you screen. |
| `src/app/api/share-image/[slug]` | The link preview image, drawn on the server with `@napi-rs/canvas`. |
| `src/app/api/share/photo/[slug]` | The cover photo from our origin, so a canvas that draws it can still be exported. |

## Formats and safe zones

All vertical formats are 1080×1920 and differ only in what the app covers. The layout fills whatever zone it gets; a tight zone shrinks the ring first, then drops the avatars, then scales the text.

| Format | Size | Zone (x, y, w, h) | Used for |
| --- | --- | --- | --- |
| `story` | 1080×1920 | 65, 250, 950, 1420 | Instagram, Facebook, WhatsApp Status |
| `tiktok` | 1080×1920 | 150, 140, 780, 1380 | TikTok: narrowed on both sides so the column stays centred and clear of the buttons |
| `shorts` | 1080×1920 | 120, 380, 840, 1160 | YouTube Shorts |
| `post` | 1080×1350 | 60, 70, 960, 1210 | 4:5 feed posts. The Instagram grid crops to 3:4, about 34px per side |
| `banner` | 1200×630 | 60, 40, 1080, 550 | Link previews, LinkedIn wide posts, email |
| `wide` | 1200×675 | 60, 50, 1080, 575 | X feed images |

The zones come from creator guides, not official specs. Check a new format with `guides: true`, which draws the zone.

## Seasons

A season is a set of optional drawing hooks (`render/types.ts`, `Season`): palette, background, ring ticks, ring tip, behind the photo, on the photo, on the button, around the button. The plain theme is the season with no hooks. Christmas and Halloween bring their own palette; Birthday keeps the fundraiser's.

Christmas wording follows the fundraiser's project purposes (`cta.ts`), since not every project plants trees. Mixed or unknown purposes get the neutral "A gift for the planet".

## Sharing a file

Files are made as soon as a choice changes, not on the tap: Safari only opens the share sheet right after a tap. Where the share sheet takes files (most phones), the button opens it; the link or caption is copied first, because a story cannot carry a link. Elsewhere the button downloads the file, and on desktop a QR code opens the same page on the phone.

## Link preview

`generateMetadata` on `/raise/[slug]` points `og:image` at `/api/share-image/<slug>?l=<locale>&v=<window>`.

- The route draws the banner in the fundraiser's theme with live progress, and keeps one render per fundraiser and locale for 2 hours.
- `v` changes every 2 hours, so a crawler that caches images by URL (LinkedIn, Facebook, X) fetches new numbers the next time it reads the page. A preview already posted never changes.
- Fonts come from Google Fonts on the server, once per process; a failed download falls back to a system font. Any failure redirects to the cover photo, so a link never previews blank.

## Ref codes

`?ref=<code>` on a link says whose share it is.

- The code is the sharer's own, from the profile (`referralCode`, a placeholder name until the platform returns it; see `referral.ts`). Until then links carry no `ref`.
- Only codes that look like one (`isValidRefCode`) are used or counted.
- Nothing is stored on the device: the landing page sends a `share_visit` event, and the donation events read the code from the URL at submit time, like the UTM tags. The overlay never leaves the page, so the URL still has it.
- Insights counts `share_visit` and `donation_completed` per code (see `docs/insights.md`). The host's own code shows as "Your links"; others show their code until the platform offers a name lookup.

## Donors on the image

Only when the leaderboard is on, shown and not anonymised, and at least 3 public donors exist. First names only; anonymous donors are left out.
