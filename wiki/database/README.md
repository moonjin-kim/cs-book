# Database

Database 면접은 **정확한 데이터를 안전하게 바꾸고 빠르게 읽기 위해 트랜잭션, 인덱스, 락, 실행 계획을 어떻게 이해하는지**가 핵심입니다.

이 문서는 Database 주제 전체를 한 페이지에서 읽되, 오른쪽 목차로 필요한 섹션을 빠르게 이동하는 구조입니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | 관계형 모델과 정규화 | 테이블, key, 제약 조건, 정규화가 데이터 이상 현상을 어떻게 줄이는가? |
| 2 | 트랜잭션과 격리 수준 | ACID, dirty/non-repeatable/phantom read, DB별 isolation 차이를 설명할 수 있는가? |
| 3 | Lock과 MVCC | shared/exclusive lock, MVCC snapshot, gap/next-key lock, deadlock을 연결해 설명할 수 있는가? |
| 4 | 인덱스 설계 | B+Tree, 복합 인덱스, covering index, cardinality/selectivity 기준으로 인덱스를 설계할 수 있는가? |
| 5 | 실행 계획과 쿼리 튜닝 | EXPLAIN에서 access type, rows, key, sort/temp, scan 범위를 보고 병목을 찾을 수 있는가? |
| 6 | 페이징과 데이터 모델링 | offset과 cursor paging, 정규화/역정규화, 삭제 전략의 trade-off를 설명할 수 있는가? |
| 7 | 확장과 운영 | replication, partitioning, sharding, connection pool, backup/restore를 운영 관점에서 설명할 수 있는가? |
| 8 | 심화 설계와 운영 패턴 | hot row, idempotency, outbox, online migration, read/write split 일관성 문제를 설명할 수 있는가? |
| 9 | 실전 면접 Q&A | 짧은 답변으로 트랜잭션, 인덱스, 락, 운영 질문을 빠르게 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| ACID | 트랜잭션이 안전하게 실행되기 위한 원자성, 일관성, 격리성, 지속성입니다. |
| 격리 수준 | 동시 트랜잭션이 서로의 변경을 얼마나 볼 수 있는지 정합니다. |
| MVCC | 여러 버전의 데이터를 유지해 읽기와 쓰기의 충돌을 줄입니다. |
| Lock | 동시에 같은 데이터를 바꿀 때 충돌을 제어하지만 대기와 deadlock을 만들 수 있습니다. |
| 인덱스 | 읽기 성능을 높이지만 쓰기 비용과 저장 공간을 늘립니다. |
| 실행 계획 | DB optimizer가 어떤 방식으로 데이터를 찾고 조인하는지 확인하는 도구입니다. |
| Replication | Primary 변경 로그를 Replica에 반영해 읽기 분산과 장애 대응을 합니다. |
| SARGable Query | 인덱스를 활용할 수 있도록 컬럼을 함수나 계산으로 감싸지 않는 조건식입니다. |
| Online Migration | expand-migrate-contract 순서로 서비스 중 schema/data 변경을 안전하게 적용합니다. |

## 면접 답변 프레임

Database 질문은 기능 이름보다 **정합성, 동시성, 비용, 운영 실패 모드**를 기준으로 답하면 좋습니다.

1. 정합성: 어떤 데이터 불변식을 지켜야 하는지 말합니다.
2. 동시성: isolation, lock, MVCC가 어떤 충돌을 막는지 설명합니다.
3. 비용: index, join, sort, scan, write amplification을 따집니다.
4. 관측: EXPLAIN, slow query log, lock wait, connection pool metric으로 확인합니다.
5. 운영: replication lag, backup/restore, schema migration, hot partition 같은 실패 모드를 붙입니다.

## 1. 관계형 모델과 정규화

### 관계형 모델

RDB는 데이터를 table, row, column, key, constraint로 표현합니다.

