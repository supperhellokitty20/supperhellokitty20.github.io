# Handoff: fin.blog — cyberpunk hacker blog

A small, static personal blog with a Cyberpunk 2077 HUD aesthetic.
Designed to be deployed on **GitHub Pages** with no build step.

---

## About the design files

The files in `design/` are **high-fidelity HTML/CSS/React prototypes** — they show
the intended look, layout, motion, and content tone. They are not the final
production code.

Your job is to **rebuild them as a clean static site** that runs from a plain
`index.html` on GitHub Pages — no Node, no bundler, no SSR. Vanilla HTML + CSS
+ a small amount of JS is the target. Markdown-based posts would be ideal so
Fin can author new posts by adding `.md` files to a folder.

---

## Fidelity

**High-fidelity.** Colors, type, spacing, motion, copy tone, HUD chrome, and
panel-collapse interactions are all locked. Match them. If you change
something, change it on purpose.

---

## Target stack (recommended)

Pick whichever of these you'd ship — both work on GH Pages:

### Option A — Pure static (simplest, recommended)
- One `index.html` + `styles.css` + `app.js`
- Posts as `.md` files in `posts/`, with a generated `posts/index.json` manifest
- A short build script (or hand-maintained `index.json`) lists the posts
- Use a CDN markdown parser (e.g. `marked`) at runtime to render bodies
- **No framework.** Lowest maintenance.

### Option B — Static site generator
- **Astro** or **Eleventy (11ty)** — both have first-class GitHub Pages workflows
- Posts as `.md` with frontmatter (`title`, `date`, `kind`, `tags`, `severity`, `excerpt`)
- The prototypes use React only for the prototype; you do **not** need React in the shipped site

Either way: **no runtime React, no Tailwind, no UI framework.** Hand-write the CSS.

---

## File structure (suggested, Option A)

```
/
├── index.html
├── styles.css
├── app.js
├── posts/
│   ├── index.json          # [{ id, slug, title, kind, tags, date, read, severity, excerpt }, …]
│   ├── 0x01-three-years-out.md
│   ├── 0x02-dns-rebinding-returns.md
│   └── …
├── assets/
│   └── favicon.svg
└── README.md
```

Frontmatter per post:

```markdown
---
id: "0x06"
slug: "openvpn-config-injection"
title: "Burning down a corpo VPN: weaponizing OpenVPN config injection"
kind: "WRITEUP"           # WRITEUP | JOURNAL
tags: ["netsec", "rce", "vpn"]
date: "2026.05.11"
read: "12 min"
severity: "HIGH"          # CRITICAL | HIGH | MEDIUM | null
excerpt: "A misconfigured ovpn distribution endpoint let me inject directives…"
---

Body in markdown. Use `### // Section` for section headers — the `//` prefix
is part of the visual style.
```

---

## Layout

Three independently-collapsible regions on desktop, drawer + stacked on mobile.

### Desktop (≥ 1100px)

```
┌──────────────┬────────────────────────────────────────────────────────┐
│              │ TOPBAR · crumb · query · [FOCUS/LIST] · results · pill │
│  SIDEBAR     ├─────────────────────────────┬──────────────────────────┤
│  280px     « │ POST LIST                   │ READER                   │
│              │ ~360px (drag 280–560)       │ flex 1                   │
│  identity    │ scrollable cards            │ scrollable article       │
│  nav         │                             │                          │
│  system      │                             │                          │
└──────────────┴─────────────────────────────┴──────────────────────────┘
                                            ↑
                              6px splitter, draggable, dbl-click resets
