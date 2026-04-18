import type { ReactNode } from "react";
import { Icons } from "./Icons";
import {
  ColorField,
  Divider,
  IconBtn,
  NumInput,
  PanelHeader,
  Pill,
  Row,
  Seg,
  Slider,
  TextInput,
} from "./Primitives";
import {
  TYPE_META,
  type BackgroundProps,
  type ButtonProps,
  type ContainerProps,
  type DividerProps,
  type HeadingProps,
  type HeroNode,
  type ImageProps,
  type ImageStripProps,
  type LogoProps,
  type TextProps,
} from "./mockData";

export interface RightSidebarProps {
  selected: HeroNode | null;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

export function RightSidebar({ selected, onPatch }: RightSidebarProps) {
  if (!selected) return <EmptySidebar />;
  const meta = TYPE_META[selected.type];

  return (
    <div className="flex w-[280px] shrink-0 flex-col overflow-hidden border-l border-line-1 bg-bg-1">
      <PanelHeader
        title="Properties"
        icon={
          <span
            className="mono font-semibold"
            style={{ color: meta.color }}
          >
            {meta.glyph}
          </span>
        }
        actions={
          <>
            <IconBtn title="Duplicate" size={24}>
              {Icons.dup}
            </IconBtn>
            <IconBtn title="Visibility" size={24}>
              {Icons.eye}
            </IconBtn>
            <IconBtn title="More" size={24}>
              {Icons.more}
            </IconBtn>
          </>
        }
      />

      {/* Breadcrumb trail */}
      <div className="flex items-center gap-1 border-b border-line-1 px-3 py-2">
        <div className="flex-1 text-[12px]">
          <span className="text-text-2">{selected.type}</span>
          <span className="mono ml-[6px] text-[10.5px] text-text-3">
            #{selected.id}
          </span>
        </div>
        <Pill tone="accent" style={{ textTransform: "none" }}>
          locked id
        </Pill>
      </div>

      <div className="flex flex-1 flex-col gap-[14px] overflow-auto p-3">
        <TypeControls selected={selected} onPatch={onPatch} />

        <Divider />
        <SectionTitle>Effects</SectionTitle>
        <Row label="Opacity">
          <Slider value={1} min={0} max={1} step={0.01} />
          <NumInput value={100} suffix="%" width={54} />
        </Row>
        <Row label="Blur">
          <Slider value={0} />
          <NumInput value={0} suffix="px" width={54} />
        </Row>

        <Divider />
        <SectionTitle
          action={
            <span className="mono text-[9.5px] text-text-3">3 SIBLINGS</span>
          }
        >
          Patches on this element
        </SectionTitle>
        <PatchHistory />
      </div>
    </div>
  );
}

function EmptySidebar() {
  return (
    <div className="flex w-[280px] shrink-0 flex-col items-center justify-center gap-[10px] border-l border-line-1 bg-bg-1 p-8 text-center">
      <div className="text-text-3">{Icons.cursor}</div>
      <div className="text-[12.5px] text-text-1">Select an element</div>
      <div
        className="max-w-[200px] text-[11px] text-text-3"
        style={{ lineHeight: 1.5 }}
      >
        Click anywhere on the canvas, or pick from the tree. Every property has
        a direct control.
      </div>
    </div>
  );
}

interface SectionTitleProps {
  children: ReactNode;
  action?: ReactNode;
}

function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div
      className="-mb-[2px] flex items-center text-[10px] font-semibold uppercase tracking-[0.06em] text-text-2"
    >
      <span className="flex-1">{children}</span>
      {action}
    </div>
  );
}

