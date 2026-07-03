# Database: 페이징과 데이터 모델링

← [Database 개요](README.md)

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
