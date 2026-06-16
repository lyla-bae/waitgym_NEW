<div align="center">

# WaitGym

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://www.prisma.io/)

[🌐 서비스 바로가기](https://waitgym.vercel.app)

---

</div>

## 📖 프로젝트 소개

헬스장에서 불편한 대면 대기 상황으로 인해 플랜 진행이 어려운 문제를 해결하기 위한  
효율적인 플랜 진행을 돕는 **기구 대기 서비스 "WaitGym"** 입니다.

기존 팀 프로젝트를 **혼자 TypeScript로 리빌드**하며 기획/설계/구현/배포 전 과정을 경험했습니다.

## 🛠 기술 스택

| 영역 | 기술 |
|---|---|
| FE | React 18, Vite, TypeScript, SCSS, Zustand, Socket.io-client |
| BE | Node.js 22, Express, TypeScript, Socket.io, Prisma |
| DB | Supabase PostgreSQL |
| Auth | Supabase Auth (Google OAuth) |
| 배포 | Vercel (FE), AWS EC2 서울 리전 (BE), nginx, Let's Encrypt |

## 🚀 주요 기능

- **기구 목록** — 검색 / 카테고리 필터 / 즐겨찾기
- **웨이팅 플로우** — 대기 등록 → 알림 → 운동 시작 → 세트/휴식 타이머
- **실시간 대기열** — Socket.io 기반 실시간 순번 업데이트
- **루틴 설정** — dnd-kit 드래그앤드롭으로 기구 순서 편집
- **미션/랭킹** — 운동 완료 시 미션 달성, 포인트 기반 랭킹
- **알림** — DB 저장 + 읽음 처리 + 벨 아이콘 뱃지
- **마이페이지** — 이름/프로필 사진 변경 (Supabase Storage)

## 📱 사용 흐름

### 기구가 비어있을 때

1. 기구 선택
2. 운동 설정 (세트 수, 휴식 시간)
3. "바로 시작" 클릭
4. 세트별 운동 진행
5. 자동 완료 → 다음 대기자에게 알림

### 기구가 사용 중일 때

1. 기구 선택
2. "대기열 등록" 클릭
3. 실시간 순번 확인
4. 알림 수신 (5분 유예)
5. "운동 시작" 클릭 → 세트별 운동 진행

## 🔔 Socket.io 실시간 이벤트

**클라이언트 → 서버**
- `authenticate` — Supabase JWT 토큰 인증

**서버 → 클라이언트**
- `notification` — 알림 수신 (기구 사용 가능, 대기 만료 등)
- `equipment_update` — 기구 상태 변경
- `queue_update` — 대기열 순번 변경

## 🏗 아키텍처

```
FE (Vercel)          BE (AWS EC2 + nginx)      DB (Supabase)
┌──────────┐  HTTPS  ┌──────────────────┐      ┌──────────────┐
│  React   │ ──────► │  Express + TS    │ ───► │  PostgreSQL  │
│  Zustand │         │  Socket.io       │      │  Prisma ORM  │
│  SCSS    │ ◄────── │  Supabase Auth   │      └──────────────┘
└──────────┘  WS     └──────────────────┘
```

## 📁 프로젝트 구조

```
waitgym_new/
├── FE/
│   ├── src/
│   │   ├── components/    # 공통 컴포넌트
│   │   ├── pages/         # 페이지
│   │   ├── stores/        # Zustand 상태
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── lib/           # API, Socket, Supabase 클라이언트
│   │   └── styles/        # SCSS (variables/base/components/pages)
│   └── vite.config.ts
└── BE/
    ├── src/
    │   ├── routes/        # API 라우트
    │   ├── middleware/    # 인증 미들웨어
    │   ├── socket/        # Socket.io 서버
    │   └── lib/           # Prisma 클라이언트
    └── prisma/
        └── schema.prisma  # DB 스키마
```

## ⚠️ 에러 코드

| 코드 | 의미 |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

## 📆 프로젝트 기간

- 개발 기간: `2026.06`
- 리빌드 대상: [기다려짐](https://github.com/WaitGYM) (팀 프로젝트)

---

<div align="center">

Copyright WaitGym. All rights reserved.

</div>
