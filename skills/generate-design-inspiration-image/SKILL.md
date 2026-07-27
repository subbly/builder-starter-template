---
name: generate-design-inspiration-image
description: "How to work with the generate_design_inspiration_image tool. Use before every call to that tool."
---

# Working with generate_design_inspiration_image

The image model paints everything you name, and your words override the tool's built-in art direction. Creativity lives in decisions, slop lives in materials. Specify only the decisions that matter for the brief, make each one concrete, and leave the rest to the tool's own art direction. Underspecified is fine, unbuildable is not.

Two hard rules. The composition must read as a front-on screenshot of a real shipped website, never camera perspective, device frames, or concept-art framing. Every element you describe must be buildable in plain CSS, and anything needing a raster texture or a hand-drawn asset gets cut from the prompt.

## Banned vocabulary and redirects

Never write these into a prompt; each summons slop:

- tactile surfaces: paper texture, grain, noise, film grain, canvas, linen, fabric, cardboard, torn edges, creases, folds
- hand-drawn marks: doodles, sketches, scribbles, burst marks, squiggly underlines, handwritten annotations, marker circles
- scattered ephemera: washi tape, ticket stubs, postage stamps, polaroids, pressed flowers, petals, leaves, confetti, ribbons
- ornament: botanical line art, laurels, wreaths, vines, flourishes, filigree, decorative frames, corner ornaments, stars, sparkles
- AI defaults: floating orbs, 3D blobs, mesh gradients, glow halos, neon edges, stacked glassmorphism panels

The urge behind a banned word is usually legitimate; express it as a buildable decision instead:

- warmth or texture: a warm near-white or brand-tone flat fill, plus a characterful serif
- playfulness: an oversized numeral, an asymmetric pull, a color-blocked diptych
- organic feel: duotone or single-tone photography of a real subject
- depth or atmosphere: a low-chroma tonal gradient between two named hexes, or a full-bleed photo under a tonal overlay
- premium feel: negative space, tight tracking, confident scale contrast

When the banned vocabulary comes from the user's own brief, do the same: pick the buildable proxy, tell the user what was swapped and why, and keep the requested word out of the prompt.

## Signature moves

Slop is one failure; template-safe is the other. Every prompt commits to exactly one signature move and keeps the rest of the section quiet so it reads:

- display type at viewport scale, two sizes past comfortable
- type crossing a seam: the headline overlapping a photo edge or color-block boundary
- a bleed: a numeral, word, or macro crop cut off by the canvas edge
- an oversized glyph (numeral, ampersand, quotation mark) at building scale behind the content
- extreme scale contrast: tiny mono captions against giant display type
- vertical or rotated type along one edge
- one deliberately off-grid element in an otherwise strict grid
- stroke-only display type over photography or a flat field

All are plain CSS, front-on and flat. A big-but-polite headline beside a tasteful photo is not a move; that is the template look these exist to break.

## Anatomy of a good prompt

Write the prompt as decisions with a point of view, not as a form filled in. What the user fixed is a constraint, what they left open is yours, and the safe default at each line is what makes every page look like the last one.

1. Brand and concept in one line: the name written exactly as it should render, and a mood in adjectives that rule an alternative out. With no name given, invent a real-feeling one (never Acme, Nexus, or another company's name) and swap it at implementation.
2. Palette: raw hex values when tokens or brand colors exist, never a design system's name. Otherwise a tight palette with a position on which color dominates and which stays rare.
3. Typography: the character, not the family class, proven by the size and tracking rules.
4. Per section: the signature move and the composition built on it, the background, short believable copy free of marketing filler (unleash, elevate, seamless), and CTA style. Copy is a stand-in replaced at implementation, so spend effort on its length and tone, not its wording.
5. Photography, when wanted: a specific subject, an unobvious crop, a tone grade tied to the palette.

One background per section, plain CSS with explicit hexes, never a material or texture. Flat fields, tonal gradients, color-blocked splits, full-bleed photography under an overlay, editorial side images, and duotone clear that bar, as does anything else you invent that does. "Background: flat #EDE6DC field" is a spec, "on a textured artisanal backdrop" is a slop invitation.

Sizing, canvas versus content gutters, typography px rules, and referenceImages usage: follow the tool description.

## Hero sections

The hero is the main section and fills 100% of the viewport height, so generate it on a canvas with desktop proportions (roughly 16:9), composing headline, copy, CTA, and imagery to occupy the full height, never a shallow banner with dead space below. Only a user-requested mobile mockup switches to portrait phone proportions. Otherwise mobile is derived at implementation, so favor elements whose complexity survives a narrow screen.

## Call structure

Each generated image holds exactly one section: one call entry per section, never several stacked into one tall canvas, which forces a shared background, blurs boundaries, and blocks individual review, referenceImages reuse, and single-section regeneration.

## Generating multiple variants of one section

Variants are a set of genres, not takes on one style. The user is choosing a direction, not a shade of the same layout, so each variant is the answer a different designer would have given.
[text](../../.codesandbox)
Hold the brand constant across the set: same palette, typography, copy tone, and job for the section. For each variant decide how the space is composed, what carries the visual weight (imagery, type, color, or emptiness), and its one signature move. Decide from the brand rather than a menu of layout names, then push the variants apart until no two share any of the three. Unexpected is wanted, as long as each still reads as a front-on screenshot and stays buildable in plain CSS.

Two tests before generating:

- Two prompts that could describe the same image: one of them is not a variant, rewrite it.
- A set that would sit comfortably in a template marketplace is too safe, so replace at least one.

Building a picked mockup into production markup and assets belongs to the `image-to-code` skill.
