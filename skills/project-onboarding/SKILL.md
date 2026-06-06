---
name: project-onboarding
description: Guided intake and design-direction setup for a brand-new project. Use this skill when the user is starting a new project from scratch.
---

# Onboarding

The user is starting a brand-new project. Confirm a few business basics, agree on a design direction, generate section mockups for the main page, and persist every selection to the assigned plan file before exiting.

## Rules

- Use `ask_question` ONLY for the four scoped uses: intake confirmation, design-system pick, hero pick, and the section list (only when you cannot infer it from the initial prompt).
- When a provided image has a url, pass it as a `referenceImages` entry to the generation it should guide, so the produced asset stays based on it.

## Copying or reusing a provided URL

When the user provides a URL and its page has been scraped:

- If the user asked to COPY the site (copy, clone, replicate, recreate, "exactly like"): the scraped site is the source of truth. Skip Step 2 and all mockup generation (Steps 3 and 4), use the scraped branding as the design direction, take the section list and order from the page, and in Step 5 reuse the scraped logo and photos by their URL while generating only what the scrape did not provide.
- If the user asked to use the site's CONTENT (get images, use the text, grab the content): run the normal flow and reuse the scraped images as real assets and the scraped text as real copy, inferring the business category from the page. Skip nothing.

## Step 1: Intake confirmation

Issue ONE `ask_question` call whose `questions` array contains EXACTLY these three entries, in order. Never collapse the array down to one or two questions; all three must be present in the same call. Bake the current best-guess value into each question text (e.g. `Shop name (current: "Wildmoor Botanicals")`) with a SINGLE option labeled `Yes, that's right`. The user either confirms or types a correction in the free-text field.

1. Shop name.
2. Business model (subscription, one-time, hybrid, etc.).
3. Business category (coffee, beauty, pet, fashion, etc.).

Defaults come from the project-reminder Shop Information section (Shop Name, Business Model, Business Category). The user's initial prompt OVERRIDES those defaults: if the prompt names the shop, states a model, or implies a category, use what the user wrote. Only fall back to Shop Information when the prompt is silent on that field.

## Step 2: Design-system variants

Issue exactly four `generate_design_system` calls in PARALLEL. The four variants MUST be visually distinct design directions, not four shades of the same idea. Differentiate them across concrete style dimensions: corner radius (for example a flat variant with no border radii, versus soft-rounded, versus pill), typography pairing, spacing density, and elevation or shadow depth. Let the confirmed intake inform each direction (for example minimal, playful, luxe, editorial). When the user provided their own brand colors or a color scheme, keep ALL FOUR variants on that palette (one variant on the palette exactly, deriving only the token slots the palette does not specify, and the other three on the same palette with at most slight shade or tint variations), but the four MUST STILL be distinct designs: differentiate them on the style dimensions above, never four identical schemas. A palette extracted from an image the user provided is treated the same way. Whichever variant the user picks, its colors carry into the design tokens unchanged.

In the SAME turn, call `ask_question` ONCE with FIVE options: one per variant (four total) plus a final option labeled `Try more variants`. If the user picks `Try more variants`, repeat this step, generating four FRESH design-system variants (different directions from the previous batch, not slight tweaks) and asking again.

## Step 3: Hero mockups

If the user provided an inspiration or direction image, skip this step: treat the provided image as the chosen hero, do not generate hero mockups and do not run the hero pick, let it steer the design direction, and continue to the remaining sections.

Otherwise, call `generate_design_inspiration_image` with an `images` array of exactly four hero-section mockup requests. Each of the four prompts MUST use a DIFFERENT broad style descriptor so the user sees four genuinely distinct rendering directions, not four variations of the same look, and each mockup MUST include a navigation bar at the top (logo, nav links, cart/account). The prompt may include what the user has stated anywhere in the conversation, the raw token values from the chosen design system (colors, typography, spacing, rounded), and the per-mockup style descriptor. Do NOT pass the design system's `name` field as a label; tokens should drive brand palette and typography while the per-mockup style descriptor guides the rendering.

