# EVAL_SET — Hero Slot Studio

> The eval set is the **release gate**. v1.0 ships only when a fresh user passes **18 of 20** of these prompts on first or second try. (PRD §Release Gate.)
>
> Collected during **Week 0** from the production team. Weekly regression runs from v0.3 onward. Regressions block merges.

---

## 1. How the eval works

1. Eval runner (`evals/runner.py`) reads `evals/prompts.yaml`.
2. For each row, it runs the full flow: `/fetch-site` → `/generate` → (any follow-up `/patch` or `/multi-patch` prompts) → assert against the acceptance criteria.
3. Output written to `evals/results/{date}.json` — pass/fail per row + diff + LLM trace.
4. CI gate: regressions on previously-passing prompts block the merge.

A row passes if **all** its acceptance criteria are true on the final tree state.

---

## 2. Prompt format (`evals/prompts.yaml`)

```yaml
- id: EVAL-001
  url: https://example.com
  initial_prompt: "Generate a hero for this site."
  follow_ups:
    - op: patch
      target: heading
      prompt: "Make the heading louder and more confident."
    - op: multi_patch
      prompt: "Add a secondary CTA and tighten the spacing."
  acceptance:
    - tree.elements.count >= 5
    - tree.has_type("Heading")
    - tree.has_type("Button")
    - palette.primary matches site.primary
    - no_patch_had_status("LLM_BAD_SHAPE")
  notes: "Baseline — simple corporate site, logo + 1 image."
```

Fields:
- `id` — stable, never renumbered.
- `url` — real client site used for Week 0 collection. If the site disappears, freeze a scrape fixture.
- `initial_prompt` — the first-load prompt (usually "Generate a hero for this site.").
- `follow_ups` — ordered list of refinement prompts. `op` is `patch`, `multi_patch`, or `regenerate_subtree`.
- `acceptance` — assertions against the final tree. Use the DSL below.
- `notes` — free text for the reviewer.

---

## 3. Acceptance DSL

Write assertions in plain strings the runner can parse:

| Assertion | Meaning |
|---|---|
| `tree.elements.count >= N` | Tree has at least N elements |
| `tree.has_type("TYPE")` | At least one element of that type |
| `tree.count_type("TYPE") == N` | Exactly N of that type |
| `element("ID").props.KEY == VALUE` | Specific prop value |
| `palette.primary matches site.primary` | Primary color within ΔE of scraped palette |
| `no_patch_had_status("CODE")` | No patch returned that error code |
| `rationale.mentions("WORD")` | Multi-patch rationale mentions a keyword |
| `render.has_no_script_tags()` | No `<script>` survived the renderer |
| `tree.is_reversible()` | Every patch in the timeline has an inverse |

Add new assertion kinds to `evals/runner.py` only — never inline Python in YAML.

---

## 4. Week 0 collection checklist

This section is filled during Week 0 with the production team. Each of the 5–10 team members contributes 2–4 real client URLs + the prompts they would actually type.

Template for each entry:

```
Submitted by: [name]
URL: [real client site]
Initial prompt: [what they'd type on first load]
Follow-up #1: [typical refinement]
Follow-up #2: [a harder one]
What "good" looks like: [what they would accept]
Edge cases they care about: [Cloudflare blocks / logos on dark bg / non-English sites / etc.]
```

Target: 20 rows total. Mix across difficulty:
- **6 baseline** — clean corporate sites, logo + 1-2 images
- **8 typical** — real working client sites; 2-3 refinements
- **4 hard** — non-English, dark-theme, image-heavy, or JS-rendered
- **2 adversarial** — Cloudflare/403, broken images, empty sites (expect graceful `UNREACHABLE` / `BLOCKED`)

---

## 5. The 20 Prompts

> Populate by end of Week 0. Keep IDs stable — do not renumber after code starts referencing them.

| ID | URL | Category | Status |
|---|---|---|---|
| EVAL-001 | _TBD_ | baseline | not collected |
| EVAL-002 | _TBD_ | baseline | not collected |
| EVAL-003 | _TBD_ | baseline | not collected |
| EVAL-004 | _TBD_ | baseline | not collected |
| EVAL-005 | _TBD_ | baseline | not collected |
| EVAL-006 | _TBD_ | baseline | not collected |
| EVAL-007 | _TBD_ | typical | not collected |
| EVAL-008 | _TBD_ | typical | not collected |
| EVAL-009 | _TBD_ | typical | not collected |
| EVAL-010 | _TBD_ | typical | not collected |
| EVAL-011 | _TBD_ | typical | not collected |
| EVAL-012 | _TBD_ | typical | not collected |
| EVAL-013 | _TBD_ | typical | not collected |
| EVAL-014 | _TBD_ | typical | not collected |
| EVAL-015 | _TBD_ | hard | not collected |
| EVAL-016 | _TBD_ | hard | not collected |
| EVAL-017 | _TBD_ | hard | not collected |
| EVAL-018 | _TBD_ | hard | not collected |
| EVAL-019 | _TBD_ | adversarial | not collected |
| EVAL-020 | _TBD_ | adversarial | not collected |

Fill these in `evals/prompts.yaml` with full detail. Mirror the ID here for tracking.

---

## 6. Running the evals

```bash
# all 20
make eval

# one row
python -m evals.runner --id EVAL-007

# offline (using VCR cassettes)
python -m evals.runner --mode replay

# baseline capture (updates expected results — use sparingly)
python -m evals.runner --update-baseline
```

Output: `evals/results/{YYYY-MM-DD}-{git-sha}.json` with per-row pass/fail, LLM model used, token counts, latency, and a diff vs. last passing run.

---

## 7. Regression policy

- From **v0.3** onward, the full eval set runs weekly in CI.
- If a PR causes any previously-passing row to fail, CI is red → merge blocked.
- A failing row cannot be "fixed" by editing its acceptance criteria. It's either a real regression (fix the code) or the acceptance was wrong (document why in the PR, then update).
- New rows added during Week 11 team trial get the same treatment.

---

## 8. Extending the eval set

Add a row when:
- A team trial user hits something the current 20 prompts don't cover
- A bug is filed that reproduces via a specific prompt
- A new element type or patch operation is added (it must have at least one prompt exercising it)

Never remove a row. Mark it `deprecated: true` in YAML if truly obsolete; the runner skips it but the history stays.

---

## 9. v1.0 acceptance

A fresh user (never used the tool) sits with v1.0, runs all 20 prompts, and gets to "I'd ship this" on **18 of 20** within first or second try. Measured by the senior engineer during Week 15.

If 17 or fewer pass → do not release. Iterate and re-measure.
