// Export the live prototype's ten screens and five required states as static review frames.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const folder = __dirname;
const output = path.join(folder, 'frames');
fs.mkdirSync(output, {recursive:true});
const source = fs.readFileSync(path.join(folder, 'workout-flow.js'), 'utf8');
const page = fs.readFileSync(path.join(folder, 'workout-flow.html'), 'utf8');
const status = page.match(/<div class="status-bar"[^>]*>[\s\S]*?<\/div>/)?.[0];
if (!status) throw new Error('Status bar source was not found');

const elements = new Map();
function getElementById(id){
  if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',scrollTop:0,style:{}});
  return elements.get(id);
}
const location={hash:'',href:''};
const context={
  document:{getElementById,addEventListener(){}},
  location,window:{location},addEventListener(){},
  setInterval,clearInterval,setTimeout,clearTimeout,structuredClone,URLSearchParams,console
};
vm.createContext(context);
vm.runInContext(source+'\nthis.exportFrames={jumpToFrame,jumpToState,state,render};',context);

const frames=[
  ['detail','Frame-01-course-detail.html','Frame 01 · 训练课程详情'],
  ['simple','Frame-02-simple-edit.html','Frame 02 · 手动编辑（简洁视图）'],
  ['pro','Frame-03-pro-edit.html','Frame 03 · 手动编辑（专业视图）'],
  ['reason','Frame-04-ai-reason.html','Frame 04 · AI 调整原因选择'],
  ['params','Frame-05-ai-params.html','Frame 05 · AI 参数补充'],
  ['loading','Frame-06-ai-loading.html','Frame 06 · AI 生成中'],
  ['proposals','Frame-07-ai-proposals.html','Frame 07 · AI 调整方案'],
  ['diff','Frame-08-plan-diff.html','Frame 08 · 训练计划差异对比'],
  ['confirm','Frame-09-confirm-apply.html','Frame 09 · 确认应用'],
  ['success','Frame-10-applied.html','Frame 10 · 应用成功']
];
const states=[
  ['unsaved','State-01-unsaved.html','状态 01 · 放弃编辑确认'],
  ['ai-fail','State-02-ai-failure.html','状态 02 · AI 生成失败'],
  ['invalid','State-03-invalid-params.html','状态 03 · 训练参数警告'],
  ['network','State-04-network-failure.html','状态 04 · 网络或保存失败'],
  ['restore','State-05-restore.html','状态 05 · 恢复上一版本']
];

function exportPage(filename,title,prototypeHash){
  const screen=getElementById('screen').innerHTML;
  const action=getElementById('action-bar');
  const overlay=getElementById('overlay-root').innerHTML;
  const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="stylesheet" href="../workout-flow.css"><style>.review-open{font-size:12px;color:#d2c18f;margin-top:10px;text-decoration:none}.static-description{font-size:11px;color:#858d84;margin-top:6px;text-align:center}</style></head><body><div class="prototype-layout"><div class="device-column"><div class="phone">${status}<div class="screen-scroll">${screen}</div><div class="action-bar" style="display:${action.style.display||'flex'}">${action.innerHTML}</div><div>${overlay}</div></div><div class="frame-caption">${title} · 390 × 844 pt</div><a class="review-open" href="../workout-flow.html${prototypeHash}">在可点击原型中打开 →</a><p class="static-description">独立静态 Frame；业务按钮请在可点击原型中操作。</p></div></div></body></html>`;
  fs.writeFileSync(path.join(output,filename),html);
}
for(const [id,filename,title] of frames){
  context.exportFrames.jumpToFrame(id);
  exportPage(filename,title,'#frame-'+filename.slice(6,8));
}
for(const [id,filename,title] of states){
  context.exportFrames.jumpToState(id);
  const hash={unsaved:'#frame-02','ai-fail':'#frame-06',invalid:'#frame-03',network:'#frame-09',restore:'#frame-08'}[id];
  exportPage(filename,title,hash);
}
context.exportFrames.jumpToFrame('pro');
context.exportFrames.state.hasFtp=true;
context.exportFrames.state.draft.powerMode='power';
context.exportFrames.state.draft.workPower=150;
context.exportFrames.render();
const powerVariant=['pro','Frame-03b-power-edit.html','Frame 03 · 目标功率编辑（有可信 FTP 的条件变体）'];
exportPage(powerVariant[1],powerVariant[2],'#frame-03');
const linkCards=(items)=>items.map(([,filename,title])=>`<a class="card" href="${filename}"><strong>${title}</strong><span>打开独立 390pt 设计稿 →</span></a>`).join('');
fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>训练课程流程 · 设计稿总览</title><style>:root{color-scheme:dark;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}*{box-sizing:border-box}body{background:#0d0f0e;color:#eff0e9;margin:0;padding:32px 22px}.wrap{max-width:1050px;margin:auto}h1{font-size:30px;margin:0 0 8px}p{color:#adb2aa;font-size:14px;line-height:1.6}h2{font-size:19px;margin:31px 0 13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.card{display:flex;flex-direction:column;justify-content:space-between;min-height:105px;border:1px solid #313731;background:#191c1a;border-radius:16px;padding:15px;text-decoration:none;color:#eff0e9}.card strong{font-size:14px}.card span{font-size:11px;color:#d2c18f}.hero-link{display:inline-flex;align-items:center;min-height:50px;border-radius:12px;padding:0 18px;background:#d2c18f;color:#171913;text-decoration:none;font-weight:700;margin-top:9px}</style></head><body><main class="wrap"><h1>训练课程流程 · 设计稿</h1><p>10 张独立 Frame、5 个异常状态及 1 张功率编辑条件变体，均为 390pt 宽的暗色移动页面。业务按钮请在可点击原型中操作。</p><a class="hero-link" href="../training-flow-entry.html">从训练日历开始可点击流程 →</a><h2>十个 Frame</h2><div class="grid">${linkCards(frames)}</div><h2>额外交互状态</h2><div class="grid">${linkCards(states)}</div><h2>条件变体</h2><div class="grid">${linkCards([powerVariant])}</div></main></body></html>`);
console.log(`Exported ${frames.length} frames and ${states.length} state variants`);
