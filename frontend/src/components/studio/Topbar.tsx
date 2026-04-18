import { Icons } from "./Icons";
import { Kbd, Pill } from "./Primitives";

export interface TopbarProps {
  heroName: string;
  onRename: (name: string) => void;
  status: "ok" | "warn";
  modelLabel: string;
  dirty: boolean;
  clientUrl: string;
  onPublish: () => void;
  onExport: () => void;
}

export function Topbar({
  heroName,
  onRename,
  status,
  modelLabel,
  dirty,
  clientUrl,
  onPublish,
  onExport,
}: TopbarProps) {
  const indicator = status === "ok" ? "bg-pos" : "bg-warn";
  return (
    <div className="flex h-[44px] shrink-0 items-center gap-2 border-b border-line-1 bg-bg-1 px-3">
      {/* Brand */}
      <div className="mr-[6px] flex items-center gap-2">
        <div
          aria-hidden="true"
          className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] text-[11px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, #8b7dff, #5b4dff)" }}
        >
          H
        </div>
        <span className="text-[13px] font-semibold" style={{ letterSpacing: -0.01 }}>
          Hero Slot
        </span>
        <span className="text-[13px] text-text-3">·</span>
        <span className="text-[12px] text-text-2">Studio</span>
      </div>

      <div className="mx-[6px] h-5 w-px bg-line-1" aria-hidden="true" />

      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-[6px]">
        <button
          type="button"
          className="inline-flex h-[24px] items-center gap-[5px] rounded-[5px] bg-transparent px-2 text-[12.5px] text-text-1"
        >
          {Icons.globe}
          <span className="mono text-[11.5px]">{clientUrl}</span>
          {Icons.chevronR}
        </button>
        <input
          value={heroName}
          onChange={(event) => onRename(event.target.value)}
          aria-label="Hero name"
          className="w-[200px] rounded-s border-0 bg-transparent px-[6px] py-[2px] text-[13px] font-medium text-text-0 outline-none transition-colors duration-fast ease-out focus:bg-bg-2"
          style={{ letterSpacing: -0.005 }}
        />
        <Pill tone="mono" style={{ textTransform: "none", letterSpacing: 0 }}>
          v0.4 · {dirty ? "unsaved" : "saved"}
        </Pill>
      </div>

      <div className="flex-1" />

      {/* Status cluster */}
      <div className="mr-[6px] flex items-center gap-[10px]">
        <div className="mono inline-flex items-center gap-[6px] text-[11px] text-text-2">
          <span
            aria-hidden="true"
            className={`h-[6px] w-[6px] rounded-full ${indicator}`}
            style={{
              boxShadow:
                status === "ok" ? "0 0 6px #4ade80" : "none",
            }}
          />
          {modelLabel}
        </div>
        <div className="mono text-[11px] text-text-3">142ms · 2.1k tok</div>
      </div>

      <div className="h-5 w-px bg-line-1" aria-hidden="true" />

      <div className="ml-1 flex gap-[2px]">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-[28px] items-center gap-[6px] rounded-m border border-line-1 bg-bg-2 px-[10px] text-[12px] font-medium text-text-0"
        >
          {Icons.download}
          <span>Export</span>
          <Kbd>⌘E</Kbd>
        </button>
        <button
          type="button"
          onClick={onPublish}
          className="inline-flex h-[28px] items-center gap-[6px] rounded-m px-[10px] text-[12px] font-semibold text-white"
          style={{
            background: "linear-gradient(180deg, #9587ff, #7465ff)",
            border: "1px solid #6858ff",
            boxShadow:
              "0 2px 8px rgba(139,125,255,.25), inset 0 1px 0 rgba(255,255,255,.15)",
          }}
        >
          <span className="inline-flex">{Icons.bolt}</span>
          Publish
          <Kbd>⌘↵</Kbd>
        </button>
      </div>
    </div>
  );
}
