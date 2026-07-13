# 분산시스템

분산시스템 면접은 **여러 노드가 네트워크로 협력할 때 생기는 실패, 지연, 부분 장애, 일관성, 중복 처리, 순서 문제를 어떤 trade-off로 다루는지**를 설명하는 것이 핵심입니다.

처음부터 끝까지 외우기보다 아래 핵심 섹션 단위로 나눠 보는 편이 효율적입니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | 분산시스템의 실패 모델 | 네트워크 지연, timeout, partition, partial failure가 단일 서버와 무엇을 다르게 만드는가? |
| 2 | CAP, PACELC, 일관성 모델 | partition 상황과 정상 상황에서 consistency, availability, latency trade-off를 설명할 수 있는가? |
| 3 | 복제, Quorum, 합의 | replication, quorum read/write, leader election, Raft/Paxos가 어떤 문제를 푸는가? |
| 4 | 파티셔닝과 샤딩 | shard key, hot shard, resharding, cross-shard transaction 문제를 어떻게 다룰 것인가? |
| 5 | Timeout, Retry, 멱등성 | timeout 후 처리 여부를 모르는 상황에서 retry, backoff, idempotency key를 어떻게 설계할 것인가? |
| 6 | 장애 격리와 복원력 | bulkhead, circuit breaker, rate limit, load shedding, backpressure로 장애 전파를 어떻게 줄이는가? |
| 7 | 이벤트 기반 연동과 분산 트랜잭션 | 2PC, Saga, Outbox, CDC, Event Sourcing, CQRS의 trade-off를 설명할 수 있는가? |
| 8 | 실전 면접 Q&A | 짧은 답변으로 CAP, quorum, retry, outbox, split-brain, HA 질문을 빠르게 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| Partial Failure | 일부 노드나 네트워크만 실패해 전체 상태를 확정하기 어렵습니다. |
| Timeout | 장애 감지 수단이지만 느린 응답과 실패를 완벽히 구분하지 못합니다. |
| CAP | network partition이 발생했을 때 consistency와 availability를 동시에 완벽히 만족할 수 없다는 trade-off입니다. |
| PACELC | partition 때 C/A를, else 정상 상황에서 latency/consistency trade-off를 봅니다. |
| Consistency Model | linearizability, sequential, causal, eventual consistency처럼 읽기 결과 보장 수준을 말합니다. |
| Replication | 데이터 복사본을 여러 노드에 둬 가용성과 읽기 성능을 높이지만 lag와 conflict가 생깁니다. |
| Quorum | `R + W > N`으로 최신 값을 읽을 가능성을 높이지만 latency와 availability 비용이 있습니다. |
| Consensus | 장애가 있어도 여러 노드가 같은 값이나 log 순서에 동의하게 합니다. |
| Sharding | 데이터를 여러 노드에 나눠 저장해 용량과 처리량을 확장하지만 shard key와 재분배가 어렵습니다. |
| Idempotency | 중복 요청과 재시도에도 결과가 안정적으로 남도록 설계하는 성질입니다. |
| Circuit Breaker | 실패가 누적되는 호출을 차단해 빠르게 실패시키고 장애 전파를 줄입니다. |
| Outbox | DB 변경과 이벤트 발행 요청을 같은 DB 트랜잭션에 저장해 이중 쓰기 문제를 줄입니다. |
| Saga | 분산 트랜잭션을 지역 트랜잭션과 보상 트랜잭션의 흐름으로 나눕니다. |

## 면접 답변 프레임

분산시스템 질문은 **정답 하나**보다 “어떤 실패를 허용하고 무엇을 포기하는가”를 명확히 답해야 합니다.

1. 실패 모델: node crash, slow network, partition, duplicate request, clock skew 중 무엇을 가정하는지 말합니다.
2. 보장 수준: consistency, availability, durability, ordering, latency 중 우선순위를 정합니다.
3. 메커니즘: replication, quorum, consensus, idempotency, outbox, retry, circuit breaker를 연결합니다.
4. 실패 모드: split-brain, stale read, lost update, retry storm, poison message, cascading failure를 붙입니다.
5. 운영: metrics, tracing, alert, runbook, failover drill, chaos test로 검증 방법을 말합니다.

