import { useMemo, useState } from 'react';
import { Cpu, User, CircleDot } from 'lucide-react';

// The Blueprint stage machine, rendered from the model itself. Structure comes
// straight from the four `*_MODEL` constants in template/tools/lib/stage-model.mjs
// (passed in as `models`) so this chart cannot drift from the machine it depicts.
//
// The one idea this visualization exists to make concrete (the "goodbye slop"
// thesis): every gate is either DERIVABLE — a program decides it from disk (the
// deterministic core) — or an agentic-SHELL edge that needs a human/reviewer
// assertion. Colour carries that split.

type Gate = { id: string; derivable: boolean; optional?: boolean; kind: string; params?: unknown };
type Stage = { id: number; name: string; gates: Gate[] };
type Model = { variant: string; stages: Stage[] };

// plain-English gloss for each check kind (what the deterministic gate inspects)
const KIND_DESC: Record<string, string> = {
  'yml-block': 'a required block is declared in blueprint.yml',
  'dir-md-min': 'a directory holds at least N substantive docs',
  'dir-contains': 'a doc in the directory matches a content pattern',
  'file-exists': 'a specific file is present',
  'name-match': 'a file whose name matches a pattern exists',
  'research-legs': 'research legs are present (populated subdirs or files, any names)',
  'any-exists': 'any of the listed paths or directories is present',
  'deploy-signals': 'deploy config is present (CI workflow / vercel / built portal)',
  'feedback-triaged': 'feedback is both captured and triaged',
  manual: 'an operator or reviewer must confirm it — no disk artifact can',
};

const VARIANT_BLURB: Record<string, string> = {
  greenfield: 'A new product, no production surfaces. The prototype is the deliverable.',
  midstream: 'An active mid-development product. The prototype revises in-flight work.',
  brownfield: 'A mature, live product. The diagnose + prescription docs are the deliverable; the prototype is optional.',
  research: 'Not a product — a decision driven by input assets. The deliverable is a decision memo; there is no app, so Stage 0 is Inputs Intake.',
};

export function StateMachineView({ models }: { models: Model[] }) {
  const [variant, setVariant] = useState(models[0]?.variant ?? 'greenfield');
  const [active, setActive] = useState<Gate | null>(null);
  const model = useMemo(() => models.find((m) => m.variant === variant) ?? models[0], [models, variant]);

  const allGates = model.stages.flatMap((s) => s.gates);
  const coreCount = allGates.filter((g) => g.derivable).length;
  const shellCount = allGates.length - coreCount;

  return (
    <div>
      {/* variant switcher */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-wide text-contrast-400">variant</span>
        {models.map((m) => {
          const on = m.variant === variant;
          return (
            <button
              key={m.variant}
              type="button"
              onClick={() => { setVariant(m.variant); setActive(null); }}
              aria-pressed={on}
              className={[
                'rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide transition-colors',
                on
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-contrast-200 text-contrast-500 hover:border-brand/50 hover:text-foreground',
              ].join(' ')}
            >
              {m.variant}
            </button>
          );
        })}
      </div>

      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-contrast-500">{VARIANT_BLURB[variant]}</p>

      {/* legend — the thesis */}
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-contrast-200 bg-contrast-100/30 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm text-foreground">
          <Cpu className="h-4 w-4 text-brand" aria-hidden />
          <span><b className="font-semibold">Deterministic core</b> — {coreCount} gates a program decides from disk</span>
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-foreground">
          <User className="h-4 w-4 text-warning" aria-hidden />
          <span><b className="font-semibold">Agentic shell</b> — {shellCount} gates a human/reviewer must assert</span>
        </span>
      </div>

      {/* the machine — stages left to right on a spine, gates within each. It's
          wider than the viewport by design (8 stages); make the scroll obvious. */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-contrast-400">
          {model.stages.length} stages · {allGates.length} gates
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wide text-contrast-400">scroll the pipeline →</span>
      </div>
      <div className="relative">
        {/* right-edge fade: signals there's more machine to the right */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent" aria-hidden />
        <div className="-mx-1 overflow-x-auto px-1 pb-4">
          <ol className="flex min-w-max items-stretch gap-0" role="list">
          {model.stages.map((stage, i) => (
            <li key={stage.id} className="flex items-stretch">
              <div className="flex w-52 flex-col">
                {/* spine node + connector */}
                <div className="relative mb-3 flex items-center">
                  <span className="z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand bg-background font-mono text-sm font-semibold text-brand">
                    {stage.id}
                  </span>
                  {i < model.stages.length - 1 && (
                    <span className="h-px flex-1 bg-gradient-to-r from-brand/50 to-contrast-200" aria-hidden />
                  )}
                </div>
                <h3 className="mb-3 pr-3 font-heading text-sm font-semibold leading-tight tracking-tight text-foreground">
                  {stage.name}
                </h3>
                {/* gates */}
                <div className="flex flex-col gap-2 pr-3">
                  {stage.gates.map((g) => {
                    const isActive = active?.id === g.id && active?.kind === g.kind;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setActive(isActive ? null : g)}
                        className={[
                          'group flex items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors',
                          isActive ? 'border-brand ring-1 ring-brand/30' : 'border-contrast-200 hover:border-brand/50',
                          'bg-background',
                        ].join(' ')}
                      >
                        <CircleDot
                          className={['mt-0.5 h-3.5 w-3.5 shrink-0', g.derivable ? 'text-brand' : 'text-warning'].join(' ')}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[12px] text-foreground">{g.id}</span>
                          <span className="block truncate font-mono text-[10px] uppercase tracking-wide text-contrast-400">
                            {g.derivable ? 'core' : 'shell'}
                            {g.optional ? ' · optional' : ''}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
          </ol>
        </div>
      </div>

      {/* gate detail */}
      <div className="mt-4 min-h-[4.5rem] rounded-lg border border-contrast-200 bg-contrast-100/30 p-4">
        {active ? (
          <div>
            <p className="mb-1 flex items-center gap-2 font-mono text-sm text-foreground">
              <CircleDot className={['h-4 w-4', active.derivable ? 'text-brand' : 'text-warning'].join(' ')} aria-hidden />
              {active.id}
              <span className="font-sans text-[11px] uppercase tracking-wide text-contrast-400">
                · {active.derivable ? 'deterministic core' : 'agentic shell'}{active.optional ? ' · optional' : ''}
              </span>
            </p>
            <p className="text-sm leading-relaxed text-contrast-500">
              {active.derivable
                ? `Checked mechanically: ${KIND_DESC[active.kind] ?? active.kind}. The program owns this gate — you cannot assert past a disk fact.`
                : `${KIND_DESC[active.kind] ?? active.kind}. Advance blocks here until an operator records an assertion — the fuzzy edge no disk check can decide.`}
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-contrast-400">
            <CircleDot className="h-4 w-4" aria-hidden /> Select a gate to see what the machine checks — and whether it's decided by disk or by assertion.
          </p>
        )}
      </div>
    </div>
  );
}
