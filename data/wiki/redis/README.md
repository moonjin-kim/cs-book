# Redis

Redis는 빠른 key-value cache이면서 동시에 다양한 인메모리 자료구조와 운영 패턴을 제공하는 서버입니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| 자료구조 | String, Hash, Set, Sorted Set, Stream은 각각 어떤 문제에 맞는가? |
| 캐시 전략 | cache-aside, write-through, TTL은 일관성과 성능을 어떻게 바꾸는가? |
| 분산 락 | lock timeout, fencing token, unlock 안전성은 왜 중요한가? |
| RDB/AOF | snapshot과 append-only log는 복구성과 성능을 어떻게 trade-off하는가? |
| 복제/클러스터 | replica lag, failover, hash slot은 어떤 장애 시나리오를 만드는가? |

## 실무 판단

- Redis는 메모리 저장소이므로 key 크기, TTL, eviction policy를 운영 지표로 봐야 합니다.
- 캐시는 원본 DB의 대체물이 아니라 읽기 경로 최적화입니다.
- 분산 락은 정합성의 마지막 수단으로 보고 가능한 한 DB 제약이나 멱등 설계를 우선합니다.

## 주요 데이터 타입

Redis는 값으로 여러 자료구조를 제공하는 data structure server입니다. 어떤 값을 저장할지보다 어떤 연산을 빠르게 해야 하는지를 기준으로 타입을 고르는 것이 중요합니다.

| 타입 | 특징 | 사용 사례 |
| --- | --- | --- |
| String | 기본 타입, 문자열/숫자/JSON 저장, `INCR`, `DECR`, `SET EX` 지원 | 단순 캐시, token, counter |
| List | 양 끝 삽입/삭제가 빠른 순서 컬렉션 | 작업 큐, 최근 본 상품 |
| Hash | key 하나 안의 field-value map | 사용자 프로필, 세션, 설정 |
| Set | 중복 없는 집합, 교집합/합집합/차집합 | 태그, 팔로워, 유니크 방문자 |
| Sorted Set | member에 score를 붙여 정렬 | 랭킹, 우선순위 큐, 시간순 feed |
| Bitmap | bit 단위 flag 조작 | 출석, 방문 여부, feature flag |
| HyperLogLog | 적은 메모리로 approximate distinct count | 대규모 UV 추정 |
| Geo | 위경도 기반 거리/반경 검색 | 주변 매장 찾기 |
| Stream | append-only event log와 consumer group | 이벤트 처리, 작업 큐 |

객체를 통째로 JSON String에 넣으면 읽고 쓰기는 단순하지만 부분 필드 갱신이 어렵습니다. 필드 단위 갱신과 조회가 중요하면 Hash가 더 적합합니다.

## Redis Single Thread

Redis는 command execution을 단일 스레드 event loop로 순차 처리하도록 설계됐습니다. 덕분에 명령 실행 중 공유 자료구조에 대한 복잡한 lock이 필요 없고, context switching 비용이 작으며, 대부분의 작업이 메모리에서 빠르게 끝납니다.

단일 스레드라는 말은 모든 일이 항상 한 스레드라는 뜻은 아닙니다. Redis는 background save, AOF rewrite 같은 작업을 별도 프로세스/스레드로 처리할 수 있고, Redis 6부터는 client socket read/write 같은 network I/O에 multi-thread를 사용할 수 있습니다. 다만 실제 command 실행은 순차적으로 처리되어 atomic 성질을 유지합니다.

주의할 점은 오래 걸리는 명령입니다. 큰 key에 대한 `KEYS`, 큰 collection 전체 조회, 무거운 Lua script는 event loop를 막아 전체 지연을 키울 수 있습니다.

## RDB와 AOF

Redis는 인메모리 저장소지만 persistence 옵션으로 재시작 후 데이터를 복구할 수 있습니다.

RDB는 특정 시점의 메모리 snapshot을 `dump.rdb` 같은 binary file로 저장합니다. 파일이 작고 로딩이 빠르며 backup과 replica 초기화에 유리합니다. 다만 snapshot 사이의 변경분은 장애 시 유실될 수 있고, 큰 instance에서는 `BGSAVE` fork 비용과 copy-on-write 메모리 부담이 생깁니다.

AOF는 write command를 append-only log로 기록하고 재시작 시 replay합니다. `appendfsync always`는 손실을 최소화하지만 느리고, `everysec`는 보통 최대 1초 손실을 감수하는 균형점이며, `no`는 OS flush에 맡깁니다. AOF는 RDB보다 파일이 커지고 복구가 느릴 수 있어 rewrite가 필요합니다.

