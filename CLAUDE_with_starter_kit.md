# CLAUDE.md — Hero Slot Studio

> Claude Code reads this file on every session in this repository. It defines how to think about the project, which rules to enforce, and the architectural commitments that must never be violated.
>
> **This file is composed from the Student Starter Kit's engineering rules** (`coding-rules/`) — adapted for Hero Slot Studio. The generic starter-kit rules apply unless overridden by a project-specific rule in §3 onward.
>
> Read `docs/PRD.md` and `docs/ARCHITECTURE.md` before writing code.

---

## 1. Lineage — Where This File Came From

This CLAUDE.md is assembled from the Student Starter Kit (`student-starter-kit/coding-rules/`) using the following rules:

| Rule # | Rule name | What it contributes |
|---|---|---|
| **00** | Global Architect | Operating mode, separation of concerns, extend-before-invent |
| **10** | Backend FastAPI | Route/service/repository layering, Pydantic schemas, async I/O |
| **20** | Frontend Next.js (adapted for Vite+React) | TypeScript, small components, centralized API clients |
| **35** | API Contracts | Versioned endpoints, typed schemas, consistent error shape |
| **45** | Environment Config | `.env` validation at startup, no secrets in code |
| **60** | AI Agents (partial) | Structured LLM outputs, tool-call validation, prompt templates |
| **70** | Security | No hardcoded secrets, input sanitization, prompt injection defense |
| **80** | Testing & Quality | Unit + integration tests, recorded fixtures for LLM calls |
| **85** | Error & Observability | Structured error shape, request IDs, health endpoint |
| **90** | DevOps & Deployment | Docker multi-stage, no secrets in images, CI gates |
| **99** | Response Style | Minimal production-ready changes, no toy code |

Rules intentionally omitted and why:

- **30** (Database PostgreSQL): this project has no database — all state is browser IndexedDB
- **40** (Cache Redis): no Redis — stateless backend
- **50** (RAG System): not a RAG application
- **55** (Data & Model Versioning): we use third-party LLMs, not trained models

Agent definitions (from `student-starter-kit/agents/`) ported into `.claude/agents/`:

- `backend-builder` — for FastAPI endpoint work
- `frontend-builder` — for React component work
- `code-reviewer` — as PR quality gate
- `test-runner` — for running pytest + Vitest
- `deployer` — for Docker and Bitbucket pipeline
- `security-auditor` — for SSRF and iframe sandbox reviews

Agents NOT ported (not relevant to this project):

- `db-architect`, `api-integrator`, `mcp-builder`, `researcher`

---

## 2. What You're Working On

**Hero Slot Studio** is an internal tool for a production team. It takes a client website URL, generates a branded login-page hero section from that site's colors and assets, and lets the team refine it through a Figma-style visual editor. The output is JSON in a specific schema that drops into the team's existing deployment pipeline.

**The core architectural insight driving every decision:**

The LLM writes the hero's HTML exactly once, during initial generation. After that, it never rewrites HTML again. Every subsequent edit is a small, typed, reversible JSON patch against a specific element ID in a structured tree. This design eliminates the class of "LLM rewrote too much and broke something unrelated" failures that make the team's previous tool unusable.

**Release gate:** v1.0 ships when a fresh user completes 18 of 20 real prompts (collected during Week 0 from the production team) on their first or second try.

**Users:** 5–10 internal production team members + one senior engineer who deploys and maintains it.

**Explicit non-goals:** not a design tool, not a Figma competitor, not a full-app generator, not multi-tenant, not public-facing, not mobile-responsive.

---

## 3. Default Operating Mode (from Rule 00)

You are the principal architect and senior engineer for this repository.

