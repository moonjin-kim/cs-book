# Command Center

<!-- deployed-url:start -->
🌐 **Live demo**: https://hubtwork.github.io/command-center/
<!-- deployed-url:end -->

AI 기반 공용 작업 공간입니다. 팀의 도메인 지식(코드 위치·비즈니스 정책·데이터 흐름)을 ontology와 wiki로 관리하고, GitHub Pages에 자동 배포되는 사이트로 시각화합니다. PO·디자이너·FE·BE 누구든 같은 방식으로 작업합니다.

---

## 🚀 이 템플릿으로 시작하기

GitHub의 **"Use this template"** 버튼을 누르면 빈 워크스페이스가 만들어집니다. 아래 순서대로 활성화하세요.

### Step 1. 템플릿 복제

1. 이 페이지 우측 상단의 **"Use this template" → "Create a new repository"** 클릭
2. 우리 팀 계정/조직에 새 레포 생성 (이름·공개 범위 선택)

> Template 복제는 **파일만** 가져갑니다. Settings(Pages, Actions 권한 등)는 복제되지 않으므로 아래 Step 2를 직접 적용해야 합니다.

### Step 2. GitHub 활성화 (필수 3종)

#### ① Pages 활성화
- Settings → Pages → Source: **GitHub Actions** 선택

#### ② Workflow permissions
Settings → Actions → General → Workflow permissions:
- **"Read and write permissions"** 선택
- **"Allow GitHub Actions to create and approve pull requests"** 체크

> 두 옵션 모두 켜져야 (a) 사이트 자동 배포, (b) README 상단의 **데모 URL 자동 갱신 PR** 흐름이 동작합니다.
>
> **GHE 환경 주의**: "Allow Actions to create/approve PRs"는 admin 정책으로 막혀 있을 수 있습니다. 막혀 있으면 데모 URL 자동 갱신은 동작하지 않으니, README 상단 `<!-- deployed-url:start -->` 마커 사이를 수동으로 채우거나 admin에게 활성화를 요청하세요. 사이트 배포 자체는 정상 동작합니다.

### Step 3. 로컬 환경 세팅

> 개발 경험이 없어도 OK입니다. 순서대로 따라가세요.

#### ① Claude Pro 구독
Claude Code 사용에는 Claude Pro 이상 구독이 필요합니다.

