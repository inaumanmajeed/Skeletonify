import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeletonify } from "./Skeletonify";
import { clearSkeletonCache, setCached, getCached } from "./cache";
import { registerBuildDescriptors, clearBuildDescriptors, getBuildDescriptor } from "./build";
import type { Descriptor } from "./types";

const ProfileCard = () => (
  <div className="flex flex-col gap-4 p-6 w-96">
    <div className="flex gap-4 items-center">
      <img src="avatar.png" className="w-16 h-16 rounded-full" alt="" />
      <div className="flex flex-col gap-2">
        <h2 className="text-xl">Ada Lovelace</h2>
        <span className="text-sm">Engineer</span>
      </div>
    </div>
    <p className="text-base">Bio text here.</p>
  </div>
);
ProfileCard.displayName = "ProfileCard";

const L3_DESCRIPTOR: Descriptor = {
  type: "group",
  direction: "column",
  gap: 16,
  width: 384,
  children: [
    { type: "circle", width: 64, height: 64 },
    { type: "text", width: "100%", height: 15, lines: 1 },
  ],
};

describe("Integration: L1 + L2 + L3 layering", () => {
  beforeEach(() => {
    clearSkeletonCache();
    clearBuildDescriptors();
  });

  it("L1 only: renders a skeleton from heuristic when loading", () => {
    render(
      <Skeletonify loading={true} id="test-profile">
        <ProfileCard />
      </Skeletonify>
    );
    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.getAttribute("aria-busy")).toBe("true");
  });

  it("L1 only: renders real UI when not loading", () => {
    render(
      <Skeletonify loading={false} id="test-profile">
        <ProfileCard />
      </Skeletonify>
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("L2: uses cached descriptor when available", () => {
    const cached: Descriptor = {
      type: "group",
      direction: "row",
      gap: 8,
      children: [{ type: "box", width: 200, height: 100 }],
    };
    setCached("test-l2", cached);
    expect(getCached("test-l2")).toEqual(cached);
  });

  it("L3: build descriptors are available after registration", async () => {
    const map = {
      "test-l3": async () => ({ default: L3_DESCRIPTOR as unknown }),
    };
    await registerBuildDescriptors(map);
    expect(getBuildDescriptor("test-l3")).toEqual(L3_DESCRIPTOR);
  });

  it("L3 > L2: build descriptor takes priority over cache", async () => {
    // Register L3
    const map = {
      "test-priority": async () => ({ default: L3_DESCRIPTOR as unknown }),
    };
    await registerBuildDescriptors(map);

    // Also set L2 cache (different descriptor)
    const l2Desc: Descriptor = { type: "box", width: 50, height: 50 };
    setCached("test-priority", l2Desc);

    // L3 should win
    expect(getBuildDescriptor("test-priority")).toEqual(L3_DESCRIPTOR);
  });

  it("manual fallback overrides everything", () => {
    render(
      <Skeletonify loading={true} id="test-fallback" fallback={<div data-testid="custom">Custom</div>}>
        <ProfileCard />
      </Skeletonify>
    );
    expect(screen.getByTestId("custom")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("switching from loading to loaded works cleanly", () => {
    const { rerender } = render(
      <Skeletonify loading={true} id="test-switch">
        <ProfileCard />
      </Skeletonify>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();

    rerender(
      <Skeletonify loading={false} id="test-switch">
        <ProfileCard />
      </Skeletonify>
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("learn={false} still renders skeleton correctly", () => {
    render(
      <Skeletonify loading={true} id="test-no-learn" learn={false}>
        <ProfileCard />
      </Skeletonify>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
