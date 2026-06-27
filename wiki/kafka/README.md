# Kafka

Kafka 면접은 **메시지를 큐가 아니라 파티션 로그로 저장하고, Consumer가 offset으로 처리 위치를 관리한다는 점**을 설명하는 것이 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| Topic | 메시지의 논리적 분류입니다. |
| Partition | 저장, 순서 보장, 병렬 처리의 실제 단위입니다. |
| Broker | 파티션 로그를 저장하고 Producer/Consumer 요청을 처리합니다. |
| Producer | key, batch, acks, retry 설정으로 메시지를 기록합니다. |
| Consumer Group | 파티션을 그룹 내 Consumer에게 나눠 병렬 처리합니다. |
| Offset | Consumer가 어디까지 처리했는지 나타냅니다. |
| Rebalancing | Consumer 변화 시 파티션 할당을 다시 계산합니다. |

## 기본 구성 요소

| 구성 요소 | 역할 |
| --- | --- |
| Broker | Kafka 서버 노드, 파티션 로그 저장 |
| Topic | 메시지의 논리적 카테고리 |
| Partition | append-only log, 순서 보장 단위 |
| Producer | 메시지 발행 |
| Consumer | 메시지 소비 |
| Consumer Group | 여러 Consumer의 병렬 처리 단위 |

순서 보장:

- 파티션 내부 순서만 보장됩니다.
- 토픽 전체 순서는 보장되지 않습니다.
- 같은 엔티티의 순서가 중요하면 같은 key를 사용해 같은 파티션으로 보내야 합니다.

## Consumer Group

같은 `group.id`를 가진 Consumer들은 하나의 그룹입니다.

| 조건 | 결과 |
| --- | --- |
| 파티션 4개, Consumer 2개 | 각 Consumer가 2개 파티션 처리 |
| 파티션 4개, Consumer 4개 | 1:1 처리 |
| 파티션 4개, Consumer 5개 | 1개 Consumer는 idle |

핵심:

- 병렬 처리 상한은 파티션 수입니다.
- 서로 다른 Consumer Group은 같은 Topic을 독립적으로 읽습니다.

## Rebalancing

Rebalancing은 파티션 할당을 다시 계산하는 과정입니다.

발생 조건:

- Consumer 합류
- Consumer 이탈
- heartbeat 실패
- `max.poll.interval.ms` 초과
- 파티션 수 변경

문제:

- 전통적인 rebalance는 소비 중단을 만들 수 있습니다.
- stateful consumer는 상태 재구성 비용이 큽니다.

완화:

- `max.poll.records` 줄이기
- `max.poll.interval.ms` 조정
- `CooperativeStickyAssignor` 사용
- `group.instance.id`로 static membership 적용

## Offset과 Commit

Offset은 파티션 안에서 record 위치입니다.

| 커밋 방식 | 특징 | 주의 |
| --- | --- | --- |
| auto commit | 편함 | 처리 전 commit되어 유실 가능 |
| `commitSync()` | 안전 | blocking 비용 |
| `commitAsync()` | 빠름 | 실패 처리와 순서 관리 필요 |

일반적인 at-least-once 흐름:

```text
poll -> process -> commit
```

장애 시:

- process 후 commit 전 죽으면 재처리됩니다.
- 따라서 Consumer 처리는 멱등해야 합니다.

## Producer 설정

### acks

| 설정 | 의미 | trade-off |
| --- | --- | --- |
| `acks=0` | 응답을 기다리지 않음 | 빠르지만 손실 확인 불가 |
| `acks=1` | leader 기록 후 성공 | leader 장애 시 손실 가능 |
| `acks=all` | ISR 복제 확인 후 성공 | 안전하지만 지연 증가 |

안정성 조합:

```text
replication.factor=3
min.insync.replicas=2
acks=all
enable.idempotence=true
```

### Idempotent Producer

멱등 Producer는 PID와 sequence number로 중복 record를 broker가 제거하게 합니다.

효과:

- retry로 인한 중복 감소
- 파티션 내부 순서 안정화

## 메시지 순서

Kafka는 파티션 단위 순서만 보장합니다.

예:

```java
producer.send(new ProducerRecord<>("orders", orderId, event));
```

같은 `orderId`는 같은 파티션으로 가므로 주문 상태 이벤트 순서를 지킬 수 있습니다.

주의:

- 파티션 수를 늘리면 key-to-partition mapping이 바뀔 수 있습니다.
- Consumer 내부에서 thread pool로 병렬 처리하면 순서가 깨질 수 있습니다.

## 전달 보장

| 보장 | 의미 | 조건 |
| --- | --- | --- |
| At-most-once | 최대 한 번 처리, 유실 가능 | 처리 전 commit |
| At-least-once | 최소 한 번 처리, 중복 가능 | 처리 후 commit |
| Exactly-once | Kafka 내부 read/write를 정확히 한 번처럼 처리 | idempotence + transaction |

주의:

- Kafka EOS는 Kafka 내부 처리에 대한 보장입니다.
- 외부 DB/API까지 exactly-once가 되려면 outbox, idempotency key, unique constraint가 필요합니다.

## Exactly Once Semantics

구성 요소:

| 요소 | 역할 |
| --- | --- |
| Idempotent Producer | 중복 write 제거 |
| Transactional Producer | 여러 파티션 write와 offset commit을 하나로 묶음 |
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

## 파티션 수 설계

고려 요소:

- 목표 처리량
- Consumer 병렬성
- Broker 수와 부하 분산
- replication traffic
- file handle, page cache
- rebalancing 비용
- key 순서 보장 요구

주의:

- 파티션 수는 늘릴 수 있지만 줄일 수 없습니다.
- 운영 중 파티션 추가는 key 순서 보장에 영향을 줄 수 있습니다.

## Kafka Streams와 Kafka Connect

| 구분 | Kafka Streams | Kafka Connect |
| --- | --- | --- |
| 역할 | Kafka topic 간 실시간 처리 | 외부 시스템과 Kafka 연결 |
| 형태 | Java library | Worker framework |
| 사용 | filter, map, join, aggregate | DB source, S3 sink, Elasticsearch sink |
| 상태 관리 | state store 지원 | connector offset 관리 |

정리:

- Kafka 내부 데이터 가공은 Streams
- 외부 시스템 입출력은 Connect

## Kafka vs RabbitMQ

| 구분 | Kafka | RabbitMQ |
| --- | --- | --- |
| 모델 | 분산 append-only log | queue + exchange |
| 메시지 보존 | 소비 후에도 보존 기간 동안 유지 | ACK 후 queue에서 제거 |
| 재처리 | offset reset으로 쉬움 | 기본적으로 어려움 |
| 처리량 | 매우 높음 | 높지만 Kafka보다 낮은 편 |
| 라우팅 | 단순 | exchange 기반 복잡한 routing |
| 적합 | 이벤트 스트리밍, 로그, 분석 | 작업 큐, RPC, 복잡한 routing |

핵심 차이:

- Kafka는 메시지를 로그로 봅니다.
- RabbitMQ는 메시지를 큐로 봅니다.
