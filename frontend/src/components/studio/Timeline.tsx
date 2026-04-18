import { useState } from "react";
import { Icons } from "./Icons";
import { IconBtn, Pill } from "./Primitives";
import type { TimelinePatch } from "./mockData";

export interface TimelineProps {
  patches: TimelinePatch[];
  playhead: number;
  setPlayhead: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCheckpoint: () => void;
}

export function Timeline({
  patches,
  playhead,
  setPlayhead,
  onUndo,
  onRedo,
  onCheckpoint,
}: TimelineProps) {
  const railPct = (playhead / Math.max(1, patches.length - 1)) * 100;
  return (
    <div className="flex h-[88px] shrink-0 flex-col border-t border-line-1 bg-bg-1">
      {/* Header row */}
      <div className="flex h-[30px] shrink-0 items-center gap-[6px] border-b border-line-1 px-[10px] py-[6px]">
        <IconBtn title="Undo  ⌘Z" onClick={onUndo}>
          {Icons.undo}
        </IconBtn>
        <IconBtn title="Redo  ⌘⇧Z" onClick={onRedo}>
          {Icons.redo}
        </IconBtn>
        <div className="mx-1 h-[16px] w-px bg-line-1" aria-hidden="true" />
        <span className="mono text-[10.5px] uppercase tracking-[0.04em] text-text-2">
          Timeline
        </span>
        <span className="mono text-[10.5px] text-text-3">
          {playhead + 1} / {patches.length}
        </span>
        <div className="flex-1" />
        <Pill tone="mono" style={{ textTransform: "none" }}>
          auto-backup on publish · on
        </Pill>
        <button
          type="button"
          onClick={onCheckpoint}
          className="inline-flex h-[22px] items-center gap-1 rounded-s border border-line-1 bg-bg-2 px-2 text-[11px] text-text-1"
        >
          {Icons.plus} Checkpoint
        </button>
      </div>

      {/* Track */}
      <div className="relative flex flex-1 items-center px-[16px] py-[10px]">
        <div
          aria-hidden="true"
          className="absolute left-[22px] right-[22px] h-[2px] rounded-[1px] bg-line-2"
          style={{ top: "50%", transform: "translateY(-1px)" }}
        />
        <div
          aria-hidden="true"
          className="absolute left-[22px] h-[2px] rounded-[1px] bg-accent"
          style={{
            top: "50%",
            width: `calc((100% - 44px) * ${railPct / 100})`,
            transform: "translateY(-1px)",
          }}
        />
        <div className="relative flex flex-1 justify-between">
          {patches.map((patch, index) => (
            <PatchDot
              key={patch.id}
              patch={patch}
              active={index === playhead}
              past={index <= playhead}
              onClick={() => setPlayhead(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PatchDotProps {
  patch: TimelinePatch;
  active: boolean;
  past: boolean;
  onClick: () => void;
}

const OP_COLORS: Record<TimelinePatch["op"], string> = {
  generate: "#fbbf24",
  update_props: "#8b7dff",
  insert_child: "#4ade80",
  remove_child: "#f87171",
  reorder_children: "#7aa2ff",
  regenerate_subtree: "#fbbf24",
};

function PatchDot({ patch, active, past, onClick }: PatchDotProps) {
  const [hover, setHover] = useState(false);
  const opColor = OP_COLORS[patch.op] ?? "#a8acb8";
  const size = active ? 12 : 9;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={patch.label}
      className="relative flex cursor-pointer flex-col items-center gap-[3px] p-0"
    >
      <span
        aria-hidden="true"
        className="rounded-full transition-[width,height] duration-fast"
        style={{
          width: size,
          height: size,
          background: past ? opColor : "#101114",
          border: `1.5px solid ${past ? opColor : "#2a2d36"}`,
          boxShadow: active
            ? `0 0 0 4px ${opColor}33, 0 0 10px ${opColor}66`
            : "none",
        }}
      />
      <span
        className="mono whitespace-nowrap text-[9.5px]"
        style={{
          color: active ? "#f5f6f8" : "#474a55",
          fontWeight: active ? 600 : 400,
        }}
      >
        {patch.when}
      </span>

      {hover ? (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-[5px] border border-line-2 bg-bg-2 px-[9px] py-[6px] shadow-pop"
          style={{
            bottom: "100%",
            left: "50%",
            transform: "translate(-50%, -6px)",
          }}
        >
          <div className="text-[11.5px] font-medium text-text-0">
            {patch.label}
          </div>
          <div className="mono mt-[1px] text-[10px] text-text-3">
            <span style={{ color: opColor }}>{patch.op}</span> · #{patch.target}
          </div>
        </div>
      ) : null}
    </button>
  );
}
