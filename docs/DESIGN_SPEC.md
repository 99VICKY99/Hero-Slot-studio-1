# Screen Design Specification — Hero Slot Studio

> **Note:** Tokens updated 2026-04-18 from hero-handoff bundle. Old LinkedIn-blue palette retired.
>
> Companion to `PRD.md` and `ARCHITECTURE.md`. The PRD defines what we build. The architecture defines how it's wired. **This document defines what every screen looks like.**
>
> **This is a written specification, not a visual mockup.** Take this document into Figma (or your design tool of choice) and build screen-by-screen against the specs below. Every measurement, color token, and interaction is defined explicitly so two designers building from this would produce visually consistent results.

---

## Table of Contents

1. [Design Foundations (the locked theme)](#1-design-foundations)
2. [Layout Grid System](#2-layout-grid-system)
3. [Global Components (used everywhere)](#3-global-components)
4. [Screen 1 — App Shell](#screen-1--app-shell)
5. [Screen 2 — Empty State / Welcome](#screen-2--empty-state--welcome)
6. [Screen 3 — Generate (URL + prompt entry)](#screen-3--generate-mode)
7. [Screen 4 — Generating (loading state)](#screen-4--generating-loading-state)
8. [Screen 5 — Studio Editor (the main workspace)](#screen-5--studio-editor)
9. [Screen 6 — Floating Element Toolbar](#screen-6--floating-element-toolbar)
10. [Screen 7 — Element Sidebar (Image / Logo)](#screen-7--element-sidebar)
11. [Screen 8 — Variations Picker](#screen-8--variations-picker)
12. [Screen 9 — Multi-Select Edit Mode](#screen-9--multi-select-mode)
13. [Screen 10 — `@mention` Autocomplete](#screen-10--mention-autocomplete)
14. [Screen 11 — Timeline Strip & Scrubber](#screen-11--timeline-strip)
15. [Screen 12 — Version History Panel](#screen-12--version-history)
16. [Screen 13 — Fullscreen Preview](#screen-13--fullscreen-preview)
17. [Screen 14 — Publish Flow](#screen-14--publish-flow)
18. [Screen 15 — Import / Export Modal](#screen-15--import--export-modal)
19. [Screen 16 — Settings Panel](#screen-16--settings)
20. [Screen 17 — Error & Empty States](#screen-17--error--empty-states)
21. [Screen 18 — Keyboard Shortcuts Reference](#screen-18--keyboard-shortcuts)
22. [Responsive Behavior](#22-responsive-behavior)
23. [Dark Mode Mapping (optional)](#23-dark-mode-mapping)
24. [Accessibility Requirements](#24-accessibility-requirements)
25. [Asset Checklist for Designers](#25-asset-checklist-for-designers)

---

## 1. Design Foundations

> **These tokens are LOCKED. Every screen below references these and only these.**
>
> Dark mode is the only mode. Sourced from `hero-handoff/hero/project/Hero Slot Studio.html` on 2026-04-18. Mirrored into `frontend/tailwind.config.ts` and `frontend/src/index.css`.

### 1.1 Color tokens

**Backgrounds**

| Token | Value | Usage |
|---|---|---|
| `bg.0` | `#0a0b0d` | App background |
| `bg.1` | `#101114` | Panels (topbar, left panel, right sidebar, timeline) |
| `bg.2` | `#17181c` | Raised surfaces (chips, toolbar, segmented control bg) |
| `bg.3` | `#1e2026` | Hover, pill backgrounds |
| `bg.4` | `#252830` | Selected segmented-control segment |
| `canvas` | `#0d0e11` | Canvas area behind the preview frame |

**Lines**

| Token | Value | Usage |
|---|---|---|
| `line.1` | `#1f2128` | Default dividers, borders on inputs/cards |
| `line.2` | `#2a2d36` | Stronger dividers, borders on floating surfaces |

**Text**

| Token | Value | Usage |
|---|---|---|
| `text.0` | `#f5f6f8` | Primary copy |
| `text.1` | `#a8acb8` | Secondary copy |
| `text.2` | `#6b6f7c` | Tertiary / muted labels |
| `text.3` | `#474a55` | Quaternary / decorative |

**Accent (violet)**

| Token | Value | Usage |
|---|---|---|
| `accent` | `#8b7dff` | Selection rings, primary buttons, CTA gradient base |
| `accent.soft` | `#8b7dff26` | Row highlights, mention pills |
| `accent.line` | `#8b7dff4d` | Focused input borders, soft outlines |

**Feedback**

| Token | Value | Usage |
|---|---|---|
| `pos` | `#4ade80` | Success dots, insert-child timeline dots |
| `warn` | `#fbbf24` | Warning indicator, generate/regenerate ops |
| `neg` | `#f87171` | Destructive actions, remove-child timeline dots |

### 1.2 Typography tokens

**Font families**

| Token | Stack | Usage |
|---|---|---|
| `font.ui` | `"Inter Tight", -apple-system, system-ui, sans-serif` | All UI copy |
| `font.mono` | `"JetBrains Mono", ui-monospace, monospace` | IDs, numeric inputs, keycaps |
| `font.display` | `"Instrument Serif", Georgia, serif` | Model-rationale quotes |

Weights to load: Inter Tight 400/500/600/700; JetBrains Mono 400/500/600; Instrument Serif 400.

**Base body:** 13px / 1.45 line-height / -0.005em tracking / `text.0` on `bg.0`.

Type scale is prose-sized inline (10px labels, 11.5px chrome, 13px body, up to 54–72px display inside the hero preview itself). No formal `text.pageTitle` scale — every size is declared at the callsite.

### 1.3 Radius tokens

| Token | Value | Usage |
|---|---|---|
| `radius.s` | 4px | Swatches, chips, keycaps, small pills |
| `radius.m` | 6px | Buttons, inputs, segmented controls |
| `radius.l` | 10px | Floating toolbars, variation cards, tweaks popover |

### 1.4 Shadow tokens

| Token | Value | Usage |
|---|---|---|
| `shadow.pop` | `0 0 0 1px rgba(255,255,255,.04), 0 12px 32px -8px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.4)` | Popovers (mention menu, tooltips) |
| `shadow.toolbar` | `0 0 0 1px rgba(255,255,255,.06), 0 18px 48px -12px rgba(0,0,0,.7)` | Floating toolbar, tweaks panel |

### 1.5 Motion tokens

| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion.fast` | 120ms | `ease-out` | Hover color/background, chevron icons |
| `motion.normal` | 150ms | `ease-out` | Focus rings, border-color swaps |
| `motion.slow` | 250ms | `ease-out` | Card focus lift |

### 1.6 Iconography

- **Source:** inline SVGs in `frontend/src/components/studio/Icons.tsx` (mirrored from `hero-handoff/src/icons.jsx`). Uses `lucide-react` for any icons that map 1:1 when needed.
- **Stroke width:** 1.5px
- **Default size:** 14px (inline / tree glyph), 16–20px (toolbar, chrome), 24–28px (icon buttons)
- **Default color:** `text.1`
- **Hover color:** `text.0` on `bg.2`
- **Active color:** `text.0` on `bg.3`

### 1.7 Scrollbars

Webkit scrollbars are themed: 10px track (transparent), thumb `line.2` with a 2px `bg.1` border, hover `#3a3d46`.

---

## 2. Layout Grid System

### 2.1 Page container

- **Max content width:** 1200px (centered horizontally)
- **Min supported width:** 1280px viewport (below this, "Use a wider screen" message — see Responsive Behavior)
- **Outer page padding:** 24px left/right at all viewport widths above min
- **Vertical rhythm:** sections separated by 32px (`space.8`); related groups by 16px (`space.4`)

### 2.2 Studio editor grid

The Studio is the primary screen. It uses a **3-column grid**:

```
┌──────────────┬─────────────────────────────────┬──────────────┐
│              │                                 │              │
│  Left Panel  │    Preview Canvas               │ Right Panel  │
│  (collapsible)│   (flexible width)             │ (contextual) │
│              │                                 │              │
│  280px       │       remaining space            │  320px       │
│              │                                 │              │
└──────────────┴─────────────────────────────────┴──────────────┘
```

- **Left panel:** Version History (default open, collapsible to 56px icon rail)
- **Center:** Preview canvas with 40:60 hero/login layout inside
- **Right panel:** Element Sidebar (only appears when an Image or Logo is selected; collapses entirely when not in use)

The bottom of the Studio holds the **Prompt Bar** spanning the full center column width, with the **Timeline Strip** above it.

### 2.3 Z-index scale

| Layer | z-index | Use |
|---|---|---|
| Canvas content | 0 | Default page elements |
| Sticky headers | 10 | App bar, panel headers |
| Floating toolbars | 20 | Element toolbar, hover indicators |
| Dropdowns | 30 | `@mention` autocomplete, color pickers |
| Modals | 40 | Settings, Import/Export, Publish dialogs |
| Toasts | 50 | Bottom-right notifications |
| Loading overlays | 60 | Full-screen spinner during generate |

---

## 3. Global Components

These components appear on multiple screens. Build once, reuse everywhere.

### 3.1 Top Navigation Bar (App Header)

- **Height:** 56px
- **Background:** `color.surface.default` (#FFFFFF)
- **Border-bottom:** 1px solid `color.border.default`
- **Padding:** 0 24px
- **Layout:** flex, justify between
- **Position:** sticky top, z-index 10

**Left section:**
- Logo mark (24×24, brand blue square with white "H" — placeholder until brand logo finalized)
- Wordmark "Hero Slot Studio" — `text.cardSubtitle` weight 600, `color.text.primary`
- Total left section width: ~220px

**Center section:**
- Empty in v1 (reserved for future: hero name input, breadcrumbs)

**Right section:**
- Model indicator (small chip): "Model: MiniMax M2.7" — `text.caption`, `color.text.secondary`
- Settings icon button (24px, gear icon)
- Help icon button (24px, question-circle icon)

### 3.2 Buttons

> All buttons are **pill-shaped** (`radius.pill`), height **40px**, internal horizontal padding **24px**, font `text.button` (14px / 600).

**Primary Button**
```
Background: #0A66C2
Text:       #FFFFFF
Border:     none
Hover:      Background → #004182
Active:     Background → #004182, transform scale(0.98)
Disabled:   Background #9CA3AF, cursor not-allowed, opacity 0.6
Focus ring: 2px outline #0A66C2, 2px offset
```

**Secondary Button**
```
Background: transparent
Text:       #0A66C2
Border:     1px solid #0A66C2
Hover:      Background rgba(10, 102, 194, 0.08)
Active:     Background rgba(10, 102, 194, 0.12)
Disabled:   Border + text #9CA3AF
```

**Tertiary Button (text-only)**
```
Background: transparent
Text:       #6B7280
Border:     none
Padding:    8px 12px
Hover:      Text → #111827, background → #F3F6F8
Active:     Background → #E5E7EB
```

**Destructive Button** (used for Delete confirmations)
```
Background: #B91C1C
Text:       #FFFFFF
Hover:      Background → #991B1B
```

**Icon-only Button**
```
Size:       32×32 or 40×40 (specified per use)
Shape:      Circle (radius.circle)
Background: transparent
Icon color: #6B7280 default, #0A66C2 hover
Hover bg:   #F3F6F8
Active bg:  #E5E7EB
```

**Button sizes**
- Small: 32px height, 16px horizontal padding, 13px font
- Default: 40px height, 24px padding, 14px font
- Large: 48px height, 32px padding, 16px font

### 3.3 Inputs

**Text input**
- Height: 40px (default), 44px (large), 32px (small)
- Padding: 0 12px
- Border: 1px solid `color.border.strong` (#D1D5DB)
- Border radius: `radius.md` (6px)
- Font: `text.input` (14px / 400)
- Background: `color.surface.default`
- Placeholder color: `color.text.secondary`

**States:**
- Hover: border → `color.text.secondary`
- Focus: border → `color.brand.primary`, box-shadow `0 0 0 3px rgba(10, 102, 194, 0.15)` (the subtle blue glow)
- Disabled: background `color.background.canvas`, text `color.text.disabled`
- Error: border → `color.feedback.error`, helper text below in error color

**Label** (always above input):
- `text.label` (13px / 500)
- `color.text.primary`
- Margin-bottom: 6px

**Helper text** (below input):
- `text.caption` (12px / 400)
- `color.text.secondary`
- Margin-top: 6px

**Textarea**
- Same styling as text input
- Min height: 80px, resizable vertically only

### 3.4 Card

- Background: `color.surface.default` (#FFFFFF)
- Border: 1px solid `color.border.default`
- Border radius: `radius.lg` (8px)
- Padding: 24px (`space.6`)
- Shadow: `shadow.none` by default
- Hover (only on clickable cards): `shadow.subtle` + border → `color.text.secondary`

### 3.5 Toast / Notification

- Position: fixed bottom-right, 24px from edges
- Width: 360px
- Padding: 12px 16px
- Border radius: `radius.lg` (8px)
- Background: `color.surface.default`
- Border-left: 4px solid (color depends on type)
- Shadow: `shadow.dropdown`
- Auto-dismiss: 5s (success/info), 8s (warning), persistent (error — manual close)

**Layout (left to right):**
- Icon (20px, color matches type)
- Content area (flex-grow)
  - Title (text.bodyStrong, 14px / 600)
  - Description (text.caption, 12px, secondary)
- Close button (16px ×, top-right of toast)

**Types:**
- Success: border-left `#057642`, check-circle icon
- Warning: border-left `#B45309`, alert-triangle icon
- Error: border-left `#B91C1C`, x-circle icon
- Info: border-left `#0A66C2`, info icon

### 3.6 Modal / Dialog

- Position: fixed center
- Background overlay: `rgba(17, 24, 39, 0.5)` covering full viewport
- Modal box:
  - Background: `color.surface.default`
  - Border radius: `radius.lg` (8px)
  - Shadow: `shadow.modal`
  - Max width: 560px (default), 720px (large), 920px (extra large)
  - Padding: 0 (header/body/footer have their own padding)

**Header:**
- Padding: 24px 24px 16px
- Title: `text.sectionHeader` (24px / 600)
- Close button: top-right (24×24 icon button)
- Optional subtitle below title: `text.body`, `color.text.secondary`

**Body:**
- Padding: 16px 24px

**Footer:**
- Padding: 16px 24px
- Border-top: 1px solid `color.border.default`
- Layout: flex justify-end, gap 12px
- Default action right-most (primary), cancel left of primary (secondary)

### 3.7 Tooltip

- Background: `#111827` (near-black for contrast)
- Text: `#FFFFFF`, `text.caption` (12px / 400)
- Padding: 6px 10px
- Border radius: `radius.md` (6px)
- Shadow: `shadow.tooltip`
- Show delay: 400ms
- Hide delay: 100ms

### 3.8 Dropdown / Popover

- Background: `color.surface.default`
- Border: 1px solid `color.border.default`
- Border radius: `radius.lg` (8px)
- Shadow: `shadow.dropdown`
- Min width: 200px
- Max height: 320px (scrolls if more)
- Padding: 4px (option container)

**Dropdown option:**
- Height: 36px
- Padding: 8px 12px
- Font: `text.body` (14px / 400)
- Hover: background `color.surface.subtle`
- Selected: background `color.background.canvas`, text `color.brand.primary`, weight 500

### 3.9 Spinner / Loading indicator

- **Inline spinner:** 16×16 SVG, rotating circle, color `color.brand.primary`, stroke 2px
- **Page spinner:** 48×48, centered with caption below
- **Skeleton loader:** rounded rectangles in `color.surface.subtle` with subtle shimmer animation (use sparingly — only for content lists, not whole pages)

---

# Page-by-Page Specification

---

## Screen 1 — App Shell

The persistent frame around every screen.

### Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Top Navigation Bar (56px)                                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                                                     │
│                  Active Screen Content                              │
│                  (max-width 1200px, centered)                       │
│                  Background: #F3F6F8                                │
│                                                                     │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Spec

- Top nav: as defined in §3.1
- Below nav: full-width canvas with `color.background.canvas` (#F3F6F8)
- Active screen content rendered inside max-width 1200px container, horizontally centered, top padding 32px

### What goes where

- The Studio screen overrides the centering and goes edge-to-edge (it's a workspace)
- All other screens (settings, modals, welcome) respect the 1200px centered container

---

## Screen 2 — Empty State / Welcome

What the user sees on first load (no heroes in IndexedDB) or after clearing all history.

### Layout

```
                                    1200px
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                          (top padding 96px)                         │
│                                                                     │
│                   Welcome to Hero Slot Studio                       │
│                   (text.pageTitle, centered)                        │
│                                                                     │
│              Generate branded login-page heroes from any            │
│              client website. Edit visually. Export to deploy.       │
│                   (text.body, secondary, centered)                  │
│                                                                     │
│                          (space.8 = 32px)                           │
│                                                                     │
│   ┌────────────────────┐  ┌────────────────────┐  ┌──────────────┐ │
│   │                    │  │                    │  │              │ │
│   │  Generate from URL │  │   Start blank      │  │  Import JSON │ │
│   │                    │  │                    │  │              │ │
│   │  [Card with icon]  │  │  [Card with icon]  │  │ [Card icon]  │ │
│   │                    │  │                    │  │              │ │
│   └────────────────────┘  └────────────────────┘  └──────────────┘ │
│                                                                     │
│                          (space.12 = 48px)                          │
│                                                                     │
│   ─── How it works ───                                              │
│                                                                     │
│   1. Paste a client URL or describe your hero                       │
│   2. AI generates a branded hero matching the site                  │
│   3. Refine by clicking elements or typing prompts                  │
│   4. Publish and download JSON for deployment                       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Components

**Page title block**
- Title: "Welcome to Hero Slot Studio" — `text.pageTitle`
- Subtitle: 2-line description — `text.body`, `color.text.secondary`, max-width 560px, centered
- Margin-bottom: 32px

**Action cards (3 cards in row)**
- Each card: 320px wide, 200px tall
- Card internal layout:
  - Icon (48×48) at top-left, brand blue stroke
  - Title (text.cardTitle, 18px/600), margin-top 16px
  - Description (text.body, secondary), margin-top 4px
  - Hover: shadow.subtle, border → text.secondary
- Click anywhere on card to invoke action

| Card | Icon | Title | Description | Action |
|---|---|---|---|---|
| Generate from URL | `globe` | Generate from URL | Paste a website to auto-extract brand assets | Navigates to Generate (Screen 3) |
| Start blank | `pencil` | Start from scratch | Describe your hero — no URL needed | Navigates to Generate with URL field hidden |
| Import JSON | `upload` | Import existing | Load a hero from a JSON file | Opens Import modal (Screen 15) |

**How it works section**
- Section header: `text.subsectionHeader` with horizontal rule lines on either side
- 4 numbered steps in vertical list, each `text.body`
- Margin-top: 48px

---

## Screen 3 — Generate Mode

Where the user starts a new hero. This is what you see if there are existing heroes (the app remembers your last screen) or after clicking "Generate from URL" / "Start blank".

### Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Top Nav                                                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────────────────────────────────────┐               │
│   │ Generate a new hero                              │               │
│   │ text.sectionHeader                               │               │
│   │                                                  │               │
│   │ ┌────────────────────────────────────────────┐  │               │
│   │ │ URL (optional)                              │  │               │
│   │ │ [https://stripe.com________________________]│  │               │
│   │ └────────────────────────────────────────────┘  │               │
│   │                                                  │               │
│   │ ┌────────────────────────────────────────────┐  │               │
│   │ │ Describe your hero                          │  │               │
│   │ │ [textarea, 4 rows                          ]│  │               │
│   │ │ [                                          ]│  │               │
│   │ │ [                                          ]│  │               │
│   │ │ Helper: "e.g. dark navy with serif headline"│  │               │
│   │ └────────────────────────────────────────────┘  │               │
│   │                                                  │               │
│   │ Layout                                           │               │
│   │ ◯ Free   ◯ Layout 1   ● Layout 2                │               │
│   │                                                  │               │
│   │ Attachments                                      │               │
│   │ [+ Add logo]   [+ Add images]                   │               │
│   │ ▢ logo.png  •  3 images attached                 │               │
│   │                                                  │               │
│   │                          [Cancel]  [Generate]    │               │
│   └─────────────────────────────────────────────────┘               │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Spec

**Container card:**
- Card style (§3.4)
- Max-width: 720px, centered
- Padding: 32px
- Margin-top: 32px from top nav

**URL field:**
- Label: "URL (optional)" — `text.label`
- Input: full width, type=url, placeholder `https://example.com`
- Helper text: "Paste a website to extract its brand colors, fonts, and assets"

**Prompt textarea:**
- Label: "Describe your hero"
- Textarea: 4 rows, full width
- Placeholder: "Describe the style, mood, or specific elements you want..."
- Character counter at bottom-right (subtle, only shows past 200 chars)

**Layout selector:**
- Label: "Layout"
- Three radio buttons in horizontal row (gap 24px)
- Custom radio styling: 16×16 circle with brand-blue fill when selected
- Each option label: `text.body`
- Tooltip on hover explains each layout (Free / Layout 1 = no images / Layout 2 = with image strip)

**Attachments section:**
- Label: "Attachments"
- Two pill-shaped secondary buttons: "+ Add logo" and "+ Add images"
- After upload, show as chip list below buttons:
  - Each chip: small thumbnail (24×24) + filename + × to remove
  - Chip style: `radius.sm`, border, padding 4px 8px

**Footer actions:**
- Aligned right, gap 12px
- "Cancel" → tertiary button (returns to last screen)
- "Generate" → primary button (disabled if both URL and prompt empty)

### State variations

- **Empty state:** "Generate" button disabled, helper text in muted color
- **URL filled, no prompt:** "Generate" enabled (URL alone is sufficient)
- **Prompt filled, no URL:** "Generate" enabled (text-only mode)
- **Validation error:** red border on offending field + helper text in error color

---

## Screen 4 — Generating (Loading State)

While the backend is scraping + generating. Should never feel like "is this frozen?".

### Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Top Nav                                                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                                                     │
│                       (Centered vertically)                         │
│                                                                     │
│                       ◯ ◯ ◯  (animated spinner, 48×48)              │
│                                                                     │
│                       Generating your hero                          │
│                       text.subsectionHeader, centered               │
│                                                                     │
│                       Step 2 of 4: Extracting brand colors          │
│                       text.body, secondary                          │
│                                                                     │
│                       ─────────●────────────────                    │
│                       (progress bar, 50% filled, brand blue)        │
│                                                                     │
│                       This usually takes 15–30 seconds               │
│                       text.caption                                  │
│                                                                     │
│                                                                     │
│                       [Cancel]  (tertiary button, low emphasis)     │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Spec

**Vertical centering** in the available space below nav.

**Spinner:**
- 48×48
- Continuous rotation, no skip
- Color: `color.brand.primary`

**Status messages (4-step progression):**
1. "Step 1 of 4: Connecting to website" (during scrape)
2. "Step 2 of 4: Extracting brand colors" (during palette + image filter)
3. "Step 3 of 4: Generating hero design" (during LLM call)
4. "Step 4 of 4: Building editor" (during HTML parse)

Each step has its own message; transitions fade between them with `motion.normal`.

**Progress bar:**
- Width: 320px
- Height: 4px
- Background: `color.border.default`
- Fill: `color.brand.primary`, animated to current step's percentage (25 / 50 / 75 / 100)
- Border radius: `radius.pill`

**Cancel button:**
- Tertiary button, `text.caption`
- Margin-top: 32px from progress bar
- On click: aborts request, returns to Screen 3 with form state preserved

### Failure variant

If generation fails:
- Spinner replaced with red error icon (48×48, x-circle)
- Title: "Generation failed"
- Description: short error message + actionable hint
- Buttons: "Try again" (primary) + "Edit prompt" (secondary)

---

## Screen 5 — Studio Editor

The main workspace. This is where the team spends 95% of their time. **Most important screen in the entire product.**

### Full layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Top Nav (56px)                                                              │
├──────────┬──────────────────────────────────────────────┬───────────────────┤
│          │                                              │                   │
│  Version │                                              │  Element Sidebar  │
│  History │           Preview Canvas                     │  (only when       │
│  Panel   │                                              │   image/logo      │
│  (280px) │   ┌─────────────────────────────────────┐    │   selected)       │
│          │   │                                     │    │   (320px)         │
│ ━━━━━━━ │   │  HERO  (40%)  │  LOGIN FORM (60%)  │    │                   │
│  v3 ✓ active │  rendered     │   mock UI           │    │                   │
│  v2       │   │                                     │    │                   │
│  v1       │   │                                     │    │                   │
│  ...      │   └─────────────────────────────────────┘    │                   │
│          │                                              │                   │
│          ├──────────────────────────────────────────────┤                   │
│          │  Timeline Strip (40px)                        │                   │
│          ├──────────────────────────────────────────────┤                   │
│          │                                              │                   │
│          │  Prompt Bar (80px)                            │                   │
│          │  ┌────────────────────────────────────────┐  │                   │
│          │  │ [+] [Type prompt or @element...]  [Gen]│  │                   │
│          │  └────────────────────────────────────────┘  │                   │
│          │                                              │                   │
└──────────┴──────────────────────────────────────────────┴───────────────────┘
```

### 5.1 Left Panel — Version History (default open)

**Container:**
- Width: 280px (collapsed: 56px icon rail)
- Background: `color.surface.default`
- Border-right: 1px solid `color.border.default`
- Full height (top nav to bottom of viewport)

**Header:**
- Height: 48px
- Padding: 12px 16px
- Title: "Version history" — `text.bodyStrong`
- Right side: collapse-toggle icon button (chevron-left when open, chevron-right when collapsed)

**List of checkpoints (scrollable):**
Each checkpoint row:
- Height: 80px
- Padding: 12px 16px
- Layout: thumbnail (40×24) on left + content + actions on right
- Thumbnail: scaled-down hero render, border 1px `color.border.default`, radius `sm`
- Content:
  - Name (text.bodyEmphasis): "Stripe — premium dark"
  - Timestamp (text.caption, secondary): "2 minutes ago"
- Actions (visible on hover): preview-eye, restore-arrow, delete-trash icons (16px each)
- Active checkpoint: left border 3px `color.brand.primary`, background `color.surface.subtle`
- Hover: background `color.surface.subtle`

**Footer:**
- Sticky bottom of panel
- Border-top: 1px solid `color.border.default`
- "Clear all history" tertiary button, full width
- Two-click confirmation (text changes to "Click again to confirm")

### 5.2 Center — Preview Canvas

**Container:**
- Background: `color.background.canvas`
- Padding: 24px
- Flex-grow to fill available width

**Canvas frame:**
- Background: `color.surface.default`
- Border: 1px solid `color.border.default`
- Border radius: `radius.lg`
- Aspect ratio: 1440:900 (the hero design is sized for a 1440×900 viewport, scaled to fit canvas)

**Canvas header bar:**
- Height: 36px
- Padding: 0 16px
- Border-bottom: 1px solid `color.border.default`
- Layout: flex justify-between
- Left: "Preview" label + small dot indicator showing connection state
- Right: fullscreen icon button (24px, expand-arrows-out)

**Canvas content:**
- 40:60 split (hero on left, login form mock on right)
- The hero is the iframe; the login form is a static mock component
- 8px gap between hero and login form
- Both elements have subtle border `color.border.default` to clarify the boundary

**Login form mock spec** (static, never changes during refinement):
- Background: `color.surface.default`
- Padding: 48px 64px
- Centered content
- Title: "Welcome back" — `text.sectionHeader`
- Subtitle: "Sign in to continue" — `text.body` secondary
- Email input + password input (default style)
- Primary button: "Sign in"
- Below button: small text "Don't have an account? **Sign up**"
- Footer: "Forgot password?" link

### 5.3 Timeline Strip

**Container:**
- Position: between canvas and prompt bar
- Height: 40px
- Background: `color.surface.default`
- Border-top: 1px solid `color.border.default`
- Padding: 0 24px

**Strip content:**
- Horizontal scroll if many edits (no scroll bar visible; scroll on hover)
- Each edit = a 12×12 dot
  - Default: `color.border.strong`
  - At playhead: `color.brand.primary` with 3px ring outline
  - Past playhead (still active): `color.brand.primary`
  - Future of playhead (after fork warning): `color.text.disabled`
- Hover dot: tooltip with edit description ("Changed heading color to white")
- Click dot: jumps playhead to that edit
- Drag dot: scrubs through history

**Left of dots:** small "0" marker (initial state)
**Right of dots:** "+" or current edit count
**Far right:** undo/redo buttons (icon-only, 24px each, gap 8px)

### 5.4 Prompt Bar (Bottom)

**Container:**
- Height: 80px (expands to 120px when text wraps)
- Padding: 16px 24px
- Background: `color.surface.default`
- Border-top: 1px solid `color.border.default`

**Inner layout:**
```
[+ icon button]  [        text input          ]  [variation count]  [Send →]
   40×40           flex-grow, multi-line             chip            48×48
```

**+ button:**
- Icon: plus (20px)
- Background: transparent, hover bg `color.surface.subtle`
- Click: opens attachments popover (logo / images / layout selector)

**Text input:**
- Multi-line auto-grow textarea (1-3 lines, scrolls beyond)
- Border: 1px solid `color.border.default`
- Border radius: `radius.lg`
- Padding: 10px 16px
- Placeholder rotates between contextual hints:
  - "Describe an edit, or click an element above…"
  - "Try: change the background to navy"
  - "Type @ to mention an element"
- Focus: border → `color.brand.primary`, subtle glow

**Variation count chip:**
- Small chip: "3 variations"
- Click to change (1 / 3 / 5)
- Default: 3
- Style: `radius.pill`, border `color.border.default`, padding 4px 12px, `text.caption`

**Send button:**
- Primary button, icon-only or icon + "Generate"
- 48×48 (icon-only when input is empty), expands to label + icon when input has text
- Cmd+Enter keyboard shortcut

### 5.5 Right Panel — Element Sidebar

(Only visible when an Image or Logo is selected — see Screen 7 for full spec.)

When not in use, the canvas reclaims this 320px of space.

---

## Screen 6 — Floating Element Toolbar

Appears next to a clicked element (when that element is text/heading/background/button — NOT image/logo, those use the sidebar).

### Layout

```
                  ┌─────────────────────────────────────────┐
                  │  ✨ AI: [type to refine...    ]    [→]  │  ← AI prompt row
                  ├─────────────────────────────────────────┤
                  │  A⁻ A⁺   |  🎨   |  B I U   |  ↵ edit   │  ← Direct controls
                  ├─────────────────────────────────────────┤
                  │  ⚙ Re-generate  •  ⊕ Duplicate  •  🗑   │  ← Element actions
                  └─────────────────────────────────────────┘
```

### Position

- Floats above the selected element in the iframe
- Default position: above-and-centered relative to the element
- If element is at top of canvas: position below instead
- Offset from element: 12px gap

### Container

- Background: `color.surface.default`
- Border: 1px solid `color.border.default`
- Border radius: `radius.lg`
- Shadow: `shadow.dropdown`
- Padding: 0 (rows have own padding)
- Width: 360px (compact mode) or 480px (expanded)
- Z-index: 20

### Row 1 — AI prompt

- Padding: 12px
- Layout: flex
- Sparkle icon (16px) + text input + send button (32×32 icon-only primary)
- Input: borderless, full-grow, placeholder "Describe an edit..."
- On submit: replaces toolbar with VariationsStrip (Screen 8)

### Row 2 — Direct controls

- Padding: 8px 12px
- Border-top: 1px solid `color.border.default`
- Layout: flex with vertical dividers (1px `color.border.default`, 16px height)
- Controls grouped by function with `|` divider between groups

**For Heading/Text element:**
- A⁻ / A⁺: font-size decrease/increase (each click ±2px)
- 🎨: color picker (opens popover with color)
- B / I / U: bold / italic / underline toggles
- ↵ edit: enter inline-edit mode (text becomes contenteditable in the iframe)

**For Background element:**
- 🎨: color/gradient picker (opens GradientPicker component)
- ▦: pattern picker (opens 5-preset gallery)
- 🖼: upload image background (file picker)

**For Button element:**
- Variant dropdown: primary / secondary / ghost
- 🎨: color picker
- ↵ edit: edit button text inline

### Row 3 — Element actions

- Padding: 8px 12px
- Border-top: 1px solid `color.border.default`
- Three text+icon buttons separated by `•` characters
- Each: `text.caption`, color secondary, hover color primary
- "🗑" delete is right-aligned, color → `color.feedback.error` on hover

### Color picker popover (when 🎨 clicked)

- Pop-up below the toolbar
- 280px wide
- Layout:
  - Top: large color preview (full-width × 80px)
  - Middle: HSL sliders (3 sliders stacked)
  - Below: hex input field
  - Bottom: 8 swatches in a row (palette extracted from current hero)
- Apply on change (live preview); auto-close on click-outside

### Pattern picker popover (when ▦ clicked)

- 320px wide
- Grid of 5 pattern thumbnails (each 80×60, radius `md`)
- Below selected pattern: color picker for `pattern_color`, slider for `pattern_size` (8–64px)
- Patterns: solid, gradient, grid, dots, noise

---

## Screen 7 — Element Sidebar

Replaces the right panel when an Image or Logo element is clicked.

### Layout

```
┌─────────────────────────────────┐
│  Image  ╳                        │  ← Header with close
│  text.cardTitle                  │
├─────────────────────────────────┤
│  [Thumbnail preview]             │
│  240×140, current image          │
├─────────────────────────────────┤
│  ✨ Ask AI                        │
│  [textarea: "describe edit"  ]   │
│  [3 variations] [Generate]       │
├─────────────────────────────────┤
│  Replace                         │
│  [⬆ Upload]  [🔗 Paste URL]     │
├─────────────────────────────────┤
│  Adjust                          │
│  Border radius   [─────●──]      │
│  Opacity         [────●───]      │
│  Blur            [●─────────]    │
│  Object fit      [Cover ▾]       │
├─────────────────────────────────┤
│  ⊕ Duplicate    🗑 Remove        │
└─────────────────────────────────┘
```

### Container

- Width: 320px
- Background: `color.surface.default`
- Border-left: 1px solid `color.border.default`
- Full height
- Padding: 0 (sections have own padding)
- Slide-in animation: `motion.slow` (250ms)

### Header

- Padding: 16px
- Border-bottom: 1px solid `color.border.default`
- Title (left): "Image" or "Logo" — `text.cardTitle`
- Close (right): × icon button, 24px

### Thumbnail preview

- Padding: 16px
- Image: 240×140 max, object-fit contain, centered
- Background: checker pattern (subtle, 8×8 squares of #FAFAFA and #F0F0F0) to show transparency
- Border radius: `radius.md`

### Sections

Each section:
- Padding: 16px
- Border-bottom: 1px solid `color.border.default` (except last)
- Section header: `text.label`, color secondary, margin-bottom 12px

**Ask AI section:**
- Textarea: 2 rows, full width
- Below: variation count chip on left, Generate button on right

**Replace section:**
- Two pill secondary buttons in row
- Drag-and-drop active state: dashed border around section

**Adjust section:**
- 4 control rows
- Each row: label on left (`text.body`), control on right
- Border radius: range slider 0–50%
- Opacity: range slider 0–100%
- Blur: range slider 0–20px
- Object fit: dropdown

### Footer actions

- Padding: 12px 16px
- Two text+icon buttons inline (with `space.4` between)
- "Duplicate" — secondary action color
- "Remove" — color hover → `color.feedback.error`

---

## Screen 8 — Variations Picker

After any AI edit, 3 variation thumbnails appear instead of the toolbar/sidebar's normal content.

### Layout (replaces toolbar's Row 1)

```
┌─────────────────────────────────────────────────────────────┐
│  3 variations  •  Hover to preview, click to apply          │  ← Header strip
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│  │ Var 1    │  │ Var 2    │  │ Var 3    │                       │
│  │ thumb    │  │ thumb    │  │ thumb    │                       │
│  │ 200×100  │  │ 200×100  │  │ 200×100  │                       │
│  └─────────┘  └─────────┘  └─────────┘                       │
├─────────────────────────────────────────────────────────────┤
│  [Generate 3 more]              [Cancel]                     │
└─────────────────────────────────────────────────────────────┘
```

### Spec

**Container:**
- Width: 680px (wider than normal toolbar to fit thumbnails)
- Otherwise inherits floating toolbar styling

**Header:**
- Padding: 12px 16px
- Text: "3 variations" (text.bodyStrong) + dot + helper text (text.caption, secondary)

**Thumbnail grid:**
- 3 thumbnails in row, gap 12px
- Each thumbnail: 200×100 rendered hero preview
- Border: 1px `color.border.default`
- Border radius: `radius.md`
- Hover state:
  - Border → `color.brand.primary`
  - Shadow `shadow.subtle`
  - Live update of main preview canvas to show this variation
- Click: applies the variation, dismisses the strip
- Number badge top-left of each thumb: "1" / "2" / "3" in small circle

**Footer:**
- Padding: 12px 16px
- Border-top: 1px solid `color.border.default`
- "Generate 3 more" tertiary button on left
- "Cancel" tertiary button on right

### Loading state (while AI is generating)

- 3 skeleton thumbnails (gray boxes with subtle shimmer)
- Header text: "Generating 3 variations..."
- Cancel button still active to abort

---

## Screen 9 — Multi-Select Mode

When the user Shift+clicks 2+ elements.

### Visual changes

- Each selected element in the iframe gets a **2px solid `color.brand.primary` outline** (thicker than single-select)
- Each selected element gets a **small numeric badge** in its top-right corner (1, 2, 3...)
- Other elements in the iframe dim slightly (opacity 0.7) to emphasize selection

### Floating toolbar (replaces single-element toolbar)

```
┌───────────────────────────────────────────────────────────┐
│  3 elements selected                                       │
├───────────────────────────────────────────────────────────┤
│  ✨ AI: [apply edit to all 3...]                  [→]      │
├───────────────────────────────────────────────────────────┤
│  Common controls (only props all 3 elements share):       │
│  🎨 color   |  Opacity [────●──]   |   Border radius      │
├───────────────────────────────────────────────────────────┤
│  ⊕ Duplicate all   •   🗑 Remove all                       │
└───────────────────────────────────────────────────────────┘
```

### Spec

- Position: floats above the bounding box of all selected elements
- Width: 480px
- Header: "3 elements selected" — `text.bodyStrong`, with × to deselect
- Direct controls: only show controls applicable to ALL selected element types (intersection)
  - If selection is mixed types (e.g., one image + one heading): only common props shown (opacity, blur)
  - If selection is uniform type: full toolbar for that type
- Actions: bulk operations (duplicate all, remove all) — confirmation prompt for remove

### Deselect behavior

- Click outside selection → deselect all
- Esc key → deselect all
- Shift+click already-selected element → remove from selection

---

## Screen 10 — `@mention` Autocomplete

Appears in the main prompt bar when user types `@`.

### Layout

```
                                       ┌──────────────────────────────┐
                                       │  Mention an element           │
                                       ├──────────────────────────────┤
                                       │ [thumb] @heading              │
                                       │         "Welcome back"        │
                                       │ ──────────────────────────── │
                                       │ [thumb] @subheading           │
                                       │         "Sign in to continue" │
                                       │ ──────────────────────────── │
                                       │ [icon]  @logo                 │
                                       │         Logo                  │
                                       │ ──────────────────────────── │
                                       │ [thumb] @image-1              │
                                       │ [thumb] @image-2              │
                                       │ [thumb] @image-3              │
                                       │ ──────────────────────────── │
                                       │ [█]     @background           │
                                       │         Solid #1a1a2e         │
                                       └──────────────────────────────┘
```

### Position

- Anchored above the prompt bar input, aligned to the cursor position
- Pops up immediately when `@` is typed
- Closes on: Escape, click-outside, selection, or backspace removing the `@`

### Container

- Width: 320px
- Max height: 400px (scrollable)
- Background: `color.surface.default`
- Border: 1px solid `color.border.default`
- Border radius: `radius.lg`
- Shadow: `shadow.dropdown`
- Padding: 4px (option container)

### Header

- Padding: 8px 12px
- Text: "Mention an element" — `text.caption`, secondary
- Border-bottom: 1px solid `color.border.default`

### Option row

- Height: 56px
- Padding: 8px 12px
- Layout: 40×24 thumbnail/icon on left + content on right
- Thumbnail/icon:
  - Image/Logo: scaled image
  - Heading/Text: small "Aa" preview tile in the element's font
  - Background: solid color swatch
  - Button: pill-shaped preview
- Content:
  - Element name (`text.bodyEmphasis`): `@heading`, `@logo`, etc.
  - Element preview text or type label (`text.caption`, secondary)
- Hover: background `color.surface.subtle`
- Selected (keyboard nav): background `color.background.canvas`, border-left 3px brand-blue

### Behavior

- Arrow keys navigate options
- Enter or Tab inserts the selected option as a pill in the prompt
- After insertion: pill is rendered inline with brand blue background, white text, `radius.pill`, padding 2px 8px
- User can keep typing more `@` mentions to add multiple
- Backspace on a pill removes it

### Pill in prompt input

- Background: `rgba(10, 102, 194, 0.1)`
- Text: `color.brand.primary`
- Border: 1px solid `color.brand.primary`
- Border radius: `radius.pill`
- Padding: 2px 10px
- Font: `text.body` (14px / 500)
- Inline element, behaves like single character for cursor purposes

---

## Screen 11 — Timeline Strip

Already covered in §5.3. Adding details for the **scrub interaction** and **fork warning**.

### Scrub interaction

- Hover on dot: tooltip appears above dot showing edit description and timestamp
- Click and drag dot: playhead moves smoothly; main preview canvas re-renders at each integer dot position
- Drag indicator: thin vertical blue line follows cursor
- Smooth transition between states: `motion.crawl` (400ms ease-in-out)

### Fork warning

When user makes a new edit while playhead is NOT at the end:

- Modal-style toast appears above the timeline strip:

```
┌───────────────────────────────────────────────────────────┐
│  ⚠  You're editing from an earlier point in history       │
│     New edits will replace the 7 edits after this point.  │
│                                                            │
│  [Continue and replace]   [Cancel — go back to latest]    │
└───────────────────────────────────────────────────────────┘
```

- Background: `color.surface.default`
- Border-left: 4px solid `color.feedback.warning`
- Border-radius: `radius.lg`
- Width: 480px
- Centered horizontally, positioned above the timeline strip
- Buttons: "Continue and replace" primary, "Cancel" tertiary
- Auto-dismiss after 10s if no action (assumes Cancel)

---

## Screen 12 — Version History (left panel detail)

Already covered in §5.1. Adding **per-checkpoint actions** and **empty state**.

### Per-checkpoint hover actions

When hovering a checkpoint row, three icon buttons appear on the right side:

- **Preview** (eye icon): loads the checkpoint into the main canvas without making it active
- **Restore** (rotate-ccw icon): makes this checkpoint the active hero
- **Delete** (trash icon): with confirmation toast

Active checkpoint cannot be deleted (delete icon hidden).

### Empty state (no checkpoints yet)

When the panel is empty:

```
┌─────────────────────────────────┐
│  Version history                 │
├─────────────────────────────────┤
│                                  │
│           [icon: history]        │
│                                  │
│       No saved versions yet      │
│       text.bodyEmphasis          │
│                                  │
│       Publish a hero to save     │
│       it to history              │
│       text.caption, secondary    │
│                                  │
└─────────────────────────────────┘
```

### Collapsed state (icon rail)

- Width: 56px
- Shows only icons vertically:
  - Top: collapse/expand toggle (chevron-right)
  - Below: Up to 5 most recent checkpoints as 32×32 thumbnails (vertical stack with 8px gap)
  - Each thumb: tooltip on hover shows full info

---

## Screen 13 — Fullscreen Preview

When user clicks the expand icon in the preview canvas header.

### Layout

Full viewport modal:

```
┌────────────────────────────────────────────────────────────────────┐
│  Hero name (left)                                       [✕] (right)│  ← Header
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │   HERO (40%)            │            LOGIN FORM (60%)       │  │
│   │   rendered at full      │                                   │  │
│   │   1440×900 proportions  │                                   │  │
│   │                         │                                   │  │
│   │                         │                                   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Spec

**Background:** `color.background.canvas` (#F3F6F8)

**Header:**
- Height: 56px
- Background: `color.surface.default`
- Border-bottom: 1px solid `color.border.default`
- Padding: 0 24px
- Left: hero name (text.cardTitle) + small subtitle "Preview" (text.caption)
- Right: × close button (32×32, icon)

**Canvas area:**
- Padding: 32px
- Centered hero+login at maximum size that fits
- Aspect ratio preserved at 1440:900
- 1px border around canvas (`color.border.default`), `radius.lg`

**Dismiss:**
- × button or Esc key
- Click on background outside canvas

---

## Screen 14 — Publish Flow

Triggered by the "Publish" action.

### Modal layout

```
┌───────────────────────────────────────────────────┐
│  Publish hero                              ╳       │
├───────────────────────────────────────────────────┤
│                                                    │
│  Save this version of your hero to version         │
│  history and download a backup JSON file.          │
│                                                    │
│  Name this version                                  │
│  [Stripe — premium dark v3_______________]         │
│                                                    │
│  ☑ Auto-download JSON to my Downloads folder       │
│  ☑ Mark as active hero                             │
│                                                    │
├───────────────────────────────────────────────────┤
│                            [Cancel]  [Publish]     │
└───────────────────────────────────────────────────┘
```

### Spec

- Modal style (§3.6)
- Width: 480px
- Default name: extracted from initial prompt + version number ("v3")
- Two checkboxes (both checked by default)
- "Publish" button primary

### Success state

After publish:
- Modal closes
- Success toast: "Published 'Stripe — premium dark v3'. Backup saved to Downloads."
- Version history panel updates with new entry at top

---

## Screen 15 — Import / Export Modal

### Export (triggered by "Download JSON" or auto-on-Publish)

No modal — direct file download. Toast notification confirms.

### Import (triggered by "Import JSON" on Welcome or via menu)

```
┌───────────────────────────────────────────────────┐
│  Import a hero                             ╳       │
├───────────────────────────────────────────────────┤
│                                                    │
│  ┌────────────────────────────────────────────┐  │
│  │                                              │  │
│  │     [icon: upload-cloud, 48×48]             │  │
│  │                                              │  │
│  │     Drag and drop a JSON file here           │  │
│  │     text.body, primary                       │  │
│  │                                              │  │
│  │     or  [Choose file]  (secondary button)    │  │
│  │                                              │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  Supported: v2 schema (with editable tree),       │
│  legacy nested, legacy flat                       │
│  text.caption, secondary                          │
│                                                    │
├───────────────────────────────────────────────────┤
│                                  [Cancel]          │
└───────────────────────────────────────────────────┘
```

### Spec

- Modal style (§3.6)
- Width: 560px
- Drop zone: dashed border `color.border.default`, padding 48px, centered content
- Hover/drag-active state: dashed border → `color.brand.primary`, background `rgba(10, 102, 194, 0.04)`
- After file selected:
  - Drop zone replaced with file info + "Importing..." spinner
  - On success: hero loads, modal closes, toast confirms
  - On failure: error message inside drop zone with "Try another file" button

---

## Screen 16 — Settings

Accessed via gear icon in top nav.

### Layout

Modal style, max-width 720px.

```
┌─────────────────────────────────────────────────────┐
│  Settings                                  ╳         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  General                                             │
│  ────────                                            │
│  ☑ Auto-download JSON backup on Publish              │
│  ☐ Show keyboard shortcuts hints                     │
│                                                      │
│  Appearance                                          │
│  ──────────                                          │
│  Theme   ◯ Light  ◯ Dark  ● System                   │
│                                                      │
│  AI                                                  │
│  ────                                                │
│  Default variations per edit:  [3 ▾]                 │
│  Active model: MiniMax M2.7  (set by .env)           │
│                                                      │
│  Data                                                │
│  ────                                                │
│  Storage used: 24.3 MB / ~500 MB                     │
│  [Export all heroes]  [Clear all data]               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Spec

- Sections separated by 32px (`space.8`)
- Each section header: `text.subsectionHeader` with thin underline
- Settings rows: `text.body` left, control right
- "Clear all data" is destructive — uses two-click confirmation
- Storage indicator: thin progress bar, fills with brand blue, warning color when >80%

---

## Screen 17 — Error & Empty States

### Generic error toast

(Already specified in §3.5)

### LLM repair retry indicator

When auto-repair is attempting:
- Inline spinner appears in the variations strip header
- Text: "Re-attempting..."
- After failure: variations strip dismissed, error toast shown with hint

### Network offline

- Detected via browser online/offline event
- Persistent banner appears at top of viewport (above top nav):
  - Background: `color.feedback.warning` background-tint (`rgba(180, 83, 9, 0.08)`)
  - Border-bottom: 1px solid `color.feedback.warning`
  - Text: "You're offline. Direct controls still work; AI edits will resume when reconnected."
  - 40px height
  - `text.caption`

### Hero failed to parse on import

- Modal stays open
- Drop zone replaced with:
  - Red icon (alert-triangle)
  - "Couldn't parse this file"
  - Specific reason in `text.caption`
  - "Try another file" button

### IndexedDB quota exceeded

- Modal appears:
  - Title: "Storage full"
  - Body: "You've reached your browser's storage limit. Delete some old versions to continue."
  - Buttons: "Open version history" (primary), "Cancel"

---

## Screen 18 — Keyboard Shortcuts Reference

Accessed via Help icon in top nav, or `?` key.

### Modal layout

```
┌─────────────────────────────────────────────────────┐
│  Keyboard shortcuts                       ╳          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Editing                                             │
│  ───────                                             │
│  Cmd+Z          Undo                                 │
│  Cmd+Shift+Z    Redo                                 │
│  Cmd+D          Duplicate selected element           │
│  Delete         Remove selected element              │
│  Esc            Deselect / close popovers            │
│                                                      │
│  Selection                                           │
│  ─────────                                           │
│  Click          Select element                       │
│  Shift+Click    Add to selection                     │
│  Cmd+A          Select all                           │
│                                                      │
│  Navigation                                          │
│  ──────────                                          │
│  Cmd+Enter      Submit prompt                        │
│  @              Mention element                      │
│  ?              Show this help                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Spec

- Each shortcut row:
  - Left: keyboard combo using `<kbd>` styling (small dark chip)
  - Right: description
- `<kbd>` style: 22px height, padding 2px 6px, border 1px `color.border.strong`, radius `sm`, background `color.background.canvas`, font `text.code` (13px), color `color.text.primary`

---

## 22. Responsive Behavior

This is a **desktop-first internal tool**. Minimum supported viewport: **1280×800**.

### Below 1280px width

Show a full-screen interstitial:

```
┌──────────────────────────────────────┐
│                                       │
│        [icon: monitor]                │
│                                       │
│   Hero Slot Studio is optimized       │
│   for screens 1280px and wider        │
│                                       │
│   For best experience, use a desktop  │
│   or maximize your browser window.    │
│                                       │
└──────────────────────────────────────┘
```

### Between 1280px and 1440px

- Left panel (Version History) auto-collapses to icon rail
- Canvas takes full available width
- All other layout unchanged

### Above 1440px

- Default layout: left panel expanded, full grid

### Sidebar behavior

- Right sidebar (when active) always 320px regardless of viewport
- If viewport narrows after sidebar opens, canvas shrinks; sidebar does not move

---

## 23. Dark Mode Mapping

(Optional v1.5 addition.)

When dark mode is active, every token swaps:

| Light token | Dark token | Light value | Dark value |
|---|---|---|---|
| `color.background.canvas` | same | #F3F6F8 | #0F172A |
| `color.surface.default` | same | #FFFFFF | #020617 |
| `color.surface.subtle` | same | #F9FAFB | #0B1220 |
| `color.border.default` | same | #E5E7EB | #1E293B |
| `color.border.strong` | same | #D1D5DB | #334155 |
| `color.text.primary` | same | #111827 | #E5E7EB |
| `color.text.secondary` | same | #6B7280 | #9CA3AF |
| `color.text.disabled` | same | #9CA3AF | #4B5563 |
| `color.brand.primary` | same | #0A66C2 | #3B82F6 |
| `color.brand.primaryHover` | same | #004182 | #60A5FA |

Shadows in dark mode use higher alpha (e.g., `rgba(0, 0, 0, 0.3)` instead of `rgba(17, 24, 39, 0.08)`).

Theme switch is instant (no transition) to avoid distracting flash.

---

## 24. Accessibility Requirements

| Requirement | Specification |
|---|---|
| Color contrast | All text ≥ WCAG AA (4.5:1 for body, 3:1 for large text). The locked tokens already satisfy this. |
| Focus indicators | Every interactive element has a visible focus ring: 2px outline `color.brand.primary` with 2px offset. Never `outline: none`. |
| Keyboard navigation | Every interactive element reachable via Tab. Logical tab order matches visual order. Esc closes modals/popovers. |
| Screen reader support | All icons have `aria-label`. All form inputs have associated `<label>`. All modals trap focus and announce on open. |
| Motion | Respect `prefers-reduced-motion`. Disable all transitions and animations when set. |
| Color is not sole indicator | Error states use icon + color + text. Selected state uses border + color, not color alone. |
| Touch targets | Minimum 32×32px for icon buttons (40×40 preferred for primary actions). |
| Skip link | "Skip to main content" link at top of every page (visible only on focus). |

---

## 25. Asset Checklist for Designers

What your design team needs to produce in Figma (or equivalent), in priority order:

### Phase 1 — Foundations (Day 1)

- [ ] Color tokens defined as Figma styles
- [ ] Typography tokens defined as text styles
- [ ] Spacing scale documented
- [ ] Icon library imported (Lucide, 24px and 16px sets)

### Phase 2 — Components (Days 2-3)

- [ ] Buttons (all 4 variants × 3 sizes × all states)
- [ ] Inputs (text, textarea, dropdown, checkbox, radio)
- [ ] Card (default + hover states)
- [ ] Toast (4 types)
- [ ] Modal (3 sizes)
- [ ] Tooltip
- [ ] Dropdown / popover
- [ ] Spinner / loader
- [ ] Top navigation bar
- [ ] Color picker
- [ ] Slider input
- [ ] File upload zone

### Phase 3 — Screens (Days 4-7)

In this order:

- [ ] Empty state / Welcome (Screen 2)
- [ ] Generate mode (Screen 3)
- [ ] Generating loading (Screen 4)
- [ ] Studio editor full layout (Screen 5)
- [ ] Floating element toolbar (Screen 6)
- [ ] Element sidebar (Screen 7)
- [ ] Variations picker (Screen 8)
- [ ] Multi-select mode (Screen 9)
- [ ] @mention autocomplete (Screen 10)
- [ ] Timeline strip + fork warning (Screen 11)
- [ ] Version history panel (Screen 12)
- [ ] Fullscreen preview (Screen 13)
- [ ] Publish modal (Screen 14)
- [ ] Import modal (Screen 15)
- [ ] Settings modal (Screen 16)
- [ ] Error states (Screen 17)
- [ ] Keyboard shortcuts modal (Screen 18)

### Phase 4 — States & polish (Days 8-9)

- [ ] All hover states for clickable elements
- [ ] All focus states for keyboard nav
- [ ] All loading skeletons
- [ ] All empty states
- [ ] Dark mode variants (if pursued)

### Phase 5 — Handoff (Day 10)

- [ ] Component documentation in Figma
- [ ] Clickable prototype linking key screens
- [ ] Asset export specs (icons as SVG, all in 1×, 2×, 3× for raster if any)
- [ ] Design tokens exported as JSON for the dev team

---

## Final Notes

**What this document does:**
- Specifies every screen, component, and state with exact measurements, colors, and behaviors
- Locks the LinkedIn-inspired enterprise theme into reusable tokens
- Provides a clear build order for the design team
- Pairs with `PRD.md` (what we build) and `ARCHITECTURE.md` (how it's wired)

**What this document does NOT do:**
- Show visual mockups (this is a written spec; mockups come from your design team)
- Define brand identity (logo, illustrations, marketing assets)
- Cover marketing pages, onboarding emails, or other surfaces outside the product itself

**Use this document like a build plan.** Have your designer take Phase 1 first, then Phase 2, then Phase 3 screen-by-screen. Each section above contains everything they need to render that screen without guessing.
