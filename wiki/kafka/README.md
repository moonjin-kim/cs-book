# Kafka

Kafka는 이벤트를 파티션 로그에 저장하고 consumer가 offset을 기준으로 읽게 만드는 분산 스트리밍 플랫폼입니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| Topic/Partition | 순서 보장 범위와 병렬성은 무엇으로 결정되는가? |
| Producer | key, batch, ack, retry, idempotence는 어떤 trade-off를 만드는가? |
| Consumer Group | group rebalance와 partition assignment는 처리량에 어떤 영향을 주는가? |
| Offset | commit 시점이 중복 처리와 유실 가능성을 어떻게 바꾸는가? |
| 전달 보장 | at-most-once, at-least-once, exactly-once의 조건과 비용은 무엇인가? |

## 실무 판단

- Kafka는 기본적으로 "중복될 수 있음"을 전제로 consumer 멱등성을 설계합니다.
- 파티션 키는 순서 보장과 hot partition 위험을 동시에 결정합니다.
- lag는 지연의 결과 지표이며 원인은 처리 시간, rebalance, downstream 병목일 수 있습니다.

## 기본 구성 요소

Kafka는 broker, topic, partition, producer, consumer로 구성됩니다. Broker는 Kafka cluster를 이루는 서버 노드이며 partition log를 디스크에 저장하고 producer/consumer 요청을 처리합니다. Topic은 메시지의 논리적 카테고리이고, 실제 저장과 병렬 처리 단위는 partition입니다.

Partition은 append-only log입니다. Partition 내부에서는 record 순서가 보장되지만 partition 간 전역 순서는 보장되지 않습니다. 각 partition은 replication factor에 따라 여러 broker에 복제되고, 하나의 leader와 여러 follower를 가집니다. Producer는 topic에 record를 쓰며 key가 있으면 보통 key hash로 partition을 결정합니다. Consumer는 topic을 읽고 처리하며 offset으로 읽은 위치를 관리합니다.

초기 Kafka는 ZooKeeper로 cluster metadata를 관리했지만, 최근 Kafka는 KRaft 모드로 ZooKeeper 의존성을 제거하는 방향입니다.

## Consumer Group과 Rebalancing

같은 `group.id`를 가진 consumer들은 하나의 consumer group을 이룹니다. 하나의 partition은 같은 group 안에서 동시에 하나의 consumer에게만 할당됩니다. 따라서 병렬 처리 상한은 partition 수입니다. Consumer가 partition 수보다 많으면 일부 consumer는 할당받을 partition이 없어 쉬게 됩니다.

서로 다른 consumer group은 같은 topic을 독립적으로 읽습니다. 예를 들어 주문 처리 group과 분석 group은 같은 주문 topic을 각자의 offset으로 소비할 수 있습니다.

Partition assignment 전략은 Range, RoundRobin, Sticky, CooperativeSticky 등이 있습니다. Sticky는 기존 할당을 최대한 유지해 상태 재구성 비용을 줄이고, CooperativeSticky는 영향받지 않는 partition은 계속 소비하게 해 stop-the-world rebalancing 충격을 줄입니다.

Rebalancing은 consumer 합류/이탈, heartbeat 실패, `max.poll.interval.ms` 초과, partition 수 변경 시 발생합니다. 전통적인 rebalancing은 모든 consumer가 할당을 반납하고 다시 받는 동안 소비가 멈춥니다. 운영에서는 `max.poll.records`를 줄여 처리 시간을 짧게 유지하고, 처리 시간이 길면 `max.poll.interval.ms`를 조정하며, `group.instance.id`로 static membership을 적용해 불필요한 rebalancing을 줄입니다.

## 순서 보장

Kafka는 partition 단위로만 순서를 보장합니다. 같은 주문의 `created -> paid -> shipped` 순서가 중요하다면 주문 ID를 message key로 사용해 같은 주문 이벤트가 같은 partition으로 들어가게 해야 합니다. Topic 전체 전역 순서가 필요하면 partition을 1개로 둬야 하지만 처리량 확장이 제한됩니다.

Producer 설정도 순서에 영향을 줍니다. `max.in.flight.requests.per.connection`이 1보다 크고 retry가 발생하면 batch 순서가 뒤집힐 수 있습니다. `enable.idempotence=true`를 사용하면 producer id와 sequence number로 중복과 순서를 제어하므로 일반적으로 권장됩니다. Consumer 내부에서 thread pool로 비동기 처리하면 partition 순서가 깨질 수 있으므로, 순서가 중요하면 partition 또는 key 단위 직렬 처리를 유지합니다.

## Offset과 Commit

Offset은 partition 안 record의 순차 위치입니다. Consumer offset은 `__consumer_offsets` 내부 topic에 저장됩니다. Offset commit은 "여기까지 처리했다"는 진행 상태 저장이며, consumer 재시작 시 마지막 commit 다음 offset부터 읽습니다.

