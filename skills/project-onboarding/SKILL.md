---
name: project-onboarding
description: Guided intake and design-direction setup for a brand-new project. Use this skill when the user is starting a new project from scratch and needs to confirm business basics, pick a design system, choose hero and section mockups, and persist the result to design tokens and a plan file.
---

# Onboarding

The user is starting a brand-new project. Confirm a few business basics, agree on a design direction, write the design tokens file, generate section mockups for the main page, and persist every selection to the assigned plan file before exiting.

## Rules

- Use `ask_question` ONLY for the four scoped uses: intake confirmation, design-system pick, hero pick, and the section list (only when you cannot infer it from the initial prompt).
- No follow-up clarifications, no recap questions, no "anything else?". If something is missing, infer a sensible default instead of asking.
- When the user provides their own brand colors or a color scheme, build one of the four design-system variants on that palette exactly, deriving only the token slots the palette does not specify. A palette can also be extracted from an image the user provided and offered the same way, as one variant among the four. The other variants still explore their own directions, so the picker presents the on-brand option alongside genuine alternatives; if the user picks it, those colors carry into the design tokens unchanged.
- A provided inspiration or direction image replaces the hero step: skip generating hero mockups and the hero pick, treat the provided image as the chosen hero, and generate only the remaining sections while letting it steer the design direction.
- When a provided image has a url, pass it as a `referenceImages` entry to the generation it should guide, so the produced asset stays based on it.

## Step 1: Intake confirmation

Issue ONE `ask_question` call whose `questions` array contains EXACTLY these three entries, in order. Never collapse the array down to one or two questions; all three must be present in the same call. Bake the current best-guess value into each question text (e.g. `Shop name (current: "Wildmoor Botanicals")`) with a SINGLE option labeled `Yes, that's right`. The user either confirms or types a correction in the free-text field.

1. Shop name.
2. Business model (subscription, one-time, hybrid, etc.).
3. Business category (coffee, beauty, pet, fashion, etc.).

Defaults come from the project-reminder Shop Information section (Shop Name, Business Model, Business Category). The user's initial prompt OVERRIDES those defaults: if the prompt names the shop, states a model, or implies a category, use what the user wrote. Only fall back to Shop Information when the prompt is silent on that field.

## Step 2: Design-system variants

- Issue exactly four `generate_design_system` calls in PARALLEL. Variants must be distinct directions (for example minimal, playful, luxe, editorial), not four shades of the same idea. Use the confirmed intake to inform direction.
- In the SAME turn, call `ask_question` ONCE with FIVE options: one per variant (four total) plus a final option labeled `Try more variants`. If the user picks `Try more variants`, repeat this step — generate four FRESH design-system variants (different directions from the previous batch, not slight tweaks) and ask again.

## Step 3: Hero mockups

