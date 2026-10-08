// Interaction wiring for the copied T01 entry. The preserved standalone page is untouched.
const query=new URLSearchParams(location.search);
const requestedMinutes=Number(query.get('duration')||60);
const version=Number(query.get('version')||7);
const weekly=Number(query.get('weekly')||255);
const fallbackMode=query.get('mode')==='recovery'?'recovery':'endurance';
const workout={warmup:requestedMinutes===60?10:5,steady:requestedMinutes===60?45:requestedMinutes-10,cooldown:5,intervalCount:0,work:4,recovery:3,intervalFirst:true,mode:fallbackMode,keepPurpose:true,difficulty:'适中'};
try{
  const supplied=JSON.parse(query.get('workout')||'null');
  if(supplied&&typeof supplied==='object'){
    for(const key of ['warmup','steady','cooldown','intervalCount','work','recovery']){
      if(Number.isFinite(supplied[key])&&supplied[key]>=0&&supplied[key]<=300)workout[key]=supplied[key];
    }
    if(['endurance','recovery'].includes(supplied.mode))workout.mode=supplied.mode;
    if(typeof supplied.intervalFirst==='boolean')workout.intervalFirst=supplied.intervalFirst;
    if(typeof supplied.keepPurpose==='boolean')workout.keepPurpose=supplied.keepPurpose;
    if(['轻松','适中','较难'].includes(supplied.difficulty))workout.difficulty=supplied.difficulty;
  }
}catch(_){}
const duration=workout.warmup+workout.steady+workout.cooldown+workout.intervalCount*(workout.work+workout.recovery);
const title=workout.mode==='recovery'?'轻松恢复骑行':workout.intervalCount&&!workout.keepPurpose?'节奏骑行':'耐力骑行';
const purpose=workout.mode==='recovery'?'恢复活动':workout.intervalCount&&!workout.keepPurpose?'节奏能力':'有氧基础';
const steadyZone=workout.mode==='recovery'?'Z1':workout.difficulty==='较难'?'Z3':'Z2';
const parts=[{name:'热身',minutes:workout.warmup,zone:'Z1'}];
const intervalParts=[];
for(let index=0;index<workout.intervalCount;index++)intervalParts.push({name:`第 ${index+1} 组工作`,minutes:workout.work,zone:'Z3'},{name:`第 ${index+1} 组恢复`,minutes:workout.recovery,zone:'Z1'});
const steadyPart={name:workout.mode==='recovery'?'轻松骑行':'稳定骑行',minutes:workout.steady,zone:steadyZone};
if(workout.intervalFirst)parts.push(...intervalParts,steadyPart);else parts.push(steadyPart,...intervalParts);
parts.push({name:'放松',minutes:workout.cooldown,zone:'Z1'});
const prettyTime=`${Math.floor(weekly/60)} 小时 ${String(weekly%60).padStart(2,'0')} 分钟`;
const card=document.querySelector('.workout');
document.querySelector('.summary .count b').textContent=prettyTime;
card.querySelector('h3').textContent=title;
card.querySelector('.workout-desc').textContent=workout.mode==='recovery'?'今天以轻松活动为主；根据实际感受决定是否执行。':workout.intervalCount?'按工作与恢复区段完成节奏训练，注意每组之间的感受。':'以稳定节奏建立有氧基础，保持能完整说话的强度。';
card.querySelector('.workout-type').innerHTML=`<i></i>${purpose} · 正式计划 v${version}`;
const metrics=card.querySelectorAll('.metrics .m b');
metrics[0].textContent=duration;
metrics[1].textContent=steadyZone;
const chart=card.querySelector('svg.chart');
chart.setAttribute('aria-label',`${parts.map(part=>`${part.name} ${part.minutes} 分钟 ${part.zone}`).join('，')}，总计 ${duration} 分钟`);
let x=0;
const blocks=parts.map(part=>{
  const width=part.minutes/duration*316;
  const y={Z1:57,Z2:36,Z3:22}[part.zone];
  const fill={Z1:'#777f78',Z2:'#658a70',Z3:'#c9b783'}[part.zone];
  const rect=`<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0,width-.5).toFixed(1)}" height="${68-y}" fill="${fill}" opacity=".75"/>`;
  x+=width;return rect;
}).join('');
chart.innerHTML=`<path d="M0 17H316M0 43H316M0 68H316" stroke="#343c34" stroke-dasharray="3 4"/>${blocks}<path d="M0 69H316" stroke="#5a655c"/>`;
const notes=card.querySelectorAll('.chart-note span');
notes[0].innerHTML=`<strong>${workout.warmup} 分钟</strong> 热身`;
notes[1].innerHTML=workout.intervalCount?`<strong>${workout.intervalCount} 组间歇</strong> + ${workout.steady} 分钟稳定骑行`:`<strong>${workout.steady} 分钟</strong> ${workout.mode==='recovery'?'轻松骑行':'稳定骑行'}`;
notes[2].innerHTML=`<strong>${workout.cooldown} 分钟</strong> 放松`;
const target=frame=>`workout-flow.html?${query.toString()}#frame-${frame}`;
card.querySelector('.workout-actions .primary').addEventListener('click',()=>{location.href=target('01')});
card.querySelector('.workout-actions .secondary').addEventListener('click',()=>{location.href=target('04')});
document.querySelectorAll('.tabbar .tab').forEach((button,index)=>{
  if(index===1)return;
  button.addEventListener('click',()=>{location.href=`../screens/five-tabs-prototype.html#${['home','training','nutrition','coach','profile'][index]}`});
});
