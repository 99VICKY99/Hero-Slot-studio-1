"""Eval runner — executes prompts.yaml against the live backend.

Week 0 deliverable: stub. Full implementation lands alongside /patch in Week 5.
Until then, prints row count and TBD status so `python -m evals.runner` works.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml

PROMPTS_PATH = Path(__file__).parent / "prompts.yaml"


def load_prompts() -> list[dict]:
    with PROMPTS_PATH.open() as f:
        return yaml.safe_load(f) or []


def main() -> None:
    parser = argparse.ArgumentParser(description="Hero Slot Studio eval runner")
    parser.add_argument("--id", help="Run a single row by id (e.g. EVAL-007)")
    parser.add_argument("--mode", choices=["live", "replay"], default="live")
    args = parser.parse_args()

    prompts = load_prompts()
    total = len(prompts)
    tbd = sum(1 for p in prompts if p.get("status") == "not_collected")

    if args.id:
        match = next((p for p in prompts if p.get("id") == args.id), None)
        if match is None:
            print(f"ERROR: id {args.id} not found")
            raise SystemExit(1)
        print(f"[stub] would run {args.id} in {args.mode} mode")
        return

    print(f"Loaded {total} rows ({tbd} TBD). Runner is a stub — full impl in Week 5.")


if __name__ == "__main__":
    main()
