# DevOps와 Cloud

DevOps/Cloud 면접은 **애플리케이션을 어떻게 빌드, 배포, 관측, 확장, 종료, 복구할 수 있게 운영하는지**를 설명하는 것이 핵심입니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | Health Check | Liveness, Readiness, Startup을 구분하고 외부 의존성을 health check에 포함할지 기준을 말할 수 있는가? |
| 2 | Log와 Metric | 로그와 메트릭의 역할 차이를 알고 어떤 지표를 수집해야 하는지 설명할 수 있는가? |
| 3 | Micrometer | vendor-neutral metrics facade가 무엇이고 Counter/Gauge/Timer를 언제 쓰는지 구분할 수 있는가? |
| 4 | CI/CD | CI, Continuous Delivery, Continuous Deployment의 차이를 설명할 수 있는가? |
| 5 | 무중단 배포 | Rolling, Blue/Green, Canary의 장단점과 배포 시 공통 주의점을 말할 수 있는가? |
| 6 | Graceful Shutdown | SIGTERM 수신 후 종료 흐름과 SIGKILL과의 차이를 설명할 수 있는가? |
| 7 | Scale Up vs Scale Out | 두 확장 방식의 장단점과 Scale Out 시 확인할 것을 말할 수 있는가? |
| 8 | Serverless | FaaS와 BaaS를 구분하고 cold start, vendor lock-in 같은 주의점을 말할 수 있는가? |
| 9 | IaC | 선언형과 명령형의 차이, state 관리가 왜 중요한지 설명할 수 있는가? |
| 10 | 테스트 전략 | 테스트 종류와 테스트 더블을 구분하고 커버리지의 한계를 말할 수 있는가? |
| 11 | 실전 면접 Q&A | 짧은 답변으로 운영 개념의 선택 이유와 트레이드오프를 방어할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| Health Check | 서버가 트래픽을 받을 수 있는 상태인지 확인합니다. |
| Observability | 로그, 메트릭, 트레이스로 내부 상태를 추론합니다. |
| CI/CD | 테스트, 빌드, 배포를 자동화합니다. |
| 무중단 배포 | 롤링, 블루/그린, 카나리로 downtime을 줄입니다. |
| Graceful Shutdown | 진행 중 작업을 마치고 리소스를 정리한 뒤 종료합니다. |
| Scale Up/Out | 사양을 키우거나 서버 수를 늘려 처리량을 높입니다. |
| IaC | 인프라를 코드로 관리해 재현성과 변경 이력을 확보합니다. |

## 면접 답변 프레임

DevOps/Cloud 질문은 도구 이름 나열보다 **왜 그 방식을 쓰고 어떤 대가를 치르는지**가 중요합니다.

1. 정의: 그 개념이 무엇인지 한 문장으로 정리합니다. 예를 들어 Readiness는 트래픽을 받을 준비가 됐는지 확인하는 것입니다.
2. 목적과 트리거: 언제, 왜 필요한지 말합니다. 배포 검증, 장애 감지, 오토스케일링 판단, 종료 신호 수신 같은 트리거를 짚습니다.
3. 동작 방식: 신호와 흐름을 순서대로 설명합니다. 예를 들어 Graceful Shutdown은 SIGTERM 수신 → 신규 요청 차단 → 진행 중 요청 완료 → 자원 정리 순입니다.
4. 트레이드오프: 비용, 복잡도, 가용성, 하위 호환성처럼 무엇을 얻고 무엇을 잃는지 비교합니다. 예를 들어 Blue/Green은 rollback이 빠르지만 환경 비용이 큽니다.
5. 장애와 운영 사례: 잘못 쓰면 어떤 문제가 생기는지 말합니다. 무거운 health check가 오히려 장애를 만들거나, 긴 작업에서 graceful shutdown이 배포를 블로킹하는 사례가 있습니다.

## Health Check

Health Check는 서버 상태가 정상인지 확인하는 기능입니다.

용도:

- 배포 성공 여부 확인
- Load Balancer 대상 제외
- 장애 감지
- 오토스케일링 판단

