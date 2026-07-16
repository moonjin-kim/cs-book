# Spring

Spring 면접은 **컨테이너가 객체를 어떻게 관리하고, 요청·트랜잭션·JPA 흐름을 프록시와 추상화로 어떻게 처리하는지**를 설명하는 것이 핵심입니다.

처음부터 끝까지 읽기보다 아래 핵심 섹션 단위로 나눠 보는 편이 효율적입니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | IoC 컨테이너와 Bean | Spring은 왜 객체를 Bean으로 관리하고, 생명주기와 scope는 어떻게 동작하는가? |
| 2 | AOP와 프록시 | `@Transactional`, `@Async`, `@Cacheable`은 왜 내부 호출에서 동작하지 않을 수 있는가? |
| 3 | MVC 요청 처리 | DispatcherServlet부터 Controller, ArgumentResolver, Converter, 예외 처리까지 흐름을 설명할 수 있는가? |
| 4 | 트랜잭션 | propagation, isolation, rollback rule, connection 점유를 실무 문제와 연결할 수 있는가? |
| 5 | Spring Boot | 자동 설정, starter, configuration properties, profile, actuator가 어떤 문제를 줄이는가? |
| 6 | JPA와 영속성 | EntityManager, 1차 캐시, 변경 감지, flush, 지연 로딩을 설명할 수 있는가? |
| 7 | JPA 성능과 운영 주의점 | N+1, fetch join paging, ID 전략, ddl-auto, OSIV의 trade-off를 설명할 수 있는가? |
| 8 | 테스트와 실전 Q&A | slice test, `@SpringBootTest`, test transaction rollback, 격리 전략을 설명할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| Bean | Spring 컨테이너가 생성, 의존성 주입, 초기화, 소멸을 관리하는 객체입니다. |
| DI | 객체가 직접 의존 객체를 만들지 않고 외부에서 받아 결합도를 낮춥니다. |
| AOP | 프록시가 메서드 호출 전후에 트랜잭션, 보안, 캐시, 비동기 같은 공통 기능을 적용합니다. |
| MVC | DispatcherServlet이 요청을 받고 HandlerMapping, HandlerAdapter, Controller, Converter 흐름을 조율합니다. |
| Transaction | `@Transactional`은 프록시와 TransactionManager로 트랜잭션 경계를 만듭니다. |
| Boot | starter, 자동 설정, 내장 서버, production-ready 기능으로 설정 비용을 줄입니다. |
| JPA | EntityManager와 영속성 컨텍스트가 1차 캐시, 변경 감지, 쓰기 지연, 지연 로딩을 제공합니다. |
| Test | Spring TestContext가 ApplicationContext와 transaction을 관리하지만 테스트 형태별 rollback 범위가 다릅니다. |

## 면접 답변 프레임

Spring 질문은 애너테이션 이름보다 **프록시, 컨테이너, 경계, 자원 점유**를 기준으로 답하면 강합니다.

1. 진입점: 요청, 메서드 호출, Bean 생성 중 어느 흐름인지 잡습니다.
2. 중간 객체: DispatcherServlet, Proxy, TransactionManager, EntityManager 같은 조율자를 말합니다.
3. 경계: Bean scope, transaction boundary, persistence context, thread boundary를 구분합니다.
4. 실패 모드: self-invocation, LazyInitializationException, N+1, connection pool 고갈, 테스트 오염을 붙입니다.
5. 실무 선택: 언제 기본값을 쓰고 언제 명시적 설정이나 구조 분리가 필요한지 말합니다.

## 1. IoC 컨테이너와 Bean

### IoC와 DI

IoC는 객체 생성과 의존성 연결의 제어 흐름을 애플리케이션 코드가 아니라 컨테이너가 가져가는 구조입니다.

| 구분 | 설명 |
| --- | --- |
| IoC | 객체 생성, 의존성 연결, 생명주기 제어를 컨테이너가 담당 |
| DI | 필요한 의존 객체를 외부에서 주입 |
| Bean | Spring IoC container가 관리하는 객체 |
| ApplicationContext | BeanFactory 기능에 이벤트, 메시지, 리소스 로딩, 환경 추상화 등을 더한 컨테이너 |

Bean으로 관리하는 이유:

- 생성자 주입으로 의존성을 명시할 수 있습니다.
- singleton, prototype, request 같은 scope를 컨테이너가 관리합니다.
- `@Transactional`, `@Async`, `@Cacheable` 같은 AOP 기능을 적용할 수 있습니다.
- 테스트에서 Bean 대체, profile 변경, 설정 분리가 쉬워집니다.
- 초기화와 소멸 콜백을 일관되게 관리할 수 있습니다.

### Bean 생명주기

대표 흐름:

1. Bean definition 등록
2. Bean 인스턴스 생성
3. 의존성 주입
4. `Aware` 계열 callback
5. `BeanPostProcessor` before initialization
6. `@PostConstruct`, `InitializingBean`, custom init method
7. `BeanPostProcessor` after initialization
8. Bean 사용
9. `@PreDestroy`, `DisposableBean`, custom destroy method

면접 포인트:

- AOP proxy는 주로 Bean 생성 후 `BeanPostProcessor` 단계에서 만들어집니다.
- 초기화 시점에 자기 자신 메서드를 호출하면 proxy를 거치지 않을 수 있습니다.
- 생성자에서는 아직 proxy, transaction, lazy association 같은 런타임 기능을 기대하면 안 됩니다.

