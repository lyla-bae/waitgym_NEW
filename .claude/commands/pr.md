dev → main PR을 생성해줘.

규칙:
- 현재 브랜치가 dev인지 확인하고, 아니면 경고
- `git log main..dev`로 커밋 목록 확인
- PR 제목: 작업 내용을 한 줄로 요약 (한글)
- PR 본문은 아래 형식으로 한글 작성:

## 작업 내용
- 변경사항 bullet point

## 주요 변경 파일
- 파일 목록

## 테스트
- [ ] 로컬에서 동작 확인

- `gh pr create` 로 생성하고 PR URL 알려줘
