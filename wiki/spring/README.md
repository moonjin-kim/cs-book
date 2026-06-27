# Spring

Spring 면접은 **컨테이너가 객체를 어떻게 관리하고, 요청·트랜잭션·JPA 흐름을 프록시와 추상화로 어떻게 처리하는지**를 설명하는 것이 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| Bean | Spring 컨테이너가 객체 생성, 의존성 주입, 생명주기를 관리하는 객체입니다. |
| DI | 객체가 직접 의존 객체를 만들지 않고 외부에서 받아 결합도를 낮춥니다. |
| AOP | 프록시가 메서드 호출 전후에 트랜잭션, 로깅, 보안 같은 공통 기능을 적용합니다. |
| MVC | DispatcherServlet이 요청을 받고 HandlerMapping, Adapter, Controller, Converter 흐름을 조율합니다. |
| Transaction | `@Transactional`은 프록시와 TransactionManager로 트랜잭션 경계를 만듭니다. |
| Boot | starter, 자동 설정, 내장 서버로 Spring 설정 비용을 줄입니다. |
| JPA | EntityManager와 영속성 컨텍스트가 1차 캐시, 변경 감지, 쓰기 지연을 제공합니다. |

## Bean과 DI

### Bean으로 관리하는 이유

| 이유 | 설명 |
| --- | --- |
| 의존성 관리 | 생성자 주입으로 필요한 객체를 컨테이너가 연결합니다. |
| 생명주기 관리 | 생성, 초기화, 소멸 콜백을 컨테이너가 관리합니다. |
| Singleton 관리 | 기본적으로 하나의 인스턴스를 공유해 객체 생성을 줄입니다. |
| AOP 적용 | 트랜잭션, 캐시, 비동기 같은 프록시 기능을 붙일 수 있습니다. |
| 테스트 용이성 | Mock Bean, 테스트 설정으로 의존성을 쉽게 대체할 수 있습니다. |

주의:

- Singleton Bean에 mutable 상태를 두면 여러 요청이 공유하므로 thread-safe하지 않을 수 있습니다.
- 순환 의존성은 설계 문제일 가능성이 높습니다.

### Component Stereotypes

| 애너테이션 | 역할 |
| --- | --- |
| `@Component` | 일반 Spring Bean |
| `@Controller` | MVC 요청 처리 |
| `@Service` | 비즈니스 흐름 조율 |
| `@Repository` | 데이터 접근 계층, 예외 변환 대상 |

`@Service`, `@Controller`, `@Repository`는 모두 `@Component`를 포함하지만, 계층 의미를 드러내고 AOP pointcut이나 예외 변환에 활용됩니다.

## AOP와 프록시

Spring AOP는 기본적으로 **프록시 기반**입니다.

```text
Client -> Proxy -> Target
```

프록시가 할 수 있는 일:

- 메서드 호출 전 트랜잭션 시작
- 메서드 성공 시 commit
- 예외 발생 시 rollback
- 캐시 조회/저장
- 비동기 executor 위임

### Self Invocation 문제

같은 클래스 안에서 메서드를 직접 호출하면 프록시를 거치지 않습니다.

```java
public void outer() {
    inner(); // proxy를 거치지 않음
}

@Transactional
public void inner() {}
```

결과:

- `@Transactional` 적용 안 됨
- `@Async` 적용 안 됨
- `@Cacheable` 적용 안 됨

해결:

- 트랜잭션 경계가 다른 메서드를 별도 Bean으로 분리합니다.
- 자기 자신 프록시 주입은 순환 의존성과 프레임워크 결합이 커져 권장도가 낮습니다.

## 트랜잭션

### 기본 동작

`@Transactional`은 프록시가 메서드 호출을 감싸고 `PlatformTransactionManager`로 트랜잭션을 제어합니다.

```text
Proxy
 -> TransactionManager.begin()
 -> target method
 -> commit or rollback
```

기본 rollback 규칙:

| 예외 | 기본 동작 |
| --- | --- |
| `RuntimeException` | rollback |
| `Error` | rollback |
| checked exception | commit |

checked exception도 rollback하려면 `rollbackFor`를 명시합니다.

### 전파 속성

