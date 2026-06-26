# Spring

Spring은 객체 생성과 연결, 웹 요청 처리, 트랜잭션 경계를 프레임워크가 관리하게 해 애플리케이션 코드를 단순화합니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| IoC/DI | 객체가 직접 의존 객체를 만들지 않으면 어떤 이점이 생기는가? |
| Bean 생명주기 | bean 생성, 의존성 주입, 초기화, 소멸은 어떤 순서로 일어나는가? |
| AOP | 프록시는 어떤 방식으로 횡단 관심사를 끼워 넣는가? |
| Spring MVC | DispatcherServlet에서 Controller까지 요청이 어떻게 전달되는가? |
| 트랜잭션 관리 | `@Transactional`은 어떤 프록시와 DB 트랜잭션을 사용해 동작하는가? |
| Boot 자동 설정 | 조건부 bean 등록은 어떤 기준으로 활성화되는가? |

## 실무 판단

- 프록시 기반 기능은 내부 메서드 호출에서 우회될 수 있습니다.
- 트랜잭션 경계는 use case 단위로 잡고 외부 API 호출을 길게 포함하지 않는 것이 좋습니다.
- 자동 설정은 편리하지만 운영 설정의 실제 값을 확인할 수 있어야 합니다.

## Bean으로 객체를 관리하는 이유

Spring Bean은 Spring container가 생성과 의존성 연결, 생명주기, 공통 기능 적용을 관리하는 객체입니다. 객체를 직접 `new`로 만들면 의존 관계를 코드가 직접 조립해야 하지만, bean으로 등록하면 container가 생성자 주입 등을 통해 필요한 의존성을 연결합니다. 이 방식은 구현체 교체와 테스트 대역 주입을 쉽게 만들고, 순환 의존성 같은 설계 문제도 더 빨리 드러냅니다.

Spring bean은 기본적으로 singleton scope입니다. 같은 repository나 service를 여러 곳에서 주입받아도 하나의 instance를 공유하므로 불필요한 객체 생성을 줄일 수 있습니다. 다만 singleton bean에 mutable 상태를 두면 여러 요청과 스레드가 공유하므로 thread-safety를 별도로 고려해야 합니다.

Bean으로 관리되면 `@PostConstruct`, `@PreDestroy` 같은 lifecycle callback을 사용할 수 있고, `@Transactional`, `@Async`, 보안, 로깅 같은 AOP 기반 공통 관심사를 적용할 수 있습니다. 또한 `@Configuration`과 `@Bean`으로 DataSource, client, executor 같은 설정 객체를 중앙에서 구성할 수 있습니다.

## Component Stereotypes

`@Component`, `@Controller`, `@Service`, `@Repository`는 component scan으로 bean을 등록한다는 점은 같지만 의미가 다릅니다.

| 애너테이션 | 역할 |
| --- | --- |
| `@Component` | 특정 계층 의미가 없는 일반 bean |
| `@Controller` | Spring MVC handler, view/API 요청 처리 |
| `@Service` | 비즈니스 use case와 도메인 흐름 조율 |
| `@Repository` | 데이터 접근 계층, persistence exception translation 대상 |

`@Controller`, `@Service`, `@Repository`는 내부적으로 `@Component`를 포함하지만, 계층 의미를 드러내기 때문에 AOP pointcut, 예외 변환, 코드 탐색에서 유리합니다. Spring 6부터 Spring MVC의 handler 탐색은 `@Controller` 계열을 기준으로 보므로 controller를 단순 `@Component`로 대체하면 요청 mapping이 기대대로 동작하지 않을 수 있습니다.

## 트랜잭션 롤백 규칙

Spring의 `@Transactional`은 기본적으로 unchecked exception(`RuntimeException`)과 `Error`가 발생하면 rollback합니다. checked exception은 개발자가 예상하고 처리할 수 있는 정상적인 예외 흐름으로 보고 기본적으로 rollback하지 않습니다.

필요하면 `rollbackFor`로 checked exception에도 rollback을 적용하거나, `noRollbackFor`로 특정 unchecked exception을 rollback 대상에서 제외할 수 있습니다. JDBC, JPA, Hibernate의 데이터 접근 예외는 Spring의 unchecked `DataAccessException` 계층으로 변환됩니다.

