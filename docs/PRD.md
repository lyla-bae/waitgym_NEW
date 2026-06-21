# WaitGym — 제품 요구사항 문서 (PRD)

> 작성일: 2026-05-28 / 최종 수정: 2026-06-21
> 버전: v1.0 (전체 기능 구현 및 배포 완료 기준)

---

## 1. 개요

**WaitGym**은 헬스장 기구 대기 관리 앱으로, 원하는 기구에 웨이팅을 등록하고 실시간으로 대기 현황을 확인할 수 있는 서비스다. FE 개발자 포트폴리오를 목적으로 재구축 중이며, Socket.io 실시간 처리·Zustand 상태관리·dnd-kit 드래그 등 기술 선택 근거를 면접에서 어필할 수 있도록 설계한다.

---

## 2. 기술 스택

| 영역 | 기술 | 배포 |
|---|---|---|
| FE | React 18 + Vite + TypeScript + SCSS | Vercel |
| BE | Express + TypeScript | AWS EC2 (서울 리전, t3.micro) |
| DB | Supabase PostgreSQL + Prisma ORM | Supabase |
| 인증 | Supabase Auth (Google OAuth) | Supabase |
| 실시간 | Socket.io (BE 서버에 통합) | BE 포함 |
| 상태관리 | Zustand | - |
| 아이콘 | lucide-react | - |

---

## 3. 라우팅 구조

```text
/login                         — 로그인 (Google OAuth)
/auth/callback                 — OAuth 콜백 처리

/ (Protected)
├── /                          — 홈 (루틴 목록 + 바로 운동 버튼)
├── /equipment/:id             — 기구 상세 (사용 현황·대기자 수)
├── /waiting/:id               — 대기 현황 (예상 시간·취소·사용 요청)
├── /reservation
│   ├── /select-equipment      — 웨이팅 기구 선택
│   ├── /goal-setting          — 세트/휴식 시간 설정
│   └── /wait-request          — 대기 등록 확인·제출 / 운동 시작 확인
├── /workout
│   ├── /exercising            — 세트 타이머 (운동 중)
│   └── /complete              — 운동 완료
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
| `EquipmentUsage` | 기구 사용 이력 (구버전 호환용) |
| `WaitingQueue` | 대기열 (queuePosition·status·sets·restSeconds·startedAt) |
| `WorkoutRoutine` | 루틴 정의 (isActive 플래그) |
| `RoutineExercise` | 루틴 내 운동 항목 (order 기반 정렬) |
| `Notification` | 알림 (타입·카테고리·우선순위) |
| `Mission` | 미션 정의 (condition·conditionValue·rewardPoints) |
| `UserMission` | 유저별 미션 진행도 (progress·isCompleted) |
| `SavedGym` | 저장된 헬스장 (카카오 로컬 API 연동) |

### `WaitingQueue` 상태머신

```text
WAITING ──→ USING ──→ COMPLETED
   │                      ↑
   └──→ CANCELLED         │ (30분 초과 시 자동)
         ↑
    5분 미응답 시 자동
```

- `WAITING`: 대기 등록 완료, 순서 기다리는 중
- `USING`: 운동 시작 (start API 호출 후)
- `COMPLETED`: 운동 완료 (complete API 호출 또는 30분 초과 강제)
- `CANCELLED`: 취소 (직접 취소 또는 내 차례 알림 5분 미응답)

---

## 5. API 엔드포인트

### 기구 (`/api/equipment`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/` | 기구 목록 (category·search·favorites 쿼리, estimatedWaitMs·isMyCurrentUsage 포함) |
| GET | `/:id` | 기구 상세 (waitingCount·isBeingUsed·estimatedWaitMs 포함) |
| POST | `/:id/favorite` | 즐겨찾기 토글 |