```

**Three retract states:**

1. **Sidebar collapse** — shrinks 280 → **56px rail** showing only nav IDs (`001`, `002`, `003`…).
   - Toggle: `« / »` chip on the sidebar's right edge, **or** `[` key.
   - Persisted in `localStorage` as `fin.sidebarCollapsed`.

2. **Focus mode** — post list collapses to **width 0**, reader takes the entire main panel.
   - Toggle: `FOCUS / LIST` button on the right of the topbar, **or** `]` key.
   - **Auto-enters on post click** (reading-first UX).
   - **Auto-exits** on Esc / CLOSE / any nav-filter click.

3. **Splitter** — 6px draggable column between list and reader.
   - Drag to resize list 280–560px. Double-click resets to 360px.
   - Persisted as `fin.listWidth` (integer px, clamped on read).

### Tablet (≤ 1100px)
- Sidebar narrows from 280 → 240px. Reader gets more horizontal room.

### Tablet narrow (≤ 860px)
- Query input in topbar hides. `FOCUS / LIST` button drops its label, keeps the icon.

### Mobile (≤ 720px)
- Sidebar becomes a **slide-in drawer** triggered by a hamburger in the topbar (with full-screen scrim).
- Workspace stacks: post list fills the screen.
- Tapping a post slides the **reader in from the right** over the list. CLOSE / Esc returns.
- Empty reader state is hidden on mobile (list is the default view).
- Topbar drops to: `[≡] crumb … [result count]`.
- Splitter and sidebar-collapse handle are hidden.

### Mobile narrow (≤ 380px)
- Identity wordmark and reader title scale down one step.

---

## Design tokens

### Colors

| Token            | Hex         | Use                                              |
|------------------|-------------|--------------------------------------------------|
| `--bg`           | `#050505`   | Page background                                  |
| `--bg-panel`     | `#0b0b0c`   | Sidebar, topbar, post cards, collapse chip       |
| `--bg-panel-2`   | `#101012`   | Card hover                                       |
| `--bg-hover`     | `#14140e`   | Nav hover, active card                           |
| `--line`         | `#1f1f22`   | Default borders, dividers                        |
| `--line-strong`  | `#2e2e33`   | Stronger borders, scrollbar thumb                |
| `--text`         | `#ececec`   | Primary text                                     |
| `--text-mid`     | `#9a9a9a`   | Secondary text, excerpts                         |
| `--text-dim`     | `#5a5a5a`   | Tertiary / dimmed mono labels                    |
| `--yellow`       | `#fcee0a`   | **Primary brand.** CP2077 yellow.                |
| `--yellow-dim`   | `#b6ab06`   | Hover border, scrollbar hover                    |
| `--magenta`      | `#ff2e7e`   | Accent: JOURNAL kind, excerpt rail, CRITICAL sev |
| `--magenta-dim`  | `#c4145d`   | Locked-nav border                                |
| `--cyan`         | `#00e6ff`   | OK status dot, MEDIUM severity                   |
| `--red`          | `#ff3b3b`   | Reserved (not currently used in main UI)         |

`::selection`: yellow bg, black text.

### Typography

Three Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

| Token         | Family                                  | Used for                                  |
|---------------|------------------------------------------|-------------------------------------------|
| `--f-display` | Chakra Petch, system-ui, sans-serif     | Wordmark, post titles, section headers    |
| `--f-ui`      | Rajdhani, system-ui, sans-serif         | Body UI, nav labels, card titles          |
| `--f-mono`    | JetBrains Mono, ui-monospace, monospace | IDs, dates, code blocks, status text      |

Sizes (desktop):
- Body base: **15px** / weight 500 / letter-spacing 0.01em
- Reader title: **38px / 700** / letter-spacing −0.005em / line-height 1.05
- Reader body p: **16px / 400** / line-height 1.65 / color #cfcfcf
- Card title: **17px / 600** / line-height 1.25
- Card excerpt: **13.5px / 400** / line-height 1.5
- Section labels: **10.5px** mono, uppercase, letter-spacing 0.18em
- Mono micro-labels (IDs, dates): **10.5–11.5px**, letter-spacing 0.04–0.06em
- Nav item: **13.5px / 600** display, letter-spacing 0.1em, uppercase

### Layout values

- Sidebar: **280px** (desktop) / **240px** (≤1100) / **56px** when collapsed / drawer ≤720
- List column: **360px default**, **280–560 user-resizable**, **0** in focus mode
- Splitter: **6px** wide hit-area (extended ±4px via `::before` pseudo)
- Topbar: **56px** desktop, **52px** mobile
- Reader scroll padding: **32px 56px 80px** desktop, **22px 18px 80px** mobile

### Spacing scale

`2 / 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 22 / 26 / 34` px.

**No rounded corners anywhere.** `border-radius: 0` across the whole UI — core to the look.

### Borders, brackets, glow

- All borders 1px solid.
- Corner brackets (10×10px, 1px border on two sides) on cards & empty state — 4 absolutely-positioned spans.
- Status-dot glow: `box-shadow: 0 0 6px currentColor`
- Active nav rail: `box-shadow: 0 0 8px var(--yellow)`
- Active card left rail: `box-shadow: 0 0 12px var(--yellow)`
- Splitter grip glow on hover/drag: yellow 3-stop box-shadow
- Drawer: `box-shadow: 8px 0 24px rgba(0,0,0,0.6)`

### Background grid

```css
body {
  background-image:
    radial-gradient(ellipse at 50% 30%, rgba(252,238,10,0.025) 0%, transparent 55%),
    linear-gradient(to right,  rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: auto, 36px 36px, 36px 36px;
}
```

