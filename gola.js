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
  document.querySelectorAll('.gola-slider').forEach(function (el) {
    paintSlider(el);
    el.addEventListener('input', function () { paintSlider(el); });
  });

  /* RGB <-> HEX <-> 미리보기 동기화 (data-gola-rgb="r,g,b" 스코프별) */
  document.querySelectorAll('[data-gola-rgb]').forEach(function (scope) {
    var sliders = scope.querySelectorAll('.gola-slider[data-ch="r"],.gola-slider[data-ch="g"],.gola-slider[data-ch="b"]');
    var inputs = scope.querySelectorAll('.gola-value');
    var hex = scope.querySelector('.gola-hex');
    var prev = scope.querySelector('.gola-color-preview');
    function read() {
      return [0, 1, 2].map(function (i) {
        return sliders[i] ? parseFloat(sliders[i].value) : 1;
      });
    }
    function render(from) {
      var c = read();
      var rgb = 'rgb(' + c.map(function (v) { return Math.round(v * 255); }).join(',') + ')';
      var hx = '#' + c.map(function (v) { return Math.round(v * 255).toString(16).padStart(2, '0'); }).join('').toUpperCase();
      if (prev) prev.style.background = rgb;
      if (from !== 'slider') sliders.forEach(function (s, i) { s.value = c[i]; paintSlider(s); });
      if (from !== 'input') inputs.forEach(function (inp, i) { inp.value = formatFloat(c[i]); });
      if (from !== 'hex' && hex) hex.value = hx;
      var vols = scope.querySelectorAll('.gola-vol-val');
      vols.forEach(function (v) { v.textContent = Math.ceil(c[0] * 100) + '%'; }); /* CeilToInt */
    }
    sliders.forEach(function (s) { s.addEventListener('input', function () { render('slider'); }); });
    inputs.forEach(function (inp, i) {
      inp.addEventListener('change', function () {
        var v = parseFloat(inp.value);
        if (isNaN(v)) { inp.value = formatFloat(read()[i]); return; } /* 원본: 무효면 lastText 복원 */
        sliders[i].value = Math.max(0, Math.min(1, v));
        render('input');
      });
    });
    var lastHex = hex ? hex.value : '';
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
      hex.value = '#' + short; /* 파싱된 6자리 정규격 표시 */
      lastHex = hex.value;
    });
    render('init');
    if (hex) lastHex = hex.value;
  });

  /* 볼륨 라벨: data-gola-vol 스코프 (값% 표시) */
  document.querySelectorAll('[data-gola-vol]').forEach(function (scope) {
    scope.querySelectorAll('.gola-slider[data-ch="vol"]').forEach(function (s) {
      var label = scope.querySelector('#' + s.getAttribute('data-label'));
      function sync() { if (label) label.textContent = Math.ceil(parseFloat(s.value)) + '%'; paintSlider(s); } /* min0 max100 정수+CeilToInt */
      s.addEventListener('input', sync); sync();
    });
  });

  /* 데모 배선: [data-gola-toast] 버튼 -> 토스트 3.5초 표시 (원본 Show 3.5s) */
  document.querySelectorAll('[data-gola-toast]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = document.querySelector(btn.getAttribute('data-gola-toast'));
      if (!t) return;
      t.classList.add('show');
      setTimeout(function () {
        t.classList.add('dying');
        setTimeout(function () { t.classList.remove('show', 'dying'); }, 200);
      }, 3500);
    });
  });

  /* 누름효과 opt-in: .gola-press 클릭 시 .gola-pressed 0.15s (원본 ButonPressAnimation 0.6배 축소→복원, 현재 미부착 데드코드라 opt-in) */
  document.querySelectorAll('.gola-press').forEach(function (b) {
    b.addEventListener('click', function () {
      b.classList.add('gola-pressed');
      setTimeout(function () { b.classList.remove('gola-pressed'); }, 150);
    });
  });

  /* 토글라벨 문구 교체: data-gola-text="켜짐문구|꺼짐문구" (원본 SetTextFromToggleSwitch는 문구 즉시교체+색 0.2s 트윈) */
  document.querySelectorAll('[data-gola-text]').forEach(function (label) {
    var parts = label.getAttribute('data-gola-text').split('|');
    var check = document.getElementById(label.getAttribute('data-gola-for'));
    function sync() { label.textContent = check && check.checked ? parts[0] : parts[1]; }
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
      var f = m.querySelector('[data-gola-modal-close]') || m.querySelector('button');
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
      var f = Array.prototype.slice.call(m.querySelectorAll('button')).filter(function (b) { return !b.disabled; });
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
  /* 스택 붕괴 복구: 제거 시점에 생존자 전원 marginTop/--stk-px 재계산 (위부터 0,55,35 순).
     간격은 새로 들어온 토스트가 가짐 (CSS .show+.show 인접 마진과 같은 방향). 기존 토스트는 손대지 않음. */
  function recountStack() {
    var b = document.querySelector('#golaToasts');
    if (!b) return;
    var kids = Array.prototype.slice.call(b.children);
    for (var i = 0; i < kids.length; i++) {
      var px = i === 0 ? 0 : (i === 1 ? 55 : 35);
      kids[i].dataset.stacked = String(i);
      kids[i].style.marginTop = px + 'px';
      kids[i].style.setProperty('--stk-px', px + 'px');
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
    box.appendChild(t);
    /* 스택 변위: 새 토스트가 자기 간격을 가짐 (첫 토스트 0·둘째 +55px·셋째 이후 +35px).
       기존 토스트는 손대지 않음 (도착 시 수축 없음). --stk-px는 호환 기록용
       (현 gola.css .dying은 X축+margin-top:0이라 var 미소비, gola.css 불변).
       퇴장은 페이드 0.2s(.dying→remove). 기존 토스트 문구·크기는 손대지 않음 */
    var depth = box.children.length - 1;
    var px = depth === 0 ? 0 : (depth === 1 ? 55 : 35);
    t.dataset.stacked = String(depth);
    t.style.marginTop = px + 'px';
    t.style.setProperty('--stk-px', px + 'px');
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

  /* 대사 스포너: BackdoorTextPrinter 근사 (44px 중앙 타이프+페이드, 클릭하면 즉시 완성).
     golaSay("대사", "#색", 머무름ms) 또는 data-gola-say-text 버튼. */
  function golaSay(text, color, holdMs) {
    if (!text) return;
    var box = document.querySelector('#golaSay');
    if (!box) {
      box = document.createElement('div');
      box.id = 'golaSay';
      box.className = 'gola-say';
      document.body.appendChild(box);
    }
    box.style.color = color || '#fff';
    box.textContent = '';
    box.classList.add('show');
    clearInterval(box.__iv);
    clearTimeout(box.__t);
    var hold = holdMs || 2200;
    var i = 0;
    function finish() {
      clearInterval(box.__iv);
      box.textContent = text;
      clearTimeout(box.__t);
      box.__t = setTimeout(function () { box.classList.remove('show'); }, hold);
    }
    box.__iv = setInterval(function () {
      i++;
      box.textContent = text.slice(0, i);
      if (i >= text.length) finish();
    }, 40);
    box.onclick = finish;
  }
  window.golaSay = golaSay;
  document.querySelectorAll('[data-gola-say-text]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      golaSay(
        btn.getAttribute('data-gola-say-text'),
        btn.getAttribute('data-gola-say-color') || '#fff',
        parseInt(btn.getAttribute('data-gola-say-hold') || '2200', 10),
      );
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
  /* 모달 컨테이너 균일축소: TypeGola modal.ts MODAL_BASE_W=800, s=min(1,W/800) 그대로.
     per-element clamp 대신 컨테이너 zoom이라 561~800 구간 타이틀 따로 작아짐 없음. */
  function golaFitModal() {
    document.querySelectorAll('.gola-modal-head').forEach(function (head) {
      head.style.zoom = '';
      var need = head.scrollWidth;
      var avail = head.clientWidth;
      if (need > avail && avail > 0) head.style.zoom = String(Math.max(0.2, avail / need));
    });
  }
  window.addEventListener('resize', golaFit);
  window.addEventListener('resize', golaFitModal);
  window.addEventListener('orientationchange', golaFit);
  window.addEventListener('orientationchange', golaFitModal);
  golaFit();
  golaFitModal();

  /* 인라인 모달(외형 견본)+실모달 3버튼: ×=닫기(실모달·인라인 공통, 인라인은 첫 페이지로 리셋), ◀▶=버전 로그 페이지 전환.
     #liveModal·인라인 모두 data-gola-log-pages 기반 버전 내비게이션 (TypeGola prev/next는 VERSIONS 배열 이동). 단일-버전 주석과 충돌하던 창작 fallback은 삭제됨 */
  document.querySelectorAll('.gola-modal--inline, #liveModal').forEach(function (m) {
    var log = m.querySelector('.gola-modal-log');
    if (!log) return;
    var full = log.innerHTML;
    var pages = [full];
    var extra = m.querySelector('[data-gola-log-pages]');
    if (extra) {
      try {
        var arr = JSON.parse(extra.textContent || extra.getAttribute('data-gola-log-pages') || '[]');
        if (arr && arr.length) pages = pages.concat(arr);
      } catch (e) { /* 파싱 실패면 첫 페이지만 */ }
    }
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

  /* 스위치박스 ◀▶ 모드 순환: data-gola-cycle="-1|1" (원본 Prev/Next stretch) */
  var GOLA_MODES = ['기본', '관성', '뚱뚱남'];
  document.querySelectorAll('[data-gola-cycle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.gola-switchbox-row');
      var box = row && row.querySelector('.gola-switchbox .gola-text-skew');
      if (!box) return;
      var dir = parseInt(btn.getAttribute('data-gola-cycle'), 10) || 1;
      var cur = GOLA_MODES.indexOf(box.textContent.trim());
      box.textContent = GOLA_MODES[(cur + dir + GOLA_MODES.length) % GOLA_MODES.length];
    });
  });

  /* 이미지 토글 그림 교체: #t3 on/off src 스왑 (원본 SetImageFromToggleSwitch 그림 즉시교체) */
  var t3 = document.getElementById('t3');
  if (t3) {
    var ON3 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='40'%3E%3Crect width='70' height='40' fill='%2300FF00'/%3E%3C/svg%3E";
    var OFF3 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='40'%3E%3Crect width='70' height='40' fill='%23FF0000'/%3E%3C/svg%3E";
    t3.addEventListener('change', function () {
      var img = document.querySelector('label[for="t3"] img');
      if (!img) return;
      img.src = t3.checked ? ON3 : OFF3;
      img.alt = t3.checked ? 'on' : 'off';
    });
  }

  /* 닉네임 적용: data-gola-nick-apply — 빈값이면 red force 차단토스트, 있으면 gold 성공토스트 */
  document.querySelectorAll('[data-gola-nick-apply]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var scope = btn.closest('[data-gola-nick]') || document;
      var inp = scope.querySelector('.gola-input');
      var v = inp ? inp.value.trim() : '';
      if (!v) golaToast('닉네임 입력이 없습니다.', 'gola-toast--red', true);
      else golaToast('스킨을 불러왔습니다: ' + v, 'gola-toast--gold');
    });
  });
})();
