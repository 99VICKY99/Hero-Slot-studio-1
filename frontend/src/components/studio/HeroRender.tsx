import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import type {
  BackgroundProps,
  ButtonProps,
  ContainerProps,
  DividerProps,
  HeadingProps,
  HeroNode,
  ImageProps,
  ImageStripProps,
  LogoProps,
  TextProps,
} from "./mockData";

/**
 * Pure tree renderer — mirrors hero-handoff/src/hero-render.jsx.
 * No network, no side effects. Selection overlays are drawn in-place.
 */

export interface RenderProps {
  node: HeroNode;
  selected: string[];
  hovered: string | null;
  onSelect: (id: string, shift: boolean) => void;
  onHover: (id: string | null) => void;
}

interface PlaceholderProps {
  kind?: ImageProps["kind"];
  hue?: number;
  alt?: string;
  radius?: number;
}

function ImagePlaceholder({
  kind = "chart",
  hue = 220,
  alt,
  radius = 12,
}: PlaceholderProps) {
  const bg = `linear-gradient(135deg, oklch(28% 0.08 ${hue}) 0%, oklch(18% 0.06 ${hue + 20}) 100%)`;
  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{
        borderRadius: radius,
        background: bg,
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,.06), 0 10px 30px -12px rgba(0,0,0,.5)",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {kind === "chart" ? <ChartArt hue={hue} /> : null}
      {kind === "card" ? <CardArt hue={hue} /> : null}
      {kind === "mobile" ? <MobileArt hue={hue} /> : null}
      <div
        className="mono absolute bottom-[8px] left-[10px] text-[10px]"
        style={{ color: "rgba(255,255,255,.4)", letterSpacing: 0.05 }}
      >
        {alt}
      </div>
    </div>
  );
}

function ChartArt({ hue }: { hue: number }) {
  return (
    <svg
      viewBox="0 0 200 160"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`g-${hue}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`oklch(75% 0.15 ${hue})`} stopOpacity=".55" />
          <stop offset="1" stopColor={`oklch(75% 0.15 ${hue})`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g opacity=".22">
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            x2="200"
            y1={20 + i * 16}
            y2={20 + i * 16}
            stroke="#fff"
            strokeWidth=".5"
          />
        ))}
      </g>
      <path
        d="M 0 120 L 20 110 L 40 115 L 60 95 L 80 100 L 100 75 L 120 80 L 140 58 L 160 62 L 180 40 L 200 46 L 200 160 L 0 160 Z"
        fill={`url(#g-${hue})`}
      />
      <path
        d="M 0 120 L 20 110 L 40 115 L 60 95 L 80 100 L 100 75 L 120 80 L 140 58 L 160 62 L 180 40 L 200 46"
        fill="none"
        stroke={`oklch(85% 0.18 ${hue})`}
        strokeWidth="1.5"
      />
      <circle cx="140" cy="58" r="3" fill={`oklch(90% 0.2 ${hue})`} />
      <rect x="14" y="16" width="52" height="6" rx="2" fill="rgba(255,255,255,.22)" />
      <rect x="14" y="26" width="30" height="4" rx="2" fill="rgba(255,255,255,.1)" />
    </svg>
  );
}

function CardArt({ hue }: { hue: number }) {
  return (
    <svg
      viewBox="0 0 200 160"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`c-${hue}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`oklch(70% 0.16 ${hue})`} />
          <stop offset="1" stopColor={`oklch(50% 0.14 ${hue + 30})`} />
        </linearGradient>
      </defs>
      <rect x="22" y="38" width="156" height="94" rx="10" fill={`url(#c-${hue})`} />
      <rect
        x="22"
        y="38"
        width="156"
        height="94"
        rx="10"
        fill="none"
        stroke="rgba(255,255,255,.25)"
      />
      <circle cx="150" cy="68" r="12" fill="rgba(255,255,255,.35)" />
      <circle cx="164" cy="68" r="12" fill="rgba(0,0,0,.2)" />
      <rect x="34" y="110" width="62" height="6" rx="2" fill="rgba(255,255,255,.55)" />
      <rect x="34" y="120" width="40" height="4" rx="2" fill="rgba(255,255,255,.3)" />
    </svg>
  );
}

function MobileArt({ hue }: { hue: number }) {
  return (
    <svg
      viewBox="0 0 200 160"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block" }}
    >
      <rect
        x="70"
        y="18"
        width="60"
        height="130"
        rx="10"
        fill={`oklch(18% 0.04 ${hue})`}
        stroke="rgba(255,255,255,.15)"
      />
      <rect
        x="78"
        y="32"
        width="44"
        height="18"
        rx="4"
        fill={`oklch(60% 0.18 ${hue})`}
      />
      <rect x="78" y="56" width="44" height="8" rx="2" fill="rgba(255,255,255,.15)" />
      <rect x="78" y="68" width="30" height="8" rx="2" fill="rgba(255,255,255,.08)" />
      <rect x="78" y="82" width="44" height="20" rx="4" fill="rgba(255,255,255,.1)" />
      <rect
        x="78"
        y="108"
        width="44"
        height="20"
        rx="4"
        fill={`oklch(65% 0.2 ${hue + 40})`}
        opacity=".4"
      />
      <circle cx="100" cy="140" r="2" fill="rgba(255,255,255,.3)" />
    </svg>
  );
}

interface SelectionRingProps {
  selected: boolean;
  hovered: boolean;
  label?: string;
}

function SelectionRing({ selected, hovered, label }: SelectionRingProps) {
  if (!selected && !hovered) return null;
  const color = selected ? "var(--ring-accent, #8b7dff)" : "rgba(139,125,255,.5)";
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: "absolute",
          inset: -2,
          border: `1.5px solid ${color}`,
          borderRadius: "inherit",
          boxShadow: selected
            ? "0 0 0 1px rgba(0,0,0,.3), 0 0 16px rgba(139,125,255,.2)"
            : "none",
          zIndex: 20,
        }}
      />
      {selected && label ? (
        <div
          className="mono absolute left-[-2px] top-[-22px] z-[21] whitespace-nowrap rounded-[3px] px-[7px] py-[2px] text-[10px] font-semibold uppercase"
          style={{
            background: "#8b7dff",
            color: "#0a0b0d",
            letterSpacing: 0.02,
          }}
        >
          {label}
        </div>
      ) : null}
      {selected ? (
        <>
          <Handle corner="nw" />
          <Handle corner="ne" />
          <Handle corner="sw" />
          <Handle corner="se" />
        </>
      ) : null}
    </>
  );
}

