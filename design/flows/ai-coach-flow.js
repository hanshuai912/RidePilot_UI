const FRAME_META = [
  ['home', 'A01 · AI 教练首页'],
  ['replan', '任务 · 重新规划未来训练'],
  ['recovery', '任务 · 赛后恢复'],
  ['feedback', '任务 · 训练结果分析'],
  ['race', '任务 · 比赛规划'],
  ['roadmap', '结果 · 训练路线与测试'],
  ['diff', '结果 · 计划差异预览'],
  ['confirm', '确认 · 应用新版本'],
  ['applied', '完成 · 新计划已生效'],
];

const screenEl = document.getElementById('screen');
const actionBarEl = document.getElementById('action-bar');
const overlayEl = document.getElementById('overlay');
const frameListEl = document.getElementById('frame-list');
const captionEl = document.getElementById('frame-caption');

const state = {
  screen: 'home',
  intent: 'replan',
  scope: 'next-week',
  bodyStatus: '疲劳偏高',
  feedbackStatus: 'PARTIAL',
  recoveryStatus: '疲劳偏高',
  raceName: '秋季公路赛',
  includeRace: false,
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

function progress(step, label, total = 3) {
  return `<div class="progress-label"><span>${esc(label)}</span><strong>${step} / ${total}</strong></div><div class="progress-rail"><div style="width:${step / total * 100}%"></div></div>`;
}

function choice(action, value, label, active = false, wide = false) {
  return `<button class="choice${active ? ' active' : ''}${wide ? ' wide' : ''}" data-action="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
}

function row(label, value, className = '') {
  return `<div class="data-row"><span>${esc(label)}</span><strong class="${className}">${esc(value)}</strong></div>`;
}

function renderHome() {
  return `${header('01', 'AI 教练', '当前训练状态 · 正式计划 v4')}
    <section class="surface card-pad coach-hero">
      <div class="coach-mark" aria-hidden="true">AI</div>
      <span class="status-pill warn"><i></i>恢复中</span>
      <h2 class="title-lg">本周是恢复周</h2>
      <p class="body-copy">你上周完成了半马。建议先恢复，再从下周一开始基础耐力训练。</p>
      <div class="metric-row"><strong>6</strong><span>天后开始正式训练</span><small>下周一</small></div>
    </section>
    <div class="section-head"><h2>当前训练路线</h2><small>恢复 → 基础</small></div>
    <section class="surface card-pad phase-card">
      <div class="status-line"><strong>基础耐力阶段</strong><small>11 月 04 日 — 11 月 24 日</small></div>
      <div class="phase-track"><span class="done"></span><span class="current"></span><span></span><span></span></div>
      <div class="phase-labels"><span>赛后恢复</span><strong>基础耐力</strong><span>专项能力</span><span>复评</span></div>
      <div class="metric-grid"><div class="metric-tile"><small>下一次测试</small><strong>11/24</strong><span>耐力状态检查</span></div><div class="metric-tile"><small>本周完成</small><strong>2/3</strong><span>恢复活动</span></div><div class="metric-tile"><small>状态依据</small><strong>主观</strong><span>最近反馈</span></div></div>
    </section>
    <div class="section-head"><h2>你现在可以做什么</h2><small>快捷任务</small></div>
    <div class="quick-grid">
      <button class="quick-action active" data-action="replan"><span class="quick-icon">↗</span><strong>重新规划目标</strong><small>修改目标、日期或训练周期</small></button>
      <button class="quick-action" data-action="recovery"><span class="quick-icon">◌</span><strong>赛后恢复</strong><small>重新安排恢复周</small></button>
      <button class="quick-action" data-action="feedback"><span class="quick-icon">✓</span><strong>训练结果分析</strong><small>告诉 AI 最近完成情况</small></button>
      <button class="quick-action" data-action="race"><span class="quick-icon">⚑</span><strong>准备比赛</strong><small>评估备赛和减量影响</small></button>
    </div>
    <div class="section-head"><h2>待确认建议</h2><small>1 个草稿</small></div>
    <div class="action-card"><span class="mark">✦</span><div><strong>恢复周建议 · 尚未应用</strong><p>本周安排 2 次轻松活动，下周一开始基础耐力。查看影响后再决定。</p></div></div>
    <div class="section-head"><h2>告诉 AI 你的变化</h2><small>自由输入</small></div>
    <div class="chat-card"><span>例如：这周睡眠很差，周末只能训练 40 分钟</span><b>→</b></div>`;
}

function renderReplan() {
  return `${header('02', '重新规划未来训练', 'AI 教练任务 · 带入已有信息')}
    ${progress(1, '先选择这次调整的范围')}
    <section class="surface card-pad">
      <span class="eyebrow">重新规划</span>
      <h2 style="font-size:18px;margin:7px 0 4px">你想改变哪些训练？</h2>
      <p class="body-copy">历史训练和已完成比赛会保留，只调整你确认范围内的未来内容。</p>
      <div class="scope-grid" style="margin-top:15px">
        <button class="scope-choice ${state.scope === 'next-workout' ? 'active' : ''}" data-action="scope" data-value="next-workout"><strong>下一节训练</strong><small>只处理最紧急变化</small></button>
        <button class="scope-choice ${state.scope === 'this-week' ? 'active' : ''}" data-action="scope" data-value="this-week"><strong>本周剩余训练</strong><small>保留已完成课程</small></button>
        <button class="scope-choice ${state.scope === 'next-week' ? 'active' : ''}" data-action="scope" data-value="next-week"><strong>从下周开始</strong><small>推荐的重新规划入口</small></button>
        <button class="scope-choice ${state.scope === 'cycle' ? 'active' : ''}" data-action="scope" data-value="cycle"><strong>整个训练周期</strong><small>重建阶段和测试安排</small></button>
      </div>
    </section>
    <section class="context-card" style="margin-top:12px"><div class="context-title">系统将自动带入</div>${row('当前目标','提升耐力 · 12 月 15 日')}${row('当前阶段','赛后恢复 → 基础耐力')}${row('最近状态','疲劳偏高 · 基于 3 条反馈')}${row('已完成内容','半马 · 10 月 25 日')}${row('不会改变','历史训练和已完成记录','gold')}</section>`;
}

function renderRecovery() {
  return `${header('02', '赛后恢复', 'AI 教练任务 · 记录事件')}
    ${progress(1, '告诉 AI 刚刚发生了什么')}
    <section class="surface card-pad event-card">
      <div class="event-title"><strong>半马已完成</strong><span class="status-pill"><i></i>已记录</span></div>
      <p class="body-copy" style="margin-top:6px">事件会影响本周恢复、下一阶段开始日期和后续测试。</p>
      <div class="context-card" style="margin-top:12px">${row('完成日期','10 月 25 日')}${row('活动类型','半程马拉松')}${row('当前阶段','赛后恢复')}${row('建议开始','下周一')}</div>
    </section>
    <section class="surface card-pad" style="margin-top:12px">
      <span class="eyebrow">身体状态</span>
      <h2 style="font-size:18px;margin:7px 0 4px">现在感觉怎么样？</h2>
      <p class="body-copy">只用于这次恢复建议，不替代医疗判断。</p>
      <div class="choice-grid compact" style="margin-top:14px">${choice('recovery-status','状态正常','状态正常',state.recoveryStatus === '状态正常')}${choice('recovery-status','疲劳偏高','疲劳偏高',state.recoveryStatus === '疲劳偏高')}${choice('recovery-status','明显疲劳','明显疲劳',state.recoveryStatus === '明显疲劳')}</div>
      <label class="field-label" for="recovery-note">补充说明 <span class="optional">可选</span></label><textarea class="textarea" id="recovery-note" placeholder="例如：腿部酸痛，但没有尖锐疼痛"></textarea>
    </section>`;
}

function renderFeedback() {
  return `${header('02', '训练结果分析', 'AI 教练任务 · 先记录，再决定是否调整')}
    ${progress(1, '记录最近一次训练结果')}
    <section class="surface card-pad">
      <span class="pill grey">10 月 28 日 · 60 分钟耐力骑</span>
      <h2 style="font-size:18px;margin:10px 0 4px">实际完成情况</h2>
      <div class="choice-grid" style="margin-top:14px">${choice('feedback-status','COMPLETED','完整完成',state.feedbackStatus === 'COMPLETED')}${choice('feedback-status','PARTIAL','部分完成',state.feedbackStatus === 'PARTIAL')}${choice('feedback-status','SKIPPED','跳过',state.feedbackStatus === 'SKIPPED')}</div>
      <div class="field-grid"><div><label class="field-label">实际时长</label><input class="input" value="48 分钟"></div><div><label class="field-label">RPE</label><input class="input" value="7 / 10"></div></div>
      <label class="field-label">疲劳程度</label><div class="choice-grid compact">${choice('fatigue','低','低')}${choice('fatigue','中','中',true)}${choice('fatigue','高','高')}</div>
      <label class="field-label">备注 <span class="optional">可选</span></label><textarea class="textarea" placeholder="例如：最后 10 分钟明显掉功率"></textarea>
    </section>`;
}

function renderAnalysis() {
  return `${header('03', '训练状态分析', 'AI 分析 · 尚未修改正式计划')}
    <div class="surface card-pad analysis-card"><div class="analysis-title"><strong>当前建议：先降低接下来 3 天的训练压力</strong><span class="status-pill warn"><i></i>需要关注</span></div><p class="body-copy" style="margin-top:7px">根据最近 7 天的训练记录和主观反馈，疲劳连续偏高，但目前没有输入明显疼痛。</p><div class="analysis-list"><div><span>训练完成率</span><strong>80%</strong></div><div><span>平均 RPE</span><strong>7.2 / 10</strong></div><div><span>疲劳趋势</span><strong>连续 3 天偏高</strong></div><div><span>依据</span><strong>3 条训练反馈</strong></div></div></div>
    <div class="section-head"><h2>你想怎么处理？</h2><small>请选择范围</small></div>
    <div class="intent-list"><button class="intent-option" data-action="analysis-scope"><span class="intent-icon">↘</span><span class="intent-copy"><strong>只调整下一节</strong><small>把下一次训练改为轻松恢复</small></span><span class="goal-check">›</span></button><button class="intent-option active" data-action="analysis-scope"><span class="intent-icon">▦</span><span class="intent-copy"><strong>调整本周剩余训练</strong><small>保留已完成内容，降低未来 3 天压力</small></span><span class="goal-check">✓</span></button><button class="intent-option" data-action="analysis-scope"><span class="intent-icon">↗</span><span class="intent-copy"><strong>从下周重新规划</strong><small>重新评估阶段目标和训练安排</small></span><span class="goal-check">›</span></button></div>`;
}

function renderRace() {
  return `${header('02', '准备一场比赛', 'AI 教练任务 · 赛事影响')}
    ${progress(1, '先填写比赛和目标')}
    <section class="surface card-pad event-card">
      <span class="eyebrow">比赛事件</span>
      <h2 style="font-size:18px;margin:7px 0 4px">把比赛放进训练路线</h2>
      <p class="body-copy">AI 会评估赛前专项训练、减量、赛后恢复和阶段测试影响。</p>
      <label class="field-label" for="race-name">比赛名称</label><input class="input" id="race-name" value="${esc(state.raceName)}">
      <div class="field-grid"><div><label class="field-label">比赛日期</label><input class="input" value="12 月 15 日"></div><div><label class="field-label">距离</label><input class="input" value="100 km"></div></div>
      <label class="field-label">比赛重要程度</label><div class="choice-grid compact">${choice('priority','核心目标赛','核心目标赛',true)}${choice('priority','重要赛事','重要赛事')}${choice('priority','训练型比赛','训练型比赛')}</div>
    </section>`;
}

function renderRoadmap() {
  const isRecovery = state.screen === 'roadmap' && (state.intent === 'recovery' || state.recoveryStatus === '疲劳偏高');
  return `${header('03', '训练路线与测试', 'AI 建议草稿 · 尚未应用')}
    <section class="surface card-pad roadmap-hero"><span class="status-pill"><i></i>推荐草稿</span><h2 class="title-lg">${isRecovery ? '恢复后重新进入基础耐力' : '围绕目标重新安排训练'}</h2><p class="body-copy">AI 把长期方向、阶段小目标、测试计划和近期课程放在同一条路线里。</p><div class="metric-row"><strong>3</strong><span>个阶段</span><small>下一次复评 11/24</small></div></section>
    <div class="section-head"><h2>阶段路线</h2><small>未来 7 周</small></div>
    <div class="timeline"><div class="timeline-item"><span class="timeline-dot">✓</span><span class="timeline-copy"><strong>赛后恢复</strong><small>本周 · 轻松活动和休息，避免高强度</small></span><time>当前</time></div><div class="timeline-item current"><span class="timeline-dot">◆</span><span class="timeline-copy"><strong>基础耐力</strong><small>下周开始 · 建立连续训练习惯</small></span><time>3 周</time></div><div class="timeline-item"><span class="timeline-dot">○</span><span class="timeline-copy"><strong>专项能力</strong><small>增加目标强度，准备阶段复评</small></span><time>3 周</time></div></div>
    <div class="section-head"><h2>当前阶段计划</h2><small>可展开课程</small></div>
    <section class="phase-panel current"><div class="phase-panel-head"><strong>${isRecovery ? '恢复周 · 本周' : '基础耐力 · 下周开始'}</strong><small>${isRecovery ? '10/28 — 11/03' : '11/04 — 11/10'}</small></div><p>${isRecovery ? '2 次轻松活动 + 2 天完整休息。状态不佳时可以跳过，不补课。' : '3 次骑行，保留恢复空间；周末安排一次较长的耐力骑。'}</p><div class="test-card"><div class="test-head"><strong>下一次测试 · 耐力状态检查</strong><small>11 月 24 日</small></div><p>连续两周完成训练且疲劳回落后进行；结果将决定下一阶段训练密度。</p></div></section>
    <div class="section-head"><h2>近期训练</h2><small>未来 7 天</small></div>
    <section class="surface card-pad">${row('周一','休息')}${row('周二','30 分钟恢复骑','gold')}${row('周四','45 分钟轻松耐力')}${row('周六','可选 60 分钟低强度')}${row('周日','休息')}</section>`;
}

function renderDiff() {
  return `${header('04', '计划差异预览', '草稿 → 正式计划 · 尚未应用')}
    <section class="surface card-pad"><span class="status-pill"><i></i>待确认草稿</span><h2 style="font-size:18px;margin:10px 0 4px">恢复周 → 基础耐力</h2><p class="body-copy">确认前不会修改正式计划。已完成训练和半马事件保持不变。</p></section>
    <div class="section-head"><h2>本次会改变什么</h2><small>未来日期</small></div>
    <div class="diff-card replan"><div class="data-row"><span>影响范围</span><strong>10 月 28 日 — 11 月 24 日</strong></div><div class="data-row"><span>本周安排</span><strong class="add">新增恢复周 · 4 个恢复日</strong></div><div class="data-row"><span>下周开始</span><strong class="add">基础耐力 · 每周 3 次</strong></div><div class="data-row"><span>阶段测试</span><strong class="add">11 月 24 日状态检查</strong></div><div class="data-row"><span>删除内容</span><strong class="remove">3 节未来高强度课程</strong></div></div>
    <div class="section-head"><h2>这些内容会保留</h2></div><div class="context-card keep-list"><div><b>✓</b><span>已完成的半马事件和训练记录</span></div><div><b>✓</b><span>正式计划 v4 和历史版本</span></div><div><b>✓</b><span>当前目标和个人档案</span></div></div>
    <div class="notice warn" style="margin-top:12px"><span class="mark">△</span><span>这是恢复建议草稿。AI 不能替代医疗判断；如有持续疼痛，请先暂停训练并寻求专业建议。</span></div>`;
}

function renderApplied() {
  return `${header('05', '计划已更新', '正式计划 v5')}
    <div class="success-badge" aria-hidden="true">✓</div>
    <h2 class="success-title">新的训练路线已生效</h2>
    <p class="success-sub">本周进入恢复周，下周一开始基础耐力。后续可以继续记录训练结果，让 AI 根据实际状态调整。</p>
    <div class="version-card"><span class="status-pill"><i></i>正式计划 v5</span><h3 style="margin-top:11px">恢复周 → 基础耐力</h3><p>影响 10 月 28 日 — 11 月 24 日 · 保留已完成训练和半马记录</p><div style="margin-top:10px">${row('下一步','完成第一次恢复活动')}${row('下一次测试','11 月 24 日耐力状态检查')}</div></div>
    <div class="notice" style="margin-top:12px"><span class="mark">✓</span><span>以后 AI 只会先生成草稿，仍需你预览和确认。</span></div>`;
}

function renderActions() {
  if (state.screen === 'home') return '<button class="primary" data-action="replan">重新规划训练</button><button class="secondary" data-action="roadmap">查看训练路线</button>';
  if (state.screen === 'replan') return '<button class="primary" data-action="context">继续填写变化</button><button class="secondary" data-action="back">返回 AI 教练</button>';
  if (state.screen === 'recovery') return '<button class="primary" data-action="generate-roadmap">生成恢复建议</button><button class="secondary" data-action="back">返回 AI 教练</button>';
  if (state.screen === 'feedback') return '<button class="primary" data-action="analyze">保存并分析状态</button><button class="secondary" data-action="back">返回 AI 教练</button>';
  if (state.screen === 'analysis') return '<button class="primary" data-action="generate-roadmap">生成调整草稿</button><button class="secondary" data-action="back">暂不调整</button>';
  if (state.screen === 'race') return '<button class="primary" data-action="generate-roadmap">生成备赛路线</button><button class="secondary" data-action="back">返回 AI 教练</button>';
  if (state.screen === 'roadmap') return '<button class="primary" data-action="diff">预览计划变化</button><button class="secondary" data-action="back">继续修改</button>';
  if (state.screen === 'diff') return '<button class="primary" data-action="confirm">确认应用</button><button class="secondary" data-action="back">继续修改</button>';
  if (state.screen === 'applied') return '<button class="primary" data-action="training">查看训练日历</button><button class="secondary" data-action="coach">留在 AI 教练</button>';
  return '';
}

function renderOverlay() {
  if (state.screen !== 'confirm') { overlayEl.innerHTML = ''; return; }
  overlayEl.innerHTML = `<div class="shade" data-action="close-confirm"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="sheet-handle"></div><h2 id="confirm-title">确认应用新的训练路线？</h2><p>这会创建正式计划 v5。已完成训练和半马记录不会被覆盖。</p><div class="sheet-summary">${row('影响范围','10 月 28 日 — 11 月 24 日')}${row('新增内容','恢复周 + 基础耐力阶段')}${row('阶段测试','11 月 24 日状态检查')}${row('历史记录','保留')}</div><div class="sheet-actions"><button class="primary" data-action="apply">确认应用</button><button class="secondary" data-action="close-confirm">返回修改</button></div></div>`;
}

function renderSidebar() {
  frameListEl.innerHTML = FRAME_META.map(([id, label], index) => `<button class="frame-link ${state.screen === id ? 'active' : ''}" data-jump="${id}"><span>${String(index + 1).padStart(2, '0')}</span>${label}</button>`).join('');
  const current = FRAME_META.findIndex(([id]) => id === state.screen);
  captionEl.textContent = `Frame ${String(current + 1).padStart(2, '0')} · ${FRAME_META[current][1]} · 390 × 844 pt`;
}

function previousScreen() {
  const previous = { replan: 'home', recovery: 'home', feedback: 'home', race: 'home', analysis: 'feedback', roadmap: state.intent === 'replan' ? 'replan' : 'home', diff: 'roadmap', confirm: 'diff' };
  setScreen(previous[state.screen] || 'home');
}

function setScreen(next) {
  state.screen = next;
  location.hash = `frame-${next}`;
  render(true);
}

function render(resetScroll = false) {
  let content = '';
  switch (state.screen) {
    case 'home': content = renderHome(); break;
    case 'replan': content = renderReplan(); break;
    case 'recovery': content = renderRecovery(); break;
    case 'feedback': content = renderFeedback(); break;
    case 'analysis': content = renderAnalysis(); break;
    case 'race': content = renderRace(); break;
    case 'roadmap': content = renderRoadmap(); break;
    case 'diff': content = renderDiff(); break;
    case 'confirm': content = renderDiff(); break;
    case 'applied': content = renderApplied(); break;
    default: content = renderHome();
  }
  screenEl.innerHTML = content;
  actionBarEl.innerHTML = renderActions();
  actionBarEl.style.display = state.screen === 'confirm' ? 'none' : 'flex';
  if (resetScroll) screenEl.scrollTop = 0;
  renderOverlay();
  renderSidebar();
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action], [data-jump]');
  if (!target) return;
  const action = target.dataset.action;
  if (target.dataset.jump) { setScreen(target.dataset.jump); return; }
  const value = target.dataset.value;
  switch (action) {
    case 'replan': state.intent = 'replan'; setScreen('replan'); break;
    case 'recovery': state.intent = 'recovery'; setScreen('recovery'); break;
    case 'feedback': state.intent = 'feedback'; setScreen('feedback'); break;
    case 'race': state.intent = 'race'; setScreen('race'); break;
    case 'scope': state.scope = value; render(); break;
    case 'recovery-status': state.recoveryStatus = value; render(); break;
    case 'feedback-status': state.feedbackStatus = value; render(); break;
    case 'context': setScreen('roadmap'); break;
    case 'generate-roadmap': setScreen('roadmap'); break;
    case 'analyze': setScreen('analysis'); break;
    case 'roadmap': state.intent = 'replan'; setScreen('roadmap'); break;
    case 'diff': setScreen('diff'); break;
    case 'confirm': setScreen('confirm'); break;
    case 'close-confirm': setScreen('diff'); break;
    case 'apply': setScreen('applied'); break;
    case 'training': target.textContent = '训练日历已打开'; target.disabled = true; break;
    case 'coach': setScreen('home'); break;
    case 'back': previousScreen(); break;
    default: break;
  }
});

document.getElementById('reset-flow').addEventListener('click', () => {
  Object.assign(state, { screen: 'home', intent: 'replan', scope: 'next-week', bodyStatus: '疲劳偏高', feedbackStatus: 'PARTIAL', recoveryStatus: '疲劳偏高', raceName: '秋季公路赛', includeRace: false });
  setScreen('home');
});

const initial = location.hash.replace('#frame-', '');
if (FRAME_META.some(([id]) => id === initial)) state.screen = initial;
render(true);