중요 데이터는 RDB와 AOF를 함께 쓰는 구성을 고려합니다. 단순 캐시라면 persistence를 끄거나 RDB만으로도 충분할 수 있습니다. Redis 4.0 이후 혼합 persistence를 사용하면 AOF file 안에 RDB preamble을 포함해 복구 속도와 손실 범위의 균형을 잡을 수 있습니다.

## Redis Cluster와 Sentinel

Redis Cluster는 공식 sharding 솔루션입니다. key space를 0~16383까지 16384개 hash slot으로 나누고, 각 master node가 slot의 일부를 담당합니다.

```text
slot = CRC16(key) mod 16384
```

여러 key를 같은 slot에 둬야 하면 hash tag를 사용합니다. `user:{1000}:profile`, `user:{1000}:orders`는 `{1000}`만 hashing하므로 같은 slot에 배치됩니다. Cluster에서 multi-key command, transaction, Lua script는 관련 key가 같은 slot에 있어야 합니다.

Sentinel은 sharding이 아니라 HA 도구입니다. 단일 master-replica dataset을 감시하고 master 장애 시 replica를 승격합니다. Cluster는 hash slot 기반 data distribution과 master-replica failover를 함께 제공합니다.

| 항목 | Sentinel | Cluster |
| --- | --- | --- |
| 목적 | 고가용성 | 수평 확장 + 고가용성 |
| 데이터 분산 | 없음 | hash slot sharding |
| 용량 한계 | 단일 master 메모리 | node 수에 비례 |
| multi-key 연산 | 자유로움 | 같은 slot 제약 |
| client 요구 | Sentinel 조회 | cluster topology와 redirect 처리 |

Cluster resharding 중 slot 이동 상황에서는 `ASK` redirect가, slot 소유권이 완전히 바뀐 뒤에는 `MOVED` redirect가 발생합니다. client library가 이를 올바르게 처리해야 합니다.

## Pipelining

Pipelining은 여러 Redis command를 한 번에 보내고 응답도 한 번에 받아 network RTT를 줄이는 최적화입니다. Redis command 자체는 빠르지만 command마다 왕복이 발생하면 지연이 커집니다. 수백~수천 개의 반복 `SET`, `DEL`, counter update, 초기 데이터 적재에 효과적입니다.

Pipelining은 transaction이 아닙니다. 명령을 묶어 보내는 network 최적화일 뿐이며 원자성을 보장하려면 `MULTI/EXEC`나 Lua script를 고려해야 합니다. pipeline이 너무 크면 client/server buffer 메모리와 단일 batch 응답 지연이 커지므로 적절히 나누어 실행합니다.

## Redis Transaction

Redis transaction은 `MULTI` 이후 명령을 queue에 쌓고 `EXEC` 시점에 원자적으로 순차 실행합니다. 실행 중에는 다른 client command가 끼어들지 않습니다.

RDBMS transaction과 가장 큰 차이는 rollback이 없다는 점입니다. Queue 단계의 문법 오류는 `EXEC` 자체가 실패할 수 있지만, 실행 중 타입 오류 같은 runtime error는 해당 command만 실패하고 나머지는 실행됩니다. 따라서 command 설계를 멱등하고 부분 실패에 안전하게 해야 합니다.

동시 수정 감지는 `WATCH`로 합니다. `WATCH key` 이후 `EXEC` 전에 key가 다른 client에 의해 변경되면 `EXEC`는 실패하고 client가 재시도합니다. Cluster에서는 transaction 대상 key들이 같은 slot에 있어야 합니다.

## Key Eviction

`maxmemory`를 설정하면 Redis는 메모리 상한에 도달했을 때 eviction policy에 따라 key를 제거하거나 write를 거부합니다.

| 정책 | 대상 | 동작 |
| --- | --- | --- |
| `noeviction` | 없음 | 메모리 초과 write에 error 반환 |
| `allkeys-lru` | 모든 key | 근사 LRU로 오래 안 쓴 key 제거 |
| `allkeys-lfu` | 모든 key | 접근 빈도가 낮은 key 제거 |
| `volatile-lru`/`volatile-lfu` | TTL 있는 key | TTL key 중 LRU/LFU 제거 |
| `volatile-ttl` | TTL 있는 key | 만료가 임박한 key 제거 |
| `allkeys-random`/`volatile-random` | 정책별 대상 | 무작위 제거 |

