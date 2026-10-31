/** Authored scalar/dependency contract, never CAD geometry or Fusion rebuilds. */
import {createHash} from 'node:crypto';
export const ranges={width:[20,80],height:[20,80],thickness:[2,10],holeDiameter:[2,16],edgeDistance:[2,20],fillet:[0,8]};
export const base={width:40,height:40,thickness:4,holeDiameter:6,edgeDistance:8,fillet:1};
export function topological(nodes) {
 const map=new Map(nodes.map(n=>[n.id,n]));
 if(map.size!==nodes.length)throw Error('duplicate feature identity');
 const visiting=new Set(),done=new Set(),ordered=[];
 function visit(id){if(done.has(id))return;if(visiting.has(id))throw Error('dependency cycle');const n=map.get(id);if(!n)throw Error('missing dependency');visiting.add(id);for(const d of n.dependencies)visit(d);visiting.delete(id);done.add(id);ordered.push(n);}
 for(const node of nodes)visit(node.id);return ordered;
}
export function evaluate(parameters,{strategy='named',omitHoles=false,includeUnknownGroup=false}={}) {
 if(!['named','face-index'].includes(strategy))throw Error('unknown reference strategy');
 if(typeof omitHoles!=='boolean'||typeof includeUnknownGroup!=='boolean')throw Error('boolean contract options required');
 const violations=[];
 for(const [key,[lo,hi]] of Object.entries(ranges)) {
  const v=parameters?.[key];if(!Number.isFinite(v)||v<lo||v>hi)violations.push({parameter:key,reason:`requires finite value in [${lo},${hi}]`});
 }
 for(const key of Object.keys(parameters??{}))if(!Object.hasOwn(ranges,key))violations.push({parameter:key,reason:'undeclared parameter'});
 const configuration={contractVersion:'authored-bracket-v1',parameters:parameters&&Object.fromEntries(Object.entries(parameters).sort(([a],[b])=>a.localeCompare(b))),strategy,omitHoles,includeUnknownGroup};
 const fingerprint=createHash('sha256').update(JSON.stringify(configuration)).digest('hex');
 const common={...configuration,fingerprint,provenance:'authored symbolic design contract; no geometric kernel',fusionIntegration:false};
 if(violations.length)return {...common,status:'out_of_scope',violations,features:[],firstFailure:null};
 const p=parameters;
 const nodes=[
  {id:'base',dependencies:[],check:()=>({status:p.width>=2*p.thickness&&p.height>=2*p.thickness?'healthy':'failed',reason:'stock width and height at least twice thickness'})},
  {id:'hole-reference',dependencies:['base'],check:()=>({status:strategy==='face-index'&&p.thickness>6?'failed':'healthy',reason:strategy==='face-index'?'authored unstable face-index threshold at thickness > 6':'authored named reference assumption'})},
  {id:'holes',dependencies:['hole-reference'],check:()=>({status:p.edgeDistance>=p.holeDiameter/2+1&&p.width-2*p.edgeDistance>=p.holeDiameter+1&&p.height>=p.holeDiameter+2?'healthy':'failed',reason:'authored edge margin and two-hole spacing constraints'})},
  {id:'fillet',dependencies:['holes'],check:()=>({status:p.fillet<=Math.min(p.thickness/2,p.edgeDistance-p.holeDiameter/2)?'healthy':'failed',reason:'authored fillet clearance bound'})},
  {id:'topology-contract',dependencies:['fillet'],check:()=>({status:omitHoles?'failed':'healthy',reason:omitHoles?'repair omitted required two holes':'authored expected hole count preserved',expectedHoles:2,declaredHoles:omitHoles?0:2})},
 ];
 if(includeUnknownGroup)nodes.push({id:'timeline-group',dependencies:[],check:()=>({status:'unknown',reason:'group health is not observed'})});
 const features=[],state=new Map();
 for(const n of topological(nodes)){
  const blocked=n.dependencies.filter(id=>state.get(id)!=='healthy');
  const outcome=blocked.length?{status:'blocked',reason:'upstream contract did not pass',blockedBy:blocked}:n.check();
  state.set(n.id,outcome.status);features.push({id:n.id,dependencies:n.dependencies,...outcome});
 }
 const firstFailure=features.find(f=>f.status==='failed')?.id??null;
 return {...common,status:firstFailure?'failed':features.some(f=>f.status==='unknown'||f.status==='blocked')?'unknown':'healthy',violations,features,firstFailure};
}
export function sweep() {
 const runs=[];
 for(const thickness of [4,8])for(const edgeDistance of [4,8])for(const holeDiameter of [6,12])for(const strategy of ['face-index','named']) {
  runs.push(evaluate({...base,thickness,edgeDistance,holeDiameter},{strategy}));
 }
 return {schemaVersion:1,claim:'authored contract evaluation only; no Fusion, B-rep, geometric rebuild, manufacturability or reference repair validation',runs,summary:Object.fromEntries(['face-index','named'].map(strategy=>{const rows=runs.filter(r=>r.strategy===strategy);return [strategy,{cases:rows.length,healthy:rows.filter(r=>r.status==='healthy').length,failed:rows.filter(r=>r.status==='failed').length}];})),negativeControls:{outOfIntent:evaluate({...base,width:100}),unknownGroup:evaluate(base,{includeUnknownGroup:true}),warningClearingBadRepair:evaluate(base,{omitHoles:true})}};
}
