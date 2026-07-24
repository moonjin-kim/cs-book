# Kafka

Kafka 면접은 **메시지를 큐가 아니라 파티션 로그로 저장하고, Consumer가 offset으로 처리 위치를 관리한다는 점**을 설명하는 것이 핵심입니다.

처음부터 끝까지 읽기보다 아래 핵심 섹션 단위로 나눠 보는 편이 효율적입니다.

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

- consumer lag가 retention보다 길어지면 읽어야 할 offset의 record가 삭제될 수 있습니다.
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

Consumer lag는 consumer가 최신 log end offset에 얼마나 뒤처졌는지 나타냅니다.

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

## 8. 심화: 내부 동작 원리

Kafka가 "디스크 기반인데 왜 빠른가"라는 질문은 면접에서 자주 나옵니다. 답의 핵심은 **순차 I/O + OS page cache + zero-copy** 세 가지가 맞물려 디스크와 네트워크 병목을 줄인다는 것입니다.

### 왜 디스크 기반인데 빠른가

Kafka는 메시지를 메모리가 아니라 디스크의 append-only log에 씁니다. 그런데도 빠른 이유는 접근 패턴이 **순차(sequential)** 이기 때문입니다.

| 항목 | 설명 |
| --- | --- |
| 순차 write | log 끝에만 append → 디스크 head 이동(seek)이 없어 random write보다 수백 배 빠름 |
| 순차 read | consumer가 offset 순서대로 읽음 → readahead(선반입)가 잘 맞음 |
| 페이지 캐시 write-back | write는 일단 page cache에 쌓이고 flush는 OS가 모아서 수행 |

면접 포인트:

- "디스크는 느리다"는 random access 기준입니다. 순차 접근에서는 디스크 대역폭이 충분히 큽니다.
- Kafka는 fsync를 매 메시지마다 강제하지 않고, **복제(replication)로 내구성을 확보**합니다. 즉 디스크 flush가 아니라 다른 broker로의 복제가 손실 방어선입니다.

### Page Cache에 의존하는 이유

Kafka broker는 메시지를 **JVM heap에 캐싱하지 않고 OS page cache에 맡깁니다.**

| 이유 | 설명 |
| --- | --- |
| GC 회피 | 대용량 데이터를 heap에 두면 GC 대상이 되어 pause가 커짐. page cache는 GC와 무관 |
| 재시작 후에도 유지 | broker 프로세스를 재시작해도 OS page cache는 남아 warm 상태 유지 |
| 중복 캐싱 제거 | 애플리케이션 캐시 + page cache 이중 보관을 피함 |

면접 포인트:

- 그래서 Kafka broker는 heap을 크게 잡지 않고(보통 수 GB), 나머지 메모리를 page cache로 OS에 양보하는 것이 권장됩니다.
- consumer가 최신 offset을 따라 읽으면(lag이 작으면) 대부분 page cache hit이라 디스크를 거의 안 칩니다. lag이 커져 오래된 offset을 읽으면 page cache miss로 디스크 read가 늘어납니다.

### Zero-Copy와 sendfile

consumer에게 데이터를 보낼 때 Kafka는 **zero-copy**(`FileChannel.transferTo()` → OS의 `sendfile`)를 사용합니다.

전통적인 `read()` + `send()` 경로는 복사가 4번 일어납니다.

```text
1. DMA:  disk → kernel page cache
2. CPU:  page cache → user buffer      ← 불필요한 복사
3. CPU:  user buffer → socket buffer    ← 불필요한 복사
4. DMA:  socket buffer → NIC
```

zero-copy(sendfile)는 데이터를 user space로 올리지 않고 커널 안에서 바로 전송합니다.

```text
1. DMA:  disk → kernel page cache
2. DMA:  page cache → NIC (scatter-gather)
```

효과:

- user ↔ kernel 사이의 CPU 복사 2회와 context switch를 제거해 CPU와 메모리 대역폭을 절약합니다.
- 데이터가 애플리케이션(JVM)을 거치지 않으므로 broker는 "전달만" 하며 throughput이 올라갑니다.

