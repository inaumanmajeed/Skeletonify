// Shared symbol used to detect nested <Skeletonify> wrappers during inference,
// without creating a circular import between Skeletonify.tsx and inferSkeleton.ts.
export const SKELETONIFY_MARKER: unique symbol = Symbol.for("skeletonify.marker");
