# DevOps와 Cloud

DevOps/Cloud는 코드를 운영 가능한 서비스로 만들기 위한 배포, 관측, 확장, 장애 대응 지식입니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| Linux 기본 | 프로세스, 포트, 로그, 권한, 디스크 사용량을 어떻게 확인하는가? |
| Virtualization | VM, hypervisor, guest/host OS는 어떻게 리소스를 격리하는가? |
| Container | image, layer, registry, runtime, network는 어떻게 연결되는가? |
| RAID | RAID 0, 1, 4, 5, 6은 성능과 복구성을 어떻게 trade-off하는가? |
| CI/CD | 테스트와 배포 자동화는 변경 위험을 어떻게 줄이는가? |
| Observability | log, metric, trace는 각각 어떤 문제를 찾는 데 적합한가? |
| 확장/장애 대응 | health check, rolling deploy, rollback, autoscaling은 어떤 장애를 줄이는가? |

## Virtualization

가상화는 하나의 물리 컴퓨팅 리소스를 논리적으로 분리해 여러 가상 리소스로 사용하는 기술입니다. 서버, 스토리지, 네트워크를 가상화할 수 있고, 클라우드 컴퓨팅의 핵심 기반입니다.

서버 가상화에서는 물리 서버 위에 여러 VM을 실행합니다. VM은 guest, VM이 실행되는 물리 서버는 host입니다. Hypervisor는 CPU, 메모리 같은 하드웨어 리소스를 VM에 할당하고 격리를 제공합니다.

| 종류 | 설명 | 예시 |
| --- | --- | --- |
| Type 1 | 하드웨어 위에서 직접 실행되는 bare metal hypervisor | KVM, Hyper-V |
| Type 2 | host OS 위에서 애플리케이션처럼 실행되는 hosted hypervisor | VirtualBox, VMware Workstation |

## VM과 Container

VM은 hypervisor를 통해 여러 guest OS를 실행합니다. 서로 다른 OS를 쓸 수 있고 격리 수준이 높지만, guest OS를 포함하므로 무겁고 시작이 느립니다.

Container는 host OS 커널을 공유하고, 이미지로 애플리케이션 실행 환경을 패키징합니다. VM보다 가볍고 빠르며 확장성이 좋지만, 커널을 공유하기 때문에 격리 수준과 보안 경계를 별도로 고려해야 합니다.

둘은 대체 관계가 아닙니다. 운영 환경에서는 VM 위에서 container를 실행하는 방식도 흔합니다.

## RAID

RAID는 여러 HDD/SSD를 하나의 논리 장치처럼 묶어 성능, 용량, 복구성을 조절하는 기술입니다.

| 방식 | 설명 | 장점 | 단점 |
| --- | --- | --- | --- |
| RAID 0 | 데이터를 여러 디스크에 나누어 저장하는 striping | 읽기/쓰기 성능 향상 | 디스크 하나만 실패해도 데이터 손실 |
| RAID 1 | 같은 데이터를 복제하는 mirroring | 복구성 높음 | 사용 가능 용량 감소, 쓰기 비용 증가 |
| RAID 4 | 별도 parity 디스크를 둠 | RAID 1보다 적은 디스크로 복구 가능 | parity 디스크 병목 |
| RAID 5 | parity를 여러 디스크에 분산 | RAID 4 병목 완화 | 쓰기 시 parity 계산 비용 |
| RAID 6 | 서로 다른 두 parity를 사용 | 더 높은 장애 허용 | RAID 5보다 쓰기 비용 증가 |

클라우드 환경에서는 사용자가 직접 RAID를 구성하지 않아도, 관리형 스토리지나 RDS가 내부적으로 striping, replication, snapshot을 조합해 성능과 내구성을 제공합니다.

## Gradle

Gradle은 JVM 생태계에서 자주 쓰는 build automation tool입니다. compile, test, packaging, dependency resolution, publishing 같은 반복 작업을 task로 자동화합니다. Groovy DSL이나 Kotlin DSL로 build script를 작성하며, Maven보다 imperative/custom task 작성이 유연합니다.

빌드 도구를 쓰는 이유는 개발자와 CI가 같은 방식으로 빌드하도록 만들고, 테스트 누락 같은 수동 실수를 줄이며, 외부 라이브러리 버전과 transitive dependency를 일관되게 관리하기 위해서입니다. Gradle은 incremental build, build cache, daemon, parallel build로 큰 multi-project build의 시간을 줄이는 데 초점을 둡니다.

자주 쓰는 dependency configuration은 다음과 같습니다.

