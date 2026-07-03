# Database: 실행 계획과 쿼리 튜닝

← [Database 개요](README.md)

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