종류:

| 구분 | 의미 |
| --- | --- |
| Liveness | 프로세스가 살아 있는가 |
| Readiness | 트래픽을 받을 준비가 됐는가 |
| Startup | 초기 구동이 완료됐는가 |

주의:

- DB 같은 외부 의존성을 health check에 포함할지 기준을 정해야 합니다.
- 너무 무거운 health check는 오히려 장애를 만들 수 있습니다.

## Log와 Metric

| 구분 | Log | Metric |
| --- | --- | --- |
| 형태 | 사건 기록 | 숫자 시계열 |
| 용도 | 원인 분석 | 상태 감시, 알람 |
| 예 | error stack trace, request log | CPU, memory, latency, error rate |

수집하면 좋은 지표:

- CPU, memory
- JVM heap, GC
- HTTP latency, error rate
- DB connection pool
- thread pool
- business metric

`System.out.println`보다 logging framework를 쓰는 이유:

- log level
- appender
- format
- 환경별 설정
- MDC trace id

실무 포인트:

- 제품이 성장하면 기능 개발보다 모니터링 환경 구축을 먼저 해야 합니다. 트래픽이 커진 뒤 지표가 없으면 장애 원인을 추론할 수 없기 때문입니다. (출처: 토스)
- 수집 대상을 컴포넌트 지표와 서비스 지표로 나눌 수 있습니다. 컴포넌트 지표는 Redis 커맨드 지연, DB Insert QPS, Kafka Consumer 처리율, 게이트웨이 요청량 변화 등이고, 서비스 지표는 PV, UV, 리텐션 같은 비즈니스 지표입니다. (출처: 토스)
- Metric은 단순 증상 확인을 넘어 원인과 결과를 예상하고 해결책을 제시하는 데 쓰입니다. 즉 상태 감시뿐 아니라 근본 원인 추론에 활용합니다. (출처: 토스)
- 모니터링은 일회성이 아니라 사이클입니다. 모니터링, 문제 파악, 해결책 적용, 카나리 배포 후 이전 버전과의 성능 비교 재모니터링으로 이어지며, 로그는 개선 전후 효과를 확인하는 근거가 됩니다. (출처: 토스)

## Micrometer

Micrometer는 vendor-neutral metrics facade입니다.

역할:

- 애플리케이션 지표 수집
- Prometheus, Datadog 등으로 export
- Spring Boot Actuator와 통합

대표 meter:

| 타입 | 의미 |
| --- | --- |
| Counter | 누적 횟수 |
| Gauge | 현재 값 |
| Timer | 시간 분포 |
| DistributionSummary | 값 분포 |

## CI/CD

| 구분 | 의미 |
| --- | --- |
| CI | 변경 사항을 자주 통합하고 테스트/빌드 자동 검증 |
| Continuous Delivery | 배포 가능한 산출물을 만들고 수동 승인 후 배포 |
| Continuous Deployment | 검증 후 운영까지 자동 배포 |

Pipeline 예:

```text
checkout -> test -> build -> package -> deploy -> health check
```

실무 포인트:

- CI/CD 도입 동기는 수동 배포의 Human Error였습니다. 여러 산출물을 직접 만들어 배포하면 실수가 나기 쉽고, 특히 모바일 앱은 잘못 배포하면 재배포가 어려워 자동화 필요성이 큽니다. (출처: 우아한형제들)
- CI 도구는 무료 사용, 커스터마이징 자유도, 플러그인 생태계, 레퍼런스 풍부함, Remote Access API 제공 여부를 비교해 선택할 수 있습니다. (출처: 우아한형제들)
- 빌드 서버 자체를 Dockerfile로 코드화(베이스 이미지에 JDK, 빌드 도구, SDK를 포함)하면 설정과 설치 과정을 재현 가능하게 만들고 운영 리소스를 절감할 수 있습니다. (출처: 우아한형제들)
- 빌드와 배포 결과를 메신저 채널로 자동 통보하면 팀 전체의 가시성을 확보할 수 있습니다. 통과 시 테스터에게 배포를 요청하고 실패 시 즉시 피드백합니다. (출처: 우아한형제들)

