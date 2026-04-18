/**
 * Seed data mirrored from `hero-handoff/hero/project/src/data.jsx`.
 * Acts as the demo payload until /generate and /patch are wired (W2+).
 */

export type HeroElementType =
  | "Container"
  | "Heading"
  | "Text"
  | "Image"
  | "Logo"
  | "Background"
  | "Button"
  | "ImageStrip"
  | "Divider";

export interface HeroNodeBase {
  id: string;
  type: HeroElementType;
  props: Record<string, unknown>;
  children: HeroNode[];
}

export type HeroNode = HeroNodeBase;

export interface ContainerProps {
  layout: "stack" | "row" | "grid";
  columns?: string;
  gap?: number;
  padX?: number;
  padY?: number;
  align?: "start" | "center" | "end";
  justify?: "start" | "center" | "between";
  minH?: number;
}

export interface BackgroundProps {
  kind: "solid" | "gradient" | "image" | "pattern";
  from?: string;
  to?: string;
  angle?: number;
  color?: string;
  overlay?: "none" | "grain" | "dots";
  opacity?: number;
}

export interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  color: string;
  size: number;
  weight: number;
  tracking: number;
  leading: number;
  maxW?: number;
}

export interface TextProps {
  text: string;
  color: string;
  size: number;
  leading?: number;
  tracking?: number;
  upper?: boolean;
  mono?: boolean;
  maxW?: number;
}

export interface ButtonProps {
  text: string;
  variant: "solid" | "ghost" | "link";
  bg: string;
  fg: string;
  radius: number;
  padX: number;
  padY: number;
  weight?: number;
}

export interface DividerProps {
  orient: "h" | "v";
  color: string;
  thickness: number;
  marginY?: number;
  width?: number;
}

export interface LogoProps {
  label: string;
  mark: string;
  color: string;
  size: number;
}

export interface ImageProps {
  alt: string;
  kind: "chart" | "card" | "mobile";
  hue: number;
}

export interface ImageStripProps {
  gap: number;
  radius: number;
}

export interface ClientProfile {
  url: string;
  name: string;
  scrapedAt: string;
  logo: string;
  palette: string[];
  fonts: string[];
}

export interface TypeMetaEntry {
  glyph: string;
  color: string;
}

export interface TimelinePatch {
  id: string;
  label: string;
  op:
    | "generate"
    | "update_props"
    | "insert_child"
    | "remove_child"
    | "reorder_children"
    | "regenerate_subtree";
  target: string;
  when: string;
}

export interface Variation {
  label: string;
  preview: string;
  props: Partial<HeadingProps>;
}

export interface VariationsPayload {
  target: string;
  prompt: string;
  rationale: string;
  variants: Variation[];
}

export const CLIENT: ClientProfile = {
  url: "https://tidalwave.fi",
  name: "Tidalwave",
  scrapedAt: "2m ago",
  logo: "TW",
  palette: ["#0b1220", "#e8f0ff", "#7aa2ff", "#ffd166", "#10b981", "#0e1628"],
  fonts: ["Söhne", "Tiempos Text"],
};