### 대기 (`/api/waiting`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/` | 대기 등록 (equipmentId·sets·restSeconds) |
| POST | `/quick-start` | 즉시 시작 — 기구 비어있을 때 USING으로 바로 전환 |
| GET | `/my` | 내 현재 대기/사용 중 조회 (estimatedWaitMs 포함) |
| POST | `/:id/request` | 사용 요청 — 현재 사용자에게 독촉 알림 전송 |
| PATCH | `/:id/start` | 운동 시작 (WAITING → USING) |
| PATCH | `/:id/complete` | 운동 완료 (USING → COMPLETED, actualWorkMs·actualRestMs 저장) |
| DELETE | `/:id` | 대기 취소 (WAITING → CANCELLED, queuePosition 재정렬) |

### 미션 (`/api/missions`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/` | 전체 미션 + 내 진행도 조회 |
| GET | `/ranking` | 포인트 기준 상위 10명 랭킹 |

### 루틴 (`/api/routines`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/` | 내 루틴 목록 |
| POST | `/` | 루틴 생성 |
| PUT | `/:id` | 루틴 수정 (exercises 포함 전체 교체) |
| DELETE | `/:id` | 루틴 삭제 |

### 유저 (`/api/user`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/me` | 내 정보 조회 |
| POST | `/sync` | Supabase Auth → DB 유저 동기화 |
| PATCH | `/me` | 프로필 수정 (name·avatar) |
| DELETE | `/me` | 회원 탈퇴 (대기/루틴 연쇄 삭제) |

### 알림 (`/api/notifications`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/` | 내 알림 목록 |
| PATCH | `/read-all` | 전체 읽음 처리 |

### 헬스장 (`/api/gym`)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/search` | 카카오 로컬 API 키워드 검색 |
| GET | `/saved` | 저장된 헬스장 목록 |
| POST | `/saved` | 헬스장 저장 |
| DELETE | `/saved/:id` | 저장된 헬스장 삭제 |

---

## 6. 실시간 (Socket.io)

### 클라이언트 → 서버

| 이벤트 | 설명 |
|---|---|
| `join:equipment` | 기구 룸 입장 (대기 중 인원 수 구독) |
| `leave:equipment` | 기구 룸 퇴장 |
| `join:user` | 유저 전용 룸 입장 (알림 수신용) |

### 서버 → 클라이언트

| 이벤트 | payload | 설명 |
|---|---|---|
| `equipment:updated` | `{ equipmentId, waitingCount }` | 기구 룸 구독자에게 대기인원 변경 브로드캐스트 |
| `equipment:list:updated` | (없음) | 기구 목록 전체 갱신 신호 (SelectEquipment 폴링 트리거) |
| `notification:new` | `{ type, ... }` | 유저 개인 알림 |

### notification 타입

| type | 수신자 | 내용 |
|---|---|---|
| `YOUR_TURN` | 다음 대기자 | `"예약한 {기구명}에 자리가 비었어요!"` + 이동 버튼 |
| `HURRY_UP` | 현재 사용자 | `"내 뒤에 기다리는 사람이 N명 있어요"` |

---

## 7. 웨이팅 플로우 (핵심 사용자 여정)

### 기구가 비어있을 때 (isBeingUsed=false, waitingCount=0)

```text
기구 상세 [이용하기]
  → GoalSetting (세트·휴식 설정)
  → WaitRequest "운동 시작하기" → quick-start API
  → Exercising (세트 타이머)
  → Complete (완료 화면)
```

### 기구가 사용 중 / 대기 있을 때

```text
기구 상세 [대기하기]
  → GoalSetting (세트·휴식 설정)
  → WaitRequest "대기 등록하기" → WAITING 등록
  → Waiting (대기 현황)
       ├─ "사용 요청 보내기" → 현재 사용자에게 독촉 (쿨다운 5분, 최대 3회)
       └─ 내 차례 시 토스트 "예약한 {기구명}에 자리가 비었어요!" + 이동 버튼
            └─ [5분 내 미응답 → 자동 CANCELLED, 다음 사람에게 넘어감]
            └─ 이동 버튼 탭 → WaitRequest "운동 시작하기" → USING 전환
                 → Exercising → Complete
```

