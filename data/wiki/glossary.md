# 용어 사전

| 용어 | 의미 |
| --- | --- |
| Latency | 하나의 요청이 완료될 때까지 걸리는 시간 |
| Throughput | 단위 시간 동안 처리할 수 있는 작업량 |
| Consistency | 여러 관찰자가 같은 데이터 상태를 보는 정도 |
| Availability | 요청을 정상 응답할 수 있는 정도 |
| Idempotency | 같은 요청을 여러 번 수행해도 결과가 안정적인 성질 |
| Backpressure | 처리 속도보다 입력 속도가 빠를 때 생산자를 늦추는 제어 |
| Isolation | 동시에 실행되는 작업이 서로의 중간 상태를 침범하지 않는 정도 |
| Durability | 성공한 변경이 장애 이후에도 보존되는 성질 |
| Origin | protocol, host, port를 합친 브라우저 보안 경계 |
| CORS | 다른 origin resource 접근을 서버가 명시적으로 허용하는 브라우저 보안 메커니즘 |
| Preflight | 실제 cross-origin 요청 전에 브라우저가 보내는 OPTIONS 사전 확인 요청 |
| NAT | 사설 IP와 공인 IP를 변환해 내부 호스트가 외부와 통신하게 하는 기술 |
| NAPT | IP 주소와 port를 함께 변환하는 NAT 방식 |
| CIDR | IP 주소와 네트워크 비트 수를 `IP/Prefix`로 표현하는 표기법 |
| CDN | 사용자와 가까운 edge server에서 콘텐츠를 제공하는 분산 캐시 네트워크 |
| HOL Blocking | 앞 작업이 지연되어 뒤 작업도 함께 막히는 현상 |
| Idempotency Key | 중복 요청을 같은 작업으로 식별해 한 번만 처리하기 위한 key |
| Race Condition | 실행 순서에 따라 결과가 달라지는 동시성 결함 |
| Binary Tree | 각 정점이 최대 두 개의 자식 정점을 가지는 트리 |
| Trie | 문자열을 문자 단위 경로로 저장해 prefix 탐색을 빠르게 하는 트리 |
| Load Factor | 자료구조 capacity 대비 원소 적재 비율 |
| Threshold | resize나 rehash를 수행하기 시작하는 임계 원소 수 |
| Separate Chaining | 해시 충돌 시 bucket 내부를 list/tree로 연결해 저장하는 방식 |
| Open Addressing | 해시 충돌 시 다른 bucket을 탐사해 저장하는 방식 |
| Pipeline Hazard | CPU 파이프라인이 의존성, 분기, 자원 충돌 때문에 멈추거나 비워지는 상황 |
| Locality of Reference | 최근 접근한 데이터나 인접 데이터에 다시 접근할 가능성이 높다는 메모리 접근 경향 |
| Page Fault | 필요한 page가 물리 메모리에 없어 OS가 적재해야 하는 상황 |
| TLB | 가상 주소와 물리 주소 변환 결과를 캐시하는 CPU 내부 캐시 |
| Hypervisor | VM에 CPU, 메모리 같은 하드웨어 리소스를 할당하고 격리하는 가상화 계층 |
| RAID | 여러 디스크를 묶어 성능이나 복구성을 조절하는 저장장치 구성 방식 |
| SQL Injection | 사용자 입력이 SQL query 구조를 바꾸게 되는 injection 취약점 |
| JWT | JSON claim을 담고 서명으로 변조를 검증하는 token 형식 |
| CSRF | 사용자가 의도하지 않은 요청을 인증된 브라우저 상태로 보내게 하는 공격 |
| Symmetric Key | 암호화와 복호화에 같은 키를 쓰는 방식 |
| Public Key Cryptography | 공개키와 개인키를 나누어 암호화, 키 교환, 서명에 사용하는 방식 |
| HTTPS | HTTP에 TLS를 적용해 전송 구간을 암호화하고 서버를 인증하는 프로토콜 |
| Hot Key | 특정 key에 요청이 집중되어 병목이 되는 상황 |
| Rebalance | Kafka consumer group이나 cluster에서 파티션 소유권을 다시 나누는 과정 |
| Happens-Before | Java Memory Model에서 한 작업의 결과가 다른 작업에 보이는 순서 보장 관계 |
| CAS | 기대값과 현재값이 같을 때만 새 값으로 바꾸는 원자적 CPU 연산 |
| ABA Problem | CAS에서 값이 A에서 B를 거쳐 다시 A가 되어 변경을 감지하지 못하는 문제 |
| ThreadLocal | 스레드별 독립 값을 저장하는 Java 도구 |
| Work Stealing | 일이 없는 worker가 다른 worker의 queue에서 작업을 가져오는 스케줄링 방식 |
| ConcurrentHashMap | 여러 스레드의 동시 접근을 위해 bucket 단위 동기화와 CAS를 사용하는 Java Map |
| Record | Java의 불변 데이터 carrier로 생성자, accessor, equals/hashCode/toString을 자동 제공하는 타입 |
| Humongous Object | G1 GC에서 region 크기의 50% 이상을 차지해 연속 region에 할당되는 큰 객체 |
| Component Stereotype | Spring bean의 계층 역할을 표현하는 Component, Controller, Service, Repository 계열 애너테이션 |
| Transaction Propagation | 기존 트랜잭션 존재 여부에 따라 새 트랜잭션 생성, 참여, 보류, 예외 여부를 정하는 Spring 규칙 |
| Self Invocation | 같은 객체 내부 메서드 호출이 Spring AOP proxy를 우회하는 현상 |
| Auto Configuration | Spring Boot가 classpath, property, condition을 기준으로 bean 구성을 자동 등록하는 기능 |
| HttpMessageConverter | Spring MVC에서 HTTP body와 Java 객체를 변환하는 전략 인터페이스 |
| HandlerInterceptor | Spring MVC handler 실행 전후에 공통 처리를 끼워 넣는 확장 지점 |
| Gradle | JVM 프로젝트에서 빌드, 테스트, 패키징, 의존성 관리를 자동화하는 빌드 도구 |
| Micrometer | 여러 모니터링 backend에 metric을 내보내기 위한 vendor-neutral 계측 facade |
| Persistence Context | JPA EntityManager가 entity 동일성, 1차 캐시, 변경 감지를 관리하는 context |
| Fetch Join | JPQL에서 연관 entity를 함께 조회해 N+1을 줄이는 join 방식 |
| OSIV | 요청 종료까지 JPA 영속성 컨텍스트를 열어 view/controller에서도 lazy loading을 허용하는 패턴 |
| Redis Hash Slot | Redis Cluster가 key를 분산하기 위해 사용하는 0~16383 범위의 slot |
| Redis Sentinel | Redis master-replica 구성에서 monitoring과 failover를 담당하는 HA 도구 |
| Redis Stream | 메시지를 append-only log로 저장하고 consumer group과 ACK를 제공하는 Redis 자료구조 |
| Redis Pipeline | 여러 command를 한 번에 전송해 네트워크 RTT를 줄이는 최적화 |
| Redis Eviction | maxmemory 도달 시 정책에 따라 key를 제거하거나 write를 거부하는 동작 |
| Cache-Aside | 애플리케이션이 cache miss 때 DB를 조회하고 cache를 채우는 캐시 패턴 |
| Kafka Offset | Kafka partition 내부 record 위치와 consumer 처리 진행 상태를 나타내는 번호 |
| Kafka Rebalance | Consumer group의 partition 할당을 다시 계산하는 과정 |
| Idempotent Producer | PID와 sequence number로 Kafka broker가 중복 record를 제거하게 하는 producer |
| Transactional Outbox | DB 변경과 이벤트 발행 요청을 같은 DB transaction에 저장한 뒤 별도 relay가 발행하는 패턴 |
| Event Sourcing | 상태 변경 이벤트 이력을 저장하고 replay로 현재 상태를 복원하는 저장 방식 |
| CQRS | Command 모델과 Query 모델을 분리하는 설계 패턴 |
| SPOF | 하나가 실패하면 전체 시스템이 중단되는 단일 장애 지점 |
| Health Check | instance가 트래픽을 받을 수 있는 상태인지 endpoint나 port로 확인하는 절차 |
| Serverless | 서버 운영을 cloud provider가 맡고 함수나 backend service 단위로 사용하는 모델 |
| Infrastructure as Code | 인프라 구성을 코드로 정의하고 변경 이력과 재현성을 확보하는 방식 |
| Zero-Downtime Deployment | 서비스 중단 없이 새 버전으로 traffic을 전환하는 배포 방식 |
| Graceful Shutdown | 종료 시 신규 작업을 막고 진행 중 작업과 resource 정리를 마친 뒤 종료하는 방식 |
| Test Isolation | 테스트가 다른 테스트의 상태에 영향을 주거나 받지 않게 만드는 성질 |
| Test Double | 실제 의존성을 대체해 테스트에 적합하게 만든 가짜 객체 |
| Code Coverage | 테스트가 production code를 실행한 정도를 나타내는 지표 |
| TDD | 실패 테스트, 최소 구현, 리팩터링을 짧게 반복하는 개발 방식 |
| PRG | POST 처리 후 Redirect와 GET으로 중복 form 제출을 줄이는 패턴 |
| Defensive Copy | 가변 객체 참조 공유를 끊기 위해 복사본을 만들어 사용하는 기법 |
| First-Class Collection | collection을 감싼 전용 객체에 검증과 비즈니스 로직을 모으는 패턴 |
| MVCC | 여러 버전의 데이터를 유지해 읽기-쓰기 경합을 줄이는 동시성 제어 방식 |
| Gap Lock | 인덱스 record 사이의 빈 공간을 잠가 insert를 막는 lock |
| Next-Key Lock | record lock과 gap lock을 결합한 InnoDB lock |
| Covering Index | 쿼리에 필요한 모든 컬럼이 포함되어 테이블 접근을 피하는 인덱스 |
| Cardinality | 컬럼의 고유 값 개수 |
| Selectivity | 조건이 전체 행 중 얼마나 좁은 범위를 반환하는지 나타내는 비율 |
| Bulkhead | 기능별 자원 격리로 장애 전파를 줄이는 패턴 |
| Circuit Breaker | 지속 장애 시 호출을 잠시 차단해 빠른 실패를 제공하는 패턴 |
