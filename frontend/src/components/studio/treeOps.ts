import type { HeroNode } from "./mockData";

/** Walk helpers — mirrors hero-handoff/src/hero-render.jsx. */
export function findNode(tree: HeroNode | null, id: string): HeroNode | null {
  if (!tree) return null;
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const hit = findNode(child, id);
    if (hit) return hit;
  }
  return null;
}

export function mapTree(
  tree: HeroNode,
  fn: (node: HeroNode) => HeroNode | undefined,
): HeroNode {
  const next = fn(tree) ?? tree;
  return {
    ...next,
    children: next.children.map((child) => mapTree(child, fn)),
  };
}

export function updateProps(
  tree: HeroNode,
  id: string,
  changes: Record<string, unknown>,
): HeroNode {
  return mapTree(tree, (node) =>
    node.id === id
      ? { ...node, props: { ...node.props, ...changes } }
      : node,
  );
}
