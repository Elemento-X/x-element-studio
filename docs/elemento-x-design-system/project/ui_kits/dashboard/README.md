# Elemento-X Ops Console — UI Kit

A high-fidelity recreation of Elemento-X's core product surface: a command console for monitoring automation pipelines, signals, and system health. The console is the primary *"what matters right now?"* view for the platform.

## What this kit covers

- **`TopBar.jsx`** — 56px fixed top nav. Wordmark, global search, status, operator identity.
- **`SideRail.jsx`** — 56px collapsed icon rail. Lucide icons, gold active indicator.
- **`StatCard.jsx`** — KPI tile with eyebrow, mono value, delta chip.
- **`SignalChart.jsx`** — Dark-canvas line chart with muted baseline + single gold series.
- **`ActivityFeed.jsx`** — Timestamped event rows, mono timestamps, status dots.
- **`PipelineTable.jsx`** — Automation pipeline rows with status badges.
- **`CommandPalette.jsx`** — Overlay command input (press `⌘K` in demo).
- **`Button.jsx`, `Badge.jsx`, `Eyebrow.jsx`** — shared primitives.

## How to run

Open `index.html` directly. It boots a fake session and drops you into the Ops Console dashboard. Press `⌘K` or `Ctrl+K` to open the command palette.

## Fidelity notes

No real codebase or Figma was provided — this kit is derived from the brand board + brand guidelines. The visual language is verified against:

- Dashboard thumbnail on the brand board
- Color system exactly (`#0D0D0F` canvas, `#F5C21A` signal, `#2B2B2E` borders)
- Typography exactly (Exo 2 display, Inter body, JetBrains Mono data)
- Iconography system (Lucide line icons)
- Motion rules (150ms ease, opacity/color only, no scale)
