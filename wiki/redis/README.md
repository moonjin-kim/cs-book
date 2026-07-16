# Redis

Redis 면접은 **빠른 캐시로만 보는 것이 아니라 자료구조, 메모리 정책, 영속화, 고가용성, 분산 락, 메시징 모델까지 설명하는 것**이 핵심입니다.

처음부터 끝까지 읽기보다 아래 핵심 섹션 단위로 나눠 보는 편이 효율적입니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | 자료구조와 명령 실행 모델 | String, Hash, Set, Sorted Set, Stream을 언제 쓰고 단일 스레드 실행 모델의 장단점은 무엇인가? |
| 2 | 캐시 전략과 만료 정책 | Cache Aside, TTL, invalidation, stampede, penetration, avalanche를 어떻게 줄일 것인가? |
| 3 | 메모리와 Eviction | `maxmemory`, TTL, LRU/LFU/volatile 정책이 장애와 데이터 유실에 어떤 영향을 주는가? |
| 4 | 영속화와 복구 | RDB, AOF, fsync, rewrite, fork/COW 비용과 손실 범위를 설명할 수 있는가? |
| 5 | 복제, Sentinel, Cluster | replication lag, failover, hash slot, MOVED/ASK, multi-key 제약을 설명할 수 있는가? |
| 6 | Pipelining, Transaction, Lua | RTT 최적화, `MULTI/EXEC`, `WATCH`, Lua script의 원자성과 한계를 구분할 수 있는가? |
| 7 | 분산 락과 메시징 | `SET NX PX`, random token, fencing token, Pub/Sub, Stream consumer group을 설명할 수 있는가? |
| 8 | 실전 면접 Q&A | 짧은 답변으로 캐시, 락, persistence, cluster, stream 질문을 빠르게 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| 자료구조 | String, Hash, Set, Sorted Set, Stream 등 연산 목적에 맞춰 선택합니다. |
| Single Thread | 명령 실행은 단일 스레드라 원자적이고 빠르지만 긴 명령은 전체 지연을 만듭니다. |
| TTL | key 만료로 cache freshness를 제어하지만 동시 만료는 DB 부하를 만들 수 있습니다. |
| Eviction | `maxmemory` 도달 시 정책에 따라 key를 제거하거나 쓰기를 거부합니다. |
| RDB/AOF | RDB는 스냅샷, AOF는 쓰기 로그이며 손실 범위와 복구 속도가 다릅니다. |
| Sentinel | 샤딩 없이 master-replica 장애 조치를 제공합니다. |
| Cluster | 16384 hash slot으로 데이터를 분산하고 같은 slot multi-key만 지원합니다. |
| Pipelining | 여러 명령을 묶어 네트워크 RTT를 줄입니다. |
| Transaction | `MULTI/EXEC`는 순차 원자 실행이지만 RDBMS처럼 rollback하지 않습니다. |
| Stream | 저장, 재처리, consumer group, ACK가 필요한 메시징에 적합합니다. |

## 면접 답변 프레임

Redis 질문은 “빠르다”로 끝내지 말고 **메모리, 원자성, 장애, 데이터 유실 범위**를 함께 말해야 합니다.

1. 목적: cache, counter, lock, queue, ranking, session 중 어떤 용도인지 잡습니다.
2. 자료구조: 필요한 연산과 시간 복잡도, 메모리 구조를 기준으로 고릅니다.
3. 일관성: TTL, invalidation, replication lag, failover 중 어떤 stale data가 가능한지 설명합니다.
4. 장애 모드: key 폭증, big key, hot key, eviction, AOF rewrite, split brain, lock 만료를 붙입니다.
5. 대안: DB constraint, message broker, CDN, local cache, ZooKeeper/etcd 등과 비교합니다.

## 1. 자료구조와 명령 실행 모델

### Redis는 무엇인가

Redis는 in-memory data structure server입니다. database, cache, message broker, streaming engine처럼 사용할 수 있습니다.

핵심 특성:

- 대부분 데이터를 memory에 둡니다.
- command 실행은 단일 thread event loop에서 순차 처리됩니다.
- 자료구조별 atomic command를 제공합니다.
- persistence와 replication을 조합할 수 있습니다.
- latency가 낮지만 memory capacity와 network, fork, big key에 민감합니다.

