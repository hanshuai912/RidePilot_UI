const screens = ['home','date','editor','add-action','preview','detail'];
function showScreen(name){
  screens.forEach(id => document.getElementById(`screen-${id}`)?.classList.toggle('hidden', id !== name));
  document.querySelector('.phone')?.classList.toggle('deep', name !== 'home');
  document.querySelectorAll('[data-screen]').forEach(btn => btn.classList.toggle('active', btn.dataset.screen === name));
  document.querySelector('.screen:not(.hidden)')?.scrollTo({top:0,behavior:'instant'});
}
document.querySelectorAll('[data-screen]').forEach(btn => btn.addEventListener('click', () => {
  showScreen(btn.dataset.screen);
  if(btn.dataset.success){
    btn.textContent = '已保存';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = '确认并保存'; btn.disabled = false; }, 1600);
  }
  if(btn.dataset.addSegment){
    btn.textContent = '已加入动作列表';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = '保存动作'; btn.disabled = false; }, 1600);
  }
}));
showScreen('home');