## 1. 분산시스템의 실패 모델

### 분산시스템이 어려운 이유

단일 process 내부에서는 함수 호출이 성공하거나 예외를 던지는 식으로 비교적 명확합니다. 분산 환경에서는 요청을 보낸 쪽이 다음을 구분하기 어렵습니다.

| 상황 | 호출자가 보는 증상 |
| --- | --- |
| 요청이 서버에 도착하지 않음 | timeout |
| 서버가 처리했지만 응답이 유실됨 | timeout |
| 서버가 처리 중 느림 | timeout |
| 서버가 처리 후 crash | timeout 또는 연결 종료 |
| 네트워크 partition | 일부 노드만 접근 가능 |

핵심:

- timeout은 실패 감지가 아니라 “기다리기를 포기했다”는 의미에 가깝습니다.
- 처리 여부를 모르면 retry는 중복 처리 위험을 만듭니다.
- 부분 장애는 전체 장애보다 진단이 어렵습니다.

### Failure 종류

| 실패 | 설명 | 예 |
| --- | --- | --- |
| Crash failure | 노드가 멈춤 | process 종료, VM 장애 |
| Omission failure | 메시지 송수신 누락 | packet loss, queue drop |
| Timing failure | 너무 늦게 응답 | GC pause, DB lock wait |
| Network partition | 노드 집합 사이 통신 단절 | AZ 간 네트워크 장애 |
| Byzantine failure | 악의적/임의의 잘못된 동작 | 위조 메시지, 손상된 노드 |

대부분의 백엔드 면접에서 다루는 Raft, Paxos, quorum replication은 보통 crash failure와 network partition을 주로 가정하며 Byzantine fault tolerant는 별도 영역입니다.

### Clock과 순서

분산 환경에서 물리 clock은 완전히 믿기 어렵습니다.

문제:

- clock skew
- NTP 조정
- 서로 다른 노드의 timestamp 비교
- “먼저 발생”과 “timestamp가 작음”의 불일치

대응:

| 방법 | 설명 |
| --- | --- |
| Logical clock | event의 happens-before 관계를 표현 |
| Vector clock | 여러 노드 간 인과 관계와 concurrent update 구분 |
| Monotonic clock | timeout 측정에 wall clock보다 적합 |
| Server-side ordering | 단일 leader/partition에서 순서 부여 |

면접 포인트:

- 주문 상태 전이처럼 순서가 중요한 이벤트는 physical timestamp만 믿지 말고 aggregate id 기준 단일 writer/partition 또는 version을 둡니다.
- timeout 측정은 wall clock 변경 영향을 덜 받는 monotonic clock 기반이 안전합니다.

## 2. CAP, PACELC, 일관성 모델

### CAP

CAP는 network partition이 발생했을 때 다음 중 무엇을 보장할지의 trade-off를 설명합니다.

| 속성 | 의미 |
| --- | --- |
| Consistency | 모든 client가 같은 최신 값을 보는 것에 가까운 보장 |
| Availability | 정상 노드가 받은 모든 요청에 오류가 아닌 응답 |
| Partition Tolerance | 메시지 지연/손실로 노드 그룹이 분리되어도 동작 |

현실의 분산 시스템은 partition을 완전히 배제할 수 없으므로 partition 상황에서 C와 A 중 무엇을 희생할지 고민합니다.

| 선택 | 의미 | 예 |
| --- | --- | --- |
| CP | 일관성을 위해 일부 요청을 거부 | quorum 부족 시 write fail |
| AP | 응답을 유지하고 일시적 불일치 허용 | conflict resolution 필요 |

주의:

- CAP는 정상 상황의 latency trade-off를 직접 설명하지 않습니다.
- “CA 시스템”이라는 답은 network partition을 고려하는 현실적 분산 시스템에서는 조심해야 합니다.
- 한 시스템 안에서도 기능별로 CP/AP 선택이 다를 수 있습니다.

