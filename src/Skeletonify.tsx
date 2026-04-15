import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { inferSkeleton } from "./inferSkeleton";
import { SkeletonRenderer } from "./SkeletonRenderer";
import { SKELETONIFY_MARKER } from "./marker";
import { getCached, setCached } from "./cache";
import { inferIdentity } from "./identity";
import { serializeDOMToDescriptor } from "./serializeDOM";
import type { Descriptor } from "./types";

export interface SkeletonifyProps {
  /** When true, render the inferred (or learned) skeleton instead of children. */
  loading: boolean;
  /** The real UI. Inference walks this tree to build the skeleton. */
  children?: ReactNode;
  /** Optional fully-manual override. When provided, bypasses inference and learning. */
  fallback?: ReactNode;
  /** Optional className applied to the skeleton wrapper only. */
  className?: string;
  /** Stable identifier used by the L2 learning cache. Inferred automatically when omitted. */
  id?: string;
  /** Disable L2 DOM observation for this instance. Defaults to `true`. */
  learn?: boolean;
}

// Module-level flag that flips the first time any Skeletonify instance commits.
// While false, we treat the current render as "possibly hydration" and always use
// L1, which guarantees the server and first client paint emit identical markup.
// Once flipped, subsequent loading sessions may be served from the L2 cache.
let globalHydrated = false;

type IdleHandle = number;

const scheduleIdle = (cb: () => void): IdleHandle => {
  if (typeof window === "undefined") return 0;
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === "function") {
    return w.requestIdleCallback(cb, { timeout: 500 });
  }
  return window.setTimeout(cb, 1) as unknown as IdleHandle;
};

const cancelIdle = (handle: IdleHandle): void => {
  if (typeof window === "undefined" || !handle) return;
  const w = window as Window & { cancelIdleCallback?: (h: number) => void };
  if (typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(handle);
  else window.clearTimeout(handle as unknown as number);
};

const CONTENTS_STYLE: CSSProperties = { display: "contents" };

export function Skeletonify({
  loading,
  children,
  fallback,
  className,
  id,
  learn = true,
}: SkeletonifyProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const descriptorRef = useRef<Descriptor | null>(null);
  const prevLoadingRef = useRef<boolean>(loading);

  // L1 heuristic — pure, sync, SSR-safe. Only computed when actually needed.
  const heuristicDescriptor = useMemo<Descriptor | null>(
    () => (loading && fallback === undefined ? inferSkeleton(children) : null),
    [loading, fallback, children]
  );

  // Stable cache key: explicit prop > inferred component name > structural hash.
  const componentId = useMemo<string>(() => {
    if (id) return id;
    const basis = heuristicDescriptor ?? inferSkeleton(children);
    return inferIdentity(children, basis);
  }, [id, children, heuristicDescriptor]);

  // Resolve the descriptor used for THIS render.
  // We lock it in per loading session so we never swap skeletons mid-flight (no flicker).
  let descriptor: Descriptor | null = null;
  if (loading && fallback === undefined) {
    const isNewSession = descriptorRef.current === null || !prevLoadingRef.current;
    if (isNewSession) {
      // Priority: manual fallback (handled above) > L2 cache > L1 heuristic.
      // L2 is only consulted after first hydration to guarantee SSR identity.
      const cached = globalHydrated ? getCached(componentId) : null;
      descriptorRef.current = cached ?? heuristicDescriptor;
    }
    descriptor = descriptorRef.current;
  } else {
    descriptorRef.current = null;
  }
  prevLoadingRef.current = loading;

  // Mark the client as "past hydration" after the first commit.
  useEffect(() => {
    globalHydrated = true;
  }, []);

  // L2 learning: after real UI paints, observe the DOM on idle and cache the descriptor.
  // Never runs on the skeleton path; never affects rendering.
  useEffect(() => {
    if (loading || !learn) return;
    const node = wrapperRef.current;
    if (!node) return;

    const handle = scheduleIdle(() => {
      try {
        const learned = serializeDOMToDescriptor(node);
        if (learned) setCached(componentId, learned);
      } catch {
        // learning is best-effort; never surface errors to the user
      }
    });
    return () => cancelIdle(handle);
  }, [loading, componentId, learn]);

  if (!loading) {
    return (
      <div ref={wrapperRef} style={CONTENTS_STYLE} data-skeletonify-host="">
        {children}
      </div>
    );
  }
  if (fallback !== undefined) return <>{fallback}</>;
  return <SkeletonRenderer descriptor={descriptor!} className={className} />;
}

// Marker so nested <Skeletonify> elements aren't double-processed by inference.
(Skeletonify as unknown as Record<symbol, unknown>)[SKELETONIFY_MARKER] = true;
Skeletonify.displayName = "Skeletonify";
