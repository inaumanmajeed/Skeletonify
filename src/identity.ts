import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Descriptor } from "./types";

// djb2
const hashString = (s: string): string => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
};

const getChildrenOf = (el: ReactElement): ReactNode =>
  (el.props as { children?: ReactNode } | null | undefined)?.children;

const findComponentName = (children: ReactNode): string | null => {
  let found: string | null = null;
  Children.forEach(children, (child) => {
    if (found) return;
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      found = findComponentName(getChildrenOf(child));
      return;
    }
    const t = child.type;
    if (typeof t === "function" || (typeof t === "object" && t !== null)) {
      const meta = t as { displayName?: string; name?: string };
      const name = meta.displayName ?? meta.name;
      if (name && name !== "Skeletonify") {
        found = name;
      }
    }
  });
  return found;
};

/**
 * Stable identity for a wrapped subtree:
 *  1. explicit `id` prop (handled by caller)
 *  2. first component displayName/name encountered in the tree
 *  3. structural fingerprint of the L1 descriptor
 */
export function inferIdentity(children: ReactNode, descriptor: Descriptor): string {
  const name = findComponentName(children);
  if (name) return `c:${name}`;
  return `s:${hashString(JSON.stringify(descriptor))}`;
}
