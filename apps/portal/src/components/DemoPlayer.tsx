import { useEffect, useMemo, useRef, useState } from 'react';
import {
  STAGES,
  fixtureFor,
  reelScenes,
  type Fixture,
  type Reel,
  type Scene,
} from '@/data/demo-scenes';

/**
 * /demo scene player. Job-ordered walkthrough of an idea moving through the
 * pipeline: terminal scenes replay REAL captured CLI transcripts, artifact
 * scenes quote REAL repo files, prompt scenes show only what you type (no
 * invented agent output). Two reels (sizzle / deep), two modes (auto / step).
 * Deterministic pacing — fixed delays, no randomness — so a recording of
 * ?reel=sizzle&record=1 is reproducible frame-for-frame.
 * Contract: docs/content/demo-reel-storyboard.md.
 */

const CHAR_MS = 22; // typewriter, per character
const LINE_MS = 40; // output stream, per line
const BURST_MS = 12; // long outputs (init's 153-line stamp report) burst-scroll
const BURST_THRESHOLD = 28;
const TYPE_TO_RUN_PAUSE_MS = 350; // beat between "enter" and first output line

// Auto-mode dwell after a scene finishes animating, when the scene doesn't set
// its own holdMs (terminal scenes do — they need reading time).
const DEFAULT_HOLD: Record<Scene['type'], number> = {
  title: 2600,
  terminal: 3000,
  prompt: 2200,
  artifact: 4200,
  receipts: 3200,
  stages: 2000,
  outro: 2400,
};

function useOnce(fn: () => void) {
  // Scene components fire onDone from timer chains; guard double-fires.
  const fired = useRef(false);
  return () => {
    if (fired.current) return;
    fired.current = true;
    fn();
  };
}

/** Severity tint for a transcript line — mirrors how the CLI reads in a real terminal. */
function lineTone(line: string): string {
  const t = line.trim();
  if (t.includes('⚠') || t.startsWith('!')) return 'text-amber-400';
  if (t.startsWith('✗') || t.startsWith('[BLOCK]') || t.startsWith('overall: FAIL')) return 'text-red-400';
  if (t.startsWith('✓') || t.startsWith('overall: PASS') || t.endsWith('mechanical check: PASS (no unexpected residual source strings)')) return 'text-emerald-400';
  if (t.startsWith('·') || t.startsWith('—') || t.startsWith('~')) return 'text-slate-500';
  return '';
}

