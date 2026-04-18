
# CLAUDE.md — Hero Slot Studio

> Claude Code reads this file on every session. It defines how to think about this project, what to build, and what never to violate.
>
> **Before writing code**, read `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/DESIGN_SPEC.md`. These three files are the contract.

---

## 1. What You're Building

**Hero Slot Studio** is an internal tool for a production team. It takes a client website URL, generates a branded login-page hero section from that site's colors and assets, and lets the team refine it through a Figma-style visual editor. The output is JSON in a specific schema that drops into the team's existing deployment pipeline.

**The core architectural insight driving every decision:**

The LLM writes the hero's HTML **exactly once**, during initial generation. After that, it never rewrites HTML again. Every subsequent edit is a small, typed, reversible JSON patch against a specific element ID in a structured tree. This eliminates "LLM rewrote too much and broke something unrelated" failures.

**Release gate:** v1.0 ships when a fresh user completes **18 of 20 real eval prompts** on first or second try.

**Users:** 5–10 internal production team members + one senior engineer who deploys it.

**Non-goals:** not a design tool, not a Figma competitor, not a full-app generator, not multi-tenant, not public-facing, not mobile-responsive.

---

## 2. Current Repo State (as of initial setup)

The repo currently contains **only docs and this CLAUDE.md**. Zero code is scaffolded.

