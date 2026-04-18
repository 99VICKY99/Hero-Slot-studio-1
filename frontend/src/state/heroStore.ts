import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Tree } from "@/engine/elementSchemas";

export interface HeroAsset {
  id: string;
  type: "logo" | "image" | "screenshot";
  dataUrl: string;
}

export interface Hero {
  id: string;
  name: string;
  tree: Tree;
  html: string;
  css: string;
  assets: HeroAsset[];
}

interface HeroState {
  activeHero: Hero | null;
  setActiveHero: (hero: Hero) => void;
  clearActive: () => void;
  updateTree: (tree: Tree, html: string, css: string) => void;
}

export const useHeroStore = create<HeroState>()(
  immer((set) => ({
    activeHero: null,
    setActiveHero: (hero) => {
      set((state) => {
        state.activeHero = hero;
      });
    },
    clearActive: () => {
      set((state) => {
        state.activeHero = null;
      });
    },
    updateTree: (tree, html, css) => {
      set((state) => {
        if (!state.activeHero) return;
        state.activeHero.tree = tree;
        state.activeHero.html = html;
        state.activeHero.css = css;
      });
    },
  })),
);
