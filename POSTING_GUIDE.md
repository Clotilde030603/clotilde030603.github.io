# 글 쓰는 방법

1. `src/content/posts/_template.md`를 복사해 `src/content/posts/first-post.md`처럼 영문 소문자와 하이픈으로 파일을 만듭니다.
2. 파일 맨 위에 아래 정보를 적고 빈 줄 다음부터 Markdown으로 본문을 씁니다.

```md
---
title: "첫 번째 글"
date: 2026-10-22
summary: "글 목록에 표시할 짧은 소개"
category: "기록"
tags:
  - 일상
  - 배움
draft: false
---

본문을 여기에 씁니다.

## 소제목

일반 문단, **굵은 글씨**, 목록, 링크, 코드 블록과 표를 사용할 수 있습니다.
```

3. 이미지는 파일을 `public/assets/posts/`에 넣고 `![대체 텍스트](/assets/posts/파일명.png)` 형식으로 참조합니다.
4. 글을 공개할 준비가 되었을 때만 파일과 이미지를 GitHub에 올립니다. 저장소가 공개이므로 푸시한 글과 이미지 파일은 누구나 볼 수 있습니다.
5. `main`에 푸시되면 GitHub Actions가 검사·빌드·배포합니다. 초안은 `src/content/posts/` 밖의 컴퓨터에 보관하세요.

글 주소는 파일명으로 정해집니다. 예를 들어 `first-post.md`는 `/posts/first-post/`가 됩니다. 날짜는 반드시 적고, 카테고리는 선택 사항입니다. 하위 카테고리는 `보안/웹 해킹`처럼 `/`로 구분합니다. `draft: true`는 사이트에서 제외하지만, 파일을 공개 저장소에 푸시하면 원문 파일은 저장소에서 누구나 볼 수 있습니다.
