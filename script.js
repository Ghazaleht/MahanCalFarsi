(() => {
  const expEl = document.getElementById('expression');
  const resEl = document.getElementById('result');
  const keys = document.querySelectorAll('.keys .btn');
  const voiceToggle = document.getElementById('voiceToggle');

  let expression = '';

  const faWords = {
    "0":"صفر","1":"یک","2":"دو","3":"سه","4":"چهار","5":"پنج",
    "6":"شش","7":"هفت","8":"هشت","9":"نه",
    "+":"جمع","-":"منها","*":"ضرب","/":"تقسیم","=":"مساوی","%":"درصد",".":"ممیز"
  };

  function speak(text){
    if(!voiceToggle.checked || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "fa-IR";
    let voice = speechSynthesis.getVoices().find(v=>v.lang.startsWith("fa"));
    if(!voice) voice = speechSynthesis.getVoices().find(v=>v.lang.startsWith("en"));
    if(voice) utter.voice = voice;
    utter.rate = 1;
    speechSynthesis.speak(utter);
  }

  function speakButton(val){
    if(faWords[val]) speak(faWords[val]);
    else if(!isNaN(val)) speak(val);
  }

  function setExpression(v){ expression = v; expEl.textContent = expression || '0'; }
  function setResult(v){ resEl.textContent = v; }

  function clearAll(){ setExpression(''); setResult('0'); speak('پاک شد'); }
  function backspace(){ expression = expression.slice(0,-1); setExpression(expression); }

  function appendValue(val){
    expression += val;
    setExpression(expression);
    speakButton(val);
  }

  function evaluateExpression(){
    try{
      const val = Function(`"use strict"; return (${expression.replace(/÷/g,"/").replace(/×/g,"*")})`)();
      const res = Math.round((val + Number.EPSILON)*1e12)/1e12;
      setResult(res);
      speak('برابر است با ' + res);
      expression = String(res);
    } catch {
      setResult('خطا');
      speak('خطا در محاسبه');
    }
  }

  // اضافه کردن MutationObserver برای فعال‌سازی صدا روی موبایل
  const observer = new MutationObserver(() => speechSynthesis.getVoices());
  observer.observe(document.body, { childList: true, subtree: true });

  keys.forEach(k => k.addEventListener('click', () => {
    const val = k.dataset.value;
    const action = k.dataset.action;
    if(action === 'clear') return clearAll();
    if(action === 'back') return backspace();
    if(action === 'equals') return evaluateExpression();
    if(val) appendValue(val);
  }));

  setExpression('');
  setResult('0');
})();