| 개념 | 의미 |
| --- | --- |
| Table | 같은 구조의 row 집합 |
| Row | 하나의 record |
| Column | 속성 |
| Primary Key | row를 식별하는 key |
| Foreign Key | 다른 table row와의 참조 관계 |
| Unique Constraint | 중복을 막는 제약 |
| Check Constraint | 값의 조건을 강제 |

면접 포인트:

- RDB는 단순 저장소가 아니라 제약 조건으로 데이터 정합성을 강제하는 시스템입니다.
- 애플리케이션 검증만으로는 동시 요청에서 race condition을 막기 어렵습니다.
- unique key, foreign key, transaction을 함께 써야 비즈니스 불변식을 안정적으로 지킬 수 있습니다.

### Key 설계

| key | 설명 |
| --- | --- |
| Candidate Key | row를 유일하게 식별할 수 있는 후보 |
| Primary Key | 대표 식별자로 선택한 candidate key |
| Alternate Key | primary key로 선택되지 않은 candidate key |
| Foreign Key | 다른 table의 key를 참조 |
| Surrogate Key | 의미 없는 대체 식별자, 보통 sequence/auto increment/UUID |
| Natural Key | 비즈니스 의미를 가진 식별자 |

Surrogate key와 natural key:

| 구분 | 장점 | 주의 |
| --- | --- | --- |
| Surrogate Key | 변경 가능성이 낮고 join key로 단순 | 비즈니스 중복은 unique constraint로 따로 막아야 함 |
| Natural Key | 도메인 의미가 명확 | 정책 변경 시 key 변경 비용이 큼 |

### 정규화

정규화는 중복과 이상 현상을 줄이기 위해 table을 분해하는 과정입니다.

| 단계 | 의미 |
| --- | --- |
| 1NF | 컬럼이 원자값 |
| 2NF | 부분 함수 종속 제거 |
| 3NF | 이행적 종속 제거 |
| BCNF | 모든 결정자가 후보키 |

정규화가 줄이는 이상 현상:

| 이상 현상 | 의미 |
| --- | --- |
| 삽입 이상 | 특정 정보가 없으면 다른 정보를 삽입하기 어려움 |
| 수정 이상 | 중복 데이터 일부만 수정되어 불일치 발생 |
| 삭제 이상 | 원치 않는 정보까지 함께 삭제 |

### 역정규화

역정규화는 조회 성능이나 운영 단순성을 위해 일부 중복을 허용하는 설계입니다.

적합한 상황:

- 조회가 매우 빈번하고 join 비용이 큽니다.
- reporting/read model이 command model과 다릅니다.
- 이벤트 기반 projection을 별도 table에 유지합니다.
- 최신성이 약간 늦어도 되는 화면입니다.

주의:

- 중복 데이터의 source of truth를 정해야 합니다.
- 동기/비동기 갱신 실패 시 불일치 복구 방법이 필요합니다.
- transaction 안에서 함께 갱신할지, outbox/eventual consistency로 갈지 결정해야 합니다.

## 2. 트랜잭션과 격리 수준

### ACID

| 속성 | 의미 | 실패 예 |
| --- | --- | --- |
| Atomicity | 모두 성공하거나 모두 실패 | 결제는 됐는데 주문 생성 실패 |
| Consistency | 제약 조건을 만족하는 상태로 전이 | 재고가 음수가 됨 |
| Isolation | 동시에 실행되어도 중간 상태를 침범하지 않음 | 두 요청이 같은 쿠폰을 중복 사용 |
| Durability | commit된 결과는 장애 후에도 보존 | commit 후 장애로 데이터 손실 |

트랜잭션은 여러 SQL을 하나로 묶는 문법이 아니라 **비즈니스 불변식을 보호하는 경계**입니다.

### 격리 수준

