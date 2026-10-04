# GolaCSS

Unity 게임 메뉴 UI를 웹에서 그대로 쓰는 키트. 빌드 없음, 의존성 없음.

```html
<link rel="stylesheet" href="gola.css">
<script src="gola.js"></script>
```

클래스 없이 쓰고 싶으면 한 줄 더. 그냥 태그가 게임 모양으로 바뀝니다.

```html
<link rel="stylesheet" href="gola-classless.css">
```

기본 켜짐이에요. `body`에 `gola-auto`가 자동으로 붙고, 빼려면 `<body data-gola-off>`. 직접 단 `.gola-*`가 항상 이겨요. 라벨은 `<label>`로 감싸면 한 줄 행 (토글행 30px, 일반 24px).

![히어로](shots/hero.png)

## 갤러리

![버튼](shots/s-btn.png)

```html
<button class="gola-btn">버전 정보</button>
<button class="gola-btn gola-btn--sm">작은 버튼</button>
<button class="gola-restart">재시작</button>
```

![토글](shots/s-toggle.png)

```html
<input type="checkbox" class="gola-check" id="g1" checked aria-label="토스트 알람">
<label class="gola-switch" for="g1"><span class="gola-knob"></span></label>
```

![볼륨](shots/s-vol.png)

```html
<div data-gola-vol>
<input type="range" class="gola-slider" data-ch="vol" data-label="gdM" min="0" max="100" step="1" value="100" aria-label="마스터 볼륨">
<span class="gola-vol-val" id="gdM">100%</span>
</div>
```

![RGB](shots/s-rgb.png)

```html
<div data-gola-rgb>
  <input type="range" class="gola-slider" data-ch="r" min="0" max="1" step="0.0001" value="1" aria-label="R 값">
  <input type="range" class="gola-slider" data-ch="g" min="0" max="1" step="0.0001" value="0.5" aria-label="G 값">
  <input type="range" class="gola-slider" data-ch="b" min="0" max="1" step="0.0001" value="0" aria-label="B 값">
  <input type="text" class="gola-value" value="1.0" maxlength="6" aria-label="R 값">
  <input type="text" class="gola-value" value="0.5" maxlength="6" aria-label="G 값">
  <input type="text" class="gola-value" value="0" maxlength="6" aria-label="B 값">
  <input type="text" class="gola-hex wide" value="#FF8000" maxlength="9" aria-label="HEX 색상">
  <div class="gola-color-preview"></div>
</div>
```

![닉네임](shots/s-nick.png)

![토스트](shots/s-toast.png)

```html
<button data-gola-toast-text="스킨을 불러왔습니다." data-gola-toast-color="gola-toast--gold">골드</button>
```

![실시간 토스트](shots/toasts-live.png)

![대사](shots/s-say.png)

```html
<button data-gola-say-text="여기가 백도어다." data-gola-say-color="#FFD700">말 걸기</button>
```

한 줄씩 표시, 새 호출이 바로 덮어씀. 이어갈 땐 배열 큐 한 번으로: `golaSay([{text:"첫 줄",hold:2000},{text:"둘째 줄",hold:2000}])` (hold "Infinity" 잔류, 50ms/자). 자세히는 `guide.html` -대사- 참고.

![모달](shots/s-modal.png)

![실시간 모달](shots/modal-live.png)

![SDF](shots/s-sdf.png)

```html
<canvas class="gola-sdfcv" data-text="GolaGola" data-size="40" data-color="#fff"></canvas>
```

![스위치박스](shots/s-box.png)
![재시작](shots/s-restart.png)
![이미지 토글](shots/s-img.png)
![HEX](shots/s-hex.png)
![타이포](shots/s-type.png)
![지터](shots/s-stf.png)
![패널](shots/s-panel.png)
![그리드](shots/s-grid.png)

```html
<div class="gola-grid"><div class="gola-card">셀</div></div>
```

![확장(카드·배지·구분선 — select·textarea·radio 전용 샷 없음)](shots/s-extra.png)

```html
<select class="gola-select" aria-label="스킨 유형"><option>클래식</option><option>슬림</option></select>
<textarea class="gola-textarea" rows="2" placeholder="메모" aria-label="메모"></textarea>
<label><input type="radio" class="gola-radio" name="q" checked> 예</label>
```

![문](shots/s-door.png)
![푸터](shots/footer.png)

## 파일

| 파일 | 설명 |
|---|---|
| `gola.css` | 본체 |
| `gola.js` | 배선 (없어도 토글·드래그는 동작) |
| `gola-classless.css` | 클래스 없이 쓰는 확장 |
| `gola-sdf.js` | SDF 캔버스 렌더러 + `assets/sdf/` |
| `index.html` | 개발용 대조실 |
| `guide.html` | 사용 설명서 |
| `SNIPPETS.md` | 복붙 모음 (이 README보다 자세함) |
| `demo-classless.html` | 클래스리스 미니 메뉴 |
| `SPEC.md` | 수치·결정 기록 (개발용) |
