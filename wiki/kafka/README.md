# Kafka

Kafka 면접은 **메시지를 큐가 아니라 파티션 로그로 저장하고, Consumer가 offset으로 처리 위치를 관리한다는 점**을 설명하는 것이 핵심입니다.

처음부터 끝까지 읽기보다 아래 핵심 섹션 단위로 나눠 보는 편이 효율적입니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | 로그 모델과 기본 구성 | Topic, Partition, Broker, Replica, Offset이 왜 Kafka 확장성과 재처리의 기반인가? |
| 2 | Producer와 쓰기 보장 | key, partitioner, batch, acks, ISR, idempotence가 손실·중복·순서에 어떤 영향을 주는가? |
| 3 | Consumer Group과 Offset | Consumer Group이 파티션을 나눠 읽고 offset commit으로 처리 위치를 관리하는 방식을 설명할 수 있는가? |
| 4 | Rebalancing과 Backpressure | consumer 변화, poll 지연, partition revocation이 처리 중단과 중복 처리로 이어지는 이유는 무엇인가? |
| 5 | 전달 보장과 Exactly Once | at-most/at-least/exactly-once, transaction, `read_committed`, external DB idempotency를 구분할 수 있는가? |
| 6 | 파티션 설계와 운영 | partition 수, replication factor, retention, compaction, lag, throughput을 어떻게 설계하고 관측할 것인가? |
| 7 | Streams, Connect, RabbitMQ 비교 | Streams와 Connect의 역할, Kafka와 RabbitMQ의 모델 차이를 설명할 수 있는가? |
| 8 | 실전 면접 Q&A | 짧은 답변으로 파티션, offset, rebalance, EOS, 운영 질문을 빠르게 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| Topic | 메시지의 논리적 분류입니다. |
| Partition | 저장, 순서 보장, 병렬 처리, 복제의 실제 단위입니다. |
| Broker | 파티션 로그를 저장하고 Producer/Consumer 요청을 처리합니다. |
| Producer | key, batch, acks, retry, idempotence 설정으로 메시지를 기록합니다. |
| Consumer Group | 파티션을 그룹 내 Consumer에게 나눠 병렬 처리합니다. |
| Offset | Consumer가 어디까지 처리했는지 나타내는 위치 값입니다. |
| Rebalancing | Consumer 변화 시 파티션 할당을 다시 계산합니다. |
| Retention | 소비 여부와 별개로 log 보관 기간/크기를 정합니다. |
| EOS | Kafka 내부 read-process-write를 transaction과 idempotent producer로 정확히 한 번처럼 처리합니다. |

## 면접 답변 프레임

Kafka 질문은 “메시지 큐”가 아니라 **분산 commit log** 관점으로 답해야 합니다.

1. 저장 모델: topic-partition append-only log와 offset을 먼저 설명합니다.
2. 순서와 병렬성: partition 내부 순서, key 기반 partitioning, consumer 병렬성 한계를 말합니다.
3. 보장 조건: acks, ISR, retry, idempotence, transaction, offset commit을 연결합니다.
4. 실패 모드: rebalance, duplicate processing, poison pill, lag, retention 초과, hot partition을 붙입니다.
5. 운영 선택: partition 수, retention/compaction, consumer concurrency, DLQ, monitoring을 설계합니다.

## 1. 로그 모델과 기본 구성

### Kafka는 무엇인가

Kafka는 event streaming platform이며 핵심 저장 모델은 **partitioned replicated log**입니다.

| 구성 요소 | 역할 |
| --- | --- |
| Broker | Kafka 서버 노드, 파티션 로그 저장 |
| Topic | 메시지의 논리적 카테고리 |
| Partition | append-only log, 순서 보장과 병렬 처리 단위 |
| Record | key, value, timestamp, headers를 가진 이벤트 |
| Producer | 메시지 발행 |
| Consumer | 메시지 소비 |
| Consumer Group | 여러 Consumer의 병렬 처리 단위 |
| Offset | partition 안의 record 위치 |

핵심:

- Kafka는 메시지를 소비했다고 바로 삭제하지 않습니다.
- retention 정책에 따라 log를 보관합니다.
- consumer는 offset을 이동시키며 읽습니다.
- 같은 topic을 여러 consumer group이 독립적으로 재처리할 수 있습니다.

### Topic과 Partition

Topic은 논리적 이름이고, partition은 실제 저장과 병렬 처리 단위입니다.

```text
topic: orders
  partition-0: 0, 1, 2, 3, ...
  partition-1: 0, 1, 2, 3, ...
  partition-2: 0, 1, 2, 3, ...
```

면접 포인트:

- 순서는 partition 내부에서만 보장됩니다.
- topic 전체 순서는 보장되지 않습니다.
- consumer group의 병렬 처리 상한은 partition 수입니다.
- partition은 leader와 follower replica를 가질 수 있습니다.

### Replication, Leader, ISR

Kafka replication의 기본 단위는 topic partition입니다.

| 개념 | 설명 |
| --- | --- |
| Leader | 해당 partition의 read/write를 주로 처리하는 replica |
| Follower | leader log를 복제하는 replica |
| Replication Factor | partition당 replica 수 |
| ISR | leader와 동기화가 충분히 유지되는 replica 집합 |
| Leader Election | leader 장애 시 새 leader 선출 |

안정성 기준:

```text
replication.factor=3
min.insync.replicas=2
acks=all
```

이 조합은 leader만 기록하고 성공하는 것보다 손실 위험을 줄입니다.

### Retention과 Compaction

Kafka는 소비 여부와 별개로 record를 retention 정책에 따라 보관합니다.

| 정책 | 의미 |
| --- | --- |
| Time retention | 일정 시간 이후 삭제 |
| Size retention | 일정 크기 초과 시 삭제 |
| Log compaction | 같은 key의 최신 value 중심으로 보관 |

사용 기준:

- 이벤트 히스토리가 중요하면 time/size retention을 길게 잡습니다.
- 최신 상태 snapshot 성격이면 compacted topic을 검토합니다.
- tombstone record는 compacted topic에서 삭제 의미를 가질 수 있습니다.

주의:

- consumer lag가 retention보다 길어지면 consumer가 읽어야 할 offset의 record가 삭제될 수 있습니다.
- compaction은 즉시 일어나는 것이 아니라 background 작업입니다.

## 2. Producer와 쓰기 보장

### Producer 전송 흐름

1. record key/value를 serialize합니다.
2. partitioner가 partition을 결정합니다.
3. producer buffer에 쌓습니다.
4. batch로 broker leader에게 전송합니다.
5. acks 조건을 만족하면 성공 callback을 받습니다.

주요 설정:

| 설정 | 의미 | trade-off |
| --- | --- | --- |
| `acks` | 쓰기 성공 응답 기준 | 안전성 vs latency |
| `retries` | 재시도 횟수 | 중복 가능성, 지연 증가 |
| `enable.idempotence` | broker-side deduplication | 안정성 증가, 설정 제약 |
| `linger.ms` | batch를 기다리는 시간 | 처리량 vs latency |
| `batch.size` | batch 크기 | 처리량 vs memory |
| `compression.type` | 압축 방식 | network 절약 vs CPU |
| `delivery.timeout.ms` | send 이후 성공/실패 보고 상한 | 전체 전송 지연 제한 |

### acks와 min.insync.replicas

| 설정 | 의미 | 위험 |
| --- | --- | --- |
| `acks=0` | 응답을 기다리지 않음 | 손실 확인 불가 |
| `acks=1` | leader 기록 후 성공 | leader 장애 시 손실 가능 |
| `acks=all` | ISR 복제 조건 충족 후 성공 | latency 증가 |

`acks=all`만으로 충분하지 않습니다.

- `min.insync.replicas`가 1이면 leader만 있어도 성공할 수 있습니다.
- 안정성을 높이려면 replication factor와 min ISR을 함께 봐야 합니다.
- ISR 수가 부족하면 producer는 error를 받고 재시도 또는 실패 처리해야 합니다.

### Idempotent Producer

Idempotent producer는 producer id, epoch, sequence number를 이용해 retry 중복을 broker가 제거하게 합니다.

효과:

- retry로 인한 duplicate write를 줄입니다.
- partition 내부 순서 안정성을 높입니다.

조건과 주의:

- `enable.idempotence=true`가 필요합니다.
- Kafka client는 idempotence에 필요한 `acks=all`, `retries>0`, `max.in.flight.requests.per.connection` 제약을 가집니다.
- idempotence는 producer session과 partition write에 대한 중복 제거이지 외부 DB side effect까지 보장하지 않습니다.

### Key와 Partitioning

Kafka는 key를 기준으로 partition을 선택할 수 있습니다.

```java
producer.send(new ProducerRecord<>("orders", orderId, event));
```

같은 `orderId`는 같은 partition으로 가므로 주문 상태 이벤트 순서를 지킬 수 있습니다.

주의:

- partition 수를 늘리면 key-to-partition mapping이 바뀔 수 있습니다.
- 특정 key에 이벤트가 몰리면 hot partition이 생깁니다.
- key가 없으면 round-robin/sticky partitioning으로 분산될 수 있지만 순서 기준은 약해집니다.

## 3. Consumer Group과 Offset

### Consumer Group

같은 `group.id`를 가진 Consumer들은 하나의 그룹입니다.

| 조건 | 결과 |
| --- | --- |
| partition 4개, consumer 2개 | 각 consumer가 2개 partition 처리 |
| partition 4개, consumer 4개 | 1:1 처리 |
| partition 4개, consumer 5개 | 1개 consumer는 idle |

핵심:

- 하나의 partition은 같은 group 안에서 동시에 하나의 consumer에게만 할당됩니다.
- 서로 다른 consumer group은 같은 topic을 독립적으로 읽습니다.
- consumer parallelism을 늘리고 싶으면 partition 수가 충분해야 합니다.

### Offset과 Commit

Offset은 partition 안에서 record 위치입니다. Consumer가 commit하는 offset은 보통 **다음에 읽을 위치**입니다.

| 커밋 방식 | 특징 | 주의 |
| --- | --- | --- |
| auto commit | 편함 | 처리 전 commit되어 유실 가능 |
| `commitSync()` | 실패를 확인하기 쉬움 | blocking 비용 |
| `commitAsync()` | 빠름 | 실패 처리와 순서 관리 필요 |
| external offset store | 처리 결과와 offset을 같은 저장소에 저장 가능 | 구현 복잡도 |

일반적인 at-least-once 흐름:

```text
poll -> process -> commit
```

장애 시:

- process 후 commit 전 죽으면 재처리됩니다.
- commit 후 process 전에 죽으면 유실될 수 있습니다.
- 따라서 consumer 처리는 멱등해야 합니다.

### Auto Offset Reset

Consumer group에 committed offset이 없거나 offset이 retention으로 사라졌을 때 시작 위치를 정합니다.

| 설정 | 의미 |
| --- | --- |
| `earliest` | 가장 오래 남아 있는 record부터 읽음 |
| `latest` | 새로 들어오는 record부터 읽음 |
| `none` | offset이 없으면 예외 |

주의:

- 운영 consumer에 `earliest`를 잘못 적용하면 대량 재처리가 발생할 수 있습니다.
- `latest`는 기존 데이터를 건너뛰어 유실처럼 보일 수 있습니다.

### Poison Pill과 DLQ

Poison pill은 특정 record가 계속 처리 실패해 consumer 진행을 막는 상황입니다.

대응:

- 재시도 횟수 제한
- error classification
- dead letter topic
- 실패 record와 exception context 저장
- alerting
- 멱등 처리

주의:

- 무한 재시도는 partition 전체 지연을 만듭니다.
- DLQ로 보낸 record를 어떻게 재처리할지 운영 절차가 필요합니다.

## 4. Rebalancing과 Backpressure

### Rebalancing

Rebalancing은 consumer group 안에서 partition assignment를 다시 계산하는 과정입니다.

발생 조건:

- consumer 합류
- consumer 이탈
- heartbeat 실패
- `max.poll.interval.ms` 초과
- partition 수 변경
- subscription topic 변화

문제:

- partition revocation 중 소비가 중단될 수 있습니다.
- 처리 중인 record의 offset commit 타이밍에 따라 중복 처리가 생길 수 있습니다.
- stateful consumer는 state restore 비용이 큽니다.

완화:

- `max.poll.records`를 줄여 poll batch 처리 시간을 예측 가능하게 합니다.
- `max.poll.interval.ms`를 처리 시간에 맞춥니다.
- `CooperativeStickyAssignor`로 cooperative rebalance를 검토합니다.
- `group.instance.id`로 static membership을 적용해 불필요한 rebalance를 줄입니다.
- `ConsumerRebalanceListener`에서 partition revoke 전 offset commit과 state 정리를 수행합니다.

### Poll Loop와 Backpressure

Consumer는 `poll()`을 계속 호출해야 group membership을 유지합니다.

```text
while (running) {
  records = consumer.poll(timeout)
  process(records)
  commit offsets
}
```

주의:

- 처리 시간이 `max.poll.interval.ms`를 넘으면 consumer가 죽은 것으로 간주되어 rebalance가 발생할 수 있습니다.
- `max.poll.records`는 한 번에 가져오는 record 수를 제한합니다.
- 처리 thread를 분리하면 offset commit이 실제 처리보다 앞서지 않게 관리해야 합니다.
- partition별 순서가 중요하면 병렬 처리와 offset commit을 partition 단위로 제어해야 합니다.

### Pause / Resume

처리량보다 downstream이 느리면 consumer가 너무 많은 record를 가져와 memory와 lag 문제가 생깁니다.

대응:

- `pause()`로 특정 partition fetch를 일시 중단합니다.
- 처리 완료 후 `resume()`합니다.
- external queue에 무제한 적재하지 않습니다.
- downstream 장애 시 circuit breaker와 DLQ를 함께 설계합니다.

## 5. 전달 보장과 Exactly Once

### 전달 보장

| 보장 | 의미 | 조건 |
| --- | --- | --- |
| At-most-once | 최대 한 번 처리, 유실 가능 | 처리 전 commit |
| At-least-once | 최소 한 번 처리, 중복 가능 | 처리 후 commit |
| Exactly-once | Kafka 내부 read-process-write를 정확히 한 번처럼 처리 | idempotence + transaction |

실무 기준:

- 대부분의 외부 side effect는 at-least-once + idempotency로 설계합니다.
- DB write는 unique constraint, idempotency key, processed event table로 중복을 막습니다.
- 외부 API 호출은 request idempotency key를 사용합니다.

### Exactly Once Semantics

Kafka EOS 구성 요소:

| 요소 | 역할 |
| --- | --- |
| Idempotent Producer | retry 중복 write 제거 |
| Transactional Producer | 여러 partition write와 offset commit을 하나로 묶음 |
| `sendOffsetsToTransaction` | consume offset을 output write와 같은 transaction에 포함 |
| `read_committed` | commit된 transaction만 읽음 |

흐름:

```text
beginTransaction
 -> consume
 -> process
 -> produce
 -> sendOffsetsToTransaction
 -> commitTransaction
```

주의:

- Kafka EOS는 Kafka topic 간 처리에 강합니다.
- 외부 DB/API까지 자동으로 exactly-once가 되지는 않습니다.
- DB와 Kafka 이중 쓰기 문제는 transactional outbox, CDC, idempotency로 다룹니다.

### Transactional Outbox

서비스 DB 변경과 Kafka publish를 한 transaction처럼 다루기 위한 패턴입니다.

```text
business table update
outbox table insert
commit DB transaction
CDC/poller publishes outbox event to Kafka
```

장점:

- DB update와 event 기록을 같은 DB transaction으로 묶습니다.
- publish 실패 시 outbox에 남아 재시도할 수 있습니다.

주의:

- outbox event 중복 발행 가능성에 대비해 consumer idempotency가 필요합니다.
- event ordering을 aggregate key 기준으로 설계해야 합니다.

## 6. 파티션 설계와 운영

### Partition 수 설계

고려 요소:

- 목표 처리량
- consumer 병렬성
- broker 수와 부하 분산
- replication traffic
- file handle, page cache
- rebalancing 비용
- key 순서 보장 요구
- hot key/hot partition 가능성

