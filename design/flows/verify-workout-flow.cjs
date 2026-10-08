// Semantic smoke checks for the local design prototype; no browser or backend required.
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const assert=require('assert');

const elements=new Map();
const element=id=>{
  if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',style:{},scrollTop:0});
  return elements.get(id);
};
const location={hash:'',search:'',href:''};
const context={document:{getElementById:element,addEventListener(){}},location,window:{location},addEventListener(){},setInterval,clearInterval,setTimeout,clearTimeout,structuredClone,URLSearchParams,console};
vm.createContext(context);
const source=fs.readFileSync(path.join(__dirname,'workout-flow.js'),'utf8');
vm.runInContext(source+'\nthis.verify={jumpToFrame,jumpToState,handleAction,state,total,segments,render};',context);
const {jumpToFrame,jumpToState,handleAction,state,total,segments}=context.verify;
const action=(name,value)=>handleAction({dataset:{action:name,value}});

for(const screen of ['detail','simple','pro','reason','params','loading','proposals','diff','confirm','success']){
  jumpToFrame(screen);
  assert(element('screen').innerHTML.length>100,`${screen} did not render`);
}

jumpToFrame('detail');action('start-manual');action('set-duration','45');
assert.equal(total(state.draft),45);
assert.equal(state.draft.warmup+state.draft.steady+state.draft.cooldown,45);
action('preview');action('validate');action('apply');
assert.equal(state.version,8);assert.equal(total(state.formal),45);assert.equal(state.weeklyMinutes,240);

jumpToFrame('proposals');action('select-preview');action('validate');action('apply');
assert.equal(state.version,8);assert.equal(total(state.formal),35);assert.equal(state.weeklyMinutes,230);
action('restore');action('validate');action('apply');
assert.equal(state.version,9);assert.equal(total(state.formal),60);assert.equal(state.weeklyMinutes,255);
assert.equal(state.history.length,3);

jumpToFrame('pro');assert.equal(total(state.draft),60);
assert.equal(segments(state.draft).filter(part=>part.zone==='Z3').length,2);
action('preview');action('validate');
assert.equal(state.screen,'diff');assert(state.validationError.includes('训练目的'));

jumpToFrame('detail');action('start-manual');action('to-pro');
action('add-interval');action('duplicate-interval');
assert.equal(state.draft.intervalCount,2);assert.equal(state.draft.steady,31);assert.equal(total(state.draft),60);
action('ack-purpose');action('preview');action('validate');action('apply');
assert.equal(state.version,8);assert.equal(state.formal.intervalCount,2);assert.equal(state.weeklyMinutes,255);

jumpToState('invalid');action('preview');action('validate');
assert.equal(state.screen,'diff');assert(state.validationError.includes('区段合计'));

jumpToState('network');action('apply');
assert.equal(state.version,7);assert.equal(state.applyError,'');
action('apply');assert.equal(state.version,8);

console.log('Verified 10 frames, calculations, manual/AI apply, warnings, network retry, and version recovery.');
