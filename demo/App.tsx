import { useEffect, useState, type ReactNode } from "react";
import { Skeletonify, clearSkeletonCache, hasCached } from "../src";

// ---------------------------------------------------------------------------
// Demo components — these are the "real" UIs that Skeletonify will skeletonify.
// All built with Tailwind so the L1 heuristic engine has plenty of signal.
// ---------------------------------------------------------------------------

function ProfileCard() {
  return (
    <div className="flex flex-col gap-5 p-6 w-full rounded-2xl bg-white/5 border border-white/10">
      <div className="flex gap-4 items-center">
        <img
          src="https://i.pravatar.cc/120?img=47"
          className="w-16 h-16 rounded-full"
          alt=""
        />
        <div className="flex flex-col gap-2">
          <h2 className="text-xl text-white font-semibold">Ada Lovelace</h2>
          <span className="text-sm text-white/60">Staff Engineer · Analytical Engines</span>
        </div>
      </div>
      <p className="text-base text-white/80 leading-relaxed">
        Building the future of computation, one punched card at a time. Previously at Babbage Labs.
      </p>
      <div className="flex gap-3">
        <button className="w-28 h-10 rounded-lg bg-white text-black text-sm font-medium">
          Follow
        </button>
        <button className="w-28 h-10 rounded-lg border border-white/20 text-white text-sm font-medium">
          Message
        </button>
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
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-violet-500/40 to-violet-400/80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function TableRowList() {
  const rows = [
    { name: "Grace Hopper", email: "grace@navy.mil", role: "Admiral", status: "Active" },
    { name: "Alan Turing", email: "alan@bletchley.uk", role: "Cryptographer", status: "Active" },
    { name: "Katherine Johnson", email: "kat@nasa.gov", role: "Mathematician", status: "Active" },
    { name: "Linus Torvalds", email: "linus@kernel.org", role: "Maintainer", status: "Active" },
  ];
  return (
    <div className="flex flex-col gap-2 w-full p-4 rounded-2xl bg-white/5 border border-white/10">
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex gap-4 items-center p-3 rounded-lg"
        >
          <img
            src={`https://i.pravatar.cc/80?img=${i + 10}`}
            className="w-10 h-10 rounded-full"
            alt=""
          />
          <div className="flex flex-col gap-1 w-64">
            <span className="text-base text-white">{row.name}</span>
            <span className="text-sm text-white/50">{row.email}</span>
          </div>
          <span className="text-sm text-white/70 w-32">{row.role}</span>
          <span className="text-sm text-emerald-400 w-20">{row.status}</span>
        </div>
      ))}
    </div>
  );
}