Redis LRU는 정확한 전역 LRU가 아니라 sample 기반 approximate LRU입니다. `maxmemory-samples`가 클수록 정확도는 올라가지만 CPU 비용도 증가합니다. 캐시 용도는 보통 `allkeys-lru`나 `allkeys-lfu`를 사용하고, 영구 key와 cache key를 섞어야 한다면 TTL이 있는 key만 제거하는 volatile 계열을 검토합니다.

`evicted_keys`가 계속 증가하면 단순히 정책 문제가 아니라 메모리 부족, TTL 설계 오류, cache hit ratio 저하 신호일 수 있습니다.

## Redis 분산 락과 RedLock

Redis 분산 락은 보통 `SET key value NX PX ttl`로 구현합니다. `NX`는 key가 없을 때만 성공하고, `PX`는 lease 만료 시간을 설정합니다. `value`에는 lock 소유자를 식별할 random token을 넣고, 해제 시 token이 일치할 때만 삭제해야 다른 클라이언트가 새로 얻은 lock을 지우지 않습니다.

복제 환경에서는 lock 유실 가능성이 있습니다. master가 lock을 받은 직후 replica로 복제되기 전에 장애가 나고 replica가 승격되면, 새 master에는 lock key가 없어 다른 서버가 동시에 lock을 얻을 수 있습니다.

RedLock은 여러 독립 Redis 노드에 lock 획득을 시도해 과반수 성공 시 lock 획득으로 판단합니다. 예를 들어 5개 노드 중 3개 이상에서 성공하면 lock을 얻은 것으로 봅니다. 전체 획득 시간이 TTL보다 충분히 작아야 하며, 유효 시간은 TTL에서 경과 시간을 뺀 값으로 봅니다. 해제는 성공/실패 여부와 관계없이 모든 노드에 시도합니다.

RedLock은 완전한 합의 알고리즘이 아니며 논쟁이 있습니다. client가 lock을 얻은 뒤 GC stop-the-world나 네트워크 지연으로 TTL을 넘기면 다른 client가 새 lock을 얻을 수 있습니다. 엄격한 상호 배제가 필요한 돈, 재고, 외부 자원 제어에는 fencing token, DB constraint, ZooKeeper/etcd 같은 consensus 기반 도구를 함께 검토합니다.

## Pub/Sub과 Stream

Pub/Sub은 실시간 broadcast 모델입니다. publisher가 channel에 메시지를 보내면 현재 subscribe 중인 client에게 전달됩니다. 메시지를 저장하지 않으므로 subscriber가 끊겨 있으면 메시지는 유실됩니다. 실시간 알림, presence, 단순 fanout에 적합합니다.

Stream은 append-only log입니다. `XADD`로 메시지를 저장하고, ID를 기준으로 과거 메시지를 다시 읽을 수 있습니다. Consumer group, pending entries, ACK를 제공하므로 여러 consumer가 메시지를 나누어 처리하고 실패한 메시지를 추적할 수 있습니다. 작업 큐, 이벤트 처리, 유실되면 안 되는 비동기 처리에 Pub/Sub보다 적합합니다.

대규모 메시징, 긴 보존 기간, partition 기반 확장, 풍부한 consumer ecosystem이 필요하면 Kafka 같은 전용 broker가 더 적합할 수 있습니다.

## 캐시 패턴

Cache-Aside는 애플리케이션이 cache를 먼저 읽고 miss면 DB를 조회한 뒤 cache에 채웁니다. 구현이 단순하고 cache 장애 시 DB fallback이 가능해 가장 널리 쓰입니다. 단점은 miss 순간 DB 부하가 몰릴 수 있고, DB 갱신 후 cache invalidation을 놓치면 stale data가 생긴다는 점입니다.

Read-Through는 애플리케이션이 cache만 바라보고 cache layer가 DB load를 담당합니다. Write-Through는 쓰기 때 cache와 DB를 함께 갱신해 일관성을 높이지만 write latency가 증가합니다. Write-Behind는 cache에 먼저 쓰고 비동기로 DB에 반영해 빠르지만 cache 장애 시 데이터 손실 위험이 큽니다.

무효화는 TTL 기반, DB 변경 이벤트 기반 삭제/갱신, version key 방식이 있습니다. 일반적인 실무 기본값은 Cache-Aside + TTL이며, 정합성이 중요한 경로에는 이벤트 기반 invalidation을 추가합니다.

Cache stampede는 인기 key가 만료되는 순간 많은 요청이 동시에 DB로 몰리는 현상입니다. 분산 락으로 한 요청만 rebuild하게 하거나, TTL 만료 전 background refresh, probabilistic early recomputation, TTL jitter를 적용해 완화합니다.
