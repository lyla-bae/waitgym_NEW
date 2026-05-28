# WaitGym — 제품 요구사항 문서 (PRD)

> 작성일: 2026-05-28  
> 버전: v0.3 (웨이팅 플로우 구현 완료 기준)

---

## 1. 개요

**WaitGym**은 헬스장 기구 대기 관리 앱으로, 원하는 기구에 웨이팅을 등록하고 실시간으로 대기 현황을 확인할 수 있는 서비스다. FE 개발자 포트폴리오를 목적으로 재구축 중이며, Socket.io 실시간 처리·Zustand 상태관리·dnd-kit 드래그 등 기술 선택 근거를 면접에서 어필할 수 있도록 설계한다.

---

## 2. 기술 스택

| 영역 | 기술 | 배포 |
|---|---|---|
| FE | React 18 + Vite + TypeScript + SCSS | Vercel |
| BE | Express + TypeScript | Koyeb |
| DB | Supabase PostgreSQL + Prisma ORM | Supabase |
| 인증 | Supabase Auth (Google OAuth) | Supabase |
| 실시간 | Socket.io (BE 서버에 통합) | BE 포함 |
| 상태관리 | Zustand | - |
| 아이콘 | lucide-react | - |

---

## 3. 라우팅 구조

```
/login                         — 로그인 (Google OAuth)
/auth/callback                 — OAuth 콜백 처리

/ (Protected)
├── /                          — 홈 (루틴 목록 + 바로 운동 버튼)
├── /equipment/:id             — 기구 상세 (사용 현황·대기자 수)
├── /waiting/:id               — 대기 현황 (예상 시간·취소)
├── /reservation
│   ├── /select-equipment      — 웨이팅 기구 선택
│   ├── /goal-setting          — 세트/휴식 시간 설정
│   └── /wait-request          — 대기 등록 확인·제출
├── /mission                   — 미션/랭킹
├── /routine                   — 루틴 관리 (dnd-kit)
├── /mypage                    — 마이페이지
└── /notifications             — 알림 목록
```

---

## 4. DB 스키마 (Prisma)

### 핵심 모델

| 모델 | 설명 |
|---|---|
| `User` | 유저 (Supabase Auth 연동, 포인트 보유) |
| `Equipment` | 기구 (카테고리·근육군·이미지) |
| `Favorite` | 유저↔기구 즐겨찾기 (복합 유니크) |
| `EquipmentUsage` | 기구 사용 이력 (세트·휴식 상태머신 포함) |
| `WaitingQueue` | 대기열 (queuePosition·status) |
| `WorkoutRoutine` | 루틴 정의 (isActive 플래그) |
| `RoutineExercise` | 루틴 내 운동 항목 (order 기반 정렬) |
| `Notification` | 알림 (타입·카테고리·우선순위) |
| `Mission` | 미션 정의 (condition·conditionValue·rewardPoints) |
| `UserMission` | 유저별 미션 진행도 (progress·isCompleted) |
| `SavedGym` | 저장된 헬스장 (카카오 로컬 API 연동) |

### `EquipmentUsage` 상태머신

```
setStatus: EXERCISING → RESTING → EXERCISING → ... → COMPLETED
status:    IN_USE                                   → COMPLETED
```

### `WaitingQueue` 상태

```
WAITING → NOTIFIED → COMPLETED
       ↘ CANCELLED
       ↘ EXPIRED
```

---

## 5. API 엔드포인트

### 기구 (`/api/equipment`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/` | 기구 목록 (category·search·favorites 쿼리) |
| GET | `/:id` | 기구 상세 (현재 사용자·대기자 수 포함) |
| POST | `/:id/favorite` | 즐겨찾기 토글 |

### 대기 (`/api/waiting`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/` | 대기 등록 (equipmentId·sets·restSeconds) |
| GET | `/my` | 내 현재 대기 목록 조회 |
| DELETE | `/:id` | 대기 취소 (queuePosition 자동 재정렬) |

### 미션 (`/api/mission`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/` | 전체 미션 + 내 진행도 조회 |

### 루틴 (`/api/routine`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/` | 내 루틴 목록 |
| POST | `/` | 루틴 생성 |
| PUT | `/:id` | 루틴 수정 |
| DELETE | `/:id` | 루틴 삭제 |

### 유저 (`/api/user`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/me` | 내 정보 조회 |
| POST | `/sync` | Supabase Auth → DB 유저 동기화 |

---

## 6. 실시간 (Socket.io)

