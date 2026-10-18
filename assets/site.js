/* SynBerry 공용 스크립트 — 글자 크기·밝기, 유입경로(src) 전달, 공유 링크, 소식 받기, 도구 */
(function(){
  "use strict";
  var root = document.documentElement;
  var SURVEY = "/survey/";
  /* 소식 받기 접수 주소. 별도 시트용 Apps Script를 배포한 뒤 그 웹 앱 주소(…/exec)를 넣으면 양식이 열립니다.
     비어 있으면 양식은 안내만 보여 주고 아무것도 보내지 않습니다. */
  var LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbyxtboJwzarJkvW62mAd8DwrzfmBAh0OnlQJXvPh36ckIXO6Yp084SicNYQ0AIgzqCsXQ/exec";

  function store(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
  function sstore(k, v){ try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch(e){ return null; } }
  function $(id){ return document.getElementById(id); }

  /* 스크롤바를 뺀 실제 화면 폭: 첫 화면 띠가 좌우로 밀리지 않게 */
  function setVw(){ root.style.setProperty("--vw", root.clientWidth + "px"); }
  setVw(); addEventListener("resize", setVw);

  /* 글자 크기 17~25px */
  var fs = parseInt(store("sb-fs"), 10); if (!(fs >= 17 && fs <= 25)) fs = 19;
  function setFs(v){ fs = Math.max(17, Math.min(25, v)); root.style.setProperty("--fs", fs + "px"); store("sb-fs", String(fs)); }
  setFs(fs);
  if ($("fsUp")) $("fsUp").addEventListener("click", function(){ setFs(fs + 2); });
  if ($("fsDown")) $("fsDown").addEventListener("click", function(){ setFs(fs - 2); });

  /* 밝기 */
  var tb = $("themeBtn");
  function isDark(){ var t = root.getAttribute("data-theme"); return t ? t === "dark" : !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
  var saved = store("sb-theme"); if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  function label(){ if (tb) tb.textContent = isDark() ? "밝게" : "어둡게"; }
  label();
  if (tb) tb.addEventListener("click", function(){ var n = isDark() ? "light" : "dark"; root.setAttribute("data-theme", n); store("sb-theme", n); label(); });

  /* 유입경로: ?src= 값을 기억해 설문 링크에 붙인다. 형식 [A-Za-z0-9_-], 40자 이내 (설문 S열 규칙과 같음) */
  function clean(s){ return String(s || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40); }
  var incoming = "";
  try { incoming = clean(new URLSearchParams(location.search).get("src")); } catch(e){}
  if (incoming) sstore("sb-in", incoming); else incoming = sstore("sb-in") || "";
  function srcFor(place){ return clean((incoming || "sb") + "__" + place); }
  document.querySelectorAll("a[data-survey]").forEach(function(a){
    a.href = SURVEY + "?src=" + srcFor(a.getAttribute("data-survey"));
    a.removeAttribute("target");
  });

  /* 복사 버튼: data-copy="요소 id" 또는 data-copy-text */
  function copyText(btn, text, el){
    function sel(){ if (!el) return; var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "선택됨 · Ctrl+C"; }
    try { navigator.clipboard.writeText(text).then(function(){ btn.textContent = "복사됨"; }, sel); } catch(e){ sel(); }
  }
  document.querySelectorAll("[data-copy]").forEach(function(b){
    b.addEventListener("click", function(){ var el = $(b.getAttribute("data-copy")); copyText(b, el ? el.textContent.trim() : "", el); });
  });

  /* 공유 링크: 지금 페이지 주소에 ?src=share-페이지 를 붙인다 */
  var shareOut = $("shareUrl");
  if (shareOut){
    var page = document.body.getAttribute("data-page") || "home";
    var base = location.origin && location.origin !== "null" && /synberry\.synitart\.com$/.test(location.hostname)
      ? location.origin + location.pathname : "https://synberry.synitart.com/" + (page === "home" ? "" : page + ".html");
    shareOut.textContent = base + "?src=share-" + page;
  }

  /* 소식 받기 */
  var lf = $("leadForm");
  if (lf){
    var btn = $("leadSubmit"), err = $("leadErr");
    if (!LEAD_ENDPOINT){ btn.disabled = true; btn.textContent = "곧 열립니다"; $("leadClosed").hidden = false; }
    lf.addEventListener("submit", function(e){
      e.preventDefault(); err.textContent = "";
      if (!LEAD_ENDPOINT) return;
      var name = $("lName").value.trim(), phone = $("lPhone").value.replace(/[^0-9]/g, "");
      var interests = Array.prototype.map.call(lf.querySelectorAll('input[name="interest"]:checked'), function(i){ return i.value; });
      if (!name){ err.textContent = "이름 또는 닉네임을 적어 주세요."; $("lName").focus(); return; }
      if (!/^01[0-9]{8,9}$/.test(phone)){ err.textContent = "휴대폰 번호를 010-0000-0000 형식으로 적어 주세요."; $("lPhone").focus(); return; }
      if (!interests.length){ err.textContent = "받고 싶은 소식을 하나 이상 골라 주세요."; return; }
      if (!$("lAgree").checked){ err.textContent = "소식을 받으려면 개인정보 수집·이용에 동의해 주세요."; $("lAgree").focus(); return; }
      var data = { submittedAt: new Date().toISOString(), name: name, phone: phone, interests: interests.join(", "),
        area: $("lArea").value, marketing: $("lMkt").checked, src: srcFor("lead-" + (document.body.getAttribute("data-page") || "home")) };
      btn.disabled = true; btn.textContent = "보내는 중…";
      fetch(LEAD_ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
        .then(function(r){ return r.json(); })
        .then(function(j){ if (!j || !j.ok) throw new Error(); lf.hidden = true; $("leadDone").hidden = false; })
        .catch(function(){ btn.disabled = false; btn.textContent = "소식 받기"; err.textContent = "보내지 못했습니다. 인터넷 연결을 확인한 뒤 다시 눌러 주세요."; });
    });
  }

  /* 도구 1: 스마트팜 창업 준비도 점검 */
  var ck = $("checkTool");
  if (ck){
    var boxes = ck.querySelectorAll('input[type="checkbox"]');
    function runCheck(){
      var done = 0, todo = [];
      boxes.forEach(function(b){ if (b.checked) done++; else todo.push(b.getAttribute("data-todo")); });
      var total = boxes.length, pct = Math.round(done / total * 100);
      $("ckBar").style.width = pct + "%";
      $("ckScore").textContent = done + " / " + total;
      var stage = done <= 4 ? "구상 단계 — 땅과 허가부터 확인할 때입니다" : done <= 8 ? "준비 단계 — 견적과 판로를 숫자로 맞출 때입니다" : done < total ? "착공 직전 — 남은 항목만 닫으면 됩니다" : "착공 준비 완료 — 운영 기록 체계를 갖출 때입니다";
      $("ckStage").textContent = stage;
      var ul = $("ckTodo"); ul.innerHTML = "";
      todo.slice(0, 3).forEach(function(t){ var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
      $("ckTodoWrap").hidden = todo.length === 0;
      var picked = []; boxes.forEach(function(b, i){ if (b.checked) picked.push(i.toString(36)); });
      sstore("sb-ck", picked.join(""));
    }
    var prev = sstore("sb-ck") || "";
    boxes.forEach(function(b, i){ if (prev.indexOf(i.toString(36)) >= 0) b.checked = true; b.addEventListener("change", runCheck); });
    runCheck();
  }

  /* 도구 2: 딸기 수경재배 소득 계산기 (농촌진흥청 2024년산 10a 평균 기준) */
  var calc = $("calcTool");
  if (calc){
    var YIELD = 3.292, PRICE_AVG = 10868, COST = 20783; // kg/㎡, 원/kg, 원/㎡ (경영비 2,078.3만 원/10a)
    function won(v){ var neg = v < 0, a = Math.abs(Math.round(v / 10000)); return (neg ? "−" : "") + a.toLocaleString("ko-KR") + "만 원"; }
    function runCalc(){
      var unit = $("cUnit").value, raw = parseFloat($("cArea").value);
      if (!(raw > 0)) raw = 0;
      var area = unit === "py" ? raw * 3.3058 : raw;
      var skill = parseFloat(calc.querySelector('input[name="skill"]:checked').value);
      var price = parseFloat($("cPrice").value); if (!(price > 0)) price = PRICE_AVG;
      var kg = YIELD * area * skill, rev = kg * price, cost = COST * area, inc = rev - cost;
      $("oKg").textContent = Math.round(kg).toLocaleString("ko-KR") + "kg";
      $("oRev").textContent = won(rev); $("oCost").textContent = won(cost); $("oInc").textContent = won(inc);
      var box = $("oIncBox"); box.classList.toggle("neg", inc < 0); box.classList.toggle("pos", inc >= 0);
      $("oIncLbl").textContent = inc < 0 ? "소득 (적자)" : "소득";
      $("oArea").textContent = Math.round(area).toLocaleString("ko-KR") + "㎡ (약 " + Math.round(area / 3.3058).toLocaleString("ko-KR") + "평)";
    }
    calc.addEventListener("input", runCalc); calc.addEventListener("change", runCalc);
    runCalc();
  }

  /* 기사 카드 던지기 (움직임 줄이기 설정이면 CSS가 애니메이션을 끔) */
  var clips = $("clips");
  if (clips){
    clips.classList.add("toss");
    var again = $("tossAgain");
    if (again) again.addEventListener("click", function(){ clips.classList.remove("toss"); void clips.offsetWidth; clips.classList.add("toss"); });
  }

  /* 정책 브리핑 필터 */
  var fl = $("newsFilter");
  if (fl){
    fl.addEventListener("click", function(e){
      var b = e.target.closest("button"); if (!b) return;
      fl.querySelectorAll("button").forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
      var t = b.getAttribute("data-f");
      document.querySelectorAll("#newsList > li").forEach(function(li){ li.hidden = t !== "all" && (li.getAttribute("data-tags") || "").split(" ").indexOf(t) < 0; });
    });
  }
})();
