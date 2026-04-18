# Product Requirements Document — Hero Slot Studio (v5)

## Release Gate (the one number that decides if this ships)

> **v1.0 ships when a fresh user (a team member who hasn't seen the tool before) completes 18 out of 20 prompts from the eval set on their first or second try, using any combination of click, prompt, drag, or `@mention`.**

Not "95% reliability." Not "the AI never fails." Just: a real person, real prompts, measurable outcome. The eval set is collected from the production team during Week 0 — it is not fabricated.

---

## Problem

The existing tool (`fun_hero`) can generate a hero from a URL, but **refinement is unreliable**:
- The LLM rewrites entire HTML on every edit — any prompt can break unrelated parts
- Image placeholders silently get dropped
- Compound prompts often fail
- No undo, no variations, no multi-select
- When the AI fails, the user is stuck

The team's current fallback is to hand-code each hero. That is the failure mode we're eliminating.

The architectural answer is: **the LLM generates the hero once, then emits small typed patches for every edit.** Patches target elements by ID, validate against a strict schema, apply atomically, and are reversible. The AI never rewrites HTML after initial generation — so the entire class of "model broke something unrelated" failures is eliminated by design.

---

## Core Idea (one paragraph)

On generate, the AI writes full HTML once. The backend **parses that HTML into a tree of typed elements** — each with a stable ID and typed props. Every subsequent edit is a **patch**: a tiny JSON object targeting an element ID. Patches come from the AI (via prompt or `@mention`) or from direct controls (color picker, slider, file upload) — both produce the same patch format. Patches are reversible → free undo/redo. Patches are tiny → AI almost can't mess up the shape. Patches are atomic → compound prompts return a list of patches, applied all-or-nothing. The tree re-renders to HTML/CSS on every change.

---

## Core Users

| User | Role |
|---|---|
| **Production team member** | Generates heroes from client URLs, refines them, exports JSON |
| **Senior engineer** | Deploys the service from Bitbucket, configures `.env`, switches LLM models |

Internal tool, ~5-10 teammates. No external users in v1.

---

## What Reliable Refinement Means (v1 scope)

### Single-element edits (click element, type or use controls)
- Change color (text, background, button, border, logo tint)
- Change font family, size, weight, style, line-height, letter-spacing
- Change text content (inline editable + via prompt)
- Resize via slider or prompt
- Border radius (slider 0-50%, circle preset)
- Opacity + blur sliders
- Replace image/logo (upload, URL, drag-drop)
- Remove image/logo
- Padding, margin, alignment

### Background edits
- Solid color
- Linear or radial gradient (2-3 stops, any direction)
- Image background + overlay tint
- **5 pattern presets**: solid, gradient, grid, dots, noise
- Pattern color + size adjustable
- Upload custom image as background

### Structural edits
- Add element (image, text, button, divider)
- Remove element
- Duplicate (Cmd+D or right-click)
- Reorder siblings (drag or prompt)
- Re-generate a single element from scratch

### Multi-element edits
- Shift+click to multi-select 2+ elements
- Apply edit to all selected
- Compound prompts in main bar return one multi-patch response, applied atomically

### Variation workflow (always on)
- Every AI edit returns **3 variations** as thumbnails
- Click to apply one; others dismiss
- "Generate 3 more" if none fit
- Direct controls skip variations (apply instantly)

### Regeneration paths
- "Re-generate this element" — regenerates selected subtree only
- Optional constraints: *"keep same colors"* / *"same layout"*
- "Start over" — fresh canvas, old retained in version history

---

## The Layout 2 Image Spec

### Scraping rules (when URL provided)

Playwright fetches candidate images. Each scored and filtered:

| Filter | Action |
|---|---|
| Resolution < 400×300 | Rejected |
| Extreme aspect ratio (e.g., 10:1) | Rejected |
| Image is the logo (scraped separately) | Rejected |
| File size < 15KB | Rejected |
| Social media CDN sources | Rejected |
| Solid-color bars >5% height at top/bottom | Auto-cropped; if unrecoverable, downranked |
| Duplicates (perceptual hash match) | Deduplicated |
| Inside hero/above-fold section | Boosted |
| Rich color variation | Boosted |

**Top 3 surviving candidates go into the strip.**

### Strip layout rules

| Image count | Layout |
|---|---|
| 3 | 1:1:1 (three equal columns) |
| 2 | 1:1 (two equal halves) |
| 1 | Full width |
| 0 | Empty placeholder: *"No images — attach with + to add"* |
| 4+ scraped | Top 3 used |

Ratio derives automatically from child count — user never picks ratio manually.

### User override via `+` or prompt

Fully flexible. Examples:
- **Replace all**: user uploads 3 → strip uses user's 3 at 1:1:1
- **Uploading 1 to take full space**: user uploads 1 + *"remove these 3, use my image full width"* → strip collapses to 1
- **Add to existing**: scraper found 2, user uploads 1 → strip becomes 3 at 1:1:1
- **Custom arrangement**: *"put my uploaded image in the middle"* → per-slot patches

The ImageStrip's layout auto-derives from its child count (1-3). Beyond 3, UI guides user back.

### Implementation

Adds **Pillow** (pixel-row sampling for solid bars + dimension checks) and **imagehash** (perceptual dedup) to backend. Both small, battle-tested.

---

## Failure Recovery

Reliable refinement doesn't mean the AI never fails. It means **when AI fails, the user is never stuck.**

| Failure mode | What the user sees |
|---|---|
| Malformed JSON from LLM | Auto-repair retry once. If still bad: toast *"AI couldn't do that — try the color picker?"* with relevant direct control highlighted. |
| Patch applied but looks wrong | "Generate 3 more" button. Or Cmd+Z. Or direct controls. |
| Invalid element ID in response | Schema rejects; auto-repair; if still bad, patch silently discarded with toast. |
| LLM timeout (>30s) | Cancelled; retry button + fallback suggestion. |
| Element type doesn't support request | Toolbar surfaces closest available action. Example: *"animate heading"* → *"v1 doesn't support animation. Change color/size/font instead."* Honest, not silent. |

Direct manipulation always works. No edit has zero path to success.

---

## Out of Scope (v1)

| Feature | Why not |
|---|---|
| Real-time collaboration | Internal tool, no shared backend |
| Mobile UI | Desktop-only acceptable |
| Animation in output | Static HTML/CSS per deployment requirement |
| Image cropping inside tool | Crop externally, upload |
| Custom font upload | Google Fonts or system fonts |
| Drag-to-resize non-image elements | Slider + prompt covers it |
| Plugin system | Out of scope |
| AI-generated stock images | v2 candidate (Replicate/SDXL) |
| Saved templates | Version history covers reuse |
| Lasso multi-select | Shift+click is sufficient |
| Rich-text token styling (italic one word) | v2 |
| Per-selection conversational threads | Re-prompting covers workflow |
| Icon, Badge element types | Not common in login heroes |

---

## User Flows

### Flow 1 — Generate with URL
1. Empty canvas + prompt bar + version history
2. User types URL + optional description; picks layout; attaches assets via `+`
3. Backend: Playwright scrape → Pillow/imagehash filter (Layout 2) → Pylette palette → LLM generate → HTML parse → Tree
4. Preview renders at 40:60 (hero + login mock)
5. Auto-saved as first checkpoint

### Flow 2 — Generate without URL (prompt-only)
1. User types description only
2. No scraping; straight to LLM
3. Optionally attach assets via `+`
4. ~15s to result

### Flow 3 — Click-to-Refine
1. Hover → elements highlight
2. Click → selection outline + floating toolbar (text/heading/bg/button) OR sidebar (image/logo)
3. Controls: AI prompt + direct controls + Re-generate + Duplicate/Remove
4. AI prompts → 3 thumbnails → click to apply
5. Direct controls → instant, no LLM
6. Click outside → dismiss

### Flow 4 — Multi-Select Batch
1. Shift+click multiple elements
2. Toolbar: "**3 elements selected**"
3. Prompt or control applies to all
4. Returns 3 variations

### Flow 5 — `@mention`
1. Type `@` → dropdown of all elements with thumbnails
2. Pick pills → write prompt → submit
3. Multi-target → one multi-patch response with rationale

### Flow 6 — Compound Prompt
1. *"change background to navy, make heading white, remove image 3"*
2. Multi-patch response with rationale: *"Changed background to #0a0a1f, heading to white, removed image-3"*
3. Atomic apply as one timeline entry

### Flow 7 — Drag-to-Reorder
1. Click image → drag handle
2. Drag to new position → `reorder_children` patch, instant
3. No LLM call

### Flow 8 — Variations
1. AI prompt → 3 thumbnails below
2. Hover → preview shows variant (not applied)
3. Click → applied; others dismiss
4. "Generate 3 more" if none fit

### Flow 9 — Undo / Redo / Scrub
1. Cmd+Z = undo, Cmd+Shift+Z = redo (instant, client-side)
2. Timeline strip above prompt bar, one dot per patch
3. Drag playhead → tree replays from patch 0 to that point
4. New edit at non-tip → forks (prunes future patches)

### Flow 10 — Re-Generate Subtree
1. Select element
2. Toolbar → "Re-generate this element" + optional constraints
3. LLM regenerates that subtree only
4. Returns 3 variations

### Flow 11 — Version Checkpoints
1. Each Publish = named checkpoint with full tree + timeline
2. Sidebar list with thumbnails, summary, timestamp
3. Preview / Restore / Delete per checkpoint
4. **Auto-backup JSON downloaded to Downloads folder on every Publish**

### Flow 12 — Export / Import JSON
Schema preserves existing deployment pipeline format:
```json
{
  "schema_version": 2,
  "fields": { "palette": {...} },
  "rendered": { "html": "...", "css": "..." },
  "tree": {...},
  "timeline": [...]
}
```
Import: tree present → editable; absent → HTML reconstructed (lossy); legacy `{html, css}` accepted.

### Flow 13 — Switch LLM Model
- Senior edits `.env`: `LLM_MODEL=minimax-m2.7` → any supported ID; restart container
- Week 3 only: model dropdown in Studio header for A/B against eval set
- After Week 3: dropdown removed; default locked

---

## Technical Architecture

### ElementTree

```python
class Element(BaseModel):
    id: str                  # stable UUID
    type: ElementType
    props: dict[str, Any]
    children: list["Element"] = []
```

**9 element types**:

| Type | Purpose |
|---|---|
| `Container` | Layout wrapper (flex/grid) |
| `Heading` | h1-h6 |
| `Text` | Paragraph |
| `Image` | Single image with shape options |
| `Logo` | Brand logo (object-contain) |
| `Background` | Solid / gradient / image / pattern |
| `Button` | CTA with variants |
| `ImageStrip` | 1-3 image arrangement (auto-ratio) |
| `Divider` | Horizontal/vertical rule |

### Generate Flow
```
POST /generate { url?, prompt, layout, attachments? }
  ↓
If url: Playwright → scrape + screenshot
        Pillow + imagehash → filter images (Layout 2)
        Pylette → palette from screenshot
  ↓
LLM → HTML+CSS (single call, strict JSON)
  ↓
Validator → Pydantic + repair retry
  ↓
Parser → BeautifulSoup → ElementTree with UUIDs
  ↓
Response { tree, html, css, palette, assets }
```

### Patch Flow
```
POST /patch { heroId, targetId, prompt, attachments?, n: 3 }
  ↓
Context builder: target props + sibling summary
  ↓
LLM → small prompt with Patch schema, n=3
  ↓
Validator → per-variation schema check
  ↓
Tree updater → 3 trees → 3 HTML/CSS → 3 thumbs
  ↓
Response { variations: [{patchId, forwardPatch, inversePatch, html, css, thumb}] }
```

### Multi-Patch Flow
```
POST /multi-patch { heroId, prompt, targets[], attachments? }
  ↓
Context: all targets + relationships
  ↓
LLM → patches list + rationale, n=3
  ↓
Validator → per-patch per-variation
  ↓
Response { variations: [{patches[], rationale, forwardBatch, inverseBatch, html, css, thumb}] }
```

### Patch Schema

```python
class PropertyPatch(BaseModel):
    target_id: str
    operation: Literal["update_props", "insert_child",
                       "remove_child", "reorder_children",
                       "regenerate_subtree"]
    property_changes: dict[str, Any] | None = None
    child: Element | None = None
    child_id: str | None = None
    position: int | None = None
    constraints: dict | None = None

class MultiPatchResponse(BaseModel):
    patches: list[PropertyPatch]
    rationale: str
```

Small schema = hard for LLM to break.

### Direct-Manipulation Controls (zero LLM)

Every prop → UI control → client-side patch, no network:
- Color → react-colorful
- Font size → slider + numeric
- Font family → dropdown (30 curated Google Fonts)
- Border radius → slider with circle preset
- Opacity / Blur → sliders
- Image src → upload + URL + drag-drop
- Pattern → 5 presets + color/size controls

### Stack

| Layer | Choice |
|---|---|
| Backend | **FastAPI** (Python 3.11+) |
| Frontend | **Vite + React + TypeScript + Tailwind** (not Next.js — true single-container SPA, no SSR needed) |
| State | **Zustand** + **Immer** |
| Drag-and-drop | **dnd-kit** |
| Color picker | **react-colorful** |
| Icon library | **Lucide React** |
| Preview iframe | `sandbox="allow-scripts"` + injected click-capture IIFE |
| Tree → HTML | Pure TypeScript function |
| Scraper | **Playwright** (Chromium headless) |
| Color extraction | **Pylette** |
| Image filter | **Pillow** + **imagehash** (Layout 2) |
| Metadata | **trafilatura** |
| HTTP client | **httpx** + **tenacity** |
| HTML parser | **BeautifulSoup 4** + custom walker |
| LLM SDKs | **OpenAI SDK** + **Anthropic SDK** |
| Storage | **IndexedDB** via `idb` |
| Observability | **Logfire** |
| Testing | **pytest** + **VCR.py** (backend); **Vitest** + **Playwright** (frontend) |
| Container | **Docker** single service via `docker-compose.yml` |

### LLMClient Abstraction

```
LLMClient
├── OpenAIProtocolClient  → /chat/completions
│     glm-5.1, kimi-k2.5, qwen3.6-plus, qwen3.5-plus, mimo-v2-pro
└── AnthropicProtocolClient → /v1/messages
      minimax-m2.7, minimax-m2.5
```

Both: `async generate(system, user, image?, schema?, n=3) -> dict`. Static lookup table maps `LLM_MODEL` → client. Default **MiniMax M2.7**, validated in Week 3 A/B.

### API Contract

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + model + protocol |
| `POST` | `/fetch-site` | Scrape URL → palette/fonts/logo/filtered-images |
| `POST` | `/generate` | New hero → tree + html + css |
| `POST` | `/patch` | Single-element AI edit → 3 variations |
| `POST` | `/multi-patch` | Multi-element / compound AI edit → 3 variations |
| `POST` | `/regenerate-subtree` | Re-gen element + children → 3 variations |
| `POST` | `/parse-html` | Parse imported HTML → tree |

### Data Model (IndexedDB v2)

```
heroes:    { id, name, tree, currentHtml, currentCss,
             timeline[], playheadIndex, createdAt, updatedAt }
active:    { heroId, playheadIndex }
settings:  { autoBackupOnPublish, modelOverride, ... }
meta:      { schema_version: "2" }
```

### Reliability Strategy

1. Pydantic schema validation on every LLM response
2. Auto-repair retry once
3. Graceful failure → structured error + direct-control suggestion
4. Multi-patch atomicity — all-or-nothing
5. Optimistic UI — deterministic patches instant, AI patches show shimmer
6. Eval set regression — measured weekly from Week 3

---

## `.claude/` Setup

```
hero-slot-studio/
├── .claude/
│   └── agents/
│       ├── backend-builder.md
│       ├── frontend-builder.md
│       ├── code-reviewer.md
│       ├── test-runner.md
│       ├── deployer.md
│       └── security-auditor.md
├── CLAUDE.md                # rules: 00, 10, 20, 45, 70, 80, 85, 90, 99
└── docs/
    ├── PRD.md               # this file
    ├── ARCHITECTURE.md
    ├── API_SPEC.md
    ├── EVAL_SET.md          # 20 prompts + acceptance (Week 0 output)
    └── DEPLOYMENT.md
```

---

## Deployment

Single Docker service via compose (for restart + log rotation):

```bash
git clone <bitbucket-repo>
cd hero-slot-studio
cp .env.example .env
docker compose up -d
```

`docker-compose.yml`:
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
```

`.env.example`:
```
# LLM
LLM_API_KEY=
LLM_MODEL=minimax-m2.7
LLM_BASE_URL=https://opencode.ai/zen/go/v1
LLM_TIMEOUT=180
LLM_VARIATIONS=3

# Server
PORT=8787
BIND_HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:8787,http://hero-studio.local

# Observability (optional)
LOGFIRE_TOKEN=
```

---

## Milestones (15 weeks, quality over speed)

**Week 0 is mandatory** and happens before any code. Each week ends with a working deliverable.

| Phase | What | Target |
|---|---|---|
| **Week 0** | **Discovery.** 2-3 days with production team using `fun_hero` on real work. Log failures, workarounds, requests. **Collect 20 eval-set URLs + prompts from real team work.** Write `docs/EVAL_SET.md`. **Measure baseline** of current `fun_hero` against those 20. | Week 0 |
| **v0.1** | FastAPI scaffold + `/health` + Playwright scraper + Pylette + Pillow/imagehash image filter + Logfire. Vite + React scaffold + iframe preview shell. | Week 1 |
| **v0.2** | `LLMClient` abstraction (both protocols). `/generate` with HTML→Tree parser for all 9 types. VCR.py happy-path tests. | Week 2 |
| **v0.3** | **A/B model week.** Test M2.7, M2.5, GLM-5.1, Kimi K2.5, Qwen3.6 Plus against eval set. **Winner locked in `.env`.** Dropdown removed. | Week 3 |
| **v0.4** | Tree renderer. Click-to-select via postMessage. Floating toolbar (text/heading/bg) with AI prompt + direct controls. 3-variation engine. | Week 4 |
| **v0.5** | Sidebar for image/logo with strict Layout 2 rules (1:1:1 auto-ratio). Direct controls for all 9 types. `/patch` endpoint + schema + repair retry. | Week 5 |
| **v0.6** | `@mention` autocomplete. `/multi-patch` endpoint. Compound prompts working. Rationale display. | Week 6 |
| **v0.7** | Multi-select (Shift+click). Batch edits. Drag-to-reorder (ImageStrip + Container siblings). | Week 7 |
| **v0.8** | 5 pattern presets. Opacity + blur on all elements. Duplicate + Re-generate-subtree. | Week 8 |
| **v0.9** | Timeline strip + undo/redo + scrubber. Named checkpoints. Auto-backup JSON to Downloads. | Week 9 |
| **v0.10** | JSON export/import (all 3 schemas). Fullscreen preview. | Week 10 |
| **v0.11** | **Team trial.** Two teammates use tool on real client work for a week. Log issues; extend eval set; fix top 5 issues. | Week 11 |
| **v0.12** | **Iteration.** Address trial feedback. Re-run eval set. Fix remaining failures. | Week 12 |
| **v0.13** | Polish pass: smooth interactions. Performance audit. Accessibility (keyboard nav, focus). | Week 13 |
| **v0.14** | Dockerfile. `docs/DEPLOYMENT.md`. CI green. Playwright integration tests. Eval ≥18/20. Senior deploys to staging. | Week 14 |
| **v1.0** | **Release gate:** fresh user completes 18/20 eval prompts first or second try. If yes, ship. If no, identify failures, fix, retry. | Week 15 |

If Week 15 fails the gate, we do not ship. We fix and retry. The gate is the contract.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| HTML→Tree parser fails on creative LLM output | Medium | High | Permissive parser; unknowns become Containers; weekly eval regression |
| Image quality filter rejects legitimate images | Medium | Medium | Thresholds tuned Week 0/1 against real client URLs; tunable via config not code |
| Multi-patch response malformed | Medium | High | Small schema + repair retry; fallback applies patches one-at-a-time if batch fails |
| 3-variation calls slow on some models | Medium | Medium | Parallel async calls when model lacks native `n`; measured Week 3 |
| IndexedDB migration loses team work | Low | Critical | Auto-backup JSON on Publish is first defense; migrations tested on real snapshots |
| MiniMax M2.7 down/rate-limited | Low | High | `.env` swap to fallback in 10 seconds |
| Drag-to-reorder conflicts with click-to-select | Low | Medium | Standard dnd-kit 8px-threshold before drag starts |
| Timeline forks confuse users | Medium | Low | Warning toast: *"New edits will replace edits after this point"* |
| Eval set doesn't reflect real usage | Low | Medium | Week 0 collects from actual production work; grows through use |
| Week 11 trial reveals fundamental UX problem | Medium | High | Week 12 reserved for feedback; scope can be cut Weeks 13-14 |

---

## Appendix A — Why Build vs Buy

| Alternative | Why it doesn't fit |
|---|---|
| `shadcn/ui` + hand-code | No automatic brand matching; no 40:60 constraint; still dev time per client |
| Vercel v0 | No self-hosting; no integration with team's JSON schema; data leaves internal network |
| Framer AI | Not a dev tool; output doesn't integrate with pipeline |
| Figma AI + manual export | Current workflow; slow. The problem we're solving. |
| Claude Artifacts | No integration, no persistent state |

No off-the-shelf tool satisfies: URL → branded hero → team's JSON schema → iteratively refinable → self-hosted → model-switchable → internal-only. Build justified.

---

## Appendix B — Eval Set Starter

20 prompts the tool must handle. Real URLs collected Week 0. Target prompts include (final list TBD after Week 0):

1. Change background color (direct)
2. Change heading font + size + color (multi-property)
3. Replace logo with uploaded file
4. Add 4th element (button below heading)
5. Remove 3rd image
6. Make all images circular (multi-select)
7. Change headline to Playfair Display
8. Replace 1 scraped image, keep 2 scraped
9. Background grid pattern in brand color
10. Add CTA button under heading
11. Swap headline ↔ subheading (reorder)
12. *"Make it feel premium"* (compound, subjective)
13. Undo last 3 edits
14. Reorder: drag image-2 to position 1
15. Duplicate the heading
16. Re-generate just the heading, keep color
17. Subtle blur on background image
18. `@logo center, @heading bigger` (multi-target)
19. *"Simplify, this looks too busy"* (compound, subjective)
20. Start over from blank, keep palette

Each with acceptance criteria in `docs/EVAL_SET.md`.

---

## Appendix C — JSON Schemas

**v2 export:**
```json
{
  "schema_version": 2,
  "fields": { "palette": {...} },
  "rendered": { "html": "...", "css": "..." },
  "tree": { ... },
  "timeline": [ ... ]
}
```

**Legacy nested import** (from v1 `fun_hero`):
```json
{ "fields": { "palette": {...} }, "rendered": { "html": "...", "css": "..." } }
```

**Legacy flat:**
```json
{ "html": "...", "css": "..." }
```

Import tries v2 tree → falls back to legacy nested → falls back to flat. Unparseable HTML loads as single uneditable block with "Re-generate to enable editing."

---

## Appendix D — Model Options

| Model | Protocol | Role |
|---|---|---|
| MiniMax M2.7 | Anthropic `/messages` | **Week 3 default candidate** — validated by eval |
| MiniMax M2.5 | Anthropic `/messages` | Speed fallback |
| GLM-5.1 | OpenAI `/chat/completions` | Reliability fallback |
| Kimi K2.5 | OpenAI `/chat/completions` | A/B candidate |
| Qwen3.6 Plus | OpenAI `/chat/completions` | A/B candidate (best structured-JSON reliability) |

Default locked after Week 3. `.env` swap remains available post-launch.
