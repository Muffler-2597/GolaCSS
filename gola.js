/* GolaCSS companion JS (no deps).
   CSS만으로 토글·드래그는 동작하고, 이 파일은 채움 표시(--p) + RGB/HEX 동기화만 맡는다.
   원본 로직: panel.ts setBg / applyHex / formatFloat(ToString "0.0###") 그대로.
   클래스리스 기본 적용: body에 data-gola-off가 없으면 gola-auto를 자동으로 붙임 (빼려면 data-gola-off). */
(function () {
  'use strict';

  if (!document.body.hasAttribute('data-gola-off')) {
    document.body.classList.add('gola-auto');
  }

  /* Unity InputFieldValueLimiter.ToString("0.0###"): 소수 1~4자리, 후행0 제거 */
  function formatFloat(v) {
    var s = v.toFixed(4).replace(/0+$/, '');
    return s.endsWith('.') ? s + '0' : s;
  }

  /* 슬라이더 채움: --p 기록 + .enhanced 부여 (CSS linear-gradient가 채움) */
  function paintSlider(el) {
    var min = parseFloat(el.min || '0'), max = parseFloat(el.max || '1');
    var p = (parseFloat(el.value) - min) / ((max - min) || 1);
    el.style.setProperty('--p', Math.max(0, Math.min(1, p)));
    el.classList.add('enhanced');
  }
  document.querySelectorAll('.gola-slider,.gola-auto input[type=range]:not(.gola-slider)').forEach(function (el) {
    paintSlider(el);
    el.addEventListener('input', function () { paintSlider(el); });
  }); /* 클래스리스 range도 채움 지원 */

  /* RGB <-> HEX <-> 미리보기 동기화 (data-gola-rgb="r,g,b" 스코프별) */
  document.querySelectorAll('[data-gola-rgb]').forEach(function (scope) {
    var sliders = Array.prototype.filter.call(scope.querySelectorAll('.gola-slider[data-ch="r"],.gola-slider[data-ch="g"],.gola-slider[data-ch="b"],input[type=range][data-ch="r"],input[type=range][data-ch="g"],input[type=range][data-ch="b"]'), function (el) { return el.classList.contains('gola-slider') || el.closest('.gola-auto,[data-gola],[data-gola-rgb],[data-gola-vol],[data-gola-nick]'); }); /* 베어 range도 동기화 — 스코프 후손 직접 조회+클래스리스 게이트 (스코프 안에 .gola-auto를 요구하던 구형은 body.gola-auto>스코프 구조에서 매칭 불가 정정) */
    var inputs = scope.querySelectorAll('.gola-value');
    var hex = scope.querySelector('.gola-hex');
    var prev = scope.querySelector('.gola-color-preview');
    function read() {
      return [0, 1, 2].map(function (i) {
        return sliders[i] ? parseFloat(sliders[i].value) : 1;
      });
    }
    var lastHex = hex ? hex.value : '';
    var lastRGB = ['', '', '']; /* 원본 panel.ts lastRGB 3칸 verbatim — 무효 입력은 lastRGB[i] 복원(최초는 빈칸) */
    function render(from) {
      var c = read();
      var rgb = 'rgb(' + c.map(function (v) { return Math.round(v * 255); }).join(',') + ')';
      var hx = '#' + c.map(function (v) { return Math.round(v * 255).toString(16).padStart(2, '0'); }).join('').toUpperCase();
      if (prev) prev.style.background = rgb;
      if (from !== 'slider') sliders.forEach(function (s, i) { s.value = c[i]; paintSlider(s); });
      if (from !== 'input') inputs.forEach(function (inp, i) { inp.value = formatFloat(c[i]); });
      if (from !== 'hex' && hex) hex.value = hx;
      if (hex) lastHex = hex.value; /* 모든 render 경로에서 lastHex=현재 HEX 동기화 (원본 SetHexFromColor에서만 갱신·CheckValue 성공 시 stale quirk와 반대인 포크, 무효 복원은 항상 화면 현재값으로) */
      /* NOTE: RGB 스코프는 .gola-vol-val을 건드리지 않음 — 볼륨 표기는 data-gola-vol sync 전담 */
    }
    sliders.forEach(function (s) { s.addEventListener('input', function () { render('slider'); }); });
    inputs.forEach(function (inp, i) {
      inp.addEventListener('change', function () {
        var v = parseFloat(inp.value);
        if (isNaN(v)) { inp.value = lastRGB[i]; return; } /* 원본: 무효면 lastText(lastRGB[i]) 복원 — 최초 무효 입력은 빈칸 */
        var clamped = Math.max(0, Math.min(1, v));
        sliders[i].value = clamped;
        lastRGB[i] = formatFloat(clamped);
        inp.value = lastRGB[i]; /* 원본 SetFloatToText: 클램프 후 '0.0###' 정규형으로 재기록 */
        render('input');
      });
    });
    if (hex) hex.addEventListener('change', function () {
      var v = hex.value.trim().toUpperCase();
      if (v[0] !== '#') v = '#' + v;
      var body = v.slice(1);
      if (!/^(?:[0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/.test(body)) { hex.value = lastHex; return; } /* 무효면 복원 (3/4/6/8 허용, 그 외만 lastHex) */
      var up = body.toUpperCase();
      var exp = up.length === 3 || up.length === 4 ? up.split('').map(function (ch) { return ch + ch; }).join('') : up;
      var short = exp.slice(0, 6); /* 4/8자리 알파 바이트 무시 (앞 6자리만, gola-sdf.js parseColor와 동일) */
      var n = parseInt(short, 16);
      var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (x) { return x / 255; });
      sliders.forEach(function (s, i) { s.value = c[i]; });
      render('hex');
      hex.value = '#' + up; /* 입력 표시 유지, 파싱만 앞 6자리 (panel.ts 그대로) */
      lastHex = hex.value;
    });
    render('init');
  });

  /* 볼륨 라벨: data-gola-vol 스코프 (값% 표시) */
  document.querySelectorAll('[data-gola-vol]').forEach(function (scope) {
    Array.prototype.filter.call(scope.querySelectorAll('.gola-slider[data-ch="vol"],input[type=range][data-ch="vol"]'), function (el) { return el.classList.contains('gola-slider') || el.closest('.gola-auto,[data-gola],[data-gola-rgb],[data-gola-vol],[data-gola-nick]'); }).forEach(function (s) { /* 베어는 스코프 후손 직접 조회+게이트 (구형 .gola-auto 자손 요구는 body.gola-auto>스코프 구조에서 매칭 불가 정정) */
      var label = document.getElementById(s.getAttribute('data-label'));
      function sync() { if (label) label.textContent = Math.ceil(parseFloat(s.value)) + '%'; paintSlider(s); } /* min0 max100 정수+CeilToInt */
      s.addEventListener('input', sync); sync();
    });
  });

  /* 데모 배선: [data-gola-toast] 버튼 -> 토스트 3.5초 표시 (원본 Show 3.5s) */
  document.querySelectorAll('[data-gola-toast]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = document.querySelector(btn.getAttribute('data-gola-toast'));
      if (!t) return;
      var vw0 = document.documentElement.clientWidth || window.innerWidth || 800;
      if (vw0 < 800) t.style.fontSize = Math.max(14, Math.round(36 * vw0 / 800)) + 'px'; /* 정적 경로도 스포너와 동일 비례식 인라인 (원본 toast.ts, CSS 버킷 양자화 대신) */
      else t.style.fontSize = ''; /* wide 복귀 시 좁은폭 인라인 잔류(stale) 제거 */
      var pb = t.parentElement || t; /* 정적 경로도 SR 공지: 부모 박스(없으면 토스트 자체)에 role/aria-live 보정 (동적 golaToast 경로와 동일) */
      if (!pb.hasAttribute('role')) pb.setAttribute('role', 'status');
      if (!pb.hasAttribute('aria-live')) pb.setAttribute('aria-live', 'polite');
      if (t.__showT) clearTimeout(t.__showT);
      if (t.__hideT) clearTimeout(t.__hideT);
      t.classList.remove('dying');
      t.classList.add('show');
      t.__showT = setTimeout(function () {
        t.classList.add('dying');
        t.__hideT = setTimeout(function () { t.classList.remove('show', 'dying'); }, 200);
      }, 3500);
    });
  });

  /* 누름효과 opt-in: .gola-press 클릭 시 .gola-pressed 0.30s 단상 유지 (원본 ButtonPressAnimation 축소 0.15s+복원 0.15s 2상 합 0.30s의 단상 포크) */
  document.querySelectorAll('.gola-press').forEach(function (b) {
    b.addEventListener('click', function () {
      b.classList.add('gola-pressed');
      setTimeout(function () { b.classList.remove('gola-pressed'); }, 300);
    });
  });

  /* 토글라벨 문구 교체: data-gola-text="켜짐문구|꺼짐문구" (원본 SetTextFromToggleSwitch는 문구 즉시교체+색 0.2s 트윈) */
  document.querySelectorAll('[data-gola-text]').forEach(function (label) {
    var parts = label.getAttribute('data-gola-text').split('|');
    var check = document.getElementById(label.getAttribute('data-gola-for'));
    function sync() { label.textContent = check && check.checked ? parts[0] : (parts[1] !== undefined ? parts[1] : parts[0]); }
    if (check) check.addEventListener('change', sync);
    sync();
  });

  /* 데모 배선: [data-gola-modal-open/close] -> 모달 열고닫기 (열 때 포커스 이동·닫을 때 반환) */
  document.querySelectorAll('[data-gola-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var m = document.querySelector(btn.getAttribute('data-gola-modal-open'));
      if (!m) return;
      m._golaOpener = btn;
      m.classList.add('open');
      golaFitModal(); /* 열린 뒤 실측 zoom (display:none 상태에선 측정 불가) */
      var f = null; /* 초기 포커스는 트랩 목록 첫 요소 (닫기 버튼 고정 점프 정정) */
      var fl = m.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
      for (var fi = 0; fi < fl.length; fi++) {
        if (!fl[fi].disabled && fl[fi].offsetParent !== null) { f = fl[fi]; break; }
      }
      if (f) f.focus();
    });
  });
  document.querySelectorAll('[data-gola-modal-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var m = document.querySelector(btn.getAttribute('data-gola-modal-close'));
      if (!m) return;
      m.classList.remove('open');
      if (m._golaOpener && m._golaOpener.focus) m._golaOpener.focus();
    });
  });
  /* Esc로 닫기 + 포커스 트랩 (fixed .gola-modal 한정, 인라인 견본 제외) */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.gola-modal.open:not(.gola-modal--inline)').forEach(function (m) {
        m.classList.remove('open');
        if (m._golaOpener && m._golaOpener.focus) m._golaOpener.focus();
      });
    }
    if (e.key === 'Tab') {
      var m = document.querySelector('.gola-modal.open:not(.gola-modal--inline)');
      if (!m) return;
      var f = Array.prototype.slice.call(m.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(function (b) { return !b.disabled && b.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });

  /* 실제 토스트 스포너: ToastUIManager.AddToast 근사.
     슬라이드인 0.2s + 표시 3.5s + 페이드아웃 0.2s, 최대 3개(오래된 것부터 제거).
     [data-gola-allow] 체크박스가 꺼져 있으면 차단 (원본 ToastMessageAllow).
     force=true면 게이트 무시 (원본 force 플래그). 전역에서 golaToast(msg, cls, force)로 호출 가능. */
  /* 스택 붕괴 복구: 제거 시점에 생존자 전원 marginTop 재계산 (위부터 0,55,35 순).
     간격은 새로 들어온 토스트가 가짐 (CSS .show+.show 인접 마진과 같은 방향). 기존 토스트는 손대지 않음. */
  /* ToastUI.cs Stack() 근사: 기존 토스트는 Y 이동(+55/+35 마진) + 크기 축소(FirstDisplacementSizeDelta 110x30 절대값) + 폰트 16px + 원본 CutText per-char 재현(totalSteps=(len-4)+3, interval=200/totalSteps로 한 글자씩 절단 후 '.' 한 점씩 추가, 최종 4자+...) */
  function shrinkStackedToast(t, instant) {
    if (t.dataset.fullText === undefined) t.dataset.fullText = t.textContent;
    var full = t.dataset.fullText;
    var maxChars = 4; /* LIMITS.toastChars */
    t.classList.add('gola-toast--stacked'); /* gola.css:161 축소체와 일원화 (이전 감산 오해석 정정) */
    t.style.fontSize = '16px'; /* DisplacementTextFontSize 16 (원본 36→16) */
    t.style.width = '110px'; /* FirstDisplacementSizeDelta.x 절대값 (700-110 감산 오해석 정정) */
    t.style.height = '30px'; /* FirstDisplacementSizeDelta.y 절대값 (50-30 감산 오해석 정정, CSS 클래스와 동일값) */
    t.dataset.shrunk = '1';
    t.__cutGen = (t.__cutGen || 0) + 1; /* 재축소 시 이전 체인 무효화 */
    var gen = t.__cutGen;
    if (t.__cutT) { clearTimeout(t.__cutT); t.__cutT = null; }
    if (full.length < maxChars) { t.textContent = full; return; }
    if (instant) { t.textContent = full.slice(0, maxChars) + '...'; return; }
    var totalSteps = (full.length - maxChars) + 3; /* 원본 CutText totalSteps=(len-max)+3 */
    var interval = 200 / totalSteps; /* MoveDuration 0.2s 분할 */
    var i = full.length;
    function appendDots(n) {
      if (gen !== t.__cutGen || !t.isConnected) return;
      t.textContent = full.slice(0, maxChars) + '.'.repeat(n);
      if (n < 3) t.__cutT = setTimeout(function () { appendDots(n + 1); }, interval);
    }
    function tickDown() {
      if (gen !== t.__cutGen || !t.isConnected) return;
      if (i > maxChars) {
        i--;
        t.textContent = full.slice(0, i);
        t.__cutT = setTimeout(tickDown, interval);
      } else appendDots(1);
    }
    tickDown();
  }
  function recountStack() {
    var b = document.querySelector('#golaToasts');
    if (!b) return;
    var kids = Array.prototype.slice.call(b.children);
    for (var i = 0; i < kids.length; i++) {
      var px = i === 0 ? 0 : (i === 1 ? 55 : 35);
      kids[i].dataset.stacked = String(i);
      kids[i].style.marginTop = px + 'px';
      if (i < kids.length - 1 && !kids[i].dataset.shrunk) shrinkStackedToast(kids[i]); /* 새 토스트以外는 축소 유지 */
    }
  }
  function golaToast(msg, cls, force) {
    if (!msg || !msg.trim()) return; /* 원본: 공백 거부 */
    var allow = document.querySelector('[data-gola-allow]');
    if (!force && allow && !allow.checked) return;
    var box = document.querySelector('#golaToasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'golaToasts';
      box.className = 'gola-toasts';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    if (!box.hasAttribute('role')) box.setAttribute('role', 'status');
    if (!box.hasAttribute('aria-live')) box.setAttribute('aria-live', 'polite');
    var t = document.createElement('div');
    t.className = 'gola-toast' + (cls ? ' ' + cls : '');
    t.textContent = msg;
    var vw = document.documentElement.clientWidth || window.innerWidth || 800;
    if (vw < 800) t.style.fontSize = Math.max(14, Math.round(36 * vw / 800)) + 'px'; /* 狭폭 per-toast 비례축소 (원본 toast.ts s=min(1,w/800), fontSize=max(14,round(36*s)) 그대로 — 800 이상만 CSS 36px) */
    box.appendChild(t);
    /* 스택 변위: 새 토스트가 자기 간격을 가짐 (첫 토스트 0·둘째 +55px·셋째 이후 +35px).
       기존 토스트는 Stack() 근사 축소 (폰트 16px+4자 즉시 절단+110x30, 위 shrinkStackedToast).
       퇴장은 페이드 0.2s(.dying→remove). */
    Array.prototype.slice.call(box.children, 0, box.children.length - 1).forEach(function (older) {
      if (!older.dataset.golaDying && !older.dataset.shrunk) shrinkStackedToast(older); /* Stack(): 새 도착 시 기존 전원 축소 (recountStack과 동일 shrunk 가드 — 진행 중 절단 재시작 방지) */
    });
    var depth = box.children.length - 1;
    var px = depth === 0 ? 0 : (depth === 1 ? 55 : 35);
    t.dataset.stacked = String(depth);
    t.style.marginTop = px + 'px';
    Array.prototype.slice.call(box.children, 0, Math.max(0, box.children.length - 3)).forEach(function (old) { /* 최대 3개: 초과분은 0.2s 페이드 후 제거 (원본 MaxAccumulation:3, 200ms 과도 4개 허용) */
      if (old.dataset.golaDying) return;
      old.dataset.golaDying = '1';
      old.classList.add('dying');
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); recountStack(); }, 200);
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.classList.add('show'); });
    });
    setTimeout(function () { t.classList.add('show'); }, 60); /* rAF 안 도는 탭 대비 */
    setTimeout(function () {
      t.classList.add('dying');
      setTimeout(function () { t.remove(); recountStack(); }, 200);
    }, 3500);
  }
  window.golaToast = golaToast;
  document.querySelectorAll('[data-gola-toast-text]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      golaToast(
        btn.getAttribute('data-gola-toast-text'),
        btn.getAttribute('data-gola-toast-color') || '',
        btn.hasAttribute('data-gola-toast-force'),
      );
    });
  });

  /* 대사 스포너: BackdoorTextPrinter 근사.
     원본(BackdoorText.cs/BackdoorTextPrinter.cs/TypeGola backdoor.ts) 대조 반영:
     - 타이핑 간격 기본 50ms(원본 textInterval 0.05, 레어 AppiHi 0.15는 opts.interval=150으로)
     - 공백(\s)은 시간 소비 0: 슬롯(위치)은 차지하되 대기·사운드 없음 (원본 GetAllCharacters '\0' continue)
     - firstWait 시작 전 대기 (원본 firstWaitTime: 첫만남 1.0/기타 0.25 → opts.firstWait ms, 기본 0=즉시)
     - hold=Infinity면 자동 페이드 없이 잔류 (원본 In=Infinity, 버튼까지 잔류. 중간 화면 클릭은 다음 화면으로, 최종 화면은 Esc 2회·더블클릭·golaSayClear()로 해제)
     - 줄큐: hold 없는 golaSay([{text,color},...])는 단일화면 다파트(색 파트 연결 타이핑),
       hold/h를 가진 객체 배열은 화면 단위 다화면 큐로 해석 (per-screen hold 적용).
       다화면 규격: golaSay(["화면1","화면2"]) / golaSay([["파트배열"],["파트배열"]]) / golaSay({screens:[...]})
       (hold 없는 bare [{text,color}]만 단일화면 파트로 해석)
     - 파트별 색 (원본 mainColor, 예 BackDoor #FF8000)
     - 중앙 슬롯 격자: 바깥 고정폭 슬롯+안쪽 글리프 분리 (TypeGola .bd-slot>.bd-g, slotW=spacing*108)
       + 글리프 이탤릭 skewX(-19.29deg) (TMP Italic 근사) + 글자 나타나기 페이드 opacity .18s
     - 클릭=즉시완성 유지 (포크 명시: 원본 Printer는 클릭으로 닫지 않음. 타이핑중 클릭=전문 표시,
       hold중 클릭=다음 화면/닫기 스킵, Infinity 최종화면 단일 클릭·단일 Esc=잔류, Esc 2회·더블클릭·golaSayClear()=해제)
     - 좁은 화면 0.7 하한: 한 줄 실측 후 scale>=0.7이면 zoom 축소, 미만이면 wrap (원본 fitBackdoorLine)
     - 글자당 사운드: 에셋 없이 자동 비프 없음. 필요하면 window.golaSaySound(ch, i, screenIdx)로 배선 (원본 매 글자 랜덤 5종 무게이트)
     호환: golaSay("대사","#색",머무름ms) / data-gola-say-text·color·hold 그대로 동작.
     hold 표기 "Infinity"/"inf" 허용. data-gola-say-queue(JSON)·interval·first-wait는 있으면 사용. */
  function parseSayHold(v, def) {
    if (v === undefined || v === null || v === '') return def;
    if (typeof v === 'number') return v;
    var s = String(v).trim().toLowerCase();
    if (s === 'infinity' || s === 'inf' || s === '+inf') return Infinity;
    var n = parseInt(s, 10);
    return isNaN(n) ? def : n;
  }
  function ensureSayBox() {
    var box = document.querySelector('#golaSay');
    if (!box) {
      box = document.createElement('div');
      box.id = 'golaSay';
      box.className = 'gola-say';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    if (!box.hasAttribute('role')) box.setAttribute('role', 'status');
    if (!box.hasAttribute('aria-live')) box.setAttribute('aria-live', 'polite');
    if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1'); /* say 오픈 시 포커스 이동용 (Enter/Space 키보드 진행) */
    return box;
  }
  function fitSayBox(box) {
    if (!box || !box.classList.contains('show')) return;
    box.style.zoom = '';
    var ws = box.style.whiteSpace;
    box.style.whiteSpace = 'nowrap';
    var need = box.scrollWidth;
    var avail = box.clientWidth || (window.innerWidth - 48);
    box.style.whiteSpace = ws;
    if (!(need > 0) || !(avail > 0) || need <= avail) return;
    var scale = avail / need;
    if (scale >= 0.7 && scale < 1) box.style.zoom = String(scale);
    else box.style.zoom = ''; /* 0.7 미만은 원복+wrap (원본 fitBackdoorLine) */
  }
  function hideSayBox(box, st) {
    if (!box) return;
    if (st) { clearTimeout(st.typingTimer); clearTimeout(st.holdTimer); }
    clearTimeout(box.__t);
    clearTimeout(box.__firstT); /* firstWait 예약 재생 무효화 (지운 박스 부활 방지) */
    box.__gen = (box.__gen || 0) + 1; /* 예약 타이머 gen 통과 차단 */
    box.__escLast = 0; /* Esc 2회 해제 카운트 리셋 */
    box.classList.remove('show');
    box.removeAttribute('aria-busy'); /* busy 잔류 해제 (다음 playScreen이 다시 true) */
    box.innerHTML = ''; /* opacity:0 잔류 글리프의 stale aria-live 노출 방지 */
    box.style.pointerEvents = '';
    box.style.zoom = '';
    box.onclick = null;
    box.ondblclick = null;
  }
  function golaSay(textOrQueue, colorOrOpts, holdOrOpts) {
    var box = ensureSayBox();
    var globalColor = '#fff', globalHold = 2200, globalInterval = 50, globalFirstWait = 0, globalSpacing = 0.4;
    var globalFontPx = 0, onChar = null, globalAppear = false; /* BD 표준 appear:0/idle:0 → 기본은 페이드 없이 즉시 표시, appear opt-in */
    var pendingScreens = null; /* 2번째 인자 {screens} 흡수분 — 정규화 전에 absorbOpts가 채우고 정규화 뒤에 적용 (조용히 버려짐 방지) */
    function absorbOpts(x) {
      if (x === undefined || x === null) return;
      if (typeof x === 'number' || (typeof x === 'string' && /^\s*(infinity|inf|-?\d)/i.test(x))) {
        /* 숫자(또는 hold 문자열)는 hold로. 단 색상 "#fff"는 위 정규에 안 걸리므로 안전 */
        globalHold = parseSayHold(x, globalHold);
        return;
      }
      if (typeof x === 'string') { globalColor = x; return; }
      if (typeof x === 'object' && !Array.isArray(x)) {
        if (x.color !== undefined) globalColor = x.color;
        if (x.hold !== undefined) globalHold = parseSayHold(x.hold, globalHold);
        if (x.holdMs !== undefined) globalHold = parseSayHold(x.holdMs, globalHold);
        if (x.interval !== undefined) globalInterval = parseInt(x.interval, 10) || 0;
        if (x.textInterval !== undefined) globalInterval = Math.round(parseFloat(x.textInterval) * 1000) || 0;
        if (x.firstWait !== undefined) globalFirstWait = parseSayHold(x.firstWait, 0) === Infinity ? Infinity : (parseInt(x.firstWait, 10) || 0); /* firstWait Infinity는 자동 표시 안 함 (0으로 꺾지 않음, SPEC 의도적 결정 참조) */
        if (x.firstWaitMs !== undefined) globalFirstWait = parseInt(x.firstWaitMs, 10) || 0;
        if (x.spacing !== undefined) globalSpacing = parseFloat(x.spacing) || 0.4;
        if (x.fontSize !== undefined) globalFontPx = parseInt(x.fontSize, 10) || 0;
        if (x.textSize !== undefined) globalFontPx = Math.round(parseFloat(x.textSize) * 11) || 0;
        if (typeof x.onChar === 'function') onChar = x.onChar;
        if (x.appear !== undefined) globalAppear = !!x.appear;
        if (x.screens !== undefined) { if (Array.isArray(x.screens)) pendingScreens = x.screens.slice(); return; }
      }
    }
    absorbOpts(colorOrOpts);
    absorbOpts(holdOrOpts);
    /* 화면 정규화: screens = [{parts:[{text,color,interval}], hold, interval}] */
    var rawScreens = null;
    function toParts(entry, fbColor) {
      if (typeof entry === 'string') return [{ text: entry, color: fbColor }];
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        if (Array.isArray(entry.parts)) {
          return entry.parts.map(function (p) {
            if (typeof p === 'string') return { text: p, color: fbColor };
            /* V1.7 AppiHi subColor·idle·colorTransition은 엔진 미지원 포크 — 필드만 유지(재현 제외 최종 결정, SPEC 참고) */
            return { text: String(p.text !== undefined ? p.text : (p.t || '')), color: p.color || p.c || fbColor, interval: p.interval, subColor: p.subColor, idle: p.idle, colorTransition: p.colorTransition };
          });
        }
        /* t/c/h 별칭 수용 (데모 단축키): text=t||text, color=c||color, hold=h||hold */
        var tx = entry.text !== undefined ? entry.text : entry.t;
        var co = entry.color !== undefined ? entry.color : entry.c;
        var iv0 = entry.interval;
        return [{ text: String(tx || ''), color: co || fbColor, interval: iv0, subColor: entry.subColor, idle: entry.idle, colorTransition: entry.colorTransition }];
      }
      return [{ text: '', color: fbColor }];
    }
    if (typeof textOrQueue === 'string') {
      rawScreens = [textOrQueue];
    } else if (Array.isArray(textOrQueue)) {
      var hasNested = textOrQueue.some(function (e) { return Array.isArray(e); });
      var hasString = textOrQueue.some(function (e) { return typeof e === 'string'; });
      var allPartObj = textOrQueue.length > 0 && textOrQueue.every(function (e) {
        return e && typeof e === 'object' && !Array.isArray(e) && (typeof e.text === 'string' || typeof e.t === 'string') && e.screens === undefined;
      });
      if (hasNested || hasString) rawScreens = textOrQueue.slice();
      else if (allPartObj) {
        var hasHold = textOrQueue.some(function (e) { return e.hold !== undefined || e.h !== undefined; });
        if (hasHold) rawScreens = textOrQueue.slice(); /* hold 보유 객체 배열은 화면 단위 다화면 큐 */
        else rawScreens = [textOrQueue.slice()]; /* hold 없음 = 단일화면 다파트(색 파트 연결) */
      }
      else if (textOrQueue.length === 0) return;
      else rawScreens = textOrQueue.slice();
    } else if (textOrQueue && typeof textOrQueue === 'object') {
      if (Array.isArray(textOrQueue.screens)) rawScreens = textOrQueue.screens.slice();
      else if (Array.isArray(textOrQueue.parts)) rawScreens = [textOrQueue.parts.slice()];
      else if (typeof textOrQueue.text === 'string' || typeof textOrQueue.t === 'string') {
        rawScreens = [textOrQueue];
        if (textOrQueue.hold !== undefined || textOrQueue.h !== undefined) absorbOpts({ hold: textOrQueue.hold !== undefined ? textOrQueue.hold : textOrQueue.h });
        if (textOrQueue.interval !== undefined) absorbOpts({ interval: textOrQueue.interval });
      } else return;
    } else return;
    /* 2번째 인자 {screens}가 있으면 우선 적용 (1번째 인자보다 명시적 opts를 신뢰) */
    if (pendingScreens) rawScreens = pendingScreens.slice();
    if (!rawScreens || !rawScreens.length) return;
    var screens = rawScreens.map(function (s) {
      if (typeof s === 'string') return { parts: [{ text: s, color: globalColor }], hold: globalHold, interval: globalInterval };
      if (Array.isArray(s)) {
        return {
          parts: s.map(function (p) {
            if (typeof p === 'string') return { text: p, color: globalColor };
            return { text: String(p.text !== undefined ? p.text : (p.t || '')), color: p.color || p.c || globalColor, interval: p.interval, subColor: p.subColor, idle: p.idle, colorTransition: p.colorTransition };
          }),
          hold: globalHold, interval: globalInterval,
        };
      }
      var parts = toParts(s, globalColor);
      var h = (s && (s.hold !== undefined || s.h !== undefined)) ? parseSayHold(s.hold !== undefined ? s.hold : s.h, globalHold) : globalHold;
      var iv = (s && s.interval !== undefined) ? (parseInt(s.interval, 10) || 0) : globalInterval;
      return { parts: parts, hold: h, interval: iv };
    }).filter(function (s) {
      return s.parts.some(function (p) { return p.text.length > 0; });
    });
    if (!screens.length) return;
    /* 인터럽트: 기존 타이머 무효화 후 교체 (원본 ShowText 인터럽트, 큐잉 없음) */
    box.__gen = (box.__gen || 0) + 1;
    var gen = box.__gen;
    clearTimeout(box.__t);
    if (box.__st) { clearTimeout(box.__st.typingTimer); clearTimeout(box.__st.holdTimer); }
    clearTimeout(box.__firstT);
    box.innerHTML = '';
    box.style.zoom = '';
    var fontPx = globalFontPx || 44; /* textSize 4 → 44px (11배) */
    box.style.fontSize = fontPx + 'px';
    box.style.color = globalColor;
    var slotW = Math.round(globalSpacing * 108 * 10) / 10; /* spacing 0.4 → 43.2px (원본 backdoor.ts slotW=textSpacing*108, textSize와 독립 — 글리프 fontSize만 textSize*11 연동) */
    var st = {
      gen: gen, screens: screens, screenIdx: 0, phase: 'wait',
      chars: [], charPos: 0, typingTimer: null, holdTimer: null,
      hold: globalHold, interval: globalInterval,
    };
    box.__st = st;
    if (!box.__fitBound) {
      box.__fitBound = true;
      window.addEventListener('resize', function () { fitSayBox(box); });
    }
    function renderOne(ch, color, silent) {
      if (ch === '\n') { /* 줄바꿈은 새 .gola-say-line 행으로 (flex 행 래퍼 구조) */
        var nl = document.createElement('div');
        nl.className = 'gola-say-line';
        box.appendChild(nl);
        st.line = nl;
        return;
      }
      var slot = document.createElement('span');
      slot.className = 'gola-bd-slot';
      slot.style.display = 'inline-block';
      slot.style.width = slotW + 'px';
      slot.style.lineHeight = '1';
      slot.style.textAlign = 'center';
      slot.style.verticalAlign = 'baseline';
      slot.style.overflow = 'visible';
      var parent = (st.line && st.line.parentNode === box) ? st.line : box;
      parent.appendChild(slot);
      if (/\s/.test(ch)) return; /* 공백 슬롯만, 시간·사운드 없음 */
      var g = document.createElement('span');
      g.className = 'gola-bd-g';
      g.textContent = ch;
      g.style.display = 'inline-block';
      g.style.transform = 'skewX(-19.29deg)'; /* TMP Italic 근사 */
      g.style.transformOrigin = '50% 50%';
      g.style.lineHeight = '1';
      g.style.fontSize = fontPx + 'px'; /* 박스와 동일값 (textSize*11 연동, CSS 44px 직접 규칙 무력화) */
      g.style.color = color;
      if (globalAppear) {
        g.style.opacity = '0';
        g.style.transition = 'opacity .18s ease';
        slot.appendChild(g);
        void g.offsetWidth; /* 리플로우 후 페이드 (appear opt-in일 때만) */
        g.style.opacity = '1';
      } else {
        slot.appendChild(g); /* 기본은 페이드 없이 즉시 표시 (BD appear:0/idle:0) */
      }
      if (!silent) {
        try {
          if (onChar) onChar(ch, st.charPos, st.screenIdx);
          else if (typeof window.golaSaySound === 'function') window.golaSaySound(ch, st.charPos, st.screenIdx);
        } catch (e) { /* 사운드 훅 실패 무시 */ }
      }
    }
    function onScreenTyped() {
      if (st.gen !== box.__gen) return;
      st.phase = 'hold';
      fitSayBox(box);
      box.setAttribute('aria-busy', 'false'); /* 타이핑 완성 시점에 전체 텍스트 1회 공지 (타이핑 중 삽입은 aria-busy=true로 억제) */
      var cur = screens[st.screenIdx];
      st.hold = cur.hold;
      if (cur.hold === Infinity) return; /* 잔류: 클릭이 다음 화면으로 (최종화면은 잔류) */
      st.holdTimer = setTimeout(function () {
        if (st.gen !== box.__gen) return;
        advanceOrHide();
      }, Math.max(0, cur.hold));
      box.__t = st.holdTimer;
    }
    function advanceOrHide() {
      if (st.gen !== box.__gen) return;
      clearTimeout(st.holdTimer);
      if (st.screenIdx >= screens.length - 1) hideSayBox(box, st);
      else playScreen(st.screenIdx + 1);
    }
    function finishTyping() {
      if (st.gen !== box.__gen || st.phase !== 'typing') return;
      clearTimeout(st.typingTimer);
      while (st.charPos < st.chars.length) {
        var c = st.chars[st.charPos];
        renderOne(c.ch, c.color, true); /* 빨리감기분은 사운드 생략 */
        st.charPos++;
      }
      onScreenTyped();
    }
    function typeNext() {
      if (st.gen !== box.__gen || st.phase !== 'typing') return;
      while (st.charPos < st.chars.length) { /* 공백·개행은 대기 없이 즉시 */
        var w = st.chars[st.charPos];
        if (w.ch === '\n' || /\s/.test(w.ch)) { renderOne(w.ch, w.color, true); st.charPos++; continue; }
        break;
      }
      if (st.charPos >= st.chars.length) { onScreenTyped(); return; }
      var cur = st.chars[st.charPos];
      renderOne(cur.ch, cur.color, false);
      st.charPos++;
      var iv = (cur.interval !== undefined && cur.interval !== null) ? (parseInt(cur.interval, 10) || 0)
        : (screens[st.screenIdx].interval !== undefined ? screens[st.screenIdx].interval : globalInterval);
      if (!(iv > 0)) { typeNext(); return; } /* interval<=0이면 대기 없음 (원본 textInterval>0 가드) */
      st.typingTimer = setTimeout(function () { typeNext(); }, iv);
      box.__t = st.typingTimer;
    }
    function playScreen(idx) {
      if (st.gen !== box.__gen) return;
      st.screenIdx = idx;
      st.phase = 'typing';
      st.charPos = 0;
      clearTimeout(st.typingTimer);
      clearTimeout(st.holdTimer);
      box.innerHTML = '';
      box.style.zoom = '';
      var line = document.createElement('div');
      line.className = 'gola-say-line'; /* .gola-say(row flex) 직계 행 래퍼 — 행이 전폭 차지 후 세로 적층 */
      box.appendChild(line);
      st.line = line;
      box.__escLast = 0; /* 화면 전환 시 Esc 2회 카운트 리셋 */
      box.classList.add('show');
      box.setAttribute('aria-busy', 'true'); /* 타이핑 중 live region 중간 삽입 공지 억제, 완성 시(onScreenTyped) 해제 후 전체 1회 공지 */
      if (idx === 0 && document.activeElement && document.activeElement.tagName === 'BUTTON') box.focus(); /* 트리거 버튼에 포커스가 남으면 이후 Enter/Space가 박스 진행 대신 버튼 기본 활성화(golaSay 재시작)가 되므로 박스로 이동. INPUT/TEXTAREA/SELECT 포커스는 유지 */
      box.style.pointerEvents = 'auto'; /* CSS .gola-say:none 무력화(클릭 완성용) */
      var parts = screens[idx].parts;
      var flat = [];
      parts.forEach(function (p) {
        var col = p.color || globalColor;
        String(p.text || '').split('').forEach(function (ch) {
          flat.push({ ch: ch, color: col, interval: p.interval });
        });
      });
      st.chars = flat;
      typeNext();
    }
    function isFinalInfinity() {
      var cur = st.screens && st.screens[st.screenIdx];
      return st.screenIdx >= st.screens.length - 1 && (st.hold === Infinity || (cur && cur.hold === Infinity));
    }
    box.onclick = function (ev) {
      if (st.gen !== box.__gen) return;
      if (st.phase === 'typing') finishTyping();
      else if (st.phase === 'hold') {
        if (st.screenIdx >= screens.length - 1) {
          /* 최종 Infinity: 단일 클릭은 잔류, 더블클릭(detail>=2)으로 해제 (투명 전역 레이어 영구 가로챔 방지) */
          if (st.hold === Infinity) {
            if (ev && ev.detail >= 2) hideSayBox(box, st);
            return;
          }
          clearTimeout(st.holdTimer);
          hideSayBox(box, st);
        } else advanceOrHide(); /* Infinity 중간도 클릭으로 다음 화면 */
      }
    };
    box.ondblclick = function () {
      if (st.gen !== box.__gen) return;
      if (st.phase === 'hold' && isFinalInfinity()) hideSayBox(box, st); /* 최종 Infinity 명시적 해제 경로 */
    };
    if (!box.__sayKeyBound) { /* 키보드 진행 (원본 sceneButtons 기반 진행의 접근성 대응, 마우스 전용 정정) */
      box.__sayKeyBound = true;
      document.addEventListener('keydown', function (e) {
        var b = document.querySelector('#golaSay');
        if (!b || !b.classList.contains('show')) return;
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return;
        if (e.repeat) return; /* 꾹 누름 연타로 전 화면 스킵 방지 */
        var ae = document.activeElement;
        if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.tagName === 'BUTTON')) return; /* 포커스된 버튼의 Enter/Space 기본 활성화와 박스 진행 중복 방지 */
        if (e.key === 'Escape') {
          var sst = b.__st;
          var scur = sst && sst.screens && sst.screens[sst.screenIdx];
          if (scur && sst.screenIdx >= sst.screens.length - 1 && (scur.hold === Infinity || sst.hold === Infinity)) {
            /* 최종 Infinity: 단일 Esc는 잔류, 800ms 안 2회째에 해제 (golaSayClear()도 즉시 해제) */
            var now = Date.now();
            if (now - (b.__escLast || 0) < 800) { b.__escLast = 0; hideSayBox(b, sst); }
            else { b.__escLast = now; }
            e.preventDefault();
            return;
          }
          hideSayBox(b, sst);
        }
        else if (typeof b.onclick === 'function') b.onclick();
        e.preventDefault();
      });
    }
    if (globalFirstWait === Infinity) {
      /* 자동 표시 안 함: playScreen 예약 없이 박스만 준비 (hideSayBox로 잔류 상태 정리) */
      hideSayBox(box, st);
    } else if (globalFirstWait > 0) {
      box.__firstT = setTimeout(function () { if (st.gen === box.__gen) playScreen(0); }, globalFirstWait);
    } else playScreen(0);
  }
  window.golaSay = golaSay;
  window.golaSayClear = function () { hideSayBox(ensureSayBox(), ensureSayBox().__st); }; /* GoToScene식 즉시 싹 지움 */
  document.querySelectorAll('[data-gola-say-text],[data-gola-say-queue]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var q = btn.getAttribute('data-gola-say-queue');
      var hold = parseSayHold(btn.getAttribute('data-gola-say-hold'), 2200); /* null→2200은 parseSayHold 내 기본값 분기로 처리 */
      var ivRaw = btn.getAttribute('data-gola-say-interval');
      var fwRaw = btn.getAttribute('data-gola-say-first-wait');
      var opts = {
        color: btn.getAttribute('data-gola-say-color') || '#fff',
        hold: hold,
        interval: ivRaw === null ? 50 : (parseInt(ivRaw, 10) || 0),
        firstWait: fwRaw === null ? 0 : (parseSayHold(fwRaw, 0) === Infinity ? Infinity : (parseInt(fwRaw, 10) || 0)), /* "Infinity"는 Infinity 유지 (opts 경로 :366과 동일, SPEC :37) */
        appear: btn.hasAttribute('data-gola-say-appear'),
      };
      if (q) {
        try {
          var arr = JSON.parse(q);
          golaSay(arr, opts);
          return;
        } catch (e) { /* 파싱 실패면 텍스트 경로로 */ }
      }
      golaSay(btn.getAttribute('data-gola-say-text'), opts);
    });
  });

  /* 좁은 화면 자동맞춤: 원본 applyPanelScale(zoom s=min(1,W/800)) 근사.
     고정사이즈 컨트롤(버튼/스위치박스/슬라이더/재시작/모달버튼) 포함 블록은 측정·적용 제외 —
     Unity에 전역 자동맞춤이 없고 TypeGola도 모달 한정 zoom이라 원본 고정수치를 찌그러뜨리지 않게.
     텍스트 전용 블록(히어로 타이틀·타이포·지터)만 축소. */
  function golaFit() {
    document.querySelectorAll('[data-gola-fit]').forEach(function (el) {
      el.style.zoom = '';
      if (el.querySelector('.gola-btn,.gola-switchbox,.gola-slider,.gola-restart,.gola-modal-btn')) return;
      var r = el.getBoundingClientRect();
      var need = el.scrollWidth;
      var all = el.getElementsByTagName('*'); /* 중앙정렬은 양쪽으로 삐져나와서 좌우 끝단 전수로 잼 */
      var minL = Infinity, maxR = -Infinity;
      for (var i = 0; i < all.length; i++) {
        var c = all[i].getBoundingClientRect();
        if (c.left - r.left < minL) minL = c.left - r.left;
        if (c.right - r.left > maxR) maxR = c.right - r.left;
      }
      if (maxR > minL) need = Math.max(need, maxR - minL);
      var avail = el.parentElement.clientWidth - 4;
      if (need > avail && avail > 0) {
        el.style.zoom = String(Math.max(0.2, avail / need));
      }
    });
  }
  /* 모달 헤드 오버플로 zoom: title의 scrollWidth/clientWidth를 재고 zoom도 타이틀에만 (×◀▶ 60x60 버튼 동반축소 없음 — absolute라 head 측정 불가 정정).
     title은 100px 고정+말줄임, 좁은 폭은 title zoom으로 일원화 (clamp 없음). 로그 영역은 제외.
     TypeGola modal.ts의 W/800 컨테이너 균일축소와 다름 — 여긴 per-title 측정+title 적용형 (포크 명시). */
  function golaFitModal() {
    document.querySelectorAll('.gola-modal-head').forEach(function (head) {
      head.style.zoom = '';
      var title = head.querySelector('.gola-modal-title');
      if (!title) return;
      title.style.zoom = '';
      var need = title.scrollWidth;
      var avail = title.clientWidth;
      if (need > avail && avail > 0) title.style.zoom = String(Math.max(0.2, avail / need));
    });
  }
  window.addEventListener('resize', golaFit);
  window.addEventListener('resize', golaFitModal);
  window.addEventListener('orientationchange', golaFit);
  window.addEventListener('orientationchange', golaFitModal);
  golaFit();
  golaFitModal();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { golaFit(); golaFitModal(); }); /* 로드 시점(폰트·SDF 확정 전) 측정값 고착 방지 */
  window.addEventListener('load', function () { golaFit(); golaFitModal(); });

  /* 인라인 모달(외형 견본)+실모달 3버튼: ×=닫기(실모달·인라인 공통, 인라인은 첫 페이지로 리셋), ◀▶=버전 로그 페이지 전환.
     모든 .gola-modal이 data-gola-log-pages 기반 버전 내비게이션 (TypeGola prev/next는 VERSIONS 배열 이동). 단일-버전 주석과 충돌하던 창작 fallback은 삭제됨 */
  document.querySelectorAll('.gola-modal').forEach(function (m) {
    var log = m.querySelector('.gola-modal-log');
    if (!log) return;
    var full = log.innerHTML;
    var pages = [full];
    var extras = m.querySelectorAll('[data-gola-log-pages]'); /* 모달 내 script 전수 수집 (head+직계 복수 대응) */
    Array.prototype.forEach.call(extras, function (extra) {
      try {
        var arr = JSON.parse(extra.textContent || extra.getAttribute('data-gola-log-pages') || '[]');
        if (Array.isArray(arr) && arr.length) pages = pages.concat(arr);
        else if (arr && typeof arr === 'object') pages.push(arr);
        else if (typeof arr === 'string' && arr) pages.push(arr);
      } catch (e) { /* 파싱 실패면 해당 script만 건너뜀 */ }
    });
    var i = 0;
    function show(n) {
      i = (n + pages.length) % pages.length;
      var p = pages[i];
      if (typeof p === 'string') { log.innerHTML = p; return; } /* 로그만 교체 */
      log.innerHTML = p.log || ''; /* 원본 MoveVersion: 버전·코멘트·로그 전부 교체 */
      var vv = m.querySelector('.gola-modal-ver');
      if (vv && p.ver) vv.textContent = p.ver;
      var dv = m.querySelector('.gola-modal-v-dev');
      if (dv && p.dev !== undefined) dv.textContent = p.dev;
    }
    var prev = m.querySelector('.gola-modal-btn.prev, [data-gola-live-prev]');
    var next = m.querySelector('.gola-modal-btn.next, [data-gola-live-next]');
    var close = m.querySelector('.gola-modal-btn.close');
    if (prev) prev.addEventListener('click', function () { show(i - 1); });
    if (next) next.addEventListener('click', function () { show(i + 1); });
    if (close) close.addEventListener('click', function () {
      if (close.hasAttribute('data-gola-modal-close')) return; /* 실모달 ×는 닫기 배선이 우선 */
      show(0); /* 외형 견본 ×는 가짜 닫힘(로그 비움) 대신 첫 페이지로 리셋 */
    });
  });

  /* 스위치박스 ◀▶ 모드 순환: data-gola-cycle="-1|1" + data-gola-modes="a,b,c" (원본 Prev/Next stretch).
     GOLA_MODES/#t3 하드코딩은 하위호환 기본값으로 유지, 일반 페이지는 data 속성으로 덮어쓰기. */
  var GOLA_MODES = ['기본', '관성', '뚱뚱남'];
  window.GOLA_MODES = window.GOLA_MODES || GOLA_MODES;
  document.querySelectorAll('[data-gola-cycle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.gola-switchbox-row');
      var box = row && row.querySelector('.gola-switchbox .gola-text-skew');
      if (!box) return;
      var listRaw = (row && row.getAttribute('data-gola-modes')) || btn.getAttribute('data-gola-modes');
      var modes = listRaw ? listRaw.split(',').map(function (s) { return s.trim(); }) : (window.GOLA_MODES || GOLA_MODES);
      var dir = parseInt(btn.getAttribute('data-gola-cycle'), 10) || 1;
      var cur = modes.indexOf(box.textContent.trim());
      if (cur < 0) cur = 0;
      box.textContent = modes[(cur + dir + modes.length) % modes.length];
    });
  });

  /* 이미지 토글 그림 교체: 일반형 data-gola-img="onSrc|offSrc" + #t3 하위호환 (원본 SetImageFromToggleSwitch 그림 즉시교체) */
  function bindImgToggle(check, onSrc, offSrc) {
    if (!check) return;
    check.addEventListener('change', function () {
      var img = null;
      try {
        if (check.id) {
          var eid = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(check.id) : check.id.replace(/["\\]/g, '\\$&');
          img = document.querySelector('label[for="' + eid + '"] img') || (check.closest('label,div') && check.closest('label,div').querySelector('img'));
        } else {
          img = check.closest('label,div') && check.closest('label,div').querySelector('img');
        }
      } catch (e) {
        img = check.closest('label,div') && check.closest('label,div').querySelector('img');
      }
      if (!img) return;
      img.src = check.checked ? onSrc : offSrc;
      img.alt = check.checked ? 'on' : 'off';
    });
  }
  document.querySelectorAll('[data-gola-img]').forEach(function (check) {
    var parts = (check.getAttribute('data-gola-img') || '').split('|');
    if (parts[0] && parts[1]) bindImgToggle(check, parts[0], parts[1]);
  });
  var t3 = document.getElementById('t3');
  if (t3 && !t3.hasAttribute('data-gola-img')) {
    var ON3 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='40'%3E%3Crect width='70' height='40' fill='%2300FF00'/%3E%3C/svg%3E";
    var OFF3 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='40'%3E%3Crect width='70' height='40' fill='%23FF0000'/%3E%3C/svg%3E";
    bindImgToggle(t3, ON3, OFF3);
  }

  /* 종속 토글: data-gola-sub="부모체크박스ID" (V1.7 '토글 종속 UI 표시' 대응, ToggleSwitch.SubordinationButtonsCallback 근사).
     부모가 off면 자식 강제 off + 시각 dim(opacity .45), 부모 on이면 해제.
     원본은 SetEnableState(false)만 호출(disabled·dim 없음), disabled+dim은 GolaCSS 포크 (SPEC 의도적 결정 참조). */
  function syncSubToggle(child) {
    var pid = child.getAttribute('data-gola-sub');
    var parent = pid && document.getElementById(pid);
    if (!parent) return;
    if (!parent.checked && child.checked) child.checked = false;
    var row = child.closest('.gola-toggle-row') || child.closest('label') || child;
    child.disabled = !parent.checked ? true : false;
    if (row && row.style) row.style.opacity = parent.checked ? '' : '0.45';
    child.dispatchEvent(new Event('change', { bubbles: true }));
  }
  document.querySelectorAll('[data-gola-sub]').forEach(function (child) {
    var parent = document.getElementById(child.getAttribute('data-gola-sub'));
    syncSubToggle(child);
    if (parent) parent.addEventListener('change', function () { syncSubToggle(child); });
  });

  /* 닉네임 적용: data-gola-nick-apply — 빈값이면 red force 차단토스트,
     있으면 gold 로딩토스트 후 성공토스트 (원본 SkinSetting OnApplyButtonPress 근사).
     원본 OnFail의 error 0/1별 red force 실패 토스트는 네트워크 영역이라 미지원 (guide s-more·SPEC 명시).
     동일 닉네임 연속 적용 시 로딩 생략·성공만 (원본 HasCachedSkin 간이 재현). */
  var lastNickOk = '';
  var nickPending = ''; /* 로딩 시뮬레이션 창(1.2s) in-flight 가드 (원본 fetchSkin!=null early-return 재현 — 진행 중 재적용은 침묵) */
  var nickTimer = null;
  var NICK_BARE_SEL = 'input[type=text],input[type=email],input[type=number],input[type=password],input[type=search],input[type=tel],input[type=url],input:not([type])'; /* 클래스리스 입력 규칙(gola-classless.css:7)과 동일 범위 */
  var NICK_GATE_SEL = '.gola-auto,[data-gola],[data-gola-nick],[data-gola-vol],[data-gola-rgb]';
  document.querySelectorAll('[data-gola-nick-apply]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var scope = btn.closest('[data-gola-nick]') || document;
      var inp = scope.querySelector('.gola-input');
      if (!inp && scope !== document && scope.tagName === 'INPUT' && scope.matches(NICK_BARE_SEL)) inp = scope; /* 스코프 루트 자체가 input인 경우 */
      if (!inp) {
        inp = Array.prototype.filter.call(scope.querySelectorAll(NICK_BARE_SEL), function (el) { return !el.classList.contains('gola-slider') && !el.classList.contains('gola-hex') && !el.classList.contains('gola-value') && el.closest(NICK_GATE_SEL); })[0] || null; /* 베어는 스코프 후손 직접 조회+게이트 (구형 .gola-auto 자손 요구는 body.gola-auto>스코프·data-gola-off 구조에서 매칭 불가 정정) */
      }
      var v = inp ? inp.value.trim() : '';
      if (!v) golaToast('닉네임 입력이 없습니다.', 'gola-toast--red', true);
      else if (nickPending) { return; } /* 로딩 1.2s 창 내 재클릭은 동일·다른 닉·캐시 여부 무관 침묵 (원본 SkinManager fetchSkin!=null early-return 재현) */
      else if (v === lastNickOk) { golaToast(v + ' 스킨을 불러왔습니다.', 'gola-toast--gold'); }
      else {
        nickPending = v;
        golaToast(v + ' 스킨을 불러오는 중...', 'gola-toast--gold');
        if (nickTimer) clearTimeout(nickTimer);
        nickTimer = setTimeout(function () { nickPending = ''; lastNickOk = v; golaToast(v + ' 스킨을 불러왔습니다.', 'gola-toast--gold'); }, 1200); /* lastNickOk 기록은 성공 시점으로 이동 (클릭 동기 기록 시 더블클릭 중복 토스트 정정) */
      }
    });
  });
})();
