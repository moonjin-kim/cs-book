# Database: 트랜잭션과 격리 수준

← [Database 개요](README.md)

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
