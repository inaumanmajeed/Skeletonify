<div align="center">

# Skeletonify

### Stop writing skeleton components. Wrap. Done.

**Zero-config React skeletons that match your UI — automatically.**

```jsx
<Skeletonify loading={isLoading}>
  <ProfileCard />
</Skeletonify>
```

That's the whole API.

[![CI](https://github.com/inaumanmajeed/Skeletonify/actions/workflows/ci.yml/badge.svg)](https://github.com/inaumanmajeed/Skeletonify/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/skeletonify?color=black&label=npm)](https://www.npmjs.com/package/skeletonify)
[![size](https://img.shields.io/badge/gzipped-5KB-black)](https://bundlephobia.com/package/skeletonify)
[![tests](https://img.shields.io/badge/tests-34%20passing-brightgreen)](https://github.com/inaumanmajeed/Skeletonify/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-black)](./LICENSE)
[![SSR](https://img.shields.io/badge/SSR-safe-black)](#)
[![Next.js](https://img.shields.io/badge/Next.js-ready-black)](#)

**[Live Demo](https://skeletonify.nauman.live)** · **[GitHub](https://github.com/inaumanmajeed/Skeletonify)** · **[Report a bug](https://github.com/inaumanmajeed/Skeletonify/issues)**

</div>

---

## The problem nobody talks about

You build `ProfileCard`. Then you build `ProfileCardSkeleton`.

Then `UserList`. Then `UserListSkeleton`.

Then `Dashboard`. Then `DashboardSkeleton`.

You tweak the real component — the skeleton rots.
You rename a class — the skeleton drifts.
You ship a redesign — half your skeletons are lying to your users.

This is the **twin component problem**, and every React app has it. You're maintaining two trees that say the same thing in two different languages, and one of them is always out of date.

**Skeleton UIs are a great idea with a terrible workflow.**

---

## The fix

Wrap the component. Skeletonify reads your JSX, infers the shape, and renders a matching skeleton while `loading` is `true`.

```jsx
import { Skeletonify } from "skeletonify";

export function Profile({ user, isLoading }) {
  return (
    <Skeletonify loading={isLoading}>
      <ProfileCard user={user} />
    </Skeletonify>
  );
}
```

No twin component. No config file. No plugin. No build step.

When `loading` is `false`, your real component renders. When it's `true`, Skeletonify shows a shimmering placeholder that actually resembles your layout — avatar where the avatar is, text lines where the text is, buttons where the buttons are.

Change your component tomorrow and the skeleton changes with it. Because it _is_ your component, just drawn differently.

---

## Install

```bash
npm install skeletonify
```

```bash
pnpm add skeletonify
```

```bash
yarn add skeletonify
```

No peer config. No Tailwind plugin. No provider at the root of your tree.

---

## Usage

```jsx
import { Skeletonify } from "skeletonify";

function ProfileCard({ user }) {
  return (
    <div className="flex flex-col gap-4 p-6 w-96">
      <div className="flex gap-4 items-center">
        <img src={user.avatar} className="w-16 h-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <h2 className="text-xl">{user.name}</h2>
          <span className="text-sm">{user.title}</span>
        </div>
      </div>
      <p className="text-base">{user.bio}</p>
    </div>
  );
}

export function Profile({ user, isLoading }) {
  return (
    <Skeletonify loading={isLoading}>
      <ProfileCard user={user} />
    </Skeletonify>
  );
}
```

Need a manual override for a specific subtree? `fallback` lets you hand-craft it:

```jsx
<Skeletonify loading={isLoading} fallback={<MyChartSkeleton />}>
  <Chart data={data} />
</Skeletonify>
```

---

## Features

- **Zero config.** Install, wrap, ship.
- **Zero flicker.** No hidden render, no DOM measurement, no swap. One commit — skeleton or real.
- **SSR-safe.** Pure, deterministic inference. Works in Next.js App Router out of the box. No hydration mismatches.
- **Tailwind-first.** Reads `w-*`, `h-*`, `rounded-full`, `flex`, `gap-*`, `text-*`, `aspect-*` and more.
- **Tiny.** 5KB minified+gzipped. Zero runtime dependencies.
- **Self-improving.** L1 heuristic on first load, L2 learned-from-DOM on every load after.
- **Accessible.** `aria-busy`, `role="status"`, respects `prefers-reduced-motion`.
- **Dark mode.** Respects `prefers-color-scheme` automatically.
- **Typed.** First-class TypeScript.

---

## Before / After

**Before Skeletonify** — loading state is a blank screen, a spinner, or a hand-written twin component that's three commits behind the real one:

```
┌──────────────────────────────┐
│                              │
│                              │
│       ( spinner )            │
│                              │
│                              │
└──────────────────────────────┘
```

**After Skeletonify** — the skeleton mirrors your actual layout, derived from the same JSX the user will eventually see:

```
┌──────────────────────────────┐
│  ●●●   ▄▄▄▄▄▄▄               │
│        ▄▄▄▄                  │
│                              │
│  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄      │
│  ▄▄▄▄▄▄▄▄▄▄▄▄▄               │
│                              │
│  [▄▄▄▄]  [▄▄▄▄]              │
└──────────────────────────────┘
```

Same component. Same classNames. Two renders. One source of truth.

---

## 🧠 Learning Mode (L2)

Skeletonify ships with an optional learning cache that makes your skeletons **get better every time a user loads your app**. It's on by default. No config required.

### How it feels

- **First load** → L1 heuristic skeleton (good).
- **Real UI renders** → Skeletonify observes the DOM on idle, serializes the real layout, and caches it keyed by component identity (memory + `localStorage`).
- **Every load after that** → L2 learned skeleton (pixel-accurate to the actual rendered shape).

```
┌─────────────┐   first load    ┌─────────────┐
│   L1 infer  │────────────────▶│  real UI    │
└─────────────┘                 └──────┬──────┘
                                       │  requestIdleCallback
                                       ▼
                                ┌─────────────┐
                                │  L2 cache   │  ← memory + localStorage
                                └──────┬──────┘
                                       │
                                       ▼
┌─────────────┐  second load    ┌─────────────┐
│  L2 learned │◀────────────────│   reload    │
└─────────────┘                 └─────────────┘
```

### Before / After

**Before L2 (heuristic only):** the skeleton is _plausibly_ shaped. Close, but not exact. Text lines might be the wrong length; padding might differ from your component by a few pixels.

**After L2 (learned):** the skeleton matches your actual component pixel-for-pixel, because it _is_ your actual component — just serialized into a shimmer-safe descriptor. When you redesign the component, the first load re-learns and every load after that is accurate again.

### Priority order

```
manual fallback  >  L2 learned cache  >  L1 heuristic
```

- `fallback` (if you pass one) always wins.
- Otherwise the cache is consulted by stable component ID.
- If nothing is cached (first load, cleared cache, new component), L1 handles it.

### Stable IDs

Skeletonify builds a stable cache key in three tiers:

1. **Explicit `id` prop** — most reliable, use this when you care:
   ```tsx
   <Skeletonify loading={loading} id="ProfileCard">
     <ProfileCard />
   </Skeletonify>
   ```
2. **Component displayName / name** — inferred automatically from the first real component inside the wrapper.
3. **Structural fingerprint** — hash of the L1 descriptor, as a last resort.

### Opting out

Set `learn={false}` to disable L2 for a specific wrapper. L1 still works as before.

```tsx
<Skeletonify loading={loading} learn={false}>
  <SensitiveSubtree />
</Skeletonify>
```

You can also clear the whole cache programmatically:

```ts
import { clearSkeletonCache } from "skeletonify";
clearSkeletonCache();
```

## ⚡ How it learns

Skeletonify never touches the DOM on the _skeleton_ path. Learning happens on the _real UI_ path, after React commits, scheduled on `requestIdleCallback` so it never competes with user input:

```tsx
// (simplified — this is what's happening under the hood)
useEffect(() => {
  if (loading) return;
  const handle = requestIdleCallback(() => {
    const learned = serializeDOMToDescriptor(wrapperRef.current);
    if (learned) cache.set(componentId, learned);
  });
  return () => cancelIdleCallback(handle);
}, [loading, componentId]);
```

The serializer walks the rendered subtree once (bounded depth, bounded children), reads `getBoundingClientRect` + `getComputedStyle` on each node, and emits a `Descriptor` in the exact same shape the L1 engine produces. That shared shape is why L2 can drop into the renderer without any code path changes — the rendering side of Skeletonify doesn't know or care which layer produced the descriptor.

### SSR & hydration safety

- On the server, `globalThis.localStorage` doesn't exist → only L1 runs.
- On the **first** client paint, L1 runs too — so the server and client emit byte-identical markup. No hydration warnings.
- Only after React has committed once does the L2 cache start being consulted for _new_ loading sessions.

You get zero flicker, SSR-safe rendering, and progressively-sharper skeletons — all from the same `<Skeletonify>` wrapper you were already using.

## How it works (30 seconds)

Skeletonify walks the `children` React element tree — pure, synchronous, no DOM — and applies a small set of heuristics:

- `<img>` or any `src` prop → image-shaped box
- `rounded-full` + size → circle (avatars)
- `<p>`, `<h1..h6>`, `<span>` or string children → shimmer text lines
- `flex` / `grid` → matching flex/grid container
- everything else → sensible box

No measurement. No effects. No async. Server and client produce identical output, so there's nothing to hydrate wrong.

---

## Limitations

Skeletonify is **heuristic, not pixel-perfect**. We think that's the right trade — you get 80% of the value for 0% of the effort. Be aware:

- **Best on Tailwind.** Without className hints, inference falls back to generic shapes. It still works; it just looks less specific.
- **No DOM measurement.** We will never render your component invisibly to measure it. That means tall dynamic content is estimated, not measured. Use `fallback` for the few cases that need to be exact.
- **Opaque third-party components.** Charts, canvas, iframes, and black-box widgets render as single boxes. Hand-craft with `fallback`.
- **Dynamic-shape components.** If your component renders very differently based on props, the inferred shape reflects the JSX it sees, not the final painted layout.

If you hit one of these, `fallback` is always the escape hatch:

```jsx
<Skeletonify loading={isLoading} fallback={<CustomSkeleton />}>
```

---

## Philosophy

> **We don't aim for perfect skeletons. We aim for effortless ones.**

Every React team has tried to write beautiful, hand-crafted skeletons. Every React team has watched those skeletons rot.

Skeletonify makes the easy case effortless and the hard case possible — in that order. If you want pixel-perfect, nothing beats hand-crafting with `fallback`. For everything else — the 90% of components you'll never lovingly maintain a twin for — Skeletonify gives you something that's good enough, automatically, forever.

The best skeleton is the one you don't have to write.

---

## Contributing

PRs welcome, especially:

- new Tailwind class mappings
- real-world examples we should test against
- bug reports with a minimal repro

```bash
git clone https://github.com/inaumanmajeed/Skeletonify.git
cd Skeletonify
npm install
npm run typecheck   # 0 errors
npm test            # 34 passing
npm run build       # ESM + CJS + .d.ts
npm run demo:dev    # open the interactive playground
```

Open an issue before big changes so we can align on scope. Skeletonify is intentionally small — the bar for new features is "does it keep the zero-config promise?"

---

## License

MIT — do whatever you want.

<div align="center">

**If Skeletonify saved you an afternoon, star the repo. It's the only thanks we ask for.**

</div>