- Think like an architect first, implement like a senior engineer second.
- Preserve architectural consistency. This project has strong load-bearing commitments (§4). Do not silently work around them.
- Before implementing, read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/API_SPEC.md`, `docs/EVAL_SET.md`, and `docs/DEPLOYMENT.md`. If a request doesn't fit what those describe, pause and ask.
- Extend existing patterns before inventing new ones.
- Keep code readable, typed, testable, secure, deployable.
- Do not introduce breaking changes unless explicitly requested.
- Do not rewrite unrelated files. Do not reformat files when editing one part.

---

## 4. Hero Slot Studio's Architectural Commitments (NEVER VIOLATE)

These are load-bearing decisions specific to this project. They **override** any generic starter-kit rule that would conflict.

### 4.1 Tree is source of truth; HTML is a derived view

The ElementTree is the only source of truth for a hero's state. HTML and CSS are derived by a pure `render_tree()` function. Never mutate HTML directly. Never store a hero as an HTML string without its tree.

### 4.2 After initial generation, the LLM emits patches, not HTML

The `/generate` endpoint is the only place the LLM produces HTML. Every other LLM interaction (`/patch`, `/multi-patch`, `/regenerate-subtree`) sends a small schema and receives a small typed JSON patch. If you want the LLM to "re-render a section," use the `regenerate_subtree` operation instead.

### 4.3 Every patch is reversible

`apply_patch(tree, patch) → (new_tree, inverse_patch)`. Undo is just inverse application. New patch operations require a defined inverse.

### 4.4 Every property has a direct-manipulation control that bypasses the LLM

Color picker, slider, file upload, etc. When the AI fails, the user must have a path forward. Add a property → add its direct control in the same change.

### 4.5 Schemas at every boundary (expansion of Rule 10)

Every LLM response validated by Pydantic. Every API request/response is Pydantic. Every IndexedDB record has a Zod schema. Invalid data rejected at boundaries. On malformed LLM output: repair loop retries once, then structured error. Never "guess what the model meant."

### 4.6 Multi-patches apply atomically

All patches in a multi-patch response apply successfully, or none do. No half-applied states.

### 4.7 Stateless backend (overrides generic "use the right persistence" assumption)

No per-user server-side state. Restarting the container loses nothing that matters. All user data lives in browser IndexedDB.

### 4.8 The eval set is the release gate

The 20 prompts in `evals/prompts.yaml` (collected Week 0) are the product's contract. Weekly regression runs from v0.3 onward. Regressions block merges. v1.0 requires 18 of 20 passing.

---

## 5. Layering (from Rules 00 + 10 + 20)

```
Frontend
├── UI Layer              — React components, DOM events, visual state only
├── Tree State & Patches  — Zustand + Immer; applies patches, manages timeline
├── Tree Renderer         — pure tree → {html, css}
├── API Client            — typed fetch wrappers
└── Persistence           — IndexedDB via idb

Backend
├── Routes                — thin HTTP, no logic
├── Services              — Generate / Patch / MultiPatch / Regenerate
├── Domain Logic          — parser, image filter, palette extractor
├── LLM Abstraction       — OpenAI + Anthropic protocol clients
└── Schemas               — Pydantic models
```

Never cross layers the wrong way. Routes don't touch the LLM. Services don't handle HTTP. Domain logic never hits the network. Components never touch IndexedDB directly — they go through persistence hooks.

---

## 6. The ElementTree Rules

Nine element types. No more:

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

Adding a property to an element type requires **all five** in the same change:

1. Pydantic schema in `backend/domain/tree.py`
2. Zod schema in `frontend/src/engine/elementSchemas.ts`
3. Rendering branch in both renderers
4. Direct-manipulation control on the toolbar/sidebar
5. Eval test for prompt-driven modification

Adding a 10th element type requires architectural review (§20).

---

## 7. The Patch System (expansion of Rule 60 — AI Agents)

### Schema

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
    rationale: str  # plain-language explanation, shown in UI
```

Five operations is the final count. Adding a sixth requires architectural review.

### Application rules

- Every patch apply returns `(new_tree, inverse_patch)`
- `property_changes` values conform to the target element's prop schema
- Unknown `target_id` fails schema validation (never silently no-op)
- Multi-patches: validate every patch, then apply all or none

### Rationale is required for multi-patches

