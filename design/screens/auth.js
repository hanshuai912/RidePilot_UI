const numberInput=document.querySelector('[data-identifier]');
const codeInput=document.querySelector('[data-code]');
const passwordInput=document.querySelector('[data-password]');
const confirmInput=document.querySelector('[data-confirm-password]');
const form=document.querySelector('[data-auth-form]');
const feedback=document.querySelector('[data-feedback]');
const mode=document.body.dataset.mode;

function numberValid(value){return /^\d{11}$/.test(value)}
function codeValid(value){return /^\d{6}$/.test(value)}
function passwordKinds(value){return [/[A-Z]/.test(value),/[a-z]/.test(value),/[\p{P}\p{S}]/u.test(value)]}
function passwordValid(value){return value.length>=6 && passwordKinds(value).filter(Boolean).length>=2 && !/\s/.test(value)}
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
    help.textContent=mode==='register'?(value?(okay?'已满足长度和字符类别规则':/\s/.test(value)?'密码不可包含空格':value.length<6?'至少需要 6 个字符':'还需满足至少另一类字符'):'至少 6 个字符；数字不计入字符类别'):'请输入注册时设置的密码';
    help.classList.toggle('error',showError&&!okay);
  }
  return okay;
}
function validateCode(showError=false){
  if(!codeInput)return true;
  const value=codeInput.value;
  const okay=codeValid(value);
  const help=document.querySelector('[data-code-help]');
  codeInput.setAttribute('aria-invalid',String(showError&&!okay));
  if(help){help.textContent=!value?'测试阶段请输入任意 6 位数字':okay?'格式正确，测试阶段不发送短信':`当前 ${value.length} 位；请输入恰好 6 位数字`;help.classList.toggle('error',showError&&!okay)}
  return okay;
}
function validateConfirm(showError=false){
  if(!confirmInput)return true;
  const value=confirmInput.value;
  const okay=value.length>0 && value===passwordInput?.value;
  const help=document.querySelector('[data-confirm-help]');
  confirmInput.setAttribute('aria-invalid',String(showError&&!okay));
  if(help){help.textContent=!value?'请再次输入密码':okay?'两次密码一致':'两次密码不一致';help.classList.toggle('error',showError&&!okay)}
  return okay;
}
numberInput?.addEventListener('input',()=>validateNumber(Boolean(numberInput.value)));
codeInput?.addEventListener('input',()=>validateCode(Boolean(codeInput.value)));
passwordInput?.addEventListener('input',()=>validatePassword(Boolean(passwordInput.value)));
passwordInput?.addEventListener('input',()=>{if(confirmInput?.value)validateConfirm(true)});
confirmInput?.addEventListener('input',()=>validateConfirm(Boolean(confirmInput.value)));
document.querySelector('[data-toggle-password]')?.addEventListener('click',event=>{
  const shown=passwordInput.type==='text';
  passwordInput.type=shown?'password':'text';
  event.currentTarget.textContent=shown?'显示':'隐藏';
  event.currentTarget.setAttribute('aria-label',shown?'显示密码':'隐藏密码');
});
document.querySelector('[data-toggle-confirm]')?.addEventListener('click',event=>{
  if(!confirmInput)return;
  const shown=confirmInput.type==='text';
  confirmInput.type=shown?'password':'text';
  event.currentTarget.textContent=shown?'显示':'隐藏';
  event.currentTarget.setAttribute('aria-label',shown?'显示确认密码':'隐藏确认密码');
});
form?.addEventListener('submit',event=>{
  event.preventDefault();
  const n=validateNumber(true),c=validateCode(true),p=validatePassword(true),cp=validateConfirm(true);
  if(!n||!c||!p||!cp){showFeedback(mode==='register'?'请先修正手机号、验证码或密码，再继续注册。':'请先填写正确格式的手机号和密码。');return}
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