---

## Components

### Sidebar (280px expanded / 56px collapsed)

1. **Identity block** — only visible when expanded.
   - `FIN.BLOG` wordmark, 28px Chakra Petch 700.
     - `FIN` is yellow with chromatic-split text-shadow: `1px 0 0 var(--magenta), -1px 0 0 rgba(0,230,255,0.5)`.
     - `.` is magenta. `BLOG` is white, 18px, 500, letter-spacing 0.15em.
   - Tagline: mono 11px dim. `> trespass.log _` with blinking caret (1s steps).
   - Three meta rows (USER / ROLE / LOC) — mono 10.5px, dim labels left, values right.
   - Dashed bottom divider.
   - A 2px vertical yellow stripe fades down the sidebar's left edge (pseudo-element).

2. **Nav**
   - Section label `// NAVIGATION` with trailing fade line. Hidden when collapsed.
   - 5 items: `ALL_POSTS`, `WRITEUPS`, `JOURNAL`, `ARCHIVE` (locked), `CONTACT` (locked).
   - Expanded row: `[id 001-005]` · `LABEL` · `[count]`. Hover lights border/bg. Active = yellow border + yellow text + 3px yellow left rail with glow. Locked = dim + magenta `LOCKED` pill, disabled.
   - Collapsed row: just the `001` mono ID, centered. Active item's ID is yellow.
   - **Clicking any filter exits focus mode** (`listHidden = false`) before applying the new filter.

3. **System footer** — only visible when expanded.
   - `// SYSTEM` label.
   - TIME (live HH:MM:SS, 1s updates) · UPLINK (cyan SECURE pill with blinking dot) · DAEMON `blackwall.v7`.
   - Dashed divider over `© 2077 // NO RIGHTS RESERVED` (mono 9.5px dim).
   - When collapsed: replaced by a single 6×6 cyan pulse dot (`blink` 1.4s animation), vertically centered in remaining space.

