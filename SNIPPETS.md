# GolaCSS 복붙 모음

다 외울 필요 없어요. 여기서 찾아서 붙이면 됩니다. 더 긴 설명은 `guide.html` 참고.

## 시작

```html
<link rel="stylesheet" href="gola.css">
<script src="gola.js"></script>
```

클래스 없이 쓰고 싶으면 한 줄 더. 그냥 태그가 게임 모양으로 바뀝니다.

```html
<link rel="stylesheet" href="gola-classless.css">
```

```html
<body data-gola-off> <!-- 자동 적용 끄기 -->
```

기본 켜짐이에요. `body`에 `gola-auto`가 자동으로 붙어요. 직접 단 `.gola-*`가 항상 이기니 섞어 써도 깨지지 않아요.

## 버튼

```html
<button class="gola-btn">버전 정보</button>
<button class="gola-btn gola-btn--sm">작은 버튼</button>
<button class="gola-restart">재시작</button>
```

눌러도 모양이 안 바뀌는 게 정상. 원본이 그래요 (재시작만 hover 틴트 있음). 눌림 효과는 쓸 때만:

```html
<button class="gola-btn gola-btn--sm gola-press">눌림 opt-in</button>
```

## 토글 + 라벨 한 줄

라벨은 `<label>`로 감싸면 한 줄 행이 됩니다. 토글 들어간 행은 30px, 일반 행은 24px.

```html
<input type="checkbox" class="gola-check" id="g1" checked aria-label="토스트 알람">
<label class="gola-switch" for="g1"><span class="gola-knob"></span></label>
<span class="gola-label" data-gola-text="토스트 알람 켬|토스트 알람 끔" data-gola-for="g1">토스트 알람 켬</span>
```

클래스 없이 쓸 땐 이렇게. `data-gola-text="켬|끔"`이면 문구까지 같이 바뀌어요.

```html
<label><input type="checkbox" checked> 토스트 알람 켬</label>
<label>마스터 <input type="range" data-ch="vol" min="0" max="100" step="1" value="100"></label>
```

작은 입력칸(HEX·RGB값용)은 `size`만 달면 100px로 줄어들어요.

```html
<input type="text" size="4" value="1.0">
```

## 슬라이더

채움 표시와 % 표기는 `gola.js`가 알아서 해줘요. 범위는 0~100 정수(step 1), 표기는 CeilToInt+%.

```html
<div data-gola-vol>
<input type="range" class="gola-slider" data-ch="vol" data-label="gdM" min="0" max="100" step="1" value="100" aria-label="마스터 볼륨">
<span class="gola-vol-val" id="gdM">100%</span>
</div>
```

RGB 세트는 `data-gola-rgb`로 묶으면 슬라이더·입력·HEX·미리보기가 같이 움직여요.

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

## 입력

값 입력 100px, HEX 110px, 닉네임 350px. HEX는 3/4/6/8자리 (알파 무시), 틀리면 자동으로 복원돼요.

```html
<input type="text" class="gola-value" value="1.0" maxlength="6" aria-label="값 입력">
<input type="text" class="gola-hex wide" value="#FF8000" maxlength="9" aria-label="HEX 색상">
<input type="text" class="gola-input" maxlength="16" placeholder="Minecraft 닉네임 입력..." aria-label="마인크래프트 닉네임">
```

## 토스트

버튼에 속성만 달면 진짜 토스트가 떠요. 알람 토글로 일반 토스트를 막을 수 있고, force는 뚫고 나와요.

```html
<button data-gola-toast-text="스킨을 불러왔습니다." data-gola-toast-color="gola-toast--gold">골드</button>
```

```js
golaToast("메시지", "gola-toast--red", true);
```

색은 `gola-toast--yellow` / `gold` / `red`. 표시 3.5초, 최대 3개. 스택되면 기존 토스트는 110x30·16px 부여 + 원본 CutText per-char 재현(한 글자씩 절단 후 '.' 한 점씩 추가, 최종 4자+...). 좁은 화면(vw<800)은 동적·정적 경로 모두 `max(14,round(36*w/800))` 인라인 기록.