### 타임아웃 정책

| 상황 | 시간 | 처리 |
|---|---|---|
| 내 차례 알림 후 미응답 | 5분 | CANCELLED → 다음 대기자 알림 |
| USING 상태 초과 | 30분 | 강제 COMPLETED → 다음 대기자 알림 |

---

## 8. 페이지별 구현 상태

### ✅ 전체 완료

| 페이지/기능 | 상세 |
|---|---|
| 프로젝트 세팅 | Vite+React+TS, SCSS 구조, 경로 별칭(`@/`) |
| 인증 | Supabase Google OAuth, AuthCallback, ProtectedRoute, Zustand authStore |
| 홈 (`/`) | 유저 이름 인사, 활성 루틴 목록, 바로 운동 버튼 |
| 기구 목록 (`/reservation/select-equipment`) | API 연동, 카테고리 필터, 검색, 즐겨찾기 토글, 현황 뱃지, 예상 대기시간, 60초 폴링 |
| 기구 상세 (`/equipment/:id`) | 사용 현황·대기자 수·isBeingUsed·즐겨찾기·GoalSetting 이동 |
| 세트/휴식 설정 (`/reservation/goal-setting`) | 세트 수(1~8)·휴식 시간(10초 단위) 설정 UI |
| 대기 등록 (`/reservation/wait-request`) | 대기 등록 / 운동 시작(mode=start) / 즉시 시작(canStartNow) 분기, 예상 대기시간 표시 |
| 대기 현황 (`/waiting/:id`) | 실시간 대기 인원(Socket.io), 사용 요청 API, 대기 취소, 예상 대기시간 표시 |
| 세트 타이머 (`/workout/exercising`) | 운동 스톱워치, 휴식 카운트다운, 세트 완료·종료 처리, 플로팅 휴식 타이머 |
| 완료 화면 (`/workout/complete`) | 총 운동/휴식 시간, 미션 달성 바텀시트 |
| 미션/랭킹 (`/mission`) | 미션 진행도, 포인트 랭킹 상위 10명 |
| 루틴 관리 (`/routine`, `/routine/edit/:id`) | dnd-kit 드래그 정렬, 세트/휴식 설정, ConfirmDrawer |
| 마이페이지 (`/mypage`) | 프로필 수정 (이름·사진), 즐겨찾기 기구 목록, 회원 탈퇴 |
| 알림 (`/notifications`) | 알림 목록, 읽음 처리, 미읽음 뱃지 |
| 헬스장 찾기 (`/gym-finder`) | 카카오 로컬 API 검색, 저장된 헬스장 목록 |
| BE API | equipment·waiting·missions·routines·user·notifications·gym 전 엔드포인트 |
| Socket.io | equipment:updated, equipment:list:updated, notification:new (YOUR_TURN·HURRY_UP) |
| 전역 토스트 | globalToastStore + 액션 버튼 지원 |
| Zustand 스토어 | authStore, workoutStore, globalToastStore |
| 배포 | FE: Vercel (waitgym.today) / BE: AWS EC2 + nginx + SSL |
| 시드 데이터 | 기구 18종, 미션 7종 |

---

## 9. SCSS 구조

```text
styles/
├── variables/   _colors, _spacing, _functions, _index
├── base/        _reset, _base, _font
├── components/  _button, _equipment-card, _search-bar, _category-filter, _toast
├── layout/      _header, _nav
└── pages/       _home, _login, _equipment-detail, _select-equipment,
                 _goal-setting, _wait-request, _waiting, _exercising, _complete
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
| 대기 중복 방지 | 유저당 USING 기구 1개 제한 (BE 409 응답) — WAITING은 여러 기구 동시 등록 가능 |
| 실시간 지연 | 대기 등록·취소 후 1초 이내 타 클라이언트 반영 |
| 반응형 | 모바일 우선 (360px ~ 430px 기준) |
| 코드 컨벤션 | 커밋 `feat/fix/chore/…: 한글 설명`, PR 한글 |
