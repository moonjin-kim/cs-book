# Database: 확장과 운영

← [Database 개요](README.md)

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