## 무중단 배포

| 전략 | 방식 | 장점 | 주의 |
| --- | --- | --- | --- |
| Rolling | 서버를 순차 교체 | 추가 비용 적음 | 구버전/신버전 공존 |
| Blue/Green | 새 환경 전체 준비 후 전환 | 빠른 rollback | 비용 큼 |
| Canary | 일부 트래픽만 새 버전으로 | 위험 점진 노출 | 모니터링 필요 |

공통 주의:

- 하위 호환성
- DB migration 순서
- health check
- rollback 전략

실무 포인트:

- 변경 규모에 따라 배포 전략을 분기할 수 있습니다. 기존 API 연동에 영향이 없는 Patch/Minor 변경은 Rolling Update로 자동 무중단 배포하고, API 입출력이 바뀌는 Major(breaking change)는 Blue/Green으로 전환하되 수동 승인 후 배포합니다. (출처: 우아한형제들)
- Blue/Green 전환은 신규 버전으로 모든 API 호출을 옮긴 뒤 기존 버전을 삭제하는 흐름입니다. Major 배포를 수동으로 두는 이유는 하위 호환성이 깨질 수 있기 때문입니다. (출처: 우아한형제들)
- breaking change 여부는 oasdiff 같은 도구로 현행 서빙 API와 신규 API의 스펙 차이를 비교해 배포 파이프라인에서 자동 감지할 수 있습니다. (출처: 우아한형제들)
- 배포 명세를 Git으로 선언적으로 관리(GitOps)하면 이전 상태로 되돌리기 쉬워 롤백이 수월합니다. 모델과 산출물을 이미지에 포함(bake-in)해 서빙 로직과 버전을 일치시키면 문제 발생 시 빠르게 복구할 수 있습니다. (출처: 우아한형제들)

## Graceful Shutdown

Graceful Shutdown은 종료 신호를 받아도 즉시 죽지 않고 정리한 뒤 종료하는 방식입니다.

흐름:

1. SIGTERM 수신
2. 신규 요청 차단
3. 진행 중 요청 완료 대기
4. 자원 정리
5. 프로세스 종료

Spring 설정:

```properties
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=20s
```

SIGTERM vs SIGKILL:

| 신호 | 의미 |
| --- | --- |
| SIGTERM | 애플리케이션이 처리 가능한 종료 요청 |
| SIGKILL | 즉시 강제 종료, 정리 불가 |

실무 포인트:

- Graceful shutdown은 만능이 아닙니다. 작업 소요 시간이 수십 분 단위로 길면 진행 중 작업 완료를 기다리는 동안 배포가 블로킹되어 배포 자체가 30분 이상 걸릴 수 있어 병목이 됩니다. (출처: 우아한형제들)
- 대안으로 프로세스를 즉시 종료하되 작업 상태를 외부 DB에 영속화하고, 중단된 작업을 외부에서 감지해 재처리하는 설계를 택할 수 있습니다. 이 방식은 작업의 재처리 가능성(idempotency)과 외부 복구 메커니즘이 전제되어야 합니다. (출처: 우아한형제들)
- Heartbeat 패턴에서는 워커가 주기적으로(예: 1분마다) DB에 생존 신호를 갱신하고, 일정 시간(예: 2분) 이상 갱신이 없으면 스케줄러가 비정상으로 간주해 작업을 대기 상태로 되돌려 다른 인스턴스가 이어받게 합니다. (출처: 우아한형제들)
- 복구 스케줄러가 여러 인스턴스에서 동시에 실행되지 않도록 분산 락(ShedLock류)으로 단일 인스턴스 실행을 보장합니다. 배포 무중단성은 graceful shutdown 단독으로 보장하기 어렵고 작업 상태의 영속성과 재처리 가능성이 함께 설계되어야 합니다. (출처: 우아한형제들)

## Scale Up vs Scale Out