zero-copy가 **깨지는** 경우(면접 함정):

- **TLS/SSL 암호화**: 암호화는 user space(또는 kernel TLS)에서 일어나야 하므로 sendfile 경로가 깨지고 복사가 다시 늘어납니다. 보안과 성능의 trade-off입니다.
- **압축 형식 변환**: broker가 메시지를 재압축/변환하면 데이터를 user space로 올려야 해 zero-copy를 못 씁니다.

### Record Batch와 압축의 end-to-end 유지

producer는 여러 record를 하나의 **record batch**로 묶고 압축합니다. broker는 이를 **풀지 않고 압축된 상태 그대로 저장·전송**하고, consumer가 최종적으로 해제합니다.

| 단계 | 동작 |
| --- | --- |
| Producer | batch 단위로 묶고 `compression.type`으로 압축 |
| Broker | 압축을 유지한 채 log에 저장, 그대로 fetch 응답에 전달 |
| Consumer | fetch 후 압축 해제 |

면접 포인트:

- 압축을 broker가 풀지 않기 때문에 **zero-copy가 유지**되고 broker CPU도 아낍니다.
- 단, `log.message.format`이나 압축 타입이 producer와 broker 간 불일치하면 broker가 재압축(recompression)해야 하고, 이때 zero-copy와 CPU 이점이 사라집니다.
- batch가 클수록 압축률과 throughput은 오르지만 end-to-end latency는 늘어납니다(`linger.ms`, `batch.size` trade-off).

### Log Segment와 인덱스 구조

partition은 하나의 거대한 파일이 아니라 여러 **segment 파일**로 나뉩니다.

```text
partition-0/
  00000000000000000000.log        ← record 저장(base offset이 파일명)
  00000000000000000000.index      ← offset → 파일 내 물리 위치 (sparse)
  00000000000000000000.timeindex  ← timestamp → offset (sparse)
  00000000000000371337.log        ← 다음 segment
  ...
```

| 구성 | 역할 |
| --- | --- |
| active segment | 현재 append 중인 마지막 segment. 여기에만 write |
| segment roll | 크기(`segment.bytes`)나 시간(`segment.ms`) 초과 시 새 segment 생성 |
| .index | offset을 물리 위치로 변환하는 **sparse index**(모든 offset이 아니라 일정 간격) |
| .timeindex | timestamp 기준 조회(retention, `offsetsForTimes`)에 사용 |

offset 조회 흐름:

1. 찾는 offset이 속한 segment를 base offset으로 선택합니다(파일명이 base offset).
2. 해당 segment의 `.index`(mmap된 sparse index)에서 **가장 가까운 낮은 위치**를 binary search로 찾습니다.
3. 그 지점부터 `.log`를 순차 스캔해 정확한 record를 찾습니다.

면접 포인트:

- 인덱스가 sparse라서 메모리를 적게 쓰고, mmap이라 페이지 단위로 필요한 부분만 메모리에 올라옵니다.
- retention/compaction은 **segment 단위**로 동작합니다. 오래된 segment 파일을 통째로 삭제하거나 compaction하므로 개별 record 삭제보다 효율적입니다.
- log compaction은 같은 key의 최신 값만 남기며, 삭제는 tombstone(value=null) record로 표현합니다.

### 정리: 높은 처리량의 조합

```text
순차 I/O        → 디스크 seek 제거
page cache      → 대부분의 read/write가 메모리 속도, GC 무관
zero-copy       → broker가 데이터를 복사·처리하지 않고 커널이 직접 전송
batch + 압축     → 네트워크/디스크 바이트 감소, 압축 유지로 broker CPU 절약
sparse index    → 적은 메모리로 빠른 offset lookup
```

이 다섯이 맞물려 broker 한 대가 초당 수십만~수백만 메시지를 처리할 수 있습니다. 반대로 **TLS, 압축 변환, 큰 consumer lag**은 이 최적화를 하나씩 무너뜨리는 요인이라는 점을 함께 기억하면 좋습니다.