## 트랜잭션 전파

트랜잭션 전파는 `@Transactional` 메서드가 호출될 때 이미 진행 중인 트랜잭션이 있으면 어떻게 합류하거나 분리할지를 정하는 규칙입니다.

| 전파 속성 | 동작 |
| --- | --- |
| `REQUIRED` | 기존 트랜잭션이 있으면 참여하고, 없으면 새로 시작합니다. 기본값입니다. |
| `REQUIRES_NEW` | 기존 트랜잭션을 보류하고 항상 새 트랜잭션을 시작합니다. |
| `MANDATORY` | 기존 트랜잭션이 반드시 있어야 하며, 없으면 예외가 납니다. |
| `SUPPORTS` | 있으면 참여하고, 없으면 트랜잭션 없이 실행합니다. |
| `NOT_SUPPORTED` | 기존 트랜잭션을 보류하고 트랜잭션 없이 실행합니다. |
| `NESTED` | 기존 트랜잭션 안에 savepoint를 만들고 중첩 트랜잭션처럼 실행합니다. 없으면 새로 시작합니다. |
| `NEVER` | 트랜잭션이 있으면 예외가 나고, 없으면 트랜잭션 없이 실행합니다. |

`REQUIRES_NEW`와 `NESTED`는 실패 범위를 분리할 때 사용하지만 connection 추가 사용, savepoint 지원 여부, lock 유지 시간을 함께 봐야 합니다.

## 트랜잭션 AOP 동작 흐름

선언적 트랜잭션은 AOP proxy가 메서드 호출을 감싸며 동작합니다. 외부 호출이 proxy에 들어오면 proxy는 `PlatformTransactionManager`에 트랜잭션 시작을 요청합니다. 트랜잭션 매니저는 DataSource나 EntityManager를 통해 connection을 얻고 auto commit을 끄거나 persistence context를 연결한 뒤, `TransactionSynchronizationManager`에 현재 스레드 기준으로 resource를 보관합니다.

이후 repository나 mapper는 직접 connection을 전달받지 않아도 같은 스레드의 `TransactionSynchronizationManager`에서 현재 트랜잭션 resource를 찾아 사용합니다. 메서드가 정상 종료되면 commit하고, rollback 대상 예외가 발생하면 rollback한 뒤 connection을 반환합니다.

## Private 메서드와 Self Invocation

`@Transactional`, `@Async`, `@Cacheable` 같은 Spring AOP 기능은 proxy를 거친 외부 메서드 호출에 advice를 적용합니다. 같은 클래스 안에서 `this.inner()`처럼 호출하면 proxy를 거치지 않기 때문에 `inner()`에 붙은 `@Transactional`은 적용되지 않습니다. `private` 메서드는 proxy가 override하거나 interface method로 노출할 수 없으므로 트랜잭션 경계로 삼기에 적합하지 않습니다.

해결 방법은 트랜잭션 경계가 다른 메서드를 별도 bean으로 분리해 proxy를 거치게 만드는 것입니다. 자기 자신 proxy를 주입하거나 `AopContext`를 쓰는 방법도 있지만 순환 의존성과 프레임워크 결합이 커져 권장도가 낮습니다. AspectJ weaving을 쓰면 self invocation에도 적용할 수 있지만 운영 복잡도가 증가합니다.

## @Async 주의점

`@Async`는 프록시 기반 비동기 실행입니다.

- 같은 클래스 내부에서 직접 호출하면 프록시를 거치지 않아 비동기로 실행되지 않습니다.
- 비동기 메서드 예외는 호출자에게 직접 전파되지 않으므로 `AsyncUncaughtExceptionHandler`나 `CompletableFuture` 예외 처리가 필요합니다.
- 비동기 메서드 안의 트랜잭션은 호출자 트랜잭션과 별도 생명주기를 가집니다.
- executor를 명시하지 않으면 기본 executor 설정에 의존하므로 thread pool, queue, rejection policy를 운영 기준에 맞게 설정해야 합니다.

