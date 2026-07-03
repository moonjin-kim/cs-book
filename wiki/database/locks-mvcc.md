# Database: Lock과 MVCC

← [Database 개요](README.md)

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
