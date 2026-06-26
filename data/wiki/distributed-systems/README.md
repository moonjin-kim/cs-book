# 분산시스템

분산시스템은 여러 노드가 네트워크로 협력할 때 실패가 부분적으로 발생한다는 사실을 전제로 설계합니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| CAP/PACELC | 네트워크 분할과 정상 상황에서 무엇을 희생할 것인가? |
| 일관성 모델 | strong consistency와 eventual consistency는 사용자 경험을 어떻게 바꾸는가? |
| 복제 | leader/follower, quorum, replica lag는 어떤 trade-off를 만드는가? |
| 파티셔닝/샤딩 | 데이터 분산 기준은 hot shard와 cross-shard transaction에 어떤 영향을 주는가? |
| 합의 | Raft/Paxos는 왜 필요하고 어떤 비용을 치르는가? |
| 멱등성/재시도 | timeout 이후 성공 여부를 모를 때 어떻게 안전하게 재시도하는가? |
| Bulkhead | 외부 서비스 장애가 전체 자원을 잠식하지 않게 하려면 어떻게 격리하는가? |
| Circuit Breaker | 장애가 지속되는 외부 호출을 언제 빠르게 실패시킬 것인가? |

## Strong Consistency와 Eventual Consistency

강한 일관성은 쓰기 연산이 완료된 직후 어느 노드에서 읽어도 최신 값을 보장합니다. 복제가 끝나기 전 읽기를 막거나 leader에서만 읽게 만들 수 있어 정합성은 높지만 가용성과 지연 시간이 희생됩니다.

최종적 일관성은 변경이 비동기로 전파되어 일시적으로 노드 간 데이터가 다를 수 있지만, 시간이 지나면 결국 같은 상태가 되는 모델입니다. 가용성은 높지만 오래된 데이터를 읽을 수 있습니다.

결제, 재고 차감처럼 최신성이 중요한 기능은 강한 일관성에 가깝게 설계하고, 추천 피드, 조회수처럼 약간 늦어도 되는 기능은 최종적 일관성을 선택할 수 있습니다.

## CAP 정리

CAP는 Consistency, Availability, Partition Tolerance의 약자입니다. 분산 시스템에서 네트워크 분할이 발생하면 모든 요청에 응답할지(AP), 일부 요청을 거부하더라도 일관성을 지킬지(CP)를 선택해야 합니다. 현실의 분산 시스템은 네트워크 분할을 완전히 배제하기 어렵기 때문에 CA만 만족하는 시스템은 실질적인 분산 시스템 선택지로 보기 어렵습니다.

CP 시스템은 partition 상황에서 일관성을 지키기 위해 일부 요청을 실패시키거나 대기시킵니다. AP 시스템은 요청 처리를 계속하지만 일시적 불일치를 허용하고, partition이 회복되면 동기화로 최종적 일관성을 맞춥니다.

## Event Sourcing과 CQRS

Event Sourcing은 현재 상태만 저장하지 않고 상태 변경 이벤트 이력을 append-only로 저장합니다. 이벤트를 순서대로 replay하면 특정 시점의 상태를 재현할 수 있어 감사, 디버깅, 과거 상태 복원에 유리합니다. 단점은 읽기 때 모든 이벤트를 재생하면 느려질 수 있고, 이를 완화하기 위해 snapshot과 projection을 둬야 한다는 점입니다.

CQRS는 command 모델과 query 모델을 분리하는 패턴입니다. 쓰기 모델은 도메인 규칙과 트랜잭션에 집중하고, 읽기 모델은 화면이나 조회 성능에 맞게 별도로 구성합니다. 읽기와 쓰기의 요구가 크게 다르거나 조회 모델이 복잡할 때 유용하지만, 모델 동기화와 최종적 일관성, 구현 복잡도가 늘어납니다.

## 외부 서비스 장애 대응

동기 방식으로 외부 API를 호출하면 외부 장애가 내부 thread, connection, queue를 점유해 전체 장애로 번질 수 있습니다.

기본 대응:

- connection timeout, read timeout, connection pool timeout 설정
- retry에는 max attempt, exponential backoff, jitter 적용
- 멱등하지 않은 요청은 idempotency key 없이 무작정 재시도하지 않음

Bulkhead는 기능 또는 외부 서비스별로 자원을 격리하는 패턴입니다. A, B, C 외부 API가 하나의 HTTP connection pool을 공유할 때 A 장애로 pool이 고갈되면 B, C 호출도 대기할 수 있습니다. 서비스별 connection pool과 thread pool을 분리하면 장애 전파를 줄일 수 있습니다.

Circuit breaker는 오류율이나 timeout이 기준을 넘으면 일정 시간 호출을 차단합니다. 빠른 실패로 응답 시간 증가와 처리량 감소를 줄이고, half-open 상태에서 회복 여부를 점검합니다.

## 비동기 연동과 Transactional Outbox

시스템 간 비동기 연동은 호출 시스템이 응답을 기다리지 않아 결합도와 응답 시간을 줄일 수 있습니다. 대표 방식은 메시징 시스템, DB polling, CDC입니다.

메시징 시스템은 Kafka나 RabbitMQ에 이벤트를 발행하고 다른 시스템이 소비합니다. 처리량과 확장성이 좋지만 메시지 유실, 중복, 순서, DB 변경과 메시지 발행의 원자성 문제가 생깁니다. DB polling은 메시지 테이블을 DB에 저장하고 다른 프로세스가 주기적으로 읽습니다. DB transaction에 포함할 수 있어 단순하지만 polling 지연, 삭제 정책, schema 변경 부담이 있습니다. CDC는 DB binlog 같은 변경 로그를 읽어 전파하므로 애플리케이션 변경이 적지만 "왜 바뀌었는가"라는 도메인 의도가 부족할 수 있습니다.

Transactional Outbox는 DB 변경과 outbox record 저장을 같은 transaction에 넣어 이중 쓰기 문제를 줄입니다. 이후 별도 relay가 outbox를 읽어 Kafka 같은 broker로 발행하고, 성공하면 발행 완료로 표시합니다. Consumer는 중복 발행 가능성을 전제로 idempotent하게 설계해야 합니다.

## SPOF와 HA

SPOF(Single Point of Failure)는 해당 구성 요소가 실패하면 전체 시스템이 중단되는 지점입니다. API 서버가 1대뿐이면 서버 장애가 곧 서비스 장애가 됩니다. DB master가 1대라도 failover가 자동화되어 있지 않으면 master 장애가 SPOF가 됩니다.

개선은 이중화, load balancer, health check, failover, replication으로 접근합니다. 다중 서버로 바꾸면 세션 불일치, 분산 락 필요성, 로그/메트릭 통합, 배포 전략, load balancing 알고리즘까지 함께 점검해야 합니다.

## 실무 판단

- 재시도는 장애 복구 수단이지만 폭주를 만들 수 있으므로 timeout, backoff, circuit breaker가 필요합니다.
- 분산 트랜잭션보다 outbox, saga, 멱등 consumer로 단순화할 수 있는지 먼저 봅니다.
- consistency 요구는 기능별로 다릅니다. 결제와 추천 피드는 같은 기준을 적용하면 안 됩니다.