### PACELC

PACELC는 CAP의 질문을 확장합니다.

```text
if Partition: Availability vs Consistency
Else: Latency vs Consistency
```

예:

- partition 상황에서는 write를 거부해 consistency를 지킬지, 받아들이고 나중에 수렴할지 결정합니다.
- 정상 상황에서도 leader quorum write는 더 일관적이지만 latency가 늘 수 있습니다.
- local read는 빠르지만 stale data 가능성이 있습니다.

### 일관성 모델

| 모델 | 의미 | 예 |
| --- | --- | --- |
| Linearizability | 모든 연산이 실제 시간 순서와 일관된 한 지점에서 일어난 것처럼 보임 | 강한 단일 객체 연산 |
| Sequential Consistency | 모든 process가 같은 순서를 보지만 실제 시간 순서는 약할 수 있음 | 일부 분산 메모리 모델 |
| Causal Consistency | 인과관계가 있는 update 순서는 보장 | 댓글/답글 관계 |
| Read Your Writes | 내가 쓴 값은 이후 내가 읽을 수 있음 | 사용자 프로필 수정 후 조회 |
| Monotonic Read | 한 번 본 값보다 오래된 값을 나중에 보지 않음 | session stickiness |
| Eventual Consistency | 쓰기가 멈추면 결국 복제본이 수렴 | DNS, 일부 NoSQL |

면접 포인트:

- “strong consistency”라고만 말하지 말고 어떤 읽기/쓰기 보장인지 구체화해야 합니다.
- read-after-write가 필요한 API는 primary read, session stickiness, version check 같은 전략이 필요합니다.
- eventual consistency는 자동으로 안전한 것이 아니라 conflict resolution과 관측이 필요합니다.

실무 포인트:

- 메시지 브로커(Kafka) 기반 이벤트 연동에서는 소비 측이 받는 순서가 발행 순서와 달라질 수 있어, "수정 → 등록"처럼 역전되면 오래된 데이터가 최신 데이터를 덮어써 결과가 비정상이 됩니다. (출처: 우아한형제들)
- 결과적 일관성은 그 자체로 안전한 것이 아니라, 역전을 감지하는 모니터링/로깅과 보정(fallback) 로직 같은 추가 검증 장치가 있어야 실제 수렴을 보장합니다. (출처: 우아한형제들)
- 순서 문제를 구조적으로 회피하려면 Zero Payload 패턴을 씁니다. 이벤트에 데이터를 싣지 않고 식별자(ID)만 전달하고 수신 측이 그 ID로 원본을 다시 조회해 저장하면, 도착 순서가 뒤바뀌어도 최종 결과가 최신값으로 수렴하고 스키마 변경에도 덜 민감합니다. 대신 수신 시마다 원본을 재조회하는 부하가 트레이드오프입니다. (출처: 우아한형제들)
- 처리에 실패한 이벤트는 별도 DeadLetter 토픽으로 격리해 재처리 경로를 둡니다. (출처: 우아한형제들)

## 3. 복제, Quorum, 합의

### Replication

Replication은 데이터를 여러 노드에 복사합니다.

| 방식 | 설명 | trade-off |
| --- | --- | --- |
| Leader-Follower | leader가 write를 받고 follower가 복제 | 구조 단순, leader 병목 |
| Multi-Leader | 여러 region에서 write 가능 | conflict resolution 필요 |
| Leaderless | client가 여러 replica에 read/write | quorum과 repair 필요 |

복제 지연이 만드는 문제:

- stale read
- read-after-write 깨짐
- failover 시 데이터 손실 가능성
- 중복 이벤트 발행
- conflict 발생

### Quorum

Replica 수가 `N`, write quorum이 `W`, read quorum이 `R`일 때 일반적으로 다음 조건을 봅니다.

```text
R + W > N
```

의미:

- read quorum과 write quorum이 최소 하나의 replica에서 겹칩니다.
- 겹치는 replica가 최신 write를 알고 있을 가능성을 높입니다.

예:

```text
N=3, W=2, R=2
```

장점:

- 단일 replica 장애를 견딜 수 있습니다.
- consistency와 availability를 parameter로 조정할 수 있습니다.

주의:

- clock, concurrent write, hinted handoff, sloppy quorum에 따라 실제 보장은 달라집니다.
- quorum을 높이면 latency와 실패율이 증가할 수 있습니다.
- quorum 성공은 외부 side effect까지 exactly-once로 만들지 않습니다.

### Read Repair와 Anti-Entropy

복제본 불일치를 줄이는 방식:

| 방식 | 설명 |
| --- | --- |
| Read Repair | 읽을 때 오래된 replica를 갱신 |
| Anti-Entropy | background로 replica 간 차이를 동기화 |
| Hinted Handoff | 일시적으로 죽은 노드 대신 hint 저장 후 복구 시 전달 |

주의:

- repair 전까지 stale data가 보일 수 있습니다.
- tombstone과 삭제 전파를 제대로 다루지 않으면 삭제된 데이터가 되살아날 수 있습니다.

### Consensus

Consensus는 여러 노드가 같은 값이나 같은 log 순서에 동의하는 문제입니다.

사용:

- leader election
- metadata/configuration 관리
- replicated log
- distributed lock 서비스
- membership 변경

Raft 핵심:

| 요소 | 설명 |
| --- | --- |
| Leader election | follower가 leader heartbeat를 못 받으면 candidate가 되어 선거 시작 |
| Term | leader 임기를 나타내는 논리적 번호 |
| Log replication | leader가 entry를 follower에 복제 |
| Majority commit | 과반 replica에 기록되면 commit 가능 |
| Safety | committed entry가 이후 leader에게 보존되도록 election 제약 |

주의:

- Raft/Paxos는 보통 Byzantine fault를 다루지 않습니다.
- consensus는 강한 일관성을 주지만 latency와 availability 비용이 큽니다.
- 모든 데이터를 consensus로 처리하면 throughput 병목이 될 수 있습니다.

### Split-Brain

Split-brain은 두 개 이상의 노드 그룹이 자신이 primary/leader라고 믿는 상황입니다.

발생 원인:

- network partition
- 잘못된 failover
- quorum 없이 leader 선출
- fencing token 부재

대응:

- quorum 기반 leader election
- fencing token
- lease 만료와 clock skew 주의
- single writer 보장
- old primary가 write하지 못하도록 차단

실무 포인트:

- `synchronized` 같은 언어 수준 상호배제는 같은 프로세스 안에서만 유효하므로, 여러 인스턴스가 공유 자원을 다루는 분산 환경에서는 "동시에 하나의 writer만 자원을 변경"하도록 강제하는 분산 락이 필요합니다. (출처: 컬리)
- Redisson은 획득한 락에 `leaseTime`(자동 만료 TTL)을 둬, 락을 점유한 프로세스가 죽어도 lease 만료로 소유권을 회수합니다. 이는 락 점유자 장애로 인한 영구 점유(데드락)를 막는 fencing/lease와 같은 문제의식입니다. (출처: 컬리)
- Redis 기반 락에서 Lettuce는 `setnx`/`setex`로 계속 폴링하는 스핀락이라 대기 클라이언트가 많을수록 Redis 부하가 커지지만, Redisson은 pub/sub으로 락 해제 시 구독자에게 신호를 보내 재시도해 불필요한 폴링이 없습니다. (출처: 컬리)
- 락 해제를 트랜잭션 커밋보다 앞에 두면 안 됩니다. 락만 먼저 풀리고 다음 스레드가 변경 전 값을 읽으면(재고 10개를 두 클라이언트가 각각 10으로 읽고 차감) 정합성이 깨지므로, 별도 트랜잭션(REQUIRES_NEW)으로 처리하고 커밋 완료 후 `finally`에서 락을 해제해야 합니다. (출처: 컬리)

## 4. 파티셔닝과 샤딩

### Partitioning과 Sharding

데이터를 나누는 이유:

- 저장 용량 확장
- write throughput 확장
- hot data 격리
- 장애 범위 축소

