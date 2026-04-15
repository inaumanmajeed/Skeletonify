import { describe, expect, it } from "vitest";
import { inferSkeleton } from "./inferSkeleton";

describe("inferSkeleton", () => {
  it("returns a default box for empty children", () => {
    const d = inferSkeleton(null);
    expect(d.type).toBe("box");
  });

  it("handles undefined children", () => {
    const d = inferSkeleton(undefined);
    expect(d.type).toBe("box");
  });

  it("handles boolean children", () => {
    expect(inferSkeleton(false).type).toBe("box");
    expect(inferSkeleton(true).type).toBe("box");
  });

  it("detects text elements", () => {
    const d = inferSkeleton(<p className="text-lg">Hello world</p>);
    expect(d.type).toBe("text");
    expect(d.lines).toBeGreaterThanOrEqual(1);
  });

  it("detects circles via rounded-full", () => {
    const d = inferSkeleton(
      <div className="rounded-full w-10 h-10" />
    );
    expect(d.type).toBe("circle");
    expect(d.width).toBe(40);
  });

  it("detects images", () => {
    const d = inferSkeleton(<img src="x.png" className="w-16 h-16" alt="" />);
    expect(d.type).toBe("box");
  });

  it("detects flex containers", () => {
    const d = inferSkeleton(
      <div className="flex gap-4">
        <span>a</span>
        <span>b</span>
      </div>
    );
    expect(d.type).toBe("group");
    expect(d.direction).toBe("row");
    expect(d.children?.length).toBe(2);
  });

  it("flattens fragments", () => {
    const d = inferSkeleton(
      <>
        <p>one</p>
        <p>two</p>
      </>
    );
    expect(d.type).toBe("group");
    expect(d.children?.length).toBe(2);
  });

  it("handles arrays of elements", () => {
    const d = inferSkeleton([<p key="1">a</p>, <p key="2">b</p>]);
    expect(d.type).toBe("group");
    expect(d.children?.length).toBe(2);
  });

  it("produces a group when a flex container has only text children", () => {
    const d = inferSkeleton(
      <div className="flex flex-col gap-2">
        <h2>Title</h2>
        <p>Body</p>
      </div>
    );
    expect(d.type).toBe("group");
    expect(d.direction).toBe("column");
  });
});
