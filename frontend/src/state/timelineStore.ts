import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Element } from "@/engine/elementSchemas";

/**
 * Mirror of backend PropertyPatch (CLAUDE.md §7).
 * Full apply/invert logic lands in W4 (v0.4) — see docs/ARCHITECTURE.md §5.
 */
export type PatchOperation =
  | "update_props"
  | "insert_child"
  | "remove_child"
  | "reorder_children"
  | "regenerate_subtree";

export interface PropertyPatch {
  target_id: string;
  operation: PatchOperation;
  property_changes?: Record<string, unknown>;
  child?: Element;
  child_id?: string;
  position?: number;
  constraints?: Record<string, unknown>;
}

export interface VariationScratch {
  id: string;
  patch: PropertyPatch;
  thumbnailDataUrl?: string;
}

interface TimelineState {
  patches: PropertyPatch[];
  inverses: PropertyPatch[];
  playheadIndex: number;
  scratchVariations: VariationScratch[];
  reset: () => void;
  setScratchVariations: (variations: VariationScratch[]) => void;
  clearScratchVariations: () => void;
}

export const useTimelineStore = create<TimelineState>()(
  immer((set) => ({
    patches: [],
    inverses: [],
    playheadIndex: 0,
    scratchVariations: [],
    reset: () => {
      set((state) => {
        state.patches = [];
        state.inverses = [];
        state.playheadIndex = 0;
        state.scratchVariations = [];
      });
    },
    setScratchVariations: (variations) => {
      set((state) => {
        state.scratchVariations = variations;
      });
    },
    clearScratchVariations: () => {
      set((state) => {
        state.scratchVariations = [];
      });
    },
  })),
);
