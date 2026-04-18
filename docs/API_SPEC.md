# API_SPEC — Hero Slot Studio

> **Status: STUB.** Full content authored in **Week 2** when `/generate` ships (PRD milestone v0.2).
>
> Until then: the canonical endpoint list lives in `CLAUDE.md §8` and `docs/ARCHITECTURE.md §6`. Do not duplicate here yet.

---

## What this doc will contain (Week 2)

For each of the 7 endpoints — `/health`, `/fetch-site`, `/generate`, `/patch`, `/multi-patch`, `/regenerate-subtree`, `/parse-html`:

1. **Request schema** — full Pydantic model with field types, required/optional, constraints, example payload.
2. **Response schema** — full Pydantic model, including the standard error shape.
3. **Error codes** — which codes from `CLAUDE.md §14` this endpoint can return, and what triggers each.
4. **Latency budget** — expected p50 / p95 / timeout.
5. **Auth** — none (internal tool), but document that explicitly.
6. **Rate limits** — if any (likely just LLM provider passthrough).
7. **Example curl + example TypeScript fetch** — copy-paste ready.
8. **Change log** — versioned additions/breakages.

---

## Source of truth until then

- Endpoint list: `CLAUDE.md §8`
- Pydantic schemas: `backend/schemas/api.py` (once scaffolded in W1)
- Architectural context: `docs/ARCHITECTURE.md §6`

When Week 2 lands, delete this stub and replace with the full spec.
