# Database: 심화 설계와 운영 패턴

← [Database 개요](README.md)

### SARGable Query

SARGable은 Search ARGument ABLE의 줄임말로, DB가 인덱스 탐색 조건으로 사용할 수 있는 형태의 query를 뜻합니다.

인덱스 사용이 어려운 예:

```sql
-- created_at 인덱스가 있어도 컬럼에 함수를 적용하면 range scan이 어려울 수 있음
SELECT *
FROM orders
WHERE DATE(created_at) = '2026-07-03';
```

개선:

```sql
SELECT *
FROM orders
WHERE created_at >= '2026-07-03 00:00:00'
  AND created_at <  '2026-07-04 00:00:00';
```

흔한 anti-pattern:

- indexed column을 함수로 감쌉니다.
- 문자열 앞쪽 wildcard를 사용합니다: `LIKE '%keyword'`.
- 암묵적 타입 변환이 발생합니다.
- OR 조건이 넓게 퍼져 optimizer가 index를 쓰기 어렵습니다.
- 낮은 selectivity 조건만 단독으로 index를 만듭니다.

면접 포인트:

- “인덱스가 있다”와 “인덱스를 효율적으로 탄다”는 다릅니다.
- `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY`가 같은 인덱스 설계에 영향을 줍니다.
- DB별 optimizer와 expression index, generated column 지원 여부를 확인해야 합니다.

### Join 튜닝 심화

Join 성능은 단순히 join 수가 아니라 **join 순서, cardinality 추정, access path, 중간 결과 크기**에 좌우됩니다.

대표 전략:

| 전략 | 설명 | 유리한 상황 |
| --- | --- | --- |
| Nested Loop Join | 바깥 row마다 안쪽 table 탐색 | 바깥 row가 적고 안쪽 join key index가 좋음 |
| Hash Join | 한쪽 입력으로 hash table 생성 후 매칭 | equality join, 큰 데이터 batch 처리 |
| Merge Join | 정렬된 양쪽 입력을 순차 병합 | 양쪽이 join key로 정렬되어 있거나 range 처리 |

튜닝 순서:

1. 가장 선택도 높은 필터가 먼저 적용되는지 봅니다.
2. join key 타입과 collation이 같은지 확인합니다.
3. join key index가 있는지 확인합니다.
4. 실행 계획의 예상 row와 실제 row 차이를 봅니다.
5. 통계 정보가 오래되었는지 확인합니다.
6. 필요한 컬럼만 projection해 중간 결과 폭을 줄입니다.

주의:

- `SELECT *`는 network 비용뿐 아니라 covering index 가능성도 낮춥니다.
- 작은 table이라고 항상 먼저 join하는 것이 정답은 아닙니다. 필터 후 cardinality가 중요합니다.
- ORM의 N+1 query는 join 문제가 아니라 round-trip과 반복 query 문제일 수 있습니다.

### Hot Row와 Contention

Hot row는 많은 transaction이 같은 row를 동시에 갱신해 lock wait가 쌓이는 병목입니다.

예:

- 상품 재고 row 하나에 주문이 몰림
- 게시글 view count를 매 요청마다 같은 row에 update
- 전역 sequence/counter row
- 인기 쿠폰 사용량 row

증상:

- lock wait 증가
- deadlock 증가
- transaction latency 증가
- connection pool 점유 시간 증가
- replication lag 증가

대응:

| 접근 | 설명 | trade-off |
| --- | --- | --- |
| 조건부 atomic update | `WHERE stock > 0` 같은 조건으로 단일 update | 실패 처리와 재시도 필요 |
| counter sharding | 여러 counter row에 분산 후 합산 | 정확한 실시간 합계 비용 증가 |
| queue/serial worker | 한 key의 변경을 순서대로 처리 | latency와 worker 장애 대응 필요 |
| optimistic lock | version 충돌 시 재시도 | 충돌이 높으면 retry storm 가능 |
| cache write-behind | write를 모아 반영 | 데이터 손실/지연 허용 범위 필요 |

면접 답변에서는 “lock을 건다”에서 끝내지 말고, 충돌 빈도와 실패 비용에 따라 atomic update, pessimistic lock, queue, sharding 중 무엇을 택할지 말해야 합니다.

### Idempotency와 Unique Constraint

결제, 주문, 포인트 지급처럼 재시도가 가능한 API는 같은 요청이 여러 번 들어와도 결과가 중복되지 않아야 합니다.

DB 기반 idempotency 패턴:

```sql
CREATE TABLE idempotency_keys (
  idempotency_key VARCHAR(100) PRIMARY KEY,
  request_hash VARCHAR(100) NOT NULL,
  response_body TEXT,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

핵심:

- client가 idempotency key를 보냅니다.
- server는 key를 unique constraint로 저장합니다.
- 같은 key가 다시 오면 기존 처리 결과를 반환하거나 진행 중 상태를 확인합니다.
- 같은 key에 다른 request body가 오면 충돌로 봅니다.

주의:

- idempotency key TTL과 저장 용량 정책이 필요합니다.
- transaction 경계를 idempotency record와 비즈니스 변경이 함께 안전하게 묶이도록 잡습니다.
- unique constraint는 동시 요청 race condition을 막는 강한 장치입니다.

### Transaction Boundary 설계

트랜잭션은 길수록 안전한 것이 아니라, **불변식을 지키는 최소 범위**로 잡는 것이 좋습니다.

트랜잭션 안에 넣기 좋은 것:

- 같은 DB에서 함께 commit/rollback되어야 하는 변경
- unique constraint, foreign key, 재고 차감 같은 불변식 검증
- outbox event record 저장

트랜잭션 밖으로 빼는 것이 좋은 것:

- 외부 API 호출
- 긴 파일 I/O
- 사용자 응답 대기
- email, push notification 발송
- 긴 batch processing

이유:

- 외부 I/O가 transaction 안에 있으면 lock과 connection 점유 시간이 길어집니다.
- 외부 API는 DB rollback과 함께 되돌릴 수 없습니다.
- 장애 시 retry와 보상 transaction을 따로 설계해야 합니다.

### Outbox Pattern

DB 변경과 메시지 발행을 하나의 원자적 작업처럼 다루기 위한 패턴입니다.

흐름:

```text
business transaction
 -> update domain table
 -> insert outbox_event
 -> commit
poller / CDC
 -> publish message
 -> mark published
```

장점:

- DB commit은 성공했는데 메시지 발행이 실패하는 문제를 줄입니다.
- message broker transaction에 직접 의존하지 않고도 eventual consistency를 설계할 수 있습니다.

주의:

- consumer는 중복 메시지를 처리할 수 있어야 합니다.
- outbox table 정리 정책이 필요합니다.
- event ordering이 필요한 key는 partition key와 발행 순서를 함께 설계해야 합니다.

### Read/Write Split과 일관성

Primary는 write, replica는 read로 나누면 읽기 부하를 분산할 수 있지만 최신성 문제가 생깁니다.

문제:

- write 직후 replica에서 읽으면 이전 값이 보일 수 있습니다.
- replica lag가 커지면 사용자가 방금 만든 주문을 못 볼 수 있습니다.
- read-only transaction이 오래 걸리면 replica resource를 압박할 수 있습니다.

대응:

| 요구 | 전략 |
| --- | --- |
| write 직후 본인 읽기 | 일정 시간 primary read, session stickiness |
| lag 허용 가능 | replica read, 화면에 eventual consistency 허용 |
| lag 감지 | replica delay metric 기반 routing |
| 강한 정합성 | primary read 또는 동기 복제 검토 |

면접 포인트:

- “read replica로 읽기 분산”은 정합성 요구와 함께 말해야 합니다.
- user-facing read-your-writes와 admin/reporting read는 요구가 다를 수 있습니다.

### Online Schema Migration

운영 DB schema 변경은 애플리케이션 배포와 호환성을 맞춰야 합니다.

기본 전략은 expand-migrate-contract입니다.

1. Expand: 새 column/table/index를 추가하되 기존 코드와 호환되게 둡니다.
2. Dual write/read compatibility: 새 코드가 기존/신규 schema를 모두 처리합니다.
3. Backfill: 기존 데이터를 작은 batch로 채웁니다.
4. Cutover: read path를 새 schema로 전환합니다.
5. Contract: 더 이상 쓰지 않는 column/index를 제거합니다.

주의:

- 큰 table에 index를 만들 때 lock, I/O, replication lag를 확인합니다.
- default 값이 있는 column 추가가 DB 버전에 따라 table rewrite를 유발할 수 있습니다.
- backfill은 작은 batch, sleep, checkpoint, 재시작 가능성을 고려합니다.
- rollback할 수 있도록 backward compatibility 기간을 둡니다.

### Statistics와 Cardinality 추정

Optimizer는 table 통계로 row 수와 selectivity를 추정해 plan을 고릅니다.

문제:

- 통계가 오래되면 잘못된 index나 join 순서를 고를 수 있습니다.
- 컬럼 간 상관관계가 크면 단일 컬럼 통계만으로 추정이 빗나갈 수 있습니다.
- skewed data는 평균 selectivity로 설명하기 어렵습니다.

대응:

- `ANALYZE` 등으로 통계를 갱신합니다.
- 실제 row와 예상 row 차이를 `EXPLAIN ANALYZE`로 확인합니다.
- 필요한 경우 composite index, extended statistics, query rewrite를 검토합니다.

### UUID, Sequence, Index Locality

Primary key는 단순 식별자 같지만 index locality와 분산성에 영향을 줍니다.

| 방식 | 장점 | 주의 |
| --- | --- | --- |
| Auto increment / Sequence | index locality 좋음, 작고 빠름 | 분산 생성 어려움, 예측 가능 |
| Random UUID | 분산 생성 쉬움 | B+Tree page split, index size 증가 |
| Time-ordered UUID/ULID | 대략적인 시간 순서와 분산 생성 | 시간 정보 노출, 구현/정렬 정책 확인 |
| Snowflake 계열 | 분산 unique ID와 시간 순서 | clock drift, worker id 관리 |

면접 포인트:

- 무조건 UUID가 좋은 것도, auto increment가 나쁜 것도 아닙니다.
- public identifier와 internal primary key를 분리할 수도 있습니다.
- 쓰기량이 많으면 random key의 index fragmentation과 cache locality를 봐야 합니다.
