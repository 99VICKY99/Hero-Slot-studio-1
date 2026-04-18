# Architecture — Hero Slot Studio

> Companion document to `PRD.md`. The PRD describes *what* we're building and *why*. This document describes *how* it fits together.

---

## Table of Contents

1. [System Context](#1-system-context)
2. [High-Level Components](#2-high-level-components)
3. [Layering](#3-layering)
4. [Principles](#4-principles)
5. [The Tree-and-Patch Model (the heart of the system)](#5-the-tree-and-patch-model)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Data Flow](#8-data-flow)
9. [LLM Abstraction Layer](#9-llm-abstraction-layer)
10. [Site Scraping Pipeline](#10-site-scraping-pipeline)
11. [Image Quality Pipeline (Layout 2)](#11-image-quality-pipeline-layout-2)
12. [Storage & Persistence](#12-storage--persistence)
13. [Security Model](#13-security-model)
14. [Observability](#14-observability)
15. [Testing Architecture](#15-testing-architecture)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)
17. [Repository Layout](#17-repository-layout)
18. [Key Decisions Log](#18-key-decisions-log)

---

## 1. System Context

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Production Team Member             Senior Engineer             │
│         (browser)                       (terminal)               │
│            │                              │                      │
│            ▼                              ▼                      │
│   ┌─────────────────────────────────────────────┐                │
│   │       Hero Slot Studio (single Docker)      │                │
│   │   ┌──────────────┐    ┌─────────────────┐  │                │
│   │   │   Frontend   │◄──►│     Backend     │  │                │
│   │   │  Vite/React  │    │     FastAPI     │  │                │
│   │   └──────────────┘    └─────────────────┘  │                │
│   └──────┬───────────────────────┬─────────────┘                │
│          │                       │                              │
│          │                       │                              │
│          ▼                       ▼                              │
│   ┌────────────┐          ┌─────────────────────────────┐       │
│   │ IndexedDB  │          │  External services          │       │
│   │ (browser)  │          │  ├─ OpenCode Go (LLM)       │       │
│   │            │          │  ├─ Client websites (scrape)│       │
│   └────────────┘          │  └─ Logfire (optional)      │       │
│                           └─────────────────────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**External dependencies** (the only things outside the Docker container):

- **OpenCode Go** — LLM provider (MiniMax M2.7 default; M2.5, GLM-5.1, Kimi K2.5, Qwen3.6 Plus available via `.env` swap)
- **Client websites** — fetched at request-time via Playwright for color/font/logo/image extraction
- **Logfire** — optional observability dashboard (no-op if `LOGFIRE_TOKEN` not set)

**Boundary**: everything inside the Docker container is the system. Browser data lives in IndexedDB (per-teammate, never on the server). No shared backend storage.

---

## 2. High-Level Components

| Component | Lives in | Responsibility |
|---|---|---|
| **Studio UI** | Frontend | Canvas, prompt bar, toolbar, sidebar, timeline, version history |
| **Preview iframe** | Frontend | Sandboxed render surface with click-capture for element selection |
| **Tree State Engine** | Frontend | Holds ElementTree in memory; applies patches; manages timeline (undo/redo/scrub) |
| **Tree Renderer** | Frontend (shared module) | Pure function `tree → {html, css}`. Deterministic. |
| **API Layer** | Backend | FastAPI routes — thin HTTP wrappers, no logic |
| **Generate Service** | Backend | Orchestrates: scrape → filter images → LLM → parse HTML → return tree |
| **Patch Service** | Backend | Single-element edit: build context → call LLM → validate patch → return 3 variations |
| **MultiPatch Service** | Backend | Multi-element edit: build context → call LLM for batch → validate → return 3 variations |
| **Regenerate Service** | Backend | Re-generate one subtree with optional constraints |
| **HTML Parser** | Backend | BeautifulSoup-based walker that converts LLM-generated HTML into ElementTree |
| **LLM Abstraction** | Backend | `LLMClient` interface with OpenAI-protocol and Anthropic-protocol implementations |
| **Site Scraper** | Backend | Playwright-driven URL fetch: colors, fonts, logo, candidate images, screenshot |
| **Image Filter** | Backend | Pillow + imagehash pipeline that scores and selects top 3 images for Layout 2 |
| **Color Palette Extractor** | Backend | Pylette K-means on screenshot — guarantees brand colors even when CSS extraction fails |
| **Schema Validator** | Backend | Pydantic models for every LLM response shape (HeroResponse, PropertyPatch, MultiPatchResponse) |
| **Repair Loop** | Backend | On schema validation failure: re-prompt LLM once with broken response + repair instruction |
| **Persistence Layer** | Frontend | IndexedDB wrapper (idb library); auto-backup-to-Downloads on Publish |

---

## 3. Layering

Hero Slot Studio is a **two-tier app with one external dependency**. The starter kit's reference layering is for multi-tenant SaaS — most of it does not apply (no DB layer, no multi-tenancy, no orgs). Here is the layering that actually fits this product:

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Vite + React + TypeScript)                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │  UI Layer        ← React components, toolbars   │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  Tree State      ← Zustand store + Immer        │    │
│  │  & Patch Engine  ← undo/redo/scrub, patch apply │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  Tree Renderer   ← pure tree → {html, css}      │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  API Client      ← typed fetch wrappers         │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  Persistence     ← IndexedDB via idb            │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/JSON
┌────────────────────▼────────────────────────────────────┐
│  Backend (FastAPI)                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Routes          ← thin HTTP, no logic          │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  Services        ← Generate / Patch / etc.      │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  Domain Logic    ← HTML parser, image filter,   │    │
│  │                    palette extractor            │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  LLM Abstraction ← OpenAI / Anthropic clients   │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  Schemas         ← Pydantic models everywhere   │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────┘
                     │
            ┌────────┴────────┬─────────────────┐
            ▼                 ▼                 ▼
       OpenCode Go      Client websites    Logfire
       (LLM API)        (scraping)         (optional)
```

### What each layer is responsible for

**Frontend / UI Layer**
- React components (Toolbar, Sidebar, TimelineStrip, VersionHistory, etc.)
- DOM events (clicks, drags, key shortcuts)
- Visual state only — no business logic

**Frontend / Tree State & Patch Engine**
- Single source of truth for the active hero (Zustand store)
- `applyPatch(tree, patch) → newTree` (uses Immer for immutable updates)
- Computes inverse patches for undo
- Manages timeline array + playhead index
- Fires re-render to iframe on every state change

**Frontend / Tree Renderer**
- Pure function: `renderTree(tree: Element) → { html: string; css: string }`
- Deterministic — same tree input always produces same HTML/CSS output
- Lives in a shared package so backend tests can import it for round-trip checks

**Frontend / API Client**
- Typed fetch wrappers around backend endpoints
- Handles request shaping, response parsing, error normalization
- No business logic

**Frontend / Persistence**
- IndexedDB read/write via the `idb` library
- Auto-backup JSON download on Publish
- Schema migration on first load (legacy → v2)

**Backend / Routes**
- One file per endpoint (`routes/generate.py`, `routes/patch.py`, etc.)
- Receive request → validate input schema → call service → return response
- No domain knowledge — they don't know what an ElementTree is

**Backend / Services**
- One service per use case: `GenerateService`, `PatchService`, `MultiPatchService`, `RegenerateService`
- Orchestrate the sub-components (scraper, image filter, LLM client, parser)
- Own the retry/repair loops

**Backend / Domain Logic**
- HTML parser (`parser/html_to_tree.py`) — pure function
- Image quality filter (`scraper/image_filter.py`) — pure function
- Palette extractor (`scraper/palette.py`) — pure function
- All side-effect-free; easy to unit test

**Backend / LLM Abstraction**
- `LLMClient` abstract base
- Two implementations: `OpenAIProtocolClient`, `AnthropicProtocolClient`
- Static lookup table maps `LLM_MODEL` env var → client instance

**Backend / Schemas**
- Every input and output shape is a Pydantic model
- Single source of truth for what's valid
- Generated TypeScript types ship to frontend (via `datamodel-code-generator` or hand-maintained — TBD in v0.1)

---

## 4. Principles

| Principle | What it means in practice |
|---|---|
| **Tree-first, HTML second** | The ElementTree is the source of truth. HTML/CSS is a derived view. Never mutate HTML directly; mutate the tree, re-render. |
| **LLM emits patches, not HTML** | After initial generation, the LLM never writes a single line of HTML again. It writes structured JSON patches against element IDs. |
| **Direct controls always work** | Every property has a non-AI UI control. If the LLM is having a bad day, the team can still get work done. |
| **Schemas everywhere** | Every LLM response, every API request, every IndexedDB record has a Pydantic/Zod schema. Invalid data is rejected at the boundary. |
| **Atomic patches** | Multi-element edits apply all-or-nothing. Half-applied edits never reach the user. |
| **Reversible operations** | Every patch produces a forward + inverse pair. Undo is free. |
| **Observable everything** | Every LLM call, scraping attempt, schema validation, and patch application is traced. We know what failed and why. |
| **Stateless backend** | No server-side per-user state. The backend can be killed and restarted without the user noticing. |
| **Fail loudly to logs, gracefully to users** | Internal errors are logged in detail. Users see actionable messages with fallback suggestions. |

---

## 5. The Tree-and-Patch Model

This section deserves its own deep-dive because it's the architectural decision the rest of the system depends on.

### The ElementTree

```python
# Backend (Pydantic)
class Element(BaseModel):
    id: str                        # stable UUID
    type: ElementType              # enum of 9 types
    props: dict[str, Any]          # type-specific (validated per-type)
    children: list["Element"] = []

class ElementType(str, Enum):
    Container = "Container"
    Heading = "Heading"
    Text = "Text"
    Image = "Image"
    Logo = "Logo"
    Background = "Background"
    Button = "Button"
    ImageStrip = "ImageStrip"
    Divider = "Divider"
```

```typescript
// Frontend (TypeScript — mirrors backend exactly)
type Element = {
  id: string;
  type: ElementType;
  props: Record<string, unknown>;
  children: Element[];
};
```

### The 9 Element Types — props reference

| Type | Required props | Optional props |
|---|---|---|
| `Container` | `layout` ("flex-row" / "flex-col" / "grid") | `padding`, `gap`, `align`, `justify`, `bg_color` |
| `Heading` | `text`, `level` (1-6) | `font_family`, `font_size`, `font_weight`, `color`, `line_height`, `letter_spacing`, `align` |
| `Text` | `text` | `font_family`, `font_size`, `font_weight`, `color`, `line_height`, `align` |
| `Image` | `src`, `alt` | `width`, `height`, `border_radius`, `object_fit`, `opacity`, `blur` |
| `Logo` | `src`, `alt` | `max_height`, `max_width`, `position` ("left" / "center" / "right") |
| `Background` | `bg_type` ("solid" / "gradient" / "image" / "pattern") | `color_1`, `color_2`, `gradient_direction`, `gradient_kind` ("linear" / "radial"), `image_src`, `overlay_color`, `overlay_opacity`, `pattern_name`, `pattern_color`, `pattern_size` |
| `Button` | `text`, `variant` ("primary" / "secondary" / "ghost") | `color`, `text_color`, `border_radius`, `padding`, `href` |
| `ImageStrip` | `children: list[Image]` (1-3 elements) | `gap` |
| `Divider` | `orientation` ("h" / "v") | `color`, `thickness`, `length` |

Each type has a Pydantic validator that enforces required props and rejects unknown props on input. The frontend has the same validation (mirror Zod schemas).

### The Patch

```python
class PropertyPatch(BaseModel):
    target_id: str
    operation: Literal[
        "update_props",
        "insert_child",
        "remove_child",
        "reorder_children",
        "regenerate_subtree",
    ]
    property_changes: dict[str, Any] | None = None
    child: Element | None = None
    child_id: str | None = None
    position: int | None = None
    constraints: dict | None = None

class MultiPatchResponse(BaseModel):
    patches: list[PropertyPatch]
    rationale: str  # plain-language explanation, displayed in UI
```

### Patch operations

| Operation | What it does | Required fields |
|---|---|---|
| `update_props` | Merge `property_changes` into `target.props` | `target_id`, `property_changes` |
| `insert_child` | Insert `child` at `position` in `target.children` | `target_id`, `child`, `position` (0 = first) |
| `remove_child` | Remove element with `child_id` from `target.children` | `target_id`, `child_id` |
| `reorder_children` | Move `child_id` to `position` within `target.children` | `target_id`, `child_id`, `position` |
| `regenerate_subtree` | Replace `target` and its children with LLM-regenerated subtree | `target_id`, `constraints` (optional) |

### The Patch Application Engine

```python
def apply_patch(tree: Element, patch: PropertyPatch) -> tuple[Element, PropertyPatch]:
    """
    Returns (new_tree, inverse_patch).
    new_tree is an immutable copy with the patch applied.
    inverse_patch is the patch that, if applied to new_tree, returns the original.
    """
```

The function is pure. Same inputs → same outputs. Used by both the patch service (server-side validation) and the frontend tree state engine (client-side application after LLM response).

### Why inverse patches matter

- **Undo** = apply inverse of last patch
- **Redo** = re-apply forward patch
- **Scrub** = re-apply forward patches from index 0 to target index
- **Time travel** = serializable; can be exported/imported

### The Renderer

```typescript
function renderTree(tree: Element): { html: string; css: string } {
  // Pure function — no side effects, no I/O
  // Walks tree top-down
  // Emits HTML and CSS in parallel
  // CSS is scoped to .hero-{id} class for isolation
}
```

The renderer is the *only* place that knows how each element type maps to HTML/CSS. Add a new element type → add a render branch. Change an element's CSS → change one place.

### Round-trip property

For every tree:
```
parse(render(tree).html) ≈ tree
```

It's not bit-for-bit equality (the parser may flatten redundant Containers), but it's *visually equivalent*. This property is asserted in unit tests for every element type. Breaking it breaks export/import compatibility.

---

## 6. Backend Architecture

### Module structure

```
backend/
├── main.py                       # FastAPI app + middleware
├── config.py                     # Env var loading + validation
├── routes/
│   ├── health.py                 # GET /health
│   ├── fetch_site.py             # POST /fetch-site
│   ├── generate.py               # POST /generate
│   ├── patch.py                  # POST /patch
│   ├── multi_patch.py            # POST /multi-patch
│   ├── regenerate.py             # POST /regenerate-subtree
│   └── parse_html.py             # POST /parse-html
├── services/
│   ├── generate_service.py
│   ├── patch_service.py
│   ├── multi_patch_service.py
│   └── regenerate_service.py
├── domain/
│   ├── tree.py                   # Element, ElementType, validators
│   ├── patches.py                # PropertyPatch, apply_patch()
│   └── renderer.py               # tree → HTML/CSS (mirror of frontend)
├── parser/
│   ├── html_to_tree.py           # BeautifulSoup walker
│   └── recognizers.py            # heuristics for element-type detection
├── scraper/
│   ├── playwright_scraper.py     # browser automation
│   ├── image_filter.py           # Pillow + imagehash quality scoring
│   ├── palette.py                # Pylette wrapper
│   └── metadata.py               # trafilatura wrapper
├── llm/
│   ├── client.py                 # LLMClient ABC
│   ├── openai_client.py          # /chat/completions
│   ├── anthropic_client.py       # /v1/messages
│   ├── repair.py                 # auto-repair retry loop
│   └── prompts/
│       ├── generate.py           # system prompts
│       ├── patch.py
│       └── multi_patch.py
├── schemas/
│   ├── api.py                    # request/response models
│   └── llm.py                    # LLM response models
├── observability/
│   ├── logfire_setup.py
│   └── traces.py                 # decorators for service methods
└── tests/
    ├── unit/
    ├── integration/              # uses VCR.py for LLM responses
    └── fixtures/                 # recorded LLM responses
```

### Request lifecycle (example: POST /patch)

```
1. FastAPI receives request
   ↓
2. routes/patch.py:
   - Validates request body against PatchRequest schema
   - Calls patch_service.run(request)
   - Returns response (or error)
   ↓
3. services/patch_service.py:
   - Looks up target element in incoming tree (by ID)
   - Builds context block (target props + sibling summary)
   - Calls llm.client.generate() with patch prompt + Patch schema + n=3
   ↓
4. llm/client.py (concrete: openai_client or anthropic_client):
   - Makes HTTP request to OpenCode Go endpoint
   - Returns raw response
   ↓
5. Back in service:
   - Validates response against MultiVariationResponse schema
   - On schema failure → llm/repair.py retries once
   - For each variation:
     - apply_patch(tree, patch) → new_tree, inverse_patch
     - renderer.render(new_tree) → html, css
     - Generate thumbnail (small CSS-rendered preview)
   - Returns 3 PatchVariation objects
   ↓
6. Logfire trace closes with: latency, model, schema_passes, repair_used, etc.
   ↓
7. Response returned to frontend
```

### Error handling

All routes use a global FastAPI exception handler that converts internal exceptions to the standard error shape:
```json
{ "error": "human-readable message", "code": "MACHINE_CODE", "hint": "optional", "context": {} }
```

| Exception | HTTP code | Error code |
|---|---|---|
| `ValidationError` (request) | 400 | `BAD_REQUEST` |
| `SSRFBlocked` | 400 | `SSRF_BLOCKED` |
| `LLMTimeoutError` | 504 | `LLM_TIMEOUT` |
| `LLMRateLimitError` | 429 | `RATE_LIMIT` |
| `LLMSchemaError` (after repair) | 502 | `LLM_BAD_SHAPE` |
| `LLMAPIError` | 502 | `LLM_API_ERROR` |
| Anything else | 500 | `INTERNAL_ERROR` |

---

## 7. Frontend Architecture

### Module structure

```
frontend/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx                  # entrypoint
│   ├── App.tsx                   # top-level layout
│   ├── components/
│   │   ├── studio/
│   │   │   ├── PromptBar.tsx
│   │   │   ├── PreviewCanvas.tsx        # iframe wrapper
│   │   │   ├── FloatingToolbar.tsx      # for text/heading/bg/button
│   │   │   ├── ElementSidebar.tsx       # for image/logo
│   │   │   ├── TimelineStrip.tsx
│   │   │   ├── VersionHistory.tsx
│   │   │   ├── VariationsStrip.tsx      # 3-thumbnail picker
│   │   │   └── MentionAutocomplete.tsx
│   │   ├── controls/
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── FontPicker.tsx
│   │   │   ├── PatternPicker.tsx
│   │   │   ├── SliderInput.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   └── GradientPicker.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Toast.tsx
│   │       └── ...
│   ├── state/
│   │   ├── heroStore.ts          # Zustand: active hero + tree
│   │   ├── timelineStore.ts      # patches + playhead
│   │   ├── selectionStore.ts     # current selection IDs
│   │   ├── uiStore.ts            # toolbar/sidebar visibility, toasts
│   │   └── settingsStore.ts      # auto-backup, model override
│   ├── engine/
│   │   ├── applyPatch.ts         # mirror of backend domain/patches.py
│   │   ├── inversePatch.ts
│   │   ├── renderer.ts           # mirror of backend domain/renderer.py
│   │   └── elementSchemas.ts     # Zod mirrors of Pydantic models
│   ├── api/
│   │   ├── client.ts             # typed fetch wrappers
│   │   ├── generate.ts
│   │   ├── patch.ts
│   │   ├── multi_patch.ts
│   │   └── types.ts              # shared types (mirror of backend schemas)
│   ├── persistence/
│   │   ├── db.ts                 # idb wrapper
│   │   ├── migrations.ts         # legacy → v2
│   │   └── backup.ts             # auto-download on Publish
│   ├── iframe/
│   │   ├── inject.ts             # IIFE injected into preview iframe
│   │   └── messaging.ts          # postMessage protocol
│   └── tests/                    # Vitest + Playwright
└── package.json
```

### State management

Four Zustand stores, each with a single responsibility:

| Store | Holds | Updated by |
|---|---|---|
| `heroStore` | Active hero (tree, name, html, css, assets) | Patch apply, generate, regenerate |
| `timelineStore` | `patches[]`, `playheadIndex`, scratch variations | Every patch, undo/redo, scrub |
| `selectionStore` | `selectedIds: string[]`, `hoveredId: string \| null` | iframe postMessage events, multi-select |
| `uiStore` | Toolbar visibility, sidebar visibility, toasts, modals | Component interactions |
| `settingsStore` | `autoBackupOnPublish`, `modelOverride`, etc. | Settings panel, persisted to IndexedDB |

Stores subscribe to each other where needed (e.g., when `selectionStore.selectedIds` changes to a single ID, `uiStore` opens the appropriate toolbar/sidebar). Cross-store side effects live in `state/effects.ts`.

### The iframe boundary

The preview is a `<iframe sandbox="allow-scripts">`. The injected IIFE does three things:

```javascript
// Injected at the bottom of every rendered hero HTML
(function() {
  // 1. Capture clicks, find nearest element with data-element-id
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-element-id]');
    if (el) {
      window.parent.postMessage({
        type: 'element_click',
        id: el.dataset.elementId,
        rect: el.getBoundingClientRect(),
        modifiers: { shift: e.shiftKey }
      }, '*');
    }
  });

  // 2. Capture hover for highlighting
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-element-id]');
    if (el) window.parent.postMessage({ type: 'element_hover', id: el.dataset.elementId }, '*');
  });

  // 3. Receive selection updates from parent (highlight outline)
  window.addEventListener('message', (e) => {
    if (e.data.type === 'selection_update') {
      // Apply visual highlight to elements in e.data.ids
    }
  });
})();
```

The renderer adds `data-element-id="{id}"` to every rendered tag, so the IIFE can map DOM events back to tree element IDs.

**Security**: scripts in generated HTML are stripped during the parse step. The IIFE is the only script that runs in the iframe. CSP `script-src 'self'` enforces this.

### The patch lifecycle (frontend perspective)

```
User action (click + prompt OR direct control)
      ↓
selectionStore.selectedIds + the action
      ↓
For AI-driven patches: API call to /patch or /multi-patch
For direct controls:    Patch built locally
      ↓
Receive PropertyPatch (or list)
      ↓
For each variation (AI case):
  - applyPatch(currentTree, patch) → newTree, inversePatch
  - renderer.render(newTree) → html, css
  - Show 3 thumbnails in VariationsStrip
      ↓
User picks variation:
  - heroStore.tree = chosen newTree
  - timelineStore.patches.push(forwardPatch)
  - timelineStore.playheadIndex++
  - iframe.contentWindow.srcdoc = newHtml + newCss + injectedIIFE
      ↓
Done — preview updates, timeline shows new dot
```

For direct controls, only one variation exists (no LLM call), and it applies immediately.

---

## 8. Data Flow

### Generate flow (URL-based)

```
User clicks Generate
      ↓
Frontend: POST /fetch-site { url } ──┐
                                      │
Backend: SSRF check                   │
   → Playwright launches Chromium      │
   → Navigates to URL, waits for load  │
   → Extracts: computed colors, fonts, │
     logo (heuristic), candidate       │
     images (network intercept)        │
   → Takes screenshot (PNG)            │
   → Pylette: K-means on screenshot    │
     → palette[]                       │
   → If layout=2: Pillow + imagehash   │
     → score and filter to top 3       │
   → Returns scrape_result             │
                                      │
Frontend: receives scrape_result ─────┘
      ↓
Frontend: POST /generate {
            prompt, layout, attachments,
            scrape_result
          }
      ↓
Backend (GenerateService):
   → Build system + user prompts
     (includes palette, fonts, logo,
      filtered images, layout context)
   → LLMClient.generate(schema=HeroResponse, n=1)
   → If schema fails: repair retry once
   → Parse HTML with BeautifulSoup walker
     → ElementTree with stable UUIDs
   → renderer.render(tree) → html, css
     (canonical form — may differ from
      LLM's original HTML but visually
      equivalent)
   → Return {tree, html, css, palette, assets}
      ↓
Frontend:
   → heroStore.set({tree, html, css, palette, assets})
   → timelineStore.reset() (new hero, fresh timeline)
   → Persist to IndexedDB
   → Render in iframe
```

### Patch flow (single-element AI edit)

```
User clicks heading element
      ↓
iframe IIFE → postMessage('element_click', id)
      ↓
selectionStore.selectedIds = [id]
uiStore.openFloatingToolbar(id, rect)
      ↓
User types "make it bolder and serif"
      ↓
Frontend: POST /patch {
            heroId,
            targetElementId: id,
            prompt,
            attachments?,
            n_variations: 3
          }
      ↓
Backend (PatchService):
   → Lookup target in tree (validate ID exists)
   → Build context: target.props + sibling summary
   → LLMClient.generate(schema=MultiVariationResponse, n=3)
   → Validate each PropertyPatch
   → For each variation:
     - apply_patch(tree, patch) → new_tree, inverse_patch
     - renderer.render(new_tree) → html, css
     - thumbnail = render_thumbnail(html, css, 200x100)
   → Return {variations: [3 of these]}
      ↓
Frontend:
   → VariationsStrip displays 3 thumbnails
   → User clicks one
   → applyPatch locally for the chosen variation
   → heroStore.tree = chosen new_tree
   → timelineStore.patches.push(forwardPatch); playheadIndex++
   → iframe re-renders
```

### Direct-control flow (zero LLM)

```
User clicks heading, then drags font-size slider from 56 to 72
      ↓
Frontend builds patch locally:
   patch = {
     target_id: id,
     operation: "update_props",
     property_changes: { font_size: 72 }
   }
      ↓
applyPatch(tree, patch) → new_tree, inverse
      ↓
heroStore.tree = new_tree
timelineStore.patches.push(patch); playheadIndex++
iframe re-renders
      ↓
Done. Latency: ~16ms. No network call.
```

### Undo flow

```
User presses Cmd+Z
      ↓
timelineStore:
   if playheadIndex == 0: no-op
   else:
     patch = patches[playheadIndex]
     inverse = inverses[playheadIndex]
     heroStore.tree = applyPatch(heroStore.tree, inverse).newTree
     playheadIndex--
     iframe re-renders
      ↓
Latency: ~16ms.
```

---

## 9. LLM Abstraction Layer

### The problem it solves

OpenCode Go offers ~7 models across two protocols. The product needs to swap models in seconds via `.env`. The two protocols (OpenAI `/chat/completions` and Anthropic `/v1/messages`) have different request/response shapes.

### The abstraction

```python
class LLMClient(ABC):
    @abstractmethod
    async def generate(
        self,
        system: str,
        user: str,
        image: bytes | None = None,
        response_schema: type[BaseModel] | None = None,
        n_variations: int = 1,
        max_tokens: int = 8000,
        timeout: int = 180,
    ) -> dict | list[dict]:
        """Returns parsed JSON matching response_schema (or list of n_variations)."""
```

### Concrete implementations

**OpenAIProtocolClient** (for glm-5.1, kimi-k2.5, qwen3.6-plus, qwen3.5-plus, mimo-v2-pro):
- Uses `openai.AsyncOpenAI` client
- Sets `response_format={"type": "json_object"}` for structured output
- For `n_variations > 1`: sets `n=n_variations` in the request (single API call returns multiple)
- Falls back to parallel async calls if model doesn't support `n`

**AnthropicProtocolClient** (for minimax-m2.7, minimax-m2.5):
- Uses `anthropic.AsyncAnthropic` client
- Uses `tools` API for structured output (passes Pydantic schema as tool definition)
- For `n_variations > 1`: parallel async calls (Anthropic API doesn't support `n` parameter)
- Returns first tool_use block's input

### Routing

```python
MODEL_REGISTRY: dict[str, type[LLMClient]] = {
    "glm-5.1":        OpenAIProtocolClient,
    "glm-5":          OpenAIProtocolClient,
    "kimi-k2.5":      OpenAIProtocolClient,
    "qwen3.6-plus":   OpenAIProtocolClient,
    "qwen3.5-plus":   OpenAIProtocolClient,
    "mimo-v2-pro":    OpenAIProtocolClient,
    "mimo-v2-omni":   OpenAIProtocolClient,
    "minimax-m2.7":   AnthropicProtocolClient,
    "minimax-m2.5":   AnthropicProtocolClient,
}

def get_llm_client() -> LLMClient:
    model = os.environ["LLM_MODEL"]
    client_cls = MODEL_REGISTRY[model]
    return client_cls(
        api_key=os.environ["LLM_API_KEY"],
        base_url=os.environ["LLM_BASE_URL"],
        model=model,
    )
```

### Repair loop

```python
async def generate_with_repair(
    client: LLMClient,
    system: str,
    user: str,
    schema: type[BaseModel],
    **kwargs,
) -> BaseModel:
    raw = await client.generate(system, user, response_schema=schema, **kwargs)
    try:
        return schema.model_validate(raw)
    except ValidationError as e:
        # Repair attempt
        repair_user = (
            f"Your previous response was not valid JSON matching the schema. "
            f"Errors:\n{e.errors()}\n\n"
            f"Previous response:\n{raw}\n\n"
            f"Return ONLY the corrected JSON object."
        )
        raw2 = await client.generate(system, repair_user, response_schema=schema, **kwargs)
        return schema.model_validate(raw2)  # if this fails, exception bubbles up
```

The repair loop is invoked exactly once per failure. If repair fails, the route returns a structured `LLM_BAD_SHAPE` error to the frontend, which surfaces a fallback suggestion to the user.

---

## 10. Site Scraping Pipeline

### Pipeline stages

```
┌──────────────────────────────────────────────────────────────────┐
│  Input: URL string                                               │
│                                                                  │
│  1. SSRF guard                                                   │
│     ├─ Parse URL                                                 │
│     ├─ Resolve hostname → IP                                     │
│     └─ Reject if loopback / private / link-local / multicast     │
│                                                                  │
│  2. Playwright launch                                            │
│     ├─ Headless Chromium                                         │
│     ├─ Viewport: 1440×900                                        │
│     ├─ Timeout: 15s wait_until="networkidle"                     │
│     └─ Capture network responses (intercept image bytes)         │
│                                                                  │
│  3. DOM extraction                                               │
│     ├─ Computed CSS colors (background, text, accent)            │
│     ├─ font-family from common selectors                         │
│     ├─ Logo: heuristic search (img.logo, a.logo > img,           │
│     │        meta[property="og:image"], etc.)                    │
│     └─ Candidate images: <img> tags + CSS background-image       │
│                                                                  │
│  4. Screenshot                                                   │
│     └─ Full viewport PNG, saved to temp dir                      │
│                                                                  │
│  5. Color palette extraction (Pylette)                           │
│     ├─ K-means clustering on screenshot                          │
│     ├─ palette_size=8                                            │
│     └─ Sort by frequency                                         │
│                                                                  │
│  6. Image quality filtering (only if Layout 2)                   │
│     └─ See section 11                                            │
│                                                                  │
│  7. Output: ScrapeResult                                         │
│     ├─ title, description                                        │
│     ├─ palette[], fonts[]                                        │
│     ├─ logo (data URL)                                           │
│     ├─ images[] (data URLs, top 3 if Layout 2)                   │
│     └─ screenshot_path                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Failure modes and fallbacks

| Failure | Behavior |
|---|---|
| Playwright timeout | Returns partial result with `{warning: "page slow to load"}` |
| Cloudflare block (403) | Returns `{error: "site blocks automated access", code: "BLOCKED"}` — frontend surfaces "Use the + button to attach assets manually" |
| URL unreachable | Returns `{error: "couldn't reach URL", code: "UNREACHABLE"}` |
| No images found | Empty `images[]` — Layout 2 strip shows placeholder |
| Logo not found | `logo: null` — generation prompt uses text-only branding |
| Palette extraction fails | Falls back to CSS-extracted colors only |

The principle: **return whatever we got**. Generation can proceed with partial data. The LLM is told what's missing in the prompt.

---

## 11. Image Quality Pipeline (Layout 2)

This is where the PRD's "no white-line images, only the best" requirement gets implemented.

### Scoring algorithm

For each candidate image from the scrape:

```python
def score_image(img: bytes, source_info: dict) -> float | None:
    """Returns a quality score (higher is better), or None if rejected."""

    # Hard rejections
    if source_info.size_bytes < 15_000:
        return None  # too small, probably an icon

    pil_img = PIL.Image.open(BytesIO(img))
    w, h = pil_img.size

    if w < 400 or h < 300:
        return None  # too small

    aspect = max(w/h, h/w)
    if aspect > 5:
        return None  # banner-like

    if source_info.url == logo_url:
        return None  # already used as logo

    if "social" in source_info.url or "facebook" in source_info.url or "twitter" in source_info.url:
        return None  # social icons

    # Auto-crop solid bars
    cleaned = strip_solid_bars(pil_img)
    if cleaned is None:
        return None  # bars couldn't be cleaned

    # Compute score
    score = 0.0

    # Size bonus
    score += min(w * h / 1_000_000, 5.0)  # cap at 5 megapixels

    # Color richness (more diverse colors = better)
    color_variance = compute_color_variance(cleaned)
    score += color_variance * 2

    # Position bonus (above-fold images score higher)
    if source_info.y_position < 800:
        score += 3.0

    # Hero/main section bonus
    if source_info.in_hero_section:
        score += 5.0

    return score


def strip_solid_bars(img: PIL.Image) -> PIL.Image | None:
    """Detect and crop solid-color bars at top/bottom."""
    np_img = np.array(img)
    h = np_img.shape[0]

    top_bar = detect_bar(np_img, from_top=True)
    bot_bar = detect_bar(np_img, from_top=False)

    bar_total = top_bar + bot_bar
    if bar_total / h > 0.20:
        return None  # >20% of image is solid bars, not worth cleaning

    if bar_total > 0:
        cropped = np_img[top_bar : h - bot_bar]
        return PIL.Image.fromarray(cropped)

    return img


def detect_bar(np_img, from_top=True) -> int:
    """Return number of pixel rows that are solid color."""
    rows = np_img if from_top else np_img[::-1]
    bar_height = 0
    for row in rows:
        # All pixels in this row within 5/255 of each other?
        if np.max(row, axis=0).max() - np.min(row, axis=0).min() < 5:
            bar_height += 1
        else:
            break
    return bar_height
```

### Deduplication

After scoring, candidates are deduplicated via perceptual hash:

```python
import imagehash

def dedupe(scored: list[tuple[bytes, float]]) -> list[tuple[bytes, float]]:
    seen_hashes = []
    result = []
    for img_bytes, score in sorted(scored, key=lambda x: -x[1]):
        h = imagehash.phash(PIL.Image.open(BytesIO(img_bytes)))
        if any(h - prev < 5 for prev in seen_hashes):  # threshold for "same image"
            continue
        seen_hashes.append(h)
        result.append((img_bytes, score))
    return result
```

### Selection

```python
def select_top_3(candidates: list[bytes], source_infos: list[dict]) -> list[bytes]:
    scored = [(img, score_image(img, info)) for img, info in zip(candidates, source_infos)]
    scored = [(img, s) for img, s in scored if s is not None]
    scored = dedupe(scored)
    scored.sort(key=lambda x: -x[1])
    return [img for img, _ in scored[:3]]
```

Tunable thresholds (resolution minimum, bar threshold, dedup similarity) live in `config.py` so they can be adjusted without code changes during the Week 0 calibration phase.

---

## 12. Storage & Persistence

### Browser-side (IndexedDB)

```
Database: hero-studio (v2 schema)

├── heroes
│   Key: heroId (uuid)
│   Value: {
│     id, name, tree, currentHtml, currentCss,
│     timeline: PropertyPatch[],
│     inverses: PropertyPatch[],
│     playheadIndex,
│     createdAt, updatedAt
│   }
│
├── active
│   Key: "current"
│   Value: { heroId }
│
├── settings
│   Key: "prefs"
│   Value: {
│     autoBackupOnPublish: boolean,
│     modelOverride: string | null,
│     ...
│   }
│
└── meta
    Key: "schema_version"
    Value: "2"
```

### Migration

On app load:
```typescript
async function migrate() {
  const version = await db.get('meta', 'schema_version');
  if (!version) {
    // Fresh install or pre-v1
    await migrateLegacy();
  } else if (version === '1') {
    await migrateV1ToV2();
  }
  // Add cases as schema evolves
}

async function migrateV1ToV2() {
  // Old schema: localStorage 'variants' array of {html, css, prompt}
  // New schema: each variant becomes a Hero with single-entry timeline
  const legacy = JSON.parse(localStorage.getItem('variants') || '[]');
  for (const v of legacy) {
    const tree = await api.parseHtml(v.html);  // backend endpoint
    await db.add('heroes', {
      id: uuid(),
      name: v.prompt.slice(0, 40),
      tree,
      currentHtml: v.html,
      currentCss: v.css,
      timeline: [],
      inverses: [],
      playheadIndex: 0,
      createdAt: v.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
  }
  await db.put('meta', '2', 'schema_version');
  localStorage.removeItem('variants');
}
```

### Auto-backup on Publish

```typescript
async function publish(heroId: string) {
  const hero = await db.get('heroes', heroId);

  // Mark as a checkpoint in version history
  await db.add('checkpoints', { ...hero, publishedAt: Date.now() });

  // Auto-download JSON backup if setting enabled
  const prefs = await db.get('settings', 'prefs');
  if (prefs.autoBackupOnPublish) {
    const json = exportToV2Schema(hero);
    downloadFile(`hero-${slug(hero.name)}-${Date.now()}.json`, JSON.stringify(json, null, 2));
    showToast(`Backup saved to Downloads/hero-${slug(hero.name)}-${Date.now()}.json`);
  }
}
```

### Quota management

IndexedDB has browser-imposed quotas (typically several GB). To stay safe:

- Soft cap at **50 heroes** in storage (LRU eviction beyond that)
- Warn at **80% of available quota** via `navigator.storage.estimate()`
- "Clear all history" button with two-click confirmation
- Auto-backup on Publish ensures no data loss when LRU evicts

### Backend (no persistent storage)

The backend is **stateless**. Killing and restarting the container loses no user data because none is stored. The only on-disk artifacts are:

- Temporary screenshot files (`/tmp/heroshots/`) cleaned up after 1 hour
- Logfire traces (sent to remote service, not stored locally)

---

## 13. Security Model

### Threat model

This is an **internal tool on the office network**. The threat model is narrow:

- ✅ Defense against accidental misuse (typo'd URLs, broken imports)
- ✅ Defense against malicious *content* in scraped pages (XSS in iframe)
- ❌ NOT defending against malicious users (they're our coworkers)
- ❌ NOT defending against external attackers (not on the public internet)
- ❌ NOT handling PII or regulated data

### Specific mitigations

**1. SSRF protection on `/fetch-site`**

The scraper accepts arbitrary URLs from users. Without protection, a user could request `http://169.254.169.254/` (AWS metadata) or `http://localhost:5432/` (an internal DB). Mitigation:

```python
def is_safe_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    host = parsed.hostname
    if not host:
        return False
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(host))
    except (socket.gaierror, ValueError):
        return False
    if ip.is_loopback or ip.is_private or ip.is_link_local:
        return False
    if ip.is_multicast or ip.is_reserved:
        return False
    return True
```

**2. Generated HTML sandboxing**

LLM-generated HTML renders in an iframe with `sandbox="allow-scripts"` (only the injected click-capture IIFE script can run). This blocks:
- Cookie access
- Parent DOM access
- Network requests (no `<form>` submissions, no XHR)
- Top-level navigation
- Plugins (Flash, etc.)

The `allow-scripts` token is required for the click-capture IIFE. To prevent generated HTML from running its own scripts, the backend HTML parser strips all `<script>` tags before returning the tree. The renderer never emits `<script>` tags. CSP headers on the iframe document enforce `script-src 'self'`.

**3. File upload sanitization**

User-uploaded images go through:
- MIME type check (must be `image/*`)
- File size cap (5 MB)
- Image header validation (Pillow opens it; must be a valid image format)
- Re-encoded to JPEG/PNG before storing as data URL (strips EXIF, removes potential malformed bytes)

**4. CORS**

`ALLOWED_ORIGINS` env var is a comma-separated allowlist. Defaults to `http://localhost:8787,http://hero-studio.local`. The backend rejects requests from other origins.

**5. No secrets in browser**

The `LLM_API_KEY` lives in `.env` on the server. The browser never sees it. All LLM calls are proxied through the backend.

**6. No tracking, no analytics**

No third-party analytics scripts. No cookies. The only network calls are to the backend API and (optionally) Logfire.

---

## 14. Observability

### Logfire integration

Every service method is decorated with a tracing span:

```python
from logfire import span

class PatchService:
    @span("patch.run")
    async def run(self, request: PatchRequest) -> PatchResponse:
        with span("patch.build_context"):
            ctx = self._build_context(request)
        with span("patch.llm_call", model=LLM_MODEL, n=request.n_variations):
            response = await self._call_llm(ctx)
        with span("patch.validate"):
            validated = self._validate(response)
        with span("patch.render_variations"):
            variations = self._render(validated, request.tree)
        return variations
```

Each span automatically captures:
- Latency
- Whether validation passed first try or needed repair
- Error class on exceptions
- Custom attributes (model name, hero ID, target ID)

### What we measure

| Metric | Why |
|---|---|
| Generate success rate | The PRD's release gate is measured against this |
| Patch success rate (per intent type) | Identifies which edit types fail most |
| LLM call latency (P50, P95) | Spot regressions when models update |
| Repair retry rate | If high, the LLM is misbehaving — switch model |
| Scraping tier reached | Tier 1 success vs degraded |
| Image filter rejection rate | If high, thresholds need re-tuning |
| Patches per hero (over time) | Tells us if refinement is being used |
| Time-to-publish per hero | Real productivity signal |

### Local dev

When `LOGFIRE_TOKEN` is unset, traces fall through to `print()` statements. No external dependency required for local development.

---

## 15. Testing Architecture

### Test pyramid

```
                ┌──────────────────────┐
                │  Eval Set (20 prompts)│   ← Weekly, manual + automated
                └──────────────────────┘
                ┌──────────────────────────┐
                │  Integration tests       │   ← VCR.py replays LLM responses
                │  (real LLM responses     │      Backend service tests
                │   recorded once)         │      Frontend Playwright tests
                └──────────────────────────┘
                ┌──────────────────────────────┐
                │  Unit tests                  │   ← Pure functions
                │  - Tree apply_patch          │      Renderer round-trip
                │  - HTML parser               │      Image filter
                │  - Schema validation         │      Patch logic
                │  - SSRF guard                │
                └──────────────────────────────┘
```

### Backend: pytest + VCR.py

VCR.py records real LLM responses on first run and replays them forever after. Tests are deterministic, fast, and free.

```python
@pytest.fixture
def vcr_config():
    return {
        "filter_headers": ["authorization"],
        "record_mode": "once",
    }

@pytest.mark.vcr
async def test_patch_changes_color():
    request = PatchRequest(
        hero_id="test_hero",
        target_id="heading_42",
        prompt="make it navy blue",
        n_variations=3,
    )
    response = await patch_service.run(request)
    assert len(response.variations) == 3
    assert all(v.patches[0].property_changes.get("color") for v in response.variations)
```

Recorded responses live in `tests/fixtures/cassettes/`.

### Backend: pure unit tests (no fixtures needed)

```python
def test_apply_patch_round_trip():
    tree = make_test_tree()
    patch = PropertyPatch(
        target_id="h1",
        operation="update_props",
        property_changes={"color": "#ff0000"},
    )
    new_tree, inverse = apply_patch(tree, patch)
    restored, _ = apply_patch(new_tree, inverse)
    assert restored == tree

def test_renderer_round_trip():
    tree = make_test_tree()
    html, _ = render_tree(tree)
    parsed = parse_html_to_tree(html)
    assert trees_visually_equivalent(tree, parsed)
```

### Frontend: Vitest + Testing Library

Component tests for individual UI pieces. State store tests. Engine (applyPatch, renderer) tests.

### Frontend: Playwright end-to-end

Full flows in a real browser. Mocked backend for determinism.

```typescript
test('user can change background color via picker', async ({ page }) => {
  await page.goto('/');
  await mockBackend(page, fixtures.heroWithBackground);
  await page.click('[data-element-type="Background"]');
  await page.click('[data-control="color-picker"]');
  await page.fill('[data-control="hex-input"]', '#1a1a2e');
  await expect(page.locator('iframe')).toHaveCSS('background-color', 'rgb(26, 26, 46)');
});
```

### The eval set

20 prompts in `evals/prompts.yaml`, each with:
- The prompt text
- The starting state (URL or fixture hero)
- Acceptance criteria (assertions on the resulting tree)

```yaml
- id: 1
  prompt: "change background color to navy"
  starting_state: fixture_stripe_hero
  expected:
    background_color_in_palette: ["#000080", "#0a0a1f", "#1a1a2e", ...]
    other_elements_unchanged: true
```

Run via `make eval`. Outputs a pass/fail score. Tracked weekly from Week 3 onward.

---

## 16. Deployment & Infrastructure

### Container layout

Single Docker image based on `mcr.microsoft.com/playwright/python:v1.40.0-jammy` (Playwright + Chromium + OS deps pre-installed):

```
/app/
├── backend/        ← Python source
├── frontend/dist/  ← Vite static build
├── pyproject.toml
└── entrypoint.sh
```

The backend serves the frontend's static build directly via FastAPI's `StaticFiles`:

```python
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
```

This means **one process, one port, one container**. No separate frontend server. No reverse proxy. No nginx config.

### docker-compose.yml

```yaml
services:
  hero-studio:
    build: .
    ports: ["8787:8787"]
    env_file: .env
    restart: unless-stopped
    logging:
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8787/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

15 lines. Provides restart policy, log rotation, and health check — the things the senior would otherwise have to retype every `docker run`.

### Build pipeline

`Dockerfile`:

```dockerfile
# --- Frontend build stage ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Backend stage ---
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy
WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir .

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

EXPOSE 8787
CMD ["python", "-m", "backend.main"]
```

### CI (Bitbucket Pipelines)

```yaml
pipelines:
  default:
    - step:
        name: Test
        script:
          - cd backend && pip install -e ".[dev]" && pytest
          - cd frontend && npm ci && npm test
    - step:
        name: Build & push
        services: [docker]
        script:
          - docker build -t hero-studio:${BITBUCKET_BUILD_NUMBER} .
          - docker tag hero-studio:${BITBUCKET_BUILD_NUMBER} hero-studio:latest
          - docker push hero-studio:latest
```

Senior runs `docker compose pull && docker compose up -d` on the VM to deploy.

### Environment variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `LLM_API_KEY` | yes | — | OpenCode Go API key |
| `LLM_MODEL` | no | `minimax-m2.7` | One of the 5 supported models |
| `LLM_BASE_URL` | no | `https://opencode.ai/zen/go/v1` | Provider endpoint |
| `LLM_TIMEOUT` | no | `180` | Seconds before LLM call cancelled |
| `LLM_VARIATIONS` | no | `3` | Variations per AI edit |
| `PORT` | no | `8787` | Container listen port |
| `BIND_HOST` | no | `0.0.0.0` | Bind interface |
| `ALLOWED_ORIGINS` | no | `http://localhost:8787` | Comma-separated CORS allowlist |
| `LOGFIRE_TOKEN` | no | — | Optional observability |

---

## 17. Repository Layout

```
hero-slot-studio/
├── README.md                  # quick start
├── PRD.md → docs/PRD.md       # symlink for visibility
├── ARCHITECTURE.md → docs/ARCHITECTURE.md  # this file
├── CLAUDE.md                  # composed coding rules
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── pyproject.toml
│
├── .claude/
│   └── agents/
│       ├── backend-builder.md
│       ├── frontend-builder.md
│       ├── code-reviewer.md
│       ├── test-runner.md
│       ├── deployer.md
│       └── security-auditor.md
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── EVAL_SET.md
│   └── DEPLOYMENT.md
│
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── routes/
│   ├── services/
│   ├── domain/
│   ├── parser/
│   ├── scraper/
│   ├── llm/
│   ├── schemas/
│   ├── observability/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
│           └── cassettes/      # VCR.py recordings
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── state/
│   │   ├── engine/
│   │   ├── api/
│   │   ├── persistence/
│   │   ├── iframe/
│   │   └── tests/
│   └── e2e/                   # Playwright tests
│
├── shared/                    # types/schemas shared by both
│   ├── elements.ts
│   ├── patches.ts
│   └── schemas.ts
│
├── evals/
│   ├── prompts.yaml           # populated Week 0
│   ├── runner.py              # eval set executor
│   └── results/               # JSON outputs per run
│
└── scripts/
    ├── compose-claude-md.sh   # builds CLAUDE.md from rules
    └── seed-fixtures.py       # creates test heroes for local dev
```

---

## 18. Key Decisions Log

Capturing the *why* behind each major architectural choice. Future contributors and the senior engineer can read this to understand why things are the way they are.

| Decision | Choice | Reason |
|---|---|---|
| **Output format the LLM produces** | Tree of typed elements + tiny patches, not raw HTML | Eliminates the entire class of failures the previous code had (placeholder drops, malformed HTML rewrites, unrelated breakage on small edits) |
| **Frontend framework** | Vite + React (not Next.js) | Internal SPA — no SSR needed; Vite gives true single-container deploy without App Router workarounds |
| **State management** | Zustand + Immer | Lightweight; Immer makes immutable tree updates ergonomic; mature in the patches-as-data ecosystem |
| **Persistence** | IndexedDB only (no server DB) | Per-teammate privacy by design; no shared infrastructure to maintain; auto-backup-to-Downloads handles the data-loss risk |
| **Backend framework** | FastAPI | Native Pydantic integration matches the schemas-everywhere principle; async fits LLM I/O |
| **LLM provider** | OpenCode Go (multi-model) | Single subscription, multiple models, hot-swap via `.env` — protects against any single model regressing |
| **Default model** | MiniMax M2.7 (Anthropic protocol) | Lowest hallucination rate on benchmarks; validated against eval set in Week 3 |
| **Two protocols supported** | OpenAI `/chat/completions` + Anthropic `/v1/messages` | OpenCode Go's lineup spans both protocols; abstracting over the difference is ~60 lines and gains 2 valuable model options (MiniMax M2.5 and M2.7) |
| **Site scraping** | Playwright (Chromium headless) | Same as previous code — proven to extract computed colors, fonts, network-intercepted images |
| **Color palette guarantee** | Pylette K-means on screenshot | Ensures we always have brand colors even when CSS extraction fails (CSS-in-JS sites) |
| **Image quality filter** | Pillow + imagehash | Fixes the "white-line images" and low-quality scrape problem; deterministic, no LLM needed |
| **Cloudflare-resistant scraping** | Not in v1 | Premature optimization; user can attach assets via `+` button when scraping fails |
| **HTML parser** | BeautifulSoup 4 | Most permissive HTML parser in Python; tolerates malformed LLM output |
| **Iframe sandboxing** | `sandbox="allow-scripts"` | Required for click-capture IIFE; CSP `script-src 'self'` + parser script-stripping prevents injection |
| **Auto-backup on Publish** | JSON download to user's Downloads folder | Defense against IndexedDB schema migration bugs or browser data loss |
| **Variations per AI edit** | 3 thumbnails, pick one | Matches v0/Midjourney/modern AI tool patterns; gives users choice without overwhelming |
| **Undo/redo** | Patches with computed inverses | Native to the patch architecture; Cmd+Z is ~16ms client-side |
| **Timeline scrubber** | Forks at non-tip edits (Git-like) | Prevents accidental loss; familiar mental model |
| **Single Docker container** | FastAPI serves Vite static build | Simplest possible deploy story; one process, one port |
| **Compose file** | Yes, single service | Provides restart policy + log rotation without retyping flags |
| **Observability** | Logfire (optional) | Free tier sufficient; no-op when token not set; no required external dependency |
| **Testing** | pytest + VCR.py + Vitest + Playwright | Recorded LLM responses make tests deterministic and free; full E2E coverage in real browser |
| **Eval set as release gate** | 18/20 first-or-second-try | Falsifiable, measurable, collected from real production work |
| **Week 0 mandatory** | 2-3 days observing team before code | Architecting in a vacuum was the biggest risk in earlier PRD drafts |
