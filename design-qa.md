# Little Ripple site branding QA

Date: 7 November 2026 (Australia/Sydney)

## Visual truth and scope

Selected logo: first displayed concept, Little Ripple, at `/Users/tomhegarty/.codex/generated_images/01a1b29d-e4c1-7cd0-a0b9-c10ff77a5484/exec-a26294c3-5f3c-439a-bea4-b7bed982a01c.png` (1536 × 1024). The existing Little Discoveries homepage supplies the site layout, typography and warm palette. The concept board is a logo reference, not a replacement website layout.

The transparent derived mark is `public/brand/ripple-master.png`; the optimised mark is `public/brand/ripple-mark.png`. Both preserve the smiling bulb, purple base, golden rays and pink tongue. The wordmark uses live Nunito text so it stays sharp and accessible at small sizes.

## Browser evidence

Evidence root: `/Users/tomhegarty/Documents/ChatGPT/School Scope/output/releases/little-ripple-20261107/`.

- `homepage-desktop.png`: final homepage, desktop CSS viewport 1440 × 1024, full-page pixels 1425 × 1374, density 1. The 15px difference is the browser scrollbar; no stretching or density normalization applied.
- `homepage-mobile.png`, `homepage-narrow.png`: phone layout at 375 × 812 and 320 × 740; the latter includes the final shared footer. DOM content widths 360 and 305 respectively; no horizontal overflow.
- `schools-desktop.png`, `schools-mobile.png`: shared school-search surfaces and logo, 1280 × 720 default desktop viewport and 375 × 812 phone viewport.
- `sign-in-mobile.png`: final loaded Google/email controls, 375 × 812, 360 × 1267 full-page pixels, density 1. Purple primary computed as `#7046d4`.
- `tutor-mobile.png`: adult tutor setup, consistent mark, Nunito and cream/purple palette.
- `privacy-mobile.png`: readable legal content, shared header/footer.
- `logo-comparison.png`: source logo top and browser-rendered header crop bottom, composed together for direct comparison. Interface logo uses a smaller mark-to-wordmark ratio for header legibility; that adaptation is intentional. The header crop is enlarged for inspection, so screenshot interpolation is visible; the actual interface uses the high-resolution asset.

## Required fidelity surfaces

- Typography: Nunito loaded at the root; computed body family confirmed. Rounded heavy headings and SchoolScope wordmark remain legible on desktop and phone. The root font removes the former homepage/Inter split.
- Spacing/layout: consistent shared desktop and mobile header sizing, rounded controls and restrained borders. Phone content and bottom navigation stay contained at 320 and 375 CSS px. Compact tutor navigation remains purpose-specific.
- Colours/tokens: purple `#7046d4`, plum `#342248`, cream `#fff9e6`/`#fffcf3`. SDK auth forms explicitly use the same purple even when remote branding or OS colour preference supplies another colour. Semantic success, error and warning colours remain distinct.
- Image quality: transparent generated mark is optimised from the approved reference, displayed with contain sizing. Existing homepage illustration is preserved. No handcrafted substitute art. Matching favicon, Apple icon and Open Graph image use the same mark.
- Copy/content: SchoolScope name retained, homepage copy retained, state-directory links preserved, adult-preview language retained. Legal body text is unchanged.

## Comparison history

1. Initial review identified cooler global colours, Inter on inner pages, old school-building brand marks and duplicated footers. Replaced company marks through the shared component; retained school icons for school-specific content.
2. During isolated-release validation, three school routes were missing their updated footer from the snapshot. Added them to the explicit release manifest and confirmed the shared footer in the browser. Added all eight state links to the shared footer.
3. Loaded authentication controls initially inherited a blue SDK primary. Added scoped effective-colour variables; final screenshot and computed primary show `#7046d4` and white button text.
4. Final full-view and focused-logo review: no actionable P0/P1/P2 visual findings on the verified public and authentication surfaces.

## Validation and limits

- Isolated release TypeScript and production build passed.
- Existing tutor unit tests: 10 passed.
- Authentication smoke passed: native config, anonymous/forged sessions, protected dashboard redirect, admin allowlist, cross-origin rejection.
- Browser: school search for Sydney returned 71 schools; navigation, phone layout and fully loaded sign-in controls verified. Events correctly redirects anonymous users to sign-in. No console errors in the checked browser state.
- Authenticated dashboard, children forms and admin screens use the updated shared styles/components but were not visually exercised with a signed-in account. No user data or account mutations were performed.
- The main checkout has unrelated curriculum changes and test errors. The branding-only snapshot excludes them and passed its own build/typecheck. No curriculum/database/controller changes belong to this release.

## Follow-up polish

None required for this branding release. Authenticated screen walkthrough remains an explicit coverage gap.

final result: passed

## Logo lockup alignment — 7 November 2026

Owner clarified that the requested symmetry concerns the bulb and wordmark together. Original image assets are unchanged. Reduced the mark size and spacing, contained the image inside its layout box, and aligned the complete mark with the wordmark. Local browser measurements confirmed a shared vertical centre at 46px on desktop and 37.5px on phone; the image no longer extends below its container. Evidence: `logo-alignment-local-desktop.png` and `logo-alignment-local-mobile.png` in the release evidence root. Branding-only production build passed. No application logic changed.
