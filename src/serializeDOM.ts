import type { Descriptor } from "./types";

// Safety rails so serialization never becomes expensive or unbounded.
const MAX_DEPTH = 8;
const MAX_CHILDREN = 16;

const round = (n: number): number => Math.round(n);

const isTextOnly = (el: Element): boolean => {
  let hasText = false;
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 1) return false; // Element → not text-only
    if (node.nodeType === 3 && node.textContent && node.textContent.trim().length > 0) {
      hasText = true;
    }
  }
  return hasText;
};

const estimateLines = (rect: DOMRect, lineHeightPx: number): number => {
  if (!lineHeightPx || !rect.height) return 1;
  return Math.max(1, Math.min(6, Math.round(rect.height / lineHeightPx)));
};

const parsePx = (v: string): number => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
};

const serialize = (el: HTMLElement, depth: number): Descriptor | null => {
  if (depth > MAX_DEPTH) return null;

  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return null;

  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const tag = el.tagName.toLowerCase();
  const radiusPx = parsePx(style.borderTopLeftRadius);

  // Image / media
  if (
    tag === "img" ||
    tag === "picture" ||
    tag === "video" ||
    tag === "canvas" ||
    tag === "svg" ||
    el.hasAttribute("src")
  ) {
    return {
      type: "box",
      width: round(rect.width),
      height: round(rect.height),
      radius: radiusPx || 6,
    };
  }

  // Circle (avatar pattern): square-ish + fully rounded.
  const minSide = Math.min(rect.width, rect.height);
  const nearlySquare = Math.abs(rect.width - rect.height) <= 4;
  if (nearlySquare && minSide > 0 && radiusPx >= minSide / 2 - 1) {
    return {
      type: "circle",
      width: round(rect.width),
      height: round(rect.height),
    };
  }

  // Text-only block
  if (isTextOnly(el)) {
    const fontSize = parsePx(style.fontSize) || 16;
    const lineHeightPx = parsePx(style.lineHeight) || fontSize * 1.4;
    return {
      type: "text",
      width: round(rect.width),
      height: Math.max(8, round(fontSize * 0.75)),
      lines: estimateLines(rect, lineHeightPx),
    };
  }

  // Container: walk children
  const childEls = Array.from(el.children).slice(0, MAX_CHILDREN) as HTMLElement[];
  const serializedChildren: Descriptor[] = [];
  for (const child of childEls) {
    const d = serialize(child, depth + 1);
    if (d) serializedChildren.push(d);
  }

  if (serializedChildren.length === 0) {
    return {
      type: "box",
      width: round(rect.width),
      height: round(rect.height),
      radius: radiusPx || 4,
    };
  }

  const display = style.display;
  const isFlex = display === "flex" || display === "inline-flex";
  const isGrid = display === "grid" || display === "inline-grid";
  const flexDir = style.flexDirection;
  const direction: "row" | "column" =
    isFlex && (flexDir === "column" || flexDir === "column-reverse")
      ? "column"
      : isFlex
      ? "row"
      : isGrid
      ? "row"
      : "column";

  const gap =
    parsePx(style.rowGap) || parsePx(style.columnGap) || parsePx(style.gap) || 8;

  const justify = style.justifyContent;
  const align = style.alignItems;
  const mapJustify = (): Descriptor["justify"] => {
    if (justify === "center") return "center";
    if (justify === "flex-end" || justify === "end") return "end";
    if (justify === "space-between") return "between";
    if (justify === "flex-start" || justify === "start") return "start";
    return undefined;
  };
  const mapAlign = (): Descriptor["align"] => {
    if (align === "center") return "center";
    if (align === "flex-end" || align === "end") return "end";
    if (align === "flex-start" || align === "start") return "start";
    if (align === "stretch") return "stretch";
    return undefined;
  };

  return {
    type: "group",
    direction,
    gap,
    width: round(rect.width),
    height: round(rect.height),
    justify: mapJustify(),
    align: mapAlign(),
    children: serializedChildren,
  };
};

/**
 * Walk a real DOM subtree and produce a Descriptor that the SkeletonRenderer can replay.
 * Must only be called on the client, AFTER the real UI has mounted.
 *
 * The wrapper div Skeletonify puts around children uses `display: contents`, so this
 * helper detects that case and walks the wrapper's children instead of the wrapper itself.
 */
export function serializeDOMToDescriptor(root: HTMLElement | null): Descriptor | null {
  if (!root || typeof window === "undefined") return null;

  const rootStyle = window.getComputedStyle(root);
  if (rootStyle.display !== "contents") {
    return serialize(root, 0);
  }

  const kids = Array.from(root.children).slice(0, MAX_CHILDREN) as HTMLElement[];
  if (kids.length === 0) return null;
  if (kids.length === 1) return serialize(kids[0], 0);

  const children: Descriptor[] = [];
  for (const kid of kids) {
    const d = serialize(kid, 0);
    if (d) children.push(d);
  }
  if (children.length === 0) return null;
  if (children.length === 1) return children[0];
  return { type: "group", direction: "column", gap: 8, children };
}