| 격리 수준 | 설명 | 발생 가능한 현상 |
| --- | --- | --- |
| READ UNCOMMITTED | 미커밋 데이터 읽기 가능 | dirty, non-repeatable, phantom |
| READ COMMITTED | 커밋된 데이터만 읽음 | non-repeatable, phantom |
| REPEATABLE READ | 같은 row 재조회 결과 보장 | 표준상 phantom 가능 |
| SERIALIZABLE | 직렬 실행처럼 보장 | 성능 저하, retry 필요 가능 |

이상 현상:

| 현상 | 의미 |
| --- | --- |
| Dirty Read | 커밋되지 않은 데이터를 읽음 |
| Non-repeatable Read | 같은 row를 다시 읽었을 때 값이 바뀜 |
| Phantom Read | 같은 조건의 범위 조회에서 row 집합이 바뀜 |
| Serialization Anomaly | 성공한 트랜잭션들의 결과가 어떤 직렬 순서와도 맞지 않음 |

DB별 주의:

- PostgreSQL은 `READ UNCOMMITTED`를 요청해도 내부적으로 `READ COMMITTED`처럼 동작합니다.
- PostgreSQL `REPEATABLE READ`는 snapshot isolation 기반이라 phantom read를 허용하지 않는 강한 동작을 제공합니다.
- MySQL InnoDB는 `REPEATABLE READ`가 기본이고 next-key lock으로 일부 phantom을 막습니다.
- SQL 표준의 격리 수준 이름만 외우면 실제 DB 동작 차이를 놓칠 수 있습니다.

### Read Committed vs Repeatable Read

| 구분 | Read Committed | Repeatable Read |
| --- | --- | --- |
| snapshot 기준 | statement마다 새 snapshot | transaction 시작 snapshot |
| 같은 row 반복 조회 | 바뀔 수 있음 | 보통 안정적 |
| 최신 데이터 반영 | 비교적 잘 보임 | transaction 중에는 늦게 보임 |
| 충돌 처리 | 단순하고 빠름 | serialization failure나 lock wait 가능 |

실무 기준:

- 단순 CRUD와 최신성 중심이면 `READ COMMITTED`가 실용적인 경우가 많습니다.
- 같은 transaction 안에서 읽은 기준으로 복잡한 불변식을 검증하려면 더 강한 격리나 명시적 lock이 필요할 수 있습니다.
- 격리 수준을 올려도 모든 비즈니스 race condition이 자동으로 사라지지는 않습니다.

### Write Skew와 Lost Update

| 문제 | 의미 | 대응 |
| --- | --- | --- |
| Lost Update | 두 transaction이 같은 값을 읽고 각각 덮어써 한 변경이 사라짐 | row lock, optimistic version, atomic update |
| Write Skew | 서로 다른 row를 읽고 다른 row를 갱신해 전체 제약이 깨짐 | serializable, predicate lock, constraint, explicit lock |

예:

```sql
UPDATE product
SET stock = stock - 1
WHERE id = ? AND stock > 0;
```

이런 조건부 update는 read 후 update보다 race condition을 줄이기 쉽습니다.

## 3. Lock과 MVCC

### Lock 기본

| Lock | 설명 |
| --- | --- |
| Shared Lock | 읽기 락, 다른 shared lock과 공존 가능 |
| Exclusive Lock | 쓰기 락, 다른 lock과 공존 불가 |
| Row Lock | 특정 row에 대한 lock |
| Table Lock | table 전체에 대한 lock |
| Metadata Lock | schema/object metadata 변경과 query의 충돌 제어 |

주의:

- lock은 정합성을 지키지만 대기와 deadlock을 만들 수 있습니다.
- lock 범위는 query 조건과 index 사용 여부에 따라 커질 수 있습니다.
- index가 없으면 의도보다 많은 row나 range를 잠글 수 있습니다.

### 낙관적 락 vs 비관적 락

| 구분 | 낙관적 락 | 비관적 락 |
| --- | --- | --- |
| 가정 | 충돌이 드묾 | 충돌이 잦음 |
| 방식 | version으로 수정 시점 검증 | 먼저 DB lock 획득 |
| 장점 | lock 점유 적음 | 강한 정합성 |
| 단점 | 재시도 필요 | 대기, deadlock 가능 |
| 예 | `version` column | `SELECT ... FOR UPDATE` |

