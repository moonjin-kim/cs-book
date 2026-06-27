# Redis

Redis 면접은 **빠른 캐시로만 보는 것이 아니라 자료구조, 영속화, 고가용성, 분산 락, 메시징 모델까지 설명하는 것**이 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| 자료구조 | String, Hash, Set, Sorted Set, Stream 등 연산 목적에 맞춰 선택합니다. |
| Single Thread | 명령 실행은 단일 스레드라 원자적이고 빠르지만 긴 명령은 전체 지연을 만듭니다. |
| RDB/AOF | RDB는 스냅샷, AOF는 쓰기 로그입니다. |
| Sentinel | 샤딩 없이 master-replica 장애 조치를 제공합니다. |
| Cluster | 16384 hash slot으로 데이터를 분산합니다. |
| Pipelining | 여러 명령을 묶어 네트워크 RTT를 줄입니다. |
| Transaction | `MULTI/EXEC`는 순차 원자 실행이지만 rollback은 없습니다. |
| Cache Stampede | 인기 key 만료 시 DB로 요청이 몰리는 현상입니다. |

## 자료구조

| 타입 | 특징 | 사용 사례 |
| --- | --- | --- |
| String | 기본 key-value, 숫자 연산 가능 | 단순 캐시, counter, token |
| Hash | key 안의 field-value | 사용자 프로필, 세션 |
| List | 양 끝 삽입/삭제 빠름 | 큐, 최근 목록 |
| Set | 중복 없는 집합 | 태그, 유니크 방문자 |
| Sorted Set | score 기반 정렬 | 랭킹, 우선순위 큐 |
| Bitmap | bit 단위 flag | 출석, 방문 여부 |
| HyperLogLog | 근사 distinct count | 대규모 UV 추정 |
| Geo | 위치 기반 검색 | 주변 매장 |
| Stream | append-only log | 이벤트 처리, 작업 큐 |

선택 기준:

- 객체 필드 일부만 바꿔야 하면 Hash가 유리합니다.
- 정렬된 랭킹은 Sorted Set이 자연스럽습니다.
- 유실되면 안 되는 이벤트 처리는 Pub/Sub보다 Stream이 적합합니다.

## Single Thread

Redis는 명령 실행을 단일 스레드 event loop로 처리합니다.

장점:

- lock 없이 자료구조 일관성을 유지합니다.
- context switching 비용이 적습니다.
- 명령 하나가 원자적으로 실행됩니다.

주의:

- `KEYS`, 큰 collection 전체 조회, 무거운 Lua script는 전체 요청을 막을 수 있습니다.
- Redis 6부터 network I/O는 multi-thread를 지원하지만 command execution은 순차 처리입니다.

## RDB와 AOF

| 구분 | RDB | AOF |
| --- | --- | --- |
| 방식 | 특정 시점 스냅샷 | 모든 쓰기 명령 append |
| 파일 크기 | 작음 | 큼 |
| 복구 속도 | 빠름 | 상대적으로 느림 |
| 데이터 손실 | snapshot 사이 데이터 손실 가능 | fsync 설정에 따라 적음 |
| 용도 | 백업, 빠른 복구 | 손실 최소화 |

AOF fsync 옵션:

| 옵션 | 의미 |
| --- | --- |
| `always` | 매 명령 fsync, 가장 안전하지만 느림 |
| `everysec` | 1초마다 fsync, 일반적인 균형점 |
| `no` | OS에 맡김, 빠르지만 손실 가능 |

## Sentinel과 Cluster

| 구분 | Sentinel | Cluster |
| --- | --- | --- |
| 목적 | 고가용성 | 수평 확장 + 고가용성 |
| 데이터 분산 | 없음 | hash slot sharding |
| 데이터셋 | 모든 노드가 같은 데이터 복제 | slot별로 분산 |
| multi-key 연산 | 자유로움 | 같은 slot 제약 |
| 사용 조건 | 단일 master 메모리로 충분 | 데이터가 커서 샤딩 필요 |

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
- resharding 중 `ASK`, 소유권 변경 후 `MOVED` redirect가 발생합니다.
- client library가 cluster redirect를 처리해야 합니다.

## Pipelining