function TerminalScene({ fixture, instant, onDone }: { fixture: Fixture; instant: boolean; onDone: () => void }) {
  const [typed, setTyped] = useState(instant ? fixture.command.length : 0);
  const [shown, setShown] = useState(instant ? fixture.lines.length : 0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fireDone = useOnce(onDone);
  const burst = fixture.lines.length > BURST_THRESHOLD;

  useEffect(() => {
    if (typed < fixture.command.length) {
      const t = setTimeout(() => setTyped((n) => n + 1), CHAR_MS);
      return () => clearTimeout(t);
    }
    if (shown < fixture.lines.length) {
      const delay = shown === 0 ? TYPE_TO_RUN_PAUSE_MS : burst ? BURST_MS : LINE_MS;
      const t = setTimeout(() => setShown((n) => n + 1), delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(fireDone, 150);
    return () => clearTimeout(t);
  }, [typed, shown, fixture, burst, fireDone]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const typing = typed < fixture.command.length || shown === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-[#0d1117] shadow-2xl">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-800 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[12px] text-slate-500">~/work</span>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed">
        <div className="whitespace-pre-wrap break-words text-slate-200">
          <span className="select-none text-slate-500">$ </span>
          {fixture.command.slice(0, typed)}
          {typing && <span className="demo-caret" />}
        </div>
        {fixture.lines.slice(0, shown).map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-words ${lineTone(line) || 'text-slate-300'}`}>
            {line || ' '}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * What you type in Claude Code — and ONLY that. The agent's response is the
 * artifact scene that follows; rendering invented agent chatter here would
 * break the no-fabrication rule the whole demo rests on.
 */
function PromptScene({ commands, instant, onDone }: { commands: string[]; instant: boolean; onDone: () => void }) {
  const total = commands.reduce((n, c) => n + c.length, 0);
  const [typed, setTyped] = useState(instant ? total : 0);
  const fireDone = useOnce(onDone);

  useEffect(() => {
    if (typed < total) {
      // Pause between commands: when the cursor sits at a command boundary.
      let acc = 0;
      let atBoundary = false;
      for (const c of commands.slice(0, -1)) {
        acc += c.length;
        if (typed === acc) atBoundary = true;
      }
      const t = setTimeout(() => setTyped((n) => n + 1), atBoundary ? 700 : CHAR_MS * 2);
      return () => clearTimeout(t);
    }
    const t = setTimeout(fireDone, 400);
    return () => clearTimeout(t);
  }, [typed, total, commands, fireDone]);

  // Distribute the typed-character budget across the command list.
  let remaining = typed;
  const rendered = commands.map((c) => {
    const take = Math.max(0, Math.min(c.length, remaining));
    remaining -= take;
    return { text: c.slice(0, take), started: take > 0, active: take > 0 && take < c.length };
  });
  const lastStarted = rendered.reduce((acc, r, i) => (r.started ? i : acc), 0);

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700/60 bg-[#16181d] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
          <span className="font-mono text-[12px] text-slate-500">Claude Code — your-initiative</span>
        </div>
        <div className="space-y-3 px-5 py-6 font-mono text-[15px]">
          {rendered.map((r, i) =>
            r.started || i === 0 ? (
              <div key={i} className="text-slate-100">
                <span className="select-none text-brand">&gt; </span>
                {r.text}
                {(r.active || (i === lastStarted && typed < total) || (typed === 0 && i === 0)) && <span className="demo-caret" />}
              </div>
            ) : null
          )}
        </div>
      </div>
      <p className="mt-4 font-mono text-[12px] uppercase tracking-wide text-slate-600">stages are skills — the agent runs them, the artifacts land in your repo</p>
    </div>
  );
}

/** A REAL file from the self-application, quoted with its path. Trims marked with …. */
function ArtifactScene({ path, stage, excerpt, onDone }: { path: string; stage: string; excerpt: string; onDone: () => void }) {
  const fireDone = useOnce(onDone);
  useEffect(() => {
    const t = setTimeout(fireDone, 900);
    return () => clearTimeout(t);
  }, [fireDone]);

  return (
    <div className="demo-rise flex h-full flex-col items-center justify-center">
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-[#0d1117] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-2.5">
          <span className="font-mono text-[12px] text-slate-300">{path}</span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-wide text-brand">{stage}</span>
            <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-500">real file · this repo</span>
          </span>
        </div>
        <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[12.5px] leading-relaxed text-slate-300">{excerpt}</pre>
      </div>
    </div>
  );
}

/** The sizzle's plain-language proof beat — what exists when the agent is done. */
function ReceiptsScene({ cards, onDone }: { cards: { title: string; line: string }[]; onDone: () => void }) {
  const fireDone = useOnce(onDone);
  useEffect(() => {
    const t = setTimeout(fireDone, 350 * cards.length + 700);
    return () => clearTimeout(t);
  }, [cards.length, fireDone]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <p className="demo-rise font-mono text-[12px] uppercase tracking-[0.2em] text-brand">what exists when the agent is done</p>
      <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {cards.map((c, i) => (
          <div key={c.title} className="demo-rise rounded-xl border border-slate-700/60 bg-[#0d1117] p-5" style={{ animationDelay: `${250 + i * 350}ms` }}>
            <p className="mb-2 flex items-center gap-2 font-heading text-base font-semibold text-slate-100">
              <span className="text-emerald-400">✓</span> {c.title}
            </p>
            <p className="text-sm leading-relaxed text-slate-400">{c.line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StagesScene({ instant, onDone }: { instant: boolean; onDone: () => void }) {
  const [lit, setLit] = useState(instant ? STAGES.length : 0);
  const fireDone = useOnce(onDone);

  useEffect(() => {
    if (lit >= STAGES.length) {
      const t = setTimeout(fireDone, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLit((n) => n + 1), lit === 0 ? 700 : 850);
    return () => clearTimeout(t);
  }, [lit, fireDone]);

  const current = Math.min(lit, STAGES.length) - 1;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10">
      <p className="font-mono text-[12px] uppercase tracking-wide text-brand">one pipeline · seven stages</p>
      <ol className="flex flex-wrap items-start justify-center gap-x-2 gap-y-6">
        {STAGES.map(([name], i) => {
          const on = i < lit;
          return (
            <li key={name} className="flex items-center">
              <div className="flex w-[5.5rem] flex-col items-center gap-2 sm:w-24">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border font-mono text-sm transition-all duration-300 ${
                    on
                      ? 'scale-100 border-brand bg-brand text-background'
                      : 'scale-90 border-slate-700 text-slate-600'
                  }`}
                >
                  {on ? '✓' : String(i + 1).padStart(2, '0')}
                </span>
                <span className={`text-center font-heading text-sm transition-colors duration-300 ${on ? 'text-slate-100' : 'text-slate-600'}`}>
                  {name}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <span className={`mb-7 hidden h-px w-4 transition-colors duration-300 sm:block ${i < lit - 1 ? 'bg-brand' : 'bg-slate-700'}`} />
              )}
            </li>
          );
        })}
      </ol>
      <p className="h-5 text-sm text-slate-400">{current >= 0 ? STAGES[current][1] : ' '}</p>
    </div>
  );
}

