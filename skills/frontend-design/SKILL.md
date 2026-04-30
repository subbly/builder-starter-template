---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: When the user gives a style prompt, follow it. Otherwise, infer a bold, specific aesthetic from the shop name and primary brand color (e.g. an apothecary named "Wildmoor Botanicals" with deep forest green points to rustic herbal luxury, not generic e-commerce). Tone is the highest-leverage decision in the whole design, so invoke more thinking before committing. Deliberately consider 3-4 distinct aesthetics the signals could support and pick the most distinctive one for this brand. Commit fully to that direction rather than averaging toward a safe middle. IMPORTANT: Editorial/magazine style is a last resort, never a default. Use it only when the brand genuinely calls for it (a real publication, literary or print-adjacent brand).
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML, Tailwind, NextJS, motion, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Spatial Composition**: Creative, well-structured layouts built on a consistent grid. Introduce subtle variation in rhythm, density, and alignment across sections. Use generous negative space and considered proportions to give content room to breathe.
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font. Use legible sizes: body text 14-16px, with 12px reserved for small labels, captions, or microcopy only. Never go below 12px for any text.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
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

## Never Use

- Don't use overused font families (Inter, Roboto, Arial, system fonts)
- IMPORTANT: Don't use font sizes below 12px for any text
- Don't use cliched color schemes (purple gradients on white, blue-to-teal)
- Don't use predictable, cookie-cutter layouts with corporate-safe, "looks like a template" energy that lacks context-specific character. This includes centered cards, icon grids, alternating text-image sections, and flat stacks where every element sits in its own row with no spatial relationship to its neighbors
- Don't reuse the same fonts, palettes, or layout structures across different generations
- IMPORTANT: Don't use floating or overlapping elements pinned around hero imagery, even when they serve a purpose. This includes pills, notification chips, rating cards, "trusted by" labels, stat callouts, avatar stacks, decorative tags, mini testimonial cards, price tags, and sparkle or icon accents in corners. Hero imagery stands on its own
- IMPORTANT: Don't use eyebrow, kicker, or overline labels (small tracked uppercase mini-headlines placed above a real headline)
- Don't use print-magazine conventions as decoration when the site isn't a magazine (Nº/Vol. prefixes, decorative section numbering, italic photo credits, ornamental mono numbers). Use them only when they reflect real content
- Don't use marquees, tickers, or auto-scrolling rails as decoration, or fake social-proof bands (trusted-by walls, activity feeds) without a real source
- Don't use fabricated stats, metrics, or awards to fill layouts (by-the-numbers rows, count-up animations, generic trust-icon strips). Never invent numbers

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: You are capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.