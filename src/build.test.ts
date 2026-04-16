import { describe, expect, it, beforeEach } from "vitest";
import {
  registerBuildDescriptors,
  getBuildDescriptor,
  hasBuildDescriptors,
  clearBuildDescriptors,
} from "./build";
import type { Descriptor } from "./types";

const sample: Descriptor = { type: "box", width: 100, height: 40 };
const sample2: Descriptor = { type: "circle", width: 50, height: 50 };

function makeMap(entries: Record<string, Descriptor>) {
  const map: Record<string, () => Promise<{ default: unknown }>> = {};
  for (const [key, val] of Object.entries(entries)) {
    map[key] = async () => ({ default: val });
  }
  return map;
}

describe("build.ts — L3 registry", () => {
  beforeEach(() => {
    clearBuildDescriptors();
  });

  it("starts empty", () => {
    expect(hasBuildDescriptors()).toBe(false);
    expect(getBuildDescriptor("anything")).toBeNull();
  });

  it("registers and retrieves descriptors", async () => {
    await registerBuildDescriptors(makeMap({ alpha: sample }));
    expect(hasBuildDescriptors()).toBe(true);
    expect(getBuildDescriptor("alpha")).toEqual(sample);
  });

  it("returns null for unregistered keys", async () => {
    await registerBuildDescriptors(makeMap({ alpha: sample }));
    expect(getBuildDescriptor("beta")).toBeNull();
  });

  it("clears the registry", async () => {
    await registerBuildDescriptors(makeMap({ alpha: sample }));
    clearBuildDescriptors();
    expect(hasBuildDescriptors()).toBe(false);
    expect(getBuildDescriptor("alpha")).toBeNull();
  });

  it("is idempotent — double registration overwrites cleanly", async () => {
    await registerBuildDescriptors(makeMap({ alpha: sample }));
    await registerBuildDescriptors(makeMap({ alpha: sample2 }));
    expect(getBuildDescriptor("alpha")).toEqual(sample2);
  });

  it("handles empty maps", async () => {
    await registerBuildDescriptors(makeMap({}));
    expect(hasBuildDescriptors()).toBe(false);
  });

  it("registers short names via the names map", async () => {
    await registerBuildDescriptors(
      makeMap({ "components/Card/ProfileCard": sample }),
      { ProfileCard: "components/Card/ProfileCard" }
    );
    expect(getBuildDescriptor("ProfileCard")).toEqual(sample);
    expect(getBuildDescriptor("components/Card/ProfileCard")).toEqual(sample);
  });

  it("survives a loader that rejects", async () => {
    const map = {
      good: async () => ({ default: sample as unknown }),
      bad: async () => { throw new Error("network fail"); },
    };
    await registerBuildDescriptors(map);
    expect(getBuildDescriptor("good")).toEqual(sample);
    expect(getBuildDescriptor("bad")).toBeNull();
  });
});
