// Research only: no distributed CLI imports this prototype.
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, sep, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { inspectDocuments } from './document-input.mjs';
export const GROUPS = ['requirements','stories','pages','states','permissions','interactions','journeys'];
export const ROLES = ['brd','prd','stories','pages','interactions','journeys-words','journeys-visual'];
// Executable draft schema; relationship rules are below.
export const FIELDS = {
  requirements: ['id','source','acceptance'], stories: ['id','actor','requirement','acceptance'],
  pages: ['id','source','entry','exit'], states: ['id','page','meaning'],
  permissions: ['id','actor','action','resource','scope','effect','source'],
  interactions: ['id','page','actor','action','from','to','permission','mutation','result','recovery'],
  journeys: ['id','actor','story','trigger','outcome','prose','diagram'],
};
export const hash = x => createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : JSON.stringify(x)).digest('hex');
const text = x => typeof x === 'string' && !!x.trim() && !/^(TBD|TODO|UNKNOWN|REPLACE_ME)$/i.test(x.trim());
const same = (a,b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
function file(root,path) {
  if (!text(path)) throw new Error('missing path');
  const base = realpathSync(root), full = realpathSync(resolve(root,path));
  if (!full.startsWith(base + sep)) throw new Error('path escapes package root');
  return readFileSync(full,'utf8');
}
export const fingerprint = (root,paths) => hash([hash(readFileSync(new URL(import.meta.url))), [...new Set(paths)].sort().map(p => [p,hash(file(root,p))])]);

// Authority comes from a trusted HOST adapter, never a field in the package.
// There is deliberately no live authority adapter in this research prototype.
export function evaluate(root,phase='draft',authority=()=>false) {
  const errors=[], fail=(code,detail)=>errors.push({code,detail});
  const json=p=>JSON.parse(file(root,p));
  try {
    if (!['draft','selection','freeze','build'].includes(phase)) throw new Error('unknown phase');
    const s=json('scope.json'), d=json('definition.json'), receipts=json('receipts.json');
    if (s.version!==1 || d.version!==1 || s.id!==d.scope_id || !Array.isArray(receipts)) throw new Error('version/scope/receipt shape');
    const attest=(kind,digest,subject=s.id)=>{
      const rs=receipts.filter(r=>r.kind===kind && r.subject===subject && r.fingerprint===digest && r.verdict==='accept' && text(r.actor) && text(r.source));
      if (rs.length!==1 || !authority(rs[0])) fail('authority',`${kind}: need one current, host-verified acceptance`);
    };
    if (!text(s.owner) || !text(s.boundary)) fail('scope','owner and boundary required for every scope');
    const excluded=['bounded-change','non-application'].includes(s.extent);
    const scopeHash=fingerprint(root,['scope.json',...(excluded?[s.preserved_contract,s.existing_method]:[])]);
    attest('scope',scopeHash);
    if (!['new-application','whole-application','bounded-change','non-application'].includes(s.extent) || !['preserve','refit','rethink'].includes(s.design_intent)) throw new Error('undeclared scope/intent');
    if (['bounded-change','non-application'].includes(s.extent)) {
      if (!Array.isArray(s.affected_surfaces) || (s.extent==='bounded-change' && !s.affected_surfaces.length)) fail('applicability','affected surface roster required');
      if (!text(s.exclusion_reason) || !text(s.preserved_contract) || !text(s.existing_method)) fail('applicability','exclusion needs reason and preserved contract');
      else file(root,s.preserved_contract);
      return {state:errors.length?'absent':'pass',applicability:'excluded',errors};
    }
    if (s.design_intent!=='rethink') fail('applicability','scope/intent conflict needs owner resolution');
    if (!text(s.owner) || !text(s.boundary)) fail('scope','owner and application boundary required');
    const maps={};
    for (const g of GROUPS) {
      const expected=s.expected?.[g];
      if (!Array.isArray(expected) || !expected.length || !same(expected,new Set(expected))) fail('inventory',`${g}: expected IDs must be present and unique`);
      if (!Array.isArray(d[g])) throw new Error(`${g}: array required`);
      maps[g]=new Map();
      for (const r of d[g]) {
        if (!r || FIELDS[g].some(k=>!text(r[k]))) {fail('row',`${g}: missing fields`);continue;}
        if (maps[g].has(r.id)) fail('duplicate',`${g}/${r.id}`);
        maps[g].set(r.id,r);
      }
      if (!same(expected||[],maps[g].keys())) fail('coverage',`${g}: differs from accepted inventory`);
    }
    const ref=(g,id,at)=>{if (!maps[g].has(id)) fail('reference',`${at}: missing ${g}/${id}`);return maps[g].get(id);};
    if (!Array.isArray(d.sources) || !d.sources.length) throw new Error('sources required');
    const paths=d.sources.map(x=>x.path);
    if (new Set(paths).size!==paths.length) fail('sources','duplicate source paths');
    for (const role of ROLES) if (!d.sources.some(x=>x.roles?.includes(role))) fail('artifact-role',role);
    for (const source of d.sources) {
      if (!Array.isArray(source.roles) || !source.roles.length || source.roles.some(r=>!ROLES.includes(r))) fail('sources','unknown/malformed artifact roles');
      const body=file(root,source.path);
      if (!body.trim()) fail('empty-source',source.path);
      if (hash(body)!==source.sha256) fail('stale-source',source.path);
    }
    const sourceRef=(p,at)=>{if (!paths.includes(p)) fail('source-reference',at);};
    for (const g of ['requirements','pages','permissions']) for (const r of maps[g].values()) sourceRef(r.source,r.id);
    for (const story of maps.stories.values()) ref('requirements',story.requirement,story.id);
    for (const r of maps.requirements.values()) if (![...maps.stories.values()].some(x=>x.requirement===r.id)) fail('orphan',`${r.id}: no story`);
    for (const p of maps.permissions.values()) if (!['allow','deny'].includes(p.effect)) fail('permission',`${p.id}: unresolved effect`);
    for (const st of maps.states.values()) ref('pages',st.page,st.id);
    for (const p of maps.pages.values()) {
      if (![...maps.states.values()].some(x=>x.page===p.id)) fail('orphan',`${p.id}: no states`);
      if (![...maps.interactions.values()].some(x=>x.page===p.id)) fail('orphan',`${p.id}: no interactions; read/navigation count`);
    }
    for (const i of maps.interactions.values()) {
      ref('pages',i.page,i.id); const from=ref('states',i.from,i.id); ref('states',i.to,i.id);
      if (from && from.page!==i.page) fail('transition',`${i.id}: wrong source page`);
      const p=ref('permissions',i.permission,i.id);
      if (p && (p.actor!==i.actor || p.action!==i.action)) fail('permission',`${i.id}: actor/action mismatch`);
      if (!['none','domain'].includes(i.mutation)) fail('interaction',`${i.id}: mutation must be none or domain`);
      if (p?.effect==='deny' && i.mutation!=='none') fail('permission',`${i.id}: denied action mutates domain data`);
    }
    const covered=new Set();
    for (const j of maps.journeys.values()) {
      const story=ref('stories',j.story,j.id);
      if (story && story.actor!==j.actor) fail('journey',`${j.id}: wrong actor`);
      sourceRef(j.prose,j.id);sourceRef(j.diagram,j.id);
      if (!Array.isArray(j.steps) || !j.steps.length) {fail('journey',`${j.id}: missing steps`);continue;}
      const nodes=j.diagram_nodes||{};
      if (typeof nodes!=='object' || Array.isArray(nodes)) fail('diagram','node aliases must be an object');
      for (const id of Object.values(nodes)) ref('states',id,j.id);
      const actual=[...file(root,j.diagram).matchAll(/^\s*([\w-]+) -->\|([^|\r\n]+)\| ([\w-]+)\s*$/gm)].map(m=>JSON.stringify([nodes[m[1]]||m[1],m[2],nodes[m[3]]||m[3]]));
      const wanted=[];let prior;
      for (const id of j.steps) {
        covered.add(id);const i=ref('interactions',id,j.id);if (!i) continue;
        if (i.actor!==j.actor || (prior && prior!==i.from)) fail('journey',`${j.id}: discontinuity at ${id}`);
        prior=i.to;wanted.push(JSON.stringify([i.from,i.id,i.to]));
      }
      if (!same(actual,wanted)) fail('diagram',`${j.id}: visual/path mismatch`);
    }
    for (const id of maps.interactions.keys()) if (!covered.has(id)) fail('orphan',`${id}: no journey`);
    for (const id of maps.stories.keys()) if (![...maps.journeys.values()].some(x=>x.story===id)) fail('orphan',`${id}: no journey`);
    if (!Array.isArray(s.state_obligations) || !s.state_obligations.length || !Array.isArray(d.state_coverage)) throw new Error('state obligations/coverage required');
    if (new Set(s.state_obligations.map(x=>x.id)).size!==s.state_obligations.length) fail('state-coverage','duplicate scope obligations');
    if (!same(s.state_obligations.map(x=>x.id),d.state_coverage.map(x=>x.id))) fail('state-coverage','obligation/coverage mismatch');
    for (const o of s.state_obligations) {
      ref('pages',o.page,o.id);const rows=d.state_coverage.filter(c=>c.id===o.id);
      if (rows.length!==1) {fail('state-coverage',`${o.id}: need one disposition`);continue;}
      const c=rows[0];
      if (c.disposition==='not-applicable') {
        if (!text(c.reason) || !s.exclusions?.some(e=>e.id===o.id && e.reason===c.reason)) fail('state-coverage',`${o.id}: unreviewed exclusion`);
      } else if (c.disposition==='covered' && Array.isArray(c.states) && c.states.length) {
        for (const id of c.states) {const st=ref('states',id,o.id);if (st && st.page!==o.page) fail('state-coverage',`${o.id}: wrong page`);}
      } else fail('state-coverage',`${o.id}: unresolved`);
    }
    if (!Array.isArray(d.decisions)) throw new Error('decisions must be an array');
    for (const q of d.decisions) {
      if (!text(q.owner) || !text(q.question) || !Array.isArray(q.blocks)) fail('decision','owner/question/blocked actions required');
      if (!['open','resolved','deferred'].includes(q.status)) fail('decision','unknown decision status');
      if (q.status==='resolved' && (!text(q.answer) || !paths.includes(q.source))) fail('decision','resolved decision needs answer and source');
      if (q.status!=='resolved' && (q.blocks?.includes(phase) || (['freeze','build'].includes(phase) && q.blocks?.includes('freeze')))) fail('decision',q.question);
      if (q.status!=='resolved' && (!text(q.reason) || !text(q.revisit))) fail('decision','deferral needs reason and revisit trigger');
    }
    const packetHash=fingerprint(root,['scope.json','definition.json',...paths]);
    attest('drafting',scopeHash);attest('definition-review',packetHash);
    if (phase!=='draft') {
      attest('concept-work',scopeHash);
      const pick=json('selection.json');
      if (pick.scope_id!==s.id || !text(pick.candidate) || !text(pick.artifact)) throw new Error('selection shape');
      if (!Array.isArray(pick.alternatives) || new Set(pick.alternatives).size<3 || !pick.alternatives.includes(pick.candidate)) fail('selection','three named alternatives including selected candidate required');
      const rejected=(pick.alternatives||[]).filter(id=>id!==pick.candidate);
      if (!Array.isArray(pick.grafts) || !same(rejected,pick.grafts.map(g=>g.from))) fail('selection','every rejected alternative needs graft disposition');
      for (const g of pick.grafts||[]) if (!text(g.taken) || !text(g.left_out) || !text(g.reason)) fail('selection','graft needs taken/left-out/reason; explicit none is allowed');
      const baselineBody=file(root,pick.baseline); // enforce containment before reading the retained snapshot
      const baselineRoot=dirname(resolve(root,pick.baseline));
      if (realpathSync(baselineRoot)===realpathSync(root)) fail('baseline','prior definition must be a separate retained snapshot');
      else {const prior=evaluate(baselineRoot,'draft',authority);if(prior.state!=='pass') fail('baseline','prior Gate D fails: '+prior.errors.map(e=>e.detail).join('; '));}
      if (hash(baselineBody)!==pick.baseline_sha256) fail('selection-baseline','concept input baseline changed');
      if (hash(file(root,pick.artifact))!==pick.sha256) fail('stale-selection','candidate changed');
      attest('selection',fingerprint(root,['selection.json',pick.artifact,pick.baseline]),pick.candidate);
      if (phase!=='selection') {
        const f=json('freeze.json');
        if (f.packet_hash!==packetHash || f.candidate!==pick.candidate || f.baseline!==pick.baseline) fail('freeze','wrong packet/candidate');
        const baseline=json(f.baseline);
        const old=GROUPS.flatMap(g=>(baseline[g]||[]).map(r=>`${g}/${r.id}`));
        const current=GROUPS.flatMap(g=>[...maps[g].keys()].map(id=>`${g}/${id}`));
        if (!Array.isArray(f.reconciliation) || !same(new Set([...old,...current]),f.reconciliation.map(r=>r.id))) fail('reconciliation','every previous/current ID needs a disposition');
        for (const r of f.reconciliation||[]) {
          const allowed=old.includes(r.id)?current.includes(r.id)?['kept','changed']:['removed']:['added'];
          if (!allowed.includes(r.disposition) || !text(r.reason)) fail('reconciliation',r.id);
          if (old.includes(r.id) && current.includes(r.id)) {
            const [group,id]=r.id.split('/');
            const equal=hash(baseline[group].find(x=>x.id===id))===hash(maps[group].get(id));
            if ((r.disposition==='kept')!==equal) fail('reconciliation',`${r.id}: kept/changed disagrees with content`);
          }
        }
        attest('baseline-review',hash(file(root,f.baseline)));
        const frozenHash=fingerprint(root,['scope.json','definition.json',...paths,'selection.json',pick.artifact,'freeze.json',f.baseline]);
        attest('product-freeze',frozenHash);
        if (phase==='build') attest('implementation',frozenHash);
      }
    }
    return {state:errors.length?'absent':'pass',applicability:'required',packet_hash:packetHash,errors};
  } catch(e) {fail('shape',e.message);return {state:'absent',errors};}
}

// Existing prose enters through an explicit inspection mode, never through a
// fallback from a failed structured gate. Source checks cannot authorize work.
export const evaluateDocuments = (root, manifest) => inspectDocuments(root, manifest, ROLES, hash(readFileSync(new URL(import.meta.url))));

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 5 || process.argv[2] !== '--documents') {
    process.stderr.write('Usage: node gate.mjs --documents <source-root> <mapping.json>\n');
    process.exitCode = 2;
  } else {
    try {
      const report = evaluateDocuments(process.argv[3], JSON.parse(readFileSync(process.argv[4], 'utf8')));
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
      // 0 means only the requested source inspection succeeded. Read state,
      // authority and allowed_actions; this mode never returns a gate pass.
      process.exitCode = report.source_status === 'pass' ? 0 : 1;
    } catch (error) {
      process.stderr.write(error.message + '\n');
      process.exitCode = 2;
    }
  }
}
