# Database

Database는 "정확한 데이터를 빠르게 읽고 안전하게 바꾸는 방법"을 다룹니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| 관계형 모델 | 기본키, 외래키, 제약 조건은 데이터 무결성을 어떻게 지키는가? |
| 정규화 | 중복 제거와 조회 성능 사이의 균형을 어떻게 잡는가? |
| 트랜잭션 | ACID는 각각 어떤 장애나 동시성 문제를 막는가? |
| 격리 수준 | dirty read, non-repeatable read, phantom read는 무엇인가? |
| 인덱스/실행 계획 | optimizer는 어떤 기준으로 full scan과 index scan을 고르는가? |
| Lock/MVCC | 읽기와 쓰기를 동시에 처리하면서 일관성을 어떻게 유지하는가? |

## 실무 판단

- 인덱스는 쓰기 비용과 저장 공간을 늘립니다.
- 트랜잭션 범위가 길면 lock 대기와 deadlock 가능성이 커집니다.
- 캐시는 DB 병목을 숨길 수 있지만 일관성 문제를 새로 만듭니다.

## ACID와 격리 수준

ACID는 트랜잭션이 안전하게 수행되기 위한 네 가지 성질입니다.

| 속성 | 의미 |
| --- | --- |
| Atomicity | 전체 성공 또는 전체 실패만 허용 |
| Consistency | 제약 조건을 만족하는 일관된 상태로 전이 |
| Isolation | 동시에 실행되는 트랜잭션이 서로 중간 상태를 침범하지 않음 |
| Durability | 성공한 변경은 장애 이후에도 보존 |

격리 수준은 정합성과 동시성의 trade-off입니다.

| 격리 수준 | 특징 | 발생 가능한 이상 현상 |
| --- | --- | --- |
| READ UNCOMMITTED | 미커밋 변경 읽기 허용 | dirty, non-repeatable, phantom |
| READ COMMITTED | 커밋된 데이터만 읽음 | non-repeatable, phantom |
| REPEATABLE READ | 같은 row 재조회 결과 보장 | 표준상 phantom 가능 |
| SERIALIZABLE | 트랜잭션을 직렬 실행한 것처럼 보장 | 성능 저하, lock 증가 |

Dirty read는 커밋되지 않은 데이터를 읽는 현상입니다. Non-repeatable read는 같은 row를 다시 읽었을 때 값이 바뀌는 현상입니다. Phantom read는 같은 조건의 범위 쿼리를 다시 실행했을 때 새 row가 나타나는 현상입니다.

## MVCC와 Lock 기반 제어

MVCC는 데이터의 여러 버전을 유지해 트랜잭션마다 일관된 snapshot을 제공합니다. 읽기는 시작 시점 snapshot을 보므로 쓰기에 막히지 않고, 쓰기는 새 버전을 만들어 읽기를 막지 않습니다. InnoDB는 undo log와 transaction id로 가시성을 판단합니다. 오래 살아 있는 트랜잭션은 undo log 정리를 막아 성능 저하를 만들 수 있습니다.

Lock 기반 제어는 데이터 접근 시 shared lock 또는 exclusive lock을 잡아 일관성을 직접 보장합니다. 읽기는 공유 락, 쓰기는 배타 락을 사용합니다.

| Lock | 설명 |
| --- | --- |
| Shared Lock | 다른 shared lock은 가능하지만 exclusive lock은 불가 |
| Exclusive Lock | 다른 shared/exclusive lock 모두 불가 |

낙관적 락은 충돌이 드물다고 보고 version 컬럼 등으로 수정 시점에 충돌을 검증합니다. 비관적 락은 충돌이 많다고 보고 먼저 DB lock을 잡아 다른 트랜잭션 접근을 막습니다. 조회가 많고 충돌이 낮으면 낙관적 락, 정합성이 중요하고 충돌이 잦으면 비관적 락이 유리합니다.

Deadlock은 두 트랜잭션이 서로 가진 lock을 기다리는 상태입니다. lock 획득 순서를 일관되게 하거나 lock timeout을 설정해 완화합니다.

## Gap Lock과 Next-Key Lock