주의:

- partition 수는 늘릴 수 있지만 줄이기 어렵습니다.
- 운영 중 partition 추가는 key-to-partition mapping과 순서 보장에 영향을 줄 수 있습니다.
- partition이 너무 많으면 controller/broker metadata, file handle, recovery 비용이 증가합니다.

### Lag와 Monitoring

Consumer lag는 consumer가 최신 log end offset을 얼마나 따라가지 못하는지 나타냅니다.

봐야 할 지표:

| 지표 | 의미 |
| --- | --- |
| consumer lag | 처리 지연 |
| records consumed rate | 소비 속도 |
| records produced rate | 생산 속도 |
| request latency | broker 요청 지연 |
| under-replicated partitions | 복제 부족 partition |
| offline partitions | leader 없는 partition |
| ISR shrink/expand | replica 동기화 변동 |
| rebalance count/time | consumer group 안정성 |

lag 해석:

- producer 증가로 lag가 생길 수 있습니다.
- consumer 처리 지연으로 lag가 생길 수 있습니다.
- downstream DB/API 지연으로 consumer가 느려질 수 있습니다.
- 특정 partition만 lag가 크면 hot key를 의심합니다.

### Retention, Compaction, Offset Reset

운영 사고 예:

- consumer 장애가 오래 지속됩니다.
- lag가 retention 기간을 넘어갑니다.
- 복구 후 committed offset record가 이미 삭제되어 offset out of range가 발생합니다.

대응:

- 중요한 topic은 retention을 복구 시간보다 길게 잡습니다.
- consumer lag alert을 둡니다.
- offset reset 정책을 운영 절차로 관리합니다.
- compacted topic은 tombstone과 compaction lag를 이해해야 합니다.

### Schema Evolution

Kafka record는 bytes이므로 schema 관리는 별도 전략이 필요합니다.

선택지:

- JSON + explicit version
- Avro/Protobuf/JSON Schema + Schema Registry
- backward/forward compatibility rule

주의:

- producer와 consumer는 독립적으로 배포됩니다.
- 필드 삭제, 타입 변경, required field 추가는 호환성을 깨기 쉽습니다.
- event는 API 계약처럼 관리해야 합니다.

## 7. Streams, Connect, RabbitMQ 비교

### Kafka Streams와 Kafka Connect

| 구분 | Kafka Streams | Kafka Connect |
| --- | --- | --- |
| 역할 | Kafka topic 간 실시간 처리 | 외부 시스템과 Kafka 연결 |
| 형태 | Java library | Worker framework |
| 사용 | filter, map, join, aggregate | DB source, S3 sink, Elasticsearch sink |
| 상태 관리 | state store, changelog topic | connector offset 관리 |
| 확장 | application instance 추가 | worker/connector/task 분산 |

정리:

- Kafka 내부 데이터 가공은 Streams가 적합합니다.
- 외부 시스템 입출력은 Connect가 적합합니다.
- 복잡한 stream processing은 Flink, Spark Streaming 등과 비교할 수 있습니다.

### Kafka vs RabbitMQ

| 구분 | Kafka | RabbitMQ |
| --- | --- | --- |
| 모델 | 분산 append-only log | queue + exchange |
| 메시지 보존 | 소비 후에도 보존 기간 동안 유지 | ACK 후 queue에서 제거 |
| 재처리 | offset reset으로 쉬움 | 기본적으로 어려움 |
| 처리량 | 매우 높음 | routing/queue 중심 |
| 라우팅 | topic/partition 중심 | exchange 기반 routing 강함 |
| 순서 | partition 단위 | queue 단위 |
| 적합 | 이벤트 스트리밍, 로그, 분석, 재처리 | 작업 큐, RPC, 복잡한 routing |

핵심 차이:

- Kafka는 메시지를 로그로 봅니다.
- RabbitMQ는 메시지를 큐로 봅니다.

### Kafka를 쓰지 않아도 되는 경우

Kafka는 강력하지만 운영 비용이 큽니다.

부적합할 수 있는 상황:

- 단순 비동기 작업 큐만 필요합니다.
- 메시지를 오래 보관하거나 재처리할 필요가 없습니다.
- 순서와 보장 조건이 단순합니다.
- 팀이 broker 운영, schema, lag, consumer idempotency를 관리할 여력이 없습니다.

대안:

- RabbitMQ/SQS 같은 queue
- DB outbox + worker
- Redis Stream
- managed event bus

## 8. 실전 면접 Q&A

### 로그 모델 / 파티션

| 질문 | 답변 핵심 |
| --- | --- |
| Kafka를 queue가 아니라 log라고 하는 이유는? | 소비해도 메시지를 즉시 삭제하지 않고 partition log에 retention 동안 보관하기 때문입니다. |
| partition이 중요한 이유는? | 순서 보장, 병렬 처리, 복제, 저장 분산의 단위이기 때문입니다. |
| topic 전체 순서가 보장되는가? | 아닙니다. partition 내부 순서만 보장됩니다. |
| 같은 주문 이벤트 순서를 지키려면? | 같은 orderId를 key로 보내 같은 partition에 기록되게 합니다. |

### Producer / Consumer

| 질문 | 답변 핵심 |
| --- | --- |
| `acks=all`이면 메시지 손실이 없나? | min.insync.replicas, replication factor, producer error 처리까지 함께 봐야 합니다. |
| idempotent producer가 막는 중복은? | producer retry로 같은 partition에 중복 기록되는 것을 broker가 sequence로 제거합니다. |
| consumer group 병렬성 한계는? | 같은 group에서는 partition 수가 병렬 처리 상한입니다. |
| auto commit이 위험한 이유는? | 처리 전에 offset이 commit되면 장애 시 메시지가 유실될 수 있습니다. |
| poison pill은 어떻게 처리하나? | retry 제한, DLQ, error classification, alert, idempotency를 둡니다. |

### Rebalance / Delivery

| 질문 | 답변 핵심 |
| --- | --- |
| rebalance는 언제 발생하나? | consumer join/leave, heartbeat 실패, max.poll.interval 초과, partition 변경 때 발생합니다. |
| rebalance가 왜 문제인가? | 소비 중단, partition revocation, 중복 처리, state restore 비용이 생깁니다. |
| at-least-once가 중복을 만드는 이유는? | 처리 후 commit 전에 장애가 나면 같은 record를 다시 읽기 때문입니다. |
| Kafka EOS는 외부 DB까지 보장하나? | 아닙니다. Kafka 내부 read-process-write에 강하고 외부 DB는 outbox/idempotency가 필요합니다. |

### 운영 / 비교

| 질문 | 답변 핵심 |
| --- | --- |
| partition 수는 어떻게 정하나? | 처리량, consumer 병렬성, broker 부하, key 순서, rebalance 비용을 함께 봅니다. |
| consumer lag가 커지는 원인은? | producer 증가, consumer 처리 지연, downstream 장애, hot partition 등이 있습니다. |
| retention보다 consumer 장애가 길면? | 읽어야 할 offset의 record가 삭제되어 offset reset이나 재처리가 필요할 수 있습니다. |
| Kafka Streams와 Connect 차이는? | Streams는 topic 간 처리 library, Connect는 외부 시스템 연동 framework입니다. |
| Kafka와 RabbitMQ 선택 기준은? | 재처리 가능한 로그/스트리밍이면 Kafka, 작업 큐와 복잡한 routing이면 RabbitMQ가 자연스럽습니다. |

## 참고한 공식 문서

- Apache Kafka Introduction: https://kafka.apache.org/documentation/#gettingStarted
- Apache Kafka Design: https://kafka.apache.org/documentation/#design
- Kafka Producer Configs: https://kafka.apache.org/documentation/#producerconfigs
- Kafka Consumer Configs: https://kafka.apache.org/documentation/#consumerconfigs
- Kafka Operations: https://kafka.apache.org/documentation/#operations
- Kafka Streams: https://kafka.apache.org/documentation/streams/
- Kafka Connect: https://kafka.apache.org/documentation/#connect
- KafkaConsumer Javadoc: https://kafka.apache.org/41/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html
