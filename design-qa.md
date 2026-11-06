# SchoolScope Little Discoveries design QA

Date: 6 November 2026 (Australia/Sydney)

## Comparison target and evidence

- Source visual truth: `/Users/tomhegarty/.codex/generated_images/01a1af18-341b-7d91-8670-b64731977f3b/exec-245a731d-050e-48dd-9ed0-14fd1aacf39c.png` (the third displayed homepage concept selected by the user).
- Source pixels: 1487 × 1058.
- Browser: Codex in-app browser, localhost:3000, signed-in homepage, light theme, page at top with pointer moved away from navigation.
- Desktop CSS viewport: 1487 × 1058, devicePixelRatio 1. Browser screenshot content: 1472 × 1047, normalized by about 1.0102 to 1487 × 1058 for the comparison; no device chrome was added.
- Initial capture: `/Users/tomhegarty/.codex/visualizations/2026/11/06/01a1af18-341b-7d91-8670-b64731977f3b/option-3/home-desktop-initial.png`.
- Final capture: `/Users/tomhegarty/.codex/visualizations/2026/11/06/01a1af18-341b-7d91-8670-b64731977f3b/option-3/home-desktop-final.png`.
- Full-view side-by-side comparison, source left and implementation right: `option-3/comparison-final.png` in the same evidence directory above.
- Focused hero copy comparison, source left and implementation right: `option-3/comparison-hero-copy.png` in the same evidence directory.
- Phone evidence: `option-3/home-phone.png` at 390 × 844 and `option-3/home-narrow.png` at 320 × 740.

The source and implementation were opened together in each combined comparison input. The focused hero comparison checked headline wrapping, paragraph line breaks, the primary action and preview notice. The full view checked the illustration, hero proportions, shared navigation and lower school/calendar rows.

## Comparison history

1. Initial result: blocked. [P2] The hero paragraph wrapped after “work” rather than “you”, and the main copy sat slightly higher than the selected composition. Reduced desktop paragraph width to 575px and adjusted hero vertical padding while preserving its overall height.
2. Final comparison: the paragraph now has the selected line breaks; the hero, action and artwork retain the intended hierarchy. Both phone widths preserve readable two-line headlines, visible preview wording, a full-width primary action, compact artwork and the persistent navigation. No horizontal overflow was measured (390 viewport / 375 content; 320 viewport / 307 content).

## Required fidelity surfaces

- Fonts/typography: variable Nunito provides the rounded heavy display and readable body treatment. Headline, button, support headings and disclosure remain real selectable text. The two-line heading and paragraph hierarchy match the selected direction. Small residual glyph-shape differences from the generated mock are P3.
- Spacing/layout rhythm: white shared header, full-width cream hero, approximately equal copy/art tracks, large primary action, and two lower actions with a light divider reproduce the source composition. Phones stack the content and school/calendar rows and retain safe-area navigation spacing.
- Colours/tokens: cream and yellow hero field, lavender accents, purple CTA, plum foreground, mint school icon and peach calendar icon follow the source. The wave is a generated raster asset, not a CSS drawing.
- Image quality/asset fidelity: the bespoke transparent Ripple/fraction asset was generated from the selected reference, placed at its natural ratio and delivered through Next Image. Exactly two of four equal tiles are shaded. Caption remains in the illustration and has equivalent accessible alt text. The separate wave background follows the source. The shared logo and standard UI icons remain the existing icon components, with no custom SVG approximations.
- Copy/content: selected headline, tutor description, primary action, adult-preview/fictional-learner wording, lower school/calendar actions and community line are retained. Privacy, terms and state directory links remain available below the composition in a compact footer.

## Interactions and checks

- Meet Ripple opens the existing adult-demo setup; it does not request microphone access or create a lesson from the homepage.
- Signed-in calendar points to the dashboard; guest calendar points to sign-in. Schools and shared navigation retain their original routes.
- Actual authentication/profile controls remain in the shared header, with active navigation, keyboard focus and labelled buttons.
- Tutor lesson review, hints, chat, notes and worksheet panels were checked in the preceding shared-design pass. The current integration gate passed 10 unit checks, 10 isolated database checks and 12 real-AI public API checks. Synthetic voice verification received a full spoken explanation, a delegated canvas update and a saved summary without using a real microphone.
- Production build, TypeScript and anonymous/forged-session authentication smoke passed.
- Browser console was inspected: development Fast Refresh messages only, no console errors in the homepage review.

## Findings

No actionable P0, P1 or P2 design mismatches remain.

## Open questions

None blocking. The phone layout is a responsive adaptation of the selected desktop concept rather than a separately supplied phone mockup.

## Follow-up polish

[P3] Generated illustration details and precise glyph shapes vary slightly from the raster concept. Existing logo/account controls are retained as functional components. A compact legal/state footer is intentionally available below the reference's initial viewport.

## Implementation checklist

- [x] Exact selected concept resolved and inspected.
- [x] Custom assets generated, inspected and placed in the project.
- [x] Desktop and two phone widths captured and checked.
- [x] Full and focused source/implementation comparisons completed after fixes.
- [x] Navigation, preview gate, real tutor integration and build checks passed.

final result: passed