Gap lock은 인덱스 record 사이의 공간을 잠가 새 record 삽입을 막습니다. Next-key lock은 record lock과 gap lock을 결합한 형태입니다. InnoDB는 `REPEATABLE READ`에서 범위 조건의 phantom read를 막기 위해 next-key lock을 사용할 수 있습니다.

예를 들어 `SELECT ... WHERE amount BETWEEN 100 AND 200 FOR UPDATE`는 해당 범위의 record와 gap을 잠가 다른 트랜잭션이 범위 안에 새 row를 삽입하지 못하게 합니다.

## B-Tree와 B+Tree 인덱스

B-Tree와 B+Tree는 모두 self-balancing tree입니다. DB 인덱스에는 일반적으로 B+Tree가 유리합니다.

| 구분 | B-Tree | B+Tree |
| --- | --- | --- |
| 값 저장 | 내부/리프 노드 모두 값 또는 record pointer 저장 | 리프 노드에만 실제 값 저장 |
| 검색 종료 | 내부 노드에서 끝날 수 있음 | 항상 리프까지 내려감 |
| 범위 검색 | 상대적으로 불리 | 리프 노드 연결 리스트로 유리 |
| 내부 노드 | 값도 저장해 상대적으로 무거움 | key만 저장해 fan-out이 큼 |

B+Tree는 내부 노드가 가벼워 tree height가 낮고, leaf가 연결되어 range scan과 정렬 순회에 강합니다.

## 클러스터형, 비클러스터형, 커버링 인덱스

클러스터형 인덱스는 실제 데이터가 인덱스 key 순서로 저장됩니다. InnoDB는 primary key를 clustered index로 사용하며, leaf node가 row 자체입니다. 한 테이블에 물리적 정렬은 하나뿐이므로 clustered index도 하나입니다.

비클러스터형 인덱스는 index key와 실제 row를 찾기 위한 pointer를 저장합니다. InnoDB secondary index의 leaf에는 primary key 값이 저장되므로, secondary index로 찾은 뒤 다시 clustered index를 탐색하는 이중 탐색이 발생할 수 있습니다.

커버링 인덱스는 쿼리에 필요한 모든 컬럼이 인덱스 안에 있어 테이블 접근 없이 결과를 반환합니다. MySQL `EXPLAIN`에서 `Using index`가 보이면 covering index가 활용된 것입니다. 다만 인덱스 크기와 쓰기 비용이 증가하므로 중요한 쿼리에 한정해 설계합니다.

## EXPLAIN과 인덱스 설계

MySQL `EXPLAIN`에서 주로 확인할 항목은 다음과 같습니다.

| 항목 | 의미 |
| --- | --- |
| type | 접근 방식. `ALL`은 full table scan이라 개선 여지 큼 |
| possible_keys/key | 후보 인덱스와 실제 사용 인덱스 |
| rows | 옵티마이저의 스캔 예상 행 수 |
| Extra | `Using index`, `Using filesort`, `Using temporary`, `Using where` 등 |

카디널리티는 컬럼의 고유 값 개수입니다. 선택도는 `조건을 만족하는 행 수 / 전체 행 수`입니다. 고카디널리티, 낮은 선택도 컬럼은 인덱스 효율이 좋습니다. 복합 인덱스는 자주 동등 비교되고 선택도가 좋은 컬럼을 앞에 두는 것이 일반적입니다.

MySQL scan 방식:

- Index Range Scan: 범위가 결정된 인덱스를 seek 후 필요한 만큼 scan
- Index Full Scan: 인덱스를 처음부터 끝까지 읽음
- Loose Index Scan: group by, min, max 등에 대해 필요한 key만 듬성듬성 읽음

## Query 최적화 패턴

`NOT IN`은 부정 조건이라 full scan이나 index full scan을 유발하기 쉽고, `NULL`이 포함되면 예상치 못한 빈 결과를 만들 수 있습니다. 대규모 데이터에서는 `NOT EXISTS` 또는 `LEFT JOIN ... IS NULL` 패턴을 검토합니다.

LIMIT/OFFSET paging은 뒤 페이지로 갈수록 OFFSET만큼 row를 읽고 버려야 하므로 느려집니다. 이전 페이지의 마지막 정렬 key를 기준으로 다음 페이지를 조회하는 keyset pagination이 더 안정적입니다.

