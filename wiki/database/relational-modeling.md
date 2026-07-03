# Database: 관계형 모델과 정규화

← [Database 개요](README.md)

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