Auto commit은 편하지만 처리 전에 commit될 수 있어 유실 위험이 있습니다. 실무에서는 `enable.auto.commit=false`로 두고 처리 후 수동 commit하는 경우가 많습니다. `commitSync()`는 안전하지만 blocking 비용이 있고, `commitAsync()`는 빠르지만 실패 재시도와 순서 관리가 필요합니다.

일반적인 at-least-once 패턴은 poll, process, commit 순서입니다. 처리 후 commit 전에 장애가 나면 같은 메시지를 다시 처리할 수 있으므로 consumer 로직은 멱등해야 합니다.

## Producer acks와 복제

`acks`는 producer가 전송 성공으로 간주하기 위해 broker로부터 얼마나 확인받을지를 정합니다.

| 설정 | 의미 | trade-off |
| --- | --- | --- |
| `acks=0` | 응답을 기다리지 않음 | 가장 빠르지만 손실을 알 수 없음 |
| `acks=1` | leader 기록 후 성공 | follower 복제 전 leader 장애 시 손실 가능 |
| `acks=all` | ISR 기준 복제 확인 후 성공 | 가장 안전하지만 지연 증가 |

Kafka 3.0부터 producer 기본값은 안정성 중심으로 바뀌어 `acks=all`, idempotence enabled 쪽에 가깝습니다. 데이터 손실을 줄이려면 `replication.factor=3`, `min.insync.replicas=2`, `acks=all`, `enable.idempotence=true` 조합을 고려합니다. ISR 수가 `min.insync.replicas`보다 작으면 write가 거부되어 가용성은 낮아질 수 있지만 손실 위험은 줄어듭니다.

## Exactly Once Semantics

Kafka EOS는 idempotent producer와 transaction을 조합합니다. Idempotent producer는 PID와 partition별 sequence number로 broker가 중복 record를 제거하게 합니다. Transactional producer는 여러 partition write와 consumed offset commit을 하나의 transaction으로 묶어 read-process-write 패턴을 안전하게 만듭니다.

Consumer는 `isolation.level=read_committed`로 설정해야 abort된 transaction record를 건너뜁니다. 단, Kafka의 exactly-once는 Kafka 내부 read/write에 대한 보장입니다. 외부 DB나 API 호출까지 정확히 한 번으로 만들려면 outbox, idempotency key, unique constraint 같은 애플리케이션 설계가 필요합니다.

## Partition 수 설계

Partition 수는 처리량, 병렬성, 운영 비용을 함께 봐야 합니다. Consumer group의 병렬 처리 상한은 partition 수이고, broker 수의 배수로 두면 부하 분산에 유리합니다. 하지만 partition이 많으면 replication traffic, file handle, page cache, controller metadata, rebalance 비용이 증가합니다.

운영 중 partition 수는 늘릴 수 있지만 줄일 수 없습니다. 또한 partition을 늘리면 key hash mapping이 바뀌어 같은 key의 새 이벤트가 다른 partition으로 갈 수 있으므로 순서 보장 요구가 있는 topic은 특히 조심해야 합니다.

## Kafka Streams와 Kafka Connect

Kafka Streams는 topic의 데이터를 실시간으로 filter, map, aggregate, join하는 Java library입니다. 별도 cluster 없이 애플리케이션에 embedded되고, state store와 `processing.guarantee=exactly_once_v2`를 지원합니다.

Kafka Connect는 외부 시스템과 Kafka 사이 데이터 이동을 담당합니다. Source connector는 DB, file, API에서 Kafka로 데이터를 넣고, Sink connector는 Kafka topic을 Elasticsearch, S3, DB 등에 씁니다. Connect는 worker cluster, task 분산, offset 관리, SMT를 제공합니다.

정리하면 Connect는 Kafka 경계의 입출력, Streams는 Kafka 내부 topic 간 처리에 적합합니다.

## Kafka와 RabbitMQ

Kafka는 partitioned append-only log입니다. 메시지는 소비해도 사라지지 않고 보존 기간 동안 남아 replay가 쉽습니다. 대규모 이벤트 스트리밍, 로그 수집, 이벤트 소싱, 실시간 분석에 적합합니다.

RabbitMQ는 queue와 exchange 기반 message broker입니다. Consumer ACK 후 메시지가 queue에서 제거되는 작업 큐 모델에 자연스럽고, AMQP exchange를 통한 복잡한 routing, priority, TTL, DLQ 같은 기능이 강합니다.

핵심 차이는 메시지를 로그로 볼 것인지 큐로 볼 것인지입니다. 여러 consumer가 같은 이벤트 이력을 각자 재처리해야 하면 Kafka, 복잡한 routing과 전통적인 작업 분배가 중요하면 RabbitMQ가 자연스럽습니다.
