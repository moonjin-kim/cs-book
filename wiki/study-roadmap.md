# 학습 로드맵

이 로드맵은 단순 암기 순서가 아니라, 백엔드 면접에서 **요청 처리, 데이터 저장, 동시성, 장애 대응**을 연결해서 설명하기 위한 순서입니다.

각 단계는 다음 방식으로 학습합니다.

1. 핵심 질문에 1분 답변을 작성합니다.
2. 관련 문서의 빠른 요약을 먼저 읽습니다.
3. 세부 섹션에서 trade-off와 실패 모드를 정리합니다.
4. 면접 체크리스트로 말로 설명합니다.

## 1단계: 계산과 실행 모델

목표: 코드가 CPU, 메모리, OS 위에서 어떻게 실행되는지 설명합니다.

| 주제 | 먼저 볼 내용 | 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 자료구조와 알고리즘 | 복잡도, 배열/리스트, 해시, 트리/그래프, BFS/DFS, DP/Greedy | 입력 제한을 보고 왜 이 자료구조와 알고리즘을 선택했는가? |
| 컴퓨터 구조 | 파이프라이닝, hazard, cache, cache coherence, SIMD, I/O | 배열 순회가 linked list보다 빠를 수 있는 이유는 무엇인가? |
| Operating System | 프로세스, 스레드, 동기화, 가상 메모리, page cache, I/O | thread가 많아지면 왜 항상 성능이 좋아지지 않는가? |
| Java | JVM, GC 알고리즘, 메모리 모델, 동시성, Stream, Optional, Reflection, Record, 객체 비교 | Java 코드가 heap, stack, GC, JMM과 어떻게 연결되는가? |

체크포인트:

- Big-O와 실제 성능 차이를 cache locality, allocation, I/O wait로 설명할 수 있습니다.
- process와 thread의 자원 공유 범위를 말할 수 있습니다.
- synchronized, volatile, atomic의 차이를 OS/CPU memory visibility와 연결할 수 있습니다.

## 2단계: 요청과 데이터

목표: 사용자의 HTTP 요청이 서버와 데이터 저장소를 거쳐 응답으로 돌아오는 흐름을 설명합니다.

| 주제 | 먼저 볼 내용 | 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 네트워크 | TCP/IP, DNS, TLS, NAT, 로드밸런싱, CDN, timeout/retry | URL 입력 후 요청이 서버까지 가는 과정을 어디서 실패할 수 있는가? |
| Web/HTTP | HTTP 메시지, REST, 쿠키/세션, CORS, HTTP/2, 프록시, 멱등성 | GET/POST/PUT/PATCH/DELETE의 의미와 멱등성을 어떻게 구분하는가? |
| Database | 트랜잭션, 격리 수준, MVCC, 인덱스, 실행 계획, 복제, NoSQL | 동시 주문에서 정합성을 어떻게 보장하고 성능 병목을 어떻게 찾는가? |

체크포인트:

- DNS, TCP, TLS, HTTP, reverse proxy, application, DB 순서로 요청 흐름을 설명할 수 있습니다.
- timeout, retry, idempotency를 장애 전파 관점으로 연결할 수 있습니다.
- index가 조회를 빠르게 하지만 write 비용과 storage 비용을 늘린다는 trade-off를 말할 수 있습니다.

## 3단계: 백엔드 프레임워크와 저장소

목표: Spring 기반 애플리케이션이 요청을 처리하고 외부 저장소와 통합되는 방식을 설명합니다.

