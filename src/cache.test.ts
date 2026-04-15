import { beforeEach, describe, expect, it } from "vitest";
import { clearSkeletonCache, getCached, hasCached, setCached } from "./cache";
import type { Descriptor } from "./types";

const sample = (w: number): Descriptor => ({
  type: "box",
  width: w,
  height: 16,
});

describe("cache", () => {
  beforeEach(() => {
    clearSkeletonCache();
  });

  it("returns null for a missing id", () => {
    expect(getCached("nope")).toBeNull();
    expect(hasCached("nope")).toBe(false);
  });

  it("stores and retrieves a descriptor", () => {
    setCached("alpha", sample(100));
    expect(getCached("alpha")).toEqual(sample(100));
    expect(hasCached("alpha")).toBe(true);
  });

  it("overwrites on repeated set", () => {
    setCached("beta", sample(100));
    setCached("beta", sample(200));
    expect(getCached("beta")).toEqual(sample(200));
  });

  it("persists to localStorage", () => {
    setCached("gamma", sample(120));
    const raw = localStorage.getItem("skeletonify:v1:gamma");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.descriptor).toEqual(sample(120));
    expect(parsed.v).toBe(1);
  });

  it("rehydrates from localStorage on a fresh get after clear in-memory", () => {
    setCached("delta", sample(99));
    // simulate a new session by wiping the in-memory map but keeping storage
    const raw = localStorage.getItem("skeletonify:v1:delta");
    clearSkeletonCache();
    expect(raw).not.toBeNull();
    localStorage.setItem("skeletonify:v1:delta", raw!);
    expect(getCached("delta")).toEqual(sample(99));
  });

  it("clearSkeletonCache wipes memory and storage", () => {
    setCached("epsilon", sample(50));
    clearSkeletonCache();
    expect(getCached("epsilon")).toBeNull();
    expect(localStorage.getItem("skeletonify:v1:epsilon")).toBeNull();
  });

  it("ignores empty ids", () => {
    setCached("", sample(1));
    expect(getCached("")).toBeNull();
    expect(hasCached("")).toBe(false);
  });
});
