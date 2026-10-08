const FRAME_META = [
  ['detail', '训练课程详情'],
  ['simple', '手动编辑 · 简洁视图'],
  ['pro', '手动编辑 · 专业视图'],
  ['reason', 'AI 调整原因选择'],
  ['params', 'AI 参数补充'],
  ['loading', 'AI 生成中'],
  ['proposals', 'AI 调整方案'],
  ['diff', '训练计划差异对比'],
  ['confirm', '确认应用'],
  ['success', '应用成功']
];
const BASE = {
  date: '2026-10-08', time: '', scene: '户外', difficulty: '适中',
  keepPurpose: true, mode: 'endurance', warmup: 10, steady: 45, cooldown: 5, targetDuration: 60,
  intervalCount: 0, work: 4, recovery: 3, workRpe: 6, workPower: 150,
  intervalFirst: true, powerMode: 'rpe'
};
const state = {
  screen: 'detail', detailView: 'simple', formal: structuredClone(BASE),
  version: 7, weeklyMinutes: 255, draft: null, draftSource: 'manual',
  returnScreen: 'simple', dirty: false, sheet: '', toast: '',
  reason: 'time', available: 35, customAvailable: '', fatigue: '一般',
  symptom: '无明显不适', indoor: '未知', moveDate: '',
  otherText: '', loadingStage: 0, loadingError: false, loadingTimer: null,
  candidateIndex: 0, scope: 'single', validated: false, validationError: '',
  applyError: '', failNextApply: false, hasFtp: false, restoring: false,
  history: [{version: 7, workout: structuredClone(BASE)}]
};
const screenEl = document.getElementById('screen');
const actionEl = document.getElementById('action-bar');
const overlayEl = document.getElementById('overlay-root');
const frameListEl = document.getElementById('frame-list');
const stateListEl = document.getElementById('state-list');
const ftpToggleEl = document.getElementById('ftp-toggle');
const frameCaptionEl = document.getElementById('frame-caption');
let suppressHashChange = false;
let toastTimer = null;

function clone(value){ return structuredClone(value); }
function esc(value){ return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function pad(number){ return String(number).padStart(2,'0'); }
function dateLabel(date){ const parts=date.split('-'); return `${Number(parts[1])} 月 ${Number(parts[2])} 日`; }
function total(workout){ return workout.warmup + workout.steady + workout.cooldown + workout.intervalCount * (workout.work + workout.recovery); }
function purpose(workout){
  if(workout.mode === 'recovery') return '恢复活动';
  if((workout.intervalCount > 0 || workout.difficulty === '较难') && !workout.keepPurpose) return '节奏能力';
  return '有氧基础';
}
function workoutTitle(workout){
  if(workout.mode==='recovery')return '轻松恢复骑行';
  if(workout.intervalCount>0&&!workout.keepPurpose)return '节奏骑行';
  return '耐力骑行';
}
function zoneOfSteady(workout){ return workout.mode === 'recovery' ? 'Z1' : workout.difficulty === '较难' ? 'Z3' : 'Z2'; }
function segments(workout){
  const result = [{label:'热身', minutes:workout.warmup, zone:'Z1'}];
  const intervals=[];
  for(let i=0;i<workout.intervalCount;i++){
    intervals.push({label:`第 ${i+1} 组工作`,minutes:workout.work,zone:'Z3'});
    intervals.push({label:`第 ${i+1} 组恢复`,minutes:workout.recovery,zone:'Z1'});
  }
  const steady = {label:workout.mode === 'recovery'?'轻松骑行':'稳定骑行',minutes:workout.steady,zone:zoneOfSteady(workout)};
  if(workout.intervalFirst) result.push(...intervals,steady);
  else result.push(steady,...intervals);
  result.push({label:'放松',minutes:workout.cooldown,zone:'Z1'});
  return result.filter(segment=>segment.minutes>0);
}
function segmentSummary(workout){
  if(workout.intervalCount){
    return `${workout.warmup} 分钟热身 · ${workout.intervalCount} 组 ${workout.work}+${workout.recovery} 分钟间歇 · ${workout.steady} 分钟稳定骑行 · ${workout.cooldown} 分钟放松`;
  }
  return `${workout.warmup} 分钟热身 · ${workout.steady} 分钟${workout.mode==='recovery'?'轻松骑行':'稳定骑行'} · ${workout.cooldown} 分钟放松`;
}
function chart(workout, compact=false){
  const parts=segments(workout);
  const sum=Math.max(1,total(workout));
  let x=15;
  const colors={Z1:'#818981',Z2:'#91ad99',Z3:'#c9b783'};
  const heights={Z1:26,Z2:48,Z3:72};
  const rects=parts.map(part=>{
    const width=part.minutes/sum*290;
    const height=heights[part.zone];
    const item=`<rect x="${x.toFixed(1)}" y="${(90-height).toFixed(1)}" width="${Math.max(0,width-.5).toFixed(1)}" height="${height}" rx="1.5" fill="${colors[part.zone]}" opacity=".76"/>`;
    x+=width;return item;
  }).join('');
  const label=parts.map(part=>`${part.label} ${part.minutes} 分钟 ${part.zone}`).join('，');
  return `<svg class="chart-svg" viewBox="0 0 320 110" role="img" aria-label="${esc(label)}，总计 ${sum} 分钟">
    <path d="M15 18H305M15 43H305M15 68H305M15 91H305" stroke="#3a423a" stroke-dasharray="3 4"/>
    ${rects}<text x="15" y="106" fill="#858d84" font-size="10">0</text><text x="305" y="106" fill="#858d84" font-size="10" text-anchor="end">${sum} 分钟</text>
  </svg>${compact?'':`<div class="chart-legend"><span><i class="legend-dot z1"></i>Z1 轻松</span><span><i class="legend-dot z2"></i>Z2 稳定</span>${parts.some(part=>part.zone==='Z3')?'<span><i class="legend-dot z3"></i>Z3 节奏</span>':''}</div>`}`;
}
function header(number,title,subtitle='',action=''){
  return `<header class="app-header"><button class="back" data-action="back" aria-label="返回">‹</button><div class="header-copy"><small>${esc(subtitle||'训练计划')}</small><h1>${esc(title)}</h1></div>${action?`<button class="header-action" data-action="${action}">保存草稿</button>`:''}</header>`;
}
function sectionTitle(title,detail=''){ return `<div class="section-head"><h2>${title}</h2>${detail?`<small>${detail}</small>`:''}</div>`; }
function buttonBar(primary,primaryAction,secondary='',secondaryAction=''){
  return secondary?`<button class="secondary" data-action="${secondaryAction}">${secondary}</button><button class="primary" data-action="${primaryAction}">${primary}</button>`:`<button class="primary" data-action="${primaryAction}">${primary}</button>`;
}
function notice(kind,text){ return `<div class="notice ${kind}"><span class="mark">${kind==='danger'?'!':kind==='warn'?'△':'✓'}</span><span>${text}</span></div>`; }
function row(label,value){ return `<div class="data-row"><span>${label}</span><strong>${value}</strong></div>`; }
function hasPurposeMismatch(workout){return (workout.intervalCount>0 || workout.difficulty==='较难') && workout.keepPurpose && workout.mode!=='recovery';}
function validationMessages(workout){
  const errors=[];
  if(workout.warmup<5 || workout.cooldown<5) errors.push('热身与放松各需至少 5 分钟。');
  if(workout.steady<0) errors.push('间歇区段已超过课程总时长，请缩短组数或每组时间。');
  if(total(workout)>workout.targetDuration) errors.push(`区段合计 ${total(workout)} 分钟，超过设置的 ${workout.targetDuration} 分钟。`);
  if(workout.intervalCount>0 && (workout.work<1 || workout.recovery<1)) errors.push('工作与恢复区段必须有有效时长。');
  if(total(workout)<15) errors.push('课程过短，无法安排完整结构。');
  if(['2026-10-09','2026-10-10'].includes(workout.date)) errors.push(`${dateLabel(workout.date)}已有其他骑行课程，需要重新安排冲突。`);
  else if(workout.date!==state.formal.date) errors.push('新日期的可用时段尚未确认，请先补充时间安排后再应用。');
  if(hasPurposeMismatch(workout)) errors.push('新增节奏间歇后，不能继续把训练目的标为纯有氧基础。');
  if(workout.powerMode==='power' && (!state.hasFtp || workout.workPower<60 || workout.workPower>300)) errors.push('目标功率缺少可靠依据或超出示例校验范围。');
  return errors;
}
function inCurrentWeek(date){return date>='2026-10-05' && date<='2026-10-11';}
function weekAfter(workout){return state.weeklyMinutes - (inCurrentWeek(state.formal.date)?total(state.formal):0) + (inCurrentWeek(workout.date)?total(workout):0);}
function draftOrFormal(){return state.draft || state.formal;}
function markEdited(){state.dirty=true;if(state.draftSource==='ai')state.draftSource='ai-edited';}
function setToast(message){
  state.toast=message;renderOverlay();
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>{state.toast='';renderOverlay();},2600);
}
function clearLoading(){ if(state.loadingTimer){clearInterval(state.loadingTimer);state.loadingTimer=null;} }
function hashFor(screen){return `#frame-${pad(FRAME_META.findIndex(([id])=>id===screen)+1)}`;}
function trainingUrl(){
  const query=new URLSearchParams({duration:String(total(state.formal)),version:String(state.version),weekly:String(state.weeklyMinutes),mode:state.formal.mode,workout:JSON.stringify(state.formal),history:JSON.stringify(state.history)});
  return `training-flow-entry.html?${query}`;
}
function navigate(screen){
  if(state.screen==='loading' && screen!=='loading') clearLoading();
  state.screen=screen;state.sheet='';render(true);
  const hash=hashFor(screen);
  if(location.hash!==hash){suppressHashChange=true;location.hash=hash;}
}

