const FRAME_META = [
  ['entry', 'A01 · 无计划 AI 入口'],
  ['profile', 'O01 · 骑行基础'],
  ['goal', 'O01 · 训练目标'],
  ['schedule', 'O01 · 时间安排'],
  ['nutrition', 'O01 · 饮食与禁忌'],
  ['loading', 'O01 · 生成计划草稿'],
  ['proposals', 'O01 · 选择计划方向'],
  ['diff', 'O01 · 计划差异预览'],
  ['confirm', 'O01 · 确认应用'],
  ['applied', 'O01 · 首份计划已应用'],
  ['manual', '兜底 · 手动创建课程'],
];

const screenEl = document.getElementById('screen');
const actionBarEl = document.getElementById('action-bar');
const overlayEl = document.getElementById('overlay');
const frameListEl = document.getElementById('frame-list');
const captionEl = document.getElementById('frame-caption');

const state = {
  screen: 'entry',
  experience: 'BEGINNER',
  power: '没有功率计',
  goal: '耐力',
  goalNote: '',
  deadline: '12 周',
  days: new Set(['周二', '周四', '周六']),
  minutes: 60,
  restriction: '无特殊限制',
  restrictionNote: '',
  meal: '家常饮食',
  candidate: 0,
  scope: '首个训练周期',
  includeNutrition: true,
  loadingStage: 0,
  loadingTimer: null,
  validated: false,
  nutritionError: false,
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function header(step, title, subtitle) {
  const back = step === '01' ? '' : '<button class="back" data-action="back" aria-label="返回">‹</button>';
  return `<header class="app-header">${back}<div class="header-copy"><small>${esc(subtitle)}</small><h1>${esc(title)}</h1></div></header>`;
}

function progress(step, label) {
  if (!step) return '';
  return `<div class="progress-label"><span>${esc(label)}</span><strong>${step} / 4</strong></div><div class="progress-rail"><div style="width:${step * 25}%"></div></div>`;
}

function choice(action, value, label, active = false, wide = false) {
  return `<button class="choice${active ? ' active' : ''}${wide ? ' wide' : ''}" data-action="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
}

function renderEntry() {
  return `${header('01', 'AI 教练', '首次使用 · 尚无正式计划')}
    <section class="surface card-pad empty-hero">
      <div class="entry-mark" aria-hidden="true">AI</div>
      <span class="pill grey">需要先建立计划</span>
      <h2 class="title-lg">先建立你的训练基础</h2>
      <p class="body-copy">告诉我你的目标、时间和骑行基础，我会先生成一份可检查、可调整的计划草稿。</p>
      <div class="info-strip" style="margin-top:15px"><b>i</b><span>已有资料会自动复用；没有 FTP 或功率计也可以开始。</span></div>
    </section>
    <div class="section-head"><h2>这次会完成</h2><small>约 3–5 分钟</small></div>
    <div class="step-grid">
      <div class="step-item"><span class="step-number">1</span><span><strong>骑行基础</strong><small>经验、设备与可用数据</small></span></div>
      <div class="step-item"><span class="step-number">2</span><span><strong>训练目标</strong><small>方向、期限与优先级</small></span></div>
      <div class="step-item"><span class="step-number">3</span><span><strong>时间与饮食</strong><small>每周安排、偏好和禁忌</small></span></div>
      <div class="step-item"><span class="step-number">4</span><span><strong>计划草稿</strong><small>预览后由你决定是否应用</small></span></div>
    </div>
    <p class="small-note">AI 建议不会直接写入正式计划。确认前，你可以返回修改或先手动创建一节训练。</p>`;
}

function renderProfile() {
  return `${header('02', '骑行基础', '新用户引导 · 第 1 步')}
    ${progress(1, '先告诉我你的骑行基础')}
    <section class="surface card-pad">
      <span class="eyebrow">训练经验</span>
      <h2 style="font-size:18px;margin:7px 0 4px">你目前处于哪个阶段？</h2>
      <p class="body-copy">用于控制计划起点和解释方式，不代表能力评级。</p>
      <div class="choice-grid" style="margin-top:15px">
        ${choice('experience', 'BEGINNER', '刚开始骑行', state.experience === 'BEGINNER', true)}
        ${choice('experience', 'INTERMEDIATE', '规律骑行', state.experience === 'INTERMEDIATE', true)}
        ${choice('experience', 'ADVANCED', '有系统训练', state.experience === 'ADVANCED', true)}
      </div>
      <label class="form-label">你是否有可用的功率数据？</label>
      <div class="choice-grid">
        ${choice('power', '有 FTP', '有 FTP / 功率计', state.power === '有 FTP')}
        ${choice('power', '没有功率计', '没有功率计', state.power === '没有功率计')}
      </div>
      <p class="field-hint">没有功率数据时，计划会优先使用时长、RPE 和恢复反馈，不生成未经测定的瓦数。</p>
    </section>
    <section class="surface card-pad" style="margin-top:12px">
      <div class="summary-line"><span>已读取的个人资料</span><strong>可修改</strong></div>
      <div class="summary-line"><span>页面昵称</span><strong>骑行者</strong></div>
      <div class="summary-line"><span>时区</span><strong>跟随设备</strong></div>
    </section>`;
}

function renderGoal() {
  const goals = [
    ['耐力', '完成更长距离，建立稳定有氧基础', '↗'],
    ['FTP', '围绕阈值能力逐步提升训练质量', '◇'],
    ['比赛', '为一场明确赛事安排训练节奏', '⚑'],
  ];
  return `${header('03', '训练目标', '新用户引导 · 第 2 步')}
    ${progress(2, '这份计划最想帮助你什么？')}
    <div class="goal-list">${goals.map(([value, desc, icon]) => `<button class="goal-option ${state.goal === value ? 'active' : ''}" data-action="goal" data-value="${value}"><span class="goal-icon">${icon}</span><span class="goal-copy"><strong>${value === 'FTP' ? '提升 FTP / 阈值能力' : value === '比赛' ? '准备一场比赛' : '提升耐力与长距离能力'}</strong><small>${desc}</small></span><span class="goal-check">${state.goal === value ? '✓' : ''}</span></button>`).join('')}</div>
    <label class="form-label">希望在多久后看到阶段检查点？</label>
    <div class="choice-grid">
      ${choice('deadline', '8 周', '8 周', state.deadline === '8 周')}
      ${choice('deadline', '12 周', '12 周', state.deadline === '12 周')}
      ${choice('deadline', '16 周', '16 周', state.deadline === '16 周')}
      ${choice('deadline', '还不确定', '还不确定', state.deadline === '还不确定')}
    </div>
    <label class="form-label" for="goal-note">补充你的目标 <span class="optional">可选</span></label>
    <textarea class="textarea" id="goal-note" data-field="goalNote" maxlength="200" placeholder="例如：想完成一次 100 km 骑行，爬坡比较弱…">${esc(state.goalNote)}</textarea>
    <p class="field-hint">固定目标和期限用于生成计划；这段说明只帮助 AI 理解背景，最多 200 字。</p>
    <div class="notice warn" style="margin-top:14px"><span class="mark">△</span><span>目标期限会影响训练密度和阶段安排。系统会说明不确定性，不承诺固定提升结果。</span></div>`;
}

function renderSchedule() {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return `${header('04', '时间安排', '新用户引导 · 第 3 步')}
    ${progress(3, '每周哪些时间适合骑行？')}
    <section class="surface card-pad">
      <span class="eyebrow">可训练日</span>
      <h2 style="font-size:18px;margin:7px 0 4px">选择你比较稳定的日子</h2>
      <p class="body-copy">临时变化可以在之后通过 AI 教练调整。</p>
      <div class="choice-grid week-grid" style="margin-top:15px">${days.map((day) => choice('day', day, day.replace('周', '周 '), state.days.has(day))).join('')}</div>
      <label class="form-label">单次通常能安排多久？</label>
      <div class="choice-grid">
        ${choice('minutes', '45', '约 45 分钟', state.minutes === 45)}
        ${choice('minutes', '60', '约 60 分钟', state.minutes === 60)}
        ${choice('minutes', '90', '约 90 分钟', state.minutes === 90)}
        ${choice('minutes', '120', '超过 2 小时', state.minutes === 120)}
      </div>
      <p class="field-hint">这是生成初稿的时间上限，不代表每次都必须完成。</p>
    </section>
    <div class="info-strip" style="margin-top:12px"><b>↗</b><span>系统会保留休息日，并检查课程、测试和比赛之间的冲突。</span></div>`;
}

function renderNutrition() {
  const restrictions = ['无特殊限制', '素食', '乳糖不耐受', '需要避开坚果', '其他限制'];
  return `${header('05', '饮食与禁忌', '新用户引导 · 第 4 步')}
    ${progress(4, '最后确认饮食相关的关键限制')}
    <section class="surface card-pad">
      <span class="eyebrow">饮食偏好</span>
      <h2 style="font-size:18px;margin:7px 0 4px">有什么需要避开的？</h2>
      <p class="body-copy">过敏与禁忌会阻止不安全的餐食建议进入可应用状态。</p>
      <div class="choice-grid" style="margin-top:15px">${restrictions.map((item) => choice('restriction', item, item, state.restriction === item, item.length > 6)).join('')}</div>
      <label class="form-label" for="restriction-note">其他需要说明 <span class="optional">${state.restriction === '其他限制' ? '必填' : '可选'}</span></label>
      <textarea class="textarea" id="restriction-note" data-field="restrictionNote" maxlength="200" placeholder="例如：对虾类过敏；不吃猪肉；请写明具体食物或成分…">${esc(state.restrictionNote)}</textarea>
      <p class="field-hint">选择“其他限制”时请写明具体食物或成分，最多 200 字。AI 只会把它作为上下文，并在预览前再次校验。</p>
      ${state.nutritionError ? '<div class="notice danger" style="margin-top:10px"><span class="mark">!</span><span>请先补充“其他限制”的具体食物或成分，再生成计划草稿。</span></div>' : ''}
      <label class="form-label">平时更接近哪种饮食？</label>
      <div class="choice-grid">
        ${choice('meal', '家常饮食', '家常饮食', state.meal === '家常饮食')}
        ${choice('meal', '外食较多', '外食较多', state.meal === '外食较多')}
      </div>
    </section>
    <section class="summary-card" style="margin-top:12px">
      <div class="summary-title">生成范围</div>
      <div class="summary-line"><span>训练计划</span><strong>近期训练周期 + 阶段路线</strong></div>
      <div class="summary-line"><span>阶段测试</span><strong>包含下一次检查点</strong></div>
      <div class="summary-line"><span>饮食建议</span><strong>随训练安排提供补给提醒</strong></div>
    </section>
    <p class="small-note">以上内容会先生成草稿；你可以在预览中选择是否一起应用训练相关的饮食建议。</p>`;
}

function renderLoading() {
  const steps = ['整理你的目标与时间约束', '生成近期训练和阶段路线', '检查训练结构与饮食禁忌'];
  return `${header('06', '生成计划草稿', 'AI 计划 · 正式计划保持不变')}
    <div class="loading-orb" aria-hidden="true"></div>
    <h2 class="loading-title">正在准备你的第一份计划</h2>
    <p class="loading-sub">系统会先生成候选草稿，再检查训练结构、时间冲突和饮食限制。</p>
    <div class="progress-rail"><div style="width:${[28,61,90][Math.min(state.loadingStage, 2)]}%"></div></div>
    <div class="surface card-pad loading-steps">${steps.map((step, index) => `<div class="loading-step ${index < state.loadingStage ? 'done' : index === state.loadingStage ? 'current' : ''}"><i></i>${step}</div>`).join('')}</div>
    <p class="small-note">这里的阶段提示不是精确生成百分比。取消后已填写的信息会保留。</p>`;
}

function renderPlanCard(index, title, subtitle, selected) {
  const plans = [
    { weeks: '4 周', days: '每周 3 次', minutes: '约 180 分钟 / 周', goal: '稳定建立耐力基础' },
    { weeks: '4 周', days: '每周 4 次', minutes: '约 240 分钟 / 周', goal: '增加阈值训练比重' },
  ];
  const plan = plans[index];
  return `<button class="proposal-card plan-card ${selected ? 'selected' : ''}" data-action="candidate" data-value="${index}">
    <div class="proposal-head"><div><h3><span class="radio-mark"></span>${title}</h3><span class="pill ${index === 0 ? 'green' : 'warn'}">${index === 0 ? '更稳妥的起点' : '训练密度更高'}</span></div><strong>${plan.weeks}</strong></div>
    <p>${subtitle}</p>
    <div class="facts"><div class="fact"><small>安排</small><strong>${plan.days}</strong></div><div class="fact"><small>周期总量</small><strong>${plan.minutes}</strong></div></div>
    <p>${plan.goal}；第 4 周安排阶段检查点，之后根据完成情况重新评估。</p>
    <div class="meta">候选 ${index + 1} · 示例草稿 · 尚未应用</div>
  </button>`;
}

function renderProposals() {
  return `${header('07', '选择计划方向', '候选草稿 · 尚未应用')}
    <div class="surface card-pad plan-hero"><span class="pill grey">根据你的信息生成</span><h2 class="title-lg">提升${state.goal === 'FTP' ? '阈值能力' : state.goal === '比赛' ? '比赛准备度' : '耐力'}</h2><p class="body-copy">以下是两种可以比较的起点。你可以先看影响，再决定是否应用。</p><div class="metric-row"><strong>${state.days.size}</strong><span>个训练日</span><small>${esc(state.deadline)}阶段检查</small></div></div>
    <div class="summary-card input-summary" style="margin-top:12px"><div class="summary-title">本次生成已读取</div><div class="summary-line"><span>目标补充</span><strong>${state.goalNote ? esc(state.goalNote) : '未补充'}</strong></div><div class="summary-line"><span>饮食限制</span><strong>${esc(state.restriction)}${state.restrictionNote ? ` · ${esc(state.restrictionNote)}` : ''}</strong></div></div>
    <div class="section-head"><h2>可选方案</h2><small>2 个候选</small></div>
    ${renderPlanCard(0, '稳步建立基础', '保留更多恢复空间，适合先建立连续训练习惯。', state.candidate === 0)}
    ${renderPlanCard(1, '增加专项刺激', '训练日更多，适合已有规律训练且时间较稳定的情况。', state.candidate === 1)}
    <div class="notice warn" style="margin-top:2px"><span class="mark">△</span><span>候选方案都不会自动覆盖正式计划。下一步会展示日期、训练量、阶段测试和补给影响。</span></div>`;
}

function renderDiff() {
  const isHigher = state.candidate === 1;
  return `${header('08', '计划差异预览', '草稿 → 正式计划 · 尚未应用')}
    <div class="surface card-pad"><span class="pill"><i></i>AI 计划草稿 · 未应用</span><h2 style="font-size:18px;margin:10px 0 4px">${isHigher ? '增加专项刺激' : '稳步建立基础'}</h2><p class="body-copy">先核对影响范围和限制，再决定是否创建第一个正式版本。</p></div>
    ${progress(null, '')}
    <div class="section-head"><h2>计划变化</h2><small>示例首个周期</small></div>
    <div class="diff-card">
      <div class="data-row"><span>训练安排</span><strong>无正式计划 → 每周 ${isHigher ? 4 : 3} 次</strong></div>
      <div class="data-row"><span>每周训练量</span><strong>无 → 约 ${isHigher ? 240 : 180} 分钟</strong></div>
      <div class="data-row"><span>训练日</span><strong>无 → ${Array.from(state.days).join('、')}</strong></div>
      <div class="data-row"><span>阶段检查</span><strong>无 → 第 4 周复评</strong></div>
      <div class="data-row"><span>目标补充</span><strong>${state.goalNote ? esc(state.goalNote) : '未补充'}</strong></div>
      <div class="data-row"><span>饮食限制</span><strong>${esc(state.restriction)}${state.restrictionNote ? ` · ${esc(state.restrictionNote)}` : ''}</strong></div>
      <div class="data-row"><span>饮食联动</span><strong>${state.includeNutrition ? '生成训练补给提醒' : '保持未设置'}</strong></div>
    </div>
    ${state.includeNutrition ? `<div class="section-head"><h2>营养关联</h2><small>可单独选择</small></div><div class="summary-card"><div class="summary-line"><span>训练日补给</span><strong>建议在应用后查看</strong></div><div class="summary-line"><span>正式饮食计划</span><strong>首次应用时一起建立</strong></div><button class="text-button" style="margin-top:8px" data-action="nutrition-toggle">暂不应用饮食建议</button></div>` : `<div class="info-strip" style="margin-top:12px"><b>i</b><span>本次只应用训练计划；饮食建议保留为待处理草稿。</span></div>`}
    ${state.validated ? `<div class="notice" style="margin-top:12px"><span class="mark">✓</span><span><strong>校验通过。</strong>日期、训练日数量和禁忌信息满足当前规则，可以进入确认。</span></div>` : `<div class="notice warn" style="margin-top:12px"><span class="mark">△</span><span>这是你的第一份正式计划。确认前不会写入训练日历或首页。</span></div>`}
    <p class="small-note">示例不展示未经测定的功率区间、TSS 或确定的能力提升数值。</p>`;
}

function renderConfirm() {
  return `${header('09', '确认应用', '首次正式计划 · 最后一步')}
    <div class="surface card-pad confirm-copy"><span class="pill green"><i></i>校验通过 · 待确认</span><h2 class="title-lg">准备好开始第一阶段了吗？</h2><p class="body-copy">确认后会创建第 1 个正式计划版本。之后仍可通过 AI 教练调整，旧版本和草稿状态会被记录。</p></div>
    <div class="section-head"><h2>本次会应用</h2></div>
    <div class="diff-card"><div class="data-row"><span>训练计划</span><strong>${state.candidate === 0 ? '稳步建立基础' : '增加专项刺激'}</strong></div><div class="data-row"><span>影响范围</span><strong>${state.scope}</strong></div><div class="data-row"><span>饮食建议</span><strong>${state.includeNutrition ? '一起建立' : '暂不应用'}</strong></div><div class="data-row"><span>版本</span><strong>无计划 → 正式 v1</strong></div></div>`;
}

function renderApplied() {
  return `${header('10', '计划已建立', '正式计划 v1')}
    <div class="success-badge" aria-hidden="true">✓</div>
    <h2 class="success-title">你的训练计划已准备好</h2>
    <p class="success-sub">首页和训练日历现在会展示正式安排。后续变化可以从课程、首页或 AI 教练发起调整。</p>
    <div class="version-card"><span class="pill green"><i></i>正式计划 v1</span><h3 style="margin-top:11px">${state.candidate === 0 ? '稳步建立基础' : '增加专项刺激'} · 首个训练周期</h3><p>${state.days.size} 个训练日 · ${state.minutes} 分钟上限 · ${state.deadline}阶段检查</p><div style="margin-top:10px">${row('饮食计划', state.includeNutrition ? '已建立训练补给提醒' : '暂未应用，保留待处理建议')}${row('下一步', '查看第一节训练')}</div></div>
    <div class="notice" style="margin-top:12px"><span class="mark">✓</span><span>计划已经生效。AI 教练后续只会生成草稿，仍需你预览和确认。</span></div>`;
}

function renderManual() {
  return `${header('11', '手动创建课程', '无计划兜底入口')}
    <section class="surface card-pad empty-hero">
      <div class="entry-mark manual-mark" aria-hidden="true">＋</div>
      <span class="pill grey">不想现在完成全部建档？</span>
      <h2 class="title-lg">先创建一节骑行课</h2>
      <p class="body-copy">你可以先手动建立当天或未来的一节结构化课程。确认保存后，它会成为第 1 个正式计划版本。</p>
      <div class="info-strip" style="margin-top:15px"><b>i</b><span>这条路径不会伪造 AI 计划；之后仍可补充档案并生成自适应计划。</span></div>
    </section>
    <div class="section-head"><h2>已有训练课程编辑原型</h2></div>
    <div class="summary-card"><div class="summary-line"><span>动作结构</span><strong>热身 / 训练 / 恢复 / 放松</strong></div><div class="summary-line"><span>保存流程</span><strong>草稿 → 校验 → 保存当天课程</strong></div><div class="summary-line"><span>首次应用</span><strong>创建正式计划 v1</strong></div></div>
    <p class="small-note">以下按钮打开现有训练课程高保真原型，用于评审兜底路径。</p>`;
}

function row(label, value) {
  return `<div class="data-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function renderActions() {
  if (state.screen === 'entry') return '<button class="primary" data-action="start-onboard">开始建立计划</button><button class="secondary" data-action="manual">先手动创建一节训练</button>';
  if (state.screen === 'profile') return '<button class="primary" data-action="next">下一步</button><button class="secondary" data-action="back">返回</button>';
  if (state.screen === 'goal') return '<button class="primary" data-action="next">下一步</button><button class="secondary" data-action="back">返回</button>';
  if (state.screen === 'schedule') return '<button class="primary" data-action="next">下一步</button><button class="secondary" data-action="back">返回</button>';
  if (state.screen === 'nutrition') return '<button class="primary" data-action="generate">生成计划草稿</button><button class="secondary" data-action="back">返回</button>';
  if (state.screen === 'loading') return '<button class="secondary" data-action="cancel-loading" style="width:100%">取消生成，保留填写内容</button>';
  if (state.screen === 'proposals') return '<button class="primary" data-action="preview">预览所选方案</button><button class="secondary" data-action="back">返回修改资料</button>';
  if (state.screen === 'diff') return state.validated ? '<button class="primary" data-action="confirm">确认应用</button><button class="secondary" data-action="back">继续修改</button>' : '<button class="primary" data-action="validate">校验并继续</button><button class="secondary" data-action="back">继续修改</button>';
  if (state.screen === 'applied') return '<button class="primary" data-action="training">进入训练日历</button><button class="secondary" data-action="coach">留在 AI 教练</button>';
  if (state.screen === 'manual') return '<button class="primary" data-action="open-manual">打开训练课程创建</button><button class="secondary" data-action="back">返回 AI 教练</button>';
  return '';
}

function renderOverlay() {
  if (state.screen !== 'confirm') {
    overlayEl.innerHTML = '';
    return;
  }
  overlayEl.innerHTML = `<div class="shade" data-action="close-confirm"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="sheet-handle"></div><h2 id="confirm-title">确认建立正式计划？</h2><p>确认后会把当前草稿应用为正式计划 v1。取消或返回不会创建训练日历课程。</p><div class="surface card-pad">${row('训练方向', state.candidate === 0 ? '稳步建立基础' : '增加专项刺激')}${row('训练日', `${state.days.size} 天 / 周`)}${row('阶段检查', state.deadline)}${row('饮食建议', state.includeNutrition ? '一起建立' : '暂不应用')}</div><div class="sheet-actions"><button class="primary" data-action="apply">确认应用</button><button class="secondary" data-action="close-confirm">返回修改</button></div></div>`;
}

function renderSidebar() {
  frameListEl.innerHTML = FRAME_META.map(([id, label], index) => `<button class="frame-link ${state.screen === id ? 'active' : ''}" data-jump="${id}"><span>${String(index + 1).padStart(2, '0')}</span>${label}</button>`).join('');
  const current = FRAME_META.findIndex(([id]) => id === state.screen);
  captionEl.textContent = `Frame ${String(current + 1).padStart(2, '0')} · ${FRAME_META[current][1]} · 390 × 844 pt`;
}

function setScreen(next) {
  if (state.loadingTimer && next !== 'loading') {
    clearInterval(state.loadingTimer);
    state.loadingTimer = null;
  }
  state.screen = next;
  if (next !== 'confirm') state.validated = next === 'diff' ? state.validated : false;
  location.hash = `frame-${next}`;
  render(true);
}

function previousScreen() {
  const previous = { profile: 'entry', goal: 'profile', schedule: 'goal', nutrition: 'schedule', proposals: 'nutrition', diff: 'proposals', confirm: 'diff', manual: 'entry' };
  setScreen(previous[state.screen] || 'entry');
}

function startLoading() {
  state.loadingStage = 0;
  setScreen('loading');
  state.loadingTimer = setInterval(() => {
    if (state.screen !== 'loading') return;
    state.loadingStage += 1;
    if (state.loadingStage >= 3) {
      clearInterval(state.loadingTimer);
      state.loadingTimer = null;
      setTimeout(() => setScreen('proposals'), 480);
    } else {
      render();
    }
  }, 820);
}

function render(resetScroll = false) {
  const previousScroll = screenEl.scrollTop;
  let content = '';
  switch (state.screen) {
    case 'entry': content = renderEntry(); break;
    case 'profile': content = renderProfile(); break;
    case 'goal': content = renderGoal(); break;
    case 'schedule': content = renderSchedule(); break;
    case 'nutrition': content = renderNutrition(); break;
    case 'loading': content = renderLoading(); break;
    case 'proposals': content = renderProposals(); break;
    case 'diff': content = renderDiff(); break;
    case 'confirm': content = renderConfirm(); break;
    case 'applied': content = renderApplied(); break;
    case 'manual': content = renderManual(); break;
    default: content = renderEntry();
  }
  screenEl.innerHTML = content;
  actionBarEl.innerHTML = renderActions();
  actionBarEl.style.display = state.screen === 'confirm' ? 'none' : 'flex';
  if (resetScroll) screenEl.scrollTop = 0; else screenEl.scrollTop = previousScroll;
  renderOverlay();
  renderSidebar();
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action], [data-jump]');
  if (!target) return;
  const action = target.dataset.action;
  const value = target.dataset.value;
  if (target.dataset.jump) { setScreen(target.dataset.jump); return; }
  switch (action) {
    case 'start-onboard': setScreen('profile'); break;
    case 'manual': setScreen('manual'); break;
    case 'back': previousScreen(); break;
    case 'experience': state.experience = value; render(); break;
    case 'power': state.power = value; render(); break;
    case 'goal': state.goal = value; render(); break;
    case 'deadline': state.deadline = value; render(); break;
    case 'day': state.days.has(value) ? state.days.delete(value) : state.days.add(value); render(); break;
    case 'minutes': state.minutes = Number(value); render(); break;
    case 'restriction': state.restriction = value; state.nutritionError = false; render(); break;
    case 'meal': state.meal = value; render(); break;
    case 'next': setScreen({ profile: 'goal', goal: 'schedule', schedule: 'nutrition' }[state.screen] || 'entry'); break;
    case 'generate': if (state.restriction === '其他限制' && !state.restrictionNote.trim()) { state.nutritionError = true; render(); } else startLoading(); break;
    case 'cancel-loading': setScreen('nutrition'); break;
    case 'candidate': state.candidate = Number(value); render(); break;
    case 'preview': state.validated = false; setScreen('diff'); break;
    case 'validate': state.validated = true; render(); break;
    case 'nutrition-toggle': state.includeNutrition = !state.includeNutrition; render(); break;
    case 'confirm': setScreen('confirm'); break;
    case 'close-confirm': setScreen('diff'); break;
    case 'apply': setScreen('applied'); break;
    case 'training': target.textContent = '训练日历已打开'; target.disabled = true; break;
    case 'coach': setScreen('entry'); break;
    case 'open-manual': window.location.href = 'training-v15.html'; break;
    default: break;
  }
});

document.addEventListener('input', (event) => {
  const field = event.target.dataset.field;
  if (!field || !(field in state)) return;
  state[field] = event.target.value;
  if (field === 'restrictionNote' && state.restrictionNote.trim()) state.nutritionError = false;
});

document.getElementById('reset-flow').addEventListener('click', () => {
  if (state.loadingTimer) clearInterval(state.loadingTimer);
  Object.assign(state, { screen: 'entry', experience: 'BEGINNER', power: '没有功率计', goal: '耐力', goalNote: '', deadline: '12 周', days: new Set(['周二', '周四', '周六']), minutes: 60, restriction: '无特殊限制', restrictionNote: '', meal: '家常饮食', candidate: 0, scope: '首个训练周期', includeNutrition: true, loadingStage: 0, loadingTimer: null, validated: false, nutritionError: false });
  setScreen('entry');
});

const initial = location.hash.replace('#frame-', '');
if (FRAME_META.some(([id]) => id === initial)) state.screen = initial;
render(true);
