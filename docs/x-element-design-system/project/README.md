# X Element Design System

> We are not loud. We are effective.
> We are not visible. We are essential.
> We don't decorate. We optimize.

X Element is a high-performance technology studio that builds intelligent systems, automation pipelines, and scalable digital products. The design system powers internal tools, dashboards, and client-facing platforms with a unified visual and interaction language rooted in **clarity, control, and sophistication**.

The brand should feel like a classified system interface, a high-end control panel, a private intelligence platform. **Darkness is the default. Gold is the signal.** UI is 90% dark, 10% signal — gold is never a background, always an intentional emphasis.

---

## Sources

Given by the founder:

- `uploads/243128152.png` — primary logo mark (flask with stylized **X**, gold on dark)
- `uploads/ChatGPT Image 22 de abr. de 2026, 23_15_07.png` — full brand board (colors, typography, visual elements, logo variants, sample applications, concept direction)
- `uploads/ChatGPT Image 22 de abr. de 2026, 23_29_46.png` — concept art (silhouetted figure with notebook, gold flask glyph halo)
- `uploads/ChatGPT Image 22 de abr. de 2026, 23_31_46.png` — concept art (silhouetted engineer at laptop, floating code/diagrams)

All four are copied into `assets/`. No codebase or Figma file was provided — the system is derived from the brand board and written brand guidelines.

---

## Index

```
README.md                — this file
colors_and_type.css      — CSS tokens (colors, type, spacing, radii, shadows)
SKILL.md                 — Agent-Skill entry point

assets/
  logo-mark.png          — primary flask/X mark, gold on gold bg
  logo-mark-dark.svg     — recolor of logo mark for dark panels
  wordmark-stacked.svg   — "X ELEMENT" + tagline, for dark bg
  wordmark-inline.svg    — "X ELEMENT" inline, for dark bg
  icon-flask.svg         — signature motif, line
  icon-orbit.svg         — signature motif, line
  icon-target.svg        — signature motif, line
  icon-layers.svg        — signature motif, line
  brand-board.png        — full reference brand board
  concept-observer.png   — concept art (observer with notebook)
  concept-architect.png  — concept art (engineer at laptop)

preview/                 — design-system cards (registered assets)
  color-primary.html
  color-support.html
  color-signal.html
  color-semantic.html
  type-display.html
  type-headings.html
  type-body.html
  type-data.html
  spacing-scale.html
  radii.html
  shadows.html
  borders.html
  logo-marks.html
  iconography.html
  btn-primary.html       — gold button states
  btn-secondary.html     — ghost / outline
  btn-tertiary.html      — text / link
  input-field.html
  card-base.html
  badge-status.html
  motif-orbit.html       — brand motif: orbit / target / layers

ui_kits/
  dashboard/             — X Element Ops Console (command center)
    index.html
    README.md
    *.jsx
```

---

## CONTENT FUNDAMENTALS

### Voice

- **Direct.** Subject — verb — outcome. No warm-ups.
- **Controlled.** Never hedges. Never hypes. Never apologizes.
- **Confident.** States facts. Declares intent.
- **Minimal.** One idea per sentence. Silence is a format.

### Casing

- **Display / headlines:** UPPERCASE with wide tracking (0.02–0.22em).
- **Eyebrows / kickers / section labels:** UPPERCASE, tiny, tracked (0.22em).
- **Body:** Sentence case. No title case in UI.
- **Buttons:** UPPERCASE, wide tracking — they read as commands, not invitations.
- **Data labels:** UPPERCASE, tracked. Values in mono.

### Person

- **"We"** when representing the company: *"We build systems that scale."*
- **"You"** is rare and deliberate — used only for direct-addressed interfaces (empty states, dialogs). Most UI is impersonal, system-voiced.
- Avoid "I". X Element never speaks as an individual.

### Emoji

- **Never.** Emojis break the cinematic register. Use the brand motifs (flask, orbit, target, layers) or nothing.

### Punctuation

- Periods at the end of every sentence in copy, even in micro-UI.
- Em dashes ( — ) for breaks. No ellipses for drama.
- Numbers: always numerals, never spelled out. Monospace when displayed as data.

### Tone — do / avoid

| Do                                      | Avoid                                 |
| --------------------------------------- | ------------------------------------- |
| "We build systems that scale."          | "Let's build something amazing! 🚀"   |
| "Precision over noise."                 | "Clean, modern, and easy to use."     |
| "Designed to perform."                  | "Designed with love."                 |
| "Signal detected. 03:14 UTC."           | "Heads up — something new!"           |
| "Automation restored. 128 flows."       | "Hooray! Your flows are back online." |
| "Review required. 3 items."             | "Oops! 3 things need your attention." |

### Copywriting examples from brand

