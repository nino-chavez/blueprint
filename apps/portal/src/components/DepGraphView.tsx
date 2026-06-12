import { useEffect, useMemo, useRef, useState } from 'react';
import type { DependencyGraphSummary, DepNode, DepNodeKind, DepEdge } from '@/lib/derived';

export interface DepGraphViewProps {
  graph: DependencyGraphSummary;
  /** Repo host base URL (portalConfig().repoUrl). When set, a focused node
   *  links to its decision file; when empty the link is omitted. */
  repoUrl?: string;
}

// ── visual vocabulary ─────────────────────────────────────────────────────────
const NODE_STYLE: Record<DepNodeKind, { fill: string; stroke: string; label: string }> = {
  adr:      { fill: '#1e293b', stroke: '#38bdf8', label: 'Decision (ADR)' },
  planned:  { fill: '#0f172a', stroke: '#475569', label: 'Planned / dangling' },
  research: { fill: '#1e293b', stroke: '#a78bfa', label: 'Research' },
  external: { fill: '#1e293b', stroke: '#64748b', label: 'External' },
};

const EDGE_STYLE: Record<string, { color: string; dash?: string }> = {
  supersedes:   { color: '#f87171' },
  superseded_by:{ color: '#f87171', dash: '4 3' },
  extends:      { color: '#38bdf8' },
  informs:      { color: '#94a3b8', dash: '5 4' },
  grounded_by:  { color: '#a78bfa' },
  ratified_by:  { color: '#34d399' },
  cites:        { color: '#475569', dash: '2 4' },
};
const edgeStyle = (kind: string) => EDGE_STYLE[kind] ?? { color: '#64748b', dash: '2 3' };

// Human phrasing for an edge relation, from the focused node's perspective.
const REL_OUT: Record<string, string> = {
  supersedes: 'supersedes', superseded_by: 'superseded by', extends: 'extends',
  informs: 'informs', grounded_by: 'grounded by', ratified_by: 'ratified by', cites: 'cites',
};
const REL_IN: Record<string, string> = {
  supersedes: 'superseded by', superseded_by: 'supersedes', extends: 'extended by',
  informs: 'informed by', grounded_by: 'grounds', ratified_by: 'ratifies', cites: 'cited by',
};

// ── deterministic PRNG ────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Pt { x: number; y: number; vx: number; vy: number; }

const W = 880;
const H = 560;
const R = 7;