- 서버: BE `socket.server.ts`에서 `emitEquipmentUpdate(equipmentId, payload)` 발행
- 이벤트: `equipment:update` — 대기 등록·취소 시 해당 기구의 `waitingCount` 브로드캐스트
- 클라이언트: FE `lib/socket.ts`에서 소켓 싱글턴 관리

---

## 7. 페이지별 구현 상태

### ✅ 완료

| 페이지/기능 | 상세 |
|---|---|
| 프로젝트 세팅 | Vite+React+TS, SCSS 구조, 경로 별칭(`@/`) |
| 인증 | Supabase Google OAuth, AuthCallback, ProtectedRoute, Zustand authStore |
| 홈 (`/`) | 유저 이름 인사, 루틴 플레이스홀더, 바로 운동 버튼 |
| 기구 목록 (`/reservation/select-equipment`) | API 연동, 카테고리 필터, 검색, 즐겨찾기 토글, 현황 뱃지 |
| 기구 상세 (`/equipment/:id`) | 사용 현황·대기자 수·즐겨찾기·대기 버튼 |
| 세트/휴식 설정 (`/reservation/goal-setting`) | 세트 수(1~10)·휴식 시간(30초 단위 30s~10min) 설정 UI |
| 대기 등록 (`/reservation/wait-request`) | 선택 내용 확인 + API 제출 + Toast 피드백 |
| 대기 현황 (`/waiting/:id`) | 대기 인원·예상 시간 표시, 대기 취소 |
| BE 기본 구조 | Express+TS, Prisma 스키마, auth 미들웨어, Socket.io 서버 |
| 시드 데이터 | 기구 18종, 미션 7종 |
| Toast 컴포넌트 | 전역 사용 가능한 커스텀 훅 기반 토스트 |

### 🔲 미구현 (남은 일정)

| 우선순위 | 페이지/기능 | 비고 |
|---|---|---|
| 높음 | 기구 사용 시작·세트 타이머 | EquipmentUsage 상태머신 FE 연동 |
| 높음 | Socket.io 실시간 대기열 갱신 | FE 소켓 이벤트 구독 |
| 중간 | 미션/랭킹 (`/mission`) | UserMission API + 포인트 |
| 중간 | 루틴 관리 (`/routine`) | dnd-kit 드래그 정렬 |
| 중간 | 마이페이지 (`/mypage`) | 프로필·포인트·기록 |
| 중간 | 알림 (`/notifications`) | Notification 목록·읽음 처리 |
| 낮음 | 홈 루틴 목록 | 활성 루틴 불러와 표시 |
| 낮음 | 헬스장 찾기 | 카카오 로컬 API + SavedGym |
| 낮음 | 배포 | Vercel (FE) + Koyeb (BE) |

---

## 8. 웨이팅 플로우 (핵심 사용자 여정)

```
홈 [바로 운동]
  → /reservation/select-equipment   기구 선택
  → /reservation/goal-setting       세트·휴식 설정
  → /reservation/wait-request       내용 확인 + 대기 등록 API 호출
  → /waiting/:id                    대기 현황 (실시간 갱신 예정)
  → (기구 사용 가능 알림)
  → 사용 시작 → 세트 타이머 → 완료
```

---

## 9. SCSS 구조

```
styles/
├── variables/   _colors, _spacing, _functions, _index
├── base/        _reset, _base, _font
├── components/  _button, _equipment-card, _search-bar, _category-filter, _toast
├── layout/      _header, _nav
└── pages/       _home, _login, _equipment-detail, _select-equipment,
                 _goal-setting, _wait-request, _waiting
```

**규칙**: 태그 선택자 금지(클래스만), 매직 넘버 금지(변수 활용), `_base.scss`는 전역 리셋만.

---

## 10. 1차 배포 제외 범위

- 혼잡도 히트맵
- 모바일 네이티브 앱 (PWA도 미정)
- 소셜 기능 (친구 추가 등)

---

## 11. 비기능 요구사항

| 항목 | 기준 |
|---|---|
| 인증 보안 | 모든 API Bearer 토큰 검증, Supabase JWT |
| 대기 중복 방지 | 유저당 활성 대기 1개 제한 (BE 409 응답) |
| 실시간 지연 | 대기 등록·취소 후 1초 이내 타 클라이언트 반영 |
| 반응형 | 모바일 우선 (360px ~ 430px 기준) |
| 코드 컨벤션 | 커밋 `feat/fix/chore/…: 한글 설명`, PR 한글 |
