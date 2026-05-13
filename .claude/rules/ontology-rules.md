# 온톨로지 규칙

> 설계 배경(이것은 무엇인가/아닌가, 왜 코드 중심인가)은 `wiki/ontology-design.md`를 참조하세요. 이 문서는 매 작업 시 참조되는 운영 규칙만 다룹니다.

## 3계층 분리

| 계층 | 역할 | 정합성 앵커 |
|------|------|-------------|
| **ontology** | 코드에 있는 것의 지도 | `repo` + `package` (코드 존재 확인) |
| **wiki** | 코드 밖 비즈니스 맥락 | 사람이 작성·검토 |
| **code** | 실제 구현 (진실의 원천) | — |

ontology entity의 `wiki_doc` 필드가 두 계층을 연결합니다. "이 코드가 뭐하는지"는 ontology가, "왜 이렇게 만들었는지"는 wiki가 답합니다.

## 파일 구조

```
ontology/
├── tbox.yaml              ← T-Box: 용어 정의 (클래스, 프로퍼티, Axiom). 드물게 참조
├── index.yaml             ← 탐색 진입점. 매 요청 시 읽음
└── abox/                  ← A-Box: 인스턴스
    ├── infra.yaml         ← 공유 인프라 (mysql, redis, kafka 등). 도메인 공통
    ├── example.yaml ← 도메인별 process/data/external + relation
    └── cross-domain.yaml  ← 도메인 간 관계
```

## 탐색 흐름

질문이 특정 도메인의 코드 구조, 비즈니스 정책, entity 관계를 다룰 때:

1. `ontology/index.yaml`을 읽어 전체 도메인 맵 파악
2. 관련 도메인의 A-Box 파일(`ontology/abox/{file}`)을 읽어 개념/관계 파악
3. 도메인 간 관계가 필요하면 `index.yaml`의 `cross_domain` 필드가 가리키는 파일 참조
4. 비즈니스 정책/의사결정이 필요하면 entity의 `wiki_doc`으로 이동
5. 코드가 필요하면 entity의 `repo` + `package`로 코드 탐색
6. 새 entity/relation 작성 시에만 `ontology/tbox.yaml`로 타입/규칙 확인

## 네이밍 규칙

- **id** (도메인, entity 모두): 영문 소문자 + 하이픈. 예: `asset-factory`, `growth-system`
- **name**: 팀에서 부르는 이름. 한글 허용, 대명사(NPU, TUBA 등)는 영어. 예: 고양이키우기, NPU
- **file**: `abox/{도메인id}.yaml`

## 최신화 의무

ontology는 코드와 동기화되어야 한다. 오래된 ontology는 없는 것보다 해롭다.

### 코드 변경 시
- 새 서비스/프로세스가 추가되면 ontology entity를 **함께 추가**
- 기존 개념의 관계가 바뀌면 (새 의존성, 제거된 의존성) ontology를 **함께 갱신**
- entity가 삭제/deprecated 되면 ontology에서도 제거
- 코드 모듈 구조 변경은 entity가 아니라 `notes`에 반영

### wiki/ 변경 시
- wiki 문서를 추가/수정하면, 대응하는 ontology entity의 `wiki_doc`이 정확한지 확인
- 새 비즈니스 개념이 추가되면 ontology에 entity 추가

### 새 도메인 추가 시
1. `ontology/index.yaml`에 도메인 항목 추가 (path, summary, repos, infra)
2. `ontology/abox/{도메인id}.yaml` 파일 생성
3. 코드 분석 기반으로 entity/relation 작성 — `tbox.yaml`의 타입/axiom 준수
4. 도메인 간 관계가 있으면 `abox/cross-domain.yaml` 갱신

### 정합성 점검
- `/domain-audit` 실행 시 ontology ↔ wiki ↔ 코드 3자 정합성 점검
- wiki_doc이 가리키는 파일이 실존하는지 확인
- ontology의 entity가 코드에 여전히 존재하는지 확인

## 작성 원칙

### entity는 비즈니스 기능 단위
- 코드 모듈(api 모듈, application 모듈 등)은 entity로 만들지 않는다 — notes에 기록
- 코드 위치는 각 entity의 `repo` + `package` 필드로 참조

### summary는 코드 근거 + 비즈니스 의미
- 코드에서 확인된 사실을 근거로 작성
- 문서에 없는 것을 발견하면 "wiki 문서 미작성"으로 명시

### 도메인 = 비즈니스 기능
- 코드 레포 단위가 아니라 비즈니스 기능 단위
- 하나의 레포에 여러 도메인이 있을 수 있음 (예: shopping-growth 안에 NPU + 매일방문)

### 코드 연동 없는 관계
- 사람이 개입하는 수동 데이터 전달(human-in-the-loop)은 relation이 아닌 notes에 기록

### 관계 유형 확장
- 기존 10개(`tbox.yaml` → `relation_types`)로 표현이 어려운 관계가 반복되면 사용자에게 유형 추가를 제안
- 미채택 유형 목록은 `wiki/ontology-design.md § 미채택 관계 유형` 참조