## 9. 핵심 개념 퀴즈

### 로그 모델과 기본 구성

| 질문 | 답변 |
| --- | --- |
| Kafka의 핵심 저장 모델을 한마디로? | partitioned replicated log입니다. 메시지를 큐가 아니라 topic-partition의 append-only log에 저장합니다. |
| Kafka를 queue가 아니라 log라고 부르는 이유는? | 소비해도 메시지를 즉시 삭제하지 않고 retention 정책 동안 보관하며, consumer가 offset을 이동시키며 읽고 여러 consumer group이 독립적으로 재처리할 수 있기 때문입니다. |
| Topic과 Partition의 차이는? | Topic은 메시지의 논리적 분류(이름)이고, Partition은 실제 저장·순서 보장·병렬 처리·복제의 단위입니다. |
| 순서는 어디까지 보장되나? | partition 내부에서만 보장되고 topic 전체 순서는 보장되지 않습니다. |
| ISR이란 무엇인가? | leader와 동기화가 충분히 유지되는 replica 집합입니다. |
| Leader와 Follower replica의 역할은? | Leader는 해당 partition의 read/write를 주로 처리하고 Follower는 leader log를 복제하며, leader 장애 시 leader election으로 새 leader를 뽑습니다. |
| `replication.factor=3`, `min.insync.replicas=2`, `acks=all` 조합의 의미는? | leader만 기록하고 성공하는 것보다 손실 위험을 줄이는 안정성 기준입니다. |
| Retention 정책 세 가지는? | time retention(시간 초과 삭제), size retention(크기 초과 삭제), log compaction(같은 key의 최신 value 중심 보관)입니다. |
| Log compaction과 tombstone은? | 같은 key의 최신 value만 남기는 정책이며 삭제는 tombstone(value=null) record로 표현합니다. 즉시가 아니라 background 작업입니다. |

### Producer와 쓰기 보장

| 질문 | 답변 |
| --- | --- |
| Producer 전송 흐름은? | key/value serialize → partitioner가 partition 결정 → producer buffer에 적재 → batch로 leader에게 전송 → acks 조건 충족 시 성공 callback입니다. |
| `acks` 0/1/all의 차이와 위험은? | 0은 응답을 안 기다려 손실 확인 불가, 1은 leader 기록 후 성공이라 leader 장애 시 손실 가능, all은 ISR 복제 조건 충족 후 성공이라 latency가 증가합니다. |
| `acks=all`이면 손실이 없나? | `min.insync.replicas`가 1이면 leader만 있어도 성공할 수 있어 부족합니다. replication factor와 min ISR을 함께 봐야 하고 ISR이 부족하면 producer가 error를 받습니다. |
| Idempotent producer는 무엇으로 중복을 막나? | producer id, epoch, sequence number를 이용해 retry로 인한 같은 partition 중복 write를 broker가 제거하며, partition 내부 순서 안정성도 높입니다. |
| Idempotence 활성화의 설정 제약은? | `enable.idempotence=true`가 필요하고 `acks=all`, `retries>0`, `max.in.flight.requests.per.connection` 제약을 가집니다. |
| Idempotent producer의 한계는? | producer session과 partition write에 대한 중복 제거일 뿐 외부 DB side effect까지 보장하지는 않습니다. |
| key 기반 partitioning의 효과와 주의점은? | 같은 key는 같은 partition으로 가 순서를 지킬 수 있지만, partition 수를 늘리면 key-to-partition mapping이 바뀌고 특정 key 집중 시 hot partition이 생깁니다. |
| `linger.ms`와 `batch.size`의 trade-off는? | linger.ms는 처리량 vs latency, batch.size는 처리량 vs memory의 trade-off입니다. |

### Consumer Group과 Offset

