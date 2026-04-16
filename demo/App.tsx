import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  Skeletonify,
  SkeletonRenderer,
  clearSkeletonCache,
  hasCached,
  registerBuildDescriptors,
  hasBuildDescriptors,
  clearBuildDescriptors,
} from "../src";
import type { Descriptor } from "../src/types";

// ---------------------------------------------------------------------------
// Demo components
// ---------------------------------------------------------------------------

function ProfileCard() {
  return (
    <div className="flex flex-col gap-5 p-6 w-full rounded-2xl bg-white/5 border border-white/10">
      <div className="flex gap-4 items-center">
        <img src="https://i.pravatar.cc/120?img=47" className="w-16 h-16 rounded-full" alt="" />
        <div className="flex flex-col gap-2">
          <h2 className="text-xl text-white font-semibold">Ada Lovelace</h2>
          <span className="text-sm text-white/60">Staff Engineer at Analytical Engines</span>
        </div>
      </div>
      <p className="text-base text-white/80 leading-relaxed">
        Building the future of computation, one punched card at a time.
      </p>
      <div className="flex gap-3">
        <button className="w-28 h-10 rounded-lg bg-white text-black text-sm font-medium">Follow</button>
        <button className="w-28 h-10 rounded-lg border border-white/20 text-white text-sm font-medium">Message</button>
      </div>
    </div>
  );
}

