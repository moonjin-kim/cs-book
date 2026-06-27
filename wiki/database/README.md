# Database

Database 면접은 **정확한 데이터를 안전하게 바꾸고 빠르게 읽기 위해 트랜잭션, 인덱스, 락, 실행 계획을 어떻게 이해하는지**가 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| ACID | 트랜잭션이 안전하게 실행되기 위한 원자성, 일관성, 격리성, 지속성입니다. |
| 격리 수준 | 동시 트랜잭션이 서로의 변경을 얼마나 볼 수 있는지 정합니다. |
| MVCC | 여러 버전의 데이터를 유지해 읽기와 쓰기의 충돌을 줄입니다. |
| 인덱스 | 읽기 성능을 높이지만 쓰기 비용과 저장 공간을 늘립니다. |
| 실행 계획 | DB가 어떤 방식으로 데이터를 찾는지 확인하는 도구입니다. |
| Replication | Primary 변경 로그를 Replica에 반영해 읽기 분산과 장애 대응을 합니다. |
| Sharding | 데이터를 여러 DB 인스턴스에 나눠 저장해 수평 확장합니다. |

## 트랜잭션과 ACID

| 속성 | 의미 |
| --- | --- |
| Atomicity | 모두 성공하거나 모두 실패합니다. |
| Consistency | 제약 조건을 만족하는 상태로만 전이합니다. |
| Isolation | 동시에 실행되어도 서로의 중간 상태를 침범하지 않습니다. |
| Durability | commit된 결과는 장애 후에도 보존됩니다. |

## 격리 수준

| 격리 수준 | 설명 | 발생 가능한 현상 |
| --- | --- | --- |
| READ UNCOMMITTED | 미커밋 데이터 읽기 가능 | dirty, non-repeatable, phantom |
| READ COMMITTED | 커밋된 데이터만 읽음 | non-repeatable, phantom |
| REPEATABLE READ | 같은 row 재조회 결과 보장 | 표준상 phantom 가능 |
| SERIALIZABLE | 직렬 실행처럼 보장 | 성능 저하, lock 증가 |

이상 현상:

- Dirty Read: 커밋되지 않은 데이터를 읽습니다.
- Non-repeatable Read: 같은 row를 다시 읽었을 때 값이 바뀝니다.
- Phantom Read: 같은 조건의 범위 조회에서 새 row가 나타납니다.

## Lock과 MVCC

### Lock

| Lock | 설명 |
| --- | --- |
| Shared Lock | 읽기 락, 다른 shared lock과 공존 가능 |
| Exclusive Lock | 쓰기 락, 다른 lock과 공존 불가 |

### 낙관적 락 vs 비관적 락

| 구분 | 낙관적 락 | 비관적 락 |
| --- | --- | --- |
| 가정 | 충돌이 드묾 | 충돌이 잦음 |
| 방식 | version으로 수정 시점 검증 | 먼저 DB lock 획득 |
| 장점 | lock 점유 적음 | 강한 정합성 |
| 단점 | 재시도 필요 | 대기, deadlock 가능 |

### MVCC

MVCC는 데이터의 여러 버전을 유지해 트랜잭션마다 일관된 snapshot을 보게 합니다.

장점:

- 읽기가 쓰기를 덜 막습니다.
- 쓰기가 읽기를 덜 막습니다.

주의:

- 오래 열린 트랜잭션은 undo log 정리를 막을 수 있습니다.
- snapshot 기준을 이해해야 격리 수준 동작을 설명할 수 있습니다.

## Gap Lock과 Next-Key Lock

| 개념 | 설명 |
| --- | --- |
| Gap Lock | 인덱스 record 사이의 빈 공간을 잠급니다. |
| Next-Key Lock | record lock + gap lock입니다. |

목적:

- 범위 조건에서 phantom read를 막습니다.
- `SELECT ... FOR UPDATE` 범위 조회에서 삽입을 막을 수 있습니다.

## 인덱스

### B-Tree vs B+Tree

| 구분 | B-Tree | B+Tree |
| --- | --- | --- |
| 값 저장 | 내부/리프 노드 모두 가능 | 리프 노드에만 저장 |
| 검색 종료 | 내부 노드에서 끝날 수 있음 | 항상 리프까지 이동 |
| 범위 검색 | 상대적으로 불리 | 리프 연결로 유리 |
| DB 인덱스 적합성 | 낮음 | 높음 |

### 인덱스 종류

| 구분 | 설명 |
| --- | --- |
| Clustered Index | 실제 데이터가 인덱스 key 순서로 저장됩니다. |
| Secondary Index | key와 실제 row를 찾기 위한 값을 저장합니다. |
| Covering Index | 쿼리에 필요한 컬럼이 모두 인덱스에 있어 테이블 접근을 줄입니다. |

주의:

