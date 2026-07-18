# Generate study visuals without changing the experiment

This guide defines how to create OptBot visual targets and production stimulus assets. Follow it when you add or revise a notice condition, supporting diagram, or interface reference.

## Document plan

- **Content type**: How-to
- **Goal**: Generate a reviewable visual while preserving the study contract
- **Audience**: Designers and engineers changing the privacy-notice study
- **Scope**: Reference images, production assets, prompts, storage, and review gates
- **Open question**: Confirm the manipulated attributes before generating a new condition

## Preserve the study contract

Generated visuals may change only the declared treatment block. Keep these elements fixed across randomized conditions:

- Study shell, page hierarchy, spacing, and navigation
- Complete disclosure copy, section order, and reading width
- Notice A and Notice B slot assignment for the current session
- Code-native identity icon assigned to each notice
- Required acknowledgements and progression rules
- Answer identifiers and response metadata fields

Use Lucide icons for Notice A and Notice B identities. Do not generate these icons as raster images. Code-native icons remain sharp, accessible, and stable across review and preference screens.

## Choose the asset class

Choose one asset class before writing a prompt:

| Asset | Use | Destination |
| --- | --- | --- |
| Interface target | Approve hierarchy and composition before implementation | `tmp/design/` |
| Treatment illustration | Add a bitmap inside one declared treatment block | `src/assets/stimuli/visual_design_variant_id/` |
| Notice identity icon | Keep the same notice recognizable across the flow | Use the Lucide component in React |
| Disclosure diagram | Present exact labels and relationships | Prefer HTML, CSS, or SVG in the component |

Keep supplied screenshots and PDFs in `design-references/`. That directory is local inspection material and must stay untracked.

## Generate and implement a visual

1. Capture the current desktop and mobile surface.
2. State the single manipulated attribute and the fixed invariants.
3. Use the built-in `imagegen` workflow to create at least one interface target before frontend code.
4. Select one target and record its dimensions.
5. Implement the target inside the treatment boundary.
6. Capture the implementation at the same dimensions.
7. Compare hierarchy, type, spacing, geometry, content density, and state treatment.
8. Revise the implementation until the material mismatches are gone.
9. Bump `visualDesignVariantId` when the participant-visible treatment changes.
10. Verify both presentation orders and all three assigned variants.

Do not use the image generation command-line interface unless the task explicitly requires it. Do not commit targets from `tmp/design/`.

## Prompt an interface target

Replace each snake-case placeholder before sending this prompt to `imagegen`:

```text
Create a desktop UI reference for the OptBot privacy-notice study.
Canvas: 1440 by 900 pixels. Dark neutral consent-ledger interface.
Screen: notice_slot review for variant_name.
Single job: let a participant read one notice and acknowledge it.
Keep the OptBot header, 10-step segmented progress, title, prompt,
Back action, and gated primary action.
Show one persistent monoline identity icon beside notice_slot.
Put treatment_goal inside one bordered treatment block.
Place the complete disclosure below it in a neutral shared layout.
No gradients, glass, floating cards, decorative illustration, or filler.
Use square 6 to 9 pixel control radii and restrained shadows.
Keep all text legible and all controls visibly keyboard-focusable.
```

Generate a second target at 390 by 844 pixels. Keep the same hierarchy and notice identity instead of inventing a mobile adaptation.

## Prompt a treatment illustration

Use this prompt only when a bitmap communicates the declared treatment better than native layout:

```text
Create one editorial privacy illustration for treatment_goal.
Composition: subject_description with one clear focal point.
Style: flat restrained shapes, charcoal and ivory base, accent_color.
Background: solid background_color with clean edge separation.
No interface chrome, text, labels, logos, badges, gradients, or glow.
No faces, hands, locks made of light, or generic glowing brain imagery.
Leave safe negative space for the adjacent HTML heading and summary.
Output: 1536 by 1024 pixels, opaque background, no watermark.
```

Keep words and numeric labels in HTML. Generated text is not a stable research stimulus or an accessible content source.

## Prompt a controlled revision

Use image editing when one approved target needs a bounded change:

```text
Edit the supplied OptBot target. Change only requested_change.
Keep canvas size, shell geometry, typography, copy, notice identity,
complete disclosure, progress, controls, and spacing unchanged.
Do not add sections, icons, badges, shadows, gradients, or decoration.
Return one full-screen target with the original crop and alignment.
```

A controlled edit prevents the model from changing several experimental variables at once.

## Review generated assets

Approve an asset only when each check passes:

- The treatment change matches one declared `designAttributes` field
- The shared disclosure remains verbatim and in the same order
- Notice A and Notice B identities match their session slots
- The asset contains no generated body copy or required instructions
- Alternative text states the information conveyed by the asset
- Desktop and mobile captures preserve the same hierarchy
- The response records order, assigned slot, notice variant, and visual design version
- The project check and full preview flow pass before release

Record the prompt and selected output path in the pull request description. Disclose generated-image use even when the target stays temporary.
