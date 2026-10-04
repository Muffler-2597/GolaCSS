/* GolaCSS SDF 텍스트 렌더러 — TypeGolaSimulator src/text/{atlas,layout}.ts 그대로 캔버스에 이식.
   같은 아틀라스(sdf-atlas.png + sdf-metrics.json, D2CodingBold 베이크), 같은 pen-advance,
   같은 베이스라인(TMP 0.85em), 같은 half-texel inset, 같은 SPACE 0.5em.
   쓰는 법: <canvas class="gola-sdfcv" data-text="GolaGola" data-size="44" data-color="#fff"></canvas>
   속성: data-size(px) data-color(css색) data-italic(있으면 이탤릭 아틀라스) data-base(에셋 경로, 기본 ./assets/sdf/).
   아틀라스 로드 실패 시 D2Coding fillText로 대체 (CSS .gola-sdf와 동급). */
(function () {
  'use strict';

  var SPACE_EM = 0.5; /* layout.ts SOFT_LOOK.SPACE_EM */
  var TOP_TO_BASELINE_EM = 0.85; /* TMP ASCENT 76.5/90 */
  var LINE_HEIGHT_EM = 1.16; /* TMP 104.4/90 */
  var cache = {};

  function loadPair(base) {
    if (cache[base]) return cache[base];
    function img(src) {
      return new Promise(function (res, rej) {
        var im = new Image();
        im.onload = function () { res(im); };
        im.onerror = function () { rej(new Error('sdf img ' + src)); };
        im.src = src;
      });
    }
    function json(src) {
      return fetch(src).then(function (r) {
        if (!r.ok) throw new Error('sdf json ' + src);
        return r.json();
      });
    }
    cache[base] = Promise.all([
      img(base + 'sdf-atlas.png'), json(base + 'sdf-metrics.json'),
      img(base + 'sdf-atlas-italic.png'), json(base + 'sdf-metrics-italic.json'),
    ]).then(function (a) {
      return { img: a[0], data: a[1], imgIt: a[2], dataIt: a[3] };
    }).catch(function () { return null; });
    return cache[base];
  }

  /* layout.ts layoutLine 그대로: pen 전진, space 0.5em, missing은 space 취급 */
  function layoutLine(text, data, sizePx) {
    var k = sizePx / data.px;
    var items = [];
    var pen = 0;
    var missing = 0;
    for (var ch of text) {
      if (ch === ' ') { pen += sizePx * SPACE_EM; continue; }
      var g = data.glyphs[ch];
      if (!g) { pen += sizePx * SPACE_EM; missing++; continue; }
      items.push({ g: g, x: pen + g.ox * k, k: k });
      pen += g.adv * k;
    }
    return { items: items, width: pen, missing: missing };
  }

  function fallback(cv, text, size, color, italic) {
    var dpr = Math.min(4, Math.max(3, window.devicePixelRatio || 1)); /* 아틀라스 경로와 동일 3~4배 (SPEC '출력보다 항상 크게, 최소 3배') */
    var pad = Math.ceil(size * 0.1);
    var fw = Math.ceil((cv.clientWidth || 300) * dpr);
    if (fw > 8192) fw = 8192; /* 캔버스 정직 한계: 브라우저 최대 비트맵 초과 방지 */
    cv.width = Math.max(1, fw);
    cv.height = Math.ceil(size * LINE_HEIGHT_EM * dpr);
    cv.style.maxWidth = '100%';
    cv.style.height = 'auto';
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    if (italic) c.transform(1, 0, Math.tan(-19.29 * Math.PI / 180), 1, 0, 0); /* data-italic 캔버스와 맞춤: skewX(-19.29deg), 이탤릭 폰트 아님 */
    c.font = size + 'px D2Coding, monospace';
    c.textBaseline = 'alphabetic';
    c.fillStyle = color; /* 원본 CSS 색 문자열 그대로 — 브라우저가 rgb()/named 전부 해석, 침묵 흰색대체 없음 */
    c.fillText(text, pad, size * TOP_TO_BASELINE_EM);
    cv.dataset.golaSdfPath = 'fallback';
  }

  /* 원본 사용색 전수: 토스트 골드(#FFD700)·튜토리얼 yellow·스킨 rgb() 경로·changelog 금색 등 */
  var NAMED = { black: [0, 0, 0], white: [255, 255, 255], red: [255, 0, 0], green: [0, 255, 0],
    yellow: [255, 255, 0], gold: [255, 215, 0], orange: [255, 128, 0], blue: [0, 0, 255], gray: [128, 128, 128], grey: [128, 128, 128] };
  function parseColor(s) {
    s = String(s).trim().toLowerCase();
    if (NAMED[s]) return NAMED[s];
    var m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
    if (m) {
      var h = m[1];
      if (h.length === 3 || h.length === 4) h = h.split('').map(function (c) { return c + c; }).join('');
      h = h.slice(0, 6); /* #RRGGBBAA는 앞 6자리만 사용 (gola.js HEX 정책과 일치) */
      var n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var r = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/.exec(s);
    if (r) return [Number(r[1]), Number(r[2]), Number(r[3])].map(function (v) { return Math.max(0, Math.min(255, Math.round(v))); });
    return null; /* 모르는 색은 null — 호출자가 원본색 유지(fallback 위임), 흰색 침묵대체 금지 */
  }

  /* 스크립트 위치 기준 에셋 경로 자동 감지: 어디에 복사해도 ./assets/sdf/를 찾아감 */
  function defaultBase() {
    try {
      var s = document.currentScript;
      if (s && s.src) {
        var p = new URL(s.src, location.href).pathname;
        return p.slice(0, p.lastIndexOf('/') + 1) + 'assets/sdf/';
      }
    } catch (e) { /* 구형 브라우저는 상대경로로 */
    }
    return './assets/sdf/';
  }

  function render(cv, opts) {
    var text = opts.text || '';
    var size = opts.size || 36;
    var color = opts.color || '#fff';
    var italic = !!opts.italic;
    var base = opts.base || defaultBase();
    loadPair(base).then(function (A) {
      var data = A && (italic && A.dataIt ? A.dataIt : A.data);
      var atlasImg = A && (italic && A.imgIt ? A.imgIt : A.img);
      if (!data || !atlasImg) { fallback(cv, text, size, color, italic); queueSettle(); return; } /* 아틀라스 없음 → D2Coding fallback + fit 재측정 */
      var tint = parseColor(color);
      if (!tint) { fallback(cv, text, size, color, italic); queueSettle(); return; } /* 해석불가 색은 원본색 유지 fallback, 흰색 붕괴 금지 + fit 재측정 */
      var L = layoutLine(text, data, size);
      var dpr = Math.min(4, Math.max(3, window.devicePixelRatio || 1)); /* 항상 3배 이상: 어떤 줌아웃 합성에도 얇은 선 보존 */
      cv.dataset.golaSdfPath = 'atlas';
      var asc = size * TOP_TO_BASELINE_EM;
      var H = Math.ceil(size * LINE_HEIGHT_EM);
      var off = document.createElement('canvas');
      var ow = Math.ceil(L.width * dpr);
      if (ow > 8192) ow = 8192; /* 캔버스 정직 한계: 초장문은 잘림 (잘못된 full-width 렌더 금지) */
      off.width = Math.max(1, ow);
      off.height = Math.ceil(H * dpr);
      var k = size / data.px;
      var SS = Math.max(2, Math.ceil(k * dpr)); /* 적응형: 출력보다 항상 크게 찍어야 얇은 획이 안 끊김 (작은 글씨·저DPR은 2배, 큰 글씨·고DPR은 그 이상) */
      if (L.width / k * SS > 8192) SS = Math.max(1, Math.floor(8192 / (L.width / k))); /* 초장문 상한 */
      if (H / k * SS > 4096) SS = Math.max(1, Math.floor(4096 / (H / k))); /* 세로 상한 */
      var big = document.createElement('canvas');
      big.width = Math.max(1, Math.ceil(L.width / k * SS));
      big.height = Math.max(1, Math.ceil(H / k * SS));
      var bc = big.getContext('2d', { willReadFrequently: true });
      bc.imageSmoothingEnabled = true; /* half-texel 블릿은 보간 허용, 축소 합성만 high (거리장 임계 전 블릿 단계라 후광 없음) */
      L.items.forEach(function (it) {
        var g = it.g;
        bc.drawImage(atlasImg,
          g.x + 0.5, g.y + 0.5, g.w - 1, g.h - 1, /* half-texel inset */
          (it.x / k) * SS, (asc / k + g.oy) * SS, g.w * SS, g.h * SS);
      });
      /* 진짜 SDF 임계: R채널 거리값 0.5=엣지, 소프트 폭으로 커버리지화 (TMP 셰이더 단순형) */
      var SOFT = 0.09;
      var GAMMA = 0.7; /* SOFT_LOOK 감마 리프트 */
      var id = bc.getImageData(0, 0, big.width, big.height);
      var px = id.data;
      for (var p = 0; p < px.length; p += 4) {
        var d = px[p] / 255;
        var a = (d - 0.46) / (2 * SOFT) + 0.5; /* Unity Bold 가중치 dilate 재현 (bias 0.5→0.46, 속선 살림) */
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        a = Math.pow(a, GAMMA);
        px[p] = tint[0]; px[p + 1] = tint[1]; px[p + 2] = tint[2];
        px[p + 3] = Math.round(a * 255);
      }
      bc.putImageData(id, 0, 0);
      var c = off.getContext('2d');
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = 'high';
      c.clearRect(0, 0, off.width, off.height);
      c.drawImage(big, 0, 0, big.width, big.height, 0, 0, off.width, off.height);
      cv.width = off.width;
      cv.height = off.height;
      cv.style.width = (off.width / dpr) + 'px';
      cv.style.height = 'auto'; /* 좁은 칸에서 max-width로 줄 때 비율 유지 (고정 px면 가로로 찌그러짐) */
      cv.style.maxWidth = '100%';
      var ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(off, 0, 0);
      cv.dataset.golaSdfMissing = String(L.missing);
      cv.dataset.golaSdfPass = String((parseInt(cv.dataset.golaSdfPass || '0', 10) || 0) + 1);
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', text);
      queueSettle();
    }).catch(function () { fallback(cv, text, size, color, italic); queueSettle(); });
  }

  function refreshAll() {
    document.querySelectorAll('canvas.gola-sdfcv').forEach(function (cv) { delete cv.dataset.golaSdfDone; });
    init();
  }

  var lastW = 0; /* 마지막 렌더 시점 뷰포트폭 — 같으면 리사이즈 무시 (루프 방지) */
  var settleT = null;
  /* 렌더가 끝나면 fit에 재측정 기회를 줌 (캔버스 크기가 뒤늦게 확정되므로) */
  function queueSettle() {
    if (settleT) return;
    settleT = setTimeout(function () {
      settleT = null;
      lastW = document.documentElement.clientWidth;
      window.dispatchEvent(new Event('resize'));
    }, 120);
  }

  function init(scope) {
    lastW = document.documentElement.clientWidth;
    (scope || document).querySelectorAll('canvas.gola-sdfcv').forEach(function (cv) {
      if (cv.dataset.golaSdfDone) return;
      cv.dataset.golaSdfDone = '1';
      if (!cv.hasAttribute('role')) cv.setAttribute('role', 'img');
      if (!cv.hasAttribute('aria-label')) cv.setAttribute('aria-label', cv.getAttribute('data-text') || '');
      render(cv, {
        text: cv.getAttribute('data-text') || '',
        size: parseFloat(cv.getAttribute('data-size')) || 36,
        color: cv.getAttribute('data-color') || '#fff',
        italic: cv.hasAttribute('data-italic'),
        base: cv.getAttribute('data-base') || undefined,
      });
    });
  }

  window.golaSDF = { render: render, init: init, refresh: refreshAll };

  /* 창 크기·배율 변경에 다시 찍기 (비트맵 고정이라 안 하면 흐려짐).
     폭이 그대로면 무시 → queueSettle의 resize와 루프 없음. */
  var rsT = null;
  window.addEventListener('resize', function () {
    if (rsT) clearTimeout(rsT);
    rsT = setTimeout(function () {
      var w = document.documentElement.clientWidth;
      if (w === lastW) return;
      refreshAll();
    }, 200);
  });
  /* DPR 변경(브라우저 줌·모니터 이동) 감시 */
  function watchDpr() {
    try {
      var mq = window.matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
      var h = function () { refreshAll(); watchDpr(); };
      if (mq.addEventListener) mq.addEventListener('change', h);
      else if (mq.addListener) mq.addListener(h);
    } catch (e) { /* 구형 브라우저는 리사이즈만 */ }
  }
  watchDpr();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})();
