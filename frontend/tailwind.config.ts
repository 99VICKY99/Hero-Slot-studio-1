import type { Config } from "tailwindcss";

/**
 * Tokens are the source of truth from docs/DESIGN_SPEC.md §1.
 * Do not invent new tokens — add them there first, then mirror here.
 */
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0A66C2",
          primaryHover: "#004182",
          // Dark mode brand tokens (DESIGN_SPEC §23)
          primaryDark: "#3B82F6",
          primaryHoverDark: "#60A5FA",
        },
        canvas: {
          DEFAULT: "#F3F6F8",
          dark: "#0F172A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F9FAFB",
          dark: "#020617",
          subtleDark: "#0B1220",
        },
        border: {
          DEFAULT: "#E5E7EB",
          strong: "#D1D5DB",
          dark: "#1E293B",
          strongDark: "#334155",
        },
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          disabled: "#9CA3AF",
          primaryDark: "#E5E7EB",
          secondaryDark: "#9CA3AF",
          disabledDark: "#4B5563",
        },
        feedback: {
          success: "#057642",
          warning: "#B45309",
          error: "#B91C1C",
          info: "#0A66C2",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // DESIGN_SPEC §1.2 typography tokens
        "page-title": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "section-header": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "subsection-header": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "card-title": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "card-subtitle": ["16px", { lineHeight: "24px", fontWeight: "500" }],
        body: ["14px", { lineHeight: "22px", fontWeight: "400" }],
        button: ["14px", { lineHeight: "20px", fontWeight: "600" }],
        label: ["13px", { lineHeight: "18px", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
        code: ["13px", { lineHeight: "20px", fontWeight: "400" }],
      },
      spacing: {
        // 4px grid — Tailwind defaults cover most, add explicit named ones
        "token-1": "4px",
        "token-2": "8px",
        "token-3": "12px",
        "token-4": "16px",
        "token-5": "20px",
        "token-6": "24px",
        "token-8": "32px",
        "token-10": "40px",
        "token-12": "48px",
        "token-16": "64px",
      },
      borderRadius: {
        none: "0",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        pill: "9999px",
        circle: "50%",
      },
      boxShadow: {
        none: "none",
        subtle: "0 1px 2px rgba(17, 24, 39, 0.04)",
        dropdown: "0 4px 12px rgba(17, 24, 39, 0.08)",
        modal: "0 16px 32px rgba(17, 24, 39, 0.12)",
        tooltip: "0 2px 8px rgba(17, 24, 39, 0.12)",
      },
      transitionDuration: {
        fast: "100ms",
        normal: "150ms",
        slow: "250ms",
        crawl: "400ms",
      },
      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
