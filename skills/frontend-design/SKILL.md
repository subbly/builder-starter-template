---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: When the user gives a style prompt, follow it. Otherwise, infer a bold, specific aesthetic from the shop name and primary brand color (e.g. an apothecary named "Wildmoor Botanicals" with deep forest green points to rustic herbal luxury, not generic e-commerce). Tone is the highest-leverage decision in the whole design. Follow the **Aesthetic Directions** protocol below.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML, Tailwind, NextJS, motion, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Aesthetic Directions

Editorial/magazine style is a last resort, not a default. Watch for drift signals: serif display on an asymmetric grid, large display numerals numbering sections, Nº/Vol./Issue framing, and italic captions in tiny type. If three appear together in a draft, redirect.

## Frontend Aesthetics Guidelines

Focus on:
- **Spatial Composition**: Creative, well-structured layouts built on a consistent grid. Introduce subtle variation in rhythm, density, and alignment across sections. Use generous negative space and considered proportions to give content room to breathe.
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font. Use legible sizes: body text 14-16px, with 12px reserved for small labels, captions, or microcopy only. Never go below 12px for any text.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Avoid pure #fff and #000; reach for near-white tones (cream, paper, off-white) and near-black tones (charcoal, ink) for warmer, more intentional surfaces.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

## Component Customization

When using pre-built component libraries (e.g., `shadcn/ui`, `components/subbly`), NEVER ship them in their generic default state. You MUST customize them so they feel native to the project's aesthetic rather than dropped in from a starter kit.

Always customize at minimum:
- Border radii
- Colors (background, foreground, borders, accents, hover/active states)
- Shadows and elevation
- Typography (font family, weight, tracking, size scale)
- Spacing, padding, and density

Walk the full component tree. These libraries typically compose nested sub-components, variants, internal helpers, and style tokens. Restyling only the top-level wrapper is not enough — default styling left in any nested file will leak through and break visual cohesion. Trace the imports and bring every layer in line with the chosen aesthetic.

## Always Apply

- Choose distinctive, character-rich font families that suit the brand (steer clear of generic defaults like Inter, Roboto, Arial, and system fonts)
- IMPORTANT: Keep every piece of text at 12px or larger so it remains readable
- Build color schemes that feel specific to the brand's voice, exploring beyond familiar combinations like purple gradients on white or blue-to-teal
- Design layouts with spatial intention and context-specific character. Let elements relate to each other through overlap, asymmetry, scale shifts, and varied composition rather than defaulting to centered cards, icon grids, alternating text-image sections, or flat row stacks where each element sits in isolation
- IMPORTANT: Let hero imagery stand on its own. Keep the area around it clear of pinned decoration (pills, notification chips, rating cards, "trusted by" labels, stat callouts, avatar stacks, decorative tags, mini testimonial cards, price tags, and sparkle or icon accents in corners), even when those elements seem to serve a purpose
- IMPORTANT: Lead directly with the actual headline. Skip eyebrow, kicker, and overline labels (small tracked uppercase mini-headlines placed above a real headline)
- Reserve print-magazine conventions (Nº/Vol. prefixes, decorative section numbering, italic photo credits, ornamental mono numbers) for cases where they reflect genuinely editorial content, not as decoration on non-magazine sites
- Use marquees, tickers, auto-scrolling rails, and social-proof bands (trusted-by walls, activity feeds) only when they are backed by real, sourced content
- Use only real, sourced stats, metrics, and awards. Never invent numbers to fill layouts (by-the-numbers rows, count-up animations, generic trust-icon strips)

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: You are capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.