| 방식 | 설명 | 주의 |
| --- | --- | --- |
| Range Sharding | key 범위별 분할 | 특정 범위 hot shard |
| Hash Sharding | hash(key)로 분산 | range query 어려움 |
| Directory-based | mapping table로 shard 결정 | directory 병목/일관성 |
| Consistent Hashing | 노드 변경 시 재배치 최소화 | 구현·운영 복잡 |

### Shard Key

좋은 shard key 조건:

- cardinality가 높음
- traffic이 고르게 분산
- 주요 query pattern과 맞음
- cross-shard transaction을 줄임
- hot key를 만들지 않음

나쁜 예:

- 날짜만 shard key로 사용해 최신 shard에 write 집중
- 지역/상태처럼 cardinality 낮은 값 사용
- celebrity user나 인기 상품에 traffic 집중

### Cross-Shard 문제

어려운 작업:

- cross-shard join
- global unique constraint
- global ordering
- multi-shard transaction
- resharding
- consistent backup

대응:

- aggregate 단위로 shard key 선택
- denormalization
- application-level fan-out/fan-in
- global id generator
- saga 또는 outbox 기반 비동기 처리
- resharding runbook과 dual-write/dual-read 전략

## 5. Timeout, Retry, 멱등성

### Timeout

Timeout은 실패와 느림을 구분하지 못합니다.

```text
client -> server: request
server: 처리 성공
response: network에서 유실
client: timeout
client: retry
```

위 상황에서 서버는 같은 요청을 두 번 받을 수 있습니다.

설계 원칙:

- connect timeout과 request/read timeout을 구분합니다.
- 전체 deadline을 둡니다.
- downstream timeout은 upstream timeout보다 짧게 잡아야 합니다.
- timeout 후 처리 여부를 모르는 API는 idempotency를 설계합니다.

### Retry, Backoff, Jitter

Retry가 필요한 경우:

- 일시적 network 실패
- leader failover 중
- rate limit 후 재시도 가능 응답
- transient 5xx

주의:

- 무제한 retry는 장애를 증폭합니다.
- 모든 client가 같은 주기로 retry하면 retry storm이 됩니다.
- exponential backoff와 jitter를 사용합니다.
- retry budget을 둬 정상 traffic을 retry가 압도하지 않게 합니다.

### Idempotency

멱등성은 같은 요청을 여러 번 처리해도 최종 결과가 한 번 처리된 것처럼 안정적인 성질입니다.

방법:

| 방법 | 설명 |
| --- | --- |
| Idempotency Key | client가 요청 식별자 제공 |
| Unique Constraint | DB에서 중복 생성 방지 |
| Processed Request Table | 처리 이력 저장 |
| State Machine | 유효한 상태 전이만 허용 |
| Natural Key | 주문번호, 결제 승인번호 같은 업무 key 사용 |

예:

```text
POST /payments
Idempotency-Key: user-123:order-456:pay-1
```

주의:

- key scope와 TTL을 정해야 합니다.
- 같은 key에 다른 payload가 오면 conflict로 처리해야 합니다.
- 멱등성 저장소 자체가 transaction boundary 안에 있어야 합니다.

### At-least-once와 Exactly-once

| 보장 | 의미 | 주의 |
| --- | --- | --- |
| At-most-once | 중복은 없지만 유실 가능 | retry 제한 |
| At-least-once | 유실을 줄이지만 중복 가능 | idempotent consumer 필요 |
| Exactly-once | 특정 경계 안에서 한 번 처리처럼 보장 | 외부 side effect는 별도 설계 필요 |

면접 답변:

> 분산 환경에서 외부 API, DB, 메시지 브로커를 함께 쓰면 “정확히 한 번”은 범위가 중요합니다. 보통은 at-least-once + idempotency + outbox로 실용적인 안정성을 만듭니다.

## 6. 장애 격리와 복원력

### Bulkhead

Bulkhead는 기능별 자원을 분리합니다.

예:

- 외부 API별 thread pool 분리
- DB connection pool 분리
- queue partition 분리
- critical path와 batch path 분리