type Corner = "nw" | "ne" | "sw" | "se";

function Handle({ corner }: { corner: Corner }) {
  const positions: Record<Corner, CSSProperties> = {
    nw: { left: -4, top: -4 },
    ne: { right: -4, top: -4 },
    sw: { left: -4, bottom: -4 },
    se: { right: -4, bottom: -4 },
  };
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: 7,
        height: 7,
        background: "#0a0b0d",
        border: "1.5px solid #8b7dff",
        borderRadius: 1,
        zIndex: 22,
        ...positions[corner],
      }}
    />
  );
}

function toContainerStyle(props: ContainerProps): CSSProperties {
  if (props.layout === "grid") {
    return {
      display: "grid",
      gridTemplateColumns: props.columns,
      gap: props.gap,
    };
  }
  const align =
    props.align === "center"
      ? "center"
      : props.align === "end"
        ? "flex-end"
        : "flex-start";
  const justify =
    props.justify === "center"
      ? "center"
      : props.justify === "between"
        ? "space-between"
        : "flex-start";
  return {
    display: "flex",
    flexDirection: props.layout === "row" ? "row" : "column",
    alignItems: align,
    justifyContent: justify,
    gap: props.gap,
  };
}

// eslint-disable-next-line max-lines-per-function -- node dispatcher, logic-flat
export function RenderNode({
  node,
  selected,
  hovered,
  onSelect,
  onHover,
}: RenderProps) {
  const isSel = selected.includes(node.id);
  const isHov = hovered === node.id;

  const handleClick = (event: ReactMouseEvent) => {
    event.stopPropagation();
    onSelect(node.id, event.shiftKey);
  };
  const handleEnter = (event: ReactMouseEvent) => {
    event.stopPropagation();
    onHover(node.id);
  };
  const handleLeave = (event: ReactMouseEvent) => {
    event.stopPropagation();
    onHover(null);
  };

  if (node.type === "Background") {
    const p = node.props as unknown as BackgroundProps;
    const bg =
      p.kind === "gradient"
        ? `linear-gradient(${p.angle}deg, ${p.from}, ${p.to})`
        : p.color ?? "#000";
    return (
      <div
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          position: "absolute",
          inset: 0,
          background: bg,
          zIndex: 0,
          opacity: p.opacity ?? 1,
          cursor: "default",
        }}
      >
        {p.overlay === "grain" ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              mixBlendMode: "overlay",
              opacity: 0.12,
              backgroundImage:
                'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22><filter id=%22n%22><feTurbulence baseFrequency=%221.2%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%22.8%22/></svg>")',
            }}
          />
        ) : null}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(80% 60% at 25% 30%, rgba(122,162,255,.18), transparent 70%)",
          }}
        />
        <SelectionRing selected={isSel} hovered={isHov} label="BACKGROUND" />
      </div>
    );
  }

  if (node.type === "Container") {
    const p = node.props as unknown as ContainerProps;
    const isRoot = node.id === "root";
    return (
      <div
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          position: "relative",
          padding: `${p.padY ?? 0}px ${p.padX ?? 0}px`,
          minHeight: p.minH ?? "auto",
          zIndex: 1,
          width: isRoot ? "100%" : "auto",
          height: isRoot ? "100%" : "auto",
          cursor: "default",
          ...toContainerStyle(p),
        }}
      >
        {node.children.map((child) => (
          <RenderNode
            key={child.id}
            node={child}
            selected={selected}
            hovered={hovered}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
        {!isRoot ? (
          <SelectionRing selected={isSel} hovered={isHov} label="CONTAINER" />
        ) : null}
        {isRoot && isSel ? (
          <SelectionRing selected hovered={false} label="ROOT" />
        ) : null}
      </div>
    );
  }

  if (node.type === "Heading") {
    const p = node.props as unknown as HeadingProps;
    return (
      <h1
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          position: "relative",
          margin: 0,
          color: p.color,
          fontSize: p.size,
          fontWeight: p.weight,
          letterSpacing: `${p.tracking}em`,
          lineHeight: p.leading,
          maxWidth: p.maxW,
          fontFamily: '"Inter Tight", sans-serif',
          cursor: "default",
        }}
      >
        {p.text}
        <SelectionRing
          selected={isSel}
          hovered={isHov}
          label={`H${p.level}`}
        />
      </h1>
    );
  }

  if (node.type === "Text") {
    const p = node.props as unknown as TextProps;
    return (
      <p
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          position: "relative",
          margin: 0,
          color: p.color,
          fontSize: p.size,
          lineHeight: p.leading ?? 1.5,
          letterSpacing: p.tracking ? `${p.tracking}em` : undefined,
          textTransform: p.upper ? "uppercase" : "none",
          maxWidth: p.maxW,
          fontFamily: p.mono
            ? '"JetBrains Mono", monospace'
            : '"Inter Tight", sans-serif',
          cursor: "default",
        }}
      >
        {p.text}
        <SelectionRing selected={isSel} hovered={isHov} label="TEXT" />
      </p>
    );
  }

  if (node.type === "Logo") {
    const p = node.props as unknown as LogoProps;
    return (
      <div
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          cursor: "default",
        }}
      >
        <div
          style={{
            width: p.size + 8,
            height: p.size + 8,
            background: p.color,
            color: "#0b1220",
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: p.size * 0.5,
            letterSpacing: -0.02,
          }}
        >
          {p.mark}
        </div>
        <span
          style={{
            color: p.color,
            fontSize: p.size * 0.72,
            fontWeight: 600,
            letterSpacing: -0.01,
          }}
        >
          {p.label}
        </span>
        <SelectionRing selected={isSel} hovered={isHov} label="LOGO" />
      </div>
    );
  }

  if (node.type === "Button") {
    const p = node.props as unknown as ButtonProps;
    return (
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          position: "relative",
          background: p.bg,
          color: p.fg,
          padding: `${p.padY}px ${p.padX}px`,
          borderRadius: p.radius,
          fontSize: 15,
          fontWeight: p.weight ?? 500,
          border: p.variant === "ghost" ? "1px solid rgba(255,255,255,.16)" : "none",
          letterSpacing: -0.005,
          cursor: "pointer",
        }}
      >
        {p.text}
        <SelectionRing selected={isSel} hovered={isHov} label="BUTTON" />
      </button>
    );
  }

  if (node.type === "Divider") {
    const p = node.props as unknown as DividerProps;
    return (
      <div
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          position: "relative",
          height: p.thickness,
          width: p.width ?? "100%",
          background: p.color,
          margin: `${p.marginY ?? 0}px 0`,
          cursor: "default",
        }}
      >
        <SelectionRing selected={isSel} hovered={isHov} label="DIVIDER" />
      </div>
    );
  }

  if (node.type === "ImageStrip") {
    const p = node.props as unknown as ImageStripProps;
    const n = node.children.length;
    const cols = n === 3 ? "1fr 1fr 1fr" : n === 2 ? "1fr 1fr" : "1fr";
    const ratioLabel = n === 3 ? "1:1:1" : n === 2 ? "1:1" : "full";
    return (
      <div
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: cols,
          gap: p.gap,
          width: "100%",
          height: 420,
          cursor: "default",
        }}
      >
        {node.children.map((child) => (
          <RenderNode
            key={child.id}
            node={child}
            selected={selected}
            hovered={hovered}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
        <SelectionRing
          selected={isSel}
          hovered={isHov}
          label={`STRIP · ${ratioLabel}`}
        />
      </div>
    );
  }

  if (node.type === "Image") {
    const p = node.props as unknown as ImageProps;
    return (
      <div
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          position: "relative",
          minWidth: 0,
          minHeight: 0,
          cursor: "default",
        }}
      >
        <ImagePlaceholder kind={p.kind} hue={p.hue} alt={p.alt} radius={14} />
        <SelectionRing selected={isSel} hovered={isHov} label="IMAGE" />
      </div>
    );
  }

  return null;
}
