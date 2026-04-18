# DEPLOYMENT — Hero Slot Studio

> **Status: STUB.** Full content authored in **Week 14** (PRD milestone v0.14) before staging deploy.
>
> Until then: deployment-relevant facts live in `CLAUDE.md §12` (env vars) and `CLAUDE.md §18` (Docker spec).

---

## What this doc will contain (Week 14)

1. **Prerequisites** — what the senior engineer needs installed locally and on the host.
2. **Environment variables** — full table (copy from `CLAUDE.md §12`), with source of each secret.
3. **Local Docker run** — `docker compose up --build` steps + troubleshooting.
4. **Staging deploy** — host target, domain, TLS, how to push a new build.
5. **Production deploy** — same, plus rollback procedure.
6. **CI pipeline** — Bitbucket pipeline YAML explained: lint → test → eval → build → push image.
7. **Health checks** — `/health` contract, what the orchestrator watches for, restart policy.
8. **Observability** — Logfire dashboard link, log retention, how to read a trace.
9. **Backup / data recovery** — IndexedDB is client-side, so there's nothing to back up server-side. Document this clearly so no one tries to.
10. **Incident runbook** — top 5 likely failures + first response (LLM provider down, scraper timeouts, iframe CSP violation, CORS misconfig, container crash loop).
11. **Scaling notes** — this is a 5–10 user internal tool. Explicitly say "do not horizontally scale without a design review" — stateless but LLM cost matters.

---

## Source of truth until then

- Env vars: `CLAUDE.md §12`
- Docker spec: `CLAUDE.md §18`
- Architectural context: `docs/ARCHITECTURE.md §16–17`

When Week 14 lands, delete this stub and replace with the full deployment runbook.