| Configuration | 의미 |
| --- | --- |
| `implementation` | 현재 module 내부 compile/runtime에 필요하지만 소비자에게 노출하지 않는 의존성 |
| `api` | 현재 module의 public API에 노출되어 소비자 module도 compile classpath에서 알아야 하는 의존성 |
| `compileOnly` | compile 때만 필요하고 runtime artifact에는 포함하지 않는 의존성 |
| `annotationProcessor` | Lombok, MapStruct처럼 compile 중 실행되는 annotation processor |
| `runtimeOnly` | DB driver처럼 compile에는 필요 없고 runtime에만 필요한 의존성 |
| `testImplementation` | test source set에서만 사용하는 의존성 |

`implementation`을 기본으로 쓰고, 외부 module의 compile classpath에 노출돼야 하는 타입만 `api`로 올리는 것이 빌드 성능과 캡슐화에 유리합니다.

## Micrometer

Micrometer는 vendor-neutral metrics facade입니다. 애플리케이션 코드는 `MeterRegistry`를 통해 counter, timer, gauge 같은 metric을 기록하고, Micrometer registry 구현체가 Prometheus, Datadog, Graphite 같은 backend 형식으로 내보냅니다.

Spring Boot Actuator는 health, env, metrics 같은 운영 endpoint를 제공하고, metrics 수집은 내부적으로 Micrometer를 사용합니다. 즉 Actuator는 운영 endpoint와 자동 계측 통합을 제공하고, Micrometer는 metric instrument API와 backend adapter 역할을 합니다.

대표 meter는 다음과 같습니다.

| Meter | 용도 |
| --- | --- |
| `Counter` | 요청 수, 이벤트 수처럼 단조 증가하는 값을 기록 |
| `Timer` | 요청 처리 시간과 호출 수를 함께 기록 |
| `Gauge` | queue size, active session처럼 현재 시점의 값을 조회 |

Metric tag는 endpoint, status, exception처럼 차원을 나누는 데 유용하지만 cardinality가 너무 높으면 backend 저장 비용과 query 비용이 급격히 커집니다. user id, order id 같은 고유값은 tag로 쓰지 않는 것이 원칙입니다.

## Health Check

Health check는 서버 instance가 트래픽을 받을 수 있는 상태인지 확인하는 기능입니다. HTTP endpoint 호출, TCP port 연결, Spring Boot Actuator의 `/actuator/health` 같은 방식을 사용할 수 있습니다.

배포 시 새 instance가 정상 기동됐는지 확인하고, 운영 중 장애 instance를 load balancer target에서 제외하는 데 필요합니다. CPU, memory, I/O 고갈이나 내부 오류 상태의 서버에 계속 요청을 보내면 정상 instance가 있어도 사용자에게 오류가 전달되고, retry로 전체 트래픽이 증가할 수 있습니다.

실무에서는 liveness와 readiness를 구분합니다. Liveness는 프로세스를 재시작해야 할 정도로 죽었는지, readiness는 지금 트래픽을 받아도 되는지를 판단합니다. DB나 외부 API 의존성을 readiness에 과도하게 넣으면 외부 장애가 모든 instance 제거로 이어질 수 있어 주의합니다.

## Scale Up과 Scale Out

Scale up은 기존 서버의 CPU, memory, disk 같은 사양을 높이는 방식입니다. 적용이 단순하지만 장비 한계가 있고 장애 자동복구나 이중화를 제공하지 않습니다.

Scale out은 같은 역할의 서버를 여러 대로 늘리고 load balancer로 분산하는 방식입니다. 필요한 만큼 점진적으로 확장할 수 있고 한 서버 장애에도 가용성이 높지만, 세션 공유, 분산 동시성, 로그/메트릭 통합, 배포, load balancing 정책 같은 운영 문제가 추가됩니다.

## Serverless

Serverless는 서버가 없다는 뜻이 아니라 cloud provider가 서버 운영, 확장, 패치, 용량 관리를 맡는 모델입니다. FaaS는 이벤트가 발생할 때 함수가 실행되는 방식이고, BaaS는 인증, 저장소, 메시징 같은 backend 기능을 서비스로 사용하는 방식입니다.

장점은 운영 부담 감소, 자동 확장, 사용한 만큼 과금입니다. 단점은 cold start, 실행 시간 제한, provider lock-in, local debugging 어려움, 상태ful 처리 제약입니다. 짧고 event-driven한 작업에는 적합하지만, 긴 연결이나 낮은 지연이 절대적으로 필요한 작업은 별도 검토가 필요합니다.

## Infrastructure as Code

IaC는 인프라를 수동 콘솔 작업이 아니라 코드로 정의하고 provisioning하는 방식입니다. Git으로 변경 이력을 남기고, code review로 인프라 변경을 검토하며, 같은 구성을 반복 가능하게 재현할 수 있습니다.