4. **Collapse handle**
   - 28×28 square button, absolute `top: 14px; right: -14px` (overhangs sidebar's right edge).
   - Background `--bg-panel`, 1px border `--line`, JetBrains Mono `«` (expanded state) or `»` (collapsed state).
   - Hover: invert to black-on-yellow.
   - Hidden on mobile.

### Topbar (56px)

- **Left (desktop):** breadcrumb `// fin.blog / <crumb>`. Crumb is yellow, lowercase, matches active filter.
- **Left (mobile):** hamburger button (3 yellow bars, 36×36 with 1px border).
- **Center:** square-bordered input with 2px yellow vertical ticks on each edge. Placeholder `grep ./posts/*`. Live-filters list by title, excerpt, tag. Hidden ≤860.
- **Right (desktop):**
  - `[≡ LIST]` / `[✕ FOCUS]` toggle button. Same metrics as reader CLOSE button (6×10 padding, 1px border, display-font 11px / 0.14em tracking). When `listHidden`: yellow border + yellow text + "LIST" label. Otherwise: muted border + muted text + "FOCUS" label.
  - Vertical separator (1px × 14px `--line-strong`).
  - `RESULTS  06` (zero-padded, yellow mono).
  - Narrow vertical separator.
  - `[ONLINE]` cyan StatusPill.
- **Right (mobile):** results count only — separators, status pill, FOCUS/LIST toggle all hide.

### Splitter (between list and reader)

- 6px wide grid column, full-height.
- Vertical centered grip: 2px wide × 32px tall `--line-strong` bar with two `box-shadow` sidekick bars at ±3px (creates a 3-line vertical grip).
- Hover: grip turns yellow with glow. Drag: same. Background tints `rgba(252,238,10,0.04)` on hover.
- Mouse and touch: same drag handler. `touch-action: none` while dragging. While dragging, body cursor = `col-resize` and `user-select: none`.
- Double-click handle → reset to 360px.
- Hidden on mobile.

### Post list

Section label `// TRANSMISSIONS  [count]` with a yellow blinking `LIVE` pill when filter is `all`.

Empty state: `// NO_MATCH` magenta + dim hint.

Each **card**:
- 1px border, square corners, 4 corner-bracket spans.
- Row 1: `#0x06` (mono dim) · KIND pill · SEV pill (if any) · date pushed right.
- Row 2: Title (17px display 600).
- Row 3: Excerpt (13.5px Rajdhani 400, `text-wrap: pretty`).
- Row 4: Tag chips left · read time mono dim right.
- Active state: yellow border + brackets + title, 3px yellow left rail with 12px glow.

**KIND pill** — mono 9.5px / 700 / 0.16em tracking, 3px 6px padding, 1px border in currentColor.
- `WRITEUP` → yellow
- `JOURNAL` → magenta

**SEV pill** — same metrics, solid black-on-color:
- `CRITICAL` → magenta bg
- `HIGH` → yellow bg
- `MEDIUM` → cyan bg

### Reader

Slides in (translateX 4px → 0 + opacity 0 → 1, 0.22s ease-out) on post change.

- **Head bar:** mono `FILE  /writeup/openvpn-config-injection.md` left · CLOSE button right with `[ESC]` hint, inverts to black-on-yellow on hover.
- **Meta row:** ID · KIND · SEV · date · separator · read time.
- **Title:** 38px Chakra Petch 700, yellow, chromatic shadow. Animates with **decrypt effect** on post change (~14 frames @ 28ms, chars scramble then resolve left-to-right). Followed by blinking magenta `_` caret.
- **Excerpt:** 17px `--text-mid`, 14px left padding, 2px magenta left border.
- **Divider:** mono `// BEGIN_BODY` + fading line. `// END_BODY` at end.
- **Body:**
  - `h3` — Chakra Petch 600, 20px, yellow, 26px top margin. Author writes `### // Section` in markdown — keep the `//` in output.
  - `p` — 16px `#cfcfcf`, line-height 1.65, `text-wrap: pretty`, max-width 68ch.
  - `pre` — `#08080a` bg, 1px border + 3px yellow left border, with yellow `// CODE` flag in top-right (mono 9.5px black-on-yellow). Inner `code` 12.5px JetBrains Mono, color `#d6d600`.
- **Footer:** larger tag chips left · mono signature right: `signed fin · PGP 0xC0DE.BABE.4FIN`.

**Empty state** (no active post, desktop only): dashed-border frame, `{ }` glyph (yellow 64px, slow pulse), `NO TRANSMISSION SELECTED` heading, dim subtitle, `// awaiting input ▌` footer. Hidden on mobile.

---

## State

```js
state = {
  filter: "all" | "writeup" | "journal",
  query: "",
  active: null | postObject,
  menuOpen: false,                  // mobile drawer
  sidebarCollapsed: false,          // desktop rail mode
  listHidden: false,                // focus mode (reader full-width)
  listWidth: 360,                   // splitter, 280–560
  dragging: false,                  // while splitter is being dragged
  now: Date,                        // updated every 1s for clock
}
```

State transitions:

| Trigger                       | filter | active   | listHidden     | menuOpen |
|-------------------------------|--------|----------|----------------|----------|
| Click a post card             | —      | post     | **true**       | —        |
| CLOSE / `Esc`                 | —      | **null** | **false**      | —        |
| Click nav filter (desktop)    | new    | —        | **false**      | —        |
| Click nav filter (mobile)     | new    | —        | —              | **false**|
| Click topbar `FOCUS/LIST`     | —      | —        | toggle         | —        |
| Press `]`                     | —      | —        | toggle         | —        |
| Press `[`                     | sidebarCollapsed toggle                          ||
| Click hamburger (mobile)      | —      | —        | —              | **true** |

Persist:
- `fin.sidebarCollapsed` → `"0"` | `"1"`
- `fin.listWidth` → integer px, clamped 280–560 on read

Keyboard shortcuts (skip when target is INPUT/TEXTAREA):
- `Esc` — close active post and re-open list
- `[` — toggle sidebar collapse
- `]` — toggle list visibility (focus mode)

---

## CSS scroll plumbing (load-bearing)

The shell is nested CSS Grid + flex. **Grid rows and flex children default to `min-height: auto`** which prevents inner overflow scrollers from working. The following are required — do not omit:

```css
.app {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 100vh;        /* pin row to viewport */
  height: 100vh;
  transition: grid-template-columns 0.22s cubic-bezier(0.5,0,0.2,1);
}
.app.sidebar-collapsed { grid-template-columns: 56px 1fr; }
.app > * { min-height: 0; min-width: 0; }   /* unbreak grid items */

.main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.workspace {
  display: grid;
  grid-template-columns: var(--list-w, 360px) 6px 1fr;
  grid-template-rows: minmax(0, 1fr);       /* pin row, allow shrink */
  min-height: 0;
  transition: grid-template-columns 0.22s cubic-bezier(0.5,0,0.2,1);
}
.workspace > * { min-width: 0; min-height: 0; height: 100%; overflow: hidden; }

.app.list-hidden .workspace { grid-template-columns: 0 0 1fr; }
.app.list-hidden .list,
.app.list-hidden .splitter {
  opacity: 0; pointer-events: none; visibility: hidden;
}

.list, .reader { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.list__scroll, .reader__scroll { flex: 1; min-height: 0; overflow-y: auto; }
```

If a column "can't scroll," you're missing one of: the `100vh` row on `.app`, the `minmax(0, 1fr)` row on `.workspace`, the `min-height: 0` on grid children, or the `overflow: hidden` on the panel wrappers.

---

## Animations & timings

| Element                  | Property               | Duration | Easing                              |
|--------------------------|------------------------|----------|-------------------------------------|
| Reader fade-in           | opacity + translateX   | 0.22s    | ease-out                            |
| Sidebar collapse/expand  | grid-template-columns  | 0.22s    | cubic-bezier(0.5, 0, 0.2, 1)        |
| List collapse (focus)    | grid-template-columns  | 0.22s    | cubic-bezier(0.5, 0, 0.2, 1)        |
| Drawer + mobile reader   | transform              | 0.24s    | cubic-bezier(0.5, 0, 0.2, 1)        |
| Scrim                    | opacity                | 0.20s    | ease                                |
| Card hover               | bg, border             | 0.14s    | ease                                |
| Nav item                 | bg, border, color      | 0.12s    | ease                                |
| Close / collapse hover   | all                    | 0.12s    | ease                                |
| Splitter grip hover/drag | background, box-shadow | 0.12s    | ease                                |
| Caret blink              | opacity (steps)        | 1.0s     | steps(1) infinite                   |
| Live pill / empty glyph  | opacity 1 → 0.55 → 1   | 1.6–2.4s | ease-in-out infinite                |
| Status dot blink         | opacity                | 1.4s     | ease-in-out infinite                |
| Title decrypt            | scramble → resolve     | ~390ms   | 14 frames @ 28ms                    |

---

## Content seed (6 posts in the prototype)

Order is newest first; same files can be re-saved as the initial seed:

1. `0x06` — `openvpn-config-injection` — WRITEUP / HIGH — netsec, rce, vpn — 2026.05.11
2. `0x05` — `analog-notes` — JOURNAL — personal, tools — 2026.05.04
3. `0x04` — `secure-chat-firmware` — WRITEUP / CRITICAL — reversing, crypto, iot — 2026.04.22
4. `0x03` — `week-in-tmux` — JOURNAL — dev, tools, experiment — 2026.04.10
5. `0x02` — `dns-rebinding-returns` — WRITEUP / MEDIUM — netsec, web, dns — 2026.03.28
6. `0x01` — `three-years-out` — JOURNAL — personal, freelance — 2026.03.15

Full titles, excerpts, and bodies live in `design/posts.jsx`. Copy the text directly into markdown files.

---

## GitHub Pages deployment

If you go with **Option A (pure static)**:

1. Push to `main` branch of `<username>.github.io` (or any repo with Pages enabled in Settings → Pages → Source: `main` / root).
2. Visit `https://<username>.github.io/`. Done.
3. To add a post: write a new `.md` in `posts/`, add an entry to `posts/index.json`, push.

If you go with **Astro / 11ty**:

- Add a `.github/workflows/deploy.yml` that builds and publishes to the `gh-pages` branch on push to `main`.
- Both frameworks have official actions; use those.

---

## Things to NOT do

- **No rounded corners.** Anywhere. `border-radius: 0` across the whole UI.
- **No emoji.** The visual vocabulary is `//`, `_`, brackets, monospace IDs, `«` / `»` / `≡` / `✕`.
- **No additional gradient backgrounds** beyond the existing faint vignette and the panel-top yellow tint.
- **No light mode.** Black bg is non-negotiable.
- **Don't ship runtime React.** It's in the prototype for ergonomics; the final site should be static HTML rendered at build or runtime by tiny vanilla JS.
- **Don't change the typography stack** — Chakra Petch / Rajdhani / JetBrains Mono are load-bearing.
- **Don't make the post list always-visible** during reading. The auto-hide on card click is intentional — reading is the priority.

---

## Files in this bundle

- `design/fin.blog.html` — entry point of the prototype
- `design/styles.css` — full styles, including all responsive breakpoints + collapse states
- `design/app.jsx` — components, filter logic, decrypt effect, drawer + splitter + collapse state, keyboard shortcuts, localStorage persistence
- `design/posts.jsx` — the 6 seed posts with full bodies

Open `design/fin.blog.html` in a browser to see the prototype running. Use the breakpoints noted above to verify your responsive behavior matches.
