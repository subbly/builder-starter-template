---
name: project-onboarding
description: Guided intake and design-direction setup for a brand-new project. Use this skill when the user is starting a new project from scratch.
---

# Onboarding

The user is starting a brand-new project. Confirm a few business basics, agree on a design direction, and generate section mockups for the main page.

## Gates

The flow has three gates: intake confirmation (Step 1), design-system pick (Step 3), hero pick (Step 5). Gate 1 is a `request_info` call; gates 2 and 3 are `ask_question` calls the user must answer before the flow continues. A gate never passes on inference: even when the prompt implies an answer, present the form or ask. Only two exceptions close a gate without asking: copy mode (gates 2 and 3, see below) and a provided inspiration image (gate 3, see Step 4).

## Copying or reusing a provided URL

When the user provides a URL and its page has been scraped, pick a mode:

- COPY MODE, only when the user explicitly asked to copy the site (copy, clone, replicate, recreate, "exactly like"): the scraped site is the source of truth. Skip the design-system steps (Steps 2 and 3) and all mockup steps (Steps 4 through 6), use the scraped branding as the design direction, take the section list and order from the page, and reuse the scraped logo and photos by their URL, generating only what the scrape did not provide.
- CONTENT MODE, every other reason a URL appears (get images, use the text, grab the content, or no stated reason at all): run the normal flow and reuse the scraped images as real assets and the scraped text as real copy, inferring the business category from the page.

## Step 1: Intake confirmation

Call `request_info` ONCE with the `business-profile` form. The form collects shop name, business model, business category, and primary color; the user confirms or corrects the values in place, and submitted values are persisted to the shop automatically.

Prefill every field with your best guess: initial prompt first, project-reminder Shop Information as fallback. For primary color, when neither source has one, propose a hex that suits the business. A known value changes the prefill, never whether you present the form.

Gate 1: the form submitted, or dismissed (continue with your best guesses), before Step 2.

## Step 2: Design-system variants

Issue exactly four `generate_design_system` calls in PARALLEL.

- Before generating, commit to four contrasting mood archetypes informed by the intake and give each variant one. The archetypes drive the palettes apart; four shades of one idea is a failed batch.
- Color is the first differentiation axis. Lead each variant with a different hue family instead of rotating the same few hues between slots, spread the backgrounds across the batch (light, dark, tinted) instead of defaulting every variant to white or cream, and let at most one variant lean on the obvious palette for the business category while the others explore directions a designer would still defend.
- Also differentiate on corner radius (flat, soft-rounded, pill), typography pairing, spacing density, elevation.
- When the batch is a repeat via `Try more variants`, the no-repeat hue rules extend over every previously shown variant: rejected palettes never reappear.
- If the user provided brand colors or a palette (including a primary color submitted at intake or one extracted from an image), all four keep the given values exact but rotate the role the color plays: primary in one, accent in another, set against a dark or tinted background in a third, one contrasting scheme so the user can compare. Derive the remaining slots differently per variant, never four shadings of one palette.

## Step 3: Design-system pick

When all four return, immediately call `ask_question` ONCE, nothing in between: one option per variant plus `Try more variants`. The pick's colors carry into the design tokens unchanged. `Try more variants` repeats Step 2 with four FRESH directions, then asks again.

Gate 2: a variant selected (or a direction typed as correction) before Step 4.

## Step 4: Hero mockups

If the user provided an inspiration or direction image, skip this step and Step 5: treat the provided image as the chosen hero (this closes gate 3), do not generate hero mockups and do not run the hero pick, let it steer the design direction, and continue to the remaining sections. Only an image showing a page or hero layout counts as an inspiration image. A logo, a product photo, or a color or palette image does not close the gate: those feed `referenceImages` and the Step 2 palette while this step runs in full.

Otherwise, call `generate_design_inspiration_image` with an `images` array of exactly four hero-section mockup requests, each a genuinely different direction. These mockups are the contract the production pass will recreate in HTML, and the prompt is the only quality lever: write the prompts and vary the batch by the `generate-design-inspiration-image` skill. Include what the user has stated anywhere in the conversation plus the raw token values from the chosen design system (colors, typography, spacing, rounded). Each mockup MUST include a navigation bar at the top (logo, nav links, cart/account).

## Step 5: Hero pick

Call `ask_question` ONCE: one `kind: 'image'` option per mockup (URL as `imageUrl`) plus `Try more mockups`, which repeats Step 4 with four fresh genres and asks again; the skill's pairwise test now includes every prior batch's prompts, so rejected genres never reappear.

Gate 3: a hero picked, or closed by a provided inspiration image, before Step 6.

## Step 6: Section mockups for the main page

- If the user's initial prompt named specific sections, generate exactly those sections and no others, except that a hero and a footer are ALWAYS included even when the user did not list them. The hero always exists: it is the Step 5 pick or the provided inspiration image, and a section list that omits it does not remove it. Do not pad the list with any other extras the user did not ask for, and do not drop anything the user did ask for.
- If the user did NOT specify sections in initial user prompt, default to these 5: Hero, Features, Social proof, CTA, Footer.
- Do NOT regenerate the hero image; the chosen hero is reused, whether that is the Step 5 pick or a provided inspiration image.
- Mock up every remaining section (everything except hero) with `generate_design_inspiration_image`, per the generate-design-inspiration-image skill, writing each prompt with user-stated content and raw tokens. On EVERY entry, pass the chosen hero URL via `referenceImages` so every section follows its visual style.

## Implementation rules

- Build the page with product placeholders: any product section or product content uses placeholder products (placeholder names, prices, images), not real store products. Include real products only when the user explicitly asked to include products in the page.
- Animate the page with the `motion` library: add entrance, scroll, and hover animations to sections so the experience feels alive and unforgettable, not static.
- Record the selected design inspiration images in `DESIGN.md` by their URL, never by a local file path.
- In `DESIGN.md`, include a note that whoever needs to reference the design should download the image from its URL and view it.