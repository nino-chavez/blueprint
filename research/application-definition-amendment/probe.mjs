// Isolated control experiment using Blueprint's REAL derive/advance functions.
// Does not change template/, blueprint.yml, or any consumer.
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,cpSync,rmSync,readFileSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,dirname } from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { deriveStageStatus } from '../../template/tools/lib/stage-model.mjs';
import { evaluate,GROUPS,fingerprint,hash } from './gate.mjs';
import { fixture,read,write,syntheticAuthority,refreshDraft,attest,frozenHash } from './fixture.mjs';
const here=dirname(fileURLToPath(import.meta.url)), results=[];
async function test(name,run) {
  const root=mkdtempSync(join(tmpdir(),'bp-application-definition-'));
  try {fixture(root);await run(root);results.push({name,result:'PASS'});}
  finally {rmSync(root,{recursive:true,force:true});}
}
const check=(root,phase='draft')=>evaluate(root,phase,syntheticAuthority);
const mutate=(root,path,fn)=>{const v=read(root,path);fn(v);write(root,path,v);};
const blocked=(r,code)=>{assert.equal(r.state,'absent');if(code) assert(r.errors.some(e=>e.code===code),JSON.stringify(r));};
await test('complete synthetic draft, selection, freeze and separately authorized build pass',r=>{
  for(const phase of ['draft','selection','freeze','build']) assert.equal(check(r,phase).state,'pass',JSON.stringify(check(r,phase)));
});
for(const [group,code] of [['journeys','coverage'],['pages','coverage'],['interactions','coverage'],['permissions','coverage'],['states','coverage']]) {
  await test(`missing ${group} blocked even after refreshing synthetic review`,r=>{
    mutate(r,'definition.json',d=>d[group].pop());refreshDraft(r);blocked(check(r),code);
  });
}
await test('state coverage row omitted while all states remain',r=>{
  mutate(r,'definition.json',d=>d.state_coverage.pop());refreshDraft(r);blocked(check(r),'state-coverage');
});
await test('permission decision unresolved',r=>{
  mutate(r,'definition.json',d=>d.permissions[0].effect='unresolved');refreshDraft(r);blocked(check(r),'permission');
});
await test('denied action cannot mutate domain data',r=>{
  mutate(r,'definition.json',d=>d.interactions[1].mutation='domain');refreshDraft(r);blocked(check(r),'permission');
});
await test('transition points at nonexistent state',r=>{
  mutate(r,'definition.json',d=>d.interactions[0].to='missing');refreshDraft(r);blocked(check(r),'reference');
});
await test('journey visual disagrees with its transitions',r=>{
  write(r,'save.mmd','flowchart LR\nS-2 -->|I-1| S-1\n');refreshDraft(r);blocked(check(r),'diagram');
});
await test('known-incomplete inventory cannot be shrunk silently',r=>{
  mutate(r,'scope.json',s=>s.expected.journeys.pop());mutate(r,'definition.json',d=>d.journeys.pop());refreshDraft(r);blocked(check(r),'authority');
});
await test('empty BRD file and populated filenames are not completeness proof',r=>{
  write(r,'requirements.md','');refreshDraft(r);blocked(check(r),'empty-source');
});
await test('changed source with refreshed manifest still needs substantive re-review',r=>{
  write(r,'requirements.md','A changed product requirement.');
  mutate(r,'definition.json',d=>d.sources[0].sha256=hash(readFileSync(join(r,'requirements.md'))));blocked(check(r),'authority');
});
await test('missing semantic review cannot be replaced by file presence',r=>{
  mutate(r,'receipts.json',rs=>rs.splice(rs.findIndex(x=>x.kind==='definition-review'),1));blocked(check(r),'authority');
});
await test('authored approval fields are not a trusted human decision',r=>blocked(evaluate(r),'authority'));
await test('drafting does not authorize concept work',r=>{
  mutate(r,'receipts.json',rs=>rs.splice(rs.findIndex(x=>x.kind==='concept-work'),1));assert.equal(check(r).state,'pass');blocked(check(r,'selection'),'authority');
});
await test('later blocking decision permits comparison but prevents freeze',r=>{
  mutate(r,'definition.json',d=>d.decisions.push({owner:'product-owner',question:'Final supported device scope?',status:'open',blocks:['freeze'],reason:'Compare concepts first',revisit:'Before validation'}));refreshDraft(r);assert.equal(check(r,'selection').state,'pass');blocked(check(r,'freeze'),'decision');
});
await test('changed requirement cannot be reported as kept',r=>{
  mutate(r,'definition.json',d=>d.requirements[0].acceptance='A different result');refreshDraft(r);blocked(check(r,'freeze'),'reconciliation');
});
await test('stale checker-method review is rejected',r=>{
  mutate(r,'receipts.json',rs=>rs.find(x=>x.kind==='definition-review').fingerprint=hash('old-method'));blocked(check(r),'authority');
});
await test('drafting does not approve product freeze',r=>{
  mutate(r,'receipts.json',rs=>rs.splice(rs.findIndex(x=>x.kind==='product-freeze'),1));assert.equal(check(r).state,'pass');blocked(check(r,'freeze'),'authority');
});
await test('product freeze does not authorize implementation',r=>{
  mutate(r,'receipts.json',rs=>rs.splice(rs.findIndex(x=>x.kind==='implementation'),1));assert.equal(check(r,'freeze').state,'pass');blocked(check(r,'build'),'authority');
});
await test('agent-only concept selection is rejected',r=>{
  mutate(r,'receipts.json',rs=>rs.find(x=>x.kind==='selection').actor='agent');blocked(check(r,'selection'),'authority');
});
await test('stale selected candidate invalidates freeze',r=>{
  write(r,'concept.txt','Changed selected candidate');blocked(check(r,'freeze'),'stale-selection');
});
await test('freeze cannot omit a reconciliation row even with a new synthetic approval',r=>{
  mutate(r,'freeze.json',f=>f.reconciliation.pop());attest(r,'product-freeze',frozenHash(r));blocked(check(r,'freeze'),'reconciliation');
});
await test('forged old baseline is rejected',r=>{
  mutate(r,'baseline/definition.json',d=>d.journeys.pop());attest(r,'product-freeze',frozenHash(r));blocked(check(r,'freeze'),'authority');
});
await test('blocking owner decision prevents concepts',r=>{
  mutate(r,'definition.json',d=>d.decisions.push({owner:'product-owner',question:'Who may publish?',status:'open',blocks:['draft','freeze'],reason:'Unresolved authority',revisit:'Owner decision'}));refreshDraft(r);blocked(check(r),'decision');
});
await test('unsupported not-applicable state does not pass',r=>{
  mutate(r,'definition.json',d=>d.state_coverage[0]={id:'P-1/ready',disposition:'not-applicable',reason:'Too hard'});refreshDraft(r);blocked(check(r),'state-coverage');
});
await test('bounded refit can be excluded only by current scope acceptance',r=>{
  mutate(r,'scope.json',s=>Object.assign(s,{extent:'bounded-change',design_intent:'refit',exclusion_reason:'Presentation only',preserved_contract:'requirements.md',existing_method:'requirements.md',affected_surfaces:['P-1']}));blocked(check(r),'authority');
  attest(r,'scope',fingerprint(r,['scope.json','requirements.md']));assert.equal(check(r).applicability,'excluded');assert.equal(check(r).state,'pass');
});
await test('missing graft record blocks selection',r=>{
  mutate(r,'selection.json',p=>delete p.grafts);attest(r,'selection',fingerprint(r,['selection.json','concept.txt','baseline/definition.json']),'synthetic-A');blocked(check(r,'selection'),'selection');
});
await test('incomplete baseline cannot pass with refreshed synthetic receipts',r=>{
  mutate(r,'baseline/definition.json',d=>d.journeys.pop());refreshDraft(join(r,'baseline'));
  const baselineHash=hash(readFileSync(join(r,'baseline/definition.json')));
  mutate(r,'selection.json',p=>p.baseline_sha256=baselineHash);
  attest(r,'selection',fingerprint(r,['selection.json','concept.txt','baseline/definition.json']),'synthetic-A');
  attest(r,'baseline-review',baselineHash);attest(r,'product-freeze',frozenHash(r));blocked(check(r,'freeze'),'baseline');
});
await test('exclusion requires owner and boundary',r=>{
  mutate(r,'scope.json',s=>{Object.assign(s,{extent:'bounded-change',design_intent:'refit',exclusion_reason:'Presentation only',preserved_contract:'requirements.md',existing_method:'requirements.md',affected_surfaces:['P-1']});delete s.owner;delete s.boundary;});
  attest(r,'scope',fingerprint(r,['scope.json','requirements.md']));blocked(check(r),'scope');
});
await test('exclusion invalidated when preserved contract changes',r=>{
  mutate(r,'scope.json',s=>Object.assign(s,{extent:'bounded-change',design_intent:'refit',exclusion_reason:'Presentation only',preserved_contract:'requirements.md',existing_method:'requirements.md',affected_surfaces:['P-1']}));
  attest(r,'scope',fingerprint(r,['scope.json','requirements.md']));assert.equal(check(r).state,'pass');write(r,'requirements.md','Changed preserved behavior');blocked(check(r),'authority');
});
await test('stable IDs with dots and slashes work through diagram node aliases',r=>{
  const d=read(r,'definition.json');
  for(const st of d.states) if(st.id==='S-1') st.id='S.ready';
  for(const i of d.interactions) {if(i.from==='S-1')i.from='S.ready';if(i.to==='S-1')i.to='S.ready';if(i.id==='I-1')i.id='I/save';}
  for(const j of d.journeys) {j.steps=j.steps.map(x=>x==='I-1'?'I/save':x);j.diagram_nodes={state1:'S.ready',state2:'S-2'};}
  for(const c of d.state_coverage)c.states=c.states.map(x=>x==='S-1'?'S.ready':x);
  write(r,'definition.json',d);mutate(r,'scope.json',s=>{s.expected.states=['S.ready','S-2'];s.expected.interactions=['I/save','I-2'];});
  write(r,'save.mmd','flowchart LR\nstate1 -->|I/save| state2\n');write(r,'deny.mmd','flowchart LR\nstate1 -->|I-2| state1\n');
  attest(r,'scope',fingerprint(r,['scope.json']));attest(r,'drafting',fingerprint(r,['scope.json']));refreshDraft(r);assert.equal(check(r).state,'pass');
});
await test('unknown applicability fails closed',r=>{
  mutate(r,'scope.json',s=>delete s.extent);blocked(check(r),'shape');
});
await test('existing shipped design gate passes a design file with no definition',r=>{
  write(r,'blueprint.yml','variant: greenfield\n');
  const before=deriveStageStatus({root:r}).stages.find(s=>s.id===2);assert.equal(before.complete,false);
  write(r,'DESIGN.md','# Not in accepted directory\n');
  // Existing check searches docs/research/prototype, not root.
  mkdirSync(join(r,'prototype'));
  write(r,'prototype/DESIGN.md','# Visual direction\nBlue headings and clean whitespace.\n');
  const after=deriveStageStatus({root:r}).stages.find(s=>s.id===2);assert.equal(after.complete,true);
  results.push({name:'current gate evidence',result:'OBSERVED',stage:after,limit:'Individual Design Principles gate, not full pipeline advancement'});
});
await test('real stage engine blocks missing definition, stale prior evidence, and assertion bypass',async r=>{
  // Expose the private registry only in a temporary copy; production source stays untouched.
  cpSync(join(here,'../../template/tools/lib'),join(r,'engine'),{recursive:true});
  const engine=join(r,'engine/stage-model.mjs');
  writeFileSync(engine,readFileSync(engine,'utf8')+'\nexport { CHECK_KINDS };\n');
  const {CHECK_KINDS,deriveStageStatus,recordAdvance}=await import(pathToFileURL(engine).href);
  const kind='application-definition-research-only';
  CHECK_KINDS[kind]=(p,c)=>{const v=evaluate(c.root,p.phase,syntheticAuthority);return {state:v.state,evidence:v.errors.map(e=>e.detail).join('; ')||'Synthetic contract accepted'};};
  try {
    write(r,'model.json',{variant:'research-test-only',stages:[
      {id:0,name:'Draft definition',gates:[{id:'definition-draft',derivable:true,kind,params:{phase:'draft'}}]},
      {id:1,name:'Concept selection',gates:[{id:'definition-selection',derivable:true,kind,params:{phase:'selection'}}]},
      {id:2,name:'Requirements freeze',gates:[{id:'definition-freeze',derivable:true,kind,params:{phase:'freeze'}}]},
      {id:3,name:'Blind validation',gates:[{id:'validation-result',derivable:false,kind:'manual',params:{evidence:'Existing validation remains separate'}}]},
      {id:4,name:'Implementation authorization',gates:[{id:'definition-build',derivable:true,kind,params:{phase:'build'}}]},
    ]});
    write(r,'blueprint.yml','stage_model: model.json\n');
    assert.equal(deriveStageStatus({root:r}).cursor,2);
    const good=await recordAdvance({root:r,asserts:{'validation-result':'Synthetic test only'},execute:true});assert.equal(good.ok,true);assert.equal(good.cursor,4);
    mutate(r,'definition.json',d=>d.journeys.pop());refreshDraft(r);
    assert.equal(deriveStageStatus({root:r}).cursor,-1);
    const bad=await recordAdvance({root:r,asserts:{'definition-draft':'Looks complete'},execute:true});assert.equal(bad.ok,false);
    assert(bad.blocking.some(b=>b.gate==='definition-draft'));
    assert.equal(read(r,'.blueprint/stage-state.json').cursor,4,'Historical receipt preserved, current derivation is blocked');
  } finally {delete CHECK_KINDS[kind];}
});
const checkedAt = new Date().toISOString();
const report={date:checkedAt.slice(0,10),checked_at:checkedAt,status:'research-prototype-only',results,limitations:['Synthetic authority adapter only; no real human acceptance','Miniature fixture tests mechanics, not complete application semantics','No distributed gate, schema, command, consumer change or rollout'],sources:Object.fromEntries(['gate.mjs','fixture.mjs','probe.mjs','../../template/tools/lib/stage-model.mjs'].map(p=>[p,hash(readFileSync(join(here,p)))]))};
writeFileSync(join(here,'checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(`PASS: ${results.filter(r=>r.result==='PASS').length} controls; current gate coverage limit reproduced; research-only checks.json written.`);