| 전파 | 동작 |
| --- | --- |
| `REQUIRED` | 있으면 참여, 없으면 새로 시작 |
| `REQUIRES_NEW` | 항상 새 트랜잭션, 기존 트랜잭션 보류 |
| `MANDATORY` | 기존 트랜잭션 필수 |
| `SUPPORTS` | 있으면 참여, 없으면 없이 실행 |
| `NOT_SUPPORTED` | 트랜잭션 없이 실행 |
| `NESTED` | savepoint 기반 중첩 트랜잭션 |
| `NEVER` | 트랜잭션이 있으면 예외 |

주의:

- `REQUIRES_NEW`는 커넥션을 추가로 사용할 수 있습니다.
- 트랜잭션 범위가 길면 lock 점유 시간이 길어집니다.
- 외부 API 호출을 트랜잭션 안에 오래 두지 않는 것이 좋습니다.

## Spring MVC

### 요청 흐름

1. `DispatcherServlet`이 요청을 받습니다.
2. `HandlerMapping`이 Controller 메서드를 찾습니다.
3. `HandlerAdapter`가 메서드 실행을 준비합니다.
4. `ArgumentResolver`가 파라미터를 만듭니다.
5. Controller가 Service를 호출합니다.
6. View 응답이면 `ViewResolver`, JSON 응답이면 `HttpMessageConverter`가 처리합니다.

### RequestBody vs ModelAttribute

| 구분 | `@RequestBody` | `@ModelAttribute` |
| --- | --- | --- |
| 입력 위치 | HTTP Body | Query, Form, Multipart |
| 변환 방식 | `HttpMessageConverter` | Data binding |
| 대표 사용 | JSON API 요청 | 검색 조건, form submit, 파일 업로드 |

### Controller vs RestController

| 구분 | `@Controller` | `@RestController` |
| --- | --- | --- |
| 반환값 | View 이름 | HTTP Body |
| 주 용도 | HTML 렌더링 | REST API |
| 내부 의미 | MVC Controller | `@Controller + @ResponseBody` |

`ResponseEntity<T>`를 쓰면 body뿐 아니라 status code와 header까지 제어할 수 있습니다.

## Filter와 Interceptor

| 구분 | Filter | Interceptor |
| --- | --- | --- |
| 위치 | Servlet container | Spring MVC |
| 실행 시점 | DispatcherServlet 전후 | Controller 전후 |
| 접근 정보 | Servlet request/response | handler method 정보 |
| 사용 예 | CORS, encoding, security chain | 인증 체크, 로깅, 권한 검사 |

## ControllerAdvice와 ExceptionHandler

`@ControllerAdvice`는 여러 Controller에 공통으로 적용할 예외 처리, 바인딩, 모델 설정을 모읍니다.

| 애너테이션 | 역할 |
| --- | --- |
| `@ExceptionHandler` | 특정 예외를 응답으로 변환 |
| `@RestControllerAdvice` | JSON API 예외 응답에 적합 |
| `HandlerExceptionResolver` | MVC 예외 처리 체인 |

## Spring Boot

### Spring vs Spring Boot

| 구분 | Spring | Spring Boot |
| --- | --- | --- |
| 설정 | 직접 구성 많음 | 자동 설정 제공 |
| 의존성 | 개별 선택 | starter 제공 |
| 서버 | 외부 WAS 배포 가능 | 내장 Tomcat/Jetty/Undertow |
| 실행 | 설정 필요 | 실행 가능한 jar 중심 |

### Auto Configuration

`@SpringBootApplication`은 내부적으로 `@EnableAutoConfiguration`을 포함합니다.

자동 설정 판단 기준:

- classpath에 어떤 라이브러리가 있는가
- 사용자가 이미 Bean을 등록했는가
- property가 어떻게 설정되어 있는가
- `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty` 조건이 맞는가

## 설정 주입

| 구분 | `@Value` | `@ConfigurationProperties` |
| --- | --- | --- |
| 용도 | 단일 값 주입 | 설정 묶음 바인딩 |
| Binding | 엄격한 이름 | relaxed binding 지원 |
| 검증 | 불편 | validation 적용 쉬움 |
| 추천 상황 | 간단한 값 | 계층적 설정, 설정 값이 많을 때 |

주의:

- 대상 클래스가 Spring Bean이어야 주입됩니다.
- 필드 주입보다 생성자 주입이 설정 누락을 빨리 드러냅니다.

## JPA와 영속성

### JPA, Hibernate, Spring Data JPA

| 구분 | 역할 |
| --- | --- |
| JPA | ORM 표준 명세 |
| Hibernate | JPA 구현체 |
| Spring Data JPA | Repository 추상화 |
| EntityManager | 영속성 컨텍스트 조작 API |

