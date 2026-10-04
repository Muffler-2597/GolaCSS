# GolaCSS SPEC (개발용)

Unity GolaGolaSimulator V1.7(f3535eb) 실측 기준. 일반 사용자는 README만 보면 됨.

## 수치

- 버튼 160x50 흰면 검정테7 24px, 전수 Transition None (재시작만 200x100 55px + ColorTint hover)
- 모달 ×◀▶ 60x60 50px (×만 Bold), 풀스크린 흰 + 로그 #898989 36px
- 토글 70x40, knob 20x30 (7.5px↔42.5px, 0.15s), 라벨 30px (색만 0.2s 트윈)
- 슬라이더 트랙 400x15 #1E1E1E, 핸들 20x30 #C8C8C8 (볼륨만 흰색), 스냅 없음
- 볼륨 min0 max100 step1 + CeilToInt 표기 (soundStep 0.05는 소리 재생 게이트)
- 입력 100x50 (HEX 110, 닉네임 350) 흰바탕 #323232 25px, HEX 3/4/6/8 + 무효 복원
- 토스트 700x50 36px, 표시 3.5초, 최대 3개, 스택 +55/+35
- 패널 #787878 / 내용 #505050, 페이드 0.2s
- 서체 D2Coding 단일 (SDF가 Bold 소스 베이크 → Bold TTF를 400으로 로드)
- 이탤릭 금지, skewX(-19.29deg)만 (TMP italicStyle 35)

## 의도적 결정 (충돌 판정 기록)

- 토스트 진입·퇴장은 X축만. Y가 섞이면 형제 위를 스치며 반투명이 겹쳐 보임 (실측 제보).
- `:active` scale 없음. Unity 전 버튼 Transition None이 chota 잔재보다 우선.
- 포커스 링은 주황 3px 유지 (키보드 접근성). 끄려면 `.gola-no-ring`.
- HEX 8자리는 필드 표시 유지, 파싱은 앞 6자리 (panel.ts 그대로).
- `select`·`textarea`·`radio`는 원본에 없어서 게임 문법으로 새로 만든 확장.
- 타이쿤 스킨·목도리/Galmuri는 제외 (사용자 지시).

## SDF 증명

- 아틀라스 703글리프(정 617+이탤릭 86) 1px 단위 피크 감사: `'\r'` 쓰레기 1건 외 전원 정상 (`tools/peaks.txt`)
- 파이프라인 전수: 703자 × 4크기 × 3줌아웃 = 8424체크 PASS (`tools/sweep.py`)
- 렌더: 등배 찍고 임계(0.46) → 알파만 축소. 출력보다 항상 크게 (최소 3배)
- 아틀라스 바꾸면 감사부터 다시
