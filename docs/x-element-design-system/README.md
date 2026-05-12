> **READ-ONLY — do not edit any file under `docs/x-element-design-system/`.**
> This bundle is the original brand-bible snapshot from Claude Design. Production tokens live in `app/tokens.css`; the active brand reference lives in `.claude/commands/x-element-studio.md`. Edits to the bundle desynchronize the historical record without changing what ships.

# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Find the primary design file under `x-element-design-system/project/` and read it top to bottom.** Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `x-element-design-system/README.md` — this file
- `x-element-design-system/project/` — the `X Element Design System` project files (HTML prototypes, assets, components)
