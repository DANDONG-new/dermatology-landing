# 디자인 방향

프로젝트: 가상 브랜드 ‘오브 피부과’의 프리미엄 랜딩페이지.
대상: 피부 고민에 맞는 진료와 편안한 방문 경험을 찾는 성인 방문자.
목표: 브랜드의 분위기를 전달하고 프로그램 탐색에서 상담 준비로 연결한다.

## 구현 전 계획

색상 토큰: Pearl `#F8F6F2`, Chalk `#FFFEFA`, Ink `#322D2C`, Burgundy `#603744`, Stone `#ECE5DF`, Line `#DED8D1`.

서체: 한글 제목은 Noto Serif KR, 본문은 Noto Sans KR, 영문 워드마크와 서명은 Cormorant Garamond. 연결이 없으면 기기 글꼴로 대체.

레이아웃: 데스크톱에서는 왼쪽 정렬 문구와 오른쪽의 큰 사진을 나란히 두고, 철학 소개 → 프로그램 탐색 → 공간 → 진료 과정 → 질문 → 방문 안내로 이어진다. 모바일에서는 내용을 한 열로 전환하고 예약 버튼을 하단에 둔다.

```text
브랜드                  내비게이션        상담
한글 제목 · 소개        │ 큰 인물 사진
상담 / 프로그램         │
────────────────────────────────────
진료 철학               │ 설명
프로그램 필터
탄력       색소         모공       민감 피부
공간 사진               │ 공간 소개
첫 방문 과정 01 → 02 → 03 → 04
자주 묻는 질문
방문 안내               │ 예시 시간표
브랜드 서명 / 운영 전 안내
```

차별점: 인물 사진에 시각적 무게를 집중하고 나머지는 조용하게 구성한다. 추상적인 소재 일러스트는 진료의 느낌을 전달하며 의학적 결과를 시각적으로 약속하지 않는다. 할인 배너, 가짜 후기, 수치 성과, 확인되지 않은 의료진 경력을 사용하지 않는다.

계획 검토: 일반적인 크림색·테라코타 템플릿과 겹치지 않도록 포인트를 낮은 채도의 버건디로 정했다. 모든 구역을 같은 카드로 반복하지 않고 사진, 여백, 목록, 질문 펼치기를 각각의 목적에 맞게 사용한다. 장식용 번호는 배제하고 순서가 있는 첫 방문 과정에만 번호를 쓴다.

## 이미지 생성

`imagegen` 스킬과 기본 내장 `image_gen` 도구를 사용했다. 두 이미지 모두 가상의 콘셉트이며 실제 의료진·환자·병원 사진이 아니다. 생성된 PNG 원본은 Codex 생성 이미지 폴더에 보존하고, 프로젝트에서는 RGB WebP quality 88로 변환한 로컬 파일을 사용한다.

### `assets/hero.webp`

```text
Use case: photorealistic-natural. Asset type: premium Korean dermatology clinic website hero photograph. A refined editorial beauty portrait of a fictional adult Korean woman around age 30, healthy natural luminous skin with real subtle skin texture, minimal natural makeup, dark hair loosely swept back, serene expression, eyes open looking softly toward camera, bare shoulders with an ivory modest strapless top. Head and upper body three-quarter portrait, hand gently resting near collarbone. She occupies center-right of a wide 3:2 landscape composition; face entirely visible, ample breathing room above head. Background soft warm pale gray studio, sheer translucent drapery and soft indirect daylight, high-end Korean skincare magazine photography, muted ivory and taupe palette, sophisticated quiet mood, subtle photographic grain. This is a standalone photo asset, not a website screenshot. No lettering, no logos, no graphics, no watermarks, no medical devices. Output a high resolution landscape photograph.
```

### `assets/space.webp`

```text
Use case: photorealistic-natural. Asset type: editorial photograph for a premium Korean dermatology clinic website. A quiet, luxurious minimal clinic reception interior, bright ivory plaster walls, warm pale travertine curved reception counter, elegant dark walnut cabinets, soft daylight through a large sheer curtain on right, one sculptural fresh branch arrangement in a bronze vase, a deep burgundy lounge chair on left. Architectural Digest editorial photography, carefully composed, authentic subtle material texture, calm and airy, very refined, no people, no text, no logos, no signs. Wide 3:2 horizontal photograph.
```

## 화면 검토 후 반영

- 모바일 사진 캡션의 두 영문 문구가 줄바꿈되어 한 문구만 남겼다.
- 프로그램을 하나만 선택했을 때 카드를 넓혀 상세 탐색 상태를 읽기 쉽게 만들었다.
- 상담 종료 후 입력값과 확인 내용을 지우며 서버 호출을 하지 않는다.
- 브라우저 `close` 이벤트가 비동기로 발생하므로 QA는 실제 초기화 상태에 도달한 뒤 확인한다.