function renderDetail(){
  const w=state.formal;
  const mode=state.detailView;
  const pending=state.draft && !state.restoring?notice('warn','有一份未应用的修改草稿。当前课程仍按正式计划展示。'):'';
  return `${header(1,'训练课程详情',`${dateLabel(w.date)} · 正式计划 v${state.version}`)}
    ${pending}<section class="surface card-pad" style="margin-top:${pending?'12px':'0'}"><span class="pill green"><i></i>正式计划</span><h2 class="title-lg">${workoutTitle(w)}</h2><p class="body-copy">${w.mode==='recovery'?'今天以轻松活动为主；根据实际感受决定是否执行。':w.intervalCount?'训练包含节奏工作与恢复区段，按目标强度完成每组。':'以稳定节奏建立有氧基础，保持能完整说话的强度。'}</p><div class="metric-row"><strong>${total(w)}</strong><span>分钟</span><small>主要强度 ${zoneOfSteady(w)}</small></div><div class="facts"><div class="fact"><small>训练目标</small><strong>${purpose(w)}</strong></div><div class="fact"><small>强度依据</small><strong>${state.hasFtp?'FTP 186 W':w.mode==='recovery'?'RPE 1–2 / 10':'RPE 3–4 / 10'}</strong></div></div></section>
    ${sectionTitle('课程呈现','同一份区段数据')}<div class="segmented"><button data-action="detail-view" data-value="simple" class="${mode==='simple'?'active':''}">简洁视图</button><button data-action="detail-view" data-value="pro" class="${mode==='pro'?'active':''}">专业视图</button></div>
    <div class="chart-card" style="margin-top:12px"><div class="chart-title"><strong>功率 / 强度区间图</strong><span>横轴 · 时长</span></div>${chart(w)}<p class="small-note">${state.hasFtp?'强度区间依据 9 月 16 日手动测试的 FTP 186 W；具体目标仍以课程设定为准。':'FTP 未录入；此图以主观强度和相对区间呈现，不代表具体瓦数。'}</p></div>
    ${mode==='simple'?`<div class="surface card-pad" style="margin-top:12px"><strong style="font-size:14px">这节课怎么骑</strong><p class="body-copy" style="margin-top:7px">热身 10 分钟 → 稳定骑行 45 分钟 → 放松 5 分钟。</p><p class="small-note">Z1 为轻松强度，Z2 为能完整说话的稳定节奏。</p></div>`:`<div class="surface card-pad" style="margin-top:12px"><strong style="font-size:14px">训练区段</strong><div class="segment-list">${segments(w).map(part=>`<div class="segment-line"><strong>${part.label}</strong><span>${part.minutes} 分钟 · ${part.zone}</span></div>`).join('')}</div><p class="small-note">RPE 是主观用力程度（1–10）。区段时长之和为 ${total(w)} 分钟。</p></div>`}
    ${sectionTitle('课程安排')}<div class="surface card-pad">${row('训练日期 / 时区',`${dateLabel(w.date)} · 中国标准时间`)}${row('开始时间',w.time||'未指定')}${row('训练方式',`${w.scene}骑行`)}</div>
    ${sectionTitle('执行提醒')}<div class="surface card-pad"><p class="body-copy">根据当天路况与个人感受调整节奏。若出现胸痛、晕厥或明显伤病，请停止训练并寻求专业医疗帮助。</p></div>
    <p class="small-note">已完成训练的实际记录独立保存，修改计划不会覆盖记录。</p>`;
}
function renderSimple(){
  const w=draftOrFormal();
  const warnings=validationMessages(w);
  const durations=[35,45,60,75];
  return `${header(2,'手动编辑','简洁视图 · 未应用草稿','save-draft')}
    <div class="surface card-pad"><span class="pill"><i></i>草稿 · 正式计划未变</span><h2 class="title-lg">${workoutTitle(w)}</h2><p class="body-copy">先改最重要的条件，训练结构会同步更新。</p></div>
    ${sectionTitle('训练时长',`当前 ${total(w)} 分钟`)}<div class="choice-grid">${durations.map(minutes=>`<button class="choice ${total(w)===minutes?'active':''}" data-action="set-duration" data-value="${minutes}">${minutes} 分钟</button>`).join('')}</div>
    <div class="field-grid"><div><label class="form-label" for="workout-date">训练日期</label><input class="input" id="workout-date" data-field="date" type="date" value="${esc(w.date)}"></div><div><label class="form-label" for="workout-time">开始时间（可选）</label><input class="input" id="workout-time" data-field="time" type="time" value="${esc(w.time)}"></div></div><p class="field-hint">未指定开始时间时，仍需符合档案中的可训练时段。</p>
    <label class="form-label">这次想骑多难？</label><div class="choice-grid">${['轻松','适中','较难'].map(value=>`<button class="choice ${w.difficulty===value?'active':''}" data-action="set-difficulty" data-value="${value}">${value}</button>`).join('')}</div><p class="field-hint">「较难」可能改变原本的有氧训练目的，预览时会明确提示。</p>
    <label class="form-label">训练方式</label><div class="choice-grid">${['户外','室内'].map(value=>`<button class="choice ${w.scene===value?'active':''}" data-action="set-scene" data-value="${value}">${value}骑行</button>`).join('')}</div>
    <div class="switch-row"><span>尽量保留原训练目的</span><button class="switch ${w.keepPurpose?'on':''}" data-action="toggle-purpose" aria-label="${w.keepPurpose?'关闭':'开启'}保留训练目的" aria-pressed="${w.keepPurpose}"></button></div>
    ${sectionTitle('调整后的课程结构','实时更新')}<div class="chart-card"><div class="chart-title"><strong>${total(w)} 分钟 · ${purpose(w)}</strong><span>依据 RPE</span></div>${chart(w)}<p class="small-note">${esc(segmentSummary(w))}</p>${w.intervalCount?notice('warn','专业视图添加的间歇区段已保留；简洁视图仅显示概述。'):''}</div>
    ${warnings.length?`<div style="margin-top:12px">${notice('warn',esc(warnings[0]))}</div>`:''}`;
}
function stepper(label,key,value,min,max,detail=''){
  return `<div class="step-row"><div class="step-label"><strong>${label}</strong>${detail?`<small>${detail}</small>`:''}</div><div class="stepper"><button data-action="step" data-key="${key}" data-delta="-1" aria-label="减少${label}" ${value<=min?'disabled':''}>−</button><output>${value}</output><button data-action="step" data-key="${key}" data-delta="1" aria-label="增加${label}" ${value>=max?'disabled':''}>+</button></div></div>`;
}
function renderPro(){
  const w=draftOrFormal();
  const warnings=validationMessages(w);
  return `${header(3,'手动编辑','专业视图 · 同一份草稿','save-draft')}
    <div class="chart-card"><div class="chart-title"><strong>训练结构 · ${total(w)} 分钟</strong><span>编辑后实时更新</span></div>${chart(w)}<p class="small-note">${esc(segmentSummary(w))}</p></div>
    ${warnings.length?`<div style="margin-top:12px">${notice('warn',esc(warnings.join(' ')))}</div>`:''}
    ${sectionTitle('有序训练区段','可调整结构')}
    <div class="pro-block"><div class="pro-block-head"><strong>01 · 热身</strong><span>Z1 · RPE 2</span></div>${stepper('时长（分钟）','warmup',w.warmup,5,30)}</div>
    <div class="pro-block"><div class="pro-block-head"><strong>${w.intervalFirst?'02':'03'} · 间歇组</strong><span>工作 / 恢复</span></div>${stepper('组数','intervalCount',w.intervalCount,0,4,'0 组即不安排间歇')}${w.intervalCount?`${stepper('每组工作（分钟）','work',w.work,1,15)}${stepper('每组恢复（分钟）','recovery',w.recovery,1,10)}<div class="step-row"><div class="step-label"><strong>工作目标</strong><small>${w.powerMode==='power'?'绝对功率':'主观用力程度'}</small></div><span class="pill grey">${w.powerMode==='power'?`${w.workPower} W`:`RPE ${w.workRpe} / 10`}</span></div><div style="display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap"><button class="text-button" data-action="duplicate-interval">复制一组 +</button><button class="text-button" data-action="remove-interval">移除一组 −</button><button class="text-button" data-action="move-interval">${w.intervalFirst?'移到稳定段后':'移到稳定段前'} ↕</button></div>`:`<button class="text-button" data-action="add-interval">添加工作 / 恢复组 +</button>`}</div>
    <div class="pro-block"><div class="pro-block-head"><strong>${w.intervalFirst?'03':'02'} · 稳定骑行</strong><span>${zoneOfSteady(w)} · ${w.steady} 分钟</span></div><p class="field-hint">调整其他区段时，优先从本段增减时长；总时长始终由区段求和得出。</p></div>
    <div class="pro-block"><div class="pro-block-head"><strong>04 · 放松</strong><span>Z1 · RPE 2</span></div>${stepper('时长（分钟）','cooldown',w.cooldown,5,30)}</div>
    ${sectionTitle('强度目标','条件可用')}<div class="surface card-pad">${state.hasFtp?`<div class="segmented"><button data-action="power-mode" data-value="rpe" class="${w.powerMode==='rpe'?'active':''}">RPE</button><button data-action="power-mode" data-value="power" class="${w.powerMode==='power'?'active':''}">目标功率 W</button></div><p class="field-hint">示例依据：FTP 186 W，9 月 16 日手动测试。功率目标需与用户可测量的数据相符。</p>${w.powerMode==='power'?`<label class="form-label" for="work-power">每组工作目标功率</label><input class="input" id="work-power" data-field="workPower" type="number" min="60" max="300" value="${w.workPower}"><p class="field-hint">单位 W。恢复段示例目标为 RPE 2；需要功率目标时可进一步编辑。</p>`:stepper('工作区段 RPE','workRpe',w.workRpe,1,10)}`:`${notice('warn','当前档案未录入 FTP 或可靠功率依据，因此不预填瓦数。可用 RPE 编辑；具备功率数据后可切换至 W / %FTP 目标。')}${w.intervalCount?stepper('工作区段 RPE','workRpe',w.workRpe,1,10):''}`}</div>
    ${!state.hasFtp?'<button class="text-button" data-action="power-info">查看功率目标使用条件 →</button>':''}
    ${hasPurposeMismatch(w)?`<div style="margin-top:12px">${notice('warn','加入节奏间歇后，课程不再只是有氧基础。请明确接受训练目的变化，或移除间歇组。')}<button class="text-button" data-action="ack-purpose">接受目的改为「节奏能力」 →</button></div>`:''}`;
}
function renderReason(){
  const options=[['time','时间不够','缩短或调整今天的课程','◷'],['fatigue','身体疲劳','评估休息或降低强度','◇'],['weather','天气原因','查看室内替代或改期','☁'],['hard','强度过高','降低强度，保留合理结构','▤'],['other','其他原因','补充一句情况说明','⋯']];
  return `${header(4,'为什么要调整？','选择最贴近的一项')}
    <div class="surface card-pad"><span class="pill grey">当前课程</span><h2 style="font-size:18px;margin:9px 0 4px">耐力骑行 · ${total(state.formal)} 分钟</h2><p class="body-copy">选择原因后，只补充这次调整需要的信息。</p></div>
    ${sectionTitle('选择调整原因')}<div class="reason-list">${options.map(([id,title,sub,icon])=>`<button class="reason ${state.reason===id?'active':''}" data-action="reason" data-value="${id}"><span class="reason-icon">${icon}</span><span class="reason-copy"><strong>${title}</strong><small>${sub}</small></span><span class="reason-check">${state.reason===id?'✓':'›'}</span></button>`).join('')}</div>
    <p class="small-note">自由文字仅在「其他原因」中按需提供。AI 建议将先成为草稿，预览并确认后才会应用。</p>`;
}
function renderParams(){
  const reasonNames={time:'时间不够',fatigue:'身体疲劳',weather:'天气原因',hard:'强度过高',other:'其他原因'};
  let fields='';
  if(state.reason==='time') fields=`<label class="form-label">今天还可训练多久？</label><div class="choice-grid">${[20,30,35,45].map(value=>`<button class="choice ${state.available===value?'active':''}" data-action="available" data-value="${value}">${value} 分钟</button>`).join('')}</div><p class="field-hint">原课程 60 分钟。我们会优先保留热身、放松与核心训练目的。</p><div class="switch-row"><span>只能在今天完成</span><span class="pill grey">本次示例：是</span></div>`;
  if(state.reason==='fatigue') fields=`<label class="form-label">目前的疲劳程度</label><div class="choice-grid">${['轻微','一般','明显'].map(value=>`<button class="choice ${state.fatigue===value?'active':''}" data-action="fatigue" data-value="${value}">${value}</button>`).join('')}</div><label class="form-label">是否出现明显不适？</label><div class="choice-grid"><button class="choice ${state.symptom==='无明显不适'?'active':''}" data-action="symptom" data-value="无明显不适">无明显不适</button><button class="choice ${state.symptom==='胸痛或晕厥'?'active':''}" data-action="symptom" data-value="胸痛或晕厥">胸痛 / 晕厥</button></div>${state.symptom!=='无明显不适'?`<div style="margin-top:13px">${notice('danger','请暂停相关训练并寻求专业医疗帮助。本次不继续生成训练方案。')}</div>`:''}`;
  if(state.reason==='weather') fields=`<label class="form-label">是否有可用的室内训练条件？</label><div class="choice-grid">${['有','没有','未知'].map(value=>`<button class="choice ${state.indoor===value?'active':''}" data-action="indoor" data-value="${value}">${value}</button>`).join('')}</div><label class="form-label" for="move-date">如果需要改期，可选日期</label><input class="input" id="move-date" data-field="moveDate" type="date" value="${esc(state.moveDate)}"><p class="field-hint">日期仅作为候选，仍需检查既有训练、休息与时间约束。</p>`;
  if(state.reason==='hard') fields=`<label class="form-label">哪里感觉过难？</label><div class="choice-grid"><button class="choice active">整体强度</button><button class="choice">持续时间</button></div><p class="field-hint">系统会优先建议降低强度，并明确训练目的是否变化。</p>`;
  if(state.reason==='other') fields=`<label class="form-label" for="other-text">用一句话补充情况（可选）</label><textarea class="textarea" id="other-text" data-field="otherText" maxlength="140" placeholder="例如：临时有事，只能傍晚骑行">${esc(state.otherText)}</textarea><p class="field-hint">无需输入完整训练指令，下一步会给出结构化候选。</p>`;
  return `${header(5,'补充一点信息',`已选择 · ${reasonNames[state.reason]}`)}<div class="surface card-pad"><span class="pill grey">正式课程</span><h2 style="font-size:17px;margin:9px 0 4px">60 分钟耐力骑行</h2><p class="body-copy">只收集本次调整确实需要的条件。</p></div>${fields}<p class="small-note">生成结果仍需通过结构、训练规则和影响校验，确认前不修改正式计划。</p>`;
}
function renderLoading(){
  if(state.loadingError) return `${header(6,'生成调整建议','本次生成未完成')}
    <div class="success-badge" style="border-color:#7a5348;background:#3b2925;color:var(--orange)">!</div><h2 class="loading-title">暂时无法生成方案</h2><p class="loading-sub">连接或方案校验失败。已保留你的选择，正式训练计划没有变化。</p><div style="margin-top:28px">${notice('warn','可重试生成，也可以继续手动编辑当前课程。')}</div>`;
  const steps=['读取课程与时间限制','生成候选方案','检查区段、冲突和饮食影响'];
  return `${header(6,'生成调整建议','正式计划保持不变')}
    <div class="loading-orb" aria-hidden="true"></div><h2 class="loading-title">正在准备可选方案</h2><p class="loading-sub">我们会检查训练结构和影响范围，再把候选方案交给你选择。</p><div class="progress-rail"><div style="width:${[28,61,90][state.loadingStage]}%"></div></div><div class="surface card-pad loading-steps">${steps.map((step,index)=>`<div class="loading-step ${index<state.loadingStage?'done':index===state.loadingStage?'current':''}"><i></i>${step}</div>`).join('')}</div><p class="small-note">阶段提示不代表精确生成百分比；取消后已填写条件仍会保留。</p>`;
}
function candidates(){
  if(state.reason==='time') return [
    {title:'保留有氧目的',minutes:35,summary:'35 分钟耐力骑行 · 5 / 25 / 5 分钟',reason:'在 35 分钟内保留稳定骑行，训练总量减少。',mode:'endurance',warmup:5,steady:25,cooldown:5,keepPurpose:true},
    {title:'改为轻松恢复',minutes:20,summary:'20 分钟恢复骑行 · 5 / 10 / 5 分钟',reason:'时间更短、负担更低；原本的有氧训练目的会改变。',mode:'recovery',warmup:5,steady:10,cooldown:5,keepPurpose:false}
  ];
  if(state.reason==='fatigue') return [
    {title:'轻松恢复骑行',minutes:20,summary:'20 分钟恢复骑行 · 全程 Z1',reason:'降低今日训练负担；不把主观疲劳当作医学诊断。',mode:'recovery',warmup:5,steady:10,cooldown:5,keepPurpose:false},
    {title:'缩短稳定骑行',minutes:35,summary:'35 分钟耐力骑行 · 5 / 25 / 5 分钟',reason:'保留部分有氧训练，仍需按实际感受决定是否执行。',mode:'endurance',warmup:5,steady:25,cooldown:5,keepPurpose:true}
  ];
  if(state.reason==='weather') return [
    ...(state.indoor==='有'?[{title:'室内耐力骑行',minutes:60,summary:'60 分钟室内耐力骑行 · 10 / 45 / 5 分钟',reason:'训练结构不变，前提是你确认有可用室内条件。',mode:'endurance',warmup:10,steady:45,cooldown:5,keepPurpose:true,scene:'室内'}]:[]),
    ...(state.moveDate?[{title:'改期并保留结构',minutes:60,summary:`${dateLabel(state.moveDate)} · 60 分钟耐力骑行`,reason:'日期改变，必须重新检查可用时间与计划冲突。',mode:'endurance',warmup:10,steady:45,cooldown:5,keepPurpose:true,date:state.moveDate}]:[])
  ];
  if(state.reason==='hard') return [
    {title:'降低强度',minutes:45,summary:'45 分钟耐力骑行 · Z2 稳定',reason:'缩短并降低主观难度，保留有氧目的。',mode:'endurance',warmup:5,steady:35,cooldown:5,keepPurpose:true},
    {title:'轻松恢复',minutes:30,summary:'30 分钟恢复骑行 · 全程 Z1',reason:'训练目的改变为恢复，需明确确认。',mode:'recovery',warmup:5,steady:20,cooldown:5,keepPurpose:false}
  ];
  return [
    {title:'缩短稳定骑行',minutes:45,summary:'45 分钟耐力骑行 · 5 / 35 / 5 分钟',reason:'尽量保留有氧目的，仍需核对你补充的限制。',mode:'endurance',warmup:5,steady:35,cooldown:5,keepPurpose:true},
    {title:'改为轻松恢复',minutes:30,summary:'30 分钟恢复骑行 · 全程 Z1',reason:'降低今日负担，训练目的会改变。',mode:'recovery',warmup:5,steady:20,cooldown:5,keepPurpose:false}
  ];
}
function candidateWorkout(candidate){
  const workout=clone(state.formal);
  Object.assign(workout,{warmup:candidate.warmup,steady:candidate.steady,cooldown:candidate.cooldown,targetDuration:candidate.minutes,mode:candidate.mode,keepPurpose:candidate.keepPurpose,intervalCount:0,difficulty:'适中'});
  if(candidate.scene)workout.scene=candidate.scene;
  if(candidate.date)workout.date=candidate.date;
  return workout;
}
function renderProposals(){
  const options=candidates();
  return `${header(7,'选择调整方案','候选草稿 · 尚未应用')}
    <div class="surface card-pad"><span class="eyebrow">针对本次条件</span><h2 style="font-size:18px;margin:7px 0 4px">${state.reason==='time'?`今天可训练 ${state.available} 分钟`:'为课程提供可比较的选择'}</h2><p class="body-copy">选择后先看差异和安全校验，再决定是否应用。</p></div>
    ${sectionTitle('可选方案',`${options.length} 个候选`)}${options.map((candidate,index)=>`<button class="proposal-card ${state.candidateIndex===index?'selected':''}" data-action="select-candidate" data-value="${index}"><div class="proposal-head"><div><h3><span class="radio-mark"></span>${candidate.title}</h3><span class="pill ${candidate.keepPurpose?'green':'warn'}">${candidate.keepPurpose?'保留训练目的':'训练目的改变'}</span></div><strong>${candidate.minutes}<small style="font-size:12px;font-weight:500"> 分钟</small></strong></div><p>${candidate.summary}</p><p>${candidate.reason}</p><div class="meta">候选 ${index+1} · 需预览与校验 · 未应用</div></button>`).join('')}
    ${notice('warn','两份候选都不会自动覆盖正式计划；若目的或补给安排改变，会在差异页说明。')}`;
}
function renderDiff(){
  const before=state.formal,after=draftOrFormal();
  const errors=validationMessages(after);
  const oldPurpose=purpose(before),newPurpose=purpose(after);
  const title=state.restoring?'恢复版本差异':'训练计划差异';
  return `${header(8,title,`正式 v${state.version} → ${state.restoring?'恢复草稿':'修改草稿'}`)}
    <div class="surface card-pad"><span class="pill ${state.restoring?'warn':''}"><i></i>${state.restoring?'恢复提案 · 未应用':state.draftSource==='ai'?'AI 建议草稿 · 未应用':state.draftSource==='ai-edited'?'AI 建议后手动微调 · 未应用':'手动编辑草稿 · 未应用'}</span><h2 style="font-size:18px;margin:10px 0 4px">${state.restoring?'恢复至上一版课程内容':`${dateLabel(before.date)} · 耐力骑行`}</h2><p class="body-copy">${state.restoring?'恢复会生成新的正式版本，现有历史记录保留。':'先核对变化与影响范围，再决定是否应用。'}</p></div>
    ${sectionTitle('本课程变化')}<div class="diff-card"><h3>训练总时长</h3><div class="compare"><div><small>原正式计划</small><strong>${total(before)} 分钟</strong></div><span class="arrow">→</span><div class="after"><small>当前草稿</small><strong>${total(after)} 分钟</strong></div></div>${row('训练区段',`${esc(segmentSummary(before))}<br>→ ${esc(segmentSummary(after))}`)}${row('主要强度',`${zoneOfSteady(before)} → ${zoneOfSteady(after)}`)}${row('训练目的',oldPurpose===newPurpose?`${newPurpose}（保留）`:`${oldPurpose} → ${newPurpose}（改变）`)}${row('训练方式',`${before.scene} → ${after.scene}`)}${row('训练日期',`${dateLabel(before.date)} → ${dateLabel(after.date)}`)}${row('开始时间',`${before.time||'未指定'} → ${after.time||'未指定'}`)}</div>
    ${sectionTitle('区间图对比','同一时长轴语义')}<div class="diff-card"><h3>原课程 · ${total(before)} 分钟</h3>${chart(before,true)}<h3 style="margin-top:16px">修改后 · ${total(after)} 分钟</h3>${chart(after,true)}<div class="chart-legend"><span><i class="legend-dot z1"></i>Z1</span><span><i class="legend-dot z2"></i>Z2</span><span><i class="legend-dot z3"></i>Z3</span></div></div>
    ${sectionTitle('应用范围')}<div class="choice-grid"><button class="choice ${state.scope==='single'?'active':''}" data-action="scope" data-value="single">仅修改本节</button><button class="choice ${state.scope==='linked'?'active':''}" data-action="scope" data-value="linked">联动后续计划</button></div><p class="field-hint">${state.scope==='linked'?'已选择重新核对未来 7 天；本示例的后续课程无额外变化，应用前仍需服务端校验。':'默认只修改 10 月 8 日本节，后续课程保持正式安排。'}</p>
    ${sectionTitle('对本周与饮食的影响')}<div class="diff-card">${row('本周计划时长',`${state.weeklyMinutes} → ${weekAfter(after)} 分钟`)}${row('10 月 9 日间歇课','无变化')}${row('10 月 10 日长骑','无变化')}${row('阶段测试 10 月 21 日','无变化')}${row('今日骑行补给','建议复核，饮食计划不自动修改')}</div>
    <div style="margin-top:12px">${errors.length?notice('danger',`<strong>暂不能应用：</strong>${esc(errors.join(' '))}`):oldPurpose!==newPurpose?notice('warn','训练目的发生改变，请确认这符合你今天的安排；这不是身体状态判断。'):notice('warn','本节时长减少，训练量随之下降。身体状态仍需依据实际反馈判断。')}</div>
    ${state.validationError?`<div style="margin-top:10px">${notice('danger',esc(state.validationError))}</div>`:''}
    <p class="small-note">数据依据：正式计划与当前草稿；不展示无 FTP 来源的功率 TSS 或精确风险分数。</p>`;
}
function renderSuccess(){
  const w=state.formal;
  return `${header(10,'应用成功',`正式计划 v${state.version}`)}
    <div class="success-badge" aria-hidden="true">✓</div><h2 class="success-title">新课程已应用</h2><p class="success-sub">${dateLabel(w.date)} 的正式课程现为 ${total(w)} 分钟。历史版本保留，可通过恢复提案找回上一版内容。</p>
    <div class="version-card"><span class="pill green"><i></i>正式计划 v${state.version}</span><h3 style="margin-top:11px">${workoutTitle(w)} · ${total(w)} 分钟</h3><p>${esc(segmentSummary(w))}</p><div style="margin-top:10px">${row('本周计划',`${state.weeklyMinutes} 分钟`)}${row('饮食计划','未自动修改')}${row('历史版本',`${state.history.length-1} 个旧版本已保留`)}</div></div>
    <div style="margin-top:14px">${notice('warn','「恢复上一版本」会先生成差异预览，确认后创建新的正式版本；已完成训练记录不会回滚。')}</div>
    <button class="text-button" style="margin-top:11px" data-action="restore">恢复上一版本 →</button>`;
}