- Call `generate_design_inspiration_image` with an `images` array of exactly four hero-section mockup requests. Each of the four prompts MUST use a DIFFERENT broad style descriptor so the user sees four genuinely distinct rendering directions, not four variations of the same look. Each mockup MUST include a navigation bar at the top (logo, nav links, cart/account). The prompt may include what the user has stated anywhere in the conversation, the raw token values from the chosen design system (colors, typography, spacing, rounded), and the per-mockup style descriptor. Do NOT pass the design system's `name` field as a label; tokens should drive brand palette and typography while the per-mockup style descriptor guides the rendering.
- In the SAME turn, call `ask_question` ONCE with FIVE options: four `kind: 'image'` options (one per mockup, with that mockup's URL as `imageUrl`) plus a final option labeled `Try more mockups`. If the user picks `Try more mockups`, repeat this step — generate four FRESH hero mockups (different compositions/angles, not slight tweaks of the previous batch) and ask again.

## Step 4: Write design tokens

Only after step 3 returns. Write the design tokens file at `/project/workspace/.subbly/memory/DESIGN.md`. This file is explicitly writable even when in plan mode — the plan-mode write restriction does NOT apply to it, so do not skip this step or defer the write.

READ `/project/workspace/.subbly/memory/DESIGN.md` first — that file is the canonical shape (every shadcn color slot, the full xs-through-6xl typography scale, spacing, rounded scale, and the seven body sections: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Do's and Don'ts). Use it as the template: replace the neutral default values with concrete tokens that match the chosen design system, keep every key present (do not drop slots), and keep each body section to 2-3 sentences MAX — brand-relevant and actionable, no filler.

## Step 5: Section mockups for the main page

- If the user's initial prompt named specific sections, use exactly the sections the user listed. Do not pad the list with extras the user did not ask for, and do not drop anything the user did ask for.
- If the user did NOT specify sections in initial user prompt, default to these 5: Hero, Features, Social proof, CTA, Footer.
- Do NOT regenerate the hero image; the URL chosen in step 3 is reused.
- Generate one image per remaining section (everything except hero). Use a `generate_design_inspiration_image` call with one entry per remaining section. On EVERY entry, pass the chosen hero mockup URL via `referenceImages` so visual style stays consistent across sections. Same prompt rule as Step 3: user-stated content, raw tokens, and broad style descriptors are all fine; never pass the design system `name` as a label.

## Step 6: Plan production assets

- READ every inspiration mockup file from Step 3 (hero) and Step 5 (sections) with `read_file`, all in parallel. You must actually see the images to plan accurately; do not plan from memory of the prompts.
- Enumerate every image the production implementation will need per section: main section image, icons, logos, decorative shapes (blobs, doodles, floating elements), and background ornaments.
- Combine assets that always render together as one composed visual into a single generated image rather than separate layers. Fewer generation calls, the composition stays exactly as the inspiration shows it, and a whole class of runtime alignment, scale, and color-bleed issues from stacked assets disappears. Split into separate assets only when the layers genuinely need to move, animate, or render conditionally.
- Assign a transparency requirement to each enumerated image. Be deliberate — a wrong choice is expensive to fix later, and when in doubt default to transparent, since a transparent asset composes correctly over any background while a solid asset with a near-but-not-exact background color leaks a visible seam the moment the page background shifts. Transparent applies to logos, icons, decorative blobs / doodles / floating assets, and section background ornaments meant to overlay the page; pick transparent even when the intended background looks similar to a solid fill, because similarity is not a match and breakpoint or theme changes will expose the mismatch. Solid is reserved for product photography and images explicitly meant to read as a contained, bordered tile (e.g. a card thumbnail with its own visual frame) — if the asset will sit directly on the page without a container, it is not solid.
- SKIP generating customer avatars. Record avatar slots as placeholders (gradient circles, initials, or generic portraits) for the next pass to fill in — do NOT plan an avatar image generation.
- Plan mobile rendering for every decorative element. Blobs, doodles, and floating assets that look polished on desktop often crowd, clip, or look awkward on narrow screens. For each such element, pick one of: (a) reposition / shrink at a breakpoint, (b) hide below a breakpoint, (c) swap for a simpler mobile variant. The chosen approach must go into the plan file so the next pass implements the breakpoint behaviour, not just the desktop layout.

The output of this step is the row data for the global `assets` table you write into the plan file in Step 7.

## Step 7: Write the plan file

Only if currently in plan mode. If you are NOT in plan mode, skip this step entirely (and skip Step 8) — do not write a plan file, do not call `exit_plan_mode`.

Write a concise summary containing:

- Confirmed intake: shop name, business model, business category.
- Brand voice: three words inferred from the intake.
- Chosen design system: name plus a one-line description.
- Design overview: 2-3 sentences describing the overall direction — how the tokens, hero composition, and section flow come together visually. This is the only place in the plan where interpretive brand language belongs.
- Chosen hero inspiration image: BOTH the saved `path` AND the CDN `url`.
- Section list: each section's title plus its inspiration image `path` and `url`. Hero uses the path/url from step 3. Do not include the header — it renders from defaults outside this flow.
- An `assets` table (markdown) listing EVERY image / icon / logo / decorative element / placeholder the production pass must generate, aggregated across all sections. Columns: `Section`, `Asset` (short description), `Background` (`transparent` / `solid` / `placeholder`), `Mobile` (the reposition / hide / swap note for decorative elements, `—` for others), `Reference` (inspiration image path or `—`). Avatar placeholders appear as rows with `Background: placeholder` so the next pass sees them in the same surface but does not generate them. Do not invent filler rows; only list assets the section type and brand actually call for.

Then, an implementation-instructions block telling the next pass to:

- In rendered markup (`<img src>`, `next/image`, CSS `background-image`), use the CDN `url` — never the local `path`. `path` is for `read_file` only and will 404 over HTTP. Same rule for generated assets: read with `path`, render with `url`.
- Avoid `get_stock_image` for any image; prefer `generate_image` so every asset stays on-brand and consistent with the chosen design system.
- Generate the final, production section images (and every icon / additional asset row in the `assets` table, honoring each row's `Background` flag) with the `generate_image` tool (NOT `generate_design_inspiration_image`), passing the matching `Reference` path as a `referenceImages` entry on each call so the produced asset stays on-brand. Do not generate rows with `Background: placeholder`; render the placeholder treatment instead.
- After generating each hero, section, icon, or additional image, READ the resulting file back with `read_file` to verify it before moving on. If it does not match the visual direction, regenerate it.

## Step 8: Exit

Only if currently in plan mode. Call `exit_plan_mode` with a 1-3 sentence summary. The system already knows the plan path. If you are not in plan mode, end with a short conversational summary instead.