import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeletonify } from "./Skeletonify";

describe("<Skeletonify>", () => {
  it("renders children when not loading", () => {
    render(
      <Skeletonify loading={false}>
        <p>hello</p>
      </Skeletonify>
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders a skeleton (role=status) when loading", () => {
    render(
      <Skeletonify loading={true}>
        <p>hello</p>
      </Skeletonify>
    );
    expect(screen.queryByText("hello")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the fallback override when loading", () => {
    render(
      <Skeletonify loading={true} fallback={<p>custom</p>}>
        <p>real</p>
      </Skeletonify>
    );
    expect(screen.getByText("custom")).toBeInTheDocument();
    expect(screen.queryByText("real")).not.toBeInTheDocument();
  });

  it("marks the skeleton as busy for assistive tech", () => {
    render(
      <Skeletonify loading={true}>
        <p>hello</p>
      </Skeletonify>
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("does not double-skeletonify nested <Skeletonify> wrappers", () => {
    // Nested: outer loading=true should render a skeleton, and the inner
    // <Skeletonify> should be detected via the marker and treated as an
    // opaque box rather than walked a second time.
    render(
      <Skeletonify loading={true}>
        <div className="flex gap-2">
          <Skeletonify loading={false}>
            <span>inner</span>
          </Skeletonify>
          <span>outer</span>
        </div>
      </Skeletonify>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("switches from skeleton to real content when loading flips", () => {
    const { rerender } = render(
      <Skeletonify loading={true}>
        <p>real ui</p>
      </Skeletonify>
    );
    expect(screen.queryByText("real ui")).not.toBeInTheDocument();
    rerender(
      <Skeletonify loading={false}>
        <p>real ui</p>
      </Skeletonify>
    );
    expect(screen.getByText("real ui")).toBeInTheDocument();
  });
});
