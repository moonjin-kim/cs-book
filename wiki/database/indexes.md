# Database: 인덱스 설계

← [Database 개요](README.md)

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