interface ControlsProps {
  selected: HeroNode;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

function TypeControls({ selected, onPatch }: ControlsProps) {
  switch (selected.type) {
    case "Heading":
      return <HeadingCtl id={selected.id} p={selected.props as unknown as HeadingProps} onPatch={onPatch} />;
    case "Text":
      return <TextCtl id={selected.id} p={selected.props as unknown as TextProps} onPatch={onPatch} />;
    case "Button":
      return <ButtonCtl id={selected.id} p={selected.props as unknown as ButtonProps} onPatch={onPatch} />;
    case "Background":
      return <BgCtl id={selected.id} p={selected.props as unknown as BackgroundProps} onPatch={onPatch} />;
    case "Container":
      return <ContainerCtl id={selected.id} p={selected.props as unknown as ContainerProps} onPatch={onPatch} />;
    case "Logo":
      return <LogoCtl id={selected.id} p={selected.props as unknown as LogoProps} onPatch={onPatch} />;
    case "ImageStrip":
      return (
        <StripCtl
          p={selected.props as unknown as ImageStripProps}
          node={selected}
        />
      );
    case "Image":
      return <ImageCtl id={selected.id} p={selected.props as unknown as ImageProps} onPatch={onPatch} />;
    case "Divider":
      return <DividerCtl id={selected.id} p={selected.props as unknown as DividerProps} onPatch={onPatch} />;
    default:
      return null;
  }
}

interface HeadingCtlProps {
  id: string;
  p: HeadingProps;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

function HeadingCtl({ id, p, onPatch }: HeadingCtlProps) {
  return (
    <>
      <SectionTitle>Content</SectionTitle>
      <textarea
        value={p.text}
        onChange={(event) => onPatch(id, { text: event.target.value })}
        rows={3}
        className="w-full resize-y rounded-[5px] border border-line-1 bg-bg-0 p-2 text-[12.5px] text-text-0 outline-none"
        style={{ fontFamily: '"Inter Tight", sans-serif', lineHeight: 1.4 }}
      />
      <Divider />
      <SectionTitle>Typography</SectionTitle>
      <Row label="Level">
        <Seg<number>
          value={p.level}
          onChange={(value) => onPatch(id, { level: value })}
          options={[
            { value: 1, label: "H1" },
            { value: 2, label: "H2" },
            { value: 3, label: "H3" },
          ]}
        />
      </Row>
      <Row label="Size">
        <Slider
          value={p.size}
          min={24}
          max={96}
          onChange={(value) => onPatch(id, { size: value })}
        />
        <NumInput
          value={p.size}
          suffix="px"
          width={54}
          onChange={(value) => {
            const n = Number(value);
            onPatch(id, { size: Number.isFinite(n) ? n : p.size });
          }}
        />
      </Row>
      <Row label="Weight">
        <Seg<number>
          value={p.weight}
          onChange={(value) => onPatch(id, { weight: value })}
          options={[
            { value: 400, label: "Reg" },
            { value: 500, label: "Med" },
            { value: 600, label: "Sb" },
            { value: 700, label: "Bd" },
          ]}
        />
      </Row>
      <Row label="Tracking">
        <Slider
          value={p.tracking}
          min={-0.05}
          max={0.05}
          step={0.005}
          onChange={(value) => onPatch(id, { tracking: value })}
        />
        <NumInput value={p.tracking.toFixed(3)} width={54} />
      </Row>
      <Row label="Leading">
        <Slider
          value={p.leading}
          min={0.9}
          max={1.6}
          step={0.01}
          onChange={(value) => onPatch(id, { leading: value })}
        />
        <NumInput value={p.leading.toFixed(2)} width={54} />
      </Row>
      <Divider />
      <SectionTitle>Color</SectionTitle>
      <Row label="Fill">
        <ColorField
          color={p.color}
          onChange={(value) => onPatch(id, { color: value })}
        />
      </Row>
    </>
  );
}

interface TextCtlProps {
  id: string;
  p: TextProps;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

function TextCtl({ id, p, onPatch }: TextCtlProps) {
  return (
    <>
      <SectionTitle>Content</SectionTitle>
      <textarea
        value={p.text}
        onChange={(event) => onPatch(id, { text: event.target.value })}
        rows={3}
        className="w-full resize-y rounded-[5px] border border-line-1 bg-bg-0 p-2 text-[12.5px] text-text-0 outline-none"
        style={{ fontFamily: '"Inter Tight", sans-serif', lineHeight: 1.4 }}
      />
      <Divider />
      <SectionTitle>Typography</SectionTitle>
      <Row label="Size">
        <Slider
          value={p.size}
          min={11}
          max={28}
          onChange={(value) => onPatch(id, { size: value })}
        />
        <NumInput value={p.size} suffix="px" width={54} />
      </Row>
      <Row label="Leading">
        <Slider value={p.leading ?? 1.5} min={1.1} max={1.9} step={0.05} />
        <NumInput value={(p.leading ?? 1.5).toFixed(2)} width={54} />
      </Row>
      <Row label="Caps">
        <Seg<string>
          value={p.upper ? "upper" : "normal"}
          onChange={(value) => onPatch(id, { upper: value === "upper" })}
          options={[
            { value: "normal", label: "Aa" },
            { value: "upper", label: "AA" },
          ]}
        />
      </Row>
      <Row label="Font">
        <Seg<string>
          value={p.mono ? "mono" : "sans"}
          onChange={(value) => onPatch(id, { mono: value === "mono" })}
          options={[
            { value: "sans", label: "Sans" },
            { value: "mono", label: "Mono" },
          ]}
        />
      </Row>
      <Divider />
      <SectionTitle>Color</SectionTitle>
      <Row label="Fill">
        <ColorField
          color={p.color}
          onChange={(value) => onPatch(id, { color: value })}
        />
      </Row>
    </>
  );
}

interface ButtonCtlProps {
  id: string;
  p: ButtonProps;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

function ButtonCtl({ id, p, onPatch }: ButtonCtlProps) {
  return (
    <>
      <SectionTitle>Label</SectionTitle>
      <TextInput value={p.text} onChange={(value) => onPatch(id, { text: value })} />
      <Divider />
      <SectionTitle>Style</SectionTitle>
      <Row label="Variant">
        <Seg<string>
          value={p.variant}
          onChange={(value) => onPatch(id, { variant: value })}
          options={[
            { value: "solid", label: "Solid" },
            { value: "ghost", label: "Ghost" },
            { value: "link", label: "Link" },
          ]}
        />
      </Row>
      <Row label="Bg">
        <ColorField color={p.bg} onChange={(value) => onPatch(id, { bg: value })} />
      </Row>
      <Row label="Fg">
        <ColorField color={p.fg} onChange={(value) => onPatch(id, { fg: value })} />
      </Row>
      <Row label="Radius">
        <Slider
          value={p.radius}
          min={0}
          max={24}
          onChange={(value) => onPatch(id, { radius: value })}
        />
        <NumInput value={p.radius} suffix="px" width={54} />
      </Row>
      <Row label="Pad X">
        <Slider
          value={p.padX}
          min={6}
          max={40}
          onChange={(value) => onPatch(id, { padX: value })}
        />
        <NumInput value={p.padX} suffix="px" width={54} />
      </Row>
      <Row label="Pad Y">
        <Slider
          value={p.padY}
          min={4}
          max={24}
          onChange={(value) => onPatch(id, { padY: value })}
        />
        <NumInput value={p.padY} suffix="px" width={54} />
      </Row>
    </>
  );
}

interface BgCtlProps {
  id: string;
  p: BackgroundProps;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

function BgCtl({ id, p, onPatch }: BgCtlProps) {
  return (
    <>
      <SectionTitle>Kind</SectionTitle>
      <Row label="Type">
        <Seg<string>
          value={p.kind}
          onChange={(value) => onPatch(id, { kind: value })}
          options={[
            { value: "solid", label: "Solid" },
            { value: "gradient", label: "Grad" },
            { value: "image", label: "Image" },
            { value: "pattern", label: "Pttn" },
          ]}
        />
      </Row>
      {p.kind === "gradient" ? (
        <>
          <Row label="From">
            <ColorField
              color={p.from ?? "#000"}
              onChange={(value) => onPatch(id, { from: value })}
            />
          </Row>
          <Row label="To">
            <ColorField
              color={p.to ?? "#000"}
              onChange={(value) => onPatch(id, { to: value })}
            />
          </Row>
          <Row label="Angle">
            <Slider
              value={p.angle ?? 0}
              min={0}
              max={360}
              onChange={(value) => onPatch(id, { angle: value })}
            />
            <NumInput value={p.angle ?? 0} suffix="°" width={54} />
          </Row>
        </>
      ) : null}
      <Row label="Overlay">
        <Seg<string>
          value={p.overlay ?? "none"}
          onChange={(value) => onPatch(id, { overlay: value })}
          options={[
            { value: "none", label: "None" },
            { value: "grain", label: "Grain" },
            { value: "dots", label: "Dots" },
          ]}
        />
      </Row>
    </>
  );
}

interface ContainerCtlProps {
  id: string;
  p: ContainerProps;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

function ContainerCtl({ id, p, onPatch }: ContainerCtlProps) {
  return (
    <>
      <SectionTitle>Layout</SectionTitle>
      <Row label="Direction">
        <Seg<string>
          value={p.layout}
          onChange={(value) => onPatch(id, { layout: value })}
          options={[
            { value: "stack", label: "Stack" },
            { value: "row", label: "Row" },
            { value: "grid", label: "Grid" },
          ]}
        />
      </Row>
      <Row label="Gap">
        <Slider
          value={p.gap ?? 0}
          min={0}
          max={80}
          onChange={(value) => onPatch(id, { gap: value })}
        />
        <NumInput value={p.gap ?? 0} suffix="px" width={54} />
      </Row>
      <Row label="Pad X">
        <Slider
          value={p.padX ?? 0}
          min={0}
          max={120}
          onChange={(value) => onPatch(id, { padX: value })}
        />
        <NumInput value={p.padX ?? 0} suffix="px" width={54} />
      </Row>
      <Row label="Pad Y">
        <Slider
          value={p.padY ?? 0}
          min={0}
          max={120}
          onChange={(value) => onPatch(id, { padY: value })}
        />
        <NumInput value={p.padY ?? 0} suffix="px" width={54} />
      </Row>
      {p.layout !== "grid" ? (
        <Row label="Align">
          <Seg<string>
            value={p.align ?? "start"}
            onChange={(value) => onPatch(id, { align: value })}
            options={[
              { value: "start", label: "Start" },
              { value: "center", label: "Ctr" },
              { value: "end", label: "End" },
            ]}
          />
        </Row>
      ) : null}
    </>
  );
}

interface LogoCtlProps {
  id: string;
  p: LogoProps;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

function LogoCtl({ id, p, onPatch }: LogoCtlProps) {
  return (
    <>
      <SectionTitle>Brand</SectionTitle>
      <Row label="Label">
        <TextInput value={p.label} onChange={(value) => onPatch(id, { label: value })} />
      </Row>
      <Row label="Mark">
        <TextInput value={p.mark} onChange={(value) => onPatch(id, { mark: value })} mono />
      </Row>
      <Row label="Size">
        <Slider
          value={p.size}
          min={16}
          max={48}
          onChange={(value) => onPatch(id, { size: value })}
        />
        <NumInput value={p.size} suffix="px" width={54} />
      </Row>
      <Row label="Color">
        <ColorField color={p.color} onChange={(value) => onPatch(id, { color: value })} />
      </Row>
    </>
  );
}

interface StripCtlProps {
  p: ImageStripProps;
  node: HeroNode;
}

function StripCtl({ p, node }: StripCtlProps) {
  return (
    <>
      <SectionTitle>Arrangement</SectionTitle>
      <div className="rounded-[5px] border border-line-1 bg-bg-2 px-3 py-[10px]">
        <div className="mb-[6px] text-[11.5px] text-text-1">
          <b className="text-text-0">{node.children.length}</b>{" "}
          image{node.children.length !== 1 ? "s" : ""} · layout auto-derived
        </div>
        <div className="mono text-[10px] text-text-3">
          3 → 1:1:1 · 2 → 1:1 · 1 → full
        </div>
      </div>
      <SectionTitle>Order · drag to rearrange</SectionTitle>
      {node.children.map((child, index) => {
        const childProps = child.props as unknown as ImageProps;
        return (
          <div
            key={child.id}
            className="flex items-center gap-2 rounded-[5px] border border-line-1 bg-bg-2 px-2 py-[6px]"
          >
            <span className="inline-flex text-text-3">{Icons.drag}</span>
            <div
              className="rounded-[3px]"
              style={{
                width: 28,
                height: 20,
                background: `linear-gradient(135deg, oklch(28% 0.08 ${childProps.hue}), oklch(18% 0.06 ${childProps.hue + 20}))`,
              }}
            />
            <span className="flex-1 text-[11.5px]">{childProps.alt}</span>
            <span className="mono text-[10px] text-text-3">{index + 1}</span>
          </div>
        );
      })}
      <Row label="Gap">
        <Slider value={p.gap} min={0} max={32} />
        <NumInput value={p.gap} suffix="px" width={54} />
      </Row>
      <Row label="Radius">
        <Slider value={p.radius} min={0} max={28} />
        <NumInput value={p.radius} suffix="px" width={54} />
      </Row>
    </>
  );
}

interface ImageCtlProps {
  id: string;
  p: ImageProps;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

function ImageCtl({ id, p, onPatch }: ImageCtlProps) {
  return (
    <>
      <SectionTitle>Source</SectionTitle>
      <div
        className="rounded-m border border-line-1"
        style={{
          aspectRatio: "4 / 3",
          background: `linear-gradient(135deg, oklch(28% 0.08 ${p.hue}), oklch(18% 0.06 ${p.hue + 20}))`,
        }}
      />
      <Row label="Alt">
        <TextInput value={p.alt} onChange={(value) => onPatch(id, { alt: value })} />
      </Row>
      <Row label="Hue">
        <Slider
          value={p.hue}
          min={0}
          max={360}
          onChange={(value) => onPatch(id, { hue: value })}
        />
        <NumInput value={p.hue} suffix="°" width={54} />
      </Row>
      <Row label="Replace">
        <button
          type="button"
          className="inline-flex h-[26px] flex-1 items-center justify-center gap-[6px] rounded-[5px] border border-dashed border-line-2 bg-bg-2 px-[10px] text-[11.5px] text-text-1"
        >
          {Icons.upload} Upload or pick from pool
        </button>
      </Row>
    </>
  );
}

interface DividerCtlProps {
  id: string;
  p: DividerProps;
  onPatch: (id: string, changes: Record<string, unknown>) => void;
}

function DividerCtl({ id, p, onPatch }: DividerCtlProps) {
  return (
    <>
      <SectionTitle>Style</SectionTitle>
      <Row label="Orient">
        <Seg<string>
          value={p.orient}
          onChange={(value) => onPatch(id, { orient: value })}
          options={[
            { value: "h", label: "Horizontal" },
            { value: "v", label: "Vertical" },
          ]}
        />
      </Row>
      <Row label="Color">
        <ColorField color={p.color} onChange={(value) => onPatch(id, { color: value })} />
      </Row>
      <Row label="Weight">
        <Slider value={p.thickness} min={1} max={6} />
        <NumInput value={p.thickness} suffix="px" width={54} />
      </Row>
      <Row label="Width">
        <Slider value={p.width ?? 320} min={40} max={800} />
        <NumInput value={p.width ?? 320} suffix="px" width={54} />
      </Row>
    </>
  );
}

function PatchHistory() {
  const rows: Array<{ label: string; detail: string; when: string }> = [
    {
      label: "update_props",
      detail: "size: 48 → 54",
      when: "2m",
    },
    {
      label: "update_props",
      detail: 'text: "Effortless money ops" → "Move money at the speed…"',
      when: "6m",
    },
  ];
  return (
    <div className="flex flex-col gap-1">
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex items-baseline gap-2 border-l-2 border-line-2 px-2 py-[6px]"
        >
          <span className="mono text-[10px] text-accent">{row.label}</span>
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-text-2">
            {row.detail}
          </span>
          <span className="mono text-[10px] text-text-3">{row.when}</span>
        </div>
      ))}
    </div>
  );
}
