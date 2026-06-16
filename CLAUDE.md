# WaitGym - CLAUDE.md

## 프로젝트 개요
FE 개발자 포트폴리오용 헬스장 기구 대기 앱 리빌드.

## 기술 스택
| 영역 | 기술 | 배포 |
|---|---|---|
| FE | React + Vite + TypeScript + SCSS | Vercel |
| BE | Express + TypeScript | AWS EC2 |
| DB | Supabase PostgreSQL + Prisma | Supabase |
| Auth | Supabase Auth (Google OAuth) | Supabase |
| 실시간 | Socket.io | BE에 포함 |

## SCSS 규칙
- 컴포넌트 내부에서 태그 선택자 사용 금지 → 전부 클래스 선택자로
- 매직 넘버 금지 → `_spacing.scss` / `_functions.scss` 변수 활용
- `_base.scss`는 전역 리셋/기본 스타일만 (컴포넌트 스타일 X)
- 구조: `styles/variables` / `base` / `components` / `layout` / `pages`

## 경로
- 새 프로젝트: `/Users/lyla/Downloads/waitgym_new/`
- 구버전 참고: `/Users/lyla/Downloads/새싹/final_project/waitgym/`

## 브랜치 전략
- `main` — 배포용, 직접 커밋 금지
- `dev` — 작업 브랜치
- 작업 완료 시 dev → main PR

## 커밋/PR 규칙
- 커밋: `feat/fix/chore/refactor/style/docs: 한글 설명`
- PR 제목/본문 모두 한글
- `/commit`, `/pr` 슬래시 커맨드 사용

## 협업 규칙
- **작업 전 반드시 계획 설명하고 승인 받은 후 진행**
- 한 번에 너무 많은 파일 건드리지 않기

## 기능 범위
### 구현
- 기구 목록 / 검색 / 카테고리 필터 / 즐겨찾기
- 웨이팅 플로우 + 세트/휴식 타이머
- 실시간 대기열 (Socket.io)
- 로그인 (Google OAuth)
- 미션/랭킹
- 루틴 설정 (dnd-kit)
- 헬스장 찾기 (카카오 로컬 API)

### 1차 배포 제외
- 혼잡도, 모바일 앱

## 개발 순서
- 1일차 ✅ DB 스키마 + 프로젝트 세팅 + Socket.io
- 2일차 기구 목록 FE + API
- 3일차 웨이팅 플로우 + 실시간
- 4일차 로그인 + 미션/랭킹
- 5일차 루틴 + 헬스장 찾기
- 6일차 UI 다듬기 + 배포