| 질문 | 답변 |
| --- | --- |
| Consumer Group이란? | 같은 `group.id`를 가진 consumer들의 집합으로, partition을 그룹 내 consumer에게 나눠 병렬 처리합니다. |
| partition 4개에 consumer 5개면? | 1개 consumer는 idle이 됩니다. 같은 group의 병렬 처리 상한은 partition 수입니다. |
| 하나의 partition을 같은 group의 여러 consumer가 나눠 읽을 수 있나? | 아닙니다. 하나의 partition은 같은 group 안에서 동시에 하나의 consumer에게만 할당됩니다. |
| commit하는 offset이 가리키는 값은? | 보통 다음에 읽을 위치입니다. |
| auto commit이 위험한 이유는? | 처리 전에 offset이 commit되어 장애 시 메시지가 유실될 수 있습니다. |
| `commitSync()`와 `commitAsync()`의 차이는? | Sync는 실패 확인이 쉽지만 blocking 비용이 있고, Async는 빠르지만 실패 처리와 순서 관리가 필요합니다. |
| at-least-once 흐름과 장애 모드는? | poll→process→commit이며, process 후 commit 전에 죽으면 재처리, commit 후 process 전에 죽으면 유실될 수 있어 consumer 처리는 멱등해야 합니다. |
| `auto.offset.reset`의 세 값은? | earliest(가장 오래된 record부터), latest(새 record부터), none(offset 없으면 예외)이며, 운영에 earliest를 잘못 적용하면 대량 재처리가 발생합니다. |
| Poison pill 대응 방법은? | 재시도 횟수 제한, error classification, dead letter topic, 실패 record/exception context 저장, alerting, 멱등 처리입니다. 무한 재시도는 partition 전체 지연을 만듭니다. |

### Rebalancing과 Backpressure

| 질문 | 답변 |
| --- | --- |
| Rebalancing이란? | consumer group 안에서 partition assignment를 다시 계산하는 과정입니다. |
| Rebalancing 발생 조건은? | consumer 합류/이탈, heartbeat 실패, `max.poll.interval.ms` 초과, partition 수 변경, subscription topic 변화입니다. |
| Rebalancing이 왜 문제인가? | partition revocation 중 소비가 중단되고, offset commit 타이밍에 따라 중복 처리가 생기며, stateful consumer는 state restore 비용이 큽니다. |
| Rebalancing 완화 방법은? | `max.poll.records` 축소, `max.poll.interval.ms` 조정, `CooperativeStickyAssignor`, `group.instance.id` static membership, `ConsumerRebalanceListener`에서 revoke 전 offset commit/state 정리입니다. |
| poll()을 계속 호출해야 하는 이유는? | group membership을 유지하기 위해서이며, 처리 시간이 `max.poll.interval.ms`를 넘으면 consumer가 죽은 것으로 간주되어 rebalance가 발생합니다. |
| `max.poll.records`의 역할은? | 한 번에 가져오는 record 수를 제한해 poll batch 처리 시간을 예측 가능하게 만듭니다. |
| 파티션 할당 전략(assignor)에는 무엇이 있나? | Range(토픽별 파티션 순서 분배, 토픽 많으면 편중), RoundRobin(전체 파티션 고루 분배), Sticky(재할당 시 기존 할당 최대 유지), CooperativeSticky(전체 revoke 없이 필요한 파티션만 점진 이동)입니다. |
| downstream이 느릴 때 backpressure 대응은? | `pause()`로 특정 partition fetch를 일시 중단하고 처리 후 `resume()`하며, external queue에 무제한 적재하지 않고 circuit breaker와 DLQ를 함께 설계합니다. |

### 전달 보장과 Exactly Once