function BlogPost() {
  return (
    <div className="flex flex-col gap-5 p-6 w-full rounded-2xl bg-white/5 border border-white/10">
      <img
        src="https://picsum.photos/seed/sk/640/240"
        className="w-full h-40 rounded-xl"
        alt=""
      />
      <div className="flex gap-3 items-center">
        <img src="https://i.pravatar.cc/60?img=12" className="w-8 h-8 rounded-full" alt="" />
        <span className="text-sm text-white/60">Jordan Lee · 5 min read</span>
      </div>
      <h2 className="text-2xl text-white font-semibold leading-tight">
        The twin component problem is killing your design system
      </h2>
      <p className="text-base text-white/70 leading-relaxed">
        Every loading state you hand-craft is a second copy of your UI drifting out of sync.
        Here is what to do about it — and why we think the fix belongs at the wrapper, not the component.
      </p>
      <div className="flex gap-2">
        <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/80">React</span>
        <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/80">Design Systems</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Side-by-side demo panel
// ---------------------------------------------------------------------------

function DemoPanel({
  title,
  subtitle,
  loading,
  children,
}: {
  title: string;
  subtitle: string;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-lg text-white font-semibold">{title}</h3>
          <p className="text-sm text-white/50">{subtitle}</p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          {loading ? "skeleton" : "real ui"}
        </span>
      </div>
      <div className="relative">
        <div
          className="transition-opacity duration-300 ease-out"
          style={{ opacity: 1 }}
          key={String(loading)}
        >
          <Skeletonify loading={loading}>{children}</Skeletonify>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top-level App
// ---------------------------------------------------------------------------

export default function App() {
  const [loading, setLoading] = useState(true);

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
            v0.2 · L1 heuristic + L2 learning engine
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent animate-[fadeUp_0.8s_ease-out]">
            Skeletonify
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl">
            Auto-generate skeleton UI from your components.
            <br />
            <span className="text-white/40">One wrapper. Zero twin components. No config.</span>
          </p>

          <div className="flex items-center gap-3 mt-4">
            <code className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 font-mono">
              npm i skeletonify
            </code>
            <a
              href="https://github.com/"
              className="px-4 py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition"
            >
              Star on GitHub
            </a>
          </div>
        </section>

        {/* CONTROL */}
        <section className="mt-20 flex flex-col items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-white/40">
            Interactive playground
          </p>
          <LoadingToggle loading={loading} onChange={setLoading} />
          <p className="text-sm text-white/50">
            Toggle above. Watch every card react instantly. Zero flicker.
          </p>
        </section>

        {/* PLAYGROUND GRID */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10">
          <DemoPanel
            title="Profile Card"
            subtitle="avatar + header + bio + actions"
            loading={loading}
          >
            <ProfileCard />
          </DemoPanel>

          <DemoPanel
            title="Dashboard Card"
            subtitle="metric + chart"
            loading={loading}
          >
            <DashboardCard />
          </DemoPanel>

          <DemoPanel
            title="Table Row List"
            subtitle="repeated row pattern"
            loading={loading}
          >
            <TableRowList />
          </DemoPanel>

          <DemoPanel
            title="Blog Post"
            subtitle="hero image + headline + body"
            loading={loading}
          >
            <BlogPost />
          </DemoPanel>
        </section>

        {/* LEARNING MODE (L2) */}
        <section className="mt-32">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-xs uppercase tracking-widest text-emerald-400/80">
              Learning Mode · L2
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Skeletons that get smarter.
            </h2>
            <p className="text-white/50 max-w-2xl">
              First load uses the L1 heuristic. After the real UI paints, Skeletonify
              observes the DOM on idle and caches a pixel-accurate descriptor. Every
              subsequent load uses the learned version — automatically.
            </p>
          </div>

          <LearningDemo />
        </section>

        {/* COMPARISON */}
        <section className="mt-32">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-xs uppercase tracking-widest text-white/40">
              Without vs With
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              The difference is obvious.
            </h2>
            <p className="text-white/50 max-w-xl">
              Left: what your users see today. Right: what Skeletonify gives you for free.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WITHOUT */}
            <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-xs uppercase tracking-widest text-white/50">
                  without skeletonify
                </span>
              </div>
              <div className="flex items-center justify-center h-80 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                  <span className="text-sm text-white/40">Loading…</span>
                </div>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-white/50">
                <li>· Blank screen or a spinner</li>
                <li>· Or a hand-written skeleton twin that rots</li>
                <li>· Layout pops in on load</li>
              </ul>
            </div>

            {/* WITH */}
            <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 ring-1 ring-violet-500/30">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs uppercase tracking-widest text-white/50">
                  with skeletonify
                </span>
              </div>
              <div className="h-80 overflow-hidden">
                <Skeletonify loading={true}>
                  <ProfileCard />
                </Skeletonify>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-white/60">
                <li>· Skeleton matches your real layout</li>
                <li>· One source of truth — no twin component</li>
                <li>· Smooth swap, no layout shift</li>
              </ul>
            </div>
          </div>
        </section>

        {/* TECH STRIP */}
        <section className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { k: "~5KB", v: "gzipped" },
            { k: "0", v: "DOM measurements" },
            { k: "0", v: "config files" },
            { k: "SSR", v: "safe by default" },
          ].map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/10"
            >
              <div className="text-3xl font-semibold text-white">{s.k}</div>
              <div className="text-sm text-white/50 mt-1">{s.v}</div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="mt-32 text-center flex flex-col items-center gap-6">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
            Stop writing skeletons.
          </h2>
          <p className="text-white/50 max-w-xl">
            Wrap it once. Ship it everywhere. Your loading states finally stay in sync with your real UI.
          </p>
          <code className="px-5 py-3 rounded-lg bg-white/5 border border-white/10 text-base text-white/80 font-mono">
            npm i skeletonify
          </code>
        </section>

        <footer className="mt-24 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          MIT · Built for React 18+ · Works with Next.js, Vite, Remix
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

// ---------------------------------------------------------------------------
// Learning Mode demo — shows L1 on first load, L2 on subsequent loads.
// ---------------------------------------------------------------------------

function LearnedProfile() {
  return (
    <div className="flex flex-col gap-5 p-6 w-full rounded-2xl bg-white/5 border border-white/10">
      <div className="flex gap-4 items-center">
        <img
          src="https://i.pravatar.cc/120?img=23"
          className="w-20 h-20 rounded-full"
          alt=""
        />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl text-white font-semibold">Marie Curie</h2>
          <span className="text-sm text-white/60">Principal Researcher · Radium Labs</span>
        </div>
      </div>
      <p className="text-base text-white/80 leading-relaxed">
        Two Nobel Prizes, one shared workspace. Building the future of radioactivity research.
      </p>
      <div className="flex gap-3">
        <button className="w-32 h-11 rounded-lg bg-white text-black text-sm font-medium">
          Follow
        </button>
        <button className="w-32 h-11 rounded-lg border border-white/20 text-white text-sm font-medium">
          Message
        </button>
      </div>
    </div>
  );
}
LearnedProfile.displayName = "LearnedProfile";

function LearningDemo() {
  const LEARN_ID = "demo:LearnedProfile";
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [wasCached, setWasCached] = useState(false);

  // Simulate a 1.2s fetch each cycle.
  useEffect(() => {
    if (!loading) return;
    setWasCached(hasCached(LEARN_ID));
    const t = window.setTimeout(() => setLoading(false), 1200);
    return () => window.clearTimeout(t);
  }, [loading, cycle]);

  const reload = () => {
    setLoading(true);
    setCycle((c) => c + 1);
  };

  const reset = () => {
    clearSkeletonCache();
    setLoading(true);
    setCycle((c) => c + 1);
  };

  const tier = loading ? (wasCached ? "L2 learned" : "L1 heuristic") : "real ui";
  const tierColor = loading
    ? wasCached
      ? "text-emerald-400"
      : "text-violet-400"
    : "text-white/40";

  return (
    <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Control panel */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Current tier</p>
          <div className={`text-2xl font-semibold ${tierColor}`}>{tier}</div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${cycle >= 1 ? "bg-emerald-400" : "bg-white/20"}`} />
            <span className={cycle >= 1 ? "text-white/80" : ""}>First load → L1 heuristic skeleton</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${cycle >= 1 && !loading ? "bg-emerald-400" : "bg-white/20"}`} />
            <span className={cycle >= 1 && !loading ? "text-white/80" : ""}>Real UI renders → DOM observed on idle</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${wasCached ? "bg-emerald-400" : "bg-white/20"}`} />
            <span className={wasCached ? "text-white/80" : ""}>Next load → L2 learned skeleton</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={reload}
            className="flex-1 h-11 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition"
          >
            Reload
          </button>
          <button
            onClick={reset}
            className="flex-1 h-11 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition"
          >
            Clear cache
          </button>
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          Click Reload: the first loading cycle uses the L1 heuristic. After the real UI
          renders, Skeletonify captures the actual layout on idle. Click Reload again —
          the skeleton is now learned from the real DOM. Clear cache to reset.
        </p>
      </div>

      {/* Live preview */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs uppercase tracking-widest text-white/40">Live preview</span>
          <span className="text-[10px] uppercase tracking-widest text-white/30">
            cycle #{cycle + 1}
          </span>
        </div>
        <Skeletonify loading={loading} id={LEARN_ID}>
          <LearnedProfile />
        </Skeletonify>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading toggle (pill switch)
// ---------------------------------------------------------------------------

function LoadingToggle({
  loading,
  onChange,
}: {
  loading: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur">
      <button
        onClick={() => onChange(true)}
        className={`relative px-5 py-2 rounded-full text-sm font-medium transition ${
          loading ? "bg-white text-black" : "text-white/60 hover:text-white"
        }`}
      >
        Loading ON
      </button>
      <button
        onClick={() => onChange(false)}
        className={`relative px-5 py-2 rounded-full text-sm font-medium transition ${
          !loading ? "bg-white text-black" : "text-white/60 hover:text-white"
        }`}
      >
        Loading OFF
      </button>
    </div>
  );
}
