# Database

Database 면접은 **정확한 데이터를 안전하게 바꾸고 빠르게 읽기 위해 트랜잭션, 인덱스, 락, 실행 계획을 어떻게 이해하는지**가 핵심입니다.

이 문서는 전체 내용을 한 번에 읽는 입구가 아니라, 필요한 세부 문서로 들어가는 목차입니다.

## 먼저 읽을 순서

| 순서 | 문서 | 먼저 답할 질문 |
| --- | --- | --- |
| 1 | [관계형 모델과 정규화](relational-modeling.md) | 테이블, key, 제약 조건, 정규화가 데이터 이상 현상을 어떻게 줄이는가? |
| 2 | [트랜잭션과 격리 수준](transactions-isolation.md) | ACID, dirty/non-repeatable/phantom read, DB별 isolation 차이를 설명할 수 있는가? |
| 3 | [Lock과 MVCC](locks-mvcc.md) | shared/exclusive lock, MVCC snapshot, gap/next-key lock, deadlock을 연결해 설명할 수 있는가? |
| 4 | [인덱스 설계](indexes.md) | B+Tree, 복합 인덱스, covering index, cardinality/selectivity 기준으로 인덱스를 설계할 수 있는가? |
| 5 | [실행 계획과 쿼리 튜닝](query-tuning.md) | EXPLAIN에서 access type, rows, key, sort/temp, scan 범위를 보고 병목을 찾을 수 있는가? |
| 6 | [페이징과 데이터 모델링](paging-modeling.md) | offset과 cursor paging, 정규화/역정규화, 삭제 전략의 trade-off를 설명할 수 있는가? |
| 7 | [확장과 운영](operations.md) | replication, partitioning, sharding, connection pool, backup/restore를 운영 관점에서 설명할 수 있는가? |
| 8 | [심화 설계와 운영 패턴](deep-patterns.md) | hot row, idempotency, outbox, online migration, read/write split 일관성 문제를 설명할 수 있는가? |
| 9 | [실전 면접 Q&A](interview-qna.md) | 짧은 답변으로 트랜잭션, 인덱스, 락, 운영 질문을 빠르게 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| ACID | 트랜잭션이 안전하게 실행되기 위한 원자성, 일관성, 격리성, 지속성입니다. |
| 격리 수준 | 동시 트랜잭션이 서로의 변경을 얼마나 볼 수 있는지 정합니다. |
| MVCC | 여러 버전의 데이터를 유지해 읽기와 쓰기의 충돌을 줄입니다. |
| Lock | 동시에 같은 데이터를 바꿀 때 충돌을 제어하지만 대기와 deadlock을 만들 수 있습니다. |
| 인덱스 | 읽기 성능을 높이지만 쓰기 비용과 저장 공간을 늘립니다. |
| 실행 계획 | DB optimizer가 어떤 방식으로 데이터를 찾고 조인하는지 확인하는 도구입니다. |
| Replication | Primary 변경 로그를 Replica에 반영해 읽기 분산과 장애 대응을 합니다. |
| SARGable Query | 인덱스를 활용할 수 있도록 컬럼을 함수나 계산으로 감싸지 않는 조건식입니다. |
| Online Migration | expand-migrate-contract 순서로 서비스 중 schema/data 변경을 안전하게 적용합니다. |

## 답변 프레임

Database 질문은 기능 이름보다 **정합성, 동시성, 비용, 운영 실패 모드**를 기준으로 답하면 좋습니다.

1. 정합성: 어떤 데이터 불변식을 지켜야 하는지 말합니다.
2. 동시성: isolation, lock, MVCC가 어떤 충돌을 막는지 설명합니다.
3. 비용: index, join, sort, scan, write amplification을 따집니다.
4. 관측: EXPLAIN, slow query log, lock wait, connection pool metric으로 확인합니다.
5. 운영: replication lag, backup/restore, schema migration, hot partition 같은 실패 모드를 붙입니다.

## 상황별 바로가기

| 상황 | 볼 문서 |
| --- | --- |
| 트랜잭션 격리와 동시성 질문이 약함 | [트랜잭션과 격리 수준](transactions-isolation.md), [Lock과 MVCC](locks-mvcc.md) |
| 인덱스 설계 답변이 얕음 | [인덱스 설계](indexes.md), [실행 계획과 쿼리 튜닝](query-tuning.md) |
| 실무 성능 튜닝을 보강하고 싶음 | [실행 계획과 쿼리 튜닝](query-tuning.md), [심화 설계와 운영 패턴](deep-patterns.md) |
| 대규모 운영 질문이 약함 | [확장과 운영](operations.md), [심화 설계와 운영 패턴](deep-patterns.md) |
| 면접 직전 빠르게 복습함 | [실전 면접 Q&A](interview-qna.md) |

## 참고

- [공식 문서 링크 모음](references.md)
