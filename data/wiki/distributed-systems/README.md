# 분산시스템

분산시스템 면접은 **여러 서버가 네트워크로 협력할 때 생기는 실패, 지연, 일관성, 중복, 순서 문제를 어떻게 다루는지**가 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| CAP | 네트워크 분할 상황에서 일관성과 가용성 사이 선택을 설명합니다. |
| 일관성 | 여러 노드에서 읽은 데이터가 얼마나 최신이고 같은지의 수준입니다. |
| 복제 | 데이터를 여러 노드에 복사해 가용성과 읽기 성능을 높입니다. |
| 샤딩 | 데이터를 여러 노드에 나눠 저장해 수평 확장합니다. |
| 멱등성 | 같은 요청이 여러 번 처리되어도 결과가 안정적이어야 합니다. |
| Circuit Breaker | 장애 호출을 차단해 빠르게 실패시키고 장애 전파를 줄입니다. |
| Outbox | DB 변경과 이벤트 발행을 같은 트랜잭션에 저장해 이중 쓰기를 줄입니다. |

## CAP

| 속성 | 의미 |
| --- | --- |
| Consistency | 어떤 노드에 물어도 같은 최신 데이터를 봅니다. |
| Availability | 모든 요청에 유효한 응답을 합니다. |
| Partition Tolerance | 네트워크 분할 상황에서도 시스템이 동작합니다. |

현실의 분산 시스템은 네트워크 분할을 피하기 어렵기 때문에 보통 CP 또는 AP 선택을 고민합니다.

| 선택 | 설명 |
| --- | --- |
| CP | 일관성을 지키기 위해 일부 요청을 거부할 수 있음 |
| AP | 응답은 유지하되 일시적 불일치를 허용 |

## 일관성 모델

| 모델 | 설명 |
| --- | --- |
| Strong Consistency | 항상 최신 값을 읽음 |
| Eventual Consistency | 시간이 지나면 결국 같아짐 |
| Read Your Writes | 내가 쓴 값은 이후 내가 읽을 수 있음 |

## 복제와 샤딩

| 구분 | 목적 | 주의 |
| --- | --- | --- |
| Replication | 가용성, 읽기 확장 | replica lag, failover |
| Sharding | 저장 용량, 쓰기 처리량 확장 | shard key, cross-shard query |

Replication 주의:

- 쓰기 직후 replica를 읽으면 최신 값이 아닐 수 있습니다.
- failover 중 쓰기 손실이나 중복 처리를 고려해야 합니다.

Sharding 주의:

- shard key가 한쪽으로 몰리면 hot shard가 됩니다.
- resharding은 비용이 큽니다.

## 합의

합의는 여러 노드가 같은 값이나 순서에 동의하는 문제입니다.

예:

- Raft
- Paxos
- ZooKeeper
- etcd

사용:

- leader election
- configuration 관리
- 강한 분산 락

## 멱등성과 재시도

분산 환경에서는 timeout이 발생해도 실제 처리 여부를 모를 수 있습니다.

따라서 retry 가능한 API는 멱등하게 설계해야 합니다.

방법:

- idempotency key
- unique constraint
- 요청 처리 이력 저장
- 상태 전이 검증

## 장애 격리 패턴

### Bulkhead

기능별로 thread pool, connection pool 같은 자원을 분리합니다.

효과:

- 한 외부 서비스 장애가 전체 장애로 번지는 것을 줄입니다.

### Circuit Breaker

오류가 계속되면 일정 시간 호출을 차단합니다.

상태:

| 상태 | 의미 |
| --- | --- |
| Closed | 정상 호출 |
| Open | 호출 차단 |
| Half-Open | 일부 요청으로 회복 확인 |

## Event Sourcing과 CQRS

| 패턴 | 설명 | 주의 |
| --- | --- | --- |
| Event Sourcing | 최종 상태 대신 상태 변경 이벤트를 저장 | replay 비용, 이벤트 스키마 관리 |
| CQRS | 명령 모델과 조회 모델 분리 | 동기화, 복잡도 증가 |

Event Sourcing 장점:

- 과거 상태 재현
- 감사 로그
- 비즈니스 이벤트 이력 보존

CQRS 장점:

- 쓰기 모델은 정합성 중심
- 조회 모델은 성능 중심
- 서로 다른 저장소 사용 가능

## 비동기 연동

| 방식 | 장점 | 주의 |
| --- | --- | --- |
| Messaging | 높은 처리량, 느슨한 결합 | 유실, 중복, 순서 |
| DB Polling | 트랜잭션과 함께 관리 쉬움 | polling 비용 |
| CDC | 애플리케이션 로직 단순 | 왜 변경됐는지 알기 어려움 |

## Transactional Outbox

문제:

```text
DB 저장 성공 + 메시지 발행 실패
DB 저장 실패 + 메시지 발행 성공
```

해결:

1. 비즈니스 데이터와 outbox event를 같은 DB 트랜잭션에 저장합니다.
2. 별도 publisher가 outbox를 읽어 메시지를 발행합니다.
3. 성공한 event는 발행 완료 처리합니다.

주의:

- publisher는 재시도 가능해야 합니다.
- consumer는 중복 수신에 대비해야 합니다.

## SPOF와 HA

SPOF는 하나가 죽으면 전체 시스템이 멈추는 지점입니다.

대응:

- 서버 이중화
- Load Balancer
- DB failover
- replica
- health check
- multi-AZ 구성

서버 이중화 시 확인:

- 세션 공유
- 분산 락 필요 여부
- 로그/메트릭 통합
- 배포 전략
- 데이터 정합성