### 자료구조 선택 기준

| 타입 | 특징 | 사용 사례 | 주의 |
| --- | --- | --- | --- |
| String | 기본 key-value, 숫자 연산 가능 | 단순 캐시, counter, token | 큰 JSON blob은 일부 필드 갱신 비효율 |
| Hash | key 안의 field-value | 사용자 프로필, 세션, 객체 캐시 | field 수가 너무 많으면 big key 위험 |
| List | 양 끝 삽입/삭제 빠름 | 간단 queue, 최근 목록 | 중간 접근/삭제는 비효율 |
| Set | 중복 없는 집합 | 태그, 유니크 방문자, 관계 | 큰 set 연산은 blocking 가능 |
| Sorted Set | score 기반 정렬 | 랭킹, priority queue, delay queue | score 설계와 메모리 사용 주의 |
| Bitmap | bit 단위 flag | 출석, 방문 여부 | offset이 크면 메모리 사용 증가 |
| HyperLogLog | 근사 distinct count | 대규모 UV 추정 | 정확한 count가 아님 |
| Geo | 위치 기반 검색 | 주변 매장, 위치 검색 | 내부적으로 sorted set 기반 |
| Stream | append-only log | 이벤트 처리, 작업 큐 | trimming, pending entry 관리 필요 |

선택 기준:

- 객체 필드 일부만 자주 바꾸면 Hash가 유리합니다.
- 순서 있는 랭킹은 Sorted Set이 자연스럽습니다.
- 유실되면 안 되고 재처리가 필요한 메시지는 Pub/Sub보다 Stream이 적합합니다.
- 정확한 distinct count가 필요하면 HyperLogLog는 부적합합니다.

실무 포인트:

- 시간순 정렬이 필요한 피드는 Sorted Set의 score에 timestamp를 넣어 구현할 수 있습니다. (출처: 올리브영)
- 객체를 직렬화해 String으로 저장하면 필드 추가/삭제 시 역직렬화 오류가 나기 쉬우므로, 필드 변경이 잦은 객체는 Hash 타입이 유연합니다. (출처: 올리브영)

### 시간 복잡도와 Big Key

Redis command는 빠르지만 모두 O(1)은 아닙니다.

| 패턴 | 위험 |
| --- | --- |
| `KEYS *` | 전체 key scan으로 event loop를 오래 막음 |
| 큰 Hash/Set/ZSet 전체 조회 | network와 serialization 지연 |
| 큰 key 삭제 | memory free 비용으로 latency spike 가능 |
| 무거운 Lua script | 실행 중 다른 command 대기 |
| 큰 pipeline | server/client memory와 응답 지연 증가 |

대응:

- `KEYS` 대신 `SCAN` 계열을 사용합니다.
- big key를 shard key 단위로 나눕니다.
- 큰 key 삭제에는 `UNLINK`를 검토합니다.
- 자료구조별 cardinality를 metric으로 봅니다.

실무 포인트:

- Big Key 위험 기준을 수치로 잡을 수 있습니다: 문자열 1MB 초과, 컬렉션 요소 10,000개 초과. 부작용으로 메모리 단편화, 성능 저하, 네트워크 포화, 복제 동기화 지연, 클러스터 데이터 불균형이 생깁니다. (출처: 올리브영)

### Single Thread 모델

Redis는 command 실행을 단일 thread event loop로 처리합니다.

장점:

- lock 없이 자료구조 일관성을 유지합니다.
- context switching 비용이 적습니다.
- command 하나가 원자적으로 실행됩니다.
- 단순한 실행 모델로 latency 예측이 쉽습니다.

주의:

- 긴 command 하나가 전체 요청을 막습니다.
- Redis 6 이후 network I/O thread를 지원해도 command execution은 순차 처리 모델을 유지합니다.
- CPU-bound 작업이나 큰 데이터 변환은 Redis 안에서 오래 수행하지 않는 편이 좋습니다.

## 2. 캐시 전략과 만료 정책

### Cache Aside

가장 흔한 애플리케이션 캐시 패턴입니다.

```text
1. cache get
2. miss면 DB 조회
3. cache set with TTL
4. response
```

장점:

