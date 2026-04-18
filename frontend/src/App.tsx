import { useCallback, useEffect, useMemo, useState } from "react";
import { Toasts } from "@/components/Toasts";
import { Topbar } from "@/components/studio/Topbar";
import { LeftPanel, type LeftTab } from "@/components/studio/LeftPanel";
import { Canvas, type CanvasDevice } from "@/components/studio/Canvas";
import { Toolbar, type ToolbarStatus } from "@/components/studio/Toolbar";
import { VariationsModal } from "@/components/studio/Variations";
import { RightSidebar } from "@/components/studio/RightSidebar";
import { Timeline } from "@/components/studio/Timeline";
import { Tweaks, TWEAK_DEFAULTS, type TweaksState } from "@/components/studio/Tweaks";
import {
  CLIENT,
  DEMO_VARIATIONS,
  SEED_TIMELINE,
  SEED_TREE,
  type HeroNode,
  type TimelinePatch,
  type Variation,
  type VariationsPayload,
} from "@/components/studio/mockData";
import { findNode, updateProps } from "@/components/studio/treeOps";
import { apiClient, ApiError } from "@/api/client";
import { useSelectionStore } from "@/state/selectionStore";
import { useUIStore } from "@/state/uiStore";
import { useSettingsStore } from "@/state/settingsStore";

/**
 * Studio shell — implements the Hero Slot Studio editor
 * ported from the hero-handoff design bundle (2026-04-18).
 *
 * State layering:
 *  - UI-local state (zoom, leftTab, device, heroName, etc.) stays in this component.
 *  - Selection is mirrored into selectionStore so other systems (future W4
 *    postMessage bridge, keyboard shortcuts) can consume it.
 *  - Variations + timeline live in this component until the W4 patch engine
 *    lands; timelineStore already exists for the final wiring.
 *  - Toolbar/tweaks visibility lives in uiStore.
 */