선언적 방식은 원하는 최종 상태를 정의하고 도구가 차이를 계산해 적용합니다. Terraform, CloudFormation이 대표적입니다. 명령형 방식은 어떤 순서로 구성할지를 절차로 작성합니다. Ansible 같은 도구가 대표적입니다. 단점은 도구 학습 비용, state 관리, drift 감지, 실패 시 rollback/debugging 복잡도입니다.

## CI/CD와 무중단 배포

CI는 작은 변경을 자주 통합하고 자동 build/test로 회귀를 빠르게 찾는 방식입니다. CD는 build artifact를 배포 가능한 상태로 만들고, Continuous Delivery는 수동 승인 후 배포, Continuous Deployment는 자동으로 운영 배포까지 수행합니다.

무중단 배포는 downtime 없이 새 version으로 교체하는 배포 전략입니다.

| 방식 | 설명 | 주의점 |
| --- | --- | --- |
| Rolling | instance를 한 대씩 순차 교체 | 구버전/신버전 공존, 하위 호환성 필요 |
| Blue/Green | 동일 규모 신규 환경을 만들고 traffic 전환 | rollback 빠름, 비용 큼 |
| Canary | 일부 traffic만 새 버전에 보내고 점진 확대 | metric 기반 판단과 routing 제어 필요 |

배포 전략과 함께 health check, graceful shutdown, schema backward compatibility, feature flag를 같이 설계해야 합니다.

## Graceful Shutdown

Graceful shutdown은 종료 신호를 받았을 때 새 요청을 받지 않고, 진행 중 요청과 background 작업을 마무리한 뒤 resource를 정리하고 종료하는 방식입니다. 즉시 종료하면 transaction 중단, message 중복/유실, 사용자 오류가 발생할 수 있습니다.

Linux에서 `SIGTERM`은 프로세스가 처리할 수 있는 정상 종료 신호이고, `SIGKILL`은 처리 기회 없이 즉시 종료합니다. Spring Boot는 `server.shutdown=graceful`, `spring.lifecycle.timeout-per-shutdown-phase`로 graceful shutdown timeout을 설정할 수 있습니다. 무한 루프나 deadlock이 있으면 종료가 지연될 수 있으므로 timeout이 필요합니다.

## 테스트 전략

테스트 더블은 실제 의존성을 쓰기 어렵거나 외부 부수 효과를 피하고 싶을 때 사용하는 가짜 의존성입니다.

| 종류 | 역할 |
| --- | --- |
| Dummy | 인자 채우기용, 동작 없음 |
| Stub | 정해진 응답을 반환 |
| Fake | 단순하지만 동작하는 구현 |
| Spy | 호출 내역을 기록 |
| Mock | 기대한 상호작용을 검증 |

단위 테스트는 작은 단위의 로직을 빠르게 검증하고, 통합 테스트는 여러 module과 DB/network 같은 외부 시스템 결합을 검증합니다. Slice test는 `@WebMvcTest`, `@DataJpaTest`처럼 특정 layer만 로드해 빠르게 검증합니다.

TDD는 실패하는 테스트 작성, 통과를 위한 최소 구현, 리팩터링을 짧게 반복하는 개발 방식입니다. 테스트 가능하고 결합이 낮은 설계를 유도하지만, 불확실성이 큰 UI 탐색이나 throwaway prototype에는 비용이 더 클 수 있습니다.

Code coverage는 테스트가 production code를 실행한 정도입니다. Statement coverage는 실행된 line, branch/decision coverage는 분기 참/거짓, condition coverage는 하위 조건식의 참/거짓을 봅니다. Coverage가 높아도 assertion이 약하거나 중요한 경계 조건이 빠지면 품질을 보장하지 못합니다.

## Log와 Metric

Log는 시간 순서로 기록된 사건의 맥락입니다. 특정 요청이 왜 실패했는지, 어떤 입력과 상태였는지 추적하는 데 강합니다. Metric은 CPU, memory, latency, error rate, queue size처럼 시간에 따른 수치입니다. 현재 상태와 추세, alert 기준을 잡는 데 강합니다.

`System.out.println`은 level, appender, sampling, masking, async logging, 환경별 필터링이 어렵습니다. 운영에서는 Logback/Log4j 같은 logging framework와 trace id/MDC를 사용해 요청 단위 추적성을 확보합니다. Metric은 Prometheus/Grafana, log는 Loki/ELK 같은 조합으로 수집하고 시각화할 수 있습니다.

## 실무 판단

- 배포 자동화는 빠른 배포보다 반복 가능성과 rollback 가능성이 먼저입니다.
- metric은 알람 기준, trace는 병목 위치, log는 사건의 맥락을 찾는 데 유리합니다.
- 수평 확장 전에 DB, 외부 API, lock, queue 같은 공유 병목을 확인해야 합니다.
- VM은 강한 격리와 다양한 OS가 필요할 때, container는 빠른 배포와 확장이 필요할 때 적합합니다.
