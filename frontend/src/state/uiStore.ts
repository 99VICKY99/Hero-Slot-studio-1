import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type ToastType = "success" | "warning" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

export type ModalName = "settings" | "import" | "publish" | "shortcuts" | null;

interface UIState {
  sidebarOpen: boolean;
  toolbarVisible: boolean;
  activeModal: ModalName;
  toasts: Toast[];
  setSidebarOpen: (open: boolean) => void;
  setToolbarVisible: (visible: boolean) => void;
  openModal: (name: ModalName) => void;
  closeModal: () => void;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    sidebarOpen: false,
    toolbarVisible: false,
    activeModal: null,
    toasts: [],
    setSidebarOpen: (open) => {
      set((state) => {
        state.sidebarOpen = open;
      });
    },
    setToolbarVisible: (visible) => {
      set((state) => {
        state.toolbarVisible = visible;
      });
    },
    openModal: (name) => {
      set((state) => {
        state.activeModal = name;
      });
    },
    closeModal: () => {
      set((state) => {
        state.activeModal = null;
      });
    },
    pushToast: (toast) => {
      set((state) => {
        state.toasts.push({ ...toast, id: crypto.randomUUID() });
      });
    },
    dismissToast: (id) => {
      set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      });
    },
  })),
);
