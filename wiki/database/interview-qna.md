# Database: 실전 면접 Q&A

← [Database 개요](README.md)

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
