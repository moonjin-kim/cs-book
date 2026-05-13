# Command Center

<!-- deployed-url:start -->
⏳ 첫 배포 후 자동으로 채워집니다. (`Deploy site to GitHub Pages` 워크플로우가 머지될 때마다 갱신)
<!-- deployed-url:end -->

AI 기반 공용 작업 공간입니다.

PO, 디자이너, FE, BE 등 역할에 관계없이 이 디렉토리에서 Claude Code를 실행합니다. 코드를 분석하고, 정책 문서를 만들고, 도메인 지식을 쌓아가는 곳입니다.

**도메인 문서**: TODO - workflow 설정을 마치고 나서 CLAUDE 에 입력을 부탁하세요.

---

## 시작하기

> 개발 경험이 없어도 괜찮습니다. 아래를 순서대로 따라하면 됩니다.
>
> **전체 흐름**: 사전 준비(웹) → 최소 설치(터미널) → **나머지는 Claude에게 맡기기**

### Part 1. 사전 준비 (웹에서)

#### Step 1. Claude Pro 구독

Claude Code를 사용하려면 **Claude Pro 이상의 구독**이 필요합니다.

1. [claude.ai](https://claude.ai)에 접속해 계정을 생성
2. 승인 후 [claude.ai/settings/billing](https://claude.ai/settings/billing)에서 **Pro** 플랜 ($20/월) 이상의 플랜을 결제
3. [claude.ai/settings/privacy](https://claude.ai/settings/privacy)에서 **"Help improve Claude"를 반드시 OFF**
   - 켜져 있으면 대화 내용이 AI 학습 데이터로 사용됩니다. 중요한 정보가 그대로 전달될 수 있으니 주의하세요.

---

### Part 2. 최소 설치 (터미널에서)

Claude Code를 실행하기 위한 최소한만 직접 설치합니다. 이후 환경 세팅은 Claude가 해줍니다.

#### Step 3. 터미널 열기

1. `Cmd + Space` → **터미널** (또는 **Terminal**) 검색 → 실행
2. 까만 화면에 커서가 깜빡이면 준비 완료

> 앞으로 나오는 코드 블록은 터미널에 **붙여넣고 Enter**를 누르면 됩니다.

#### Step 4. 필수 도구 설치

**Homebrew** — Mac용 패키지 관리자. 프로그램을 명령어 한 줄로 설치할 수 있게 해줍니다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- Mac 로그인 비밀번호를 물으면 입력합니다 (타이핑해도 화면에 안 보이는 게 정상)
- 설치 완료 후 `Next steps`에 나오는 명령어 2줄을 복사해서 실행합니다

**Git** — 코드를 다운로드하고 버전을 관리하는 도구.

```bash
git --version
```
버전이 출력되면 이미 설치된 것입니다. `command not found`가 나오면:
```bash
xcode-select --install
```

**GitHub CLI** — 터미널에서 GitHub에 로그인하는 도구.

```bash
brew install gh
```

설치 후 GitHub Enterprise 인증:
```bash
GH_HOST=github.com gh auth login
```
선택지가 나오면 순서대로:
1. `GitHub` 선택
2. `HTTPS` 선택
3. `Login with a web browser` 선택 → 브라우저에서 로그인

**Node.js** — Claude Code 실행에 필요.

```bash
brew install node
```

#### Step 5. Claude Code 설치 및 실행

```bash
npm install -g @anthropic-ai/claude-code
claude
```

처음 실행하면 브라우저에서 Claude 계정 인증을 진행합니다. Step 2에서 구독한 계정으로 로그인하세요.

```
╭──────────────────────────────────────╮
│ ✻ Welcome to Claude Code!            │
│                                      │
│   /help for available commands       │
╰──────────────────────────────────────╯

>
```

이 화면이 나오면 직접 설치할 것은 끝입니다.

---

### Part 3. Claude에게 맡기기

#### Step 7. 초기 세팅

`>` 프롬프트에 입력합니다:

```
/setup
```

Claude가 남은 도구 설치와 `projects/` 폴더에 코드 레포지토리 다운로드를 자동으로 처리합니다. 중간에 허용 여부를 물으면 **Y**를 누르세요.

#### Step 8. 사용해보기

세팅이 끝나면 바로 작업할 수 있습니다. 몇 가지 예시:

**코드 분석 & 질문**
```
my-website 에서 결제 관련 정책이 어떻게 되어있어?
```

**정책 문서 작성**
```
카테고리 필터 정책 문서 만들어줘
```

**기획부터 구현까지**
```
/dev 상품 목록 정렬 기능 추가
```

#### Step 9. 변경사항 반영하기

Claude가 문서를 만들거나 코드를 수정하면, 다른 팀원도 볼 수 있도록 GitHub에 올려야 합니다.

```
/commit
/pull-request
```

`/commit`은 변경 내용을 저장하고, `/pull-request`는 GitHub에 PR(Pull Request)을 만듭니다. PR은 "이런 변경을 했는데 반영해도 될까요?"라고 요청하는 것입니다.

PR 링크가 나오면:
1. 링크를 클릭해서 브라우저에서 열기
2. **Files changed** 탭에서 변경 내용 확인
3. **Merge pull request** → **Confirm merge** 클릭

---

## 자주 묻는 질문

**Claude Code를 종료하려면?**
`Ctrl + C` 또는 `/exit` 입력

**다음에 다시 시작하려면?**
```bash
cd project-command-center
claude
```

**이전 작업을 이어서 하고 싶으면?**
Claude Code 실행 후 `/resume`을 입력하면 이전 세션 목록이 나옵니다.

**`/setup`을 다시 실행해도 되나요?**
네. 이미 설치된 것은 건너뛰고, 새로 추가된 것만 처리합니다.

---

## 디렉토리 구조

```
project-command-center/
├── CLAUDE.md              ← 프로젝트 소개 및 작업 범위
├── README.md              ← 지금 이 파일
├── .gitignore             ← projects/ 제외
│
├── .claude/
│   ├── workspace.json     ← 워크스페이스 설정 (팀, GHE, 프로젝트 목록)
│   ├── settings.json      ← 팀 공유 권한/훅 설정
│   ├── rules/             ← 행동 규칙 (자동 로드)
│   ├── hooks/             ← 안전장치 (보호 브랜치 커밋 차단 등)
│   ├── agents/            ← 서브에이전트 정의
│   └── skills/            ← 스킬 정의 (아래 "스킬 목록" 참조)
│
├── ontology/              ← 도메인 탐색 맵 (YAML, 기계용)
│   ├── tbox.yaml          ← 용어 정의 (타입, 관계, 제약)
│   ├── index.yaml         ← 탐색 진입점 (도메인 목록)
│   └── abox/              ← 도메인별 entity + relation
│       ├── infra.yaml     ← 공유 인프라 (mysql, redis 등)
│       └── {도메인}.yaml   ← 도메인별 인스턴스
│
├── wiki/                  ← 비즈니스 지식 (Markdown, 사람용)
│   ├── README.md          ← 도메인 목록 인덱스
│   ├── glossary.md        ← 공통 용어 사전
│   └── {도메인}/           ← 도메인별 위키
│       ├── README.md      ← 도메인 개요
│       ├── architecture.md← 비즈니스 정책 인덱스
│       ├── glossary.md    ← 용어 사전
│       ├── status.md      ← 구현 추적 (AC별 ✅/⬜)
│       └── {주제}/README.md ← 주제별 상세 정책/설계
│
└── projects/              ← 코드 레포 (.gitignore 대상)
    └── {name}/
        ├── main/          ← 기본 브랜치 (읽기 전용)
        └── worktrees/     ← 기능별 작업 브랜치
```

## 도메인 추가

`/new-domain [도메인명]`으로 자동 생성합니다. wiki + ontology가 동시에 생성됩니다. 수동으로 구성하려면 [Wiki 문서 규칙](.claude/rules/wiki-docs.md)을 참고하세요.

## 스킬 목록

| 스킬 | 설명 |
|------|------|
| `/setup` | 초기 세팅 (도구 설치, GHE 인증, 프로젝트 clone) |
| `/sync-projects` | GHE 레포 clone 및 최신화 |
| `/new-domain` | 새 도메인 생성 (wiki + ontology) |
| `/dev` | PRD → 설계 → 구현 → 리뷰 → 커밋/PR 전체 사이클 |
| `/commit` | 한국어 커밋 메시지로 Git 커밋 |
| `/pull-request` | 커밋 히스토리 기반 PR 자동 생성 |
| `/worktree` | projects/ 코드 레포의 Git worktree 자동화 |
| `/lens` | 코드 속 비즈니스 정책 탐지 → PO/PD 보고서 |
| `/humanizer` | AI 글쓰기 패턴 감지 및 교정 |
