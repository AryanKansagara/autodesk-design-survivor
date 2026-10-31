import test from 'node:test';import assert from 'node:assert/strict';
import {base,evaluate,sweep,topological} from './contract.mjs';
test('valid authored bracket passes named and fragile strategy at base dimensions',()=>{
 for(const strategy of ['named','face-index']){const r=evaluate(base,{strategy});assert.equal(r.status,'healthy');assert.equal(r.features.length,5);assert.equal(r.firstFailure,null);assert.equal(r.fusionIntegration,false);}
});
test('reference contract failure identifies earliest feature and blocks downstream checks',()=>{
 const r=evaluate({...base,thickness:8},{strategy:'face-index'});assert.equal(r.firstFailure,'hole-reference');
 assert.equal(r.features.find(f=>f.id==='holes').status,'blocked');assert.equal(evaluate({...base,thickness:8}).status,'healthy');
});
test('edge and fillet violations expose dependency context',()=>{
 const edge=evaluate({...base,holeDiameter:12,edgeDistance:4});assert.equal(edge.firstFailure,'holes');assert.deepEqual(edge.features.find(f=>f.id==='fillet').blockedBy,['holes']);
 assert.equal(evaluate({...base,fillet:3}).firstFailure,'fillet');
});
test('outside intent and invalid numeric inputs are unassessed rather than healthy',()=>{
 for(const parameters of [{...base,width:100},{...base,thickness:0},{...base,width:NaN},{...base,width:Infinity},{...base,width:'40'},{...base,extra:1},{}]){const r=evaluate(parameters);assert.equal(r.status,'out_of_scope');assert.deepEqual(r.features,[]);}
});
test('unknown group remains unknown; warning-clearing topology change fails independent contract',()=>{
 assert.equal(evaluate(base,{includeUnknownGroup:true}).status,'unknown');const r=evaluate(base,{omitHoles:true});assert.equal(r.firstFailure,'topology-contract');assert.equal(r.features.find(f=>f.id==='fillet').status,'healthy');
});
test('invalid contract option types are rejected rather than treated as booleans',()=>{
 assert.throws(()=>evaluate(base,{omitHoles:'false'}));assert.throws(()=>evaluate(base,{includeUnknownGroup:1}));assert.throws(()=>evaluate(base,{strategy:'guess'}));
});
test('dependency graph rejects cycles, missing references, duplicate identities',()=>{
 assert.throws(()=>topological([{id:'a',dependencies:['b']},{id:'b',dependencies:['a']}]));
 assert.throws(()=>topological([{id:'a',dependencies:['b']}]));assert.throws(()=>topological([{id:'a',dependencies:[]},{id:'a',dependencies:[]}]));
 assert.deepEqual(topological([{id:'b',dependencies:['a']},{id:'a',dependencies:[]}]).map(n=>n.id),['a','b']);
});
test('fixed sweep replays byte-deterministically, preserves input, and includes adverse controls',()=>{
 const before=JSON.stringify(base),a=sweep(),b=sweep();assert.deepEqual(a,b);assert.equal(JSON.stringify(base),before);assert.equal(a.runs.length,16);
 assert.ok(a.summary.named.healthy>a.summary['face-index'].healthy);assert.equal(a.negativeControls.warningClearingBadRepair.status,'failed');
 assert.equal(evaluate(base).fingerprint,evaluate(Object.fromEntries(Object.entries(base).reverse())).fingerprint);
});