선택 기준:

- 읽기 많고 충돌이 낮으면 낙관적 락이 유리합니다.
- 좌석 예약, 재고 차감처럼 충돌이 높고 실패 비용이 크면 비관적 락이나 조건부 update를 검토합니다.

### MVCC

MVCC는 데이터의 여러 버전을 유지해 transaction마다 일관된 snapshot을 보게 합니다.

장점:

- 읽기가 쓰기를 덜 막습니다.
- 쓰기가 읽기를 덜 막습니다.
- long-running read도 자신의 snapshot을 유지할 수 있습니다.

주의:

- 오래 열린 transaction은 이전 version 정리를 막아 undo/vacuum 부담을 키울 수 있습니다.
- snapshot 기준을 이해해야 격리 수준 동작을 설명할 수 있습니다.
- MVCC가 있어도 쓰기-쓰기 충돌은 lock, retry, abort로 다뤄야 합니다.

### Gap Lock과 Next-Key Lock

InnoDB에서 range 조건을 잠글 때 record뿐 아니라 record 사이 공간까지 잠글 수 있습니다.

| 개념 | 설명 |
| --- | --- |
| Record Lock | index record 자체를 잠금 |
| Gap Lock | index record 사이의 빈 공간을 잠금 |
| Next-Key Lock | record lock + gap lock |

목적:

- 범위 조건에서 phantom insert를 막습니다.
- `SELECT ... FOR UPDATE` 범위 조회에서 다른 transaction의 삽입을 막을 수 있습니다.

주의:

- gap lock은 index 기반으로 동작하므로 적절한 index가 없으면 lock 범위가 커질 수 있습니다.
- MySQL/InnoDB와 PostgreSQL은 phantom 방지 방식이 다르므로 DB 제품별 동작을 확인해야 합니다.

### Deadlock과 Lock Wait

| 문제 | 의미 | 대응 |
| --- | --- | --- |
| Lock Wait | 다른 transaction의 lock 해제를 기다림 | timeout, query/index 개선, transaction 축소 |
| Deadlock | 서로가 가진 lock을 기다리며 순환 대기 | 한쪽 rollback, lock 순서 통일 |

운영에서 확인할 것:

- 어떤 SQL이 lock을 잡았는가
- 어떤 transaction이 오래 열려 있는가
- index 부재로 scan/lock 범위가 커졌는가
- application transaction 안에 외부 API 호출이 있는가

## 4. 인덱스 설계

### B-Tree vs B+Tree

| 구분 | B-Tree | B+Tree |
| --- | --- | --- |
| 값 저장 | 내부/리프 노드 모두 가능 | 리프 노드 중심 |
| 검색 종료 | 내부 노드에서 끝날 수 있음 | 보통 리프까지 이동 |
| 범위 검색 | 상대적으로 불리 | 리프 연결로 유리 |
| DB 인덱스 적합성 | 낮음 | 높음 |

DB index는 보통 B+Tree 계열 구조를 사용해 equality, range, order by에 대응합니다.

### 인덱스 종류

| 구분 | 설명 |
| --- | --- |
| Primary Index | primary key 기반 index |
| Clustered Index | 실제 데이터가 index key 순서와 강하게 연결됨 |
| Secondary Index | primary/row locator를 통해 실제 row를 찾음 |
| Unique Index | 중복을 막고 조회를 빠르게 함 |
| Covering Index | query에 필요한 column이 모두 index에 있어 table 접근을 줄임 |
| Partial/Filtered Index | 조건에 맞는 일부 row만 index화 |
| Functional/Expression Index | expression 결과를 index화 |

주의:

- DB 제품마다 지원하는 index 종류와 이름이 다릅니다.
- MySQL InnoDB secondary index는 primary key 값을 함께 저장하므로 primary key 크기가 secondary index 비용에 영향을 줍니다.
- PostgreSQL은 partial index, expression index 등 다양한 index 전략을 제공합니다.

### 복합 인덱스

복합 인덱스는 column 순서가 중요합니다.

```sql
CREATE INDEX idx_orders_user_status_created
ON orders (user_id, status, created_at);
```

설계 기준:

1. 자주 함께 쓰는 where/order by 패턴을 봅니다.
2. 동등 조건 column을 앞에 둡니다.
3. range 조건 이후 column은 index 활용이 제한될 수 있습니다.
4. 정렬 방향과 order by column을 함께 고려합니다.
5. covering index가 필요한지 판단합니다.

예:

```sql
WHERE user_id = ?
  AND status = ?
  AND created_at >= ?
ORDER BY created_at DESC
```

위 패턴은 `(user_id, status, created_at)` 순서가 자연스럽습니다.

### Cardinality와 Selectivity

| 개념 | 의미 |
| --- | --- |
| Cardinality | column 값의 다양성 |
| Selectivity | 조건으로 걸러지는 비율 |

면접 포인트:

- cardinality가 높고 selectivity가 좋은 column은 index 효율이 좋습니다.
- boolean처럼 값 종류가 적은 column도 다른 조건과 결합하면 유용할 수 있습니다.
- 통계 정보가 오래되면 optimizer가 잘못된 plan을 고를 수 있습니다.

### 인덱스가 안 타는 흔한 경우

| 패턴 | 이유 | 대안 |
| --- | --- | --- |
| indexed column에 function 적용 | index key와 비교 불가 | expression index 또는 값 전처리 |
| leading wildcard `LIKE '%abc'` | prefix 탐색 불가 | full-text index, search engine |
| type mismatch | implicit cast로 index 사용 제한 | parameter type 맞춤 |
| 부정 조건 `!=`, `NOT IN` | 선택도 낮을 수 있음 | 조건 재설계 |
| 낮은 선택도 | scan이 더 저렴할 수 있음 | 복합 index 검토 |

## 5. 실행 계획과 쿼리 튜닝

### EXPLAIN에서 볼 것

MySQL 기준:

| 항목 | 봐야 할 것 |
| --- | --- |
| `type` | 접근 방식. `ALL`이면 full scan입니다. |
| `possible_keys` | 사용 가능했던 index 후보입니다. |
| `key` | 실제 선택된 index입니다. |
| `rows` | 예상 스캔 row 수입니다. |
| `filtered` | 조건 적용 후 남을 row 비율입니다. |
| `Extra` | `Using filesort`, `Using temporary`, `Using index` 등을 확인합니다. |

PostgreSQL 기준:

| 항목 | 봐야 할 것 |
| --- | --- |
| Seq Scan | table sequential scan |
| Index Scan | index로 찾고 table row 접근 |
| Index Only Scan | index만으로 결과 반환 가능 |
| Bitmap Index/Heap Scan | 여러 조건을 bitmap으로 묶어 heap 접근 |
| Nested Loop | outer row마다 inner 탐색 |
| Hash Join | hash table 기반 join |
| Sort | 정렬 비용 |

### EXPLAIN ANALYZE

`EXPLAIN`은 예상 계획이고, `EXPLAIN ANALYZE`는 실제 실행까지 하며 실제 row/time을 보여줍니다.

주의:

- `EXPLAIN ANALYZE`는 실제 query를 실행합니다.
- `INSERT`, `UPDATE`, `DELETE`에 쓰면 실제 변경이 일어날 수 있으므로 transaction rollback 등 안전장치가 필요합니다.
- 예상 row와 실제 row 차이가 크면 통계 정보, 조건 상관관계, parameter 분포를 의심합니다.

### 느린 쿼리 개선 순서

