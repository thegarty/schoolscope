# Little Ripple branding

The owner selected the first logo concept, Little Ripple, on 7 November 2026 (Sydney). The SchoolScope name stays unchanged. Ripple is the yellow smiling lightbulb with curved purple eyes, a purple base and three golden rays.

## Shared foundations

- Typeface: Nunito, provided once by the root layout.
- Primary purple: `#7046d4`; hover: `#5e36bc`.
- Deep plum text: `#342248`; muted text: `#706479`.
- Warm cream: `#fff9e6` for hero/auth surfaces, `#fffcf3` for application backgrounds.
- White content surfaces, rounded corners, restrained borders and clear focus rings.
- Keep semantic success, error and warning colours distinct from branding.

`SchoolScopeBrand` owns the logo and wordmark. `AppHeader`, `AppFooter` and `AuthShell` use it. School-building icons still denote schools; they no longer serve as the company logo. Do not add diagonal outbound-arrow shapes.

## Assets

`public/brand/ripple-master.png` is the transparent image-generation source. `ripple-mark.png` is trimmed and optimised for interfaces. The favicon and Apple touch icon derive from the same approved mark. The Open Graph route composes the mark with the name and homepage phrase.

Generated using the built-in image generation tool with the selected concept as reference. Final prompt: Extract/recreate only the selected main smiling lightbulb logo symbol, without text, on transparent background. Preserve the cheerful yellow bulb, curved purple eyes, smiling plum mouth with pink tongue, purple two-band screw base, rounded bottom and three short golden rays. No arms, backdrop, wordmark, shadow or alternate versions. Centre with balanced padding and clean edges at icon size.

## Release scope

This is a presentation release. It does not change identity ownership, school data, event logic, tutoring controls, or the adult-only demo gate. Curriculum work in the development checkout is excluded from the release snapshot. Only the main web service needs deployment; the controller is unchanged.

Before release: production build, TypeScript, existing tutor unit tests, auth smoke, and browser checks on desktop and phone. Keep authenticated-only visual gaps explicit in the QA report.
