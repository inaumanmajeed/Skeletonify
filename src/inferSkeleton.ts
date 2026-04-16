import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { EMPTY_DESCRIPTOR, type Descriptor } from "./types";
import { parseClassName, type ClassInfo } from "./utils/tailwindParser";
import { SKELETONIFY_MARKER } from "./marker";

const TEXT_TAGS = new Set([
  "p", "span", "a", "h1", "h2", "h3", "h4", "h5", "h6",
  "label", "li", "strong", "em", "small", "blockquote",
]);

const IMAGE_TAGS = new Set(["img", "picture", "video"]);

interface AnyProps {
  className?: unknown;
  children?: ReactNode;
  src?: unknown;
  width?: number | string;
  height?: number | string;
}

const getProps = (el: ReactElement): AnyProps =>
  (el.props as AnyProps | null | undefined) ?? {};

const getTag = (el: ReactElement): string | null => {
  const t = el.type;
  if (typeof t === "string") return t;
  if (typeof t === "function" || (typeof t === "object" && t !== null)) {
    const withMeta = t as { displayName?: string; name?: string };
    const name = withMeta.displayName ?? withMeta.name;
    if (!name) return null;
    const lower = name.toLowerCase();
    // Next/Image and common image wrappers
    if (lower === "image" || lower === "nextimage") return "img";
  }
  return null;
};

const isSkeletonifyElement = (el: ReactElement): boolean => {
  const t = el.type as unknown;
  if (t === null || (typeof t !== "function" && typeof t !== "object")) {
    return false;
  }
  return (t as Record<symbol, unknown>)[SKELETONIFY_MARKER] === true;
};

const isFragment = (el: ReactElement): boolean => el.type === Fragment;

const hasStringChild = (children: ReactNode): boolean => {
  let found = false;
  Children.forEach(children, (c) => {
    if (typeof c === "string" || typeof c === "number") found = true;
  });
  return found;
};

const collectText = (children: ReactNode): string => {
  let out = "";
  Children.forEach(children, (c) => {
    if (typeof c === "string") out += c;
    else if (typeof c === "number") out += String(c);
  });
  return out;
};

const estimateLines = (text: string): number => {
  if (!text) return 1;
  return Math.max(1, Math.min(4, Math.ceil(text.length / 50)));
};

const isImageLike = (el: ReactElement, tag: string | null, props: AnyProps): boolean => {
  if (tag && IMAGE_TAGS.has(tag)) return true;
  return typeof props.src === "string";
};

// Flatten fragments and arrays so the inference sees a flat child list.
const flatten = (children: ReactNode, out: ReactElement[]): void => {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (isFragment(child)) {
      flatten(getProps(child).children, out);
      return;
    }
    out.push(child);
  });
};

const inferChildren = (children: ReactNode): Descriptor[] => {
  const flat: ReactElement[] = [];
  flatten(children, flat);
  const result: Descriptor[] = [];
  for (const child of flat) {
    const d = inferElement(child);
    if (d) result.push(d);
  }
  return result;
};

const inferElement = (el: ReactElement): Descriptor | null => {
  // Nested Skeletonify: treat as opaque box; do not double-skeletonize.
  if (isSkeletonifyElement(el)) {
    return { type: "box", width: "100%", height: 40, radius: 4 };
  }

  const props = getProps(el);
  const tag = getTag(el);
  const info: ClassInfo = parseClassName(props.className);

  if (isImageLike(el, tag, props)) {
    const width = info.width ?? props.width ?? "100%";
    const height = info.height ?? props.height;
    return {
      type: "box",
      width,
      height: height ?? (info.aspectRatio ? undefined : 160),
      aspectRatio: info.aspectRatio,
      radius: info.radius ?? 6,
    };
  }

  if (info.isRoundedFull) {
    const size = info.width ?? info.height ?? 40;
    return {
      type: "circle",
      width: size,
      height: info.height ?? size,
    };
  }

  const isTextTag = tag !== null && TEXT_TAGS.has(tag);
  const hasText = hasStringChild(props.children);
  if (isTextTag || (hasText && !info.isFlex && !info.isGrid)) {
    const text = collectText(props.children);
    const fontSize = info.fontSize ?? 16;
    return {
      type: "text",
      width: info.width ?? "100%",
      height: Math.round(fontSize * 0.75),
      lines: estimateLines(text),
    };
  }

  const kids = inferChildren(props.children);
  if (kids.length > 0 || info.isFlex || info.isGrid) {
    const gap =
      info.gap ??
      (info.direction === "column" ? info.gapY : info.gapX) ??
      info.gapY ??
      info.gapX ??
      8;
    return {
      type: "group",
      direction: info.direction ?? (info.isGrid ? "row" : "column"),
      gap,
      padding: info.padding,
      align: info.align,
      justify: info.justify,
      width: info.width,
      height: info.height,
      children: kids,
    };
  }

  return {
    type: "box",
    width: info.width ?? "100%",
    height: info.height ?? info.minHeight ?? 16,
    radius: info.radius ?? 4,
    aspectRatio: info.aspectRatio,
  };
};

export function inferSkeleton(children: ReactNode): Descriptor {
  if (children == null || children === false || children === true) {
    return EMPTY_DESCRIPTOR;
  }
  const kids = inferChildren(children);
  if (kids.length === 0) return EMPTY_DESCRIPTOR;
  if (kids.length === 1) return kids[0];
  return { type: "group", direction: "column", gap: 8, children: kids };
}