정적 토스트(지정 토스트를 3.5초 표시):

```html
<button data-gola-toast="#myToast">열기</button>
<div class="gola-toasts gola-toasts--inline" role="status" aria-live="polite"><div class="gola-toast" id="myToast">저장됨</div></div>
```

## 대사 (한 줄씩)

화면 아래에서 한 줄씩 타이핑해요. 새 대사가 오면 바로 덮어씁니다 (줄 서서 기다리기 없음).

```html
<button data-gola-say-text="여기가 백도어다." data-gola-say-color="#FFD700">말 걸기</button>
```

```js
golaSay("대사", "#FFD700", 2200);
```

색 기본 `#fff`, 머무름 기본 2200ms예요. `data-gola-say-hold`로 조절. 글자는 50ms씩 한 자씩 나오고, 클릭하면 전문이 바로 표시돼요. 기본 firstWait 0=즉시, 글리프 기본 즉시 표시(appear는 `data-gola-say-appear` opt-in).

줄큐(화면별 hold 적용 다화면 큐):

```js
golaSay([{text:"첫 줄",color:"#fff",hold:2000},{text:"둘째 줄",color:"#FFD700",hold:2000}]);
```

```html
<button data-gola-say-queue='[{"text":"첫 줄","color":"#fff","hold":2000}]'>큐 재생</button>
```

다화면 큐·버튼까지 잔류(`hold: "Infinity"`, 클릭이 다음 화면)·글자당 사운드(`window.golaSaySound`/`opts.onChar`) 지원해요.

## 모달

풀스크린 흰 모달. ×◀▶ 버튼 위치까지 원본 그대로.

```html
<button data-gola-modal-open="#gdModal">버전 정보 열기</button>
<div class="gola-modal" id="gdModal">
  <div class="gola-modal-head">
    <div class="gola-modal-title">TypeGolaSimulator</div>
    <div class="gola-modal-ver">V1.7</div>
    <button class="gola-modal-btn close" data-gola-modal-close="#gdModal" aria-label="닫기">×</button>
  </div>
  <div class="gola-modal-log">...</div>
</div>
```

## SDF

게임과 같은 글자 질감. 아틀라스에서 직접 찍는 캔버스 방식.

```html
<canvas class="gola-sdfcv" data-text="GolaGola" data-size="40" data-color="#fff"></canvas>
```

```js
golaSDF.render(canvas, { text: "GolaGola", size: 40, color: "#fff" });
```

## 그리드

카드 나열은 `.gola-grid` 한 줄. `repeat(auto-fit, minmax(280px, 1fr))`, 간격 16px.

```html
<div class="gola-grid"><div class="gola-card">셀</div></div>
```

`.gola-container`/`.gola-row`/`.gola-col` 단일 제공이에요 (col-1~12 넘버드는 미제공).

## 셀렉트

```html
<select class="gola-select" aria-label="스킨 유형"><option>클래식</option><option>슬림</option></select>
```

## 텍스트에어리어

```html
<textarea class="gola-textarea" rows="2" placeholder="메모" aria-label="메모"></textarea>
```

## 라디오

```html
<label><input type="radio" class="gola-radio" name="q" checked> 예</label>
<label><input type="radio" class="gola-radio" name="q"> 아니오</label>
```

## 종속 토글 (V1.7)

부모 off면 자식 강제 off + 자식 disabled(포커스·조작 불가) + dim:

```html
<input type="checkbox" class="gola-check" id="parent" checked aria-label="부모 토글">
<input type="checkbox" class="gola-check" id="child" data-gola-sub="parent" aria-label="자식 토글">
```

## 문

```html
<button class="gola-door" style="background-image:url('./assets/that-door.png')"></button>
```