1. query 목적과 반환 row 수를 확인합니다.
2. EXPLAIN으로 scan 범위, join 순서, sort/temp 여부를 봅니다.
3. where/order by/join column의 index를 확인합니다.
4. 필요한 column만 조회하도록 projection을 줄입니다.
5. offset paging, N+1, 불필요한 join을 제거합니다.
6. 통계 갱신과 execution plan 변화 여부를 확인합니다.
7. 그래도 어렵다면 schema, denormalization, read model을 검토합니다.

### Join 전략

| 전략 | 의미 | 적합한 상황 |
| --- | --- | --- |
| Nested Loop | outer row마다 inner를 탐색 | outer가 작고 inner index가 좋을 때 |
| Hash Join | 한쪽을 hash table로 만들고 probe | 대량 equi-join |
| Merge Join | 정렬된 양쪽 입력을 병합 | 양쪽이 정렬돼 있거나 range join |

주의:

- MySQL/PostgreSQL의 optimizer와 지원 전략은 다릅니다.
- join column index가 없으면 nested loop가 매우 비싸질 수 있습니다.
- cardinality 추정 오류는 join 순서와 전략 선택을 망가뜨립니다.

## 6. 페이징과 데이터 모델링

### Offset Paging

```sql
SELECT *
FROM posts
ORDER BY id
LIMIT 20 OFFSET 100000;
```

문제:

- 뒤 페이지로 갈수록 건너뛸 row가 많아집니다.
- 대량 데이터에서 latency가 증가합니다.
- 중간에 insert/delete가 일어나면 중복/누락이 생길 수 있습니다.

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
- index를 활용하기 쉽습니다.
- 무한 스크롤, feed, log 조회에 적합합니다.

단점:

- 임의 페이지 이동이 어렵습니다.
- 정렬 기준이 unique하고 안정적이어야 합니다.
- 복합 정렬이면 cursor 조건도 복합으로 만들어야 합니다.

### 삭제 전략

| 구분 | 설명 | 주의 |
| --- | --- | --- |
| 물리 삭제 | row를 실제 삭제 | 복구 어려움 |
| 논리 삭제 | `deleted_at` 등으로 삭제 표시 | 조회 조건 누락, table/index 비대화 |
| Archive | 오래된 데이터를 별도 table/storage로 이동 | 조회 경로와 복구 절차 필요 |

논리 삭제 주의:

- 모든 unique constraint가 논리 삭제 row와 충돌할 수 있습니다.
- partial index 또는 composite unique key로 정책을 명확히 해야 합니다.
- 오래된 삭제 row 정리 정책이 없으면 table bloat와 index 비용이 커집니다.

### 데이터 타입 선택

| 타입 선택 | 주의 |
| --- | --- |
| `DECIMAL` | 금액처럼 정확한 10진 계산에 적합 |
| `FLOAT/DOUBLE` | 근사값이라 금액에 부적합 |
| `VARCHAR` | 길이와 collation이 index 비용에 영향 |
| `TEXT/BLOB` | 큰 값은 row/page/cache 효율에 영향 |
| `TIMESTAMP` | timezone 저장/표현 정책 확인 |
| UUID | 분산 ID에 유리하지만 random UUID는 index locality에 불리 |

## 7. 확장과 운영

### Replication

| 방식 | 특징 |
| --- | --- |
| Statement-based | SQL 문장 기록, 작지만 비결정적 SQL에 취약 |
| Row-based | 변경된 row 기록, 정확하지만 log가 커질 수 있음 |
| Mixed | 상황별 혼합 |
| Physical replication | storage/WAL 단위 복제 |
| Logical replication | logical change 단위 복제 |

활용:

- 읽기 분산
- 장애 복구
- 백업
- 분석/검색 pipeline

주의:

- replica lag가 발생할 수 있습니다.
- 쓰기 직후 read replica에서 읽으면 최신 데이터가 안 보일 수 있습니다.
- read-your-writes가 필요하면 primary read, session consistency, lag 감지 전략이 필요합니다.