function TitleScene({ kicker, headline, sub, onDone }: { kicker?: string; headline: string; sub?: string; onDone: () => void }) {
  const fireDone = useOnce(onDone);
  useEffect(() => {
    const t = setTimeout(fireDone, 1600);
    return () => clearTimeout(t);
  }, [fireDone]);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      {kicker && (
        <p className="demo-rise font-mono text-[13px] uppercase tracking-[0.2em] text-brand" style={{ animationDelay: '0ms' }}>
          {kicker}
        </p>
      )}
      <h1 className="demo-rise max-w-3xl font-heading text-4xl font-semibold leading-tight tracking-tight text-slate-100 sm:text-5xl" style={{ animationDelay: '250ms' }}>
        {headline}
      </h1>
      {sub && (
        <p className="demo-rise max-w-2xl text-lg text-slate-400" style={{ animationDelay: '600ms' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function OutroScene({ headline, sub, command, onDone }: { headline: string; sub: string; command: string; onDone: () => void }) {
  const fireDone = useOnce(onDone);
  useEffect(() => {
    const t = setTimeout(fireDone, 1600);
    return () => clearTimeout(t);
  }, [fireDone]);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <h1 className="demo-rise max-w-3xl font-heading text-3xl font-semibold leading-tight tracking-tight text-slate-100 sm:text-4xl" style={{ animationDelay: '0ms' }}>
        {headline}
      </h1>
      <p className="demo-rise text-base text-slate-400" style={{ animationDelay: '300ms' }}>{sub}</p>
      <div className="demo-rise flex items-center gap-3 rounded-lg border border-slate-700 bg-[#0d1117] px-5 py-3 font-mono text-sm text-slate-200" style={{ animationDelay: '600ms' }}>
        <span className="select-none text-slate-500">$</span> {command}
      </div>
      <p className="demo-rise font-mono text-[12px] uppercase tracking-wide" style={{ animationDelay: '900ms' }}>
        <a href="/learn" className="text-brand hover:opacity-80">run the tutorial →</a>
        <span className="mx-3 text-slate-700">·</span>
        <a href="/inspect" className="text-brand hover:opacity-80">read the receipts →</a>
      </p>
    </div>
  );
}

export function DemoPlayer() {
  // client:only island — window is always available, but read params once.
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const record = params.get('record') === '1';
  const instant = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const [reel, setReel] = useState<Reel>(params.get('reel') === 'deep' ? 'deep' : 'sizzle');
  // Sizzle is the self-running cut; deep defaults to stepped reading pace.
  const [mode, setMode] = useState<'auto' | 'step'>(
    params.get('mode') === 'step' || (params.get('mode') !== 'auto' && params.get('reel') === 'deep') ? 'step' : 'auto'
  );
  const [idx, setIdx] = useState(0);
  const [sceneDone, setSceneDone] = useState(false);
  const [ended, setEnded] = useState(false);

  const scenes = useMemo(() => reelScenes(reel), [reel]);
  const scene = scenes[idx];

  const goTo = (n: number) => {
    setIdx(Math.max(0, Math.min(scenes.length - 1, n)));
    setSceneDone(false);
    setEnded(false);
  };

  // Auto-advance: dwell after the scene's animation completes, then move on.
  useEffect(() => {
    if (!sceneDone) return;
    if (idx === scenes.length - 1) {
      setEnded(true);
      (window as unknown as { __DEMO_DONE__: boolean }).__DEMO_DONE__ = true;
      return;
    }
    if (mode !== 'auto') return;
    const hold = (scene.type === 'terminal' ? (scene.holdMs ?? DEFAULT_HOLD.terminal) : DEFAULT_HOLD[scene.type]);
    const t = setTimeout(() => goTo(idx + 1), hold);
    return () => clearTimeout(t);
  }, [sceneDone, mode, idx, scenes.length, scene]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goTo(idx + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(idx - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onDone = () => setSceneDone(true);
  const switchReel = (r: Reel) => {
    setReel(r);
    setMode(r === 'deep' ? 'step' : 'auto');
    setIdx(0);
    setSceneDone(false);
    setEnded(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0d12] px-6 py-5">
      {!record && (
        <header className="flex items-center justify-between">
          <a href="/" className="font-mono text-[12px] uppercase tracking-wide text-slate-500 no-underline hover:text-brand">
            ← blueprint
          </a>
          <div className="flex items-center gap-4 font-mono text-[12px] uppercase tracking-wide">
            <span>
              {(['sizzle', 'deep'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => switchReel(r)}
                  className={`px-2 py-1 ${reel === r ? 'text-brand' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {r === 'sizzle' ? 'sizzle · 35s' : 'walkthrough'}
                </button>
              ))}
            </span>
            <span className="text-slate-700">·</span>
            <button
              type="button"
              onClick={() => setMode(mode === 'auto' ? 'step' : 'auto')}
              className="text-slate-500 hover:text-slate-300"
            >
              {mode === 'auto' ? 'auto ▸' : 'step ⏯'}
            </button>
          </div>
        </header>
      )}

      <main className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        <div key={`${reel}-${idx}`} className="demo-fade-in h-[440px] w-full max-w-4xl">
          {scene.type === 'title' && <TitleScene kicker={scene.kicker} headline={scene.headline} sub={scene.sub} onDone={onDone} />}
          {scene.type === 'terminal' && <TerminalScene fixture={fixtureFor(scene.fixture)} instant={instant} onDone={onDone} />}
          {scene.type === 'prompt' && <PromptScene commands={scene.commands} instant={instant} onDone={onDone} />}
          {scene.type === 'artifact' && <ArtifactScene path={scene.path} stage={scene.stage} excerpt={scene.excerpt} onDone={onDone} />}
          {scene.type === 'receipts' && <ReceiptsScene cards={scene.cards} onDone={onDone} />}
          {scene.type === 'stages' && <StagesScene instant={instant} onDone={onDone} />}
          {scene.type === 'outro' && <OutroScene headline={scene.headline} sub={scene.sub} command={scene.command} onDone={onDone} />}
        </div>
        <p className="min-h-12 max-w-3xl text-center text-[15px] leading-relaxed text-slate-400">{scene.caption ?? ' '}</p>
      </main>

      {!record && (
        <footer className="flex items-center justify-center gap-5 pb-2">
          <button type="button" onClick={() => goTo(idx - 1)} disabled={idx === 0} className="font-mono text-[12px] uppercase tracking-wide text-slate-500 hover:text-slate-300 disabled:opacity-30">
            ← prev
          </button>
          <div className="flex items-center gap-2">
            {scenes.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Scene ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-6 bg-brand' : 'w-1.5 bg-slate-700 hover:bg-slate-500'}`}
              />
            ))}
          </div>
          {ended && idx === scenes.length - 1 ? (
            <button type="button" onClick={() => goTo(0)} className="font-mono text-[12px] uppercase tracking-wide text-brand">
              ↺ replay
            </button>
          ) : (
            <button type="button" onClick={() => goTo(idx + 1)} className="font-mono text-[12px] uppercase tracking-wide text-slate-500 hover:text-slate-300">
              next →
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
