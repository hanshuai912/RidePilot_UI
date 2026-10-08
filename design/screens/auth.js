const numberInput=document.querySelector('[data-identifier]');
const passwordInput=document.querySelector('[data-password]');
const form=document.querySelector('[data-auth-form]');
const feedback=document.querySelector('[data-feedback]');
const mode=document.body.dataset.mode;

function numberValid(value){return /^\d{11}$/.test(value)}
function passwordKinds(value){return [/[A-Z]/.test(value),/[a-z]/.test(value),/[\p{P}\p{S}]/u.test(value)]}
function passwordValid(value){return passwordKinds(value).filter(Boolean).length>=2 && !/\s/.test(value)}
function showFeedback(message,kind='error'){
  if(!feedback)return;
  feedback.textContent=message;
  feedback.className=`feedback show ${kind}`;
  feedback.setAttribute('role','status');
}
function validateNumber(showError=false){
  if(!numberInput)return false;
  const value=numberInput.value;
  const okay=numberValid(value);
  const help=document.querySelector('[data-identifier-help]');
  numberInput.setAttribute('aria-invalid',String(showError&&!okay));
  if(help){help.textContent=!value?'请输入恰好 11 位数字':okay?'号码格式正确':`当前 ${value.length} 位；请使用恰好 11 位数字，不含空格或其他字符`;help.classList.toggle('error',showError&&!okay)}
  return okay;
}
function validatePassword(showError=false){
  if(!passwordInput)return false;
  const value=passwordInput.value;
  const okay=mode==='register'?passwordValid(value):value.length>0;
  passwordInput.setAttribute('aria-invalid',String(showError&&!okay));
  const kinds=passwordKinds(value);
  document.querySelectorAll('[data-rule]').forEach((chip,index)=>chip.classList.toggle('met',kinds[index]));
  const help=document.querySelector('[data-password-help]');
  if(help){
    help.textContent=mode==='register'?(value?(okay?'已满足字符类别规则':/\s/.test(value)?'密码不可包含空格':'还需满足至少另一类字符'):'数字可使用，但不计入这三类'):'请输入注册时设置的密码';
    help.classList.toggle('error',showError&&!okay);
  }
  return okay;
}
numberInput?.addEventListener('input',()=>validateNumber(Boolean(numberInput.value)));
passwordInput?.addEventListener('input',()=>validatePassword(Boolean(passwordInput.value)));
document.querySelector('[data-toggle-password]')?.addEventListener('click',event=>{
  const shown=passwordInput.type==='text';
  passwordInput.type=shown?'password':'text';
  event.currentTarget.textContent=shown?'显示':'隐藏';
  event.currentTarget.setAttribute('aria-label',shown?'显示密码':'隐藏密码');
});
form?.addEventListener('submit',event=>{
  event.preventDefault();
  const n=validateNumber(true),p=validatePassword(true);
  if(!n||!p){showFeedback(mode==='register'?'请先修正号码或密码，再继续注册。':'请先填写正确格式的号码和密码。');return}
  showFeedback('格式校验通过。此页面是设计原型，尚未连接认证服务；真实注册和登录须等待服务端校验结果。','good');
});
document.querySelectorAll('[data-open-privacy]').forEach(button=>button.addEventListener('click',()=>{
  const sheet=document.querySelector('[data-privacy-sheet]');
  if(sheet){sheet.hidden=false;sheet.querySelector('button')?.focus()}
}));
document.querySelectorAll('[data-close-privacy]').forEach(button=>button.addEventListener('click',()=>{
  const sheet=document.querySelector('[data-privacy-sheet]');
  if(sheet)sheet.hidden=true;
}));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){const sheet=document.querySelector('[data-privacy-sheet]');if(sheet)sheet.hidden=true}
});