export function DepGraphView({ graph, repoUrl }: DepGraphViewProps) {
  const { nodes, edges } = graph;
  const [pos, setPos] = useState<Record<string, Pt>>({});
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const dragId = useRef<string | null>(null);
  const dragMoved = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const nodeById = useMemo(() => {
    const m: Record<string, DepNode> = {};
    for (const n of nodes) m[n.id] = n;
    return m;
  }, [nodes]);

  const degree = useMemo(() => {
    const d: Record<string, number> = {};
    for (const e of edges) { d[e.source] = (d[e.source] || 0) + 1; d[e.target] = (d[e.target] || 0) + 1; }
    return d;
  }, [edges]);

  const adjacency = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    for (const e of edges) {
      (m[e.source] ||= new Set()).add(e.target);
      (m[e.target] ||= new Set()).add(e.source);
    }
    return m;
  }, [edges]);

  // Outgoing/incoming edges of the focused node, for the walk panel.
  const focusEdges = useMemo(() => {
    if (!selected) return { out: [] as DepEdge[], in: [] as DepEdge[] };
    return {
      out: edges.filter((e) => e.source === selected),
      in: edges.filter((e) => e.target === selected),
    };
  }, [selected, edges]);

  // Seeded ring seed + force relaxation. Runs once per node/edge set.
  useEffect(() => {
    if (nodes.length === 0) return;
    const rand = mulberry32(1337);
    const p: Record<string, Pt> = {};
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      p[n.id] = {
        x: W / 2 + Math.cos(a) * 180 + (rand() - 0.5) * 40,
        y: H / 2 + Math.sin(a) * 140 + (rand() - 0.5) * 40,
        vx: 0, vy: 0,
      };
    });
    const ids = nodes.map((n) => n.id);
    for (let tick = 0; tick < 360; tick++) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = p[ids[i]], b = p[ids[j]];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy || 0.01;
          const f = 4200 / d2, d = Math.sqrt(d2), ux = dx / d, uy = dy / d;
          a.vx += ux * f; a.vy += uy * f; b.vx -= ux * f; b.vy -= uy * f;
        }
      }
      for (const e of edges) {
        const a = p[e.source], b = p[e.target];
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const f = (d - 130) * 0.02, ux = dx / d, uy = dy / d;
        a.vx += ux * f; a.vy += uy * f; b.vx -= ux * f; b.vy -= uy * f;
      }
      for (const id of ids) {
        const n = p[id];
        n.vx += (W / 2 - n.x) * 0.006; n.vy += (H / 2 - n.y) * 0.006;
        n.vx *= 0.85; n.vy *= 0.85; n.x += n.vx; n.y += n.vy;
        n.x = Math.max(R + 4, Math.min(W - R - 4, n.x));
        n.y = Math.max(R + 4, Math.min(H - R - 4, n.y));
      }
    }
    setPos(p);
  }, [nodes, edges]);

  // ── walk navigation ──
  function walkTo(id: string) {
    if (id === selected) return;
    setHistory((h) => (selected ? [...h, selected] : h));
    setSelected(id);
  }
  function walkBack() {
    setHistory((h) => {
      if (h.length === 0) { setSelected(null); return h; }
      const prev = h[h.length - 1];
      setSelected(prev);
      return h.slice(0, -1);
    });
  }

  // ── drag (distinguished from click) ──
  function clientToSvg(clientX: number, clientY: number) {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * H };
  }
  function onMove(e: React.PointerEvent) {
    if (!dragId.current) return;
    dragMoved.current = true;
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    setPos((prev) => ({ ...prev, [dragId.current!]: { ...prev[dragId.current!], x, y } }));
  }

  if (nodes.length === 0) return null;
  const kinds = [...new Set(nodes.map((n) => n.kind))];
  const focusSet = selected ? adjacency[selected] : hover ? adjacency[hover] : null;
  const focusId = selected ?? hover;
  const selNode = selected ? nodeById[selected] : null;
  const sourceHref = selNode?.path && repoUrl
    ? `${repoUrl.replace(/\/$/, '')}/blob/main/${selNode.path}`
    : null;

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="min-w-0 flex-1 rounded-lg border border-contrast-200 bg-contrast-100/20 p-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label="Decision dependency graph"
          onPointerMove={onMove}
          onPointerUp={() => (dragId.current = null)}
          onPointerLeave={() => { dragId.current = null; setHover(null); }}
          onClick={(e) => { if (e.target === svgRef.current) { setSelected(null); setHistory([]); } }}
        >
          {edges.map((e, i) => {
            const a = pos[e.source], b = pos[e.target];
            if (!a || !b) return null;
            const st = edgeStyle(e.kind);
            const touches = focusId && (e.source === focusId || e.target === focusId);
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={st.color}
                strokeWidth={touches ? 2.2 : 1.1}
                strokeDasharray={st.dash}
                opacity={focusId ? (touches ? 0.85 : 0.08) : 0.55}
              />
            );
          })}
          {nodes.map((n) => {
            const p = pos[n.id];
            if (!p) return null;
            const s = NODE_STYLE[n.kind];
            const isFocus = n.id === focusId;
            const dim = focusId && !isFocus && !focusSet?.has(n.id);
            const r = isFocus ? R + 4 : Math.min(15, R + (degree[n.id] || 0) * 0.5);
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                opacity={dim ? 0.2 : 1}
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  dragId.current = n.id; dragMoved.current = false;
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                }}
                onPointerUp={() => { if (!dragMoved.current) walkTo(n.id); }}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
              >
                <circle
                  r={r}
                  fill={isFocus ? s.stroke : s.fill}
                  stroke={s.stroke}
                  strokeWidth={isFocus ? 3 : 2}
                />
                {(isFocus || !focusId || focusSet?.has(n.id)) && (
                  <text
                    x={r + 5} y={4} fontSize="11"
                    fontFamily="ui-monospace, monospace"
                    fill="currentColor"
                    className={isFocus ? 'text-contrast-800' : 'text-contrast-600'}
                  >
                    {truncate(n.label, 32)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 px-1 font-mono text-[10px] uppercase tracking-wide text-contrast-400">
          {kinds.map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: NODE_STYLE[k].fill, border: `2px solid ${NODE_STYLE[k].stroke}` }} />
              {NODE_STYLE[k].label}
            </span>
          ))}
          <span className="text-contrast-300">click to walk · drag to move · node size = degree</span>
        </div>
      </div>

      {/* walk panel */}
      <aside className="w-full shrink-0 rounded-lg border border-contrast-200 bg-contrast-100/20 p-4 lg:w-80">
        {selNode ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={walkBack}
                className="rounded border border-contrast-200 px-2 py-0.5 font-mono text-[11px] text-contrast-500 hover:bg-contrast-100"
                aria-label="Back"
              >
                ←
              </button>
              <span className="font-mono text-[10px] uppercase tracking-wide text-contrast-400">
                {selNode.kind}{selNode.status ? ` · ${selNode.status}` : ''}
              </span>
            </div>
            {history.length > 0 && (
              <p className="truncate font-mono text-[10px] text-contrast-400" title={history.map((h) => nodeById[h]?.label ?? h).join(' › ')}>
                {history.slice(-3).map((h) => (nodeById[h]?.id ?? h)).join(' › ')} › <span className="text-contrast-500">{selNode.id}</span>
              </p>
            )}
            <h2 className="font-heading text-base font-semibold leading-snug text-contrast-800">
              {selNode.label}
            </h2>
            {sourceHref && (
              <a href={sourceHref} target="_blank" rel="noreferrer"
                 className="font-mono text-xs text-brand hover:underline">
                open decision →
              </a>
            )}

            <EdgeList
              title="This decision →"
              items={focusEdges.out}
              endpoint={(e) => e.target}
              rel={(k) => REL_OUT[k] ?? k}
              nodeById={nodeById}
              onWalk={walkTo}
            />
            <EdgeList
              title="← Decisions pointing here"
              items={focusEdges.in}
              endpoint={(e) => e.source}
              rel={(k) => REL_IN[k] ?? k}
              nodeById={nodeById}
              onWalk={walkTo}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col justify-center gap-2 py-8 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wide text-contrast-400">Walk the graph</p>
            <p className="text-sm leading-relaxed text-contrast-500">
              Click any decision to focus it. Its neighbors light up; this panel lists what it
              points to and what points back. Click those to walk the why-chain, hop by hop.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function EdgeList({
  title, items, endpoint, rel, nodeById, onWalk,
}: {
  title: string;
  items: DepEdge[];
  endpoint: (e: DepEdge) => string;
  rel: (kind: string) => string;
  nodeById: Record<string, DepNode>;
  onWalk: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-contrast-400">
        {title} <span className="text-contrast-300">({items.length})</span>
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((e, i) => {
          const id = endpoint(e);
          const n = nodeById[id];
          return (
            <li key={i}>
              <button
                onClick={() => onWalk(id)}
                className="group flex w-full items-baseline gap-1.5 rounded px-1.5 py-1 text-left hover:bg-contrast-100"
              >
                <span
                  className="shrink-0 font-mono text-[9px] uppercase tracking-wide"
                  style={{ color: (EDGE_STYLE[e.kind] ?? { color: '#64748b' }).color }}
                >
                  {rel(e.kind)}
                </span>
                <span className="truncate text-xs text-contrast-600 group-hover:text-contrast-800">
                  {n ? truncate(n.label, 34) : id}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
