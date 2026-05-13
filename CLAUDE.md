# CLAUDE.md

## Command Center

AI 기반 공용 작업 공간입니다.
PO, 디자이너, FE, BE 등 역할에 관계없이 이 디렉토리에서 Claude Code를 통해 다양한 작업을 진행합니다.

한국어로 응답하세요. 코드와 커밋 메시지도 한국어를 기본으로 합니다.

---

## 3계층 지식 구조

ontology는 코드에 있는 것의 지도이고, wiki는 코드 밖 비즈니스 맥락을 포함한다. 분리한 이유: ontology는 `repo` + `package`로 코드 존재를 검증할 수 있어야 정합성이 유지되고, 코드에 없는 비즈니스 개념은 이 검증이 불가능하므로 wiki에서 다룬다. 상세: `.claude/rules/ontology-rules.md` → 설계 철학.

| 계층 | 디렉토리 | 담는 것 | 언제 참조 |
|------|----------|---------|----------|
| **ontology** | `ontology/` | What(개념), Where(코드 위치), How(관계) — YAML | 코드 작업 전 항상 먼저 |
| **wiki** | `wiki/` | Why(의사결정), Rule(비즈니스 정책), Flow(시나리오) — Markdown | "왜?"가 필요할 때 |
| **code** | `projects/` | 실제 구현 | 수정/상세 확인할 때 |

도메인 작업 시 Claude의 탐색 절차와 작성 규칙은 `.claude/rules/ontology-rules.md`(ontology) 및 `.claude/rules/wiki-docs.md`(wiki)에 정의되어 있습니다. 대화 중 발견한 ontology/wiki 갱신 후보는 사용자 승인 후 반영하며, 임의 반영은 금지입니다 (상세: `.claude/rules/behavior.md § 10. 피드백 반영`).

## 테스트

| 대상 | 파일 | 실행 |
|------|------|------|
| permission 훅 단위 테스트 | `.claude/__tests__/permission-handler.test.mjs` | `node --test .claude/__tests__/permission-handler.test.mjs` |
| subagent 허용 패턴 테스트 | `.claude/__tests__/subagent-allow-patterns.test.mjs` | `node --test .claude/__tests__/subagent-allow-patterns.test.mjs` |
| 훅 E2E 시나리오 테스트 | `.claude/__tests__/hook-e2e.sh` | `bash .claude/__tests__/hook-e2e.sh` |

`.claude/` 하위(훅, 스킬, 설정 등)를 수정할 때 관련 테스트를 실행하세요.

## 작업 범위

이 워크스페이스에서 Claude가 할 수 있는 작업의 범위입니다.

- **PR 생성까지만.** PR 머지(`gh pr merge` 등)는 절대 실행하지 마세요. 사용자가 직접 머지를 요청하더라도 거절하고, PR 링크를 제공하여 직접 머지하도록 안내하세요.
- 역할(PO, PD, FE, BE)에 관계없이 누구든 wiki/ontology 문서 작업, 필요시 코드 작업, PR 생성까지 동일한 흐름을 사용합니다.
- **브라우저 제어는 agent-browser를 사용하세요.** 웹사이트 탐색, 스크린샷, 폼 입력, QA 테스트 등 브라우저가 필요한 모든 작업에 `/agent-browser` 스킬 또는 `agent-browser` CLI를 사용합니다.
