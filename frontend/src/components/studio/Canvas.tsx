import { Icons } from "./Icons";
import { IconBtn, Pill, Seg } from "./Primitives";
import { RenderNode } from "./HeroRender";
import type { HeroNode } from "./mockData";

export type CanvasDevice = "desktop" | "tablet" | "custom";

export interface CanvasProps {
  tree: HeroNode;
  selectedIds: string[];
  hoveredId: string | null;
  onSelect: (id: string, shift: boolean) => void;
  onHover: (id: string | null) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  device: CanvasDevice;
  setDevice: (device: CanvasDevice) => void;
  onDeselect: () => void;
  previewUrl: string;
}

export function Canvas(props: CanvasProps) {
  const {
    tree,
    selectedIds,
    hoveredId,
    onSelect,
    onHover,
    zoom,
    setZoom,
    device,
    setDevice,
    onDeselect,
    previewUrl,
  } = props;
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-canvas">
      <CanvasToolbar
        zoom={zoom}
        setZoom={setZoom}
        device={device}
        setDevice={setDevice}
      />
      <div
        onClick={onDeselect}
        className="relative flex flex-1 items-center justify-center overflow-auto p-[40px]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #ffffff08 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      >
        <PreviewFrame
          tree={tree}
          selectedIds={selectedIds}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
          zoom={zoom}
          device={device}
          previewUrl={previewUrl}
        />
      </div>
    </div>
  );
}

interface CanvasToolbarProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  device: CanvasDevice;
  setDevice: (device: CanvasDevice) => void;
}

function CanvasToolbar({
  zoom,
  setZoom,
  device,
  setDevice,
}: CanvasToolbarProps) {
  return (
    <div className="flex h-[38px] shrink-0 items-center gap-[6px] border-b border-line-1 bg-bg-1 px-[10px]">
      <Seg<CanvasDevice>
        value={device}
        onChange={setDevice}
        options={[
          { value: "desktop", label: "Desktop 1440" },
          { value: "tablet", label: "Tablet 834" },
          { value: "custom", label: "Custom" },
        ]}
      />
      <div className="mx-1 h-[18px] w-px bg-line-1" aria-hidden="true" />
      <IconBtn title="Zoom out" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}>
        <span className="text-[14px]">—</span>
      </IconBtn>
      <div className="mono w-[54px] text-center text-[11.5px] text-text-1">
        {Math.round(zoom * 100)}%
      </div>
      <IconBtn title="Zoom in" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
        <span className="text-[14px]">+</span>
      </IconBtn>
      <IconBtn title="Fit" onClick={() => setZoom(0.7)}>
        {Icons.fullscreen}
      </IconBtn>
      <div className="flex-1" />
      <Pill tone="mono" style={{ textTransform: "none" }}>
        iframe · sandbox allow-scripts
      </Pill>
      <IconBtn title="Refresh">{Icons.refresh}</IconBtn>
    </div>
  );
}

interface PreviewFrameProps {
  tree: HeroNode;
  selectedIds: string[];
  hoveredId: string | null;
  onSelect: (id: string, shift: boolean) => void;
  onHover: (id: string | null) => void;
  zoom: number;
  device: CanvasDevice;
  previewUrl: string;
}

function PreviewFrame({
  tree,
  selectedIds,
  hoveredId,
  onSelect,
  onHover,
  zoom,
  device,
  previewUrl,
}: PreviewFrameProps) {
  const width = device === "tablet" ? 834 : 1280;
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className="relative shrink-0 overflow-hidden rounded-l"
      style={{
        width,
        minHeight: 620,
        background: "#0b1220",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,.6), 0 0 0 1px #ffffff0a",
        transform: `scale(${zoom})`,
        transformOrigin: "center center",
      }}
    >
      <FrameChrome url={previewUrl} />
      <div className="relative" style={{ minHeight: 560 }}>
        <RenderNode
          node={tree}
          selected={selectedIds}
          hovered={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      </div>
    </div>
  );
}

function FrameChrome({ url }: { url: string }) {
  return (
    <div
      className="flex h-[28px] shrink-0 items-center gap-2 border-b px-[10px]"
      style={{
        background: "#00000040",
        borderBottomColor: "rgba(255,255,255,.05)",
      }}
    >
      <div className="flex gap-[5px]">
        <Dot color="#ff5f57" />
        <Dot color="#febc2e" />
        <Dot color="#28c840" />
      </div>
      <div className="flex-1" />
      <div
        className="mono rounded-s px-[10px] py-[3px] text-[10.5px]"
        style={{
          color: "rgba(255,255,255,.45)",
          background: "rgba(255,255,255,.04)",
          letterSpacing: 0.02,
        }}
      >
        {url}
      </div>
      <div className="flex-1" />
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-[10px] w-[10px] rounded-full"
      style={{ background: color }}
    />
  );
}
