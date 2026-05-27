# WaitGym 리빌드 계획

## 목표
기존 WaitGym 프로젝트를 AI 바이브코딩으로 개선해서 배포
FE 개발자 포트폴리오 용도

---

## 기술 스택

| 영역 | 기술 | 배포 |
|---|---|---|
| FE | React + Vite + TypeScript | Vercel |
| BE | Express + TypeScript (얇게) | Koyeb |
| DB | Supabase PostgreSQL | Supabase |
| Auth | Supabase Auth (Google OAuth) | Supabase |
| 실시간 | Socket.io | BE에 포함 |

---

## 기능 범위

### 구현
- 기구 목록 / 검색 / 카테고리 필터 / 즐겨찾기
- 웨이팅 플로우 + 세트/휴식 타이머 (핵심 기능)
- 실시간 대기열 (Socket.io)
- 로그인 (Google OAuth - Supabase Auth)
- 미션/랭킹 (실제 EquipmentUsage 데이터 기반으로 계산)
- 루틴 설정 (dnd-kit 드래그앤드롭)
- 헬스장 찾기 (카카오 로컬 API - 이름/주소만)

### 1차 배포 제외
- 혼잡도 (유저 데이터 없는 초기엔 의미 없음)
- 모바일 앱

---

## 구버전 대비 개선 사항

| 항목 | 구버전 | 신버전 |
|---|---|---|
| BE 언어 | JavaScript | TypeScript |
| 미션/랭킹 | 하드코딩 | 실제 데이터 연동 |
| 헬스장 찾기 | 하드코딩 | 카카오 로컬 API |
| Auth | Passport.js | Supabase Auth |
| 배포 | AWS EC2 + Docker | Vercel + Koyeb |

---

## 개발 순서 (~6일)

```
1일차  DB 스키마 + Supabase 셋업 + Express 기본 + Socket.io 셋업
2일차  기구 목록 (FE + API)
3일차  웨이팅 플로우 + Socket.io 실시간
4일차  로그인 (Supabase Auth) + 미션/랭킹
5일차  루틴 (dnd-kit) + 헬스장 찾기 (카카오 로컬 API)
6일차  FE 퀄리티 다듬기 + Vercel/Koyeb 배포
```

---

## 아키텍처

```
Client (React + Vite)
├── Supabase Auth     → Google OAuth 로그인
├── Supabase DB       → 기구/즐겨찾기 CRUD 직접 호출
├── Socket.io Client  → 실시간 대기열
└── Express API       → 웨이팅/미션 복잡한 로직

Express (BE)
├── 웨이팅 큐 로직 (순번 관리, ETA)
├── 세트/휴식 상태머신
├── 미션/점수 계산
└── Socket.io Server

Supabase
├── PostgreSQL DB
├── Auth (Google OAuth)
└── (DB는 Prisma로 관리)
```

---

## DB 모델 (기존 유지 + Gym 추가)

- User
- Equipment
- Favorite
- EquipmentUsage (세트/휴식 추적)
- WaitingQueue (대기열)
- WorkoutRoutine + RoutineExercise (루틴)
- Notification
- **Gym** (헬스장 - 카카오 API로 검색, 선택한 헬스장 저장용)
- **Mission** (미션 정의)
- **UserMission** (유저별 미션 진행도)

---

## 면접 어필 포인트

- 실시간 대기열 (Socket.io) - "WebSocket 기반 실시간 UI 처리"
- 세트/휴식 상태머신 - "복잡한 상태 전환 관리 (Zustand)"
- dnd-kit 루틴 드래그앤드롭
- 기술 선택 근거 설명 가능 (왜 이 스택을 썼는지)

---

## 참고 (구버전 코드 경로)

새 프로젝트 시작 시 아래 경로에서 구버전 코드 참고할 것

| 항목 | 경로 |
|---|---|
| 전체 구버전 | `/Users/lyla/Downloads/새싹/final_project/waitgym/` |
| DB 스키마 | `/Users/lyla/Downloads/새싹/final_project/waitgym/BE/prisma/schema.prisma` |
| 웨이팅 로직 | `/Users/lyla/Downloads/새싹/final_project/waitgym/BE/src/services/waiting.service.js` |
| Socket.io 서버 | `/Users/lyla/Downloads/새싹/final_project/waitgym/BE/src/socket/socket.server.js` |
| 미션/랭킹 FE | `/Users/lyla/Downloads/새싹/final_project/waitgym/FE/web/src/features/mission/` |
| 웨이팅 FE | `/Users/lyla/Downloads/새싹/final_project/waitgym/FE/web/src/features/reservation/` |
| 루틴 FE | `/Users/lyla/Downloads/새싹/final_project/waitgym/FE/web/src/features/routine/` |
| 운동 타이머 FE | `/Users/lyla/Downloads/새싹/final_project/waitgym/FE/web/src/features/workout/` |
| Zustand 스토어 | `/Users/lyla/Downloads/새싹/final_project/waitgym/FE/web/src/stores/` |
| 헬스장 찾기 FE | `/Users/lyla/Downloads/새싹/final_project/waitgym/FE/web/src/features/mypage/gyms.tsx` |