| 구분 | Scale Up | Scale Out |
| --- | --- | --- |
| 방식 | 서버 사양 증가 | 서버 대수 증가 |
| 장점 | 단순 | 가용성, 탄력성 |
| 단점 | 한계 있음, SPOF 해결 어려움 | 로드밸런싱, 세션, 분산 동시성 필요 |

Scale Out 시 확인:

- 세션 저장소
- 분산 락
- 로그/메트릭 통합
- 로드밸런싱 알고리즘
- 배포 자동화

실무 포인트:

- 쿠버네티스 Pod에 기본값(CPU 2 core, Memory 4GiB)으로 할당했지만 실측 결과 0.5 core 미만을 쓰는 Pod이 80%에 달할 만큼 과할당 상태였습니다. 기본값이 아니라 실사용량을 기준으로 리소스를 재설계하는 것이 자원 절감의 출발점입니다. (출처: 카카오페이)
- 수평 확장(HPA, Pod 수 증가)과 수직 확장(VPA, Pod당 리소스 증가)은 함께 사용할 수 없습니다. 이미 HPA를 쓰고 있다면 VPA를 도입할 수 없어 별도의 추천 로직이 필요합니다. (출처: 카카오페이)
- 리소스 추천값은 단순 평균이 아니라 95th percentile에 15% 안전 마진과 최근 2주 데이터를 반영해 산정했습니다. 수집 기간이 짧을수록 신뢰도를 보정해 OOM을 방지하는 통계적 버퍼링 방식입니다. (출처: 카카오페이)
- 기동(warm-up) 시 request 최솟값만 적용하면 순간 리소스 부족으로 Readiness Probe가 실패할 수 있습니다. limit을 상향(Burstable QoS)해 기동 시 여유를 주고 정상 운영 시에는 낮은 request를 유지하는 방식으로 해결했습니다. (출처: 카카오페이)

## Serverless

Serverless는 서버 운영 책임을 클라우드 제공자가 맡고, 개발자는 함수나 관리형 서비스를 조합하는 방식입니다.

| 구분 | 설명 |
| --- | --- |
| FaaS | 이벤트 발생 시 함수 실행 |
| BaaS | 인증, DB, 메시징 같은 완성형 backend 사용 |

장점:

- 사용량 기반 비용
- 자동 확장
- 인프라 관리 감소

주의:

- cold start
- 실행 시간 제한
- vendor lock-in
- 로컬 테스트와 관측 어려움

## IaC

Infrastructure as Code는 인프라를 코드로 관리합니다.

| 방식 | 설명 | 예 |
| --- | --- | --- |
| 선언형 | 원하는 최종 상태를 정의 | Terraform, CloudFormation |
| 명령형 | 수행 절차를 정의 | Ansible |

장점:

- 변경 이력 관리
- 코드 리뷰
- 재현 가능한 환경
- 자동화

주의:

- state 관리
- 권한 관리
- 잘못된 변경의 blast radius

## 테스트 전략

| 테스트 | 설명 |
| --- | --- |
| 단위 테스트 | 작은 단위의 로직 검증 |
| 통합 테스트 | 여러 모듈/외부 시스템 연동 검증 |
| Slice 테스트 | 특정 계층만 로드해 검증 |
| E2E 테스트 | 실제 사용자 흐름 검증 |

테스트 더블:

| 종류 | 의미 |
| --- | --- |
| Dummy | 전달만 되는 객체 |
| Stub | 정해진 응답 제공 |
| Fake | 단순하지만 동작하는 구현 |
| Spy | 호출 기록 |
| Mock | 기대 상호작용 검증 |

커버리지 주의:

- 커버리지가 높아도 좋은 테스트라는 뜻은 아닙니다.
- 중요한 것은 의미 있는 assertion과 경계 조건입니다.

## 실전 면접 Q&A

### Liveness와 Readiness probe는 어떻게 다른가요?

Liveness는 프로세스가 살아 있는지 확인하고, Readiness는 트래픽을 받을 준비가 됐는지 확인합니다. Readiness가 실패하면 Load Balancer 대상에서 제외되고, Liveness가 실패하면 프로세스가 재시작 대상이 됩니다. 초기 구동 완료 여부는 Startup으로 확인합니다.