- *"Sistemas inteligentes. Impacto real."* — tagline (PT-BR). EN: *"Intelligent systems. Real impact."*
- *"Nós não somos vistos. Mas tudo funciona por nossa causa."* — brand sensation. EN: *"We are not seen. But everything works because of us."*
- *"Soluções inteligentes para problemas complexos."* — site hero. EN: *"Intelligent solutions for complex problems."*
- *"Nós criamos o que ninguém vê. Para que tudo funcione."* — social. EN: *"We build what no one sees. So that everything works."*

The rhythm is **short clauses, hard stops**. Never runs on.

---

## VISUAL FOUNDATIONS

### Color

See `colors_and_type.css` for tokens. Short version:

- **Deep Black `#0D0D0F`** is the canvas. Nothing is purer black than this.
- **Near Black `#111114`** and **Graphite `#1A1A1E`** are elevation. Elevation is expressed as a +3–5pt shift toward gray, *never* a shadow.
- **Dark Gray `#2B2B2E`** is the border/input color.
- **Soft White `#EAEAEA`** is primary text. Pure white is forbidden — it feels cheap.
- **Muted Gray `#6A6A6F`** is metadata, timestamps, labels.
- **Element Gold `#F5C21A`** is the only accent. Used for: the logo, the one call-to-action per screen, the active state of a tab, the highlighted data point on a chart, a focused input ring. **Never a background. Never gradient-expanded. Never more than one gold element per primary viewport.**

### Type

- **Display / Headlines:** Exo 2 — uppercase, wide tracking. Feels futuristic, not sci-fi. Loaded from Google Fonts.
- **Body / UI:** **Inter** (brand-shipped, `fonts/`, optical sizes 18pt / 24pt / 28pt). Use family `Inter` for body/UI (≤ 20px), `Inter Display` for 20–32px, `Inter Headline` for 32px+. Highly readable neutral grotesk.
- **Data / Code / Timestamps:** JetBrains Mono — tabular numerals, precision. Loaded from Google Fonts.
- Body is 15px. UI small text is 13px. Nothing below 12px.

> Font note: Inter ships with the system. Exo 2 and JetBrains Mono are loaded via Google Fonts (CDN). If offline use is required, ask the engineer to download the Exo 2 + JetBrains Mono TTFs into `fonts/` and wire them with `@font-face` identically to Inter.

### Spacing

- 4px base grid. Tokens: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Generous negative space is a requirement, not a nice-to-have. Clutter is a failure state.
- Section padding starts at 48–64px. Dashboard gutters are 24px minimum.

### Backgrounds

- Flat dark. **No gradients** as backgrounds — ever.
- The only allowed light source is a single **vertical gold shaft** (see concept art) — used very rarely on marketing / hero surfaces, never in product UI.
- Subtle **noise / grain** (1–3% opacity) is permitted on hero backgrounds to keep large dark areas from banding.
- No repeating patterns. No textures. No hand-drawn illustrations.

### Borders

- Default hairline: `rgba(234,234,234,0.06)` — barely there.
- Subtle: `rgba(234,234,234,0.10)` — panels, cards.
- Strong: `rgba(234,234,234,0.16)` — emphasis, active elements.
- Gold edge: `rgba(245,194,26,0.45)` — reserved for focused/active signal elements.
- **Borders are the primary separation mechanism.** Not shadows.

### Shadows

- Soft, almost invisible. The system prefers borders + surface shifts for elevation.
- `--shadow-2`: `0 2px 10px rgba(0,0,0,0.45)` — floating menus, modals.
- `--shadow-3`: `0 10px 40px rgba(0,0,0,0.55)` — overlays.
- No colored shadows. No glow except the gold focus glow: `0 0 0 1px rgba(245,194,26,0.35), 0 0 24px rgba(245,194,26,0.10)`.

### Corner radii

- `2px` — inputs, inline controls.
- `4px` — buttons, badges (default).
- `6px` — cards, small panels.
- `8px` — **maximum** — large panels, modals.
- Never pill-shaped. Never fully-rounded containers. Radius always feels engineered, not friendly.

### Cards / panels

