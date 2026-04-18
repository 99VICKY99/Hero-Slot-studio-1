import type { CSSProperties, ReactNode } from "react";

/**
 * Minimal inline SVG icons matching hero-handoff/src/icons.jsx.
 * 14px default, 1.5px stroke. Uses currentColor so Tailwind text-* works.
 */

interface IcoProps {
  d: ReactNode;
  size?: number;
  stroke?: number;
  fill?: string;
  style?: CSSProperties;
}

function Ico({ d, size = 14, stroke = 1.5, fill = "none", style }: IcoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}

export const Icons = {
  cursor: <Ico d={<path d="M4 3l6 17 3-7 7-3z" />} />,
  sparkle: (
    <Ico
      d={
        <>
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
          <path d="M18.5 5.5l-1.5 1.5M7 17l-1.5 1.5M18.5 18.5L17 17M7 7L5.5 5.5" />
        </>
      }
    />
  ),
  wand: (
    <Ico
      d={
        <>
          <path d="M4 20L14 10" />
          <path d="M16 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
        </>
      }
    />
  ),
  undo: (
    <Ico
      d={
        <>
          <path d="M9 14l-5-5 5-5" />
          <path d="M4 9h9a7 7 0 017 7v0" />
        </>
      }
    />
  ),
  redo: (
    <Ico
      d={
        <>
          <path d="M15 14l5-5-5-5" />
          <path d="M20 9h-9a7 7 0 00-7 7v0" />
        </>
      }
    />
  ),
  play: <Ico d={<path d="M6 4l14 8-14 8z" />} fill="currentColor" />,
  chevronR: <Ico d={<path d="M9 6l6 6-6 6" />} />,
  chevronD: <Ico d={<path d="M6 9l6 6 6-6" />} />,
  lock: (
    <Ico
      d={
        <>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 118 0v3" />
        </>
      }
    />
  ),
  eye: (
    <Ico
      d={
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      }
    />
  ),
  eyeOff: (
    <Ico
      d={
        <>
          <path d="M3 3l18 18" />
          <path d="M10.5 5.2A10 10 0 0112 5c6.5 0 10 7 10 7a16 16 0 01-3.5 4.3" />
          <path d="M6.1 6.1A16 16 0 002 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8" />
        </>
      }
    />
  ),
  plus: <Ico d={<path d="M12 5v14M5 12h14" />} />,
  close: <Ico d={<path d="M6 6l12 12M18 6L6 18" />} />,
  check: <Ico d={<path d="M5 12l5 5 9-11" />} />,
  arrow: <Ico d={<path d="M5 12h14M13 6l6 6-6 6" />} />,
  dup: (
    <Ico
      d={
        <>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M4 16V6a2 2 0 012-2h10" />
        </>
      }
    />
  ),
  trash: (
    <Ico
      d={
        <>
          <path d="M4 7h16M10 11v6M14 11v6" />
          <path d="M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" />
          <path d="M9 7V4h6v3" />
        </>
      }
    />
  ),
  drag: (
    <Ico
      d={
        <>
          <circle cx="9" cy="6" r="1" />
          <circle cx="15" cy="6" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="9" cy="18" r="1" />
          <circle cx="15" cy="18" r="1" />
        </>
      }
      fill="currentColor"
      stroke={0}
    />
  ),
  layers: (
    <Ico
      d={
        <>
          <path d="M12 3l9 5-9 5-9-5z" />
          <path d="M3 13l9 5 9-5" />
          <path d="M3 18l9 5 9-5" />
        </>
      }
    />
  ),
  text: <Ico d={<path d="M4 6h16M12 6v14M9 20h6" />} />,
  img: (
    <Ico
      d={
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M21 16l-5-5-9 9" />
        </>
      }
    />
  ),
  box: <Ico d={<rect x="4" y="4" width="16" height="16" rx="2" />} />,
  palette: (
    <Ico
      d={
        <>
          <path d="M12 3a9 9 0 100 18c1 0 1.5-1 1-2-1-2 1-3 3-3 3 0 5-2 5-5 0-5-4-8-9-8z" />
          <circle cx="8" cy="10" r="1" />
          <circle cx="13" cy="7" r="1" />
          <circle cx="16" cy="11" r="1" />
        </>
      }
    />
  ),
  search: (
    <Ico
      d={
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </>
      }
    />
  ),
  at: (
    <Ico
      d={
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M16 12v2a3 3 0 006 0v-2a10 10 0 10-4 8" />
        </>
      }
    />
  ),
  command: (
    <Ico
      d={
        <>
          <path d="M6 9a3 3 0 103-3v12a3 3 0 103-3M18 9a3 3 0 10-3-3v12a3 3 0 10-3-3" />
        </>
      }
    />
  ),
  download: <Ico d={<path d="M12 4v12M6 12l6 6 6-6M4 20h16" />} />,
  upload: <Ico d={<path d="M12 20V8M6 12l6-6 6 6M4 4h16" />} />,
  refresh: (
    <Ico
      d={
        <>
          <path d="M4 4v6h6" />
          <path d="M20 20v-6h-6" />
          <path d="M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3" />
        </>
      }
    />
  ),
  tree: (
    <Ico
      d={
        <>
          <path d="M6 4v16M6 8h6a2 2 0 012 2v2M6 16h6a2 2 0 002-2" />
          <circle cx="6" cy="4" r="1.5" />
          <circle cx="14" cy="10" r="1.5" />
          <circle cx="14" cy="16" r="1.5" />
        </>
      }
    />
  ),
  more: (
    <Ico
      d={
        <>
          <circle cx="5" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
        </>
      }
      fill="currentColor"
      stroke={0}
    />
  ),
  globe: (
    <Ico
      d={
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
        </>
      }
    />
  ),
  stop: (
    <Ico
      d={<rect x="6" y="6" width="12" height="12" rx="1" />}
      fill="currentColor"
      stroke={0}
    />
  ),
  fullscreen: (
    <Ico d={<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />} />
  ),
  bolt: (
    <Ico
      d={<path d="M13 2L5 14h6l-1 8 8-12h-6z" />}
      fill="currentColor"
      stroke={0}
    />
  ),
  mark: (
    <Ico
      d={<circle cx="12" cy="12" r="3" />}
      fill="currentColor"
      stroke={0}
    />
  ),
} as const;

export type IconName = keyof typeof Icons;
