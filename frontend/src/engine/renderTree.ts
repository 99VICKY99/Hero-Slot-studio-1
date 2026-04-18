import type { Tree } from "./elementSchemas";

export interface RenderResult {
  html: string;
  css: string;
}

/**
 * Pure tree → {html, css} renderer.
 *
 * TODO(W4 v0.4): full implementation per docs/ARCHITECTURE.md §5 "The Renderer".
 * The backend's `backend/domain/renderer.py` must produce byte-equivalent output
 * (per CLAUDE.md §4.1). Every element emits one root DOM node with class
 * `el-{uuid8}` and `data-element-id="{id}"` so the iframe click-capture IIFE
 * can map DOM events back to tree IDs.
 */
export function renderTree(_tree: Tree): RenderResult {
  return {
    html: "",
    css: "",
  };
}