Every multi-patch response includes a plain-language `rationale` shown to the user after application. Non-negotiable — it's how users trust what the AI did.

---

## 8. LLM Integration (expands Rule 60 + Rule 70)

### The abstraction

All LLM calls go through `backend/llm/client.py`. Two concrete clients:

- `OpenAIProtocolClient` for `/chat/completions` (glm-5.1, kimi-k2.5, qwen3.6-plus, qwen3.5-plus, mimo-v2-pro)
- `AnthropicProtocolClient` for `/v1/messages` (minimax-m2.7, minimax-m2.5)

Services never import provider SDKs directly — always go through this abstraction.

### Reliability protocol (every call)

1. Call LLM with Pydantic response schema
2. Validate response against schema
3. On validation failure: repair loop retries once with broken response attached
4. On repair failure: return structured error with code `LLM_BAD_SHAPE` and user-facing hint pointing to direct-manipulation fallback

Never silently retry more than once. Never manually "fix up" malformed output.

### Prompting discipline

- System prompts live in `backend/llm/prompts/` as separate files per operation
- Prompts reference element schemas by name — change schemas → update prompts
- Never inline large prompt strings in service code
- User input always goes in the user message, never concatenated into the system prompt

---

## 9. Scraping & Image Pipeline

### Site scraping

- Playwright headless Chromium, 15s hard timeout
- SSRF guard at route layer (reject loopback, private, link-local, multicast, reserved IPs) — Rule 70
- Return partial results on partial failure — never raise if *some* data available
- Treat scraped content as hostile: strip `<script>`, validate image bytes, re-encode before storing

### Image quality filter (Layout 2 only)

Thresholds in `backend/config.py` (Rule 45 — environment config), not hardcoded in filter logic.

Rejection: resolution < 400×300, aspect ratio > 5:1, file size < 15KB, social-media CDN URL, perceptual-hash duplicate.

Solid-bar detection: scan pixel rows from top/bottom for uniform color (all pixels within 5/255 of each other); auto-crop if bars < 20% of image; reject if ≥ 20% is bars.

Ranking: pixel area (capped at 5 MP) + color variance bonus + above-fold bonus + hero-section bonus. Top 3 selected.

### Layout 2 strip rules

| Images | Layout |
|---|---|
| 3 | 1:1:1 equal columns |
| 2 | 1:1 |
| 1 | Full width |
| 0 | Empty placeholder |
| 4+ scraped | Top 3 only |

Layout auto-derives from child count — do not expose a `layout` prop on ImageStrip.

---

## 10. Storage & Persistence (overrides Rule 30 since there's no database)

### Browser-side (IndexedDB via `idb`)

Stores: `heroes`, `active`, `settings`, `meta`. Schema version stamped in `meta`. Increment on breaking changes. Migrations are one-way forward only — never delete old migration code. Every migration tested on snapshots of real previous-version data.

### Auto-backup on Publish

Every Publish downloads a JSON backup to Downloads folder. First line of defense against IndexedDB loss. Default ON, user-toggleable.

### Quota management

- Soft cap 50 heroes (LRU eviction beyond)
- Warn at 80% quota via `navigator.storage.estimate()`
- "Clear all data" requires two-click confirmation

### Stateless backend

No user data on the server. Temp screenshots cleaned after 1 hour. Logfire traces go remote.

---

## 11. Security (from Rule 70)

Internal tool, narrow threat model. Rules still apply without exception:

- Never hardcode secrets, API keys, tokens. All secrets in `.env`, validated at startup (Rule 45).
- `.env` in `.gitignore`. `.env.example` committed with no real values.
- SSRF guard on every URL input at route layer.
- Generated HTML renders in sandboxed iframe (`sandbox="allow-scripts"`) with CSP `script-src 'self'`.
- Only script in iframe is the click-capture IIFE we inject.
- Strip `<script>` tags during HTML parse. Renderer never emits them.
- File upload validation: MIME type, 5MB size cap, Pillow-verified image, re-encode before storage.
- CORS via `ALLOWED_ORIGINS` env allowlist.
- Never log API keys, tokens, or user content.
- Never return raw exception details or stack traces to clients.

