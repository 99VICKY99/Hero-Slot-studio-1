import type { Config } from "tailwindcss";

/**
 * Tokens updated 2026-04-18 from hero-handoff bundle.
 * Old LinkedIn-blue palette retired — source of truth is now
 * `hero-handoff/hero/project/Hero Slot Studio.html` and
 * `docs/DESIGN_SPEC.md §1`.
 */
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "#0a0b0d",
          1: "#101114",
          2: "#17181c",
          3: "#1e2026",
          4: "#252830",
        },
        canvas: "#0d0e11",
        line: {
          1: "#1f2128",
          2: "#2a2d36",
        },
        text: {
          0: "#f5f6f8",
          1: "#a8acb8",
          2: "#6b6f7c",
          3: "#474a55",
        },
        accent: {
          DEFAULT: "#8b7dff",
          soft: "#8b7dff26",
          line: "#8b7dff4d",
        },
        pos: "#4ade80",
        warn: "#fbbf24",
        neg: "#f87171",
      },
      fontFamily: {
        ui: [
          '"Inter Tight"',
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "monospace",
        ],
        display: [
          '"Instrument Serif"',
          "Georgia",
          "serif",
        ],
        // Preserve sans fallback for any legacy components.
        sans: [
          '"Inter Tight"',
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        s: "4px",
        m: "6px",
        l: "10px",
      },
      boxShadow: {
        pop: "0 0 0 1px rgba(255,255,255,.04), 0 12px 32px -8px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.4)",
        toolbar:
          "0 0 0 1px rgba(255,255,255,.06), 0 18px 48px -12px rgba(0,0,0,.7)",
      },
      transitionDuration: {
        fast: "120ms",
        normal: "150ms",
        slow: "250ms",
      },
      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