### 의존성 주입 방식

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| 생성자 주입 | 필수 의존성 명시, 불변성, 테스트 용이 | 순환 의존성이 바로 드러남 |
| setter 주입 | 선택 의존성 표현 가능 | 객체가 불완전한 상태로 존재 가능 |
| field 주입 | 코드가 짧음 | 테스트 어려움, final 불가, 의존성 숨김 |

실무 기준:

- 필수 의존성은 생성자 주입을 기본으로 둡니다.
- 선택 의존성은 setter 또는 `ObjectProvider`를 고려합니다.
- 순환 의존성이 생기면 대부분 역할 분리나 이벤트/포트 분리가 필요한 신호입니다.

실무 포인트:

- `@Bean` 메서드 이름이 그대로 bean name으로 등록되며, 동일 타입 빈이 1개면 이름과 무관하게 타입 기반으로 주입됩니다. (출처: 카카오페이)
- 동일 타입 빈이 여러 개면 `@Qualifier`(bean name 강제 매칭, 실패 시 즉시 오류) > `@Primary`(타입 기반, field name 무시) > `@Priority` > field name ↔ bean name 매칭 순으로 후보가 결정됩니다. (출처: 카카오페이)
- `@Primary` 빈이 존재하면 field name 기반 매칭이 무력화되어 의도치 않은 빈이 주입될 수 있습니다. `@Qualifier`는 후보 탐색 이전 단계에서 처리되므로 `@Primary`보다 우선합니다. (출처: 카카오페이)
- field injection은 빈이 없을 때 런타임에야 NPE로 드러나는 반면, 생성자 주입은 `final` 필드로 컨텍스트 로딩 시점에 오류를 감지할 수 있어 권장됩니다. (출처: 카카오페이)

### Bean Scope

| scope | 의미 | 주의점 |
| --- | --- | --- |
| singleton | 컨테이너당 하나 | mutable field를 두면 여러 요청이 공유 |
| prototype | 요청할 때마다 새 인스턴스 | 소멸 콜백 관리를 컨테이너가 끝까지 해주지 않음 |
| request | HTTP request마다 하나 | web context 필요 |
| session | HTTP session마다 하나 | 메모리 사용과 session lifecycle 주의 |
| application | ServletContext마다 하나 | 웹 애플리케이션 전역 공유 |
| websocket | WebSocket session마다 하나 | 연결 lifecycle 주의 |

짧은 scope Bean을 긴 scope Bean에 주입할 때:

- singleton Bean에 request/session Bean을 직접 주입하면 scope mismatch가 생깁니다.
- scoped proxy 또는 `ObjectProvider`로 실제 사용 시점에 꺼내도록 설계합니다.

### Component Stereotypes

| 애너테이션 | 역할 |
| --- | --- |
| `@Component` | 일반 Spring Bean |
| `@Controller` | MVC 요청 처리 |
| `@RestController` | `@Controller + @ResponseBody` |
| `@Service` | 비즈니스 흐름 조율 |
| `@Repository` | 데이터 접근 계층, 예외 변환 대상 |
| `@Configuration` | Bean 정의를 제공하는 설정 클래스 |

`@Service`, `@Controller`, `@Repository`는 모두 component scan 대상이지만, 계층 의미를 드러내고 AOP pointcut이나 예외 변환에 활용됩니다.

### 순환 의존성

순환 의존성은 A가 B를, B가 다시 A를 필요로 하는 구조입니다.

```text
OrderService -> PaymentService -> OrderService
```

문제:

- 책임 경계가 흐려졌을 가능성이 큽니다.
- 생성자 주입에서는 애플리케이션 시작 시 바로 실패합니다.
- setter/field 주입으로 우회해도 초기화 순서와 proxy 적용 문제가 남을 수 있습니다.

대응:

- 공통 책임을 별도 Bean으로 분리합니다.
- 직접 호출 대신 domain event나 application event를 검토합니다.
- 정말 지연 참조가 필요하면 `ObjectProvider`, `@Lazy`를 쓰되 설계 냄새인지 먼저 봅니다.

## 2. AOP와 프록시

### Spring AOP 기본 구조

Spring AOP는 기본적으로 proxy 기반입니다.

```text
Client -> Proxy -> Target
```

프록시가 할 수 있는 일:

- 메서드 호출 전 트랜잭션 시작
- 메서드 성공 시 commit
- 예외 발생 시 rollback
- 캐시 조회/저장
- 보안 검사
- 비동기 executor 위임
- metric, logging, tracing

### JDK Dynamic Proxy vs CGLIB

| 구분 | JDK Dynamic Proxy | CGLIB Proxy |
| --- | --- | --- |
| 기반 | interface | class 상속 |
| 필요 조건 | interface 필요 | 상속 가능한 class/method 필요 |
| final class/method | 영향 적음 | proxy 적용 어려움 |
| Spring Boot 기본 경향 | 설정에 따라 다름 | class 기반 proxy를 기본으로 쓰는 경우가 많음 |

면접 포인트:

- proxy는 target을 감싼 객체이므로 proxy를 거친 외부 호출에 advice가 적용됩니다.
- final class, final method, private method는 class 기반 proxy에서 제한이 생깁니다.
- 인터페이스 기반 proxy는 인터페이스에 노출된 메서드 중심으로 동작합니다.

### Advice와 Pointcut

| 개념 | 설명 |
| --- | --- |
| Join point | advice를 적용할 수 있는 지점 |
| Pointcut | 어떤 join point에 적용할지 고르는 조건 |
| Advice | 실제로 실행할 공통 로직 |
| Advisor | pointcut과 advice의 조합 |