- 인덱스는 읽기를 빠르게 하지만 insert/update/delete 비용을 늘립니다.
- 너무 많은 인덱스는 쓰기 성능과 저장 공간에 부담이 됩니다.

## EXPLAIN

| 항목 | 봐야 할 것 |
| --- | --- |
| `type` | 접근 방식. `ALL`이면 full scan입니다. |
| `possible_keys` | 사용 가능했던 인덱스 후보입니다. |
| `key` | 실제 선택된 인덱스입니다. |
| `rows` | 예상 스캔 row 수입니다. |
| `Extra` | `Using filesort`, `Using temporary`, `Using index` 등을 확인합니다. |

인덱스 설계 기준:

- 카디널리티가 높은 컬럼이 유리합니다.
- 선택도가 낮을수록 인덱스 효율이 좋습니다.
- 복합 인덱스는 동등 조건, 정렬, 범위 조건 순서를 함께 봅니다.

## Paging

### Offset Paging

```sql
SELECT *
FROM posts
ORDER BY id
LIMIT 20 OFFSET 100000;
```

문제:

- 뒤 페이지로 갈수록 건너뛸 row가 많아집니다.
- 대량 데이터에서 느려집니다.

### Cursor / Keyset Paging

```sql
SELECT *
FROM posts
WHERE id > ?
ORDER BY id
LIMIT 20;
```

장점:

- 뒤 페이지에서도 안정적입니다.
- 인덱스를 활용하기 쉽습니다.

단점:

- 임의 페이지 이동이 어렵습니다.

## 정규화와 역정규화

| 구분 | 목적 |
| --- | --- |
| 정규화 | 중복 제거, 이상 현상 감소 |
| 역정규화 | 조회 성능 개선, join 감소 |

정규화 단계:

| 단계 | 의미 |
| --- | --- |
| 1NF | 컬럼이 원자값 |
| 2NF | 부분 함수 종속 제거 |
| 3NF | 이행적 종속 제거 |
| BCNF | 모든 결정자가 후보키 |

역정규화는 성능에 유리하지만 중복 데이터 일관성 유지 로직이 필요합니다.

## 삭제 전략

| 구분 | 설명 | 주의 |
| --- | --- | --- |
| 물리 삭제 | row를 실제 삭제 | 복구 어려움 |
| 논리 삭제 | `deleted_at` 등으로 삭제 표시 | 조회 조건 누락, 테이블 비대화 |

## Replication과 Sharding

### Replication

| 방식 | 특징 |
| --- | --- |
| Row | 변경된 row를 기록, 정확하지만 log 큼 |
| Statement | SQL 문장 기록, 작지만 비결정적 SQL에 취약 |
| Mixed | 상황별 혼합 |

활용:

- 읽기 분산
- 장애 복구
- 백업

주의:

- Replica lag가 발생할 수 있습니다.
- 쓰기 직후 읽기에서 최신 데이터가 안 보일 수 있습니다.

### Partitioning vs Sharding

| 구분 | 설명 |
| --- | --- |
| Partitioning | 하나의 DB 서버 안에서 테이블을 나눕니다. |
| Sharding | 여러 DB 인스턴스에 데이터를 나눕니다. |

Sharding 주의점:

- shard key 선택이 중요합니다.
- cross-shard join이 어렵습니다.
- 분산 트랜잭션과 resharding 비용이 큽니다.

## RDB vs NoSQL

| 구분 | RDB | NoSQL |
| --- | --- | --- |
| Schema | 고정 | 유연 |
| Query | SQL, join 강함 | 모델별 API |
| Transaction | 강함 | 제품별 차이 |
| 확장 | 수직 확장 중심 | 수평 확장 유리 |
| 적합 | 정합성 중요한 업무 | 대규모 분산, 유연한 구조 |

NoSQL 유형:

| 유형 | 예시 | 사용 |
| --- | --- | --- |
| Key-Value | Redis, DynamoDB | 캐시, 세션 |
| Document | MongoDB | 프로필, 콘텐츠 |
| Column-family | Cassandra | 로그, 분석 |
| Graph | Neo4j | 관계 탐색 |
| Time-series | Prometheus | 메트릭 |

## Connection Pool

Connection Pool은 DB 연결을 미리 만들고 재사용합니다.

장점:

- 연결 생성 비용 감소
- DB 최대 연결 초과 방지
- 요청 처리 지연 감소

설정 포인트:

- max pool size
- connection timeout
- thread pool 크기와 균형
- slow query와 connection 점유 시간

## Statement vs PreparedStatement

| 구분 | Statement | PreparedStatement |
| --- | --- | --- |
| SQL 구성 | 문자열 직접 조합 | placeholder binding |
| SQL Injection | 취약 | 안전 |
| 반복 실행 | 매번 parsing 가능 | plan 재사용 가능 |

API 입력값은 `PreparedStatement`로 바인딩하는 것이 기본입니다.
