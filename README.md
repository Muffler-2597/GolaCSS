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
<input type="checkbox" class="gola-check" id="g1" checked>
<label class="gola-switch" for="g1"><span class="gola-knob"></span></label>
```

![볼륨](shots/s-vol.png)

```html
<input type="range" class="gola-slider" data-ch="vol" data-label="gdM" min="0" max="100" step="1" value="100">
<span class="gola-vol-val" id="gdM">100%</span>
```

![RGB](shots/s-rgb.png)

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
![확장](shots/s-extra.png)
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
| `demo-classless.html` | 클래스리스 미니 메뉴 |
| `SPEC.md` | 수치·결정 기록 (개발용) |
