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

## Day 3 — 예정
- 웨이팅 플로우 (세트/휴식 타이머)
- Socket.io 실시간 대기열