## Spring과 Spring Boot

Spring Framework는 IoC container, AOP, MVC, transaction abstraction 같은 핵심 기능을 제공합니다. 전통적인 Spring 애플리케이션은 bean 설정, MVC 설정, DataSource, transaction manager, WAS 배포 구성을 개발자가 많이 직접 해야 했습니다.

Spring Boot는 이 설정 비용을 줄이기 위한 도구입니다. starter dependency로 관련 라이브러리 묶음을 제공하고, classpath와 property를 보고 auto configuration을 적용하며, Tomcat/Jetty/Undertow 같은 embedded server로 실행 가능한 jar 배포를 지원합니다.

## Auto Configuration

`@SpringBootApplication`은 내부적으로 `@EnableAutoConfiguration`을 포함합니다. `@EnableAutoConfiguration`은 `@Import(AutoConfigurationImportSelector.class)`를 통해 자동 설정 후보를 가져옵니다.

동작 흐름은 후보 auto configuration 목록 조회, 중복 제거, exclude 적용, condition filter 평가 순서로 볼 수 있습니다. 각 자동 설정 class는 `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty` 같은 조건을 통해 필요한 상황에서만 bean을 등록합니다. 그래서 Boot 자동 설정을 이해할 때는 "classpath에 무엇이 있는가", "사용자가 이미 bean을 등록했는가", "property가 어떻게 설정됐는가"를 확인해야 합니다.

## Tomcat과 Servlet

Tomcat은 HTTP 요청을 받고 Servlet specification을 실행하는 servlet container입니다. 요청이 들어오면 container는 `HttpServletRequest`, `HttpServletResponse`를 만들고, URL mapping에 맞는 servlet을 찾아 `service()`를 호출합니다. `service()`는 HTTP method에 따라 `doGet`, `doPost` 같은 메서드로 위임합니다.

Servlet lifecycle은 `init()`으로 생성 및 초기화, 요청마다 `service()` 실행, 종료 시 `destroy()` 호출로 정리됩니다. Spring MVC에서는 `DispatcherServlet`이 핵심 servlet으로 등록되어 모든 MVC 요청의 front controller 역할을 합니다.

## RequestBody와 ModelAttribute

`@RequestBody`는 HTTP body를 `HttpMessageConverter`로 읽어 Java 객체로 역직렬화합니다. JSON 요청이라면 보통 Jackson `ObjectMapper`가 동작합니다. API 요청 body를 DTO로 받을 때 사용합니다.

`@ModelAttribute`는 query parameter, form-urlencoded, multipart form data를 객체에 바인딩할 때 사용합니다. 생성자나 setter/property binding을 통해 객체를 만들고 값을 채웁니다. multipart 파일 업로드나 검색 조건처럼 request parameter 기반 입력에 적합합니다.

## ControllerAdvice와 ExceptionHandler

`@ControllerAdvice`는 여러 controller에 공통으로 적용할 `@ExceptionHandler`, `@InitBinder`, `@ModelAttribute`를 모아두는 전역 확장 지점입니다. `@RestControllerAdvice`는 `@ControllerAdvice`에 `@ResponseBody` 의미가 더해져 예외 응답을 JSON body로 내려주는 API 서버에 자주 씁니다.

예외가 발생하면 `DispatcherServlet`은 `HandlerExceptionResolver` 체인을 사용합니다. 그중 `ExceptionHandlerExceptionResolver`가 `@ExceptionHandler` 메서드를 찾아 처리합니다. 처리 가능한 handler가 있으면 예외가 WAS까지 전파되지 않고 controller layer에서 응답으로 변환됩니다.

## Controller와 RestController

`@Controller` 메서드의 반환값은 기본적으로 view name으로 해석됩니다. ViewResolver가 JSP, Thymeleaf 같은 view를 찾아 model과 함께 HTML을 렌더링합니다.

`@RestController`는 `@Controller`와 `@ResponseBody`를 합친 형태입니다. 반환 객체는 view name이 아니라 HTTP response body로 쓰이며, `HttpMessageConverter`가 JSON/XML 등으로 직렬화합니다. `ResponseEntity<T>`를 반환하면 body뿐 아니라 status code와 header까지 명시적으로 제어할 수 있습니다.