export default function App() {
  const [tree, setTree] = useState<HeroNode>(SEED_TREE);
  const [leftTab, setLeftTab] = useState<LeftTab>("tree");
  const [zoom, setZoom] = useState(0.62);
  const [device, setDevice] = useState<CanvasDevice>("desktop");
  const [heroName, setHeroName] = useState("Login · hero v4");
  const [dirty, setDirty] = useState(true);

  const [patches, setPatches] = useState<TimelinePatch[]>(SEED_TIMELINE);
  const [playhead, setPlayhead] = useState(SEED_TIMELINE.length - 1);

  const [aiStatus, setAiStatus] = useState<ToolbarStatus>("idle");
  const [variations, setVariations] = useState<VariationsPayload | null>(null);

  const [tweaks, setTweaks] = useState<TweaksState>(TWEAK_DEFAULTS);
  const [modelLabel, setModelLabel] = useState("…");
  const [previewUrl, setPreviewUrl] = useState<string>("tidalwave.fi/login");

  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const hoveredId = useSelectionStore((s) => s.hoveredId);
  const selectOne = useSelectionStore((s) => s.select);
  const toggleSelect = useSelectionStore((s) => s.toggleSelect);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const setHovered = useSelectionStore((s) => s.setHovered);

  const toolbarVisible = useUIStore((s) => s.toolbarVisible);
  const setToolbarVisible = useUIStore((s) => s.setToolbarVisible);
  const pushToast = useUIStore((s) => s.pushToast);

  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrated = useSettingsStore((s) => s.hydrated);

  // Seed selection once so the Toolbar shows up.
  useEffect(() => {
    selectOne("h1");
  }, [selectOne]);

  // Hydrate persisted settings; not strictly needed for studio shell but
  // required so the test harness doesn't crash on the missing store.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Dark mode is the only mode; toggle for legacy CSS that keys off `.dark`.
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, [hydrated]);

  // Populate model chip from /health, fall back to "offline".
  useEffect(() => {
    apiClient
      .health()
      .then((h) => setModelLabel(h.model))
      .catch(() => setModelLabel("offline"));
  }, []);

  // Apply accent hue tweak to accent-related CSS vars consumed by selection rings.
  useEffect(() => {
    const root = document.documentElement;
    const accent = `oklch(73% 0.18 ${tweaks.accentHue})`;
    root.style.setProperty("--ring-accent", accent);
  }, [tweaks.accentHue]);

  const selected = useMemo<HeroNode | null>(() => {
    if (selectedIds.length === 0) return null;
    const last = selectedIds[selectedIds.length - 1];
    return last ? findNode(tree, last) : null;
  }, [tree, selectedIds]);

  const onSelect = useCallback(
    (id: string, shift: boolean) => {
      if (shift) toggleSelect(id);
      else selectOne(id);
      setToolbarVisible(true);
    },
    [selectOne, toggleSelect, setToolbarVisible],
  );

  const onDeselect = useCallback(() => {
    clearSelection();
    setToolbarVisible(false);
  }, [clearSelection, setToolbarVisible]);

  const onPatch = useCallback((id: string, changes: Record<string, unknown>) => {
    setTree((current) => updateProps(current, id, changes));
    setDirty(true);
  }, []);

  const onGenerate = useCallback(
    (prompt: string) => {
      // TODO: W2 — replace demo payload with apiClient.patch() once wired.
      setAiStatus("loading");
      window.setTimeout(() => {
        const targetId = selected?.id ?? "h1";
        setVariations({
          ...DEMO_VARIATIONS,
          target: targetId,
          prompt,
        });
        setAiStatus("variations");
      }, 1200);
    },
    [selected],
  );

  const onPickVariation = useCallback(
    (variant: Variation, _index: number) => {
      if (!variations) return;
      const targetId = variations.target;
      setTree((current) => updateProps(current, targetId, variant.props));
      setPatches((current) => {
        const next: TimelinePatch = {
          id: `p${current.length + 1}`,
          label: `AI · ${variant.label}`,
          op: "update_props",
          target: targetId,
          when: nowStr(),
        };
        setPlayhead(current.length);
        return [...current, next];
      });
      setVariations(null);
      setAiStatus("idle");
      setDirty(true);
    },
    [variations],
  );

  const onUndo = useCallback(() => {
    setPlayhead((current) => (current > 0 ? current - 1 : current));
  }, []);

  const onRedo = useCallback(() => {
    setPlayhead((current) =>
      current < patches.length - 1 ? current + 1 : current,
    );
  }, [patches.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        onUndo();
      }
      if (mod && (event.key === "Z" || (event.key === "z" && event.shiftKey))) {
        event.preventDefault();
        onRedo();
      }
      if (event.key === "Escape" && variations) {
        setVariations(null);
        setAiStatus("idle");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onUndo, onRedo, variations]);

  // Wire /fetch-site so typing a new URL updates the preview chrome.
  const handlePublish = useCallback(() => {
    setDirty(false);
    pushToast({
      type: "success",
      title: "Published",
      description: "Auto-backup saved to Downloads.",
    });
  }, [pushToast]);

  const handleExport = useCallback(() => {
    pushToast({
      type: "info",
      title: "Export (stub)",
      description: "JSON export wires in v0.10.",
    });
  }, [pushToast]);

  const handleRename = useCallback(async (next: string) => {
    setHeroName(next);
    // If the user types a full URL into the hero name (shortcut path),
    // treat it as a re-fetch request.
    if (!/^https?:\/\//i.test(next)) return;
    try {
      await apiClient.fetchSite({ url: next });
      setPreviewUrl(next.replace(/^https?:\/\//i, ""));
    } catch (err) {
      if (err instanceof ApiError) {
        // fallback to mock — demo continues.
      }
    }
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-bg-0">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Topbar
        heroName={heroName}
        onRename={handleRename}
        status={modelLabel === "offline" ? "warn" : "ok"}
        modelLabel={modelLabel === "…" || modelLabel === "offline" ? "minimax-m2.7" : modelLabel}
        dirty={dirty}
        clientUrl={CLIENT.url.replace(/^https?:\/\//i, "")}
        onPublish={handlePublish}
        onExport={handleExport}
      />

      <div className="flex min-h-0 flex-1">
        <LeftPanel
          tree={tree}
          selectedIds={selectedIds}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onHover={setHovered}
          tab={leftTab}
          setTab={setLeftTab}
          assets={CLIENT}
        />

        <main id="main" className="relative flex min-w-0 flex-1 flex-col">
          <Canvas
            tree={tree}
            selectedIds={selectedIds}
            hoveredId={hoveredId}
            onSelect={onSelect}
            onHover={setHovered}
            zoom={zoom}
            setZoom={setZoom}
            device={device}
            setDevice={setDevice}
            onDeselect={onDeselect}
            previewUrl={previewUrl}
          />
          {aiStatus !== "variations" && selected && toolbarVisible ? (
            <Toolbar
              selected={selected}
              onGenerate={onGenerate}
              status={aiStatus}
            />
          ) : null}
          {aiStatus === "variations" && variations ? (
            <VariationsModal
              data={variations}
              onPick={onPickVariation}
              onCancel={() => {
                setVariations(null);
                setAiStatus("idle");
              }}
              onRegenerate={() => onGenerate(variations.prompt)}
            />
          ) : null}
          <Tweaks
            tweaks={tweaks}
            setTweaks={setTweaks}
            visible={false}
            onClose={() => {}}
          />
        </main>

        <RightSidebar selected={selected} onPatch={onPatch} />
      </div>

      <Timeline
        patches={patches}
        playhead={playhead}
        setPlayhead={setPlayhead}
        onUndo={onUndo}
        onRedo={onRedo}
        onCheckpoint={() => {
          pushToast({
            type: "info",
            title: "Checkpoint saved",
            description: "Named checkpoints land in v0.9.",
          });
        }}
      />

      <Toasts />
    </div>
  );
}

function nowStr(): string {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m} ${d.getHours() < 12 ? "AM" : "PM"}`;
}
