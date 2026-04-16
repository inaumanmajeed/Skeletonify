import { describe, expect, it, beforeEach } from "vitest";
import { serializeDOMToDescriptor } from "./serializeDOM";

// happy-dom provides a real DOM. We build small DOM trees and serialize them.

function el(tag: string, styles: Record<string, string> = {}, children: HTMLElement[] = []): HTMLElement {
  const node = document.createElement(tag);
  Object.assign(node.style, styles);
  for (const child of children) node.appendChild(child);
  return node;
}

function textNode(tag: string, text: string, styles: Record<string, string> = {}): HTMLElement {
  const node = el(tag, styles);
  node.textContent = text;
  return node;
}

// happy-dom returns 0x0 for getBoundingClientRect by default.
// Patch it so the serializer doesn't skip nodes.
function mockRect(node: HTMLElement, w: number, h: number): void {
  node.getBoundingClientRect = () => ({
    x: 0, y: 0, top: 0, left: 0, right: w, bottom: h,
    width: w, height: h, toJSON() { return this; },
  });
}

function setupTree(root: HTMLElement): void {
  document.body.appendChild(root);
  // Recursively mock rects so nothing is skipped
  const walk = (el: HTMLElement, w: number, h: number) => {
    mockRect(el, w, h);
    Array.from(el.children).forEach((c, i) => {
      if (c instanceof HTMLElement) walk(c, w, Math.max(20, h - 10));
    });
  };
  walk(root, 300, 200);
}

describe("serializeDOMToDescriptor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns null for null input", () => {
    expect(serializeDOMToDescriptor(null)).toBeNull();
  });

  it("serializes a simple div as a box", () => {
    const root = el("div");
    setupTree(root);
    const d = serializeDOMToDescriptor(root);
    expect(d).not.toBeNull();
    expect(d!.type).toBe("box");
    expect(d!.width).toBe(300);
  });

  it("detects text-only elements", () => {
    const root = textNode("p", "Hello world", { fontSize: "16px", lineHeight: "24px" });
    setupTree(root);
    const d = serializeDOMToDescriptor(root);
    expect(d).not.toBeNull();
    expect(d!.type).toBe("text");
    expect(d!.lines).toBeGreaterThanOrEqual(1);
  });

  it("detects img tags as boxes", () => {
    const img = el("img");
    img.setAttribute("src", "test.png");
    setupTree(img);
    const d = serializeDOMToDescriptor(img);
    expect(d).not.toBeNull();
    expect(d!.type).toBe("box");
  });

  it("detects circles (square element with large border-radius)", () => {
    const avatar = el("div", { borderTopLeftRadius: "50px", width: "40px", height: "40px" });
    mockRect(avatar, 40, 40);
    document.body.appendChild(avatar);
    const d = serializeDOMToDescriptor(avatar);
    expect(d).not.toBeNull();
    expect(d!.type).toBe("circle");
  });

  it("serializes flex containers as groups with direction", () => {
    const child1 = textNode("span", "A");
    const child2 = textNode("span", "B");
    const container = el("div", { display: "flex", flexDirection: "row", gap: "12px" }, [child1, child2]);
    setupTree(container);
    const d = serializeDOMToDescriptor(container);
    expect(d).not.toBeNull();
    expect(d!.type).toBe("group");
    expect(d!.direction).toBe("row");
    expect(d!.children?.length).toBe(2);
  });

  it("serializes flex-col containers correctly", () => {
    const child1 = textNode("p", "Line 1");
    const child2 = textNode("p", "Line 2");
    const container = el("div", { display: "flex", flexDirection: "column" }, [child1, child2]);
    setupTree(container);
    const d = serializeDOMToDescriptor(container);
    expect(d!.direction).toBe("column");
  });

  it("respects MAX_DEPTH by returning box at boundary", () => {
    // Build a deeply nested chain (depth > 8)
    let node = textNode("span", "deep");
    for (let i = 0; i < 12; i++) {
      node = el("div", {}, [node]);
    }
    setupTree(node);
    const d = serializeDOMToDescriptor(node);
    expect(d).not.toBeNull();
    // The tree should be truncated, not crash
  });

  it("respects MAX_CHILDREN by capping child count", () => {
    const kids = Array.from({ length: 25 }, (_, i) => textNode("span", `child ${i}`));
    const container = el("div", { display: "flex" }, kids);
    setupTree(container);
    const d = serializeDOMToDescriptor(container);
    expect(d).not.toBeNull();
    // MAX_CHILDREN = 16, so children array should be capped
    expect(d!.children!.length).toBeLessThanOrEqual(16);
  });

  it("handles display:contents wrapper by walking children", () => {
    const inner = textNode("p", "Content");
    const wrapper = el("div", { display: "contents" }, [inner]);
    // For the inner child, mock a real rect
    mockRect(inner, 200, 30);
    document.body.appendChild(wrapper);
    const d = serializeDOMToDescriptor(wrapper);
    expect(d).not.toBeNull();
    expect(d!.type).toBe("text");
  });

  it("skips hidden elements (display:none)", () => {
    const hidden = el("div", { display: "none" });
    mockRect(hidden, 0, 0);
    document.body.appendChild(hidden);
    const d = serializeDOMToDescriptor(hidden);
    expect(d).toBeNull();
  });

  it("skips zero-size elements", () => {
    const tiny = el("div");
    mockRect(tiny, 0, 0);
    document.body.appendChild(tiny);
    const d = serializeDOMToDescriptor(tiny);
    expect(d).toBeNull();
  });
});
