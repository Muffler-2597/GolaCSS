# GolaCSS SPEC (개발용)

Unity GolaGolaSimulator V1.7(f3535eb) 실측 기준. 일반 사용자는 README만 보면 됨.

## 수치

- 버튼 160x50 흰면 검정테7 24px, 전수 Transition None (재시작만 200x100 55px + ColorTint hover)
- 모달 ×◀▶ 60x60 50px (×만 Bold), 풀스크린 흰 + 로그 #898989 36px
- 토글 70x40, knob 20x30 (7.5px↔42.5px, 0.15s), 라벨 30px (색만 0.2s 트윈)
- 슬라이더 트랙 400x15 #1E1E1E, 핸들 20x30 #C8C8C8 (볼륨만 흰색), 스냅 없음
- 스위치박스 280x56 (원본 350x70의 0.8, TypeGola 계승), 화살표 70x70
- 볼륨 min0 max100 step1 + CeilToInt 표기 (soundStep 0.05는 소리 재생 게이트)
- 입력 100x50 (HEX 110, 닉네임 350) 흰바탕 #323232 25px, HEX 3/4/6/8 + 무효 복원
- 토스트 700x50 36px, 표시 3.5초, 최대 3개, 스택 +55/+35 + 기존 축소(FirstDisplacementSizeDelta 110x30 절대값 → width 110px/height 30px, .gola-toast--stacked 부여+인라인 동일값, 폰트 16px, 원본 CutText per-char 재현(totalSteps=(len-4)+3·interval=200/totalSteps 한 글자씩 절단 후 '.' 한 점씩 추가, 최종 4자+...), 제거 시 생존자 위로 당김(recountStack)은 GolaCSS 포크(원본 toast.ts는 누적만 하고 제거 시 재계산 없음, 빈틈 잔류), vw<800은 동적 스포너·정적 경로 모두 per-toast 인라인 fontSize=max(14,round(36*w/800)) 기록(원본 toast.ts s=min(1,w/800) 비례식과 동일, 800 이상만 CSS 36px. 입장 간격(+55/+35)은 신규 토스트가 자기 marginTop으로 가지고 입장하고 기존 토스트 margin은 손대지 않음 — 원본 toast.ts(신규 margin 기록 없음, 기본 0)와 다른 포크))
- 패널 #787878 / 내용 #505050, 페이드 0.2s
- 서체 D2Coding 단일 (SDF가 Bold 소스 베이크 → Bold TTF를 400으로 로드)
- 이탤릭 금지, skewX(-19.29deg)만 (TMP italicStyle 35)
- 대사 .gola-say fixed inset:0 + padding 0 24px 60px (원본 중앙 -30px와 같은 위치, 하단 패딩 60으로 중앙보다 30px 위로) z70 중앙 44px lh1, opacity 0→.show 1 (0.2s). 타이핑 50ms/자(원본 textInterval 0.05), hold 기본 2200ms(포크 기본값 — 원본 backdoor.ts는 화면별 1700/2000/Infinity, "Infinity" 잔류, 최종 화면 해제는 Esc 2회·더블클릭·golaSayClear()), firstWait 기본 0=즉시(원본 첫만남 1000/기타 250은 opts.firstWait로, 포크 명시), 클릭=타이핑중 finish·hold중 다음 화면/닫기. 단일 #golaSay 재사용(role=status aria-live=polite), 새 호출이 덮어씀. 배열·{screens} 다화면 큐 + 파트별 색 + 슬롯 격자(slotW=spacing*108) + 글자당 onChar/golaSaySound 훅. 글리프 기본 즉시 표시, appear opt-in(data-gola-say-appear·opts.appear). data-gola-say-text/color(기본#fff)/hold(기본2200)/interval(기본50)/first-wait(기본0)/queue(JSON [{text,color,hold}], 구 {t,c,h} 별칭 수용. 타이핑 중 aria-busy=true로 중간 삽입 공지 억제, 완성 시(onScreenTyped) false로 전체 1회 공지)
- .gola-bd-g 44px lh1 skewX(-19.29deg) origin 50% 50% — say 경로에서 글리프 단위로 생성·사용
- 클래스리스 body 자동 gola-auto (data-gola-off로 해제), :where 0명시도라 .gola-*가 항상 이김. label flex gap12 wrap 24px, :has(checkbox) 30px. 입력 350x50, size1-6/data-mini 100px
- 그리드 .gola-grid repeat(auto-fit, minmax(280px, 1fr)) gap16px (경량판: .gola-container/.gola-row/.gola-col 단일(flex:1)만 제공, col-1~12 넘버드 미제공 — chota 원전과 다름)