export const SEED_TREE: HeroNode = {
  id: "root",
  type: "Container",
  props: {
    layout: "grid",
    columns: "1.05fr 0.95fr",
    gap: 0,
    minH: 560,
  },
  children: [
    {
      id: "bg",
      type: "Background",
      props: {
        kind: "gradient",
        from: "#0b1220",
        to: "#1a2444",
        angle: 142,
        overlay: "grain",
        opacity: 1,
      },
      children: [],
    },
    {
      id: "left",
      type: "Container",
      props: { layout: "stack", gap: 28, padX: 64, padY: 72, align: "start" },
      children: [
        {
          id: "logo",
          type: "Logo",
          props: { label: "Tidalwave", mark: "TW", color: "#e8f0ff", size: 28 },
          children: [],
        },
        {
          id: "h1",
          type: "Heading",
          props: {
            level: 1,
            text: "Move money at the speed of a message.",
            color: "#f3f6ff",
            size: 54,
            weight: 600,
            tracking: -0.02,
            leading: 1.05,
            maxW: 520,
          },
          children: [],
        },
        {
          id: "p1",
          type: "Text",
          props: {
            text: "Sign in to send, request, and settle across 42 currencies — with treasury-grade controls your ops team will actually use.",
            color: "#b8c4e0",
            size: 17,
            leading: 1.55,
            maxW: 480,
          },
          children: [],
        },
        {
          id: "cta-row",
          type: "Container",
          props: { layout: "row", gap: 12, align: "center" },
          children: [
            {
              id: "cta",
              type: "Button",
              props: {
                text: "Continue with SSO",
                variant: "solid",
                bg: "#7aa2ff",
                fg: "#0b1220",
                radius: 8,
                padX: 20,
                padY: 12,
                weight: 600,
              },
              children: [],
            },
            {
              id: "cta2",
              type: "Button",
              props: {
                text: "Use email →",
                variant: "ghost",
                bg: "transparent",
                fg: "#b8c4e0",
                radius: 8,
                padX: 14,
                padY: 12,
                weight: 500,
              },
              children: [],
            },
          ],
        },
        {
          id: "divider-1",
          type: "Divider",
          props: {
            orient: "h",
            color: "#ffffff14",
            thickness: 1,
            marginY: 8,
            width: 320,
          },
          children: [],
        },
        {
          id: "meta",
          type: "Text",
          props: {
            text: "SOC 2 Type II · PCI DSS · ISO 27001",
            color: "#6a7594",
            size: 12,
            tracking: 0.08,
            upper: true,
            mono: true,
          },
          children: [],
        },
      ],
    },
    {
      id: "right",
      type: "Container",
      props: {
        layout: "stack",
        gap: 18,
        padX: 40,
        padY: 64,
        align: "center",
        justify: "center",
      },
      children: [
        {
          id: "strip",
          type: "ImageStrip",
          props: { gap: 8, radius: 14 },
          children: [
            {
              id: "img-1",
              type: "Image",
              props: { alt: "Treasury dashboard", kind: "chart", hue: 222 },
              children: [],
            },
            {
              id: "img-2",
              type: "Image",
              props: { alt: "Card detail", kind: "card", hue: 42 },
              children: [],
            },
            {
              id: "img-3",
              type: "Image",
              props: { alt: "Mobile send flow", kind: "mobile", hue: 155 },
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

export const TYPE_META: Record<HeroElementType, TypeMetaEntry> = {
  Container: { glyph: "▦", color: "#8b7dff" },
  Heading: { glyph: "H", color: "#f5f6f8" },
  Text: { glyph: "¶", color: "#a8acb8" },
  Image: { glyph: "▢", color: "#4ade80" },
  Logo: { glyph: "◉", color: "#fbbf24" },
  Background: { glyph: "▓", color: "#7aa2ff" },
  Button: { glyph: "◼", color: "#f87171" },
  ImageStrip: { glyph: "⎕", color: "#4ade80" },
  Divider: { glyph: "—", color: "#6b6f7c" },
};

export const SEED_TIMELINE: TimelinePatch[] = [
  {
    id: "p0",
    label: "Initial generation",
    op: "generate",
    target: "root",
    when: "4:12 PM",
  },
  {
    id: "p1",
    label: "Heading tone",
    op: "update_props",
    target: "h1",
    when: "4:14 PM",
  },
  {
    id: "p2",
    label: "CTA color → brand",
    op: "update_props",
    target: "cta",
    when: "4:16 PM",
  },
  {
    id: "p3",
    label: "Swap image order",
    op: "reorder_children",
    target: "strip",
    when: "4:18 PM",
  },
  {
    id: "p4",
    label: "Background gradient",
    op: "update_props",
    target: "bg",
    when: "4:20 PM",
  },
];

export const DEMO_VARIATIONS: VariationsPayload = {
  target: "h1",
  prompt: "make it punchier and sound less like a bank",
  rationale:
    "Trimmed the metaphor, moved from feature-language to outcome-language, and tightened leading so the line reads as a single beat.",
  variants: [
    {
      label: "A · Punchier",
      preview: "Send money in a text.",
      props: { text: "Send money in a text.", size: 68, tracking: -0.03 },
    },
    {
      label: "B · Warmer",
      preview: "Finally, a wallet that keeps up with you.",
      props: {
        text: "Finally, a wallet that keeps up with you.",
        size: 54,
        tracking: -0.02,
      },
    },
    {
      label: "C · Operator",
      preview: "Ship payments. Not tickets.",
      props: { text: "Ship payments. Not tickets.", size: 72, tracking: -0.035 },
    },
  ],
};
