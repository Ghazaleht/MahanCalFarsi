(() => {
  const expEl = document.getElementById('expression');
  const resEl = document.getElementById('result');
  const keys = document.querySelectorAll('.keys .btn');
  const voiceToggle = document.getElementById('voiceToggle');
  const degToggle = document.getElementById('degToggle');

  let expression = '';
  let memory = 0;
  let voiceEnabled = false;
  let faVoice = null;

  // فعال‌سازی صدا وقتی voices بارگذاری شد
  window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    faVoice = voices.find(v => v.lang.startsWith('fa')) || voices[0];
  };

  // فعال‌سازی صدا روی اولین لمس
  function unlockVoiceOnTouch() {
    if(!voiceEnabled && faVoice){
      const u = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(u);
      voiceEnabled = true;
    }
    window.removeEventListener("touchstart", unlockVoiceOnTouch);
    window.removeEventListener("click", unlockVoiceOnTouch);
  }
  window.addEventListener("touchstart", unlockVoiceOnTouch, {passive:true});
  window.addEventListener("click", unlockVoiceOnTouch, {passive:true});

  function setExpression(v){ expression=v; expEl.textContent = expression||'0'; }
  function setResult(v){
    resEl.textContent=v;
    if(voiceToggle.checked) speakResult(String(v));
  }

  function appendValue(val){
    if(val==='(`)()'){
      if(!expression||/[+\-*/(]$/.test(expression)) expression+='(';
      else if((expression.match(/\(/g)||[]).length > (expression.match(/\)/g)||[]).length) expression+=')';
      else expression+='(';
    } else expression+=val;
    setExpression(expression);
    if(voiceToggle.checked) speakKey(val);
  }

  function clearAll(){ expression=''; setExpression(''); setResult('0'); }
  function backspace(){ expression=expression.slice(0,-1); setExpression(expression); }

  function sanitize(expr){
    if(!/^[0-9+\-*/().%,MathsincoagtelpowsqrtlogPIxne ]*$/i.test(expr)) return null;
    expr=expr.replace(/([0-9\.]+)%/g,'($1/100)');
    expr=expr.replace(/,/g,',');
    return expr;
  }

  function evaluateExpression(){
    if(!expression) return setResult('0');
    let expr = expression;
    expr = expr.replace(/Math\.PI/g,'Math.PI');
    if(degToggle.checked){
      expr = expr.replace(/Math\.sin\(/g,'(Math.sin((Math.PI/180)*');
      expr = expr.replace(/Math\.cos\(/g,'(Math.cos((Math.PI/180)*');
      expr = expr.replace(/Math\.tan\(/g,'(Math.tan((Math.PI/180)*');
    }
    const s = sanitize(expr);
    if(s===null){ setResult('خطا'); return; }
    try{
      const fn = new Function('return ('+s+');');
      let val = fn();
      if(typeof val==='number' && !Number.isFinite(val)) throw new Error('NaN');
      if(typeof val==='number') val=Math.round((val+Number.EPSILON)*1e12)/1e12;
      setResult(val);
      expression=String(val);
      setExpression(expression);
    } catch(e){
      console.error(e);
      setResult('خطا');
    }
  }

  function speakResult(text){
    if(!window.speechSynthesis||!faVoice) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang='fa-IR';
    utter.voice = faVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  // گفتن کلیدها به فارسی
  function speakKey(key){
    if(!window.speechSynthesis||!faVoice) return;
    let text=key;
    const map = {'+':'جمع','-':'منها','*':'ضرب','/':'تقسیم','=':'مساوی','%':'درصد','(': 'پرانتز باز',')':'پرانتز بسته','Math.sqrt':'جذر','Math.pow':'توان','Math.sin':'سین','Math.cos':'کوس','Math.tan':'تان','Math.log10':'لگاریتم','Math.PI':'پی'};
    text = map[key] || key;
    const utter=new SpeechSynthesisUtterance(text);
    utter.lang='fa-IR';
    utter.voice = faVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  // Memory functions
  function memoryClear(){ memory=0; }
  function memoryRecall(){ setResult(memory); expression=String(memory); setExpression(expression); }
  function memoryAdd(){ const r=parseFloat(resEl.textContent)||0; memory+=r; }
  function memorySubtract(){ const r=parseFloat(resEl.textContent)||0; memory-=r; }

  // attach handlers
  keys.forEach(k => k.addEventListener('click', ()=>{
    const val=k.dataset.value;
    const action=k.dataset.action;
    if(action==='clear') return clearAll();
    if(action==='back') return backspace();
    if(action==='equals') return evaluateExpression();
    if(action==='mc') return memoryClear();
    if(action==='mr') return memoryRecall();
    if(action==='mplus') return memoryAdd();
    if(action==='mminus') return memorySubtract();
    if(action==='comma') return appendValue(',');
    if(val) return appendValue(val);
  }));

  // keyboard support
  window.addEventListener('keydown',(e)=>{
    const k=e.key;
    if(/^[0-9]$/.test(k)) appendValue(k);
    if(k==='.') appendValue('.');
    if(k==='Enter'){ e.preventDefault(); evaluateExpression(); }
    if(k==='Backspace') backspace();
    if(k==='Escape') clearAll();
    if(['+','-','*','/','(',')','%'].includes(k)) appendValue(k);
  });

  setExpression('');
  setResult('0');
})();
