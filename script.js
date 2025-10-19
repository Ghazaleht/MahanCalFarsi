(() => {
  const expEl = document.getElementById("expression");
  const resEl = document.getElementById("result");
  const keys = document.querySelectorAll(".keys .btn");
  const enableVoiceBtn = document.getElementById("enableVoice");

  let expression = "";
  let voiceEnabled = false;
  let faVoice = null;

  // --- voice initialization helpers ---
  function loadVoicesOnce() {
    // Try to get voices; some browsers populate voices only after interaction
    const voices = window.speechSynthesis.getVoices();
    // prefer male Persian voice name if available, otherwise any Persian, otherwise fallback to any voice
    faVoice = voices.find(v => v.lang && v.lang.startsWith("fa") && /male|M|مرد/i.test(v.name))
            || voices.find(v => v.lang && v.lang.startsWith("fa"))
            || voices.find(v => v.lang && v.lang.startsWith("en"))
            || voices[0] || null;
    return voices;
  }

  function enableVoice(byUser = true) {
    if (!("speechSynthesis" in window)) return false;
    voiceEnabled = true;
    // load voices (some browsers require a small timeout)
    loadVoicesOnce();
    // If voices not ready yet, try again after voiceschanged
    if (!faVoice) {
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoicesOnce();
      };
      // call speak once to "unlock" mobile audio (short empty utterance)
      const u = new SpeechSynthesisUtterance("");
      u.lang = "fa-IR";
      window.speechSynthesis.speak(u);
    }
    // announce activation calmly
    speakDirect("صدا فعال شد");
    enableVoiceBtn.textContent = "🟢 صدا فعال است";
    enableVoiceBtn.disabled = true;
    return true;
  }

  // Attach enable button
  enableVoiceBtn.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) {
      alert("مرورگر شما از قابلیت گفتار پشتیبانی نمی‌کند.");
      return;
    }
    enableVoice(true);
  });

  // Also try to enable on first user interaction (touchstart/click) — helps mobile
  function initOnFirstInteraction() {
    if (voiceEnabled) return;
    enableVoice(false);
    // remove listeners after first activation attempt
    window.removeEventListener("touchstart", initOnFirstInteraction);
    window.removeEventListener("click", initOnFirstInteraction);
  }
  window.addEventListener("touchstart", initOnFirstInteraction, {passive:true});
  window.addEventListener("click", initOnFirstInteraction, {passive:true});

  // speak with selected voice (used for results and button feedback)
  function speak(text) {
    if (!voiceEnabled) return;
    speakDirect(text);
  }

  function speakDirect(text) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fa-IR";
      if (faVoice) u.voice = faVoice;
      // some phones prefer slightly slower rate
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  }

  // convert single key (digit or operator) to Persian spoken form
  function keyToPersian(val) {
    const map = {
      "0":"صفر","1":"یک","2":"دو","3":"سه","4":"چهار","5":"پنج","6":"شش","7":"هفت","8":"هشت","9":"نه",
      ".":"ممیز",
      "+":"جمع","+":"جمع",
      "-":"منها",
      "*":"ضرب",
      "/":"تقسیم",
      "%":"درصد",
      "(": "پرانتز باز",
      ")": "پرانتز بسته"
    };
    return map[val] || val;
  }

  // convert a number (integer or decimal) to Persian words (basic, supports negatives and decimals)
  function numberToPersianWords(num) {
    if (num === null || num === undefined) return "";
    if (typeof num === "number" && !isFinite(num)) return "بی‌نهایت";
    const s = String(num);
    if (s === "NaN") return "نامشخص";
    if (s.includes("e")) return s; // scientific notation fallback

    // handle negative
    if (s.startsWith("-")) return "منفی " + numberToPersianWords(s.slice(1));

    if (s.includes(".")) {
      const parts = s.split(".");
      const intPart = parts[0];
      const frac = parts[1];
      // for integer part use converter, for fractional read digits individually
      return numberToPersianWords(parseInt(intPart,10)) + " ممیز " + frac.split("").map(d => keyToPersian(d)).join(" ");
    }

    const n = parseInt(s,10);
    if (isNaN(n)) return s;

    if (n === 0) return "صفر";

    const ones = ["","یک","دو","سه","چهار","پنج","شش","هفت","هشت","نه"];
    const teens = ["ده","یازده","دوازده","سیزده","چهارده","پانزده","شانزده","هفده","هجده","نوزده"];
    const tens = ["","ده","بیست","سی","چهل","پنجاه","شصت","هفتاد","هشتاد","نود"];
    const hundreds = ["","یکصد","دویست","سیصد","چهارصد","پانصد","ششصد","هفتصد","هشتصد","نهصد"];
    const scales = [
      {value:1e12, str:"تریلیون"},
      {value:1e9, str:"میلیارد"},
      {value:1e6, str:"میلیون"},
      {value:1e3, str:"هزار"}
    ];

    function threeDigitsToWords(x) {
      let w = [];
      const h = Math.floor(x/100);
      const rem = x % 100;
      if (h) w.push(hundreds[h]);
      if (rem >= 10 && rem < 20) {
        w.push(teens[rem - 10]);
      } else {
        const t = Math.floor(rem/10);
        const o = rem % 10;
        if (t) w.push(tens[t]);
        if (o) w.push(ones[o]);
      }
      return w.join(" و ");
    }

    let words = [];
    let remainder = n;
    for (const scale of scales) {
      if (remainder >= scale.value) {
        const count = Math.floor(remainder / scale.value);
        remainder = remainder % scale.value;
        words.push( threeDigitsToWords(count) + " " + scale.str );
      }
    }
    if (remainder > 0) {
      words.push( threeDigitsToWords(remainder) );
    }
    return words.join(" و ").trim();
  }

  // expression/result helpers
  function setExpression(v) {
    expression = v;
    expEl.textContent = expression || "0";
  }

  function setResult(v) {
    resEl.textContent = v;
    // announce result as Persian words
    speak(numberToPersianWords(v));
  }

  function appendValue(val) {
    expression += val;
    setExpression(expression);
    // speak the pressed key (numbers as words, operators as words)
    if (val.match(/^[0-9]$/)) {
      speak(keyToPersian(val));
    } else {
      // operator mapping: ensure more natural names
      const opMap = {
        "+":"جمع",
        "-":"منهای",
        "*":"ضرب",
        "/":"تقسیم",
        "%":"درصد",
        "(": "پرانتز باز",
        ")": "پرانتز بسته",
        ".":"ممیز"
      };
      speak(opMap[val] || keyToPersian(val));
    }
  }

  function clearAll() {
    expression = "";
    setExpression("");
    setResult("0");
    speak("پاک شد");
  }

  function backspace() {
    const last = expression.slice(-1);
    expression = expression.slice(0, -1);
    setExpression(expression);
    if (last) {
      speak("حذف شد");
    }
  }

  function evaluateExpression() {
    if (!expression) return;
    try {
      // sanitize basic % usage: replace n% with (n/100)
      let expr = expression.replace(/([0-9\.]+)%/g, "($1/100)");
      // Use Function for evaluation (kept simple)
      const val = Function(`"use strict"; return (${expr})`)();
      // round if number
      let out = val;
      if (typeof val === "number") {
        // avoid long decimals
        out = Math.round((val + Number.EPSILON) * 1e12) / 1e12;
      }
      setResult(out);
      setExpression(String(out));
    } catch (e) {
      console.warn(e);
      setResult("خطا");
      speak("خطا در محاسبه");
    }
  }

  // attach handlers to buttons (works for touch and click)
  keys.forEach(btn => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const val = btn.dataset.value;
      const action = btn.dataset.action;
      if (action === "clear") return clearAll();
      if (action === "back") return backspace();
      if (action === "equals") return evaluateExpression();
      if (val) return appendValue(val);
    });
  });

  // keyboard support (optional on devices with keyboard)
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (/^[0-9]$/.test(k)) appendValue(k);
    if (k === ".") appendValue(".");
    if (k === "Enter") { e.preventDefault(); evaluateExpression(); }
    if (k === "Backspace") backspace();
    if (k === "Escape") clearAll();
    if (["+","-","*","/","(",")","%"].includes(k)) appendValue(k);
  });

  // initialize UI
  setExpression("");
  setResult("0");

})();
