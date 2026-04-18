import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
  select: (id: string) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
}

export const useSelectionStore = create<SelectionState>()(
  immer((set) => ({
    selectedIds: [],
    hoveredId: null,
    select: (id) => {
      set((state) => {
        state.selectedIds = [id];
      });
    },
    toggleSelect: (id) => {
      set((state) => {
        const idx = state.selectedIds.indexOf(id);
        if (idx >= 0) {
          state.selectedIds.splice(idx, 1);
        } else {
          state.selectedIds.push(id);
        }
      });
    },
    clearSelection: () => {
      set((state) => {
        state.selectedIds = [];
      });
    },
    setHovered: (id) => {
      set((state) => {
        state.hoveredId = id;
      });
    },
  })),
);