---

## 12. Error Handling (from Rule 85)

### Standard error shape

```json
{
  "error": "human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "hint": "optional — what the user should try",
  "context": {}
}
```

### Error code registry

| Code | HTTP | Meaning |
|---|---|---|
| `BAD_REQUEST` | 400 | Malformed request body |
| `SSRF_BLOCKED` | 400 | URL failed SSRF check |
| `LLM_TIMEOUT` | 504 | LLM call exceeded timeout |
| `RATE_LIMIT` | 429 | Provider rate-limited |
| `LLM_BAD_SHAPE` | 502 | LLM response invalid after repair |
| `LLM_API_ERROR` | 502 | Provider returned error |
| `INTERNAL_ERROR` | 500 | Fallback (rare) |

### User-facing error rules

- Every error has an action: retry button, direct-control suggestion, or help link
- AI operation fails → surface the relevant direct control (color picker, slider, upload button)
- Never show stack traces in production
- Never show "something went wrong" without an action

---

## 13. Observability (from Rule 85)

Every service method wrapped in a Logfire span. Each span captures: latency, model used, token counts, schema validation result, repair retry count, element IDs touched, error class on exception.

Logfire is optional — when `LOGFIRE_TOKEN` is unset, spans become no-ops. Local dev has no external dependency.

- Structured JSON logging in production
- Every log line includes `request_id`
- Every route either responds within 30s or cancels
- `/health` endpoint is always-on, lightweight, built first

---

## 14. Testing (from Rule 80)

### Backend (pytest + VCR.py)

- Unit tests for pure functions: `apply_patch`, `render_tree`, `score_image`, `is_safe_url`, parser helpers
- Integration tests for services using VCR.py cassettes to replay recorded LLM responses — never hit live LLM APIs in CI
- Round-trip tests for the renderer: `parse(render(tree)) ≈ tree` for every element type
- Every service method: at least one happy-path and one failure-path test

### Frontend (Vitest + Playwright)

- Component tests for every UI component (hover, focus, disabled, loading states)
- State store tests for every Zustand store
- Engine tests for `applyPatch`, renderer, Zod schemas
- End-to-end Playwright tests for full flows

### Eval set

The eval set is production code. Lives in `evals/prompts.yaml` with acceptance criteria per prompt. Run via `make eval`. Week 11–12 team trial failures get added.

---

## 15. Implementation Expectations (from Rules 10 + 20)

### Backend (FastAPI + Python 3.11+)

- Routes handle HTTP concerns only. Zero business logic in route files.
- All business logic in `backend/services/`.
- Use `async` throughout.
- Pydantic for every request, response, LLM I/O, internal data shape.
- Dependency injection for LLM clients, service instances, config.
- Centralized exception handler converts exceptions to standard error shape.
- Never leak stack traces.
- Never read env vars outside `backend/config.py`.

### Frontend (Vite + React + TypeScript + Tailwind)

> Adapted from starter-kit Rule 20 (Next.js). Same principles, different framework — no SSR, no App Router, pure SPA.

- TypeScript strict mode. No `any` without justifying comment.
- Components small and focused. Over 200 lines needs a reason.
- Presentation separate from logic — data fetching in hooks, UI in components.
- Loading, error, empty states explicit in every data-bound component.
- Semantic HTML. Every interactive element keyboard-accessible.
- Focus rings always visible. `aria-label` on every icon button.
- API clients centralized in `src/api/`. No hardcoded URLs in components.

### Typing discipline (both sides)

- Every function parameter and return type explicit
- Pydantic and Zod schemas mirror — change both together
- Avoid `Any` / `any` / `Dict[str, Any]` / `Record<string, unknown>` except at untyped boundaries

---

## 16. Code Style (from Rule 99)

### Python

