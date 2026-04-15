import { describe, expect, it } from "vitest";
import { parseClassName } from "./tailwindParser";

describe("parseClassName", () => {
  it("returns an empty object for nullish/empty input", () => {
    expect(parseClassName(undefined)).toEqual({});
    expect(parseClassName("")).toEqual({});
    expect(parseClassName(null as unknown as string)).toEqual({});
  });

  it("parses width and height utilities", () => {
    const info = parseClassName("w-16 h-32");
    expect(info.width).toBe(64);
    expect(info.height).toBe(128);
  });

  it("parses fractional and full widths", () => {
    expect(parseClassName("w-full").width).toBe("100%");
    expect(parseClassName("w-1/2").width).toBe("50%");
  });

  it("parses flex layout classes", () => {
    const info = parseClassName("flex flex-col gap-4 items-center justify-between");
    expect(info.isFlex).toBe(true);
    expect(info.direction).toBe("column");
    expect(info.gap).toBe(16);
    expect(info.align).toBe("center");
    expect(info.justify).toBe("between");
  });

  it("defaults flex direction to row", () => {
    expect(parseClassName("flex").direction).toBe("row");
  });

  it("parses rounded-full as a circle hint", () => {
    const info = parseClassName("rounded-full w-10 h-10");
    expect(info.isRoundedFull).toBe(true);
    expect(info.width).toBe(40);
  });

  it("parses arbitrary bracket values", () => {
    expect(parseClassName("w-[73px]").width).toBe(73);
  });

  it("parses font size classes", () => {
    expect(parseClassName("text-lg").fontSize).toBe(18);
    expect(parseClassName("text-2xl").fontSize).toBe(24);
  });

  it("parses aspect ratios", () => {
    expect(parseClassName("aspect-square").aspectRatio).toBe(1);
    expect(parseClassName("aspect-video").aspectRatio).toBeCloseTo(16 / 9);
  });

  it("parses grid-cols", () => {
    const info = parseClassName("grid grid-cols-3");
    expect(info.isGrid).toBe(true);
    expect(info.gridCols).toBe(3);
  });

  it("memoizes repeat calls", () => {
    const a = parseClassName("flex gap-2 items-center");
    const b = parseClassName("flex gap-2 items-center");
    expect(a).toBe(b);
  });
});