### Partitioning vs Sharding

| 구분 | 설명 |
| --- | --- |
| Partitioning | 하나의 DB 논리/서버 안에서 table을 나눔 |
| Sharding | 여러 DB 인스턴스에 데이터를 나눔 |

Partitioning 장점:

- 오래된 partition archive/drop이 쉬워집니다.
- partition pruning으로 일부 query가 빨라질 수 있습니다.
- table 관리 단위를 줄일 수 있습니다.

Sharding 주의점:

- shard key 선택이 중요합니다.
- cross-shard join이 어렵습니다.
- 분산 transaction과 global unique key가 어려워집니다.
- resharding 비용이 큽니다.
- hot shard가 생기면 수평 확장 효과가 줄어듭니다.

### RDB vs NoSQL

| 구분 | RDB | NoSQL |
| --- | --- | --- |
| Schema | 명확하고 제약 강함 | 유연 |
| Query | SQL, join 강함 | 모델별 API |
| Transaction | 강함 | 제품별 차이 |
| 확장 | 수직 확장과 read replica 중심 | 수평 확장 유리한 제품 많음 |
| 적합 | 정합성 중요한 업무 | 대규모 분산, 유연한 구조 |

NoSQL 유형:

| 유형 | 예시 | 사용 |
| --- | --- | --- |
| Key-Value | Redis, DynamoDB | 캐시, 세션 |
| Document | MongoDB | 프로필, 콘텐츠 |
| Column-family | Cassandra | 로그, 분석 |
| Graph | Neo4j | 관계 탐색 |
| Time-series | Prometheus, InfluxDB | 메트릭 |

### Connection Pool

Connection Pool은 DB 연결을 미리 만들고 재사용합니다.

장점:

- 연결 생성 비용 감소
- DB 최대 연결 초과 방지
- 요청 처리 지연 감소
- 장애 상황에서 대기/실패 경계를 만들 수 있음

설정 포인트:

| 항목 | 의미 |
| --- | --- |
| max pool size | 동시에 빌릴 수 있는 connection 수 |
| minimum idle | 미리 유지할 idle connection |
| connection timeout | connection을 못 빌릴 때 기다리는 시간 |
| idle timeout | idle connection 정리 시간 |
| max lifetime | connection 최대 생존 시간 |

주의:

- application thread pool보다 DB connection pool이 너무 작으면 많은 요청이 connection 대기합니다.
- DB가 처리할 수 있는 connection 수보다 pool을 크게 잡으면 DB 자체가 병목이 됩니다.
- slow query는 connection 점유 시간을 늘려 pool 고갈을 유발합니다.

### Backup, Restore, Migration

운영 DB에서 중요한 것은 backup 자체보다 **복구 가능한 backup인지 검증하는 것**입니다.

| 개념 | 의미 |
| --- | --- |
| RPO | 어느 시점까지의 데이터 손실을 허용하는가 |
| RTO | 얼마나 빨리 복구해야 하는가 |
| PITR | 특정 시점으로 복구 |
| Online migration | 서비스 중 schema/data 변경 |

주의:

- backup은 주기적으로 restore drill을 해야 의미가 있습니다.
- schema migration은 backward/forward compatibility를 고려합니다.
- 큰 table의 column 추가, index 생성, data backfill은 lock과 I/O를 확인해야 합니다.

### Statement vs PreparedStatement

| 구분 | Statement | PreparedStatement |
| --- | --- | --- |
| SQL 구성 | 문자열 직접 조합 | placeholder binding |
| SQL Injection | 취약 | 안전 |
| 반복 실행 | 매번 parsing 가능 | plan 재사용 가능 |

API 입력값은 `PreparedStatement`로 바인딩하는 것이 기본입니다.

## 8. 심화 설계와 운영 패턴

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

## 9. 실전 면접 Q&A

### 트랜잭션 / 격리