In the SAME turn, call `ask_question` ONCE with FIVE options: four `kind: 'image'` options (one per mockup, with that mockup's URL as `imageUrl`) plus a final option labeled `Try more mockups`. If the user picks `Try more mockups`, repeat this step, generating four FRESH hero mockups (different compositions/angles, not slight tweaks of the previous batch) and asking again.

## Step 4: Section mockups for the main page

- If the user's initial prompt named specific sections, generate exactly those sections and no others, except that a footer is ALWAYS included even when the user did not list one. Do not pad the list with any other extras the user did not ask for, and do not drop anything the user did ask for.
- If the user did NOT specify sections in initial user prompt, default to these 5: Hero, Features, Social proof, CTA, Footer.
- Do NOT regenerate the hero image; the hero from step 3 is reused, whether that is the picked mockup or a provided inspiration image.
- Generate one image per remaining section (everything except hero). Use a `generate_design_inspiration_image` call with one entry per remaining section. On EVERY entry, pass the chosen hero URL via `referenceImages` so every section follows its visual style. Same prompt rule as Step 3: user-stated content, raw tokens, and broad style descriptors are all fine; never pass the design system `name` as a label.

## Step 5: Plan production assets

- READ every inspiration mockup file from Step 3 (hero) and Step 4 (sections) with `read_file`, all in parallel. You must actually see the images to plan accurately.
- Enumerate every image the production implementation will need per section: main section image, icons, logos, decorative shapes (blobs, doodles, floating elements), and background ornaments.
- Combine assets that always render together as one composed visual into a single generated image rather than separate layers. Fewer generation calls, the composition stays exactly as the inspiration shows it, and a whole class of runtime alignment, scale, and color-bleed issues from stacked assets disappears. Split into separate assets only when the layers genuinely need to move, animate, or render conditionally.
- Assign a transparency requirement to each enumerated image. Be deliberate — a wrong choice is expensive to fix later, and when in doubt default to transparent, since a transparent asset composes correctly over any background while a solid asset with a near-but-not-exact background color leaks a visible seam the moment the page background shifts. Transparent applies to logos, icons, decorative blobs / doodles / floating assets, and section background ornaments meant to overlay the page; pick transparent even when the intended background looks similar to a solid fill, because similarity is not a match and breakpoint or theme changes will expose the mismatch. Solid is reserved for product photography and images explicitly meant to read as a contained, bordered tile (e.g. a card thumbnail with its own visual frame) — if the asset will sit directly on the page without a container, it is not solid.
- SKIP generating customer avatars. Record avatar slots as placeholders (gradient circles, initials, or generic portraits) for the next pass to fill in — do NOT plan an avatar image generation.
- Plan mobile rendering for every decorative element. Blobs, doodles, and floating assets that look polished on desktop often crowd, clip, or look awkward on narrow screens. For each such element, pick one of: (a) reposition / shrink at a breakpoint, (b) hide below a breakpoint, (c) swap for a simpler mobile variant. The chosen approach must go into the plan file so the next pass implements the breakpoint behaviour, not just the desktop layout.

The output of this step is the row data for the global `assets` table you write into the plan file in Step 6.

## Step 6: Write the plan file

Only if currently in plan mode. If you are NOT in plan mode, skip this step entirely (and skip Step 7) — do not write a plan file, do not call `exit_plan_mode`.

Write a concise summary containing:

- Confirmed intake: shop name, business model, business category.
- Brand voice: three words inferred from the intake.
- Chosen design system: name plus a one-line description.
- Design overview: 2-3 sentences describing the overall direction — how the tokens, hero composition, and section flow come together visually. This is the only place in the plan where interpretive brand language belongs.
- Chosen hero inspiration image: BOTH the saved `path` AND the CDN `url`.
- Section list: each section's title plus its inspiration image `path` and `url`. Hero uses the path/url from step 3. Do not include the header — it renders from defaults outside this flow.
- An `assets` table (markdown) listing EVERY image / icon / logo / decorative element / placeholder the production pass must generate, aggregated across all sections. Columns: `Section`, `Asset` (short description), `Background` (`transparent` / `solid` / `placeholder`), `Mobile` (the reposition / hide / swap note for decorative elements, `—` for others), `Reference` (inspiration image path or `—`). Avatar placeholders appear as rows with `Background: placeholder` so the next pass sees them in the same surface but does not generate them. Do not invent filler rows; only list assets the section type and brand actually call for.

Then, an implementation-instructions block telling the next pass to:

- Update `/project/workspace/.subbly/memory/DESIGN.md` with the chosen design tokens: read it first as the canonical shape (every shadcn color slot, the full xs-through-6xl typography scale, spacing, rounded scale, and the seven body sections: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Do's and Don'ts), then replace the neutral default values with concrete tokens matching the chosen design system (or the scraped branding in copy mode), keeping every key present and each body section to 2-3 sentences max, brand-relevant and actionable.
- In rendered markup (`<img src>`, `next/image`, CSS `background-image`), use the CDN `url` — never the local `path`. `path` is for `read_file` only and will 404 over HTTP. Same rule for generated assets: read with `path`, render with `url`.
- Avoid `get_stock_image` for any image; prefer `generate_image` so every asset stays on-brand and consistent with the chosen design system.
- Generate the final, production section images (and every icon / additional asset row in the `assets` table, honoring each row's `Background` flag) with the `generate_image` tool (NOT `generate_design_inspiration_image`), passing the matching `Reference` path as a `referenceImages` entry on each call so the produced asset stays on-brand. Do not generate rows with `Background: placeholder`; render the placeholder treatment instead.
- After generating each hero, section, icon, or additional image, READ the resulting file back with `read_file` to verify it before moving on. If it does not match the visual direction, regenerate it.