- Ruff for linting + formatting
- Type hints on every function signature
- Docstrings on public functions — short, factual
- Imports grouped: stdlib / third-party / local, separated by blank lines

### TypeScript

- ESLint + Prettier
- TypeScript strict mode
- Named exports preferred (React components may use default when Vite conventions suggest)
- `kebab-case.ts` for modules, `PascalCase.tsx` for components

### General

- Clear naming over clever naming
- Functions do one thing — if name has "and," split
- Comments explain *why*, not *what*
- No dead code. Git remembers commented-out code.

---

## 17. Deployment (from Rule 90)

Single Docker container via `docker-compose.yml` (for restart policy and log rotation).

Base image: `mcr.microsoft.com/playwright/python:v1.40.0-jammy`. Do not change without architectural review — pre-installs Chromium + OS deps.

Multi-stage build: frontend Node stage builds Vite → backend Python stage. FastAPI serves frontend `dist/` via `StaticFiles`. One process, one port (8787), one container.

- Never bake secrets into images (Rule 45)
- Never run containers as root
- Every infrastructure commit runs CI: lint + tests + Docker build
- `.dockerignore` excludes `.env`, `node_modules`, `__pycache__`, test fixtures

---

## 18. Response Style (from Rule 99)

When asked to make a change:

- Prefer precise, minimal, production-ready edits
- Explain architecture briefly only when it matters
- Generate only the necessary files
- Respect existing repository conventions
- Large tasks → clean phases, but usable code each phase
- If request conflicts with PRD, ARCHITECTURE, or this file → stop and flag
- Never produce toy or placeholder code when production code is requested
- Never invent new abstractions without clear need
- Never change unrelated code paths
- Never reformat entire files when editing one section
- Never introduce new dependencies without justification

---

## 19. Anti-Patterns (Never Ship These)

- LLM rewriting HTML outside initial `/generate`
- A patch applied without a computed inverse
- A multi-patch that applies partially
- Silent retry after schema validation failure (must be visible via repair loop or structured error)
- An element property without a direct-manipulation control
- IndexedDB data destroyed without auto-backup first
- `<script>` tags surviving the HTML parser
- SSRF-unsafe URL reaching the scraper
- User-facing error without an action or hint
- Hero element with a non-UUID or reused ID
- Business logic inside a route file
- Environment variable read outside `backend/config.py`
- Direct LLM SDK import in a service file
- Raw SQL anywhere (no database exists)
- Server-side per-user state
- Hardcoded `http://localhost`, API keys, or URLs in source

---

## 20. When to Stop and Ask

Changes requiring discussion before implementing:

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
| Add/modify an element type prop | `backend/domain/tree.py` + `frontend/src/engine/elementSchemas.ts` + both renderers + toolbar/sidebar + tests |
| Add a new API endpoint | `backend/routes/*.py` + `backend/services/*.py` + `backend/schemas/api.py` + `frontend/src/api/*.ts` |
| Change a system prompt | `backend/llm/prompts/*.py` |
| Add an env var | `backend/config.py` + `.env.example` + `docs/DEPLOYMENT.md` |
| Change LLM provider behavior | `backend/llm/openai_client.py` or `backend/llm/anthropic_client.py` |
| Add an image filter rule | `backend/scraper/image_filter.py` + thresholds in `backend/config.py` |
| Tweak editor UI | `frontend/src/components/studio/*` |
| Add a direct-manipulation control | `frontend/src/components/controls/*` + toolbar wiring |
| Add to eval set | `evals/prompts.yaml` + `docs/EVAL_SET.md` |
| Change deployment | `Dockerfile` + `docker-compose.yml` + `docs/DEPLOYMENT.md` |

---

## 22. The Single Guiding Question

This project is small, focused, internal. It doesn't need to scale to millions of users. It doesn't need microservices, a message queue, Redis, or a database.

What it needs is to be **reliable on refinement**.

Every architectural commitment in this file exists to serve that one goal. When in doubt:

> **Does this make refinement more reliable, or less?**

If the answer is "less" or "neither," the change should probably not happen.