function renderOverlay(){
  let html='';
  if(state.screen==='confirm'){
    const before=state.formal,after=draftOrFormal();
    html=`<div class="shade" data-action="back-to-diff"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="sheet-handle"></div><h2 id="confirm-title">${state.restoring?'确认恢复上一版本？':'确认应用这次调整？'}</h2><p>${state.restoring?'将上一版的课程内容作为新正式版本应用，历史记录不会删除。':'课程会在确认后更新为新的正式版本；取消或返回不会更改当前计划。'}</p><div class="surface card-pad">${row('课程日期',dateLabel(after.date))}${row('总时长',`${total(before)} → ${total(after)} 分钟`)}${row('训练目的',`${purpose(before)} → ${purpose(after)}`)}${row('影响范围',state.scope==='single'?'仅本节':'本节及未来 7 天校验范围')}${row('饮食计划','保持原计划，补给待复核')}${row('版本',`正式 v${state.version} → 新版本 v${state.version+1}`)}</div>${state.applyError?`<div style="margin-top:11px">${notice('danger',esc(state.applyError))}</div>`:''}<div class="sheet-actions"><button class="primary" data-action="apply">${state.applyError?'重试确认应用':'确认应用'}</button><button class="secondary" data-action="back-to-diff">返回修改</button></div></div>`;
  }
  if(state.sheet==='unsaved') html=`<div class="shade" data-action="continue-edit"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="unsaved-title"><div class="sheet-handle"></div><h2 id="unsaved-title">要离开当前编辑吗？</h2><p>你的修改尚未应用到正式计划。可以保留草稿稍后继续，也可以放弃这次修改。</p><div class="sheet-actions"><button class="primary" data-action="continue-edit">继续编辑</button><button class="secondary" data-action="keep-draft">保留草稿并离开</button><button class="danger-button" data-action="discard-draft">放弃这次修改</button></div></div>`;
  if(state.sheet==='power-info') html=`<div class="shade" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div><h2>功率目标需要依据</h2><p>当前示例档案未录入 FTP，也没有可核实的功率测试结果。专业编辑仍可使用 RPE。录入可信的功率基准后，才显示 W / %FTP 目标与单位。</p><button class="secondary" style="width:100%" data-action="close-sheet">知道了</button></div>`;
  if(state.toast) html+=`<div class="toast" role="status">${esc(state.toast)}</div>`;
  overlayEl.innerHTML=html;
}
function renderSidebar(){
  frameListEl.innerHTML=FRAME_META.map(([id,label],index)=>`<button class="frame-link ${state.screen===id?'active':''}" data-jump="${id}"><span>${pad(index+1)}</span>${label}</button>`).join('');
  stateListEl.innerHTML=[['unsaved','放弃编辑确认'],['ai-fail','AI 失败与重试'],['invalid','参数不合理警告'],['network','网络 / 保存失败'],['restore','恢复上一版本']].map(([id,label])=>`<button class="state-link" data-state-jump="${id}">${label} →</button>`).join('');
  ftpToggleEl.textContent=state.hasFtp?'当前：FTP 186 W · 手动测试':'当前：FTP 未录入';
  const index=FRAME_META.findIndex(([id])=>id===state.screen);
  frameCaptionEl.textContent=`Frame ${pad(index+1)} · ${FRAME_META[index][1]} · 390 × 844 pt`;
  document.title=`训练课程流程 · Frame ${pad(index+1)} ${FRAME_META[index][1]}`;
}
function render(resetScroll=false){
  const previousScroll=screenEl.scrollTop;
  let content='';
  let actions='';
  switch(state.screen){
    case 'detail':
      content=renderDetail();actions=buttonBar('AI 调整','start-ai','手动编辑','start-manual');break;
    case 'simple':
      content=renderSimple();actions=buttonBar('预览修改','preview','专业视图','to-pro');break;
    case 'pro':
      content=renderPro();actions=buttonBar('预览修改','preview','简洁视图','to-simple');break;
    case 'reason':
      content=renderReason();actions=buttonBar('下一步','to-params');break;
    case 'params':
      content=renderParams();actions=`<button class="primary" data-action="generate" ${state.reason==='fatigue'&&state.symptom!=='无明显不适'?'disabled':''}>生成调整建议</button>`;break;
    case 'loading':
      content=renderLoading();actions=state.loadingError?buttonBar('重试生成','generate','手动编辑','start-manual'):`<button class="secondary" data-action="cancel-generate" style="width:100%">取消生成</button>`;break;
    case 'proposals':
      content=renderProposals()+`<button class="text-button" data-action="cancel-ai" style="margin-top:11px">取消本次建议，保留原计划</button>`;
      actions=buttonBar('预览所选方案','select-preview','继续修改','edit-candidate');break;
    case 'diff':
      content=renderDiff();actions=buttonBar('校验并继续','validate','继续修改','back-to-source');break;
    case 'confirm':
      content=renderDiff();actions='';break;
    case 'success':
      content=renderSuccess();actions=buttonBar('查看新课程','view-applied','返回训练日历','go-training');break;
  }
  screenEl.innerHTML=content;
  actionEl.innerHTML=actions;
  actionEl.style.display=state.screen==='confirm'?'none':'flex';
  screenEl.scrollTop=resetScroll?0:previousScroll;
  renderOverlay();renderSidebar();
}
function ensureDraft(){
  if(!state.draft)state.draft=clone(state.formal);
}
function setDuration(minutes){
  ensureDraft();const w=state.draft;const oldTotal=total(w);
  w.targetDuration=minutes;
  if(w.intervalCount===0){
    w.warmup=minutes===60?10:5;w.cooldown=5;w.steady=minutes-w.warmup-w.cooldown;
  }else w.steady=Math.max(0,w.steady+minutes-oldTotal);
  markEdited();render();
}
function changeStepper(key,delta){
  ensureDraft();const w=state.draft;const oldTotal=total(w);
  const limits={warmup:[5,30],cooldown:[5,30],intervalCount:[0,4],work:[1,15],recovery:[1,10],workRpe:[1,10]};
  const [min,max]=limits[key];w[key]=Math.min(max,Math.max(min,w[key]+delta));
  if(key!=='workRpe')w.steady=Math.max(0,w.steady-(total(w)-oldTotal));
  markEdited();render();
}
function selectCandidate(index){
  state.candidateIndex=index;render();
}
function chooseCandidate(){
  const candidate=candidates()[state.candidateIndex];
  if(!candidate)return;
  state.draft=candidateWorkout(candidate);
  state.draftSource='ai';state.dirty=true;state.restoring=false;
}
function startLoading(){
  clearLoading();state.loadingError=false;state.loadingStage=0;navigate('loading');
  state.loadingTimer=setInterval(()=>{
    if(state.screen!=='loading'){clearLoading();return;}
    state.loadingStage++;
    if(state.loadingStage>=3){clearLoading();state.candidateIndex=0;navigate('proposals');return;}
    render();
  },850);
}
function startRestore(){
  const previous=state.history.at(-2);
  if(!previous){setToast('暂无可恢复的上一正式版本');return;}
  state.draft=clone(previous.workout);state.draftSource='restore';state.restoring=true;
  state.scope='single';state.returnScreen='success';state.validated=false;state.validationError='';
  navigate('diff');
}
function applyDraft(){
  if(state.applyError){
    state.applyError='';renderOverlay();setToast('已核对上次未保存，请再次确认应用');return;
  }
  if(state.failNextApply){
    state.failNextApply=false;state.applyError='网络异常，尚未确认是否保存。请核对申请结果后重试；正式计划暂不显示为已更新。';renderOverlay();return;
  }
  const errors=validationMessages(state.draft);
  if(errors.length){state.applyError=errors.join(' ');renderOverlay();return;}
  const nextWeekly=weekAfter(state.draft);
  state.formal=clone(state.draft);state.version++;
  state.weeklyMinutes=nextWeekly;
  state.history.push({version:state.version,workout:clone(state.formal)});
  state.draft=null;state.dirty=false;state.restoring=false;state.applyError='';state.validationError='';
  navigate('success');
}
function handleBack(){
  switch(state.screen){
    case 'detail':window.location.href=trainingUrl();break;
    case 'simple':case 'pro':if(state.dirty){state.sheet='unsaved';renderOverlay();}else navigate('detail');break;
    case 'reason':navigate('detail');break;
    case 'params':navigate('reason');break;
    case 'loading':clearLoading();navigate('params');break;
    case 'proposals':navigate('params');break;
    case 'diff':navigate(state.returnScreen||'detail');break;
    case 'confirm':navigate('diff');break;
    case 'success':window.location.href=trainingUrl();break;
  }
}
function handleAction(button){
  const action=button.dataset.action;
  const value=button.dataset.value;
  if(!action)return;
  switch(action){
    case 'back':handleBack();break;
    case 'detail-view':state.detailView=value;render();break;
    case 'start-manual':ensureDraft();state.draftSource='manual';state.returnScreen='simple';navigate('simple');break;
    case 'start-ai':state.reason='time';state.returnScreen='proposals';navigate('reason');break;
    case 'to-pro':ensureDraft();navigate('pro');break;
    case 'to-simple':ensureDraft();navigate('simple');break;
    case 'save-draft':ensureDraft();state.dirty=false;render();setToast('草稿已保存，正式计划未变');break;
    case 'set-duration':setDuration(Number(value));break;
    case 'set-difficulty':ensureDraft();state.draft.difficulty=value;markEdited();render();break;
    case 'set-scene':ensureDraft();state.draft.scene=value;markEdited();render();break;
    case 'toggle-purpose':ensureDraft();state.draft.keepPurpose=!state.draft.keepPurpose;markEdited();render();break;
    case 'step':changeStepper(button.dataset.key,Number(button.dataset.delta));break;
    case 'add-interval':case 'duplicate-interval':changeStepper('intervalCount',1);break;
    case 'remove-interval':changeStepper('intervalCount',-1);break;
    case 'move-interval':ensureDraft();state.draft.intervalFirst=!state.draft.intervalFirst;markEdited();render();break;
    case 'power-mode':ensureDraft();state.draft.powerMode=value;markEdited();render();break;
    case 'ack-purpose':ensureDraft();state.draft.keepPurpose=false;markEdited();render();break;
    case 'power-info':state.sheet='power-info';renderOverlay();break;
    case 'close-sheet':state.sheet='';renderOverlay();break;
    case 'preview':
      ensureDraft();state.returnScreen=state.screen;state.restoring=false;state.validated=false;state.validationError='';state.scope='single';navigate('diff');break;
    case 'reason':state.reason=value;render();break;
    case 'to-params':navigate('params');break;
    case 'available':state.available=Number(value);render();break;
    case 'fatigue':state.fatigue=value;render();break;
    case 'symptom':state.symptom=value;render();break;
    case 'indoor':state.indoor=value;render();break;
    case 'generate':
      if(state.reason==='fatigue'&&state.symptom!=='无明显不适')return;
      if(state.reason==='weather'&&state.indoor!=='有'&&!state.moveDate){setToast('请先确认室内条件或选择可改期日期');return;}
      startLoading();break;
    case 'cancel-generate':clearLoading();navigate('params');break;
    case 'select-candidate':selectCandidate(Number(value));break;
    case 'select-preview':chooseCandidate();state.returnScreen='proposals';state.scope='single';state.validationError='';navigate('diff');break;
    case 'edit-candidate':chooseCandidate();state.returnScreen='simple';navigate('simple');break;
    case 'cancel-ai':state.draft=null;state.dirty=false;navigate('detail');break;
    case 'scope':state.scope=value;state.validated=false;render();break;
    case 'back-to-source':navigate(state.returnScreen||'detail');break;
    case 'validate':{
      const errors=validationMessages(draftOrFormal());
      if(errors.length){state.validationError=errors.join(' ');render();setToast('请先修正标出的参数');return;}
      state.validationError='';state.validated=true;state.applyError='';navigate('confirm');break;
    }
    case 'back-to-diff':state.applyError='';navigate('diff');break;
    case 'apply':applyDraft();break;
    case 'view-applied':state.detailView='simple';navigate('detail');break;
    case 'go-training':window.location.href=trainingUrl();break;
    case 'restore':startRestore();break;
    case 'continue-edit':state.sheet='';renderOverlay();break;
    case 'keep-draft':state.sheet='';state.dirty=false;navigate('detail');setToast('草稿已保留，正式计划未变');break;
    case 'discard-draft':state.sheet='';state.draft=null;state.dirty=false;navigate('detail');break;
  }
}
document.addEventListener('click',event=>{
  const jump=event.target.closest('[data-jump]');
  if(jump){jumpToFrame(jump.dataset.jump);return;}
  const stateJump=event.target.closest('[data-state-jump]');
  if(stateJump){jumpToState(stateJump.dataset.stateJump);return;}
  if(event.target.closest('#ftp-toggle')){state.hasFtp=!state.hasFtp;render();return;}
  const button=event.target.closest('[data-action]');
  if(button)handleAction(button);
});
document.addEventListener('change',event=>{
  const input=event.target.closest('[data-field]');if(!input)return;
  const field=input.dataset.field;
  if(['date','time','workPower'].includes(field)){
    ensureDraft();state.draft[field]=field==='workPower'?Number(input.value):input.value;
    markEdited();render();return;
  }
  if(field==='moveDate'){state.moveDate=input.value;render();return;}
  if(field==='otherText'){state.otherText=input.value;render();}
});
function resetScenario(){
  clearLoading();
  state.formal=clone(BASE);state.version=7;state.weeklyMinutes=255;
  state.draft=null;state.draftSource='manual';state.returnScreen='simple';state.dirty=false;
  state.sheet='';state.toast='';state.reason='time';state.available=35;
  state.fatigue='一般';state.symptom='无明显不适';state.indoor='未知';
  state.moveDate='';state.otherText='';state.loadingStage=0;state.loadingError=false;
  state.candidateIndex=0;state.scope='single';state.validated=false;
  state.validationError='';state.applyError='';state.failNextApply=false;state.restoring=false;
  state.history=[{version:7,workout:clone(BASE)}];
}
function seedAiDraft(){state.draft=candidateWorkout(candidates()[0]);state.draftSource='ai';state.dirty=true;state.returnScreen='proposals';}
function seedSuccess(){seedAiDraft();state.formal=clone(state.draft);state.version=8;state.weeklyMinutes=230;state.draft=null;state.dirty=false;state.history=[{version:7,workout:clone(BASE)},{version:8,workout:clone(state.formal)}];}
function jumpToFrame(screen){
  resetScenario();
  if(screen==='simple')setDurationForSeed(45);
  if(screen==='pro'){
    state.draft=clone(BASE);Object.assign(state.draft,{intervalCount:2,work:4,recovery:3,steady:31});state.draftSource='manual';state.dirty=true;
  }
  if(screen==='loading')state.loadingStage=1;
  if(screen==='diff'||screen==='confirm'){seedAiDraft();state.returnScreen='proposals';}
  if(screen==='success')seedSuccess();
  navigate(screen);
}
function setDurationForSeed(minutes){
  state.draft=clone(BASE);Object.assign(state.draft,{warmup:5,steady:minutes-10,cooldown:5,targetDuration:minutes});state.dirty=true;state.draftSource='manual';
}
function jumpToState(name){
  resetScenario();
  if(name==='unsaved'){setDurationForSeed(45);state.screen='simple';state.sheet='unsaved';navigate('simple');state.sheet='unsaved';renderOverlay();return;}
  if(name==='ai-fail'){state.screen='loading';state.loadingError=true;navigate('loading');return;}
  if(name==='invalid'){
    state.draft=clone(BASE);Object.assign(state.draft,{intervalCount:4,work:12,recovery:8,steady:0});state.draftSource='manual';state.dirty=true;navigate('pro');return;
  }
  if(name==='network'){
    seedAiDraft();state.returnScreen='proposals';state.applyError='网络异常，保存结果未确认。请查询申请状态后重试。';state.failNextApply=false;navigate('confirm');return;
  }
  if(name==='restore'){seedSuccess();startRestore();}
}
function showFromHash(){
  const match=location.hash.match(/^#frame-(\d{2})$/);
  const index=match?Number(match[1])-1:0;
  jumpToFrame(FRAME_META[index]?.[0]||'detail');
}
function loadEntryScenario(){
  const query=new URLSearchParams(location.search||'');
  const minutes=Number(query.get('duration'));
  const version=Number(query.get('version'));
  const weekly=Number(query.get('weekly'));
  if(!Number.isInteger(minutes)||minutes<15||minutes>240||!Number.isInteger(version)||version<7)return;
  let workout=clone(BASE);
  if(minutes!==60){workout.warmup=5;workout.steady=minutes-10;workout.cooldown=5;workout.targetDuration=minutes;}
  if(query.get('mode')==='recovery'){workout.mode='recovery';workout.keepPurpose=false;}
  try{
    const supplied=JSON.parse(query.get('workout')||'null');
    if(supplied && typeof supplied==='object'){
      for(const key of ['warmup','steady','cooldown','targetDuration','intervalCount','work','recovery','workRpe','workPower']){
        if(Number.isFinite(supplied[key])&&supplied[key]>=0&&supplied[key]<=300)workout[key]=supplied[key];
      }
      if(/^2026-\d{2}-\d{2}$/.test(supplied.date))workout.date=supplied.date;
      if(/^$|^\d{2}:\d{2}$/.test(supplied.time))workout.time=supplied.time;
      if(['户外','室内'].includes(supplied.scene))workout.scene=supplied.scene;
      if(['轻松','适中','较难'].includes(supplied.difficulty))workout.difficulty=supplied.difficulty;
      if(['endurance','recovery'].includes(supplied.mode))workout.mode=supplied.mode;
      if(['rpe','power'].includes(supplied.powerMode))workout.powerMode=supplied.powerMode;
      for(const key of ['keepPurpose','intervalFirst'])if(typeof supplied[key]==='boolean')workout[key]=supplied[key];
    }
  }catch(_){}
  state.formal=workout;state.version=version;
  state.weeklyMinutes=Number.isFinite(weekly)&&weekly>=0?weekly:255-60+minutes;
  state.history=version>7?[{version:7,workout:clone(BASE)},{version,workout:clone(workout)}]:[{version:7,workout:clone(BASE)}];
  try{
    const history=JSON.parse(query.get('history')||'null');
    if(Array.isArray(history)&&history.length>=1&&history.length<=10&&history.every(entry=>Number.isInteger(entry.version)&&entry.workout&&typeof entry.workout==='object'))state.history=history;
  }catch(_){}
  render(true);
}
addEventListener('hashchange',()=>{
  if(suppressHashChange){suppressHashChange=false;return;}
  showFromHash();
});
showFromHash();
loadEntryScenario();