## Spring MVC 실행 흐름

Spring MVC 요청은 `DispatcherServlet`에서 시작합니다.

1. `HandlerMapping`이 URL, HTTP method, 조건에 맞는 handler를 찾습니다.
2. `HandlerAdapter`가 해당 handler를 실행할 준비를 합니다.
3. `ArgumentResolver`가 request parameter, path variable, request body 등을 controller method argument로 변환합니다.
4. Controller가 service layer를 호출하고 결과를 반환합니다.
5. View 응답이면 `ViewResolver`가 view를 찾고, `@ResponseBody`/`ResponseEntity` 응답이면 `ReturnValueHandler`와 `HttpMessageConverter`가 body를 만듭니다.

## Filter와 Interceptor

Filter는 Servlet container 수준에서 동작합니다. `DispatcherServlet`에 도달하기 전후로 실행되며 request/response wrapper 적용, encoding, CORS, security chain처럼 Spring MVC 바깥 요청까지 포함해야 하는 공통 처리에 적합합니다.

Interceptor는 Spring MVC handler 수준에서 동작합니다. `preHandle`, `postHandle`, `afterCompletion`으로 controller 호출 전후를 제어하고, handler method와 annotation 정보를 볼 수 있어 인증 체크, 로깅, 권한 검사에 유용합니다.

## @Value와 ConfigurationProperties

`@Value`는 property나 SpEL 결과 같은 단일 값을 주입할 때 간단합니다. 대상 class가 Spring bean이어야 동작하고, 필드 주입보다 생성자 주입을 쓰면 필수 설정 누락을 더 빨리 드러낼 수 있습니다.

`@ConfigurationProperties`는 prefix 아래 여러 설정을 객체로 바인딩할 때 적합합니다. relaxed binding을 지원하고, validation과 metadata 생성에 유리합니다. 설정 값이 많거나 계층 구조가 있다면 `@Value` 여러 개보다 설정 전용 properties class가 유지보수에 좋습니다.

## JPA, Hibernate, Spring Data JPA

JPA는 Java 애플리케이션에서 관계형 데이터베이스와 객체를 매핑하는 표준 명세입니다. 명세이므로 interface와 규약을 정의할 뿐 실제 동작은 구현체가 담당합니다. Hibernate는 대표적인 JPA 구현체이며, EclipseLink 같은 다른 구현체로도 대체할 수 있습니다.

Spring Data JPA는 JPA 위에 repository 추상화를 얹은 Spring Data 모듈입니다. 개발자는 `JpaRepository`를 확장하고 메서드 이름, `@Query`, Specification, Querydsl 등을 사용해 데이터 접근 계층을 간결하게 만들 수 있습니다. 내부 기본 구현체인 `SimpleJpaRepository`는 결국 `EntityManager`를 사용합니다.

JPA를 사용하는 이유는 반복적인 JDBC/DAO 코드를 줄이고, 1차 캐시, 변경 감지, 쓰기 지연, 객체 그래프 탐색 같은 ORM 기능으로 데이터 접근 계층 생산성을 높이기 위해서입니다. 단, SQL이 사라지는 것은 아니므로 실행 쿼리와 fetch 전략을 반드시 확인해야 합니다.

## EntityManager와 영속성 컨텍스트

영속성 컨텍스트는 entity를 관리하는 1차 캐시이자 변경 추적 공간입니다. EntityManager는 이 영속성 컨텍스트와 상호작용하며 entity 상태를 바꿉니다.

| 상태 | 설명 |
| --- | --- |
| 비영속 | 새 객체지만 아직 영속성 컨텍스트와 관련 없음 |
| 영속 | `persist`, `find`, JPQL 조회 등으로 영속성 컨텍스트가 관리 중 |
| 준영속 | 한 번 관리됐지만 `detach`, `clear`, `close` 등으로 분리됨 |
| 삭제 | `remove` 호출로 삭제 예약됨 |