| 질문 | 답변 |
| --- | --- |
| 세 가지 전달 보장과 조건은? | at-most-once(처리 전 commit, 유실 가능), at-least-once(처리 후 commit, 중복 가능), exactly-once(idempotence + transaction)입니다. |
| at-least-once가 중복을 만드는 이유는? | 처리 후 commit 전에 장애가 나면 같은 record를 다시 읽기 때문입니다. |
| Kafka EOS의 구성 요소는? | Idempotent Producer, Transactional Producer, `sendOffsetsToTransaction`, `read_committed`입니다. |
| EOS 처리 흐름은? | beginTransaction → consume → process → produce → sendOffsetsToTransaction → commitTransaction입니다. |
| `read_committed`의 역할은? | commit된 transaction의 메시지만 읽습니다. |
| Kafka EOS가 외부 DB/API까지 보장하나? | 아닙니다. Kafka topic 간 read-process-write에 강하며 외부 DB는 transactional outbox, CDC, idempotency로 다뤄야 합니다. |
| 실무에서 외부 side effect는 어떻게 설계하나? | 대부분 at-least-once + idempotency로 설계하며, DB write는 unique constraint/idempotency key/processed event table, 외부 API는 request idempotency key를 씁니다. |
| Transactional Outbox 패턴은? | business table update와 outbox table insert를 같은 DB transaction으로 commit한 뒤 CDC/poller가 outbox event를 Kafka로 publish합니다. consumer idempotency와 aggregate key 기준 ordering이 필요합니다. |

### 파티션 설계와 운영

| 질문 | 답변 |
| --- | --- |
| partition 수는 무엇을 고려해 정하나? | 목표 처리량, consumer 병렬성, broker 부하 분산, replication traffic, file handle/page cache, rebalancing 비용, key 순서 요구, hot key/hot partition 가능성입니다. |
| partition 수 변경의 비대칭성은? | 늘릴 수는 있지만 줄이기 어렵고, 운영 중 추가는 key-to-partition mapping과 순서 보장에 영향을 줍니다. |
| partition이 너무 많으면 무엇이 늘어나나? | controller/broker metadata, file handle, recovery 비용이 증가합니다. |
| consumer lag의 정의와 원인은? | consumer가 최신 log end offset에 얼마나 뒤처졌는지를 나타내며, producer 증가/consumer 처리 지연/downstream 지연/hot key가 원인입니다. |
| 특정 partition만 lag가 크면 무엇을 의심하나? | hot key를 의심합니다. |
| 봐야 할 운영 지표에는 무엇이 있나? | consumer lag, consumed/produced rate, request latency, under-replicated partitions, offline partitions, ISR shrink/expand, rebalance count/time입니다. |
| offset out of range 사고 시나리오와 대응은? | consumer 장애가 오래 지속돼 lag가 retention을 넘으면 committed offset의 record가 삭제되어 발생합니다. 중요한 topic은 retention을 복구 시간보다 길게 잡고 lag alert과 offset reset 절차를 둡니다. |
| Schema evolution 전략과 위험은? | JSON+version, Avro/Protobuf/JSON Schema+Schema Registry, backward/forward 호환 규칙을 씁니다. 필드 삭제·타입 변경·required 필드 추가는 호환성을 깨기 쉬워 event를 API 계약처럼 관리해야 합니다. |

### Streams / Connect / 비교

| 질문 | 답변 |
| --- | --- |
| Kafka Streams와 Kafka Connect의 차이는? | Streams는 Kafka topic 간 실시간 처리 Java library(filter/map/join/aggregate)이고, Connect는 외부 시스템과 Kafka를 연결하는 worker framework(DB source, S3/Elasticsearch sink)입니다. |
| Kafka Streams의 상태 관리 방식은? | state store와 changelog topic으로 상태를 관리합니다. |
| Kafka Connect의 확장 방식은? | worker/connector/task를 분산해 확장합니다. |
| 복잡한 stream processing의 대안은? | Flink, Spark Streaming 등과 비교할 수 있습니다. |
| Kafka와 RabbitMQ의 모델·보존 차이는? | Kafka는 분산 append-only log로 소비 후에도 보존 기간 동안 유지하고, RabbitMQ는 queue+exchange로 ACK 후 queue에서 제거합니다. |
| 재처리 관점에서 Kafka와 RabbitMQ 차이는? | Kafka는 offset reset으로 재처리가 쉽고 RabbitMQ는 기본적으로 어렵습니다. |
| Kafka를 쓰지 않아도 되는 경우는? | 단순 비동기 작업 큐만 필요하거나, 장기 보관·재처리가 불필요하거나, 순서·보장이 단순하거나, broker/schema/lag/idempotency 운영 여력이 없을 때입니다. |
| Kafka의 대안에는 무엇이 있나? | RabbitMQ/SQS 같은 queue, DB outbox + worker, Redis Stream, managed event bus입니다. |

