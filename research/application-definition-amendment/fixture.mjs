// Invented test data, never an Aisles/Gather Here product approval.
import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { GROUPS,ROLES,hash,fingerprint } from './gate.mjs';
export const read=(root,p)=>JSON.parse(readFileSync(join(root,p),'utf8'));
export const write=(root,p,data)=>writeFileSync(join(root,p),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');
export const syntheticAuthority = r => r.actor==='synthetic-owner' && r.source==='test-harness-only';
export function attest(root,kind,fp,subject='synthetic-app') {
  const rs=read(root,'receipts.json').filter(r=>r.kind!==kind);
  rs.push({kind,subject,fingerprint:fp,verdict:'accept',actor:'synthetic-owner',source:'test-harness-only'});
  write(root,'receipts.json',rs);
}
export function packetHash(root) {
  return fingerprint(root,['scope.json','definition.json',...read(root,'definition.json').sources.map(x=>x.path)]);
}
export function frozenHash(root) {
  const d=read(root,'definition.json'),pick=read(root,'selection.json'),f=read(root,'freeze.json');
  return fingerprint(root,['scope.json','definition.json',...d.sources.map(x=>x.path),'selection.json',pick.artifact,'freeze.json',f.baseline]);
}
export function refreshDraft(root) {
  const d=read(root,'definition.json');
  for (const s of d.sources) s.sha256=hash(readFileSync(join(root,s.path)));
  write(root,'definition.json',d);
  attest(root,'definition-review',packetHash(root));
}
export function fixture(root) {
  mkdirSync(root,{recursive:true});write(root,'receipts.json',[]);
  write(root,'requirements.md','# Synthetic reply application\n\nMock — synthetic test fixture. Every example is invented; do not quote it as product evidence.\n\nBusiness requirement BR-1: let a guest record an answer. Product requirement FR-1: persist one answer for an authorized guest. US-1: an authorized guest can save; acceptance is a saved result. US-2: a visitor cannot save; acceptance is no mutation. Page P-1 enters from an invitation and exits to the schedule.\n');
  write(root,'journeys.md','# Invented test paths\n\nJ-1: the guest opens P-1 in S-1, chooses Save (I-1) and sees S-2. J-2: a visitor chooses Save (I-2) and remains at S-1 with a denial. These are synthetic contract examples, not tested user behavior.\n');
  write(root,'save.mmd','flowchart LR\nS-1 -->|I-1| S-2\n');
  write(root,'deny.mmd','flowchart LR\nS-1 -->|I-2| S-1\n');
  const d={version:1,scope_id:'synthetic-app',
    sources:[{path:'requirements.md',roles:ROLES.slice(0,5)},{path:'journeys.md',roles:['journeys-words']},{path:'save.mmd',roles:['journeys-visual']},{path:'deny.mmd',roles:['journeys-visual']}],
    requirements:[{id:'FR-1',source:'requirements.md',acceptance:'Guest saves; visitor denied'}],
    stories:[{id:'US-1',actor:'guest',requirement:'FR-1',acceptance:'Given authorized guest, when Save, then saved'},{id:'US-2',actor:'visitor',requirement:'FR-1',acceptance:'Given visitor, when Save, then denied'}],
    pages:[{id:'P-1',source:'requirements.md',entry:'Invitation',exit:'Schedule'}],
    states:[{id:'S-1',page:'P-1',meaning:'Answer not saved'},{id:'S-2',page:'P-1',meaning:'Answer saved'}],
    permissions:[{id:'PER-1',actor:'guest',action:'save',resource:'own answer',scope:'current invitation',effect:'allow',source:'requirements.md'},{id:'PER-2',actor:'visitor',action:'save',resource:'answer',scope:'no invitation',effect:'deny',source:'requirements.md'}],
    interactions:[{id:'I-1',page:'P-1',actor:'guest',action:'save',from:'S-1',to:'S-2',permission:'PER-1',mutation:'domain',result:'Saved receipt',recovery:'Reload saved answer'},{id:'I-2',page:'P-1',actor:'visitor',action:'save',from:'S-1',to:'S-1',permission:'PER-2',mutation:'none',result:'Access denied',recovery:'Return to entry'}],
    journeys:[{id:'J-1',actor:'guest',story:'US-1',trigger:'Invitation opened',outcome:'Saved answer',prose:'journeys.md',diagram:'save.mmd',steps:['I-1']},{id:'J-2',actor:'visitor',story:'US-2',trigger:'Direct link opened',outcome:'No write',prose:'journeys.md',diagram:'deny.mmd',steps:['I-2']}],
    state_coverage:[{id:'P-1/ready',disposition:'covered',states:['S-1']},{id:'P-1/complete',disposition:'covered',states:['S-2']}],decisions:[]};
  write(root,'definition.json',d);
  write(root,'scope.json',{version:1,id:d.scope_id,extent:'new-application',design_intent:'rethink',owner:'synthetic-owner',boundary:'Only this invented miniature test',expected:Object.fromEntries(GROUPS.map(g=>[g,d[g].map(x=>x.id)])),state_obligations:[{id:'P-1/ready',page:'P-1'},{id:'P-1/complete',page:'P-1'}],exclusions:[]});
  attest(root,'scope',fingerprint(root,['scope.json']));attest(root,'drafting',fingerprint(root,['scope.json']));attest(root,'concept-work',fingerprint(root,['scope.json']));refreshDraft(root);
  mkdirSync(join(root,'baseline'));
  for (const p of ['scope.json','definition.json','receipts.json',...d.sources.map(x=>x.path)]) copyFileSync(join(root,p),join(root,'baseline',p));
  attest(root,'baseline-review',hash(readFileSync(join(root,'baseline/definition.json'))));
  write(root,'concept.txt','Invented selected concept A, including its graft decision. No human selected this.\n');
  write(root,'selection.json',{scope_id:d.scope_id,candidate:'synthetic-A',alternatives:['synthetic-A','synthetic-B','synthetic-C'],grafts:[{from:'synthetic-B',taken:'A clearer return link',left_out:'Queue-first navigation',reason:'Keep one stable place'},{from:'synthetic-C',taken:'none',left_out:'Wizard sequence',reason:'The guest has one action'}],baseline:'baseline/definition.json',baseline_sha256:hash(readFileSync(join(root,'baseline/definition.json'))),artifact:'concept.txt',sha256:hash(readFileSync(join(root,'concept.txt')))});
  attest(root,'selection',fingerprint(root,['selection.json','concept.txt','baseline/definition.json']),'synthetic-A');
  write(root,'freeze.json',{packet_hash:packetHash(root),candidate:'synthetic-A',baseline:'baseline/definition.json',reconciliation:GROUPS.flatMap(g=>d[g].map(r=>({id:`${g}/${r.id}`,disposition:'kept',reason:'Unchanged in this invented fixture'})))});
  attest(root,'product-freeze',frozenHash(root));attest(root,'implementation',frozenHash(root));
}