Pipelining은 여러 명령을 한 번에 보내고 응답도 한 번에 받는 네트워크 최적화입니다.

적합한 상황:

- 대량 `SET`, `DEL`
- batch counter update
- 초기 데이터 적재

주의:

- transaction이 아닙니다.
- 너무 큰 pipeline은 메모리와 응답 지연을 키웁니다.
- 원자성이 필요하면 `MULTI/EXEC`나 Lua script를 고려합니다.

## Transaction

Redis transaction은 `MULTI` 이후 명령을 queue에 쌓고 `EXEC`에서 순차 실행합니다.

RDBMS와 차이:

| 항목 | Redis | RDBMS |
| --- | --- | --- |
| 실행 | `EXEC` 시 순차 실행 | 트랜잭션 내부 즉시 실행 |
| rollback | 없음 | 있음 |
| 격리 | 실행 중 다른 명령 끼어들지 않음 | 격리 수준별 동작 |
| 충돌 감지 | `WATCH` | lock/MVCC |

주의:

- 실행 중 일부 명령이 실패해도 나머지는 실행될 수 있습니다.
- Cluster에서는 key가 같은 slot에 있어야 합니다.

## Eviction

`maxmemory`에 도달하면 eviction policy에 따라 key를 제거하거나 쓰기를 거부합니다.

| 정책 | 설명 |
| --- | --- |
| `noeviction` | 쓰기 요청에 error 반환 |
| `allkeys-lru` | 모든 key 중 오래 안 쓴 key 제거 |
| `allkeys-lfu` | 모든 key 중 덜 쓰인 key 제거 |
| `volatile-lru` | TTL 있는 key 중 LRU 제거 |
| `volatile-ttl` | TTL이 임박한 key 제거 |
| `random` | 무작위 제거 |

운영 지표:

- `used_memory`
- `maxmemory`
- `evicted_keys`
- cache hit ratio

## 분산 락과 RedLock

기본 Redis lock:

```text
SET lock-key random-token NX PX 3000
```

핵심:

- `NX`: key가 없을 때만 획득
- `PX`: lock 만료 시간
- random token: unlock 시 소유자 확인

주의:

- token 확인 없이 삭제하면 다른 client의 lock을 지울 수 있습니다.
- TTL이 너무 짧으면 작업 중 lock이 만료될 수 있습니다.
- master 장애와 replica 승격 사이에 lock 유실이 가능합니다.

RedLock:

- 여러 독립 Redis node에 lock 획득 시도
- 과반수 성공 시 lock 획득으로 판단
- 완전한 합의 알고리즘은 아니므로 엄격한 정합성에는 주의

돈, 재고처럼 강한 상호 배제가 필요하면 DB constraint, fencing token, ZooKeeper/etcd를 함께 검토합니다.

## Pub/Sub과 Stream

| 구분 | Pub/Sub | Stream |
| --- | --- | --- |
| 메시지 저장 | 없음 | 있음 |
| 연결 끊김 | 메시지 유실 | 다시 읽기 가능 |
| 소비 모델 | broadcast | consumer group 가능 |
| ACK | 없음 | 있음 |
| 사용 | 실시간 알림 | 작업 큐, 이벤트 처리 |

## 캐시 패턴

| 패턴 | 설명 | 주의 |
| --- | --- | --- |
| Cache Aside | cache miss 시 DB 조회 후 cache 저장 | miss 순간 DB 부하 |
| Read Through | cache layer가 DB load | cache와 DB 결합 |
| Write Through | DB와 cache 동시 갱신 | 쓰기 지연 증가 |
| Write Behind | cache 먼저 쓰고 DB 비동기 반영 | 데이터 손실 위험 |

일반적인 기본값:

- Cache Aside
- TTL
- 변경 이벤트 기반 invalidation

## Cache Stampede

인기 key가 만료되는 순간 많은 요청이 동시에 DB로 몰리는 현상입니다.

해결:

- 분산 락으로 한 요청만 재계산
- TTL 만료 전 background refresh
- TTL jitter로 만료 시점 분산
- probabilistic early recomputation

주의:

- 락 자체도 장애 지점이 될 수 있습니다.
- 캐시 miss 시 DB 보호 전략이 필요합니다.
