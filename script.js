(() => {
  const expEl = document.getElementById('expression');
  const resEl = document.getElementById('result');
  const keys = document.querySelectorAll('.keys .btn');
  const voiceToggle = document.getElementById('voiceToggle');

  let expression = '';

  const engWords = {
    "0":"zero","1":"one","2":"two","3":"three","4":"four","5":"five",
    "6":"six","7":"seven","8":"eight","9":"nine",
    "+":"plus","-":"minus","*":"times","/":"divided by","=":"equals","%":"percent",".":"dot"
  };

  function speak(text){
    if(!voiceToggle.checked || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    speechSynthesis.speak(utter);
  }

  function speakButton(val){
    if(engWords[val]) speak(engWords[val]);
    else if(!isNaN(val)) speak(val);
  }

  function setExpression(v){ expression = v; expEl.textContent = expression || '0'; }
  function setResult(v){ resEl.textContent = v; }

  function clearAll(){ setExpression(''); setResult('0'); speak('cleared'); }
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
      speak('equals ' + res);
      expression = String(res);
    } catch {
      setResult('Error');
      speak('Error');
    }
  }

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
