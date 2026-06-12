#!/usr/bin/env node
/**
 * render-standalone — emit a self-contained HTML force-graph from a dep-graph
 * JSON. For consumers WITHOUT a portal (no Astro island to host the React
 * component), this is the way to see the decision graph: one file, no deps,
 * opens in any browser.
 *
 * The portal island (DepGraphView.tsx) and this share the same force model and
 * visual vocabulary, deliberately — this is the portal-less escape hatch, not a
 * fork of the semantics.
 *
 * Usage: node render-standalone.mjs <graph.json> [--out file.html]  ("-" = stdout)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const inPath = process.argv[2];
if (!inPath) {
  console.error('usage: render-standalone.mjs <graph.json> [--out file.html]');
  process.exit(1);
}
const outIdx = process.argv.indexOf('--out');
const outPath = outIdx >= 0 ? process.argv[outIdx + 1] : '-';
const graph = JSON.parse(readFileSync(inPath, 'utf8'));

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Decision graph</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0b1220; color: #cbd5e1;
         font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; }
  header { padding: 20px 28px 8px; }
  h1 { margin: 0 0 4px; font: 600 22px ui-sans-serif, system-ui; letter-spacing: -.01em; color: #e2e8f0; }
  .sub { color: #64748b; font-size: 12px; }
  svg { width: 100%; height: calc(100vh - 150px); display: block; touch-action: none; }
  text { fill: #94a3b8; pointer-events: none; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 22px; padding: 8px 28px 18px; color: #64748b;
            font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
  .legend b { display: inline-flex; align-items: center; gap: 7px; font-weight: 400; }
  .dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid; }
  line { cursor: default; }
  g.node { cursor: grab; }
</style></head>
<body>
<header>
  <h1>How the decisions connect</h1>
  <div class="sub">${graph.node_count ?? graph.nodes.length} decisions · ${graph.edge_count ?? graph.edges.length} edges · ${escapeHtml(graph.source || '')}</div>
</header>
<svg id="g" viewBox="0 0 1200 760" aria-label="Decision dependency graph"></svg>
<div class="legend" id="legend"></div>
<script>
const GRAPH = ${JSON.stringify({ nodes: graph.nodes, edges: graph.edges })};
const NODE = {
  adr:      { fill: '#1e293b', stroke: '#38bdf8', label: 'Decision (ADR)' },
  planned:  { fill: '#0f172a', stroke: '#475569', label: 'Planned / dangling' },
  research: { fill: '#1e293b', stroke: '#a78bfa', label: 'Research' },
  external: { fill: '#1e293b', stroke: '#64748b', label: 'External' },
};
const EDGE = {
  supersedes:{ c:'#f87171' }, superseded_by:{ c:'#f87171', d:'4 3' },
  extends:{ c:'#38bdf8' }, informs:{ c:'#94a3b8', d:'5 4' },
  grounded_by:{ c:'#a78bfa' }, ratified_by:{ c:'#34d399' }, cites:{ c:'#475569', d:'2 4' },
};
const W = 1200, H = 760, R = 7;
function mulberry32(s){return()=>{s|=0;s=s+0x6d2b79f5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rand = mulberry32(1337);
const N = GRAPH.nodes, E = GRAPH.edges;
const pos = {};
N.forEach((n,i)=>{const a=i/N.length*Math.PI*2;pos[n.id]={x:W/2+Math.cos(a)*260+(rand()-.5)*60,y:H/2+Math.sin(a)*200+(rand()-.5)*60,vx:0,vy:0};});
const ids = N.map(n=>n.id);
for(let t=0;t<600;t++){
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    const a=pos[ids[i]],b=pos[ids[j]];let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy||.01;
    const f=4200/d2,d=Math.sqrt(d2),ux=dx/d,uy=dy/d;a.vx+=ux*f;a.vy+=uy*f;b.vx-=ux*f;b.vy-=uy*f;}
  for(const e of E){const a=pos[e.source],b=pos[e.target];if(!a||!b)continue;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||.01,f=(d-130)*.02,ux=dx/d,uy=dy/d;
    a.vx+=ux*f;a.vy+=uy*f;b.vx-=ux*f;b.vy-=uy*f;}
  for(const id of ids){const n=pos[id];n.vx+=(W/2-n.x)*.006;n.vy+=(H/2-n.y)*.006;
    n.vx*=.85;n.vy*=.85;n.x+=n.vx;n.y+=n.vy;
    n.x=Math.max(R+4,Math.min(W-R-4,n.x));n.y=Math.max(R+4,Math.min(H-R-4,n.y));}
}
const deg={};E.forEach(e=>{deg[e.source]=(deg[e.source]||0)+1;deg[e.target]=(deg[e.target]||0)+1;});
const svg=document.getElementById('g');const NS='http://www.w3.org/2000/svg';
for(const e of E){const a=pos[e.source],b=pos[e.target];if(!a||!b)continue;
  const st=EDGE[e.kind]||{c:'#475569'};const l=document.createElementNS(NS,'line');
  l.setAttribute('x1',a.x);l.setAttribute('y1',a.y);l.setAttribute('x2',b.x);l.setAttribute('y2',b.y);
  l.setAttribute('stroke',st.c);l.setAttribute('stroke-width',1);l.setAttribute('opacity',.5);
  if(st.d)l.setAttribute('stroke-dasharray',st.d);svg.appendChild(l);}
for(const n of N){const p=pos[n.id];const s=NODE[n.kind]||NODE.external;
  const g=document.createElementNS(NS,'g');g.setAttribute('class','node');g.setAttribute('transform','translate('+p.x+','+p.y+')');
  const r=Math.min(16,R+(deg[n.id]||0)*0.5);
  const c=document.createElementNS(NS,'circle');c.setAttribute('r',r);c.setAttribute('fill',s.fill);
  c.setAttribute('stroke',s.stroke);c.setAttribute('stroke-width',2);g.appendChild(c);
  const tx=document.createElementNS(NS,'text');tx.setAttribute('x',r+4);tx.setAttribute('y',4);tx.setAttribute('font-size',11);
  tx.textContent=(n.label||n.id).slice(0,46);g.appendChild(tx);svg.appendChild(g);}
const kinds=[...new Set(N.map(n=>n.kind))];
document.getElementById('legend').innerHTML=kinds.map(k=>'<b><span class="dot" style="background:'+(NODE[k]||NODE.external).fill+';border-color:'+(NODE[k]||NODE.external).stroke+'"></span>'+(NODE[k]||NODE.external).label+'</b>').join('')+'<b>node size = citation degree</b>';
</script>
</body></html>`;

function escapeHtml(s){return String(s).replace(/[&<>"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

if (outPath === '-') process.stdout.write(html);
else { writeFileSync(outPath, html); console.error(`render-standalone: -> ${outPath}`); }