Advice 종류:

| 종류 | 실행 시점 |
| --- | --- |
| `@Before` | target method 전 |
| `@AfterReturning` | 정상 반환 후 |
| `@AfterThrowing` | 예외 발생 후 |
| `@After` | 성공/실패와 무관하게 종료 후 |
| `@Around` | 호출 전후 전체 감싸기 |

### Self Invocation 문제

같은 클래스 안에서 메서드를 직접 호출하면 proxy를 거치지 않습니다.

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
- 보안, metric, retry AOP도 기대와 다를 수 있음

해결:

- 트랜잭션 경계가 다른 메서드를 별도 Bean으로 분리합니다.
- public service method를 외부에서 호출하도록 application service를 나눕니다.
- 자기 자신 proxy 주입이나 `AopContext` 사용은 프레임워크 결합과 순환 의존성이 커져 우선순위가 낮습니다.

실무 포인트:

- Spring AOP는 JDK Dynamic Proxy든 CGLIB든 `this`를 통한 내부 함수 호출은 프록시를 거치지 않아 부가기능이 동작하지 않으며, private/protected 메서드에도 프록시 기반 AOP는 적용되지 않습니다. (출처: 카카오페이)
- Pointcut 표현식은 컴파일 시점에 검증되지 않아, 패키지·클래스명을 변경하면 AOP가 조용히 빠지고 런타임에야 발견됩니다. (출처: 카카오페이)
- `joinPoint.args`가 타입 정보 없는 배열로 반환되어 인자명·순서 변경 시 런타임 오류가 나고, `@Cacheable`의 SpEL key도 인자명 불일치 시 잘못된 캐시 키를 만들지만 컴파일에서 잡히지 않습니다. (출처: 카카오페이)
- 내부 호출 우회를 위해 클래스를 분리하면 서비스 레이어 계층이 늘어나 복잡도가 증가하는 트레이드오프가 있습니다. (출처: 카카오페이)

## 3. MVC 요청 처리

### DispatcherServlet 요청 흐름

1. Filter chain을 통과합니다.
2. `DispatcherServlet`이 요청을 받습니다.
3. `HandlerMapping`이 Controller method를 찾습니다.
4. `HandlerAdapter`가 method 호출을 준비합니다.
5. `HandlerMethodArgumentResolver`가 parameter를 만듭니다.
6. Controller가 Service를 호출합니다.
7. 반환값을 `HandlerMethodReturnValueHandler`가 처리합니다.
8. JSON 응답이면 `HttpMessageConverter`가 body를 직렬화합니다.
9. 예외가 발생하면 `HandlerExceptionResolver` 체인이 응답으로 변환합니다.

### 요청 데이터 바인딩

| 구분 | 입력 위치 | 변환 방식 | 대표 사용 |
| --- | --- | --- | --- |
| `@PathVariable` | URI path | path 변수 추출 | `/users/{id}` |
| `@RequestParam` | query/form parameter | 단일 값 또는 간단 객체 | 검색 조건, paging |
| `@ModelAttribute` | query/form/multipart | data binding | form submit, multipart |
| `@RequestBody` | HTTP body | `HttpMessageConverter` | JSON API 요청 |
| `@RequestHeader` | header | header 값 추출 | 인증, trace id |
| `@CookieValue` | cookie | cookie 값 추출 | session, preference |

`@RequestBody` vs `@ModelAttribute`:

| 구분 | `@RequestBody` | `@ModelAttribute` |
| --- | --- | --- |
| 입력 | body | query, form, multipart |
| 변환 | `HttpMessageConverter` | WebDataBinder |
| 검증 | `@Valid`, `@Validated` | `@Valid`, `@Validated` |
| 대표 | JSON API | form, 파일 업로드, 검색 조건 |

### Response Handling

| 방식 | 의미 |
| --- | --- |
| `@Controller` + 문자열 반환 | View 이름으로 해석 |
| `@ResponseBody` | 반환 객체를 HTTP body로 직렬화 |
| `@RestController` | 모든 handler에 `@ResponseBody` 적용 |
| `ResponseEntity<T>` | status, header, body를 함께 제어 |

실무 기준:

- API는 status code, error body, header 제어가 필요하면 `ResponseEntity`를 씁니다.
- 단순 성공 응답은 객체 반환만으로도 충분합니다.
- error response는 전역 예외 처리와 표준 형식을 정합니다.

### Filter, Interceptor, ArgumentResolver

| 구분 | 위치 | 사용 예 |
| --- | --- | --- |
| Filter | Servlet container, DispatcherServlet 전후 | CORS, encoding, security chain, request wrapping |
| Interceptor | Spring MVC, handler 전후 | 인증 체크, 로깅, 권한 검사 |
| ArgumentResolver | Controller method parameter 생성 | 로그인 사용자, 커스텀 request context |
| Converter/Formatter | 문자열과 객체 변환 | enum, 날짜, id 타입 변환 |

주의:

- Spring Security는 주로 filter chain에서 동작합니다.
- Interceptor는 handler method 정보를 알 수 있어 MVC 인증/로깅에 유리합니다.
- ArgumentResolver는 Controller 반복 코드를 줄이지만 숨은 의존성을 만들 수 있습니다.

실무 포인트:

- Access log에는 실제 요청 URL(`/v1/orders/A0000001`)만 남아 컨트롤러의 URL 패턴(`/v1/orders/{id}`)과 매핑하기 어렵습니다. 이는 다수 API 중 미사용 API를 찾을 때의 출발점 문제입니다. (출처: 우아한형제들)
- `RequestMappingHandlerMapping`은 매칭된 URL 패턴을 `HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE` 속성으로 `HttpServletRequest`에 저장하므로, Interceptor의 `preHandle()`에서 이 속성을 읽으면 패턴 단위 로그를 남길 수 있습니다. 핸들러 정보를 활용하는 로깅은 Filter보다 Interceptor가 유리합니다. (출처: 우아한형제들)
- `RequestMappingHandlerMapping.getHandlerMethods()`로 등록된 전체 (HTTP method, URL 패턴) 목록을 얻고, 수집한 호출 카운트가 0인 항목을 미사용 API로 판별할 수 있습니다. (출처: 우아한형제들)

### Validation

| 위치 | 방법 |
| --- | --- |
| 요청 DTO | `@Valid`, `@Validated` |
| 필드 제약 | `@NotNull`, `@NotBlank`, `@Size`, `@Pattern` |
| 그룹 검증 | validation groups |
| 비즈니스 규칙 | service/domain method에서 명시적으로 검증 |

주의:

- Bean Validation은 형식과 단순 제약에 적합합니다.
- DB 조회가 필요한 중복 검사, 상태 전이 검사 같은 비즈니스 규칙은 service/domain 영역에서 처리하는 편이 명확합니다.
- 검증 실패 응답 형식을 `@RestControllerAdvice`로 표준화합니다.

### ControllerAdvice와 ExceptionHandler

`@ControllerAdvice`는 여러 Controller에 공통으로 적용할 예외 처리, 바인딩, 모델 설정을 모읍니다.

| 도구 | 역할 |
| --- | --- |
| `@ExceptionHandler` | 특정 예외를 응답으로 변환 |
| `@RestControllerAdvice` | JSON API 예외 응답에 적합 |
| `HandlerExceptionResolver` | MVC 예외 처리 체인 |
| `ProblemDetail` | 표준화된 오류 응답 표현에 활용 가능 |

실무 기준:

- domain exception과 infrastructure exception을 구분합니다.
- 클라이언트 오류는 4xx, 서버 오류는 5xx로 명확히 매핑합니다.
- 내부 예외 메시지를 그대로 노출하지 않습니다.

실무 포인트:

- `IllegalArgumentException`은 클라이언트 잘못뿐 아니라 프레임워크/라이브러리 내부 버그(예: `Thread.setPriority()`)로도 발생하므로, 일괄 400으로 매핑하면 서버 결함이 클라이언트 잘못으로 오인되어 대응이 지연됩니다. Spring 기본 동작도 이 예외를 500으로 처리합니다. (출처: 우아한형제들)
- 4xx/5xx 판단 기준은 오류 책임이 클라이언트냐 서버냐입니다. 4xx는 요청 수정 없이는 재시도가 무의미한 경우, 5xx는 일시 장애일 수 있어 backoff 재시도가 가능한 경우입니다. (출처: 우아한형제들)
- 상태 코드를 혼용하면 모니터링이 망가집니다. 서버 오류를 4xx로 내리면 신속 대응이 어렵고, 클라이언트 오류를 5xx로 올리면 경보 피로도가 증가합니다. (출처: 우아한형제들)
- 범용 예외를 직접 400에 매핑하지 말고 `code`를 가진 커스텀 비즈니스 예외 계층을 정의한 뒤, `@RestControllerAdvice` + `@ExceptionHandler`로 의도된 클라이언트 오류만 400으로 매핑하고 예상치 못한 예외는 기본 500 동작에 맡기는 전략이 권장됩니다. (출처: 우아한형제들)

## 4. 트랜잭션

### `@Transactional` 기본 동작

`@Transactional`은 proxy가 method 호출을 감싸고 `PlatformTransactionManager`로 transaction을 제어합니다.