- 애플리케이션이 cache key와 TTL을 제어하기 쉽습니다.
- 장애 시 cache를 우회해 DB로 fallback할 수 있습니다.

주의:

- miss 순간 DB 부하가 증가합니다.
- DB update 후 cache invalidation이 누락되면 stale data가 남습니다.
- hot key 만료 시 cache stampede가 생깁니다.

### 캐시 패턴 비교

| 패턴 | 설명 | 주의 |
| --- | --- | --- |
| Cache Aside | cache miss 시 DB 조회 후 cache 저장 | miss 순간 DB 부하 |
| Read Through | cache layer가 DB load | cache와 DB 결합 |
| Write Through | DB와 cache 동시 갱신 | 쓰기 지연 증가 |
| Write Behind | cache 먼저 쓰고 DB 비동기 반영 | 데이터 손실 위험 |
| Refresh Ahead | 만료 전 background refresh | 구현 복잡도 |

일반적인 기본값:

- Cache Aside
- TTL
- 변경 이벤트 기반 invalidation
- TTL jitter
- hot key 보호

실무 포인트:

- 글로벌 캐시(Redis) 앞에 로컬 캐시를 계층화하면 Redis 호출 자체를 줄일 수 있습니다. 단 로컬 캐시 단독 사용은 분산 환경 일관성 문제를 일으키므로, 항상 글로벌 캐시(버전 조회)와 조합해야 합니다. (출처: 올리브영)

### TTL과 Expiration

Redis key는 TTL을 가질 수 있고, 만료된 key는 lazy deletion과 active expiration으로 정리됩니다.

면접 포인트:

- TTL은 freshness를 보장하는 절대 장치가 아니라 stale data 기간을 제한할 뿐입니다.
- 대량 key에 같은 TTL을 주면 동시에 만료되어 cache avalanche가 생길 수 있습니다.
- TTL 없는 key는 eviction 정책에 따라 남거나 제거될 수 있습니다.

주의:

- `SET key value`는 기존 TTL을 제거할 수 있으므로 옵션 사용에 주의합니다.
- 갱신 시 `EX`, `PX`, `KEEPTTL` 등 TTL 정책을 명확히 합니다.
- session/token은 TTL 갱신 정책을 보안 요구와 함께 정해야 합니다.

실무 포인트:

- 특별한 이유가 없는 한 모든 key에 TTL을 설정하는 것이 권장됩니다. 근거는 메모리 고갈(OOM) 방지, 데이터 최신성, 캐시 정합성, 장애 시 자동 정리입니다. (출처: 올리브영)
- 핫키의 TTL이 만료되면 요청이 원본 DB로 몰리는 stampede가 생길 수 있으므로, 백그라운드 주기 갱신이나 PER 알고리즘 적용이 권장됩니다. (출처: 올리브영)

### Cache Stampede, Penetration, Avalanche

| 문제 | 의미 | 대응 |
| --- | --- | --- |
| Stampede | 인기 key 만료 시 다수 요청이 DB로 몰림 | 분산 락, single flight, background refresh |
| Penetration | 존재하지 않는 key 요청이 계속 DB로 감 | null caching, bloom filter, rate limit |
| Avalanche | 많은 key가 동시에 만료되어 DB 부하 급증 | TTL jitter, key 분산, gradual warm-up |

Stampede 대응:

- 한 요청만 재계산하도록 lock을 겁니다.
- TTL 만료 전 비동기 refresh를 수행합니다.
- TTL에 random jitter를 추가합니다.
- stale-while-revalidate를 적용할 수 있습니다.

주의:

- 락 자체도 장애 지점이 될 수 있습니다.
- cache miss 시 DB 보호를 위한 timeout, bulkhead, rate limit이 필요합니다.

실무 포인트:

- avalanche(캐시 쇄도)에는 TTL jitter가 유효합니다. 만료 시간에 0~10초 같은 무작위 지연을 더해 DB 부하를 시간축으로 분산하되, jitter가 길수록 사용자가 오래된 데이터를 볼 수 있으므로 서비스별 최대 jitter 상한을 정해야 합니다. (출처: 토스)
- penetration(캐시 관통)에는 null 오브젝트 패턴을 씁니다. DB 조회 결과가 null이어도 캐싱하고, 원시 타입은 "값 없음"을 나타내는 sentinel 값(예: 양수 데이터라면 정수 최솟값)을 사용합니다. 대안인 bloom filter는 정합성이 깨지면 전체 캐시 재적재가 필요해 운영 복잡도가 높습니다. (출처: 토스)
- 캐시 시스템 자체 장애에는 기능 중요도 기반 failover를 설계합니다. 핵심 기능만 DB fallback을 허용하고 부가 기능은 일시 중단하거나 대체 UI를 제공합니다. 공통화된 캐시 코드는 중요도 구분 없이 전부 DB로 fallback하기 쉬우므로 사전 설계가 필요합니다. (출처: 토스)
- 핫키 만료로 인한 stampede 대응으로 분산 락을 쓰면 캐시 미스 시 락을 잡은 요청 1개만 DB 조회·캐싱을 수행합니다. 대안인 TTL 제거/백그라운드 갱신은 더 이상 핫키가 아닌 데이터가 캐시 공간을 계속 차지하는 낭비가 생길 수 있습니다. (출처: 토스)
- PER(Probabilistic Early Recomputation)은 캐시 만료 전에 확률적으로 미리 재계산하는 스탬피드 방지 기법입니다. 현재 시각이 `expiry - β × δ × ln(rand())` 조건을 만족하면 조기 재계산하며, 재계산 시간(δ)이 길수록·남은 TTL이 짧을수록 갱신 확률이 높아집니다. 구현 시 캐시 데이터와 함께 재계산 소요 시간(δ)을 Redis에 같이 저장해야 합니다. (출처: 화해)
- PER은 락 기반 대응과 달리 락 대기·락 장애 지점이 없고 구현이 단순하지만, β(공격성 조절 파라미터, 기본 1.0)가 클수록 불필요한 조기 재계산이 늘어납니다. (출처: 화해)

## 3. 메모리와 Eviction

### Redis 메모리 특징

Redis는 in-memory 기반이라 memory sizing이 곧 capacity planning입니다.

확인할 것:

- key 수와 value 크기
- 자료구조별 overhead
- TTL 없는 key 비율
- replication backlog
- client output buffer
- fork 시 copy-on-write 여유 memory

운영 지표:

- `used_memory`
- `used_memory_rss`
- `mem_fragmentation_ratio`
- `maxmemory`
- `evicted_keys`
- `expired_keys`
- `keyspace_hits`, `keyspace_misses`

### Eviction 정책

`maxmemory`에 도달하면 eviction policy에 따라 key를 제거하거나 쓰기를 거부합니다.

| 정책 | 설명 | 적합한 상황 |
| --- | --- | --- |
| `noeviction` | 쓰기 요청에 error 반환 | 유실되면 안 되는 데이터 |
| `allkeys-lru` | 모든 key 중 오래 안 쓴 key 제거 | 일반 cache |
| `allkeys-lfu` | 모든 key 중 덜 쓰인 key 제거 | hot key가 뚜렷한 cache |
| `volatile-lru` | TTL 있는 key 중 오래 안 쓴 key 제거 | 영구 key 보호 |
| `volatile-lfu` | TTL 있는 key 중 덜 쓰인 key 제거 | TTL key만 cache일 때 |
| `volatile-ttl` | TTL이 임박한 key 제거 | 만료 임박 데이터 우선 제거 |
| `volatile-random` | TTL 있는 key 중 무작위 제거 | 단순 정책 |
| `allkeys-random` | 모든 key 중 무작위 제거 | 단순 cache |

주의:

- `volatile-*` 정책은 TTL 없는 key가 많으면 회수 대상이 부족할 수 있습니다.
- `noeviction`은 데이터 유실은 막지만 애플리케이션 write error를 처리해야 합니다.
- eviction이 발생했다는 것은 이미 memory pressure가 있다는 운영 신호입니다.

실무 포인트:

- 메모리 한계 도달 시 증상은 swap 사용 여부에 따라 갈립니다. swap을 쓰면 죽지는 않지만 디스크 I/O로 응답 속도가 급격히 저하되고, swap이 없으면 `OOM command not allowed when used memory > 'maxmemory'` 에러로 쓰기가 거부됩니다. (출처: 에스코어)
- `maxmemory`(메모리 상한)와 `maxmemory-policy`(초과 시 제거 규칙)를 함께 설정하는 것이 메모리 운영의 핵심입니다. (출처: 에스코어)
- eviction 정책 8종은 대상 범위(전체 key vs TTL 설정 key)와 기준(LRU/LFU/random/TTL 임박)의 조합으로 정리할 수 있습니다. 정책 선택은 순수 캐시인지, 유실 불가 데이터가 섞여 있는지 같은 서비스 특성에 따라 달라집니다. (출처: 에스코어)

### Hot Key와 Big Key

| 문제 | 영향 | 대응 |
| --- | --- | --- |
| Hot Key | 특정 key에 요청 집중 | local cache, request coalescing, key sharding |
| Big Key | 큰 value/collection으로 latency spike | key 분할, pagination, compression 주의 |
| Hot Partition | cluster 특정 slot/node에 부하 집중 | hash tag 재검토, key 분산 |

진단:

- slowlog
- commandstats
- keyspace 분석
- client-side latency tracking
- Redis Cluster node별 ops/memory 편차

실무 포인트:

- hot key로 인한 네트워크 병목에는 DB → 글로벌 캐시(Redis) → 로컬 캐시의 다중 레이어 캐시 구성이 유효합니다. 로컬 캐시로 Redis 호출 자체를 줄여 병목을 해소합니다. (출처: 올리브영)
- 트래픽 증가 시 Redis의 송신 네트워크 바이트(Network Bytes out)가 지속 상승하면 대역폭 포화·장애 위험이 됩니다. 로컬 캐시 도입 후 동일 자원 기준 TPS 478% 증가, Redis Network Bytes out 99.1% 감소 사례가 있습니다. (출처: 올리브영)
- 로컬 캐시의 서버 간 데이터 불일치는 버전 키 전략으로 보완합니다. 데이터 변경 시 버전 번호를 올려 새 키(v1, v2, ...)로 캐시를 만들고, 조회 시 Redis에서 최신 버전 번호만 먼저 확인한 뒤 해당 버전의 로컬 캐시 → 없으면 Redis 순으로 조회합니다. (출처: 올리브영)

## 4. 영속화와 복구

### RDB와 AOF

| 구분 | RDB | AOF |
| --- | --- | --- |
| 방식 | 특정 시점 snapshot | 모든 쓰기 명령 append |
| 파일 크기 | 작음 | 큼 |
| 복구 속도 | 빠름 | 상대적으로 느림 |
| 데이터 손실 | snapshot 사이 데이터 손실 가능 | fsync 설정에 따라 적음 |
| 비용 | fork와 copy-on-write 비용 | append와 rewrite 비용 |
| 용도 | 백업, 빠른 재시작 | 손실 최소화 |

조합:

- RDB만 사용: 빠른 복구와 백업에 유리하지만 손실 범위가 큽니다.
- AOF만 사용: 손실 범위를 줄이지만 파일 크기와 rewrite 비용이 큽니다.
- RDB + AOF: 복구성과 성능 사이 균형을 잡을 수 있습니다.
- persistence off: 순수 cache로만 쓸 때 가능하지만 재시작 시 데이터가 사라집니다.

### AOF fsync

| 옵션 | 의미 | trade-off |
| --- | --- | --- |
| `always` | 매 쓰기 fsync | 가장 안전하지만 느림 |
| `everysec` | 보통 1초마다 fsync | 성능/안전 균형 |
| `no` | OS에 맡김 | 빠르지만 손실 가능 |

면접 포인트:

- `everysec`는 장애 시 최근 약 1초 데이터 손실을 감수하는 선택입니다.
- AOF rewrite는 파일을 줄이지만 fork/COW와 I/O 비용을 만듭니다.
- persistence 설정은 cache인지 source of truth인지에 따라 달라집니다.

### Fork와 Copy-on-Write

RDB save와 AOF rewrite는 background child process를 만들 수 있습니다.

주의:

- fork 순간 memory page table 복사 비용이 생깁니다.
- child process 작업 중 parent가 page를 변경하면 copy-on-write memory가 늘어납니다.
- memory 여유가 부족하면 latency spike나 OOM 위험이 커집니다.

