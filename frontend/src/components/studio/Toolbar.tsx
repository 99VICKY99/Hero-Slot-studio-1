import { useState } from "react";
import { Icons } from "./Icons";
import { Kbd } from "./Primitives";
import { TYPE_META, type HeroElementType, type HeroNode } from "./mockData";

export type ToolbarStatus = "idle" | "loading" | "variations";

export interface ToolbarProps {
  selected: HeroNode | null;
  onGenerate: (prompt: string) => void;
  status: ToolbarStatus;
}

const SUGGESTIONS: Record<HeroElementType, string[]> = {
  Heading: ["Shorter", "More confident", "Match @logo voice", "Add a number"],
  Text: ["Tighten", "Add proof point", "Less corporate", "One sentence"],
  Button: ["Action-first verb", "Softer", "Match brand color", "Add arrow"],
  Image: ["More editorial", "Swap from pool", "Convert to product shot"],
  ImageStrip: ["Try 1:1 layout", "Reorder by focus", "Regenerate picks"],
  Logo: ["Bigger", "Stack mark + name", "Mono treatment"],
  Container: ["Try split 60/40", "Center everything", "Stack on mobile"],
  Background: ["Darker", "Warmer palette", "Subtle grain", "Swap to pattern"],
  Divider: ["Remove", "Thicker", "Vertical"],
};

function getSuggestions(type: HeroElementType): string[] {
  return SUGGESTIONS[type] ?? ["Rephrase", "Simplify", "Bolder"];
}

export function Toolbar({ selected, onGenerate, status }: ToolbarProps) {
  const [prompt, setPrompt] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  if (!selected) return null;

  const suggestions = getSuggestions(selected.type);
  const meta = TYPE_META[selected.type];

  const onChange = (value: string) => {
    setPrompt(value);
    const match = /@(\w*)$/.exec(value);
    if (match) {
      setShowMentions(true);
      setMentionQuery(match[1] ?? "");
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string) => {
    setPrompt((prev) => prev.replace(/@\w*$/, `@${name} `));
    setShowMentions(false);
  };

  const submit = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt);
    setPrompt("");
  };

  const loading = status === "loading";

  return (
    <div
      className="pointer-events-auto absolute bottom-[100px] left-1/2 z-[50] flex w-[620px] -translate-x-1/2 flex-col gap-2"
    >
      {/* Context chip */}
      <div className="inline-flex self-start items-center gap-[6px] rounded-m border border-line-2 bg-bg-2 py-[4px] pl-[6px] pr-[10px] shadow-toolbar">
        <span
          className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[3px] bg-accent-soft text-[11px] font-bold"
          style={{
            color: "#8b7dff",
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {meta.glyph}
        </span>
        <span className="text-[11.5px] text-text-1">{selected.type}</span>
        <span className="mono text-[10.5px] text-text-3">#{selected.id}</span>
      </div>

      {/* Main toolbar */}
      <div className="flex flex-col overflow-hidden rounded-l border border-line-2 bg-bg-2 shadow-toolbar">
        {/* Quick suggestions row */}
        <div className="flex items-center gap-[6px] overflow-x-auto border-b border-line-1 px-[10px] py-2">
          <span
            className="mono text-[10px] uppercase tracking-[0.05em] text-text-3"
          >
            Quick
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onGenerate(s)}
              className="h-[24px] shrink-0 whitespace-nowrap rounded-[5px] border border-line-2 bg-bg-3 px-[9px] text-[11.5px] text-text-1 transition-colors duration-fast ease-out hover:bg-bg-4 hover:text-text-0"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Prompt input row */}
        <div className="relative flex items-center gap-2 px-[10px] py-2">
          <span className="inline-flex text-accent">{Icons.sparkle}</span>
          <input
            value={prompt}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            disabled={loading}
            placeholder={
              loading
                ? "Generating 3 variations…"
                : "Describe the change — type @ to reference another element"
            }
            aria-label="AI prompt"
            className="flex-1 border-0 bg-transparent p-0 text-[13px] text-text-0 outline-none"
          />
          <Kbd>↵</Kbd>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="inline-flex h-[26px] items-center gap-[5px] rounded-[5px] px-[10px] text-[12px] font-semibold text-white"
            style={{
              background: loading
                ? "#1e2026"
                : "linear-gradient(180deg, #9587ff, #7465ff)",
              boxShadow: loading ? "none" : "0 2px 6px rgba(139,125,255,.2)",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <Spinner /> : "Generate 3"}
          </button>
        </div>

        {showMentions ? (
          <MentionMenu query={mentionQuery} onPick={insertMention} />
        ) : null}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-[12px] w-[12px] rounded-full"
      style={{
        border: "1.5px solid rgba(255,255,255,.3)",
        borderTopColor: "white",
        animation: "hero-spin .8s linear infinite",
      }}
    />
  );
}

interface MentionMenuProps {
  query: string;
  onPick: (id: string) => void;
}

interface MentionRow {
  id: string;
  type: HeroElementType;
  label: string;
}

const MENTION_ROWS: MentionRow[] = [
  { id: "h1", type: "Heading", label: "Move money…" },
  { id: "p1", type: "Text", label: "Sign in to send…" },
  { id: "cta", type: "Button", label: "Continue with SSO" },
  { id: "logo", type: "Logo", label: "Tidalwave" },
  { id: "strip", type: "ImageStrip", label: "Strip · 3" },
  { id: "bg", type: "Background", label: "BG · gradient" },
  { id: "left", type: "Container", label: "Left column" },
];

function MentionMenu({ query, onPick }: MentionMenuProps) {
  const q = query.toLowerCase();
  const filtered = MENTION_ROWS.filter(
    (row) => row.id.includes(q) || row.label.toLowerCase().includes(q),
  );
  return (
    <div
      className="absolute bottom-full left-[30px] right-[120px] mb-[6px] max-h-[220px] overflow-auto rounded-lg border border-line-2 bg-bg-2 p-1 shadow-pop"
    >
      <div className="mono px-2 py-1 text-[10px] uppercase text-text-3">
        Reference element · {filtered.length}
      </div>
      {filtered.map((row, index) => {
        const meta = TYPE_META[row.type];
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onPick(row.id)}
            className={`flex w-full items-center gap-2 rounded-s px-2 py-[6px] text-left text-text-0 transition-colors duration-fast ease-out hover:bg-bg-3 ${index === 0 ? "bg-bg-3" : "bg-transparent"}`}
          >
            <span
              className="mono w-[16px] text-center text-[11px]"
              style={{ color: meta.color }}
            >
              {meta.glyph}
            </span>
            <span className="mono text-[11.5px] text-accent">@{row.id}</span>
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-text-2">
              {row.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
