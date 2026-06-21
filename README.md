<div align="center">

![기다려짐](./readme/00.png)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)](https://waitgym.today)

[🌐 서비스 바로가기](https://waitgym.today)

---

</div>

## 📖 프로젝트 소개

헬스장에서 불편한 대면 및 대기상황으로 인해 플랜진행이 어려운 문제해결을 위한  
효율적인 플랜진행을 돕는 **기구 대기 서비스 "기다려짐"** 입니다.

기존 팀 프로젝트를 **혼자 리빌드**하며 기획/설계/구현/배포 전 과정을 직접 경험했습니다.

### 🎯 핵심 기능

### 1. 👤 **운동 루틴 관리**

> 내가 사용하고 싶은 운동 기구와 세트 수를 추가, 수정, 삭제해 **나의 운동 루틴**을 관리할 수 있습니다.

![운동루틴 관리](./readme/01.png)

---

### 2. 📋 **기구 대기열 파악**

> 기구마다 **현재 대기 인원**과 **사용 현황**을 Socket.io로 실시간 갱신합니다.  
> **자동 제안** 토글로 대기가 적은 기구를 우선 정렬하여 효율적인 운동 계획이 가능합니다.

![기구 대기열 파악](./readme/02.png)

---

### 3. 💺 **기구 대기 시스템**

> 사용 중인 기구를 실시간으로 대기 등록하고, 내 차례가 되면 알림을 받아 효율적으로 운동할 수 있습니다.

![기구 대기 및 실시간 알림](./readme/03.png)

---

### 4. ⏱️ **세트 / 휴식 타이머**

> 세트 완료 후 휴식 타이머가 자동으로 시작됩니다.  
> 루틴 현황 보기로 이탈해도 **플로팅 타이머**로 운동 흐름이 유지되며, 타이머 종료 시 운동 화면으로 자동 복귀합니다.

---

## 🛠 기술 스택

```
Frontend Framework    React 18 + TypeScript
Build Tool           Vite
State Management     Zustand
Styling              Sass (SCSS)
Drag & Drop          @dnd-kit
Real-time            Socket.io-client
```

**선택 이유:**

- **TypeScript**: 정적 타입 지원으로 코드 안정성 및 가독성 향상, 런타임 오류 사전 방지

- **Zustand**: 가볍고 간단한 API로 복잡한 보일러플레이트 없이 효율적인 상태 관리. 웨이팅 플로우를 상태 머신 패턴으로 모델링

- **Sass**: Tailwind CSS 대신 선택 — 세밀한 디자인 커스터마이징 요구사항 충족. 변수, 믹스인, 중첩으로 재사용 가능한 스타일 시스템 구축

- **Socket.io**: 실시간 대기열 업데이트 및 알림. ws 라이브러리 대신 선택하여 자동 재연결, 이벤트 기반 API 활용

- **Supabase Auth**: Passport.js + JWT 직접 구현 대신 선택. OAuth 토큰 검증을 미들웨어로 위임하여 보안 책임 분리

---

## 🏗 시스템 아키텍처

```
FE (Vercel)          BE (AWS EC2 + nginx)      DB (Supabase)
┌──────────┐  HTTPS  ┌──────────────────┐      ┌──────────────┐
│  React   │ ──────► │  Express + TS    │ ───► │  PostgreSQL  │
│  Zustand │         │  Socket.io       │      │  Prisma ORM  │
│  SCSS    │ ◄────── │  Supabase Auth   │      └──────────────┘
└──────────┘  WS     └──────────────────┘
```

---

## 📁 프로젝트 구조

```
waitgym_new/
├── FE/
│   └── src/
│       ├── components/    # 공통 컴포넌트
│       ├── pages/         # 페이지
│       ├── stores/        # Zustand 상태
│       ├── hooks/         # 커스텀 훅
│       ├── lib/           # API, Socket, Supabase 클라이언트
│       └── styles/        # SCSS (variables/base/components/pages)
└── BE/
    ├── src/
    │   ├── routes/        # API 라우트
    │   ├── middleware/    # 인증 미들웨어
    │   ├── socket/        # Socket.io 서버
    │   └── lib/           # Prisma 클라이언트
    └── prisma/
        └── schema.prisma  # DB 스키마
```

### 🎨 설계 패턴

**SCSS 토큰 기반 스타일 시스템**

`_spacing.scss`, `_functions.scss`의 변수/함수로 매직 넘버 없이 일관된 스타일 유지.  
컴포넌트 내부에서 태그 선택자 금지 — 전부 클래스 선택자로 작성.

---

## ✨ 주요 기능 & 구현

### 🔐 인증 시스템

- **Supabase Auth** Google OAuth 연동으로 안전하고 편리한 로그인
- 모든 API 요청에 Supabase JWT 토큰 포함, BE 미들웨어에서 검증

### 🔄 실시간 통신

**Socket.io** 기반 실시간 업데이트

- 대기열 순서 변경 즉시 반영
- 기구 사용 가능 시 알림 수신
- 자동 재연결로 연결 안정성 보장

### 🎭 인터랙티브 UI

**드래그 앤 드롭** (`@dnd-kit/core`, `@dnd-kit/sortable`)

- 운동 루틴 순서를 직관적으로 변경
- 터치/마우스 이벤트 모두 지원

---

## 🔧 트러블슈팅

### 웹 폰트 최적화: 2MB → 107KB (95% 감소)

**🚨 문제**

- Pretendard 웹 폰트 용량이 2MB로 초기 로딩 속도 저하

**✅ 해결**

- fonttools로 Font Subsetting — 실제 사용하는 글자만 추출
- `<link rel="preload">`로 폰트 로딩 우선순위 설정
- CDN 대신 자체 호스팅

**📊 결과**

- 폰트 용량 **95% 감소** (2MB → 107KB)

### Mixed Content 해결 — EC2 HTTPS 적용

**🚨 문제**

- Vercel(HTTPS)에서 EC2(HTTP)로 API 요청 시 브라우저 차단

**✅ 해결**

- AWS EC2에 nginx + Let's Encrypt(Certbot)으로 HTTPS 적용
- `waitgym.today` 도메인 연결

### 드래그 앤 드롭 스크롤 충돌 해결

**🚨 문제**

- `@dnd-kit` 사용 시 페이지 전체 스크롤 불가 이슈

**✅ 해결**

- 드래그 감도값 조정으로 스크롤과 드래그 이벤트 분리

---

## 👥 멤버 소개

<div align="center">
<table>
  <tr>
    <td align="center">
      <a href="https://github.com/lyla-bae">
        <img src="https://avatars.githubusercontent.com/u/188743295?v=4" width="100" alt="배근영"/>
      </a><br />
      <a href="https://github.com/lyla-bae"><b>배근영</b></a>
    </td>
  </tr>
</table>
</div>

---

## 📆 프로젝트 기간

- 개발 기간: `2026.06`
- 리빌드 대상: [기다려짐](https://github.com/WaitGYM) (팀 프로젝트)

---

<div align="center">

Copyright 기다려짐. All rights reserved.

</div>