- Background: `--bg-panel` (#111114) or `--bg-raised` (#1A1A1E).
- Border: 1px `--line-subtle` on all sides.
- Radius: 6–8px.
- Padding: 24px minimum.
- No shadow under cards on dark canvas (borders do the separation work).
- Card headers use an eyebrow (uppercase, tracked, muted) + a mono/display title.

### Hover / press states

- **Hover on buttons (primary gold):** shift to `--xe-gold-dim`, no motion.
- **Hover on buttons (ghost):** border shifts from `--line-subtle` → `--line-strong`; text color from `--fg-2` → `--fg-1`.
- **Hover on rows (dashboards, lists):** background shifts +4pt gray (`rgba(234,234,234,0.03)`) — nothing moves, nothing scales.
- **Press:** surface drops brightness ~10%. **No scale transforms.** No bounce.
- **Focus:** 1px gold edge + 24px radial gold glow @ 10% opacity. Keyboard-visible only.

### Motion

- Transitions: `150ms cubic-bezier(0.2, 0.8, 0.2, 1)` is the default. `220ms` for modals and overlays.
- **Only opacity, color, and tiny translate (≤ 4px).** No scale. No rotate. No spring. No bounce.
- Charts animate in with an opacity fade + a 4px translate-Y, stagger 40ms.
- Motion communicates *system response*, not interface personality.

### Transparency & blur

- Blur is used rarely and only for overlays / menus over dashboards: `backdrop-filter: blur(20px) saturate(140%)` on a `rgba(13,13,15,0.7)` surface.
- No frosted glass on the main canvas. Never on headers.

### Imagery

- Cinematic. Single light source (almost always gold). High contrast. Silhouettes over explicit identity.
- Color grading: cool shadows, warm gold highlight. Never fully desaturated.
- Subtle grain is always welcome.
- No stock photography. No smiling people. No handshakes.

### Layout rules

- Strict grid alignment. 12-column on desktop, 4-column on mobile, 8-column on tablet.
- Fixed elements (top navs) are 56px. No exceptions.
- Side rails / sidebars are 240px expanded, 56px collapsed.
- Content columns max out at 1280px. Reading columns at 680px.
- The first screen answers: *"What matters right now?"*

### Data visualization

- **Baseline series:** `--fg-3` (muted gray).
- **Highlighted series:** `--xe-gold`. Only **one** gold series per chart.
- No multi-color palettes. If you need to differentiate three series, use gold + two tones of gray (light, medium).
- Gridlines: `--line-hairline`. Axes: `--fg-3`.
- Labels: 11px, uppercase, tracked, muted.
- Tooltips: dark panel, 1px subtle border, mono values.

---

## ICONOGRAPHY

X Element does **not** use a generic icon set. The brand rejects tech clichés — no rocket, no puzzle piece, no lightbulb, no emoji. Our visual language is a small, tightly controlled set of **signature motifs** plus a line-style system iconography for product UI.

### Signature brand motifs

The brand board defines four core elements — these appear in marketing, concept art, loading states, empty states, and section dividers:

1. **Flask with X** — the primary logo. The hidden element. Represents X Element itself.
2. **Orbit / concentric circles** — automation loops, intelligent systems. Used for loading states and "system active" indicators.
3. **Target / crosshair** — decision, focus, zero-point precision. Used for CTAs, focus states, key data points.
4. **Layers** — product + engineering + design synergy. Used for architecture diagrams, feature groupings.

These are delivered as clean, line-weight SVGs in `assets/` (`icon-flask.svg`, `icon-orbit.svg`, `icon-target.svg`, `icon-layers.svg`).

### Product UI iconography

For functional UI (nav, toolbars, buttons) the system uses **Lucide** — loaded via CDN — because:

- Consistent 1.5px stroke weight (matches our hairline borders).
- Geometric, precise, no rounded-cartoon feeling.
- Large library — we don't have to redraw common icons.

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<i data-lucide="activity" class="icon"></i>
<script>lucide.createIcons();</script>
```

**Rules:**

- Icons are `--fg-2` by default, `--fg-1` on hover, `--xe-gold` when active.
- Default size: 16px. Nav rail: 20px. Hero: 24px.
- Stroke width stays at Lucide default (1.5–2). Never filled. Never colored beyond the three states above.

### Emoji & unicode

- **No emoji.** Ever.
- **No unicode glyphs as icons.** (No ▸, ★, ✓ used as decorative elements.) Checkmarks, arrows, etc. come from Lucide.

### Logo

- Primary: **gold on dark** (`assets/logo-mark.png` on any dark surface, or `logo-mark-dark.svg`).
- Monochrome: for low-contrast contexts (embossed prints, single-ink contexts). Included as a white version.
- Minimum size: 24px. Never distort, never add effects, never overlay, never colorize outside of the approved gold + monochrome.
- Logo represents authority. It is **not decoration** — do not tile it, fade it, or use it as a background watermark.

---

## How to use this system

1. Include `colors_and_type.css` as your first stylesheet.
2. Start every screen on `--bg-canvas` with `--fg-1` text.
3. Reach for the gold **once** per screen, deliberately.
4. Prefer borders over shadows for separation.
5. Prefer negative space over decoration.
6. Prefer silence over personality in copy.

If it looks "cool," you've probably gone too far. If it looks **inevitable**, you nailed it.