### 영속성 컨텍스트

| 기능 | 설명 |
| --- | --- |
| 1차 캐시 | 같은 트랜잭션에서 같은 엔티티 동일성 보장 |
| 변경 감지 | 영속 엔티티 변경을 flush 시점에 update |
| 쓰기 지연 | SQL을 모아 flush 시점에 실행 |
| 지연 로딩 | 필요한 시점에 연관 데이터를 조회 |

엔티티 상태:

| 상태 | 설명 |
| --- | --- |
| 비영속 | 새 객체, 아직 관리 안 됨 |
| 영속 | 영속성 컨텍스트가 관리 |
| 준영속 | 한 번 관리됐지만 분리됨 |
| 삭제 | 삭제 예약 |

## JPA 성능 주의점

### N+1

N+1은 부모 N개 조회 후 연관 데이터를 N번 추가 조회하는 문제입니다.

해결 방법:

| 방법 | 특징 |
| --- | --- |
| Fetch Join | 한 쿼리로 연관 엔티티 조회 |
| EntityGraph | Repository 메서드에 fetch graph 적용 |
| Batch Fetch | `IN` 쿼리로 묶어 조회 |
| DTO Projection | 필요한 컬럼만 직접 조회 |

### Fetch Join + Paging

`@OneToMany` fetch join에 paging을 같이 쓰면 Hibernate가 DB paging 대신 메모리 paging을 할 수 있습니다.

위험:

- 전체 결과를 메모리에 올릴 수 있음
- 데이터가 많으면 OOM 가능
- 부모 row가 자식 수만큼 늘어 page 기준이 틀어짐

대안:

- 부모 ID만 먼저 paging
- 이후 batch fetch로 collection 조회
- DTO query 사용

### OneToOne Lazy

양방향 `@OneToOne`에서 FK가 없는 `mappedBy` 쪽은 연관 row 존재 여부를 알기 어려워 lazy loading이 기대대로 동작하지 않을 수 있습니다.

대안:

- FK를 가진 주인 방향 단방향 모델링
- 명시적 fetch join
- 조회 전용 DTO 사용

## ID 생성과 ddl-auto

### ID 생성 전략

| 전략 | 특징 | 주의 |
| --- | --- | --- |
| `IDENTITY` | DB insert 시 ID 생성 | 즉시 insert, batch insert 불리 |
| `SEQUENCE` | sequence로 ID 선할당 | allocationSize로 최적화 가능 |
| `TABLE` | 키 생성 테이블 사용 | 성능 불리 |
| `AUTO` | dialect에 따라 선택 | DB별 동작 확인 필요 |

### ddl-auto

| 옵션 | 동작 | 권장 사용처 |
| --- | --- | --- |
| `none` | 아무 작업 없음 | 운영 |
| `validate` | 매핑 검증만 | 운영 검증 |
| `update` | schema 자동 변경 | 개발 |
| `create` | 시작 시 재생성 | 로컬 |
| `create-drop` | 종료 시 삭제 | 테스트 |

운영 스키마 변경은 Flyway, Liquibase 같은 migration tool을 사용하는 것이 안전합니다.

## OSIV

OSIV는 요청이 끝날 때까지 영속성 컨텍스트를 열어두어 Controller/View에서도 lazy loading을 가능하게 합니다.

| 장점 | 단점 |
| --- | --- |
| LazyInitializationException 감소 | DB connection 점유 시간 증가 |
| Controller에서 엔티티 탐색 가능 | 표현 계층이 엔티티에 의존 |

트래픽이 많거나 read replica, CQRS, 긴 외부 API 호출이 있으면 OSIV 비활성화를 검토합니다.

## 테스트 격리

테스트 격리는 각 테스트가 다른 테스트 상태에 영향을 주지 않게 하는 것입니다.

| 방법 | 장점 | 주의 |
| --- | --- | --- |
| `@DirtiesContext` | 컨텍스트까지 완전 격리 | 매우 느림 |
| `@Sql` cleanup | DB 상태 명시적 초기화 | 스크립트 유지보수 필요 |
| `@Transactional` rollback | 빠르고 간단 | 운영과 다른 트랜잭션 조건 가능 |

주의:

- `RANDOM_PORT` 테스트는 서버가 별도 스레드에서 돌아 rollback이 적용되지 않을 수 있습니다.
- `REQUIRES_NEW`, `@Async`도 테스트 트랜잭션 밖에서 commit될 수 있습니다.
