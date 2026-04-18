import { useEffect, useState } from "react";
import { Icons } from "./Icons";
import { IconBtn, Pill } from "./Primitives";
import type { Variation, VariationsPayload } from "./mockData";

export interface VariationsModalProps {
  data: VariationsPayload;
  onPick: (variation: Variation, index: number) => void;
  onCancel: () => void;
  onRegenerate: () => void;
}

export function VariationsModal({
  data,
  onPick,
  onCancel,
  onRegenerate,
}: VariationsModalProps) {
  const [focused, setFocused] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key === "1") setFocused(0);
      if (event.key === "2") setFocused(1);
      if (event.key === "3") setFocused(2);
      if (event.key === "Enter") {
        const target = data.variants[focused];
        if (target) onPick(target, focused);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, data, onCancel, onPick]);

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col p-6"
      style={{
        background: "rgba(8,9,12,.72)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex h-full flex-col gap-[14px]"
      >
        {/* Header */}
        <div className="flex items-center gap-[10px]">
          <span className="inline-flex text-accent">{Icons.sparkle}</span>
          <div>
            <div className="text-[13.5px] font-semibold">3 variations ready</div>
            <div className="text-[11.5px] text-text-2">
              <span className="mono">@{data.target}</span> · "{data.prompt}"
            </div>
          </div>
          <div className="flex-1" />
          <Pill tone="mono" style={{ textTransform: "none" }}>
            ⏎ accept · esc cancel
          </Pill>
          <IconBtn onClick={onCancel} title="Close">
            {Icons.close}
          </IconBtn>
        </div>

        {/* Cards row */}
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
          {data.variants.map((variant, index) => (
            <VariantCard
              key={variant.label}
              variant={variant}
              index={index}
              focused={focused === index}
              onFocus={() => setFocused(index)}
              onPick={() => onPick(variant, index)}
            />
          ))}
        </div>

        {/* Rationale strip */}
        <div className="flex items-start gap-[10px] rounded-lg border border-line-1 bg-bg-2 px-[14px] py-[10px]">
          <span className="mt-[1px] inline-flex text-accent">{Icons.wand}</span>
          <div className="flex-1">
            <div className="mono mb-[2px] text-[10px] uppercase tracking-[0.05em] text-text-3">
              Model rationale
            </div>
            <div
              className="text-[12.5px] leading-[1.5] text-text-1"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              "{data.rationale}"
            </div>
          </div>
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex h-[26px] items-center gap-[5px] rounded-[5px] border border-line-2 bg-bg-3 px-[10px] text-[11.5px] text-text-0"
          >
            {Icons.refresh}
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

interface VariantCardProps {
  variant: Variation;
  index: number;
  focused: boolean;
  onFocus: () => void;
  onPick: () => void;
}

function VariantCard({
  variant,
  index,
  focused,
  onFocus,
  onPick,
}: VariantCardProps) {
  const sizeProp = variant.props.size ?? 54;
  const tracking = variant.props.tracking ?? -0.02;
  return (
    <div
      onClick={onFocus}
      onDoubleClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onPick();
      }}
      className="flex cursor-pointer flex-col overflow-hidden rounded-l bg-bg-1 transition-[border-color,box-shadow] duration-normal ease-out"
      style={{
        border: `1.5px solid ${focused ? "#8b7dff" : "#1f2128"}`,
        boxShadow: focused
          ? "0 0 0 3px rgba(139,125,255,.15), 0 12px 32px -8px rgba(0,0,0,.5)"
          : "none",
      }}
    >
      {/* Preview */}
      <div
        className="relative flex flex-1 items-center overflow-hidden p-[28px]"
        style={{ background: "linear-gradient(142deg, #0b1220, #1a2444)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 25% 30%, rgba(122,162,255,.22), transparent 70%)",
          }}
        />
        <div className="relative max-w-[70%]">
          <div className="mb-4 inline-flex items-center gap-[6px]">
            <div
              className="flex h-[18px] w-[18px] items-center justify-center rounded-s text-[9px] font-bold"
              style={{ background: "#e8f0ff", color: "#0b1220" }}
            >
              TW
            </div>
            <span
              className="text-[11px] font-semibold"
              style={{ color: "#e8f0ff" }}
            >
              Tidalwave
            </span>
          </div>
          <div
            style={{
              color: "#f3f6ff",
              fontSize: Math.max(18, sizeProp * 0.32),
              fontWeight: 600,
              letterSpacing: `${tracking}em`,
              lineHeight: 1.05,
              fontFamily: '"Inter Tight", sans-serif',
            }}
          >
            {variant.preview}
          </div>
          <div
            className="mt-[10px] max-w-[220px] text-[10.5px]"
            style={{ color: "#b8c4e0", lineHeight: 1.4 }}
          >
            Sign in to send, request, and settle across 42 currencies.
          </div>
          <div
            className="mt-[14px] inline-flex items-center gap-[6px] rounded-[5px] px-[10px] py-[5px] text-[10px] font-semibold"
            style={{ background: "#7aa2ff", color: "#0b1220" }}
          >
            Continue with SSO
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-line-1 px-3 py-[10px]">
        <span
          className="mono text-[10px] font-semibold"
          style={{ color: focused ? "#8b7dff" : "#474a55" }}
        >
          {index + 1}
        </span>
        <span className="flex-1 text-[12px] font-medium text-text-0">
          {variant.label}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPick();
          }}
          className="inline-flex h-[22px] items-center gap-1 rounded-s border px-[10px] text-[11px] font-semibold"
          style={{
            background: focused ? "#8b7dff" : "#1e2026",
            color: focused ? "#0a0b0d" : "#f5f6f8",
            borderColor: focused ? "#8b7dff" : "#2a2d36",
          }}
        >
          {focused ? "Apply ↵" : "Apply"}
        </button>
      </div>
    </div>
  );
}