1. [claude.ai](https://claude.ai)에서 계정 생성
2. [claude.ai/settings/billing](https://claude.ai/settings/billing)에서 **Pro** 플랜 ($20/월) 이상 결제
3. [claude.ai/settings/privacy](https://claude.ai/settings/privacy)에서 **"Help improve Claude" OFF**
   - 켜져 있으면 대화 내용이 AI 학습에 사용됩니다. 중요한 사내 정보가 들어가지 않게 하세요.

#### ② 필수 도구 설치 (Mac 기준)

**Homebrew** — Mac 패키지 관리자.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

설치 후 `Next steps`에 나오는 명령어 2줄을 그대로 실행하세요.

**Git / GitHub CLI / Node.js**

```bash
git --version          # command not found이면 xcode-select --install
brew install gh node
```

**GitHub 인증**:
```bash
GH_HOST=github.com gh auth login
```
선택지: `GitHub` → `HTTPS` → `Login with a web browser`. (GHE 사용 시 `GH_HOST=ghe.your-corp.com`)

#### ③ Claude Code 설치 + 첫 실행

```bash
npm install -g @anthropic-ai/claude-code
git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>
claude
```

다음 화면이 나오면 준비 완료:

```
╭──────────────────────────────────────╮
│ ✻ Welcome to Claude Code!            │
│   /help for available commands       │
╰──────────────────────────────────────╯
```

### Step 4. 첫 배포 트리거

GitHub의 main 브랜치에 어떤 변경이라도 push되면 워크플로우가 돌며:
1. 사이트가 `https://<owner>.github.io/<repo>/` (또는 GHE Pages URL)에 배포
2. README 상단의 `🌐 Live demo` 마커가 자동으로 실제 URL로 갱신

Claude Code 안에서 다음 한 줄로 첫 변경을 만들 수 있습니다:
```
README 첫 줄에 우리 팀 이름을 한 줄 추가하고 PR 올려줘
```

### Step 5. 예제 도메인 → 우리 팀 도메인

이 템플릿에는 이커머스 영역의 예제 도메인 3개가 들어 있습니다:

| 도메인 | 내용 |
|--------|------|
| `commerce-catalog` | 상품 등록·카테고리·검색 노출 |
| `commerce-order` | 주문·결제·환불·쿠폰 |
| `commerce-inventory` | 재고 점유·확정·저재고 알림 |

이들은 **학습 자료**입니다. 사이트를 한 번 둘러보면 ontology와 wiki가 어떻게 짝을 이루고 어떤 정보가 어느 계층에 들어가는지 감이 잡힙니다. 다 보셨으면 다음 한 줄로 비우고 시작하세요:

```
예제 도메인 다 지우고 우리 팀 도메인부터 추가하자
```

새 도메인 생성은 자연어로:
```
회원-인증 도메인을 추가하자
```

또는 슬래시 명령:
```
/new-domain member-auth
```

---

## Claude Code로 작업하기

세팅이 끝나면 일상 작업은 자연어 또는 슬래시 명령으로 진행합니다.

**코드 분석 / 질문**
```
my-api 레포의 결제 정책이 어떻게 되어 있어?
```

**정책 문서 작성**
```
방금 분석한 내용을 wiki/payment-policy 정책 문서로 정리해줘
```

**기획 → 구현 한 사이클**
```
/dev 상품 목록 정렬 기능을 추가하고 싶어
```

**변경사항 반영**
```
/commit
/pull-request
```

PR 링크가 출력되면 GitHub에서 직접 머지하세요. (Claude는 PR 생성까지만 합니다.)

---

## 자주 묻는 질문

**Claude Code를 종료하려면?**
`Ctrl + C` 또는 `/exit`.

**다시 시작하려면?**
```bash
cd <your-repo>
claude
```

**이전 대화를 이어서 하려면?**
실행 후 `/resume`을 입력하면 이전 세션 목록이 나옵니다.

**`/setup`은 뭔가요?**
처음 한 번 또는 환경이 깨졌을 때 실행하는 초기화 스킬. 이미 설치된 것은 건너뜁니다.

**사이트가 안 떠요 / 빈 화면이에요**
- Settings → Pages가 활성화되어 있는지 확인
- Actions 탭에서 `Deploy site to GitHub Pages` 워크플로우가 success인지 확인
- 도메인이 0개인 상태(예제 삭제 후 우리 팀 도메인 추가 전)면 Home에 안내 카드만 표시됩니다

---

## 디렉토리 구조

```
your-workspace/
├── CLAUDE.md              ← Claude를 위한 워크스페이스 안내
├── README.md              ← 지금 이 파일
├── .gitignore             ← projects/, worktrees/ 등 제외
│
├── .claude/
│   ├── config.json        ← 이슈 키 패턴, 빌드 패턴 등
│   ├── settings.json      ← 팀 공유 권한/훅 설정
│   ├── rules/             ← 행동 규칙 (자동 로드)
│   ├── hooks/             ← 안전장치 (보호 브랜치 커밋 차단 등)
│   ├── agents/            ← 서브에이전트 정의
│   └── skills/            ← 스킬 정의
│
├── ontology/              ← 코드 위치 + 개념·관계 (YAML)
│   ├── tbox.yaml          ← 용어 정의 (타입, 관계, axiom)
│   ├── index.yaml         ← 도메인 목록 (탐색 진입점)
│   └── abox/              ← 도메인별 인스턴스
│       ├── infra.yaml     ← 공유 인프라 (mysql, redis 등)
│       ├── cross-domain.yaml  ← 도메인 간 관계
│       └── {도메인}.yaml   ← 도메인별 entity + relation
│
├── wiki/                  ← 비즈니스 정책·의사결정 (Markdown)
│   ├── README.md          ← 도메인 인덱스
│   ├── glossary.md        ← 공통 용어
│   └── {도메인}/
│       ├── README.md      ← 도메인 개요
│       ├── architecture.md← 정책 인덱스 + 데이터 흐름
│       ├── glossary.md    ← 용어 사전
│       ├── status.md      ← 구현 추적 (AC별 ✅/⬜)
│       └── {주제}/README.md
│
├── site/                  ← ontology + wiki를 시각화하는 React/Vite 사이트
│   ├── scripts/build-data.mjs  ← YAML → JSON 빌드
│   └── src/                    ← 그래프 + 위키 뷰어
│
├── .github/workflows/     ← GitHub Pages 자동 배포
│
└── projects/              ← 코드 레포 (.gitignore 대상)
    └── {name}/
        ├── main/          ← 기본 브랜치 (읽기 전용)
        └── worktrees/     ← 기능별 작업 브랜치
```

## 3계층 모델

| 계층 | 무엇을 담는가 | 누가 | 답하는 질문 |
|------|---------------|------|-------------|
| **ontology** (`ontology/`) | 코드에 있는 개념·관계, 코드 위치 (YAML) | 사람·Claude | "무엇이 있고 어디에 있나" |
| **wiki** (`wiki/`) | 비즈니스 정책·의사결정·시나리오 (Markdown) | 사람 | "왜 이렇게 만들었나" |
| **code** (`projects/`) | 실제 구현 | 사람 | "어떻게 동작하나" |

ontology의 `wiki_doc` 필드가 두 계층을 연결합니다. 상세 규칙: `.claude/rules/ontology-rules.md`, `.claude/rules/wiki-docs.md`

## 스킬 목록

| 스킬 | 설명 |
|------|------|
| `/setup` | 초기 세팅 (도구 설치, GHE 인증, 프로젝트 clone) |
| `/sync-projects` | 코드 레포 clone 및 최신화 |
| `/new-domain` | 새 도메인 생성 (wiki + ontology 동시) |
| `/dev` | PRD → 설계 → 구현 → 리뷰 → 커밋/PR 한 사이클 |
| `/commit` | 한국어 커밋 메시지로 Git 커밋 |
| `/pull-request` | 커밋 히스토리 기반 PR 자동 생성 |
| `/worktree` | projects/ 코드 레포의 Git worktree 자동화 |
| `/lens` | 코드 속 비즈니스 정책 탐지 → PO/PD 보고서 |
| `/humanizer` | AI 글쓰기 패턴 감지 및 교정 |

도메인 추가를 수동으로 구성하려면 [Wiki 문서 규칙](.claude/rules/wiki-docs.md)을 참고하세요.