## 의도적 결정 (충돌 판정 기록)

- 토스트 진입·퇴장은 X축만. Y가 섞이면 형제 위를 스치며 반투명이 겹쳐 보임 (실측 제보).
- 버튼 `:active` scale 없음 (Unity 전 버튼 Transition None). 본체·클래스리스 모두 없음.
- 포커스 링은 주황 3px 유지 (키보드 접근성). 끄려면 `.gola-no-ring`.
- HEX 8자리는 필드 표시 유지, 파싱은 앞 6자리 (panel.ts 그대로).
- `select`·`textarea`·`radio`는 원본에 없어서 게임 문법으로 새로 만든 확장.
- 모달 맞춤은 title 측정→title에만 zoom (gola.js golaFitModal, ×◀▶ 60x60 버튼 동반축소 없음 — absolute라 head 측정 불가) + title 100px 고정+말줄임, 좁은 폭은 title zoom으로 일원화 (clamp 없음). TypeGola W/800 컨테이너 균일축소와 다름 (포크 명시, gola.css 불변).
- V1.7 종속 토글은 data-gola-sub="부모ID"로 구현 (부모 off→자식 강제 off+disabled+행 dim opacity 0.45, on이면 해제 — 원본 ToggleSwitch.SubordinationButtonsCallback은 SetEnableState(false)만 호출하고 disabled·dim 없음, GolaCSS 포크 명시. 원본은 마스터가 어느 방향으로 바뀌든 켜져 있던 자식을 끔(콜백이 마스터 신상태 무시). GolaCSS는 부모 on 시 자식 상태 보존으로 포크). 정적 data-gola-toast="#id" 경로는 스포너(data-gola-toast-text)와 별개로 유지, guide s-more에 예제. 정적 data-gola-toast="#id" 경로는 allow 게이트를 거치지 않음(스포너 전용 게이트).
- RGB lastHex는 모든 render 경로에서 동기화 (원본 SetHexFromColor에서만 갱신·CheckValue 성공 시 stale quirk와 반대인 포크, 무효 HEX 복원은 항상 화면 현재값). 값 입력은 클램프 후 '0.0###' 재기록 (원본 SetFloatToText). RGB 스코프는 .gola-vol-val을 건드리지 않음.
- 모달 Tab 트랩은 a[href],button,input,select,textarea,[tabindex] 전수 (disabled/숨김 제외).
- 대사는 BackdoorTextPrinter 근사 (현행 스펙 기술, 간이판 아님). 타이핑 50ms/자(원본 textInterval 0.05, 레어 150ms는 opts.interval=150으로), 공백 시간 0, firstWait 기본 0 포크(원본 첫만남 1.0/기타 0.25는 opts.firstWait로), 화면별 hold(기본 2200, "Infinity" 잔류), 다화면·파트별 색·슬롯 격자(slotW=spacing*108, textSize와 독립 — 글리프 fontSize만 textSize*11 연동)·글자당 사운드 훅(onChar/golaSaySound) 전부 구현. 클릭=타이핑중 즉시완성·hold중 다음 화면은 GolaCSS 포크 (원본 Printer는 클릭으로 닫지 않음). appear는 opt-in, idle(Bobbing)·color(Fade)·disappear 등은 엔진 미지원 포크라 기본 미적용 (V1.7 AppiHi 파트가 idle Bobbing 0.2/1s·color Fade 0.5s·subColor 사용하나 재현 불가 — 파트 필드는 유지, 재현 제외 최종 결정, 레어 경로 커버리지 갭으로 기록). lh1, 50ms가 현행. 화면별 textSize/spacing 미지원·전역 opts만.
- 좁은 화면 say: 한 줄 실측 후 scale>=0.7이면 박스 통째 zoom, 미만이면 wrap (gola.js fitSayBox, onScreenTyped·resize에서 호출). 원본 fitBackdoorLine 줄별 슬롯+글리프 동반축소와 다름 (포크 명시). 0.7 미만 wrap 시 원본은 상단 정렬+8vh이나 GolaCSS는 중앙 유지 (포크 명시). golaFit은 say 미대상.
- 타이쿤 스킨·목도리/Galmuri는 제외 (사용자 지시).
- firstWait Infinity는 0으로 꺾지 않고 자동 표시 안 함으로 취급 (playScreen 예약 없이 박스만 준비). hold Infinity(잔류)와 다른 축이라 silent remap 금지.
- 닉네임 적용(data-gola-nick-apply)은 비어있지 않으면 gold 로딩토스트 후 성공토스트 (원본 SkinSetting OnApplyButtonPress 근사, 성공 문구는 "○○ 스킨을 불러왔습니다." 어순). 공백만 입력도 빈값 차단(원본 IsNullOrEmpty보다 강한 포크). 동일 닉네임 연속 적용 시 로딩 생략·성공만 (원본 HasCachedSkin 간이 재현, lastNick). 로딩 1.2s 창 내 재클릭은 동일·다른 닉·캐시 여부 무관 침묵 (원본 SkinManager fetchSkin!=null early-return 재현). 원본 OnFail의 error 0/1별 red force 실패 토스트는 네트워크 영역이라 미지원. 조회는 .gola-input + 베어 input 8종(text/email/number/password/search/tel/url/무type, gola-classless.css:7과 동일 범위, .gola-slider/.gola-hex/.gola-value 제외).
- 시작 자동 튜토리얼 토스트 미지원(원본 ToastUIManager FirstToast의 시작 4초 후 3연속 자동재생은 라이브러리 문맥상 자동발화 제외, 수동 스포너로 대체).
- 모달 버전 표기(.gola-modal-ver #FF8000 on 흰배경)는 원본 색상 재현이라 large-text 대비 약 2.5:1로 WCAG AA-large 3:1 미달. 색상은 원본 유지, 고대비 예외로 고지 (guide s-modal 참조). 같은 사유로 .gola-desc(#FF8000 on #787878 1.75:1)·미체크 .gola-label(적색 #FF0000 on #505050 2.02:1)·스킨 미체크 라벨(#5191B8 on #505050 2.34:1)도 large-text 미달 잔류 갭 — 색상 유지 + 조상 .gola-high-contrast opt-in(버전 #7A3E00+굵기·밑줄, 나머지 흰색+굵기·밑줄)으로 전환.
- SwitchBoxDescription(모드별 설명문)·UISpreader(자식 스프레더)·ButtonClickSound(클릭음)는 제외 (오디오 에셋 없음·씬 이동·모드 설명문은 키트 범위 밖).

## SDF 증명

- 아틀라스 703글리프(정 617+이탤릭 86) 1px 단위 피크 감사: `'\r'` 쓰레기 1건 외 전원 정상 (`tools/peaks.txt`)
- 파이프라인 전수: 703자 × 4크기 × 3줌아웃 = 8424체크 PASS (`tools/sweep.py`)
- 렌더: 등배 찍고 임계(0.46) → 알파만 축소. 아틀라스/dpr 경로는 출력보다 항상 크게 (3~4배), 적응형 SS는 최소 2배·초장문 상한 시 1배 하한
- 아틀라스 바꾸면 감사부터 다시