### 심화: 내부 동작 원리

| 질문 | 답변 |
| --- | --- |
| 디스크 기반인데 빠른 이유 세 가지는? | 순차(sequential) I/O, OS page cache, zero-copy가 맞물려 디스크와 네트워크 병목을 줄이기 때문입니다. |
| 순차 write가 빠른 이유는? | log 끝에만 append하므로 디스크 head 이동(seek)이 없어 random write보다 수백 배 빠릅니다. |
| Kafka는 내구성을 어떻게 확보하나? | fsync를 매 메시지마다 강제하지 않고 복제(replication)로 확보합니다. 손실 방어선은 디스크 flush가 아니라 다른 broker로의 복제입니다. |
| broker가 JVM heap 대신 page cache에 의존하는 이유는? | heap에 대용량 데이터를 두면 GC pause가 커지는데 page cache는 GC와 무관하고, 재시작 후에도 warm 상태로 유지되며, 애플리케이션 캐시와 page cache의 중복 보관을 피할 수 있습니다. |
| lag와 page cache의 관계는? | lag가 작아 최신 offset을 읽으면 대부분 page cache hit라 디스크를 거의 안 치지만, lag가 커져 오래된 offset을 읽으면 page cache miss로 디스크 read가 늘어납니다. |
| zero-copy는 복사를 몇 번에서 몇 번으로 줄이나? | 전통적 read()+send()의 4회 복사(disk→page cache DMA, page cache→user buffer CPU, user buffer→socket buffer CPU, socket→NIC DMA)를 sendfile로 2회 DMA(disk→page cache, page cache→NIC scatter-gather)로 줄여 CPU 복사 2회와 context switch를 제거합니다. |
| zero-copy가 깨지는 경우는? | TLS/SSL 암호화는 user space(또는 kernel TLS)에서 이뤄져야 해 sendfile 경로가 깨지고, broker가 메시지를 재압축/변환하면 데이터를 user space로 올려야 해 zero-copy를 못 씁니다. |
| record batch 압축이 end-to-end로 유지되면 뭐가 좋은가? | producer가 batch로 묶어 압축하면 broker가 풀지 않고 그대로 저장·전송하므로 zero-copy가 유지되고 broker CPU도 아낍니다. producer-broker 압축 타입이 불일치하면 재압축으로 이 이점이 사라집니다. |
| log segment와 인덱스 구조는? | partition은 여러 segment 파일(.log, .index, .timeindex)로 나뉘며, .log 파일명이 base offset이고 .index는 offset→물리 위치의 sparse index, active segment에만 write하며 `segment.bytes`/`segment.ms` 초과 시 roll합니다. |
| offset 조회 흐름은? | base offset으로 segment를 선택하고, mmap된 sparse `.index`에서 binary search로 가장 가까운 낮은 위치를 찾은 뒤 그 지점부터 `.log`를 순차 스캔합니다. retention/compaction은 segment 단위로 동작합니다. |

## 참고한 공식 문서

- Apache Kafka Introduction: https://kafka.apache.org/documentation/#gettingStarted
- Apache Kafka Design: https://kafka.apache.org/documentation/#design
- Kafka Producer Configs: https://kafka.apache.org/documentation/#producerconfigs
- Kafka Consumer Configs: https://kafka.apache.org/documentation/#consumerconfigs
- Kafka Operations: https://kafka.apache.org/documentation/#operations
- Kafka Streams: https://kafka.apache.org/documentation/streams/
- Kafka Connect: https://kafka.apache.org/documentation/#connect
- KafkaConsumer Javadoc: https://kafka.apache.org/41/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html
- (커뮤니티 면접 정리) Backend Interview for Beginner — Kafka: https://github.com/backtony/Backend_Interview_for_Beginner/blob/master/Kafka.md