효과:

- 한 dependency 장애가 전체 thread/connection을 고갈시키는 것을 줄입니다.
- 장애 범위를 작게 유지합니다.

### Circuit Breaker

Circuit breaker는 실패가 누적되는 호출을 잠시 차단합니다.

| 상태 | 의미 |
| --- | --- |
| Closed | 정상 호출 |
| Open | 호출 차단, 빠른 실패 |
| Half-Open | 일부 요청으로 회복 여부 확인 |

주의:

- circuit breaker는 장애를 고치는 것이 아니라 빠른 실패와 자원 보호를 위한 장치입니다.
- fallback이 잘못 설계되면 stale data나 잘못된 비즈니스 결정을 만들 수 있습니다.
- timeout, retry, bulkhead와 함께 설계해야 효과가 있습니다.

실무 포인트:

- 장애 판정 기준은 실패 응답(failure call)과 기준 시간 초과 응답(slow call) 두 가지입니다. `failureRateThreshold` 50%, `slowCallDurationThreshold` 60,000ms, `waitDurationInOpenState` 60,000ms, `minimumNumberOfCalls` 100 등이 기본값이며, 실제 운영에서는 실패율 10%·slow 기준 500ms·Open 대기 30초처럼 더 엄격하게 조정할 수 있습니다. (출처: 올리브영)
- 서킷브레이커가 없으면 의존 대상 장애 시 (연결 대기 timeout × 재시도 횟수)만큼 지연이 낭비되지만, 서킷이 Open이면 장애 의존성을 건너뛰고 fallback 경로(예: 대체 저장소)로 곧바로 우회합니다. fallback 메서드는 원 함수와 파라미터·반환 타입이 같아야 합니다. (출처: 올리브영)
- Resilience4j 데코레이터 기본 적용 순서는 `Retry(CircuitBreaker(RateLimiter(TimeLimiter(Bulkhead(함수)))))`입니다. Retry를 CircuitBreaker보다 바깥(먼저)에 두면 재시도 실패 횟수까지 서킷의 실패율에 합산되므로 임계값 설정에 주의해야 합니다. (출처: 올리브영)
- Resilience4j는 Hystrix가 maintenance 모드로 전환되며 그 대체로 쓰이는 경량 라이브러리로, CLOSED/OPEN/HALF_OPEN 외에 항상 허용하는 DISABLED와 항상 거부하는 FORCED_OPEN 특수 상태가 있고 실패율은 슬라이딩 윈도우(COUNT_BASED/TIME_BASED)로 측정합니다. (출처: 우아한형제들)
- fallback은 상태와 무관하게 CLOSED에서도 메서드가 실패하면 실행되므로 fallback 실행 여부만으로 서킷 Open을 판단할 수 없고, fallback이 실행되면 원래 예외가 상위로 전파되지 않아 기존 예외 처리 흐름을 함께 조정해야 합니다. Open 전용 예외인 `CallNotPermittedException`은 별도 분기 처리할 수 있습니다. (출처: 우아한형제들)

### Load Shedding과 Backpressure

| 개념 | 설명 |
| --- | --- |
| Load Shedding | 처리할 수 없는 요청을 일찍 거부 |
| Backpressure | downstream 처리 속도에 맞춰 upstream 생산 속도 조절 |
| Rate Limit | 사용자/API key/IP별 호출 제한 |
| Queue Limit | 무한 queue로 memory를 고갈시키지 않게 제한 |

면접 포인트:

- queue를 무한히 키우면 장애가 사라지는 것이 아니라 latency와 memory 사용량이 폭증합니다.
- overload 상황에서는 일부 요청을 빠르게 실패시키는 것이 전체 안정성에 낫습니다.
- 429, 503, `Retry-After`를 상황에 맞게 사용합니다.

### Cascading Failure

Cascading failure는 한 컴포넌트 장애가 retry, thread 고갈, connection 고갈, queue 증가를 통해 다른 컴포넌트 장애로 번지는 현상입니다.

방어:

- timeout
- retry budget
- circuit breaker
- bulkhead
- load shedding
- cache/fallback
- dependency별 SLO와 alert

## 7. 이벤트 기반 연동과 분산 트랜잭션

### 2PC

Two-Phase Commit은 coordinator가 여러 participant의 commit을 조정합니다.

```text
prepare phase
 -> all participants vote yes/no
commit phase
 -> coordinator sends commit/abort
```

장점:

- 여러 resource의 atomic commit을 목표로 합니다.

단점:

- coordinator 장애 시 blocking 가능
- participant lock 보유 시간이 길어짐
- latency와 운영 복잡도 증가
- microservice 경계에서는 결합이 강함

### Saga

Saga는 긴 business transaction을 여러 local transaction과 compensating transaction으로 나눕니다.

방식:

| 방식 | 설명 |
| --- | --- |
| Choreography | 서비스들이 이벤트를 구독해 다음 단계 진행 |
| Orchestration | 중앙 orchestrator가 단계와 보상을 지시 |

예:

```text
주문 생성
 -> 재고 예약
 -> 결제 승인
 -> 배송 생성

결제 실패 시
 -> 재고 예약 취소
 -> 주문 취소
```

주의:

- 보상 트랜잭션은 항상 완전한 rollback이 아닐 수 있습니다.
- 중간 상태를 사용자와 운영자가 이해할 수 있어야 합니다.
- 각 단계는 idempotent해야 합니다.

### Transactional Outbox

문제:

```text
DB 저장 성공 + 메시지 발행 실패
DB 저장 실패 + 메시지 발행 성공
```

해결:

1. 비즈니스 데이터와 outbox event를 같은 DB transaction에 저장합니다.
2. publisher 또는 CDC가 outbox를 읽어 broker에 발행합니다.
3. 성공한 event는 발행 완료 처리하거나 log compaction/retention으로 관리합니다.

주의:

- publisher는 재시도 가능해야 합니다.
- consumer는 중복 수신에 대비해야 합니다.
- event ordering은 aggregate key 기준으로 설계해야 합니다.
- outbox table growth와 cleanup 전략이 필요합니다.

### Event Sourcing과 CQRS

| 패턴 | 설명 | 주의 |
| --- | --- | --- |
| Event Sourcing | 상태 변경 이벤트를 source of truth로 저장 | replay 비용, schema evolution |
| CQRS | command model과 query model 분리 | 동기화 지연, 복잡도 |

Event Sourcing 장점:

- 감사 로그
- 과거 상태 재현
- projection 재생성
- 비즈니스 이벤트 history 보존

주의:

- 이벤트는 변경 불가능한 사실로 설계합니다.
- snapshot이 없으면 replay 비용이 커집니다.
- projection은 eventual consistency를 가집니다.

### 비동기 연동 방식

| 방식 | 장점 | 주의 |
| --- | --- | --- |
| Messaging | 느슨한 결합, 버퍼링, 재시도 | 중복, 순서, poison message |
| DB Polling | DB transaction과 결합 쉬움 | polling 부하, latency |
| CDC | DB 변경 capture 자동화 | 비즈니스 의미 부족, 운영 복잡도 |
| Webhook | 외부 시스템 연동 쉬움 | 재시도, 서명 검증, idempotency |

## 8. 실전 면접 Q&A

### CAP / 일관성

| 질문 | 답변 핵심 |
| --- | --- |
| CAP를 설명하라 | network partition 상황에서 consistency와 availability를 동시에 완벽히 만족할 수 없다는 trade-off입니다. |
| PACELC는 CAP와 무엇이 다른가? | partition 때 C/A뿐 아니라 정상 상황에서도 latency와 consistency trade-off를 봅니다. |
| eventual consistency는 안전한가? | conflict resolution, read-your-writes, reconciliation, 관측이 있어야 안전하게 운영할 수 있습니다. |
| read-after-write가 필요한 API는? | primary read, session stickiness, version check, quorum read 같은 전략을 사용합니다. |

### 복제 / 샤딩 / 합의

