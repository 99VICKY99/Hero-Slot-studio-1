import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import { Icons } from "./Icons";
import { IconBtn } from "./Primitives";
import {
  TYPE_META,
  type ClientProfile,
  type HeroNode,
  type HeroElementType,
} from "./mockData";

export type LeftTab = "tree" | "assets";

export interface LeftPanelProps {
  tree: HeroNode;
  selectedIds: string[];
  hoveredId: string | null;
  onSelect: (id: string, shift: boolean) => void;
  onHover: (id: string | null) => void;
  tab: LeftTab;
  setTab: (tab: LeftTab) => void;
  assets: ClientProfile;
}

export function LeftPanel({
  tree,
  selectedIds,
  hoveredId,
  onSelect,
  onHover,
  tab,
  setTab,
  assets,
}: LeftPanelProps) {
  return (
    <div className="flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-line-1 bg-bg-1">
      <div className="flex h-[38px] shrink-0 items-center border-b border-line-1 px-2">
        <TabBtn active={tab === "tree"} onClick={() => setTab("tree")} icon={Icons.tree}>
          Tree
        </TabBtn>
        <TabBtn
          active={tab === "assets"}
          onClick={() => setTab("assets")}
          icon={Icons.palette}
        >
          Assets
        </TabBtn>
        <div className="flex-1" />
        <IconBtn title="Search" size={24}>
          {Icons.search}
        </IconBtn>
      </div>

      {tab === "tree" ? (
        <TreeView
          tree={tree}
          selectedIds={selectedIds}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={onHover}
        />
      ) : (
        <AssetsView assets={assets} />
      )}
    </div>
  );
}

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}

function TabBtn({ active, onClick, icon, children }: TabBtnProps) {
  const style = active
    ? "text-text-0 border-b-2 border-accent"
    : "text-text-2 border-b-2 border-transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-[-1px] inline-flex h-[28px] items-center gap-[6px] px-[10px] text-[12px] font-medium ${style}`}
    >
      {icon}
      {children}
    </button>
  );
}

interface TreeViewProps {
  tree: HeroNode;
  selectedIds: string[];
  hoveredId: string | null;
  onSelect: (id: string, shift: boolean) => void;
  onHover: (id: string | null) => void;
}