영속 상태의 entity는 같은 트랜잭션 안에서 1차 캐시로 동일성이 보장되고, 변경 감지로 update query가 생성됩니다. `flush`는 영속성 컨텍스트의 변경 내용을 DB에 동기화하지만 transaction commit과 동일한 개념은 아닙니다.

## JPA N+1과 Fetch 전략

N+1 문제는 부모 N개를 조회한 뒤 각 부모의 연관 데이터를 조회하기 위한 query가 N번 추가로 발생하는 현상입니다. 즉시 로딩이어도 JPQL은 우선 root entity 중심으로 실행되고, 이후 즉시 로딩 연관관계를 맞추기 위해 추가 query가 나갈 수 있습니다. 지연 로딩은 조회 시점에는 안전하지만, proxy를 실제로 사용할 때 N+1이 발생할 수 있습니다.

해결책은 상황에 따라 다릅니다.

| 방법 | 특징 |
| --- | --- |
| fetch join | 한 query로 연관 entity를 함께 조회. 중복 row와 paging 제약 주의 |
| `@EntityGraph` | repository method에 fetch graph를 선언적으로 적용 |
| batch fetch | `@BatchSize`, `hibernate.default_batch_fetch_size`로 IN query 묶음 조회 |
| DTO projection | 필요한 컬럼만 직접 조회해 entity graph 비용 회피 |

## Fetch Join과 페이징 주의점

`@OneToMany` 같은 to-many collection fetch join에 `Pageable`을 함께 쓰면 Hibernate가 `firstResult/maxResults specified with collection fetch; applying in memory` 경고를 내고 DB paging 대신 메모리에서 paging할 수 있습니다. Collection join은 부모 row가 자식 수만큼 늘어나므로 DB의 `limit/offset`을 부모 기준 page로 바로 적용하기 어렵기 때문입니다.

데이터가 많으면 전체 결과를 메모리에 올린 뒤 잘라내므로 OOM 위험이 있습니다. 실무에서는 to-many fetch join paging을 피하고, 먼저 부모 ID만 paging한 뒤 batch fetch나 별도 query로 collection을 조회합니다. 또는 `default_batch_fetch_size`를 설정해 영속성 컨텍스트에 있는 부모 ID들을 IN 절로 묶어 자식 collection을 가져오게 합니다.

## OneToOne Lazy Loading 주의점

양방향 `@OneToOne`에서 연관관계의 주인이 아닌 `mappedBy` 쪽을 조회하면 lazy loading이 기대대로 동작하지 않을 수 있습니다. 주인이 아닌 테이블에는 FK가 없으므로, JPA provider는 연관 row가 없는지(null) 있는지(proxy)를 알기 위해 추가 query가 필요합니다. 그 결과 조회 시점에 연관 존재 여부 확인 query가 발생합니다.

이 문제는 JPA provider의 구조적 한계에 가깝습니다. 정말 lazy loading이 필요한 관계인지 검토하고, 가능하면 FK를 가진 주인 방향 단방향으로 모델링하거나, query 목적에 맞게 fetch join/DTO를 명시적으로 사용합니다.

## ID 생성 전략

JPA ID는 직접 할당하거나 `@GeneratedValue`로 자동 생성할 수 있습니다.

| 전략 | 설명 | 주의점 |
| --- | --- | --- |
| `IDENTITY` | auto increment처럼 DB insert 시점에 ID 생성 | ID가 필요해 `persist` 시 즉시 insert, batch insert 불리 |
| `SEQUENCE` | DB sequence에서 ID를 미리 얻어 영속성 컨텍스트에 저장 | allocationSize로 DB 왕복 최적화 가능 |
| `TABLE` | 키 생성 전용 table로 sequence 흉내 | 모든 DB에서 가능하지만 select/update 비용 큼 |
| `AUTO` | dialect에 따라 전략 자동 선택 | DB 변경 시 동작 차이 확인 필요 |

Hibernate는 `IDENTITY`에서 insert 결과 ID를 얻기 위해 JDBC의 generated keys를 사용합니다. 쓰기 지연과 batch insert가 중요하면 DB가 지원하는 경우 `SEQUENCE`와 pooled allocation을 고려합니다.

