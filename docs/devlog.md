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

---

## Day 5 — 미션/랭킹 + 루틴 구현

### 완료

#### 미션/랭킹
- `GET /api/missions` — 전체 미션 + 유저 진행도 조회
- `GET /api/missions/ranking` — 포인트 기준 상위 10명
- 운동 완료 시 미션 진행도 자동 업데이트 (`TOTAL_SETS`, `TOTAL_EQUIPMENTS`, `STREAK_DAYS`)
- 미션 완료 시 포인트 지급, 완료 미션 목록 API 응답 포함
- `Mission` 페이지: 미션/랭킹 탭, MUI LinearProgress 프로그레스 바
- `Complete` 페이지: 운동 완료 시 달성 미션 MUI Drawer 바텀시트 표시
- `workoutStore`에 `completedMissions` 상태 추가

#### 루틴
- `GET/POST/PUT/DELETE /api/routines` 루틴 CRUD
- `Routine` 페이지 — 루틴 목록, 예상 소요시간·운동 수 표시
- `RoutineEdit` 페이지 — dnd-kit 드래그 순서 변경, 세트/휴식 설정
- `RoutineSelectEquipment` 페이지 — 루틴용 기구 선택 (선택 상태 표시)
- `ConfirmDrawer` 공통 컴포넌트 추출 (삭제/뒤로가기 확인)
- 루틴모드 기구 로딩 병렬 요청 및 루틴 기구만 표시하도록 최적화

#### 실제 운동 시간 저장
- `actualWorkMs` / `actualRestMs` WaitingQueue에 저장
- `restStartedAtRef`로 stale closure 버그 수정

---

## Day 7 — 실시간 대기 고도화 + 버그 수정

### 완료

#### 기구 예상 대기시간
- `BE/src/lib/waitUtils.ts` — `calcEstimatedWaitMs` 공통 유틸 함수 추가
  - USING 항목의 `startedAt` 기준 잔여시간 + WAITING 대기자 합산 (세트당 3분 기준)
  - `isMyCurrentUsage` 반환 — 내가 이용 중인 기구는 FE에서 대기시간 미표시
- 기구 목록·상세·내 대기조회 API 모두 `estimatedWaitMs` / `isMyCurrentUsage` 반환
- 기구 카드에 "대기 N분 · N명" 형식으로 표시 (`showWaitTime` 조건 분기)
- WaitRequest, Waiting 페이지에도 동일 계산 적용 (기존 `waitingCount * 10` 공식 대체)

#### SelectEquipment 60초 폴링
- Socket.io `equipment:list:updated` 이벤트 외에 60초 폴링 추가
- 소켓 이벤트 미수신 구간에서도 예상 대기시간 보정
- 디바운싱(300ms)으로 소켓 이벤트와 충돌 없이 병행

#### Express 4 비동기 에러 처리
- Express 4는 async 핸들러 내 rejected Promise를 자동으로 잡지 않음
- 기구 라우트 핸들러 전체에 try/catch + `next(err)` 적용
- `app.ts`에 전역 에러 핸들러 추가
- 불필요한 EquipmentUsage 조인 제거

#### 소켓 emit 누락 수정
- `quick-start` 라우트: USING 레코드 생성 후 `emitEquipmentUpdate` / `emitEquipmentListUpdate` 누락 → 추가
- `PATCH /:id/start` (WAITING→USING 전환): `emitEquipmentListUpdate`만 있고 `emitEquipmentUpdate` 누락 → 추가 (Waiting 페이지 실시간 인원 갱신)

### 버그 수정

- **Toast race condition**: 토스트 중첩 시 inner closeTimer(300ms 퇴장 애니)를 클린업하지 않아 이전 토스트의 타이머가 새 토스트를 닫는 문제. closeTimer를 변수에 저장해 클린업에서 함께 제거
- **Exercising completeSet 순서**: `completeSet()` 호출이 API 이전에 있어 API 실패 시 `totalWorkMs`가 이미 업데이트된 상태로 남는 문제. API 성공 후에만 store 업데이트하도록 순서 변경

### 문서화
- README: Mermaid ERD, 컬러/스페이싱 토큰 표, React vs Next.js 선택 이유, PRD·devlog 링크 추가
- `docs/tokens.json`: Figma Tokens Studio 포맷으로 디자인 토큰 추출 (color·spacing·typography 등)

---

## Day 6 — 안정화 + UI 퍼블리싱

### 완료

#### 소켓 안정성
- Socket.io CORS 와일드카드 `*` → 특정 origin 함수 방식으로 변경 (`withCredentials: true` 충돌 해소)
- 소켓 재연결 시 `join:user` room 재입장 처리
- 계정 전환 시 이전 user room 탈퇴 (`leave:user`) 추가

#### 예약 플로우 UX 개선
- 뒤로가기 히스토리 정리 — `GoalSetting→WaitRequest`, 토스트→`WaitRequest(start)` replace 적용
- 전체 플로우 완료 후 뒤로가기 1번이면 홈 복귀
- `Waiting` 뒤로가기 → `SelectEquipment` 고정, `WaitRequest(start)` 뒤로가기 → 홈
- 토스트 "지금 이동" URL에 기구명 누락 수정

#### 랭킹 페이지 UI (피그마 기준)
- 1위 카드 배경 `$c-primary`, 순위 번호 원형 `$c-modal` 배경
- 날짜 앞 `CalendarClock` 아이콘, 헤더 알림 `Bell` 아이콘
- 배지 컬러 수정 (예약 파란색, 대기 주황색), 시간 텍스트 `$c-primary-light`
- 토스트 메시지 중앙 정렬 공통 적용

#### 미구현 페이지 레이아웃 퍼블리싱
- `MyPage` — 프로필, 메뉴 6개 (헬스장 찾기 연결, 나머지 준비중 토스트)
- `Notification` — 알림 목록 (배지/시간/메시지), 빈 상태 처리
- `GymFinder` 신규 — 검색바 + 저장됨 탭 + 헬스장 목록, `/gym-finder` 라우터 등록

#### CodeRabbit 리뷰 반영
- `reset.ts` 운영 환경 가드, 트랜잭션, 실패 종료 코드
- `waiting.routes.ts` streak 계산 `createdAt` → `updatedAt`
- `routine.routes.ts` id NaN 검증, 값 범위 검증, PUT 본문 검증
- `Exercising` `completedMissions` 항상 최신 응답으로 덮어쓰기
- `Mission` `conditionValue` 0 division by zero 방어
- `RoutineEdit` 드래그 인덱스 유효성 검증
- `Routine` `as any` 제거, equipment null 필터링
- `SelectEquipment` `routineId` NaN 검증
