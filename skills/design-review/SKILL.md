---
name: design-review
description: "How to see an implemented page the way a visitor sees it, in a real browser instead of assuming the code renders right. Use when checking how built or restyled pages actually look, or when comparing the result against a design reference."
---

# Design review with agent-browser

A screenshot shows what a visitor actually sees, which source code cannot. This skill covers the mechanics of capturing that view efficiently; what to review, how to judge it, and what to do with the findings are your decisions.

## Load the CLI's own guide

`agent-browser` serves its usage guide from the installed CLI, so the instructions always match the installed version:

```bash
agent-browser skills get core --full
```

One call returns workflows, the full command reference, and troubleshooting. Taking command syntax from that output rather than from memory avoids stale flags.

## Round trips

The browser session survives between `execute_command` calls, and commands chain with `&&` inside one call. Each call is a full round trip, so chaining scroll, wait, and screenshot into one call costs a fraction of issuing them separately. Planning the whole capture before the first command keeps the total low.

Pending file changes are invisible to the browser until they reach the preview: `apply_to_preview` first, then browse `http://localhost:3000`.

## Capturing a whole page

A screenshot covers one viewport, so a full page is a scroll-and-shoot sweep:

1. Set the viewport with `agent-browser set viewport 1920 1080` (viewport is its own command, not a flag on `open`). 390x844 makes a phone-sized counterpart.
2. Eval `document.body.scrollHeight` once; dividing by the viewport height yields the entire scroll plan up front.
3. In one chained call per chunk or for the whole sweep: `scrollTo`, a short wait so lazy content and animations settle, screenshot. Five to seven chunks cover a typical page.

A single full-page capture of a tall page squeezes everything into one image where small text stops being legible; viewport-sized chunks stay readable. Writing captures to predictable paths, like `/tmp/design-review/home-desktop.png`, makes them easy to find and re-read later.

A capture becomes evidence only once opened: `read_file` renders images. Reading all captures in one parallel batch, each file once, beats alternating capture-read-capture-read, since the scroll plan was known before the first screenshot anyway.

A cheap extra signal on mobile: an eval comparing `document.body.scrollWidth` to the viewport width catches horizontal overflow that a screenshot can miss.

## Reference images

A reference (a mockup, a generated inspiration image, another site's screenshot) is seen only once opened with `read_file`, same as a capture. A file on disk just needs its path; a URL needs one download, after which the local copy serves any later look. Page captures from an earlier round show a page that has since changed and need retaking; downloaded references have not changed and only need re-opening.

## Dev noise

The dev overlay, console output, and hydration warnings ship with the dev server and are not page defects. The data-sbly attributes injected into the preview cause dev-only hydration warnings that no page edit can fix.
