# Hero Slot Studio

Internal tool for generating branded login-page hero sections from client websites. Figma-style visual editor. LLM writes HTML once; all later edits are typed, reversible JSON patches.

> **For Claude Code:** read [`CLAUDE.md`](./CLAUDE.md) before writing anything. It defines the architectural commitments that must never be violated.

---

## Quick start (local dev)

```bash
# 1. Copy env template and fill in LLM_API_KEY
cp .env.example .env

# 2. Install backend + frontend deps
make install

# 3. Run backend (http://localhost:8787)
make dev-backend

# 4. In another terminal, run frontend (http://localhost:5173)
make dev-frontend
```

Or run the full production image locally:

```bash
make docker-up
# app at http://localhost:8787
```

---

## Project docs

- [`CLAUDE.md`](./CLAUDE.md) — rules, commitments, build order, folder map
- [`docs/PRD.md`](./docs/PRD.md) — product requirements
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — architectural detail
- [`docs/DESIGN_SPEC.md`](./docs/DESIGN_SPEC.md) — locked UI tokens + 18 screens
- [`docs/EVAL_SET.md`](./docs/EVAL_SET.md) — release gate (18/20 prompts)
- [`docs/API_SPEC.md`](./docs/API_SPEC.md) — endpoint spec (stub → Week 2)
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — deploy runbook (stub → Week 14)

---

## Common commands

```bash
make install         # install deps + playwright chromium
make dev-backend     # uvicorn --reload on :8787
make dev-frontend    # vite dev on :5173
make test            # pytest + vitest
make eval            # python -m evals.runner
make lint            # ruff + eslint
make docker-up       # docker compose up --build
```

---

## Current milestone

**v0.1 (Week 1)** — FastAPI scaffold + `/health` + Playwright scraper + Pylette + image filter + Logfire; Vite+React scaffold + iframe preview shell.

See [`CLAUDE.md §3`](./CLAUDE.md) for the full Week-0 → v1.0 ramp.