| 질문 | 답변 핵심 |
| --- | --- |
| ACID를 설명하라 | 원자성, 일관성, 격리성, 지속성으로 안전한 transaction 실행을 보장하는 성질입니다. |
| READ COMMITTED와 REPEATABLE READ 차이는? | snapshot 기준이 statement인지 transaction인지가 핵심입니다. |
| Phantom Read란? | 같은 조건의 범위 조회를 반복했을 때 row 집합이 달라지는 현상입니다. |
| 격리 수준을 SERIALIZABLE로 올리면 끝인가? | 정합성은 강해지지만 retry, 성능 비용, lock/serialization failure를 설계해야 합니다. |
| Lost Update를 어떻게 막나? | atomic update, row lock, optimistic version, unique constraint 등을 사용합니다. |

### Lock / MVCC

| 질문 | 답변 핵심 |
| --- | --- |
| MVCC의 장점은? | snapshot을 통해 읽기와 쓰기의 충돌을 줄이고 동시성을 높입니다. |
| 오래 열린 transaction이 위험한 이유는? | 이전 version 정리를 막고 vacuum/undo 부담, lock 점유, connection 점유를 유발합니다. |
| Gap Lock과 Next-Key Lock은 왜 필요한가? | range 조건에서 phantom insert를 막기 위해 record 사이 공간까지 잠급니다. |
| Deadlock을 줄이는 방법은? | lock 획득 순서를 통일하고 transaction을 짧게 유지하며 적절한 index를 둡니다. |

### 인덱스 / 실행 계획

| 질문 | 답변 핵심 |
| --- | --- |
| 인덱스는 왜 쓰기 성능을 낮추나? | insert/update/delete 때 index도 함께 갱신해야 하고 저장 공간도 늘어납니다. |
| 복합 인덱스 column 순서는 어떻게 정하나? | 실제 query의 equality, range, order by, covering 여부를 함께 봅니다. |
| Covering Index란? | query에 필요한 column이 모두 index에 있어 table row 접근을 줄이는 index입니다. |
| EXPLAIN에서 무엇을 보나? | access type, 선택 index, 예상 row, sort/temp, join strategy를 봅니다. |
| EXPLAIN ANALYZE 주의점은? | 실제 query를 실행하므로 변경 query에는 rollback 같은 안전장치가 필요합니다. |

### 운영 / 확장

| 질문 | 답변 핵심 |
| --- | --- |
| Offset paging이 느린 이유는? | 뒤 페이지로 갈수록 많은 row를 읽고 버려야 하기 때문입니다. |
| Replication lag 문제는? | 쓰기 직후 replica read에서 최신 데이터가 안 보일 수 있습니다. |
| Partitioning과 Sharding 차이는? | partitioning은 한 DB 안의 table 분할, sharding은 여러 DB 인스턴스 분산입니다. |
| Connection Pool 크기는 어떻게 잡나? | application thread, DB 처리량, query latency, timeout을 함께 측정해 조정합니다. |
| RDB와 NoSQL 선택 기준은? | 강한 정합성/복잡한 query는 RDB, 유연한 모델/수평 확장 요구는 NoSQL을 검토합니다. |

## 참고한 공식 문서

- PostgreSQL Transaction Isolation: https://www.postgresql.org/docs/current/transaction-iso.html
- PostgreSQL MVCC Introduction: https://www.postgresql.org/docs/current/mvcc-intro.html
- PostgreSQL Using EXPLAIN: https://www.postgresql.org/docs/current/using-explain.html
- PostgreSQL Indexes: https://www.postgresql.org/docs/current/indexes.html
- PostgreSQL Table Partitioning: https://www.postgresql.org/docs/current/ddl-partitioning.html
- MySQL 8.4 InnoDB Locking: https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html
- MySQL 8.4 InnoDB Transaction Isolation Levels: https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html
- MySQL 8.4 EXPLAIN Output Format: https://dev.mysql.com/doc/refman/8.4/en/explain-output.html