function TreeView({
  tree,
  selectedIds,
  hoveredId,
  onSelect,
  onHover,
}: TreeViewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    root: true,
    left: true,
    right: true,
    "cta-row": true,
    strip: true,
  });
  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderRow = (node: HeroNode, depth: number): ReactNode => {
    const isSel = selectedIds.includes(node.id);
    const isHov = hoveredId === node.id;
    const hasKids = node.children.length > 0;
    const open = Boolean(expanded[node.id]);
    const meta = TYPE_META[node.type];
    const label = nodeLabel(node);

    return (
      <Fragment key={node.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={(event) => onSelect(node.id, event.shiftKey)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(node.id, event.shiftKey);
            }
          }}
          onMouseEnter={() => onHover(node.id)}
          onMouseLeave={() => onHover(null)}
          className={`flex h-[24px] items-center gap-1 pr-2 ${isSel ? "bg-accent-soft border-l-2 border-accent text-text-0" : isHov ? "bg-bg-2 border-l-2 border-transparent text-text-1" : "border-l-2 border-transparent text-text-1"}`}
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          <button
            type="button"
            aria-label={hasKids ? (open ? "Collapse" : "Expand") : "Row"}
            onClick={(event) => {
              event.stopPropagation();
              if (hasKids) toggle(node.id);
            }}
            className="inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center text-text-3"
            style={{ visibility: hasKids ? "visible" : "hidden" }}
          >
            {open ? Icons.chevronD : Icons.chevronR}
          </button>
          <span
            className="mono w-[14px] shrink-0 text-center text-[11px] font-semibold"
            style={{ color: meta.color }}
          >
            {meta.glyph}
          </span>
          <span
            className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] ${isSel ? "text-text-0" : "text-text-1"}`}
          >
            {label}
          </span>
          <span
            className="mono text-[9.5px] text-text-3 transition-opacity duration-fast"
            style={{ opacity: isHov || isSel ? 1 : 0 }}
          >
            {node.id.slice(0, 6)}
          </span>
        </div>
        {hasKids && open
          ? node.children.map((child) => renderRow(child, depth + 1))
          : null}
      </Fragment>
    );
  };

  return (
    <div className="flex-1 overflow-auto py-[6px]">{renderRow(tree, 0)}</div>
  );
}

function trunc(value: string, n: number): string {
  return value.length > n ? `${value.slice(0, n - 1)}…` : value;
}

interface NodePropsShape {
  level?: number;
  text?: string;
  label?: string;
  alt?: string;
}

function nodeLabel(node: HeroNode): string {
  if (node.id === "root") return "Hero";
  const p = node.props as NodePropsShape;
  const type: HeroElementType = node.type;
  if (type === "Heading") return `H${p.level ?? 1} — ${trunc(p.text ?? "", 22)}`;
  if (type === "Text") return trunc(p.text ?? "", 28);
  if (type === "Button") return `Button · ${p.text ?? ""}`;
  if (type === "Logo") return `Logo · ${p.label ?? ""}`;
  if (type === "Image") return `Image · ${p.alt ?? ""}`;
  if (type === "ImageStrip") return `Strip · ${node.children.length}`;
  if (type === "Container") {
    if (node.id === "left") return "Left column";
    if (node.id === "right") return "Right column";
    if (node.id === "cta-row") return "CTA row";
    return "Container";
  }
  if (type === "Background") return "BG · gradient";
  if (type === "Divider") return "Divider";
  return type;
}

function AssetsView({ assets }: { assets: ClientProfile }) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-3">
      <AssetsSection title="Palette · extracted">
        <div className="grid grid-cols-6 gap-[6px]">
          {assets.palette.map((color) => (
            <div key={color} className="flex flex-col gap-1">
              <div
                className="rounded-s"
                style={{
                  aspectRatio: "1 / 1",
                  background: color,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
                }}
              />
              <div className="mono text-center text-[9px] text-text-3">
                {color.slice(1, 7).toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </AssetsSection>

      <AssetsSection
        title="Typography"
        action={
          <span className="mono text-[9.5px] text-text-3">2 DETECTED</span>
        }
      >
        {assets.fonts.map((font, index) => (
          <div
            key={font}
            className="mb-1 flex items-baseline justify-between rounded-[5px] border border-line-1 bg-bg-2 px-[10px] py-2"
          >
            <span
              className="text-[16px]"
              style={{ fontWeight: index === 0 ? 600 : 400 }}
            >
              {font}
            </span>
            <span className="mono text-[10px] text-text-3">
              {index === 0 ? "display" : "body"}
            </span>
          </div>
        ))}
      </AssetsSection>

      <AssetsSection
        title="Images · filtered"
        action={
          <span className="mono text-[9.5px] text-text-3">3/27 KEPT</span>
        }
      >
        <div className="grid grid-cols-2 gap-[6px]">
          {[222, 42, 155, 280].map((hue, index) => (
            <div
              key={hue}
              className="relative rounded-[5px]"
              style={{
                aspectRatio: "4 / 3",
                background: `linear-gradient(135deg, oklch(28% 0.08 ${hue}), oklch(18% 0.06 ${hue + 20}))`,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
                opacity: index === 3 ? 0.4 : 1,
              }}
            >
              {index === 3 ? (
                <div className="mono absolute inset-0 flex items-center justify-center p-[6px] text-center text-[9px] text-text-2">
                  rejected · pHash dup
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </AssetsSection>

      <AssetsSection title="Logo">
        <div className="flex items-center gap-[10px] rounded-[5px] border border-line-1 bg-bg-2 px-3 py-[10px]">
          <div
            className="flex h-[32px] w-[32px] items-center justify-center rounded-m text-[13px] font-bold"
            style={{ background: "#e8f0ff", color: "#0b1220" }}
          >
            {assets.logo}
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-medium">{assets.name.toLowerCase()}.svg</div>
            <div className="mono text-[10px] text-text-3">vector · 2.1 KB</div>
          </div>
        </div>
      </AssetsSection>
    </div>
  );
}

interface AssetsSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

function AssetsSection({ title, action, children }: AssetsSectionProps) {
  return (
    <div>
      <div className="mb-[6px] flex items-center text-[10.5px] font-semibold uppercase tracking-[0.05em] text-text-2">
        <span className="flex-1">{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}
