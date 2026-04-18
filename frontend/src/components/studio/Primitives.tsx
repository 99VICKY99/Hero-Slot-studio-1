import type { CSSProperties, ReactNode } from "react";

/** Shared small UI primitives — mirrors hero-handoff/src/primitives.jsx. */

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span
      className="mono inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-s border border-line-2 px-[5px] text-[10.5px] font-medium text-text-1"
      style={{ background: "#00000055", letterSpacing: 0 }}
    >
      {children}
    </span>
  );
}

export interface IconBtnProps {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  title: string;
  size?: number;
}

export function IconBtn({
  children,
  onClick,
  active = false,
  title,
  size = 28,
}: IconBtnProps) {
  const base =
    "inline-flex items-center justify-center rounded-m transition-colors duration-fast ease-out";
  const state = active
    ? "bg-bg-3 text-text-0"
    : "bg-transparent text-text-1 hover:bg-bg-2 hover:text-text-0";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`${base} ${state}`}
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  );
}

export type PillTone = "neutral" | "pos" | "warn" | "accent" | "mono";

export interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  style?: CSSProperties;
  className?: string;
}

const PILL_TONE: Record<PillTone, string> = {
  neutral: "bg-bg-3 text-text-1 border-line-2",
  pos: "border-[#1f4f37] text-[#7ee2a6]",
  warn: "border-[#4a3b15] text-[#f5cc66]",
  accent: "bg-accent-soft text-[#b8afff] border-accent-line",
  mono: "text-text-1 border-line-2",
};

const PILL_BG_STYLES: Record<PillTone, CSSProperties | undefined> = {
  neutral: undefined,
  pos: { background: "#0f2a1e" },
  warn: { background: "#2a2210" },
  accent: undefined,
  mono: { background: "#ffffff08" },
};

export function Pill({ children, tone = "neutral", style, className }: PillProps) {
  return (
    <span
      className={`mono inline-flex items-center gap-[5px] rounded-s border px-[7px] py-[2px] text-[10.5px] font-medium uppercase tracking-[0.02em] ${PILL_TONE[tone]} ${className ?? ""}`}
      style={{ ...PILL_BG_STYLES[tone], ...style }}
    >
      {children}
    </span>
  );
}

export interface SegOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SegProps<T extends string | number> {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Seg<T extends string | number>({
  options,
  value,
  onChange,
}: SegProps<T>) {
  return (
    <div className="inline-flex gap-[2px] rounded-m border border-line-1 bg-bg-2 p-[2px]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex h-[22px] items-center gap-1 rounded-s px-[10px] text-[11.5px] font-medium transition-colors duration-fast ease-out ${active ? "bg-bg-4 text-text-0" : "bg-transparent text-text-2"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export interface RowProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function Row({ label, children, hint }: RowProps) {
  return (
    <div className="flex min-h-[28px] items-center gap-2">
      <div className="w-[72px] shrink-0 text-[11.5px] font-medium text-text-2">
        {label}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-[6px]">{children}</div>
      {hint ? (
        <div className="mono text-[10px] text-text-3">{hint}</div>
      ) : null}
    </div>
  );
}

export interface NumInputProps {
  value: number | string;
  onChange?: (value: string) => void;
  suffix?: string;
  width?: number;
}

export function NumInput({
  value,
  onChange,
  suffix,
  width = 60,
}: NumInputProps) {
  return (
    <div
      className="inline-flex h-[24px] items-center gap-[3px] rounded-s border border-line-1 bg-bg-0 px-[6px] py-[2px]"
      style={{ width }}
    >
      <input
        type="text"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="mono w-full border-0 bg-transparent p-0 text-[11.5px] text-text-0 outline-none"
      />
      {suffix ? (
        <span className="mono text-[10px] text-text-3">{suffix}</span>
      ) : null}
    </div>
  );
}

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  mono = false,
}: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`h-[24px] min-w-0 flex-1 rounded-s border border-line-1 bg-bg-0 px-2 text-[12px] text-text-0 outline-none transition-colors duration-fast ease-out focus:border-accent-line ${mono ? "mono" : ""}`}
    />
  );
}

export interface SwatchProps {
  color: string;
  size?: number;
  onClick?: () => void;
}

export function Swatch({ color, size = 18, onClick }: SwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Color ${color}`}
      className="flex-shrink-0 cursor-pointer rounded-s border border-white/10"
      style={{
        width: size,
        height: size,
        background: color,
        flex: `0 0 ${size}px`,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,.3)",
      }}
    />
  );
}

export function Divider({ my = 10 }: { my?: number }) {
  return (
    <div
      aria-hidden="true"
      className="bg-line-1"
      style={{ height: 1, margin: `${my}px 0` }}
    />
  );
}

export interface PanelHeaderProps {
  title: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PanelHeader({ title, actions, icon }: PanelHeaderProps) {
  return (
    <div className="flex min-h-[38px] items-center border-b border-line-1 py-[10px] pl-[14px] pr-[12px]">
      {icon ? <div className="mr-2 flex text-text-2">{icon}</div> : null}
      <div className="flex-1 text-[11.5px] font-semibold uppercase tracking-[0.03em] text-text-1">
        {title}
      </div>
      <div className="flex gap-[2px]">{actions}</div>
    </div>
  );
}

export interface ColorFieldProps {
  color: string;
  onChange: (value: string) => void;
}

export function ColorField({ color, onChange }: ColorFieldProps) {
  return (
    <div className="relative inline-flex h-[24px] flex-1 items-center gap-[6px] rounded-s border border-line-1 bg-bg-0 px-[6px]">
      <span
        aria-hidden="true"
        className="inline-block rounded-[2px]"
        style={{
          width: 14,
          height: 14,
          background: color,
          flex: "0 0 14px",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,.15), inset 0 0 0 2px rgba(0,0,0,.2)",
        }}
      />
      <input
        value={color ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="mono flex-1 border-0 bg-transparent p-0 text-[11px] text-text-0 outline-none"
        style={{ letterSpacing: 0 }}
      />
      <span className="mono text-[9.5px] text-text-3">100%</span>
    </div>
  );
}

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative flex h-[20px] flex-1 items-center">
      <div className="relative h-[3px] w-full rounded-[2px] bg-bg-3">
        <div
          className="absolute left-0 top-0 bottom-0 rounded-[2px] bg-accent"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute h-[12px] w-[12px] rounded-full bg-text-0"
          style={{
            left: `calc(${pct}% - 6px)`,
            top: -4.5,
            boxShadow:
              "0 2px 6px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.3)",
          }}
        />
      </div>
      {onChange ? (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Slider"
        />
      ) : null}
    </div>
  );
}