| 주제 | 먼저 볼 내용 | 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 객체지향 | 캡슐화, 추상화, 다형성, SOLID, 디자인 패턴, 일급 컬렉션 | 변경에 강한 도메인 모델을 만들기 위해 책임을 어떻게 나눌 것인가? |
| Spring | IoC/DI, Bean 관리, AOP, MVC, 트랜잭션 전파, JPA, Boot 자동 설정 | Spring transaction이 proxy와 DB connection 위에서 어떻게 동작하는가? |
| Redis | 자료구조, 캐시 패턴, 분산 락, RDB/AOF, Sentinel, Cluster, Stream | cache aside에서 stale data와 cache stampede를 어떻게 줄일 것인가? |
| Kafka | 토픽, 파티션, 컨슈머 그룹, offset, rebalancing, 전달 보장, Streams/Connect | at-least-once 환경에서 중복 처리를 어떻게 설계할 것인가? |

체크포인트:

- Controller, Service, Repository, Domain 책임을 구분할 수 있습니다.
- Redis를 단순 key-value 저장소가 아니라 latency, TTL, eviction, persistence 관점으로 설명할 수 있습니다.
- Kafka partition key, ordering, consumer group, offset commit의 관계를 말할 수 있습니다.

## 4단계: 운영 가능한 시스템

목표: 서비스가 배포 후에도 안전하게 동작하도록 보안, 관측성, 장애 대응, 확장성을 설명합니다.

| 주제 | 먼저 볼 내용 | 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| Security | 인증, 인가, JWT, SQL Injection, CSRF, 암호화, HTTPS, 해시, OWASP | 인증과 인가를 분리하고, 공격 표면을 어떻게 줄일 것인가? |
| 분산시스템 | CAP, 일관성, 복제, 샤딩, 합의, 멱등성, Outbox, Bulkhead, Circuit Breaker | 부분 실패와 중복 메시지를 전제로 시스템을 어떻게 설계할 것인가? |
| DevOps/Cloud | Linux, 컨테이너, Gradle, 테스트 전략, IaC, CI/CD, 무중단 배포, Health Check, Micrometer, 관측성 | 장애가 났을 때 metric, log, trace로 어디부터 볼 것인가? |

체크포인트:

- 장애를 “서버가 죽었다”가 아니라 latency, saturation, error, traffic, dependency 관점으로 나눠 말할 수 있습니다.
- readiness/liveness, rolling deployment, graceful shutdown을 구분할 수 있습니다.
- 보안 질문에서 암호화, hashing, signing, token storage를 혼동하지 않습니다.

## 권장 학습 루프

| 요일/회차 | 활동 | 산출물 |
| --- | --- | --- |
| 1회차 | 빠른 요약과 핵심 섹션 맵 읽기 | 모르는 용어 목록 |
| 2회차 | 세부 섹션 정독 | 1분 답변 초안 |
| 3회차 | 면접 Q&A로 말하기 | 녹음 또는 문장화한 답변 |
| 4회차 | 관련 주제 연결 | “요청 하나가 DB까지 가는 흐름” 같은 통합 답변 |
| 5회차 | 장애/성능 관점 복습 | timeout, lock, cache miss, GC, DB index를 연결한 사례 |

## 우선순위별 압축 코스

### 시간이 1주일뿐이라면

1. 자료구조와 알고리즘: 복잡도, HashMap, BFS/DFS, binary search, DP 기본
2. OS: process/thread, synchronization, virtual memory, I/O
3. 네트워크: DNS, TCP/TLS, HTTP, timeout/retry
4. DB: transaction, isolation, index, execution plan
5. Java/Spring: JVM/GC, JMM, DI, transaction proxy

### 실무형 백엔드 면접을 준비한다면

1. Java -> Spring -> Database
2. Web/HTTP -> Network
3. Redis -> Kafka
4. 분산시스템 -> Security -> DevOps/Cloud
5. 부족한 기반을 OS, 컴퓨터 구조, 알고리즘으로 보강

### 장애 대응 역량을 보강한다면

1. OS: CPU, memory, file descriptor, I/O 관측
2. Network: DNS, TCP, TLS, LB, CDN, timeout
3. Database: lock, slow query, replication lag, connection pool
4. Redis/Kafka: eviction, persistence, rebalance, consumer lag
5. DevOps/Cloud: metric, log, trace, deployment, rollback
