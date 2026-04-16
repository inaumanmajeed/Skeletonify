const SPACING: Record<string, number> = {
  "0": 0, "px": 1, "0.5": 2, "1": 4, "1.5": 6, "2": 8, "2.5": 10,
  "3": 12, "3.5": 14, "4": 16, "5": 20, "6": 24, "7": 28, "8": 32,
  "9": 36, "10": 40, "11": 44, "12": 48, "14": 56, "16": 64, "20": 80,
  "24": 96, "28": 112, "32": 128, "36": 144, "40": 160, "44": 176,
  "48": 192, "52": 208, "56": 224, "60": 240, "64": 256, "72": 288,
  "80": 320, "96": 384,
};

const FRACTIONAL: Record<string, string> = {
  full: "100%", auto: "auto", screen: "100vw",
  "1/2": "50%", "1/3": "33.3333%", "2/3": "66.6666%",
  "1/4": "25%", "3/4": "75%", "1/5": "20%", "4/5": "80%",
};

const FONT_SIZE: Record<string, number> = {
  xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
  "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48, "6xl": 60,
};

const RADIUS: Record<string, string | number> = {
  none: 0, sm: 2, "": 4, md: 6, lg: 8, xl: 12,
  "2xl": 16, "3xl": 24, full: "9999px",
};

export interface ClassInfo {
  width?: string | number;
  height?: string | number;
  minHeight?: string | number;
  aspectRatio?: number;
  radius?: string | number;
  fontSize?: number;
  isFlex?: boolean;
  direction?: "row" | "column";
  gap?: number;
  gapY?: number;
  gapX?: number;
  padding?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  isRoundedFull?: boolean;
  isGrid?: boolean;
  gridCols?: number;
}

const sizeValue = (raw: string): string | number | undefined => {
  if (raw in FRACTIONAL) return FRACTIONAL[raw];
  if (raw in SPACING) return SPACING[raw];
  const bracket = /^\[(.+)\]$/.exec(raw);
  if (bracket) {
    const v = bracket[1];
    const num = parseFloat(v);
    if (!Number.isNaN(num) && /^\d+(\.\d+)?(px)?$/.test(v)) return num;
    return v;
  }
  return undefined;
};

export function parseClassName(className: string): ClassInfo {
  const info: ClassInfo = {};
  if (!className) return info;

  for (const token of className.split(/\s+/)) {
    if (!token) continue;

    if (token === "flex") { info.isFlex = true; continue; }
    if (token === "flex-row") { info.isFlex = true; info.direction = "row"; continue; }
    if (token === "flex-col") { info.isFlex = true; info.direction = "column"; continue; }
    if (token === "inline-flex") { info.isFlex = true; continue; }
    if (token === "grid") { info.isGrid = true; continue; }
    const gridCols = /^grid-cols-(\d+)$/.exec(token);
    if (gridCols) { info.isGrid = true; info.gridCols = parseInt(gridCols[1], 10); continue; }
    if (token === "rounded-full") { info.isRoundedFull = true; info.radius = "9999px"; continue; }
    const rounded = /^rounded(?:-(.+))?$/.exec(token);
    if (rounded) { const key = rounded[1] ?? ""; if (key in RADIUS) info.radius = RADIUS[key]; continue; }
    const w = /^w-(.+)$/.exec(token);
    if (w) { const v = sizeValue(w[1]); if (v !== undefined) info.width = v; continue; }
    const h = /^h-(.+)$/.exec(token);
    if (h) { const v = sizeValue(h[1]); if (v !== undefined) info.height = v; continue; }
    const minH = /^min-h-(.+)$/.exec(token);
    if (minH) { const v = sizeValue(minH[1]); if (v !== undefined) info.minHeight = v; continue; }
    const size = /^size-(.+)$/.exec(token);
    if (size) { const v = sizeValue(size[1]); if (v !== undefined) { info.width = v; info.height = v; } continue; }
    if (token === "aspect-square") { info.aspectRatio = 1; continue; }
    if (token === "aspect-video") { info.aspectRatio = 16 / 9; continue; }
    const aspectArb = /^aspect-\[(\d+)\/(\d+)\]$/.exec(token);
    if (aspectArb) { info.aspectRatio = parseInt(aspectArb[1], 10) / parseInt(aspectArb[2], 10); continue; }
    const gap = /^gap-(.+)$/.exec(token);
    if (gap && gap[1] in SPACING) { info.gap = SPACING[gap[1]]; continue; }
    const gapY = /^gap-y-(.+)$/.exec(token);
    if (gapY && gapY[1] in SPACING) { info.gapY = SPACING[gapY[1]]; continue; }
    const gapX = /^gap-x-(.+)$/.exec(token);
    if (gapX && gapX[1] in SPACING) { info.gapX = SPACING[gapX[1]]; continue; }
    const spaceY = /^space-y-(.+)$/.exec(token);
    if (spaceY && spaceY[1] in SPACING) { info.gapY = SPACING[spaceY[1]]; continue; }
    const spaceX = /^space-x-(.+)$/.exec(token);
    if (spaceX && spaceX[1] in SPACING) { info.gapX = SPACING[spaceX[1]]; continue; }
    const p = /^p-(.+)$/.exec(token);
    if (p && p[1] in SPACING) { info.padding = SPACING[p[1]]; continue; }
    const text = /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)$/.exec(token);
    if (text) { info.fontSize = FONT_SIZE[text[1]]; continue; }
    if (token === "items-start") info.align = "start";
    else if (token === "items-center") info.align = "center";
    else if (token === "items-end") info.align = "end";
    else if (token === "items-stretch") info.align = "stretch";
    else if (token === "justify-start") info.justify = "start";
    else if (token === "justify-center") info.justify = "center";
    else if (token === "justify-end") info.justify = "end";
    else if (token === "justify-between") info.justify = "between";
  }

  if (info.isFlex && !info.direction) info.direction = "row";
  return info;
}
