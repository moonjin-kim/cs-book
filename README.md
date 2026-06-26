# CS Interview Notes

<!-- deployed-url:start -->
Live demo: https://hubtwork.github.io/command-center/
<!-- deployed-url:end -->

CS 면접 내용을 Backend Core, Web & Network, CS Foundation, Architecture & Operations 카테고리로 정리한 정적 웹사이트입니다. Vite로 빌드하고 GitHub Pages에 자동 배포합니다.

## 배포 방법

GitHub Pages는 `.github/workflows/deploy-pages.yml`로 구성되어 있습니다.

1. GitHub 저장소 Settings → Pages → Source를 **GitHub Actions**로 선택
2. Settings → Actions → General → Workflow permissions에서 **Read and write permissions** 선택
3. `main` 브랜치에 푸시하면 `site`가 빌드되어 Pages에 배포됨

## 로컬 실행

```bash
cd site
npm ci
npm run dev
```

## 콘텐츠 수정

- 도메인 목록: `ontology/index.yaml`
- 도메인별 개념과 관계: `ontology/abox/*.yaml`
- 문서: `wiki/**/*.md`
- 빌드 시 `site/scripts/build-data.mjs`가 ontology와 wiki를 `site/public/data`로 변환합니다.