## ddl-auto

`spring.jpa.hibernate.ddl-auto`는 Hibernate schema 생성/검증 동작을 제어합니다.

| 옵션 | 동작 | 사용처 |
| --- | --- | --- |
| `none` | 아무 작업도 하지 않음 | 운영 기본값 |
| `validate` | entity mapping과 schema 일치 여부만 검증 | 운영에서 안전 검증 |
| `update` | 부족한 schema를 자동 변경 | 개발 편의용, 운영 주의 |
| `create` | 시작 시 drop 후 재생성 | 로컬 개발 |
| `create-drop` | 시작 시 생성, 종료 시 삭제 | 테스트 |

운영 schema 변경은 Flyway, Liquibase 같은 migration tool로 versioning하고, DDL lock과 대용량 table 변경 비용을 별도로 검토하는 것이 안전합니다.

## Spring Data JPA isNew

`SimpleJpaRepository.save()`는 entity가 새 객체이면 `persist`, 아니면 `merge`를 호출합니다. 판단은 `JpaEntityInformation.isNew(entity)`가 수행합니다. 일반적으로 wrapper ID가 `null`이면 신규로 보고, primitive numeric ID는 0인지 확인합니다. Wrapper `@Version` 필드가 있으면 version null 여부를 우선 사용할 수 있습니다.

직접 ID를 할당하는 entity는 저장 전부터 ID가 있으므로 신규가 아니라고 판단되어 `merge`가 호출될 수 있습니다. `merge`는 기존 row 확인을 위해 select를 유발할 수 있어 비효율적입니다. 이 경우 entity가 `Persistable<ID>`를 구현하고 `isNew()`를 직접 제공하는 방식을 고려합니다.

## OSIV

OSIV(Open Session In View)는 요청이 끝날 때까지 영속성 컨텍스트를 열어두어 controller/view 계층에서도 lazy loading을 가능하게 하는 방식입니다. Spring의 OSIV는 비즈니스 계층의 `@Transactional`에서만 transaction을 사용하고, view 계층에서는 트랜잭션 없는 읽기로 lazy loading을 허용합니다.

장점은 controller에서 lazy loading 예외가 줄어든다는 점입니다. 단점은 영속성 컨텍스트와 DB connection 점유 시간이 길어져 트래픽이 많을 때 connection 고갈로 이어질 수 있고, 표현 계층이 entity graph에 의존하게 된다는 점입니다. CQRS, read replica, 외부 API 호출이 긴 요청에서는 OSIV 비활성화를 적극 검토하고, 필요한 데이터는 service 계층에서 DTO로 완성해 반환하는 편이 명확합니다.

## Spring 테스트 격리

테스트 격리는 각 테스트가 다른 테스트의 상태에 영향을 주거나 받지 않게 만드는 것입니다. 격리가 깨지면 실행 순서, 공유 DB 상태, application context cache에 따라 성공/실패가 달라지는 non-deterministic test가 생깁니다.

Spring 통합 테스트에서 DB 격리를 만드는 대표 방법은 다음과 같습니다.

| 방법 | 장점 | 주의점 |
| --- | --- | --- |
| `@DirtiesContext` | context까지 완전 격리 | 매번 context reload로 매우 느림 |
| `@Sql` cleanup | 명시적으로 table 초기화 가능 | table 추가 시 script 유지보수 필요 |
| `@Transactional` rollback | 빠르고 간단 | 운영과 다른 transaction 조건으로 거짓 음성 가능 |

`@Transactional` 테스트는 OSIV off 환경에서 발생할 `LazyInitializationException`을 숨길 수 있습니다. 또한 `@SpringBootTest(webEnvironment = RANDOM_PORT)`처럼 실제 servlet container가 다른 thread에서 돌면 테스트 method transaction rollback이 서버 thread의 DB 작업에 적용되지 않습니다. 프로덕션 코드가 `REQUIRES_NEW`를 사용하거나 `@Async`로 다른 thread에서 DB를 쓰는 경우도 테스트 transaction과 별개로 commit될 수 있습니다.
