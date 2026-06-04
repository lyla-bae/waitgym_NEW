# WaitGym 개발 일지

---

## Day 1 — 프로젝트 초기 세팅

### 완료
- FE / BE 프로젝트 초기 세팅
- DB 스키마 설계 및 Supabase 연결 (Prisma)
- Express 서버 세팅 + Socket.io 연결
- Supabase Auth (Google OAuth) 기본 연결
- BE equipment 라우터 + 시드 데이터 기구 이미지 URL 적용
- `.claude` 커맨드 및 CLAUDE.md 설정

---

## Day 2 — 기구 목록 FE + 페이지 레이아웃 구조

### 완료

#### 기구 목록 API 및 FE
- `equipmentApi` 클라이언트 — Supabase 세션 토큰 기반 인증 fetch 래퍼
- 기구 목록 조회 (카테고리 필터 / 검색 / 즐겨찾기), 상세 조회, 즐겨찾기 토글
- `EquipmentCard` 컴포넌트
- `/reservation/select-equipment` 페이지 신규 추가

#### SCSS 전환 (Tailwind 제거)
- Tailwind + PostCSS 완전 제거
- SCSS 아키텍처: `variables` / `base` / `components` / `layout` / `pages`
- BEM 방법론 — 컴포넌트 내 태그 선택자 전면 제거
- `r()` 함수로 매직 넘버 제거, 디자인 토큰(`_colors`, `_spacing`) 정의
- Pretendard 폰트 CDN → 로컬 woff2(`@font-face`) 전환

#### 페이지 레이아웃 구조 정비
- `Header` 컴포넌트 신규 — `leftContent` / `rightContent` / `title` / `className` props
- `Layout` 헤더 분리, 네비게이션 3개 항목 (홈 / 미션·랭킹 / 마이)
- `Home` 페이지 → 인사말 + 루틴 목록 placeholder + "바로 운동" / "루틴 추가" CTA
- 로고·아이콘·기구 이미지·이모지 에셋 이관

#### 버그 수정
- `h1~h6` 브라우저 기본 `font-size` reset 누락 → `_reset.scss` 보완
- BE CORS 전체 localhost 포트 허용 (개발 환경 포트 불일치 대응)

### 결정 사항
- CSS: Tailwind → SCSS (BEM) — 포트폴리오에서 CSS 역량 어필 목적
- 폰트: CDN 의존 제거, 로컬 파일로 관리
- FE 배포(Vercel)는 BE(Koyeb) 배포 후 같이 진행 예정

---

## Day 3 — 웨이팅 플로우 + 실시간 + 세트 타이머

### 완료

#### BE 웨이팅 API
- `POST /api/waiting` 대기 등록, `POST /api/waiting/quick-start` 즉시 시작
- `PATCH /:id/start` 운동 시작, `PATCH /:id/complete` 운동 완료, `DELETE /:id` 취소
- `POST /:id/request` 사용 요청 (독촉 알림)
- 대기 등록/취소에 트랜잭션 적용, queuePosition 자동 재정렬
- 30분 강제 완료 타임아웃 처리

#### Socket.io 실시간
- `equipment:updated` — 대기 등록·취소 시 브로드캐스트 (`waitingCount`)
- `notification:new` — `YOUR_TURN` / `HURRY_UP` 유저 개인 알림

#### FE 페이지
- `GoalSetting` — 세트 수(1~8)·휴식 시간(10초 단위) 설정
- `WaitRequest` — 대기 등록 / 운동 시작 / 즉시 시작 분기 처리
- `Waiting` — 실시간 대기 인원, 사용 요청, 취소
- `Exercising` — 운동 스톱워치 + 휴식 카운트다운 (CircularTimer), 세트 완료·종료
- `Complete` — 총 운동/휴식 시간 표시

#### 상태 관리 및 공통 컴포넌트
- `workoutStore` (Zustand) — 세트/휴식 설정값 전달
- `globalToastStore` — 전역 토스트 (액션 버튼 지원)
- `CircularTimer` SVG 원형 타이머 컴포넌트

### 버그 수정
- CodeRabbit 리뷰 반영 (에러 처리, imageUrl 디코딩)
- CircularTimer CSS 변수 미적용 버그
- 휴식 자연 종료 시 `addRestMs` 누락
- 휴식 후 운동 타이머 재시작 안 되는 버그
- 세트 아이콘 첫 세트부터 체크되도록 수정

---

## Day 4 — 로그인 UI + 안정화

### 완료

#### 로그인
- 로그인 페이지 구버전 디자인으로 재작업
- 익명 로그인 추가 (Supabase signInAnonymously)
- BE auth 미들웨어 익명 유저 처리 추가

#### 기구 목록 버그 수정
- 기구 목록 API `isBeingUsed` 필드 추가
- 이용 중 색상 표시 수정

#### Socket.io
- 개발 환경 CORS wildcard 허용
- credentials + wildcard 충돌 수정

#### 기타
- `workout` 페이지 진입 가드 추가
- 운동 완료 API 실패 처리 개선
- `quick-start` / `start` 기구 점유 중복 방지 추가