```sql
SELECT *
FROM subscribe
WHERE (deleted_at = ? AND id > ?)
   OR (deleted_at > ? AND deleted_at < ?)
ORDER BY deleted_at, id
LIMIT 10;
```

## 정규화, 역정규화, 삭제 전략

정규화는 중복을 줄이고 삽입/갱신/삭제 이상을 줄이는 과정입니다.

| 단계 | 의미 |
| --- | --- |
| 1NF | 컬럼이 원자값을 가짐 |
| 2NF | 기본키 일부에만 종속된 속성 제거 |
| 3NF | 이행적 종속 제거 |
| BCNF | 모든 결정자가 후보키가 되도록 분해 |

역정규화는 읽기 성능을 위해 중복을 허용하는 전략입니다. 예를 들어 게시글 좋아요 수를 별도 컬럼에 저장할 수 있습니다. 대신 일관성 유지 로직이 필요합니다.

물리 삭제는 row를 실제 삭제하고, 논리 삭제는 `deleted_at` 같은 컬럼으로 삭제 상태를 표시합니다. 논리 삭제는 복구와 이력 활용이 쉽지만, 조회 조건 누락과 테이블 비대화에 주의해야 합니다.

외래 키는 DB 수준 참조 무결성을 보장하지만, 쓰기 검증 비용과 lock 경합, 스키마 변경 경직성, 샤딩 한계가 있습니다. 대규모 샤딩 환경에서는 애플리케이션에서 무결성을 관리하기도 합니다.

## Replication, Partitioning, Sharding

Replication은 source의 binary log를 replica가 relay log로 받아 적용하는 방식입니다.

| Binary Log 방식 | 특징 |
| --- | --- |
| Row | 행 변경 전후를 기록해 일관성이 높지만 log가 큼 |
| Statement | SQL 문장을 기록해 log가 작지만 비결정적 SQL에 취약 |
| Mixed | 상황에 따라 row/statement 혼합 |

Partitioning은 하나의 DB 서버 안에서 테이블을 여러 조각으로 나눕니다. Sharding은 여러 DB 인스턴스에 데이터를 분산합니다. Sharding은 scale-out에 유리하지만 cross-shard join, 분산 트랜잭션, resharding, shard key 선택이 어려워집니다.

## RDB와 NoSQL

RDB는 고정 schema, SQL, join, transaction, 무결성에 강합니다. 구조가 안정적이고 정합성이 중요한 업무에 적합합니다. NoSQL은 유연한 schema와 수평 확장에 유리하지만 중복과 eventual consistency를 감수하는 경우가 많습니다.

NoSQL 유형:

| 유형 | 예시 | 활용 |
| --- | --- | --- |
| Key-value | Redis, DynamoDB | cache, session, ranking |
| Document | MongoDB, CouchDB | profile, content, 채팅 메시지 |
| Column-family | Cassandra, HBase | 대규모 로그, 분석 |
| Graph | Neo4j, Neptune | 관계 탐색, 추천 |
| Time-series | InfluxDB, Prometheus | metric, IoT, 금융 시계열 |

실시간 채팅은 Redis Pub/Sub이나 Stream으로 낮은 지연 전송을 처리하고, 영구 저장은 MongoDB 같은 document DB로 확장성과 유연성을 확보하는 구성을 고려할 수 있습니다.

## Connection Pool

Connection pool이 없으면 요청마다 DB connection 생성, TCP socket 생성, 인증, 종료 비용을 반복합니다. 동시에 많은 요청이 들어오면 DB 최대 연결 수를 초과할 수 있습니다.

Connection pool은 미리 만든 connection을 재사용합니다. 주요 설정은 initial/min/max pool size, connection timeout입니다. pool size는 thread pool과 함께 봐야 합니다. connection이 thread보다 너무 많으면 낭비이고, 너무 적으면 thread가 connection 반환을 기다립니다.

## Statement와 PreparedStatement

`Statement`는 SQL 문자열을 직접 구성해 SQL injection에 취약합니다. `PreparedStatement`는 placeholder에 값을 binding하므로 query 구조와 값이 분리됩니다. 반복 실행 시 parse/plan 재사용 이점도 있습니다.