### health check에 DB 같은 외부 의존성을 포함해야 하나요?

기준을 정해야 합니다. 외부 의존성을 포함하면 의존성 장애를 감지할 수 있지만, health check가 무거워지거나 의존성 일시 장애로 정상 서버까지 제외되어 오히려 장애를 키울 수 있습니다.

### System.out.println 대신 logging framework를 쓰는 이유는 무엇인가요?

log level, appender, format, 환경별 설정, MDC trace id 같은 기능을 활용하기 위해서입니다. 이를 통해 환경마다 출력을 제어하고 요청을 추적할 수 있습니다.

### Continuous Delivery와 Continuous Deployment의 차이는 무엇인가요?

Continuous Delivery는 배포 가능한 산출물까지 자동으로 만들고 운영 배포는 수동 승인 후 진행합니다. Continuous Deployment는 검증을 통과하면 운영까지 자동으로 배포합니다.

### 무중단 배포에서 Blue/Green과 Canary를 어떻게 고르나요?

Blue/Green은 새 환경 전체를 준비한 뒤 전환하므로 rollback이 빠르지만 비용이 큽니다. Canary는 일부 트래픽만 새 버전으로 보내 위험을 점진적으로 노출하므로 모니터링이 필요합니다. 두 방식 모두 하위 호환성, DB migration 순서, health check, rollback 전략을 함께 고려해야 합니다.

### SIGTERM과 SIGKILL의 차이는 무엇인가요?

SIGTERM은 애플리케이션이 처리할 수 있는 종료 요청으로, 신규 요청 차단과 진행 중 요청 완료, 자원 정리를 거쳐 정상 종료할 수 있습니다. SIGKILL은 즉시 강제 종료되어 정리 과정을 수행할 수 없습니다.

### Scale Out을 할 때 무엇을 확인해야 하나요?

세션 저장소, 분산 락, 로그와 메트릭 통합, 로드밸런싱 알고리즘, 배포 자동화를 확인해야 합니다. 서버 대수가 늘면 상태 공유와 분산 동시성 문제가 생기기 때문입니다.

### Serverless의 cold start란 무엇인가요?

함수가 일정 시간 실행되지 않다가 호출될 때 실행 환경을 새로 준비하느라 첫 응답이 느려지는 현상입니다. Serverless는 사용량 기반 비용과 자동 확장이 장점이지만 cold start, 실행 시간 제한, vendor lock-in, 로컬 테스트와 관측의 어려움을 함께 고려해야 합니다.

### IaC의 선언형과 명령형은 어떻게 다른가요?

선언형은 원하는 최종 상태를 정의하고 도구가 그 상태로 수렴시킵니다(Terraform, CloudFormation). 명령형은 수행 절차를 정의합니다(Ansible). 선언형은 state 관리가 중요하며, 잘못된 변경의 blast radius와 권한 관리를 주의해야 합니다.

### 커버리지가 높으면 좋은 테스트인가요?

반드시 그렇지는 않습니다. 커버리지는 코드가 실행됐는지를 보여줄 뿐, 의미 있는 assertion과 경계 조건 검증 여부를 보장하지 않습니다.

## 참고한 기술블로그

- 카카오페이 — 환경미화 프로젝트(부제: 카카오페이 k8s에서 낭비되는 자원을 절약해 보자!): https://tech.kakaopay.com/post/eco-ami/
- 우아한형제들 — 제목은 안정적인 AI 서빙 시스템으로 하겠습니다. 근데 이제 자동화를 곁들인…: https://techblog.woowahan.com/19548/
- 우아한형제들 — 장시간 비동기 작업, Kafka 대신 RDB 기반 Task Queue로 해결하기: https://techblog.woowahan.com/23625/
- 토스 — 가장 많은 트래픽을 받는 토스 서비스의 서버 관리 전략: https://toss.tech/article/monitoring-traffic
- 우아한형제들 — 라이더스 개발팀 모바일에서 CI/CD 도입: https://techblog.woowahan.com/2579/
