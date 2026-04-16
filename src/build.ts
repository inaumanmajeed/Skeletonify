// Optional L3 build-time descriptor loader.
// This module is the ONLY integration point between the CLI-generated
// descriptors and the runtime. It:
//   - holds an in-memory registry of pre-loaded descriptors
//   - provides sync reads for the render path (no async in render)
//   - is completely inert if never called (zero cost)

import type { Descriptor } from "./types";

type DescriptorLoader = () => Promise<{ default: unknown }>;
type SkeletonMap = Record<string, DescriptorLoader>;
type NamesMap = Record<string, string>;

const registry = new Map<string, Descriptor>();
let pending: Promise<void> | null = null;

/**
 * Register pre-generated descriptors from a skeleton map.
 * Safe to call multiple times (idempotent) and during HMR — concurrent
 * calls are coalesced, and the registry is overwritten, not appended.
 *
 * ```ts
 * import { registerBuildDescriptors } from "@inaumanmajeed/skeletonify";
 * import { skeletonMap } from "./.skeletonify/skeletonMap";
 * registerBuildDescriptors(skeletonMap);
 * ```
 */
export async function registerBuildDescriptors(
  map: SkeletonMap,
  names?: NamesMap
): Promise<void> {
  // Coalesce concurrent calls — only the latest one wins.
  const thisCall = (async () => {
    const entries = Object.entries(map);
    await Promise.allSettled(
      entries.map(async ([key, loader]) => {
        const mod = await loader();
        // Guard: if a newer call started, don't write stale data.
        if (pending !== thisCall) return;
        registry.set(key, mod.default as Descriptor);
        if (names) {
          for (const [shortName, fullKey] of Object.entries(names)) {
            if (fullKey === key) registry.set(shortName, mod.default as Descriptor);
          }
        }
      })
    );
  })();
  pending = thisCall;
  await thisCall;
}

/**
 * Synchronous read used by the render path.
 * Returns null if no build-time descriptor is registered for this id.
 */
export function getBuildDescriptor(id: string): Descriptor | null {
  return registry.get(id) ?? null;
}

/**
 * Check if any build-time descriptors are registered.
 */
export function hasBuildDescriptors(): boolean {
  return registry.size > 0;
}

/**
 * Clear all registered descriptors.
 */
export function clearBuildDescriptors(): void {
  registry.clear();
}