| 질문 | 답변 핵심 |
| --- | --- |
| replication과 sharding 차이는? | replication은 복사본으로 가용성/읽기 확장, sharding은 데이터를 나눠 용량/쓰기 확장을 합니다. |
| quorum에서 `R + W > N` 의미는? | read와 write quorum이 최소 하나의 replica에서 겹쳐 최신 값을 읽을 가능성을 높입니다. |
| split-brain은 왜 위험한가? | 두 leader가 동시에 write하면 데이터 divergence가 생기므로 quorum, fencing, single writer가 필요합니다. |
| Raft는 무엇을 보장하나? | leader election과 replicated log로 여러 노드가 같은 순서의 명령에 합의하게 합니다. |
| shard key는 어떻게 고르나? | cardinality, traffic 분산, query pattern, cross-shard 작업 감소를 기준으로 고릅니다. |

### Retry / 장애 격리

| 질문 | 답변 핵심 |
| --- | --- |
| timeout 후 retry가 위험한 이유는? | 서버가 이미 처리했지만 응답만 유실됐을 수 있어 중복 side effect가 생길 수 있습니다. |
| idempotency key 설계 포인트는? | key scope, TTL, payload mismatch 처리, transaction boundary 안의 처리 이력 저장이 필요합니다. |
| circuit breaker의 목적은? | 실패 호출을 빠르게 차단해 thread/connection 고갈과 장애 전파를 줄이는 것입니다. |
| bulkhead와 circuit breaker 차이는? | bulkhead는 자원 격리, circuit breaker는 실패 dependency 호출 차단입니다. |
| backpressure와 load shedding 차이는? | backpressure는 생산 속도 조절, load shedding은 처리 불가능한 요청을 빠르게 거부하는 것입니다. |

### 이벤트 / 트랜잭션 / HA

| 질문 | 답변 핵심 |
| --- | --- |
| 2PC를 microservice에서 꺼리는 이유는? | coordinator 장애 시 blocking, lock 장기 보유, latency, 강한 결합 때문입니다. |
| Saga란 무엇인가? | 지역 트랜잭션과 보상 트랜잭션을 연결해 긴 business transaction을 관리하는 방식입니다. |
| Transactional Outbox는 무엇을 해결하나? | DB 변경과 메시지 발행 사이 이중 쓰기 실패를 줄입니다. |
| Event Sourcing과 CQRS 차이는? | Event Sourcing은 이벤트를 source of truth로 저장하고, CQRS는 command/read model을 분리합니다. |
| SPOF는 어떻게 줄이나? | 이중화, quorum, health check, failover, multi-AZ, backup/restore drill로 줄입니다. |

## 참고한 공식 문서와 논문

- Brewer, CAP Twelve Years Later: https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/
- Gilbert and Lynch, Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services: https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf
- Raft paper, In Search of an Understandable Consensus Algorithm: https://raft.github.io/raft.pdf
- Raft extended site: https://raft.github.io/
- AWS Builders' Library, Timeouts, retries, and backoff with jitter: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
- AWS Builders' Library, Making retries safe with idempotent APIs: https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
- Google SRE Book, Addressing Cascading Failures: https://sre.google/sre-book/addressing-cascading-failures/
- Microsoft Azure Architecture, Saga distributed transactions pattern: https://learn.microsoft.com/azure/architecture/patterns/saga
- Microservices.io, Transactional Outbox: https://microservices.io/patterns/data/transactional-outbox.html

## 참고한 기술블로그

- 컬리 — 풀필먼트 입고 서비스팀에서 분산락을 사용하는 방법 - Spring Redisson: https://helloworld.kurly.com/blog/distributed-redisson-lock/
- 우아한형제들 — 이벤트 기반 아키텍처 도입 사례(전시 영역): https://techblog.woowahan.com/13101/
- 올리브영 — Circuitbreaker를 사용한 장애 전파 방지: https://oliveyoung.tech/2023-08-31/circuitbreaker-inventory-squad/
- 우아한형제들 — 개발자 의식의 흐름대로 적용해보는 서킷브레이커: https://techblog.woowahan.com/15694/