```text
Client
 -> Transaction Proxy
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

```java
@Transactional(rollbackFor = IOException.class)
public void importFile() throws IOException {
    // ...
}
```

실무 포인트:

- 예외가 프록시를 통과하면 `TransactionInterceptor`가 `rollbackOn`을 확인해 unchecked exception이면 트랜잭션에 rollback-only를 마킹하며, 이 마킹은 트랜잭션 단위이므로 호출자가 예외를 catch해도 커밋 시점에 롤백됩니다. (출처: 하이퍼커넥트)
- 반대로 프록시를 거치지 않은 메서드에서 발생한 예외를 catch하면 마킹이 없어 정상 커밋되고, self-invocation에서는 `REQUIRES_NEW`를 선언해도 새 트랜잭션이 열리지 않습니다. (출처: 하이퍼커넥트)
- Kotlin은 checked exception 선언 강제가 없어 checked exception이 프록시를 통과하면 `UndeclaredThrowableException`(RuntimeException 계열)으로 래핑되어 의도와 달리 롤백되므로, `@Throws`를 명시해야 checked exception이 그대로 전달됩니다. (출처: 하이퍼커넥트)
- `REQUIRES_NEW`는 동일 스레드에서 수행되는 새 물리 트랜잭션이라, 이미 커밋된 자식은 부모가 롤백돼도 되돌아가지 않고, ThreadLocal 기반이라 `@Async` 등 다른 스레드에는 전파되지 않습니다. (출처: 하이퍼커넥트)
- 긴 트랜잭션을 `REQUIRES_NEW` + 커서 기반 배치로 분할하면 재시도 시 이미 성공한 분량을 재처리하지 않으면서 트랜잭션 점유 시간을 줄일 수 있습니다. (출처: 하이퍼커넥트)

### Propagation

| 전파 | 동작 | 실무 주의 |
| --- | --- | --- |
| `REQUIRED` | 있으면 참여, 없으면 새로 시작 | 기본값 |
| `REQUIRES_NEW` | 항상 새 트랜잭션, 기존 트랜잭션 보류 | connection 추가 사용 가능 |
| `MANDATORY` | 기존 트랜잭션 필수 | 없으면 예외 |
| `SUPPORTS` | 있으면 참여, 없으면 없이 실행 | 읽기 보조 로직 |
| `NOT_SUPPORTED` | 트랜잭션 없이 실행 | 긴 외부 호출 분리 |
| `NESTED` | savepoint 기반 중첩 | transaction manager와 DB 지원 필요 |
| `NEVER` | 트랜잭션이 있으면 예외 | 트랜잭션 금지 영역 |

`REQUIRES_NEW` 주의:

- outer transaction이 connection을 잡고 있는 상태에서 inner transaction이 새 connection을 요구할 수 있습니다.
- pool size가 작고 동시 요청이 많으면 connection pool이 고갈될 수 있습니다.

### Isolation

| 격리 수준 | 방지하는 현상 | 설명 |
| --- | --- | --- |
| `READ_UNCOMMITTED` | 거의 없음 | dirty read 가능 |
| `READ_COMMITTED` | dirty read | commit된 데이터만 읽음 |
| `REPEATABLE_READ` | dirty read, non-repeatable read | 같은 row 반복 읽기 일관성 |
| `SERIALIZABLE` | dirty, non-repeatable, phantom read | 가장 강하지만 동시성 낮음 |

주의:

- 실제 동작은 DB 구현체와 MVCC/lock 정책에 따라 달라질 수 있습니다.
- MySQL InnoDB의 `REPEATABLE_READ`, PostgreSQL의 `READ_COMMITTED`처럼 기본값이 다릅니다.
- isolation을 올리기 전에 비즈니스 정합성 조건과 lock 범위를 먼저 파악합니다.

### readOnly, timeout, rollbackFor

| 속성 | 의미 | 주의 |
| --- | --- | --- |
| `readOnly` | 읽기 transaction 힌트 | DB/driver/JPA 구현에 따라 최적화 범위 다름 |
| `timeout` | 제한 시간 | 긴 lock 대기와 장애 전파 완화 |
| `rollbackFor` | rollback 대상 예외 추가 | checked exception rollback 필요 시 |
| `noRollbackFor` | rollback 제외 예외 | 신중히 사용 |

### TransactionSynchronizationManager

Spring은 transaction context를 thread-bound resource로 관리합니다.

핵심:

- DataSource transaction에서는 connection이 현재 thread에 묶입니다.
- JPA에서는 EntityManager와 persistence context가 transaction 범위와 연결됩니다.
- `@Async`로 다른 thread로 넘어가면 기존 transaction context가 자동 전파되지 않습니다.
- 같은 thread 안에서도 proxy를 거치지 않는 내부 호출은 transaction advice가 적용되지 않습니다.

### 트랜잭션 경계 설계

좋은 기준:

- DB 변경 단위와 비즈니스 불변식 단위를 transaction으로 묶습니다.
- 외부 API 호출, 파일 업로드, 긴 계산을 transaction 안에 오래 두지 않습니다.
- lock을 잡은 상태에서 network I/O를 기다리지 않습니다.
- 이벤트 발행과 DB 저장을 함께 다룰 때는 transactional outbox 같은 패턴을 검토합니다.

## 5. Spring Boot

### Spring vs Spring Boot

| 구분 | Spring | Spring Boot |
| --- | --- | --- |
| 설정 | 직접 구성 많음 | 자동 설정 제공 |
| 의존성 | 개별 선택 | starter 제공 |
| 서버 | 외부 WAS 배포 가능 | 내장 Tomcat/Jetty/Undertow |
| 실행 | 설정 필요 | 실행 가능한 jar 중심 |
| 운영 기능 | 직접 조합 | Actuator, metrics, health 등 제공 |

### `@SpringBootApplication`

`@SpringBootApplication`은 대표적으로 다음을 포함합니다.

| 구성 | 의미 |
| --- | --- |
| `@SpringBootConfiguration` | Boot 애플리케이션 설정 클래스 |
| `@EnableAutoConfiguration` | classpath와 조건을 보고 자동 설정 |
| `@ComponentScan` | 현재 package 하위 component scan |

주의:

- main class package 위치가 component scan 범위를 결정합니다.
- scan 범위가 너무 넓으면 의도하지 않은 Bean이 등록되고 테스트 비용이 늘 수 있습니다.

### Auto Configuration

Spring Boot 자동 설정은 애플리케이션이 필요할 법한 Bean을 조건부로 등록합니다.

주요 조건:

| 조건 | 의미 |
| --- | --- |
| `@ConditionalOnClass` | 특정 class가 classpath에 있을 때 |
| `@ConditionalOnMissingBean` | 사용자가 같은 역할의 Bean을 등록하지 않았을 때 |
| `@ConditionalOnBean` | 특정 Bean이 이미 있을 때 |
| `@ConditionalOnProperty` | 설정 property가 조건을 만족할 때 |
| `@ConditionalOnWebApplication` | web application일 때 |

면접 답변:

- starter가 dependency를 모아 classpath를 구성합니다.
- auto-configuration이 classpath, property, Bean 존재 여부를 보고 후보 설정을 적용합니다.
- 사용자가 직접 Bean을 등록하면 `@ConditionalOnMissingBean` 때문에 기본 자동 설정을 대체할 수 있습니다.

### 설정 주입

| 구분 | `@Value` | `@ConfigurationProperties` |
| --- | --- | --- |
| 용도 | 단일 값 주입 | 설정 묶음 바인딩 |
| Binding | SpEL, placeholder | relaxed binding |
| 검증 | 불편 | validation 적용 쉬움 |
| 추천 상황 | 간단한 값 | 계층적 설정, 설정 값이 많을 때 |

`@ConfigurationProperties`가 좋은 경우:

- `payment.timeout`, `payment.retry.max-count`처럼 묶음 설정이 많습니다.
- 설정값 검증이 필요합니다.
- IDE metadata와 문서화가 중요합니다.
- 운영 profile별 설정 차이를 구조적으로 관리하고 싶습니다.

### Profile과 Environment

Profile은 환경별 Bean과 설정을 분리하는 도구입니다.

사용 예:

- `local`, `test`, `dev`, `prod`
- local에서는 fake client, prod에서는 real client
- test에서는 embedded/testcontainer DB 설정

주의:

- profile 조합이 많아지면 실제 운영 설정을 추적하기 어려워집니다.
- 민감 정보는 repository에 두지 말고 secret manager나 환경 변수로 분리합니다.
- profile마다 schema, cache, queue 설정이 달라지는 지점을 문서화합니다.

### Actuator와 운영 기능

Spring Boot Actuator는 HTTP 또는 JMX로 운영 기능을 제공합니다.

| 기능 | 질문 |
| --- | --- |
| health | 애플리케이션이 트래픽을 받아도 되는가? |
| metrics | latency, throughput, error, resource 사용량은 어떤가? |
| env/configprops | 현재 설정이 무엇인가? |
| loggers | 런타임에 로그 레벨을 조정해야 하는가? |
| beans | 어떤 Bean이 등록됐는가? |
| caches | cache 상태를 확인해야 하는가? |

주의:

- actuator endpoint는 노출 범위를 최소화하고 인증/인가를 적용합니다.
- health는 liveness와 readiness 관점으로 나눠 봅니다.
- metrics tag cardinality가 높으면 monitoring 비용과 성능 문제가 생길 수 있습니다.

## 6. JPA와 영속성

### JPA, Hibernate, Spring Data JPA

| 구분 | 역할 |
| --- | --- |
| JPA | ORM 표준 명세 |
| Hibernate | JPA 구현체 |
| Spring Data JPA | Repository 추상화 |
| EntityManager | 영속성 컨텍스트 조작 API |

면접 답변:

- Spring Data JPA는 JPA 자체가 아니라 Repository 구현을 줄여주는 추상화입니다.
- 실제 SQL 생성과 엔티티 상태 관리는 Hibernate 같은 JPA provider가 담당합니다.
- transaction과 persistence context 경계를 모르면 lazy loading, dirty checking, flush 시점을 설명하기 어렵습니다.

### 영속성 컨텍스트

| 기능 | 설명 |
| --- | --- |
| 1차 캐시 | 같은 persistence context에서 같은 엔티티 동일성 보장 |
| 변경 감지 | 영속 엔티티 변경을 flush 시점에 update |
| 쓰기 지연 | SQL을 모아 flush 시점에 실행 |
| 지연 로딩 | 필요한 시점에 연관 데이터를 조회 |

엔티티 상태:

| 상태 | 설명 |
| --- | --- |
| 비영속 | 새 객체, 아직 관리 안 됨 |
| 영속 | persistence context가 관리 |
| 준영속 | 한 번 관리됐지만 분리됨 |
| 삭제 | 삭제 예약 |

### Flush

Flush는 persistence context의 변경 내용을 DB SQL로 동기화하는 작업입니다.

발생 시점:

- transaction commit 전
- JPQL query 실행 전
- 명시적 `flush()`
- flush mode에 따른 시점

주의:

- flush는 commit이 아닙니다.
- flush 후에도 transaction이 rollback되면 DB 변경은 취소됩니다.
- query 실행 전 flush 때문에 예상보다 이른 SQL이 나갈 수 있습니다.

### Dirty Checking

Dirty checking은 영속 엔티티의 변경을 감지해 update SQL을 만드는 기능입니다.

조건:

- 엔티티가 persistence context에서 영속 상태입니다.
- transaction 안에서 변경합니다.
- flush 시점에 snapshot과 현재 상태를 비교합니다.

주의:

- 준영속 엔티티를 변경해도 자동 update되지 않습니다.
- 불필요한 setter 공개는 의도치 않은 update를 만들 수 있습니다.
- 도메인 메서드로 상태 변경 의도를 드러내는 편이 좋습니다.

### Spring Data JPA `save()`

`save()`는 신규 엔티티면 `persist`, 기존 엔티티면 `merge`를 선택합니다.

주의:

- `merge`는 전달 객체를 그대로 영속화하는 것이 아니라 병합된 managed instance를 반환합니다.
- 직접 ID를 할당하면 신규 여부 판단이 애매해질 수 있습니다.
- `Persistable` 구현이나 version field로 신규 판단을 명확히 할 수 있습니다.

## 7. JPA 성능과 운영 주의점

### N+1

N+1은 부모 N개 조회 후 연관 데이터를 N번 추가 조회하는 문제입니다.

해결 방법:

| 방법 | 특징 | 주의 |
| --- | --- | --- |
| Fetch Join | 한 쿼리로 연관 엔티티 조회 | to-many paging 주의 |
| EntityGraph | Repository method에 fetch graph 적용 | 복잡한 조건에는 한계 |
| Batch Fetch | `IN` 쿼리로 묶어 조회 | batch size 튜닝 필요 |
| DTO Projection | 필요한 컬럼만 직접 조회 | 변경 감지 대상 아님 |

### Fetch Join + Paging

`@OneToMany` fetch join에 paging을 같이 쓰면 Hibernate가 DB paging 대신 memory paging을 할 수 있습니다.

위험:

- 전체 결과를 메모리에 올릴 수 있습니다.
- 데이터가 많으면 OOM 가능성이 있습니다.
- 부모 row가 자식 수만큼 늘어나 page 기준이 틀어질 수 있습니다.

대안:

- 부모 ID만 먼저 paging합니다.
- 이후 batch fetch로 collection을 조회합니다.
- 조회 전용 DTO query를 사용합니다.

### OneToOne Lazy

양방향 `@OneToOne`에서 FK가 없는 `mappedBy` 쪽은 연관 row 존재 여부를 알기 어려워 lazy loading이 기대대로 동작하지 않을 수 있습니다.

대안:

- FK를 가진 주인 방향 단방향 모델링
- 명시적 fetch join
- 조회 전용 DTO
- bytecode enhancement 검토

### ID 생성 전략

| 전략 | 특징 | 주의 |
| --- | --- | --- |
| `IDENTITY` | DB insert 시 ID 생성 | 즉시 insert, batch insert 불리 |
| `SEQUENCE` | sequence로 ID 선할당 | allocationSize로 최적화 가능 |
| `TABLE` | 키 생성 테이블 사용 | 성능 불리 |
| `AUTO` | dialect에 따라 선택 | DB별 동작 확인 필요 |

면접 포인트:

- `IDENTITY`는 insert 후에야 ID를 알 수 있어 batch insert 최적화에 불리합니다.
- `SEQUENCE`는 allocationSize와 DB sequence increment를 맞춰야 합니다.
- 운영 DB별 dialect와 전략 차이를 확인해야 합니다.

### ddl-auto

| 옵션 | 동작 | 권장 사용처 |
| --- | --- | --- |
| `none` | 아무 작업 없음 | 운영 |
| `validate` | 매핑 검증만 | 운영 검증 |
| `update` | schema 자동 변경 | 개발 |
| `create` | 시작 시 재생성 | 로컬 |
| `create-drop` | 종료 시 삭제 | 테스트 |

운영 스키마 변경은 Flyway, Liquibase 같은 migration tool을 사용하는 것이 안전합니다.

### OSIV

OSIV는 요청이 끝날 때까지 persistence context를 열어두어 Controller/View에서도 lazy loading이 가능합니다.

| 장점 | 단점 |
| --- | --- |
| LazyInitializationException 감소 | DB connection 점유 시간 증가 |
| Controller에서 엔티티 탐색 가능 | 표현 계층이 엔티티에 의존 |
| View 렌더링 편의 | 긴 외부 API 호출 중 connection 점유 가능 |

트래픽이 많거나 read replica, CQRS, 긴 외부 API 호출이 있으면 OSIV 비활성화를 검토합니다.

## 8. 테스트와 실전 Q&A

### 테스트 종류

| 테스트 | 목적 | 비용 |
| --- | --- | --- |
| 단위 테스트 | Spring 없이 순수 객체 검증 | 낮음 |
| slice test | MVC, JPA 등 특정 계층만 검증 | 중간 |
| `@SpringBootTest` | 전체 ApplicationContext 검증 | 높음 |
| end-to-end test | 실제 HTTP/DB/외부 의존성 포함 | 높음 |

대표 slice:

| 애너테이션 | 범위 |
| --- | --- |
| `@WebMvcTest` | Controller, MVC infrastructure 중심 |
| `@DataJpaTest` | JPA repository, EntityManager 중심 |
| `@JsonTest` | JSON serialization/deserialization |
| `@RestClientTest` | REST client 관련 Bean |

### MockMvc와 통합 테스트

| 도구 | 특징 |
| --- | --- |
| `MockMvc` | Servlet container 없이 MVC 요청/응답 테스트 |
| `WebTestClient` | WebFlux 또는 server test client |
| `TestRestTemplate` | 실제 port로 HTTP 호출 |
| `@SpringBootTest(webEnvironment = RANDOM_PORT)` | 내장 서버를 띄운 통합 테스트 |

주의:

- `MockMvc`는 빠르지만 실제 network stack 전체를 검증하지 않습니다.
- `RANDOM_PORT` 테스트는 서버가 별도 thread에서 돌아 test transaction rollback 범위가 다를 수 있습니다.

### 테스트 격리

| 방법 | 장점 | 주의 |
| --- | --- | --- |
| `@Transactional` rollback | 빠르고 간단 | 운영과 다른 transaction 조건 가능 |
| `@Sql` cleanup | DB 상태 명시적 초기화 | 스크립트 유지보수 필요 |
| `@DirtiesContext` | ApplicationContext까지 완전 격리 | 매우 느림 |
| Testcontainers | 실제 DB와 가까운 검증 | 실행 비용 증가 |

주의:

- Spring test transaction은 기본적으로 test method 종료 후 rollback됩니다.
- manual flush가 없으면 Hibernate test에서 false positive가 날 수 있습니다.
- `REQUIRES_NEW`, `@Async`, 별도 thread 작업은 test transaction 밖에서 commit될 수 있습니다.

### 자주 나오는 Spring 면접 질문

#### IoC / Bean

| 질문 | 답변 핵심 |
| --- | --- |
| Spring이 객체를 Bean으로 관리하는 이유는? | DI, lifecycle, scope, AOP, test 대체, 설정 일관성을 얻기 위해서입니다. |
| BeanFactory와 ApplicationContext 차이는? | ApplicationContext가 BeanFactory 기능에 이벤트, 메시지, 리소스, 환경 추상화 등을 더합니다. |
| Singleton Bean은 thread-safe한가? | Bean 인스턴스가 하나라는 뜻이지 내부 mutable state가 thread-safe하다는 뜻은 아닙니다. |
| 생성자 주입을 선호하는 이유는? | 필수 의존성, 불변성, 테스트 용이성, 순환 의존성 조기 발견 때문입니다. |
| 순환 의존성이 생기면 어떻게 하나? | 역할을 분리하고, 필요하면 이벤트나 지연 조회를 검토합니다. |

#### AOP / Transaction

| 질문 | 답변 핵심 |
| --- | --- |
| self-invocation에서 `@Transactional`이 안 되는 이유는? | 같은 객체 내부 호출은 proxy를 거치지 않기 때문입니다. |
| JDK proxy와 CGLIB proxy 차이는? | JDK는 interface 기반, CGLIB은 class 상속 기반입니다. |
| checked exception에서 rollback하려면? | `rollbackFor`를 명시합니다. |
| `REQUIRES_NEW`의 위험은? | 기존 transaction을 보류하고 새 connection이 필요할 수 있어 pool 고갈 위험이 있습니다. |
| `@Async`와 transaction을 같이 쓸 때 주의점은? | thread가 바뀌면 transaction context가 자동 전파되지 않습니다. |

#### MVC / Boot

| 질문 | 답변 핵심 |
| --- | --- |
| DispatcherServlet 역할은? | front controller로 요청을 받아 handler 조회, 호출, 응답 변환을 조율합니다. |
| Filter와 Interceptor 차이는? | Filter는 Servlet container, Interceptor는 Spring MVC handler 전후에 위치합니다. |
| `@RequestBody`와 `@ModelAttribute` 차이는? | body를 message converter로 읽는지, query/form/multipart를 data binding하는지의 차이입니다. |
| Boot 자동 설정은 어떻게 동작하나? | classpath, property, Bean 존재 여부를 조건으로 Bean을 등록합니다. |
| Actuator를 운영에서 열 때 주의점은? | endpoint 노출 범위, 인증/인가, 민감 정보 노출을 제어해야 합니다. |

#### JPA / Test

| 질문 | 답변 핵심 |
| --- | --- |
| 영속성 컨텍스트의 장점은? | 1차 캐시, 동일성 보장, 변경 감지, 쓰기 지연을 제공합니다. |
| N+1 해결 방법은? | fetch join, EntityGraph, batch fetch, DTO projection을 상황에 맞게 씁니다. |
| OSIV 장단점은? | lazy loading 편의는 있지만 connection 점유와 계층 의존 위험이 있습니다. |
| `ddl-auto=update`를 운영에서 피하는 이유는? | 의도치 않은 schema 변경과 데이터 손실/불일치 위험이 있습니다. |
| Spring test rollback의 한계는? | 별도 thread, `REQUIRES_NEW`, `@Async`, 실제 HTTP server 경계에서는 기대와 다를 수 있습니다. |

## 참고한 공식 문서

- Spring Framework Reference 6.2: https://docs.spring.io/spring-framework/reference/6.2/
- Spring Framework Transaction Management: https://docs.spring.io/spring-framework/reference/6.2/data-access/transaction/
- Spring Framework MVC: https://docs.spring.io/spring-framework/reference/6.2/web/webmvc.html
- Spring Framework Testing: https://docs.spring.io/spring-framework/reference/6.2/testing/
- Spring Boot Reference 3.5: https://docs.spring.io/spring-boot/3.5/
- Spring Boot Auto-Configuration API: https://docs.spring.io/spring-boot/3.5/api/java/org/springframework/boot/autoconfigure/EnableAutoConfiguration.html
- Spring Boot Actuator: https://docs.spring.io/spring-boot/3.5/reference/actuator/

## 참고한 기술블로그

- 카카오페이 — Spring Bean Injection 이야기(feat. 모두가 다 알고 있는 스프링빈, 정말 다 알고 있는가?): https://tech.kakaopay.com/post/martin-dev-honey-tip-2/
- 카카오페이 — Kotlin으로 Spring AOP 극복하기!: https://tech.kakaopay.com/post/overcome-spring-aop-with-kotlin/
- 하이퍼커넥트 — Spring Transactional Rollback Deep Dive: https://hyperconnect.github.io/2025/02/10/spring-transactional-rollback.html
- 우아한형제들 — IllegalArgumentException은 400 Bad Request인가?: https://techblog.woowahan.com/21686/
- 우아한형제들 — Spring 웹 애플리케이션에서 사용하지 않는 API를 찾아보자: https://techblog.woowahan.com/2610/
