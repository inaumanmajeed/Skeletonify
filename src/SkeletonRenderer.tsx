import type { CSSProperties, JSX } from "react";
import type { Descriptor } from "./types";

const BASE = "skeletonify-shimmer";
const ROUNDED_CLASS = "skeletonify-rounded";

const sizeToCss = (v: string | number | undefined): string | undefined => {
  if (v === undefined) return undefined;
  if (typeof v === "number") return `${v}px`;
  return v;
};

const radiusToCss = (r: string | number | undefined): string | undefined => {
  if (r === undefined) return undefined;
  return typeof r === "number" ? `${r}px` : r;
};

const boxStyle = (d: Descriptor): CSSProperties => ({
  width: sizeToCss(d.width) ?? "100%",
  height: d.aspectRatio ? undefined : sizeToCss(d.height),
  aspectRatio: d.aspectRatio,
  borderRadius: radiusToCss(d.radius),
});

const flexJustify = (j: Descriptor["justify"]): CSSProperties["justifyContent"] => {
  switch (j) {
    case "center": return "center";
    case "end": return "flex-end";
    case "between": return "space-between";
    case "start": return "flex-start";
    default: return undefined;
  }
};

const flexAlign = (a: Descriptor["align"]): CSSProperties["alignItems"] => {
  switch (a) {
    case "center": return "center";
    case "end": return "flex-end";
    case "start": return "flex-start";
    case "stretch": return "stretch";
    default: return undefined;
  }
};

function renderText(d: Descriptor, key: number | string): JSX.Element {
  const lines = d.lines ?? 2;
  const height = sizeToCss(d.height) ?? "12px";
  const rows: JSX.Element[] = [];
  for (let i = 0; i < lines; i++) {
    const isLast = i === lines - 1 && lines > 1;
    rows.push(
      <div
        key={i}
        className={`${BASE} ${ROUNDED_CLASS}`}
        style={{
          width: isLast ? "60%" : (sizeToCss(d.width) ?? "100%"),
          height,
        }}
      />
    );
  }
  return (
    <div
      key={key}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: sizeToCss(d.width) ?? "100%",
      }}
    >
      {rows}
    </div>
  );
}

function renderCircle(d: Descriptor, key: number | string): JSX.Element {
  const size = sizeToCss(d.width) ?? sizeToCss(d.height) ?? "40px";
  return (
    <div
      key={key}
      className={BASE}
      style={{
        width: size,
        height: sizeToCss(d.height) ?? size,
        borderRadius: "9999px",
        flexShrink: 0,
      }}
    />
  );
}

function renderBox(d: Descriptor, key: number | string): JSX.Element {
  return (
    <div
      key={key}
      className={`${BASE} ${ROUNDED_CLASS}`}
      style={boxStyle(d)}
    />
  );
}

function renderGroup(d: Descriptor, key: number | string): JSX.Element {
  const style: CSSProperties = {
    display: "flex",
    flexDirection: d.direction === "row" ? "row" : "column",
    gap: d.gap ?? 8,
    padding: d.padding,
    alignItems: flexAlign(d.align) ?? (d.direction === "row" ? "center" : undefined),
    justifyContent: flexJustify(d.justify),
    width: sizeToCss(d.width) ?? "100%",
    height: sizeToCss(d.height),
  };
  const kids = d.children ?? [];
  return (
    <div key={key} style={style}>
      {kids.map((c, i) => renderDescriptor(c, i))}
    </div>
  );
}

function renderDescriptor(d: Descriptor, key: number | string): JSX.Element {
  switch (d.type) {
    case "text": return renderText(d, key);
    case "circle": return renderCircle(d, key);
    case "group": return renderGroup(d, key);
    case "box":
    default: return renderBox(d, key);
  }
}

export interface SkeletonRendererProps {
  descriptor: Descriptor;
  className?: string;
}

export function SkeletonRenderer({ descriptor, className }: SkeletonRendererProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      role="status"
      className={className}
      style={{ width: "100%", contain: "layout style" }}
    >
      {renderDescriptor(descriptor, "root")}
      <StyleOnce />
    </div>
  );
}

// Inject a tiny stylesheet once per document. SSR-safe: the <style> tag is
// rendered as part of the tree, so hydration sees the same output on server
// and client. Multiple instances deduplicate via the data attribute.
function StyleOnce(): JSX.Element {
  return (
    <style
      data-skeletonify=""
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: STYLES }}
    />
  );
}

const STYLES = `
.skeletonify-shimmer {
  background-color: #e5e7eb;
  background-image: linear-gradient(
    90deg,
    rgba(255,255,255,0) 0%,
    rgba(255,255,255,0.6) 50%,
    rgba(255,255,255,0) 100%
  );
  background-size: 200% 100%;
  background-repeat: no-repeat;
  animation: skeletonify-shimmer 1.4s ease-in-out infinite;
  display: block;
}
.skeletonify-rounded { border-radius: 4px; }
@media (prefers-color-scheme: dark) {
  .skeletonify-shimmer {
    background-color: #374151;
    background-image: linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.08) 50%,
      rgba(255,255,255,0) 100%
    );
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeletonify-shimmer { animation: none; }
}
@keyframes skeletonify-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;