운영 지표:

- `rdb_bgsave_in_progress`
- `aof_rewrite_in_progress`
- `current_cow_size`
- `latest_fork_usec`
- persistence 실패 여부

## 5. 복제, Sentinel, Cluster

### Replication

Redis replication은 primary의 데이터를 replica로 복제합니다.

활용:

- read scaling
- failover 준비
- backup source
- analytics/monitoring 분리

주의:

- 기본적으로 asynchronous replication이므로 lag가 발생할 수 있습니다.
- failover 순간 일부 write가 유실될 수 있습니다.
- replica read는 stale data를 반환할 수 있습니다.
- replication backlog 크기와 network 안정성이 partial resync에 영향을 줍니다.

### Sentinel

Sentinel은 Redis primary-replica 구성에서 monitoring, notification, automatic failover, configuration provider 역할을 합니다.

| 기능 | 설명 |
| --- | --- |
| Monitoring | primary/replica 상태 확인 |
| Notification | 장애 이벤트 알림 |
| Automatic failover | primary 장애 시 replica 승격 |
| Configuration provider | client가 현재 primary를 찾도록 지원 |

주의:

- Sentinel은 sharding을 제공하지 않습니다.
- quorum과 failover timeout 설정이 중요합니다.
- client가 Sentinel을 통해 새 primary를 찾아야 합니다.

### Redis Cluster

Redis Cluster는 0~16383까지 16384개 hash slot으로 key를 나눕니다.

```text
slot = CRC16(key) mod 16384
```

Hash tag:

```text
user:{1000}:profile
user:{1000}:orders
```

`{1000}`만 hashing하므로 두 key가 같은 slot에 들어갑니다.

주의:

- multi-key command는 같은 slot key끼리만 가능합니다.
- Redis Cluster는 database 0만 지원하고 `SELECT`로 DB를 바꾸는 방식을 지원하지 않습니다.
- resharding 중 `ASK`, 소유권 변경 후 `MOVED` redirect가 발생합니다.
- client library가 cluster redirect와 topology refresh를 처리해야 합니다.

### Sentinel vs Cluster

| 구분 | Sentinel | Cluster |
| --- | --- | --- |
| 목적 | 고가용성 | 수평 확장 + 고가용성 |
| 데이터 분산 | 없음 | hash slot sharding |
| 데이터셋 | 모든 node가 같은 데이터 복제 | slot별로 분산 |
| multi-key 연산 | 자유로움 | 같은 slot 제약 |
| 사용 조건 | 단일 primary 메모리로 충분 | 데이터/처리량이 커서 sharding 필요 |

## 6. Pipelining, Transaction, Lua

### Pipelining

Pipelining은 여러 명령을 한 번에 보내고 응답도 한 번에 받는 network 최적화입니다.

적합한 상황:

- 대량 `SET`, `DEL`
- batch counter update
- 초기 데이터 적재
- 여러 독립 key 조회

주의:

- transaction이 아닙니다.
- 너무 큰 pipeline은 server/client memory와 응답 지연을 키웁니다.
- 원자성이 필요하면 `MULTI/EXEC`나 Lua script를 고려합니다.

### Transaction과 WATCH

Redis transaction은 `MULTI` 이후 명령을 queue에 쌓고 `EXEC`에서 순차 실행합니다.

```redis
MULTI
SET counter:a 1
INCR counter:a
EXEC
```

RDBMS와 차이:

| 항목 | Redis | RDBMS |
| --- | --- | --- |
| 실행 | `EXEC` 시 순차 실행 | transaction 내부 즉시 실행 |
| rollback | 없음 | 있음 |
| 격리 | `EXEC` 실행 중 다른 명령 끼어들지 않음 | 격리 수준별 동작 |
| 충돌 감지 | `WATCH` | lock/MVCC |

`WATCH`는 optimistic locking입니다.

```redis
WATCH mykey
GET mykey
MULTI
SET mykey new-value
EXEC
```

감시 중인 key가 변경되면 `EXEC`가 실패하고 client가 retry해야 합니다.

주의:

- queue 단계의 문법 오류와 `EXEC` 이후 실행 오류를 구분해야 합니다.
- 실행 중 일부 command가 실패해도 자동 rollback되지 않습니다.
- Cluster에서는 관련 key가 같은 slot에 있어야 합니다.

### Lua Script

Lua script는 server-side에서 여러 command를 하나로 묶어 실행합니다.

장점:

- 여러 command를 원자적으로 묶을 수 있습니다.
- network round trip을 줄입니다.
- check-and-set 로직을 안전하게 만들 수 있습니다.

주의:

- 긴 script는 event loop를 막습니다.
- script가 접근하는 key는 cluster에서 같은 slot에 있어야 합니다.
- 복잡한 비즈니스 로직을 Redis script에 과도하게 넣으면 운영과 디버깅이 어려워집니다.

## 7. 분산 락과 메시징

### Redis 분산 락

기본 Redis lock:

```text
SET lock-key random-token NX PX 3000
```

핵심:

- `NX`: key가 없을 때만 획득
- `PX`: lock 만료 시간
- random token: unlock 시 소유자 확인

unlock은 token을 확인하고 삭제해야 합니다.

```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
```

주의:

- token 확인 없이 삭제하면 다른 client의 lock을 지울 수 있습니다.
- TTL이 너무 짧으면 작업 중 lock이 만료될 수 있습니다.
- TTL이 너무 길면 장애 후 복구가 늦어집니다.
- primary 장애와 replica 승격 사이에 lock 유실이 가능합니다.

### RedLock과 Fencing Token

RedLock은 여러 독립 Redis node에 lock을 시도하고 과반수가 성공하면 획득으로 판단합니다.

주의:

- 완전한 합의 알고리즘은 아니므로 강한 정합성이 필요한 자원 제어에는 신중해야 합니다.
- clock drift, network partition, process pause가 있으면 기대와 다른 상황이 생길 수 있습니다.
- 돈, 재고, 결제처럼 강한 상호 배제가 필요하면 DB constraint, fencing token, ZooKeeper/etcd 같은 대안을 검토합니다.

Fencing token:

- lock 획득 때마다 단조 증가 token을 발급합니다.
- 실제 자원 저장소가 더 작은 token의 요청을 거부합니다.
- lock이 만료된 오래된 client의 뒤늦은 write를 막는 데 도움이 됩니다.

### Pub/Sub과 Stream

| 구분 | Pub/Sub | Stream |
| --- | --- | --- |
| 메시지 저장 | 없음 | 있음 |
| 연결 끊김 | 메시지 유실 | 다시 읽기 가능 |
| 소비 모델 | broadcast | consumer group 가능 |
| ACK | 없음 | 있음 |
| 재처리 | 어려움 | pending entry 기반 가능 |
| 사용 | 실시간 알림 | 작업 큐, 이벤트 처리 |

Pub/Sub 적합:

- 현재 연결된 client에게만 전달하면 되는 알림
- 유실 허용 가능한 실시간 fan-out

Stream 적합:

- 메시지를 저장해야 합니다.
- consumer group으로 작업을 분산해야 합니다.
- ACK, pending, retry, 재처리가 필요합니다.

### Stream 운영 주의

| 항목 | 설명 |
| --- | --- |
| trimming | stream 길이를 제한해 memory를 관리 |
| consumer group | 여러 consumer가 message를 나눠 처리 |
| pending entries | 전달됐지만 ACK되지 않은 message |
| retry/claim | 오래 pending인 message를 다른 consumer가 처리 |
| idempotency | 재처리와 중복 처리에 대비 |

Redis Stream은 Kafka와 다릅니다. 대규모 장기 보관, partition 기반 순서, ecosystem이 필요하면 Kafka가 더 적합할 수 있습니다.

## 8. 실전 면접 Q&A

### 자료구조 / 실행 모델

| 질문 | 답변 핵심 |
| --- | --- |
| Redis가 빠른 이유는? | memory 기반, 효율적인 자료구조, 단일 thread event loop, 적은 context switching 때문입니다. |
| Redis는 single-thread인데 왜 병목이 안 되나? | command가 짧고 memory 연산이라 빠르지만 big key나 긴 command는 병목이 됩니다. |
| Hash와 String JSON blob 중 무엇을 고르나? | 필드 일부 갱신/조회가 많으면 Hash, 통째로 저장/조회하면 String도 가능하지만 크기와 갱신 비용을 봅니다. |
| Sorted Set은 언제 쓰나? | score 기반 ranking, priority queue, delay queue에 적합합니다. |

