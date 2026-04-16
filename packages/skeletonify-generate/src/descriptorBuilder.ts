import type { IRNode } from "./jsxParser.js";
import { IMAGE_TAGS, TEXT_TAGS } from "./jsxParser.js";
import { parseClassName, type ClassInfo } from "./tailwindParser.js";

export interface Descriptor {
  type: "text" | "box" | "circle" | "group";
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  aspectRatio?: number;
  lines?: number;
  direction?: "row" | "column";
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  padding?: number;
  children?: Descriptor[];
}

const estimateLines = (text: string): number =>
  text ? Math.max(1, Math.min(4, Math.ceil(text.length / 50))) : 1;

function buildNode(ir: IRNode): Descriptor | null {
  if (ir.type === "text") {
    return { type: "text", width: "100%", height: 12, lines: estimateLines(ir.textContent ?? "") };
  }

  if (ir.type === "fragment") {
    const kids = ir.children.map(buildNode).filter(Boolean) as Descriptor[];
    if (kids.length === 0) return null;
    if (kids.length === 1) return kids[0];
    return { type: "group", direction: "column", gap: 8, children: kids };
  }

  const tag = ir.tag ?? "div";
  const info: ClassInfo = ir.className ? parseClassName(ir.className) : {};

  // Image
  if (IMAGE_TAGS.has(tag) || (ir.hasSrc && tag !== "script")) {
    return {
      type: "box",
      width: info.width ?? ir.propWidth ?? "100%",
      height: info.height ?? ir.propHeight ?? (info.aspectRatio ? undefined : 160),
      aspectRatio: info.aspectRatio,
      radius: info.radius ?? 6,
    };
  }

  // Next/Image
  if (tag === "image" && ir.hasSrc) {
    return {
      type: "box",
      width: info.width ?? ir.propWidth ?? "100%",
      height: info.height ?? ir.propHeight ?? 160,
      radius: info.radius ?? 6,
    };
  }

  // Circle (non-image rounded-full)
  if (info.isRoundedFull && !ir.hasSrc) {
    const size = info.width ?? info.height ?? 40;
    return { type: "circle", width: size, height: info.height ?? size };
  }

  // Text elements
  const isTextTag = TEXT_TAGS.has(tag);
  const hasTextChild = ir.children.some((c) => c.type === "text");
  if (isTextTag || (hasTextChild && !info.isFlex && !info.isGrid)) {
    const allText = ir.children.filter((c) => c.type === "text").map((c) => c.textContent ?? "").join(" ");
    const fontSize = info.fontSize ?? 16;
    return { type: "text", width: info.width ?? "100%", height: Math.round(fontSize * 0.75), lines: estimateLines(allText) };
  }

  // Component with children → treat as group so children are preserved
  if (tag === "component-group") {
    const kids = ir.children.map(buildNode).filter(Boolean) as Descriptor[];
    return {
      type: "group",
      direction: info.direction ?? "column",
      gap: info.gap ?? 8,
      width: info.width,
      height: info.height,
      children: kids.length > 0 ? kids : undefined,
    };
  }

  // Opaque component → box
  if (tag === "component") {
    return {
      type: "box",
      width: info.width ?? "100%",
      height: info.height ?? info.minHeight ?? 40,
      radius: info.radius ?? 4,
    };
  }

  // Container
  const kids = ir.children.map(buildNode).filter(Boolean) as Descriptor[];
  if (kids.length > 0 || info.isFlex || info.isGrid) {
    const gap = info.gap ?? (info.direction === "column" ? info.gapY : info.gapX) ?? info.gapY ?? info.gapX ?? 8;
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
}

const EMPTY: Descriptor = { type: "box", width: "100%", height: 16, radius: 4 };

export function buildDescriptor(ir: IRNode | null): Descriptor {
  return (ir && buildNode(ir)) ?? EMPTY;
}