Present:
- `CLAUDE.md` (this file)
- `README.md` (placeholder)
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/DESIGN_SPEC.md`

Missing but referenced by docs (create when reached in the build order):
- `docs/API_SPEC.md` — authoritative endpoint spec (Week 2)
- `docs/EVAL_SET.md` — 20 prompts + acceptance criteria (Week 0)
- `docs/DEPLOYMENT.md` — Docker, CI, env vars (Week 14)
- `evals/prompts.yaml` — eval runner input (Week 0)
- `.claude/agents/*.md` — 6 subagent definitions (create when first needed)

If a task references a missing doc, **create a stub with a TODO and a link back to this file's build order**, then proceed. Do not block.

---

## 3. Build Order (the ramp — start here if repo is empty)

Follow PRD §milestones. Week-0 / Week-1 first. Do not skip ahead.

| Phase | Deliverable |
|---|---|
| Week 0 | **Human activity** — team collects 20 eval URLs+prompts. Claude scaffolds `evals/prompts.yaml` as a TBD stub (rows EVAL-001 … EVAL-020, all `_TBD_`) and proceeds to v0.1. Do not pause waiting for prompts. |
| v0.1 (W1) | FastAPI scaffold + `/health` + Playwright scraper + Pylette + Pillow/imagehash filter + Logfire; Vite+React scaffold + iframe preview shell |
| v0.2 (W2) | `LLMClient` abstraction (both protocols); `/generate` + HTML→Tree parser for all 9 types; VCR.py happy-path tests |
| v0.3 (W3) | A/B model week. Test M2.7, M2.5, GLM-5.1, Kimi K2.5, Qwen3.6 Plus. Winner locked in `.env`. Dropdown removed |
| v0.4 (W4) | Tree renderer; click-to-select via `postMessage`; floating toolbar with AI prompt + direct controls; 3-variation engine |
| v0.5 (W5) | Sidebar for image/logo with Layout 2 rules (1:1:1); direct controls for all 9 types; `/patch` endpoint + schema + repair retry |
| v0.6 (W6) | `@mention` autocomplete; `/multi-patch` endpoint; compound prompts; rationale display |
| v0.7 (W7) | Multi-select (Shift+click); batch edits; drag-to-reorder (ImageStrip + Container siblings) |
| v0.8 (W8) | 5 pattern presets; opacity + blur on all elements; duplicate + regenerate-subtree |
| v0.9 (W9) | Timeline strip + undo/redo + scrubber; named checkpoints; auto-backup JSON to Downloads |
| v0.10 (W10) | JSON export/import (all 3 schemas); fullscreen preview |
| v0.11 (W11) | Team trial — 2 teammates use tool on real work; log issues; extend eval set; fix top 5 |
| v0.12 (W12) | Iteration — trial feedback; re-run eval set; fix remaining |
| v0.13 (W13) | Polish; perf audit; accessibility |
| v0.14 (W14) | `Dockerfile`; `docs/DEPLOYMENT.md`; CI green; eval ≥18/20; deploy to staging |
| v1.0 (W15) | Release gate — fresh user passes 18/20 first-or-second try |

**First concrete files to create when starting cold:** `pyproject.toml`, `frontend/package.json`, `backend/main.py`, `backend/config.py`, `frontend/vite.config.ts`, `Dockerfile`, `.env.example`, `.gitignore`.

---

## 4. Architectural Commitments (NEVER VIOLATE)

These are load-bearing. They override any generic rule.

### 4.1 Tree is source of truth; HTML is a derived view
`ElementTree` is the only source of truth. HTML + CSS are produced by a pure `render_tree()` / `renderTree()`. Never mutate HTML directly. Never store a hero as an HTML string without its tree.

**Renderer contract (both Python and TS must produce byte-equivalent output):**
- Every element emits one root DOM node with class `el-{uuid}` (short UUID form, first 8 chars).
- CSS rules are scoped by that class. No global styles.
- `renderTree(tree) → { html: string, css: string }` — no side effects, no network, deterministic.
- Round-trip test required per element type: `parse(render(tree)) ≈ tree`.

**Variation thumbnails:** 200×100 preview of each variation is generated by **Playwright screenshot** of the rendered iframe in a headless page (`backend/services/thumbnail.py`). Do not use Satori or server-side canvas — Playwright is already a dep.

### 4.2 After initial generation, the LLM emits patches, not HTML
`/generate` is the only endpoint where the LLM produces HTML. Every other LLM interaction (`/patch`, `/multi-patch`, `/regenerate-subtree`) sends a small schema and receives a typed JSON patch. To "re-render a section," use `regenerate_subtree`.

### 4.3 Every patch is reversible
`apply_patch(tree, patch) → (new_tree, inverse_patch)`. Undo is just inverse application. New patch operations require a defined inverse.

### 4.4 Every property has a direct-manipulation control that bypasses the LLM
Color picker, slider, file upload, etc. When AI fails, the user must have a path forward. Add a property → add its direct control in the same change.

### 4.5 Schemas at every boundary
Every LLM response validated by Pydantic. Every API request/response is Pydantic. Every IndexedDB record has a Zod schema. On malformed LLM output: repair loop retries **once**, then returns `LLM_BAD_SHAPE`. Never guess what the model meant.

### 4.6 Multi-patches apply atomically
All patches in a multi-patch response apply, or none do. No half-applied states.

### 4.7 Stateless backend
No per-user server-side state. Restarting the container loses nothing that matters. All user data lives in browser IndexedDB.

### 4.8 The eval set is the release gate
The 20 prompts in `evals/prompts.yaml` are the contract. Weekly regression runs from v0.3. Regressions block merges. v1.0 requires 18 of 20 passing.

### 4.9 DESIGN_SPEC tokens are locked
UI colors, typography, spacing, radius, and shadow tokens are locked in `docs/DESIGN_SPEC.md §1`. Never invent tokens. Build against the 18 numbered screens — do not redesign.

---

## 5. Layering

```
Frontend
├── UI Layer              React components, DOM events, visual state only
├── Tree State & Patches  Zustand + Immer; applies patches, manages timeline
├── Tree Renderer         pure renderTree(tree) → {html, css}
├── API Client            typed fetch wrappers in src/api/
└── Persistence           IndexedDB via idb

Backend
├── Routes                thin HTTP, no logic
├── Services              Generate / Patch / MultiPatch / Regenerate
├── Domain Logic          parser, image filter, palette extractor
├── LLM Abstraction       OpenAI + Anthropic protocol clients
└── Schemas               Pydantic models
```

Routes don't touch the LLM. Services don't handle HTTP. Domain logic never hits the network. Components never touch IndexedDB directly — they go through persistence hooks.

---

## 6. ElementTree — 9 Types (Final)

| Type | Purpose |
|---|---|
| `Container` | Layout wrapper (flex/grid) |
| `Heading` | h1–h6 |
| `Text` | Paragraph |
| `Image` | Single image |
| `Logo` | Brand logo (object-contain) |
| `Background` | Solid / gradient / image / pattern |
| `Button` | CTA |
| `ImageStrip` | 1–3 image arrangement (auto-ratio) |
| `Divider` | Horizontal/vertical rule |

Every element has a stable UUID assigned at parse time. IDs never reused, never regenerated, never reassigned.

**Adding a property** requires all five in the same change:
1. Pydantic schema in `backend/domain/tree.py`
2. Zod schema in `frontend/src/engine/elementSchemas.ts`
3. Rendering branch in both renderers
4. Direct-manipulation control on the toolbar/sidebar
5. Eval test for prompt-driven modification

**Adding a 10th element type** → architectural review (§20).

Full prop reference: `docs/ARCHITECTURE.md §5.2`.

---

## 7. Patch System — 5 Operations (Final)

```python
class PropertyPatch(BaseModel):
    target_id: str
    operation: Literal["update_props", "insert_child", "remove_child",
                       "reorder_children", "regenerate_subtree"]
    property_changes: dict[str, Any] | None = None
    child: Element | None = None
    child_id: str | None = None
    position: int | None = None
    constraints: dict | None = None

class MultiPatchResponse(BaseModel):
    patches: list[PropertyPatch]
    rationale: str  # plain-language, shown in UI
```

Rules:
- Every `apply_patch` returns `(new_tree, inverse_patch)`
- `property_changes` values conform to the target element's prop schema
- Unknown `target_id` fails schema validation — never silently no-op
- Multi-patch: validate every patch, then apply all or none
- Rationale is required on multi-patches — shown to user after apply

Adding a **6th operation** → architectural review (§20).

---

## 8. API Endpoints (7 total)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + model + protocol |
| `POST` | `/fetch-site` | Scrape URL → palette / fonts / logo / filtered-images |
| `POST` | `/generate` | New hero → `tree + html + css` |
| `POST` | `/patch` | Single-element AI edit → 3 variations |
| `POST` | `/multi-patch` | Multi-element / compound AI edit → 3 variations |
| `POST` | `/regenerate-subtree` | Re-gen element + children → 3 variations |
| `POST` | `/parse-html` | Parse imported HTML → tree |

---

## 9. LLM Integration

All LLM calls go through `backend/llm/client.py`. Two concrete clients:
- `OpenAIProtocolClient` → `backend/llm/openai_client.py`
- `AnthropicProtocolClient` → `backend/llm/anthropic_client.py`

Repair loop lives in `backend/llm/repair.py`. System prompts live in `backend/llm/prompts/` (one file per operation).

**Model registry** (`backend/llm/registry.py`):

| Model | Protocol |
|---|---|
| `glm-5.1` | OpenAI |
| `glm-5` | OpenAI |
| `kimi-k2.5` | OpenAI |
| `qwen3.6-plus` | OpenAI |
| `qwen3.5-plus` | OpenAI |
| `mimo-v2-pro` | OpenAI |
| `mimo-v2-omni` | OpenAI |
| `minimax-m2.7` | Anthropic |
| `minimax-m2.5` | Anthropic |

**Default:** `LLM_MODEL=minimax-m2.7` (validated Week 3 A/B).

Services never import provider SDKs directly — always via `LLMClient`.

**Reliability protocol (every call):**
1. Call LLM with Pydantic response schema
2. Validate response
3. On validation failure: repair loop retries **once** with broken response attached
4. On repair failure: return `LLM_BAD_SHAPE` with hint pointing to direct-manipulation fallback

**Prompting discipline:** prompts reference element schemas by name; change schemas → update prompts. User input always in the user message, never concatenated into system prompt.

---

## 10. Frontend Stores (Zustand, 5 total)

| Store | Holds |
|---|---|
| `heroStore` | Active hero (tree, name, html, css, assets) |
| `timelineStore` | `patches[]`, `playheadIndex`, scratch variations |
| `selectionStore` | `selectedIds: string[]`, `hoveredId: string \| null` |
| `uiStore` | Toolbar / sidebar visibility, toasts, modals |
| `settingsStore` | `autoBackupOnPublish`, `modelOverride`, etc. — persisted to IndexedDB |

---

## 11. Scraping, Image Pipeline, Persistence

### Scraping
- Playwright headless Chromium, 15s hard timeout
- SSRF guard at route layer — reject loopback, private, link-local, multicast, reserved
- Return partial results on partial failure — never raise if *some* data available
- Treat scraped content as hostile: strip `<script>`, validate image bytes, re-encode

### Image filter (Layout 2 only)
Thresholds in `backend/config.py`, not hardcoded in filter logic.

Reject: resolution < 400×300, aspect ratio > 5:1, file size < 15KB, social-media CDN URL, perceptual-hash duplicate. Solid-bar detection: crop if < 20% bars, reject if ≥ 20%. Rank by pixel area (cap 5 MP) + color variance + above-fold + hero-section bonuses. Top 3 selected.

### Layout 2 strip
| Images | Layout |
|---|---|
| 3 | 1:1:1 equal columns |
| 2 | 1:1 |
| 1 | Full width |
| 0 | Empty placeholder |
| 4+ | Top 3 only |

Layout auto-derives from child count — no `layout` prop on ImageStrip.

### Persistence (IndexedDB via `idb`)
Stores: `heroes`, `active`, `settings`, `meta`. Schema version in `meta`. Migrations are forward-only, tested on real previous-version snapshots.

Every Publish → auto-download JSON backup to Downloads. Default ON, toggleable.

Quota: soft cap 50 heroes (LRU). Warn at 80% quota. "Clear all data" requires two-click confirm.

---

## 12. Environment Variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `LLM_API_KEY` | yes | — | OpenCode Go API key |
| `LLM_MODEL` | no | `minimax-m2.7` | One of the supported models |
| `LLM_BASE_URL` | no | `https://opencode.ai/zen/go/v1` | Provider endpoint |
| `LLM_TIMEOUT` | no | `180` | Seconds before LLM call cancelled |
| `LLM_VARIATIONS` | no | `3` | Variations per AI edit |
| `PORT` | no | `8787` | Container listen port |
| `BIND_HOST` | no | `0.0.0.0` | Bind interface |
| `ALLOWED_ORIGINS` | no | `http://localhost:8787` | Comma-separated CORS allowlist |
| `LOGFIRE_TOKEN` | no | — | Optional observability |

All env vars read only inside `backend/config.py`. Validated at startup — fail fast on missing required config.

---

## 13. Security

- Never hardcode secrets. `.env` in `.gitignore`. `.env.example` committed with no real values.
- SSRF guard on every URL input at route layer.
- Generated HTML renders in sandboxed iframe: `sandbox="allow-scripts"` with CSP `script-src 'self'`. Only our click-capture IIFE runs inside.
- Strip `<script>` during HTML parse. Renderer never emits them.
- File upload: MIME check, 5MB cap, Pillow-verified image, re-encode before storage.
- CORS via `ALLOWED_ORIGINS` allowlist.
- Never log API keys, tokens, or user content.
- Never return raw exceptions / stack traces to clients.

---

## 14. Error Handling + Observability

### Error shape
```json
{ "error": "human-readable", "code": "MACHINE_CODE", "hint": "optional action", "context": {} }
```

### Registry
| Code | HTTP | Meaning |
|---|---|---|
| `BAD_REQUEST` | 400 | Malformed request body |
| `SSRF_BLOCKED` | 400 | URL failed SSRF check |
| `RATE_LIMIT` | 429 | Provider rate-limited |
| `LLM_TIMEOUT` | 504 | LLM call exceeded timeout |
| `LLM_BAD_SHAPE` | 502 | LLM response invalid after repair |
| `LLM_API_ERROR` | 502 | Provider returned error |
| `INTERNAL_ERROR` | 500 | Fallback (rare) |
| `UNREACHABLE` | payload | Scraper couldn't reach URL |
| `BLOCKED` | payload | Scraper blocked by Cloudflare/403 |

Every user-facing error includes an action: retry button, direct-control suggestion, or help link. AI op fails → surface the relevant direct control.

### Observability
Every service method wrapped in a Logfire span. Span captures: latency, model, tokens, schema validation result, repair retry count, element IDs touched, error class. Logfire optional — `LOGFIRE_TOKEN` unset → no-op. Every log line includes `request_id`. `/health` is always-on, lightweight, built first.

---

## 15. Folder Map (authoritative)

```
hero-slot-studio/
├── CLAUDE.md
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── pyproject.toml
│
├── .claude/agents/         # 6 subagents — create when first needed
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN_SPEC.md
│   ├── API_SPEC.md         # Week 2
│   ├── EVAL_SET.md         # Week 0
│   └── DEPLOYMENT.md       # Week 14
│
├── backend/
│   ├── main.py             # entrypoint: `python -m backend.main`
│   ├── config.py           # only place env vars are read
│   ├── routes/
│   ├── services/
│   ├── domain/             # tree, patches, pure logic
│   ├── parser/
│   ├── scraper/
│   ├── llm/
│   │   ├── client.py
│   │   ├── openai_client.py
│   │   ├── anthropic_client.py
│   │   ├── repair.py
│   │   ├── registry.py
│   │   └── prompts/
│   ├── schemas/
│   ├── observability/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── fixtures/cassettes/   # VCR.py recordings
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── state/          # Zustand stores
│   │   ├── engine/         # tree, patches, renderer, Zod schemas
│   │   ├── api/            # typed fetch clients
│   │   ├── persistence/    # IndexedDB via idb
│   │   ├── iframe/         # preview iframe + click-capture IIFE
│   │   └── tests/
│   └── e2e/                # Playwright tests
│
├── shared/                 # types mirrored between backend and frontend
│   ├── elements.ts
│   ├── patches.ts
│   └── schemas.ts
│
├── evals/
│   ├── prompts.yaml
│   ├── runner.py
│   └── results/
│
└── scripts/
    └── seed-fixtures.py
```

---

## 16. Commands

| Task | Command |
|---|---|
| Backend dev | `uvicorn backend.main:app --reload --port 8787` |
| Frontend dev | `cd frontend && npm run dev` |
| Backend tests | `pytest` |
| Frontend tests | `cd frontend && npm test` |
| E2E tests | `cd frontend && npx playwright test` |
| Eval set | `python -m evals.runner` (single row: `--id EVAL-007`) |
| Docker local | `docker compose up --build` |
| Lint (py) | `ruff check . && ruff format --check .` |
| Lint (ts) | `cd frontend && npm run lint` |

---

## 17. Dependencies

### Python (`pyproject.toml`)
`fastapi`, `uvicorn[standard]`, `pydantic`, `python-multipart`, `playwright`, `pylette`, `pillow`, `numpy`, `imagehash`, `trafilatura`, `httpx`, `tenacity`, `beautifulsoup4`, `openai`, `anthropic`, `logfire`

Dev: `pytest`, `vcrpy`, `ruff`

Post-install: `playwright install chromium` (Docker base image has this pre-installed; local dev must run it).

### Node (`frontend/package.json`)
`react`, `react-dom`, `typescript`, `@types/react`, `@types/react-dom`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, `zustand`, `immer`, `@dnd-kit/core`, `@dnd-kit/sortable`, `react-colorful`, `lucide-react`, `idb`

Dev: `vitest`, `@playwright/test`, `eslint`, `prettier`

**Required scripts in `frontend/package.json`:**
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "lint": "eslint ."
}
```

No version pins in the spec — use latest stable at scaffold time. Lockfiles (`package-lock.json`, `uv.lock`) are the source of truth post-install.

---

## 18. Deployment

Single Docker container via `docker-compose.yml`.

- **Frontend stage:** `node:20-alpine` → builds Vite to `frontend/dist`
- **Final image:** `mcr.microsoft.com/playwright/python:v1.40.0-jammy` (LOCKED — pre-installs Chromium + OS deps)
- Install: `pip install --no-cache-dir .` from `pyproject.toml`
- FastAPI mounts `frontend/dist` via `StaticFiles` — one process, one port, one container
- `CMD ["python", "-m", "backend.main"]`
- Exposed port: `8787`

Never bake secrets into images. Never run containers as root. `.dockerignore` excludes `.env`, `node_modules`, `__pycache__`, test fixtures.

---

## 19. Anti-Patterns (Never Ship)

- LLM rewriting HTML outside initial `/generate`
- A patch applied without a computed inverse
- A multi-patch that applies partially
- Silent retry after schema validation failure
- An element property without a direct-manipulation control
- IndexedDB data destroyed without auto-backup first
- `<script>` tags surviving the HTML parser
- SSRF-unsafe URL reaching the scraper
- User-facing error without an action or hint
- Hero element with a non-UUID or reused ID
- Business logic inside a route file
- Env var read outside `backend/config.py`
- Direct LLM SDK import in a service file
- Raw SQL anywhere (no database exists)
- Server-side per-user state
- Hardcoded `http://localhost`, API keys, or URLs in source
- Inventing UI tokens instead of using `docs/DESIGN_SPEC.md`

---

## 20. Stop and Ask

Before implementing any of these, pause and flag:

- Adding a 10th element type
- Adding a 6th patch operation
- Adding server-side persistence of any kind
- Adding a new LLM provider outside the two supported protocols
- Changing the JSON export schema
- Relaxing iframe sandbox restrictions
- Relaxing the repair-loop retry limit
- Skipping the eval set for a release
- Changing the Docker base image
- Introducing real-time collaboration
- Adding authentication or user accounts

---

## 21. Where Things Live

| Change | Files to touch |
|---|---|
| Add/modify element prop | `backend/domain/tree.py` + `frontend/src/engine/elementSchemas.ts` + both renderers + toolbar/sidebar + tests |
| New API endpoint | `backend/routes/*.py` + `backend/services/*.py` + `backend/schemas/api.py` + `frontend/src/api/*.ts` |
| Change system prompt | `backend/llm/prompts/*.py` |
| Add env var | `backend/config.py` + `.env.example` + `docs/DEPLOYMENT.md` |
| LLM provider behavior | `backend/llm/openai_client.py` or `anthropic_client.py` |
| Image filter rule | `backend/scraper/image_filter.py` + thresholds in `backend/config.py` |
| Editor UI | `frontend/src/components/studio/*` (against `docs/DESIGN_SPEC.md` tokens) |
| Direct-manipulation control | `frontend/src/components/controls/*` + toolbar wiring |
| Eval set | `evals/prompts.yaml` + `docs/EVAL_SET.md` |
| Deployment | `Dockerfile` + `docker-compose.yml` + `docs/DEPLOYMENT.md` |

---

## 22. The Guiding Question

This project is small, focused, internal. It doesn't need microservices, a message queue, Redis, or a database.

It needs to be **reliable on refinement**.

Every commitment in this file exists to serve that one goal. When in doubt:

> **Does this make refinement more reliable, or less?**

If "less" or "neither," the change should probably not happen.