function DashboardCard() {
  return (
    <div className="flex flex-col gap-4 p-6 w-full h-64 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/60">Monthly Revenue</span>
        <span className="text-xs text-emerald-400">+12.4%</span>
      </div>
      <h3 className="text-4xl text-white font-semibold">$84,203</h3>
      <div className="flex gap-2 items-end h-20 w-full">
        {[40, 65, 45, 80, 55, 95, 70, 88, 60, 100, 75, 90].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-violet-500/40 to-violet-400/80" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function FeedItem({ idx }: { idx: number }) {
  return (
    <div className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/10">
      <img src={`https://i.pravatar.cc/80?img=${10 + idx}`} className="w-10 h-10 rounded-full" alt="" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-white font-medium">User {idx + 1}</span>
          <span className="text-xs text-white/40">2h ago</span>
        </div>
        <p className="text-sm text-white/70">This is a sample post demonstrating the feed skeleton layout.</p>
        <img src={`https://picsum.photos/seed/${idx}/400/200`} className="w-full h-40 rounded-lg" alt="" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pre-built L3 descriptors (these would come from skeletonify-generate CLI)
// ---------------------------------------------------------------------------

const L3_PROFILE: Descriptor = {
  type: "group", direction: "column", gap: 20, padding: 24, width: "100%",
  children: [
    { type: "group", direction: "row", gap: 16, align: "center", children: [
      { type: "circle", width: 64, height: 64 },
      { type: "group", direction: "column", gap: 8, children: [
        { type: "text", width: "80%", height: 15, lines: 1 },
        { type: "text", width: "60%", height: 11, lines: 1 },
      ]},
    ]},
    { type: "text", width: "100%", height: 12, lines: 2 },
    { type: "group", direction: "row", gap: 12, children: [
      { type: "box", width: 112, height: 40, radius: 8 },
      { type: "box", width: 112, height: 40, radius: 8 },
    ]},
  ],
};

const L3_DASHBOARD: Descriptor = {
  type: "group", direction: "column", gap: 16, padding: 24, width: "100%", height: 256,
  children: [
    { type: "group", direction: "row", justify: "between", align: "center", children: [
      { type: "text", width: "40%", height: 11, lines: 1 },
      { type: "text", width: 40, height: 9, lines: 1 },
    ]},
    { type: "text", width: "50%", height: 27, lines: 1 },
    { type: "box", width: "100%", height: 80, radius: 4 },
  ],
};

const L3_FEED: Descriptor = {
  type: "group", direction: "column", gap: 12, width: "100%",
  children: Array.from({ length: 3 }, () => ({
    type: "group" as const, direction: "row" as const, gap: 16, padding: 16, width: "100%",
    children: [
      { type: "circle" as const, width: 40, height: 40 },
      { type: "group" as const, direction: "column" as const, gap: 8, width: "100%",
        children: [
          { type: "group" as const, direction: "row" as const, gap: 8, children: [
            { type: "text" as const, width: 80, height: 11, lines: 1 },
            { type: "text" as const, width: 40, height: 9, lines: 1 },
          ]},
          { type: "text" as const, width: "90%", height: 11, lines: 1 },
          { type: "box" as const, width: "100%", height: 160, radius: 8 },
        ],
      },
    ],
  })),
};

const BUILD_MAP: Record<string, () => Promise<{ default: unknown }>> = {
  "ProfileCard": async () => ({ default: L3_PROFILE }),
  "DashboardCard": async () => ({ default: L3_DASHBOARD }),
  "FeedItem": async () => ({ default: L3_FEED }),
};

// ---------------------------------------------------------------------------
// Tier indicator badge
// ---------------------------------------------------------------------------

type Tier = "L1" | "L2" | "L3" | "real";
const TIER_COLORS: Record<Tier, string> = {
  L1: "text-violet-400 border-violet-400/30",
  L2: "text-blue-400 border-blue-400/30",
  L3: "text-emerald-400 border-emerald-400/30",
  real: "text-white/40 border-white/10",
};
const TIER_LABELS: Record<Tier, string> = {
  L1: "L1 Heuristic",
  L2: "L2 Learned",
  L3: "L3 Pre-built",
  real: "Real UI",
};

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest border ${TIER_COLORS[tier]}`}>
      {TIER_LABELS[tier]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Demo panel
// ---------------------------------------------------------------------------

function DemoCard({
  title,
  loading,
  tier,
  skeletonId,
  children,
}: {
  title: string;
  loading: boolean;
  tier: Tier;
  skeletonId?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70 font-medium">{title}</span>
        <TierBadge tier={loading ? tier : "real"} />
      </div>
      <Skeletonify loading={loading} id={skeletonId}>
        {children}
      </Skeletonify>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  const [loading, setLoading] = useState(true);
  const [l3Enabled, setL3Enabled] = useState(false);
  const [cycles, setCycles] = useState(0);

  const tier: Tier = l3Enabled ? "L3" : cycles > 0 && hasCached("ProfileCard") ? "L2" : "L1";

  const toggleL3 = useCallback(async () => {
    if (!l3Enabled) {
      await registerBuildDescriptors(BUILD_MAP);
      setL3Enabled(true);
    } else {
      clearBuildDescriptors();
      setL3Enabled(false);
    }
  }, [l3Enabled]);

  const reload = () => {
    setLoading(true);
    setCycles((c) => c + 1);
  };

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, [loading, cycles]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased selection:bg-violet-500/40">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* HERO */}
        <section className="flex flex-col items-center text-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] uppercase tracking-widest text-white/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            v0.3 · L1 heuristic · L2 learning · L3 build-time
          </div>
          <img src="/favicon.svg" alt="Skeletonify" width="64" height="64" className="animate-[fadeUp_0.6s_ease-out]" />
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent animate-[fadeUp_0.8s_ease-out]">
            Skeletonify
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed">
            Skeleton UIs that generate themselves, learn from your components,
            and get perfect at build time.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <code className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 font-mono">
              npm i @inaumanmajeed/skeletonify
            </code>
          </div>
        </section>

        {/* CONTROL STRIP */}
        <section className="mt-20 flex flex-col items-center gap-4">
          <p className="text-xs uppercase tracking-widest text-white/40">Interactive playground</p>

          <div className="flex items-center gap-3">
            <TogglePill active={loading} label="Loading" onToggle={() => setLoading(!loading)} />
            <button onClick={reload} className="px-4 py-2 rounded-full text-sm text-white/60 hover:text-white border border-white/10 hover:bg-white/5 transition">
              Reload cycle
            </button>
            <button
              onClick={toggleL3}
              className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                l3Enabled
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "text-white/60 border-white/10 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l3Enabled ? "L3 ON" : "Enable L3"}
            </button>
            <button
              onClick={() => { clearSkeletonCache(); clearBuildDescriptors(); setL3Enabled(false); setCycles(0); setLoading(true); }}
              className="px-4 py-2 rounded-full text-sm text-white/40 hover:text-white border border-white/10 hover:bg-white/5 transition"
            >
              Reset all
            </button>
          </div>

          <div className="flex items-center gap-6 mt-2">
            <TierBadge tier={tier} />
            <span className="text-xs text-white/40">
              {tier === "L1" && "Heuristic inference from JSX + Tailwind classes"}
              {tier === "L2" && "Learned from real DOM after first render"}
              {tier === "L3" && "Pre-generated at build time — pixel-perfect from first paint"}
            </span>
          </div>
        </section>

        {/* COMPONENT GRID */}
        <section className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
          <DemoCard title="Profile Card" loading={loading} tier={tier} skeletonId="ProfileCard">
            <ProfileCard />
          </DemoCard>

          <DemoCard title="Dashboard" loading={loading} tier={tier} skeletonId="DashboardCard">
            <DashboardCard />
          </DemoCard>

          <div className="md:col-span-2">
            <DemoCard title="Social Feed" loading={loading} tier={tier} skeletonId="FeedItem">
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => <FeedItem key={i} idx={i} />)}
              </div>
            </DemoCard>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-32">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-xs uppercase tracking-widest text-white/40">Three layers, zero config</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">How Skeletonify thinks</h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tier: "L1" as Tier,
                title: "Instant",
                desc: "Reads your JSX and Tailwind classes at render time. Works on first load, zero config.",
                detail: "inferSkeleton(children)",
              },
              {
                tier: "L2" as Tier,
                title: "Learns",
                desc: "After your real UI paints, observes the DOM on idle and caches the result. Next load is sharper.",
                detail: "requestIdleCallback + localStorage",
              },
              {
                tier: "L3" as Tier,
                title: "Perfect",
                desc: "Pre-generate descriptors at build time. First load is pixel-accurate. One CLI command.",
                detail: "npx skeletonify-generate src/",
              },
            ].map((layer) => (
              <div key={layer.tier} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
                <TierBadge tier={layer.tier} />
                <h3 className="text-xl font-semibold text-white">{layer.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{layer.desc}</p>
                <code className="text-xs text-white/30 font-mono">{layer.detail}</code>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARISON */}
        <section className="mt-32">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-xs uppercase tracking-widest text-white/40">Without vs With</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">The difference is obvious.</h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-xs uppercase tracking-widest text-white/50">without skeletonify</span>
              </div>
              <div className="flex items-center justify-center h-72 rounded-xl border border-dashed border-white/10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                  <span className="text-sm text-white/40">Loading...</span>
                </div>
              </div>
            </div>

            <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 ring-1 ring-violet-500/30">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs uppercase tracking-widest text-white/50">with skeletonify</span>
              </div>
              <div className="h-72 overflow-hidden">
                <Skeletonify loading={true}><ProfileCard /></Skeletonify>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { k: "~5KB", v: "gzipped" },
            { k: "0", v: "DOM measurements" },
            { k: "3", v: "intelligence layers" },
            { k: "SSR", v: "safe by default" },
          ].map((s, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="text-3xl font-semibold text-white">{s.k}</div>
              <div className="text-sm text-white/50 mt-1">{s.v}</div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="mt-32 text-center flex flex-col items-center gap-6">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">Stop writing skeletons.</h2>
          <p className="text-white/50 max-w-xl">Wrap it once. It gets smarter over time. Or make it perfect with one command.</p>
          <code className="px-5 py-3 rounded-lg bg-white/5 border border-white/10 text-base text-white/80 font-mono">
            npm i @inaumanmajeed/skeletonify
          </code>
        </section>

        <footer className="mt-24 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          MIT · React 18+ · Next.js / Vite / Remix
        </footer>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function TogglePill({ active, label, onToggle }: { active: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative px-5 py-2 rounded-full text-sm font-medium transition border ${
        active ? "bg-white text-black border-white" : "text-white/60 border-white/10 hover:bg-white/5 hover:text-white"
      }`}
    >
      {active ? `${label} ON` : `${label} OFF`}
    </button>
  );
}