### 캐시 / 메모리

| 질문 | 답변 핵심 |
| --- | --- |
| Cache Aside를 설명하라 | miss 시 DB 조회 후 cache에 저장하는 애플리케이션 주도 패턴입니다. |
| Cache Stampede 대응은? | 분산 락, single flight, background refresh, TTL jitter, stale-while-revalidate를 씁니다. |
| `allkeys-lru`와 `volatile-lru` 차이는? | 전자는 모든 key, 후자는 TTL 있는 key만 eviction 대상입니다. |
| Big Key가 위험한 이유는? | command latency, network 전송, memory free, replication에 큰 지연을 만들 수 있습니다. |

### Persistence / Cluster

| 질문 | 답변 핵심 |
| --- | --- |
| RDB와 AOF 차이는? | RDB는 snapshot, AOF는 write log이며 손실 범위와 복구 속도가 다릅니다. |
| AOF `everysec`의 의미는? | 보통 1초마다 fsync해 성능과 데이터 손실 범위를 절충합니다. |
| Sentinel과 Cluster 차이는? | Sentinel은 HA, Cluster는 hash slot 기반 sharding과 HA입니다. |
| Redis Cluster multi-key 제약은? | 모든 key가 같은 hash slot에 있어야 하며 hash tag로 같은 slot에 둘 수 있습니다. |
| MOVED와 ASK는 언제 보나? | slot 소유권 변경이나 resharding 중 cluster redirect로 발생합니다. |

### Lock / Messaging

| 질문 | 답변 핵심 |
| --- | --- |
| Redis lock에서 random token이 필요한 이유는? | unlock 시 lock 소유자만 삭제하도록 확인하기 위해서입니다. |
| RedLock을 언제 조심해야 하나? | 강한 정합성, network partition, clock drift, process pause가 문제가 되는 자원 제어에서 조심해야 합니다. |
| Pipelining과 Transaction 차이는? | pipelining은 RTT 최적화, transaction은 `EXEC` 시 순차 원자 실행입니다. |
| Redis transaction은 rollback되나? | RDBMS처럼 전체 rollback되지 않습니다. |
| Pub/Sub과 Stream 차이는? | Pub/Sub은 저장/ACK가 없고, Stream은 저장, consumer group, ACK, 재처리를 제공합니다. |

## 참고한 공식 문서

- Redis Data Types: https://redis.io/docs/latest/develop/data-types/
- Redis Persistence: https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- Redis Key Expiration: https://redis.io/docs/latest/commands/expire/
- Redis Eviction: https://redis.io/docs/latest/develop/reference/eviction/
- Redis Pipelining: https://redis.io/docs/latest/develop/using-commands/pipelining/
- Redis Transactions: https://redis.io/docs/latest/develop/using-commands/transactions/
- Redis Distributed Locks: https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/
- Redis Streams: https://redis.io/docs/latest/develop/data-types/streams/
- Redis Pub/Sub: https://redis.io/docs/latest/develop/pubsub/
- Redis Cluster Specification: https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/
- Redis Sentinel: https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/

## 참고한 기술블로그

- 토스 — 캐시 문제 해결 가이드 - DB 과부하 방지 실전 팁: https://toss.tech/article/cache-traffic-tip
- 화해 — 캐시 스탬피드를 대응하는 성능 향상 전략, PER 알고리즘 구현: https://blog.hwahae.co.kr/all/tech/14003
- 올리브영 — 개발자가 알면 좋은 Redis 꿀팁 모음: https://oliveyoung.tech/2025-07-23/redis-tips-for-developer/
- 올리브영 — 고성능 캐시 아키텍처 설계 - 로컬 캐시와 Redis로 대규모 증정 행사 관리 최적화: https://oliveyoung.tech/2024-12-10/present-promotion-multi-layer-cache/
- 에스코어 — Redis 메모리, Eviction 정책으로 알차게 쓰는 법: https://osslab.s-core.co.kr/27d035f5-1294-80c1-bd56-e8e87c01948e
