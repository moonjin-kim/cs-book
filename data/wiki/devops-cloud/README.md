# DevOps와 Cloud

DevOps/Cloud 면접은 **애플리케이션을 어떻게 빌드, 배포, 관측, 확장, 종료, 복구할 수 있게 운영하는지**를 설명하는 것이 핵심입니다.

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

## Graceful Shutdown

Graceful Shutdown은 종료 신호를 받았을 때 즉시 죽지 않고 정리 후 종료하는 방식입니다.

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
