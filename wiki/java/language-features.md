# Java: Java 언어 기능

← [Java 개요](README.md)

### Primitive와 Wrapper

| 구분 | primitive | wrapper |
| --- | --- | --- |
| 예 | `int`, `long`, `boolean` | `Integer`, `Long`, `Boolean` |
| null | 불가 | 가능 |
| 저장 | 값 자체 | 객체 참조 |
| generic 사용 | 불가 | 가능 |
| 비용 | 작음 | boxing/unboxing 비용 가능 |

주의:

- `Integer a = 128; Integer b = 128; a == b`는 false일 수 있습니다.
- wrapper 비교는 `equals()`를 사용합니다.
- null wrapper를 unboxing하면 `NullPointerException`이 납니다.
- 대량 숫자 처리에서는 boxing이 성능과 GC 비용을 만들 수 있습니다.

### final

`final`은 재할당, override, 상속을 제한합니다.

| 위치 | 의미 |
| --- | --- |
| final 변수 | 한 번만 할당 가능 |
| final 메서드 | override 불가 |
| final 클래스 | 상속 불가 |

주의:

- final 참조 변수는 참조 재할당을 막을 뿐, 참조 대상 객체의 내부 변경까지 막지는 않습니다.
- 불변 객체를 만들려면 final 필드뿐 아니라 생성 이후 상태 변경 메서드 제거, 방어적 복사, 내부 가변 객체 차단이 필요합니다.

### Optional

`Optional`은 **값이 없을 수 있음을 반환 타입으로 표현**하는 도구입니다.

권장:

- 메서드 반환 타입
- `map`, `flatMap`, `orElseGet`, `orElseThrow` 활용

지양:

- 필드 타입
- 메서드 파라미터
- 컬렉션 원소 타입
- 무분별한 `get()`

### Stream

Stream은 중간 연산과 최종 연산으로 나뉩니다.

| 연산 | 예시 | 특징 |
| --- | --- | --- |
| 중간 연산 | `filter`, `map`, `distinct`, `sorted` | lazy, Stream 반환 |
| 최종 연산 | `collect`, `count`, `findFirst`, `forEach` | 실제 실행, Stream 소비 |

핵심:

- 중간 연산만 있으면 실행되지 않습니다.
- 최종 연산이 호출될 때 요소 단위로 처리됩니다.
- `findFirst`, `limit` 같은 연산은 short-circuit이 가능합니다.
- Stream은 한 번만 소비할 수 있습니다.

### Lambda와 함수형 인터페이스

함수형 인터페이스는 추상 메서드가 하나인 인터페이스입니다.

대표 인터페이스:

| 인터페이스 | 의미 |
| --- | --- |
| `Function<T, R>` | T를 받아 R 반환 |
| `Predicate<T>` | T를 받아 boolean 반환 |
| `Consumer<T>` | T를 소비하고 반환 없음 |
| `Supplier<T>` | 입력 없이 T 제공 |
| `BiFunction<T, U, R>` | T, U를 받아 R 반환 |

주의:

- 람다는 함수형 인터페이스 타입이 있어야 작성할 수 있습니다.
- 람다가 캡처하는 지역 변수는 effectively final이어야 합니다.

### Reflection

Reflection은 런타임에 클래스, 메서드, 필드, 애너테이션 정보를 조회하고 호출하는 기능입니다.

사용 사례:

- Spring Bean 생성과 DI
- Jackson JSON 직렬화/역직렬화
- JPA 엔티티 매핑
- JUnit 테스트 메서드 실행

단점:

- 컴파일 타임 타입 안전성이 약해집니다.
- 직접 호출보다 느릴 수 있습니다.
- private 접근으로 캡슐화를 깰 수 있습니다.

### static

`static`은 인스턴스가 아니라 클래스에 속한 멤버를 의미합니다.

| 종류 | 설명 |
| --- | --- |
| static 변수 | 모든 인스턴스가 공유 |
| static 메서드 | 인스턴스 없이 호출 가능 |
| static block | 클래스 로딩 시 한 번 실행 |

주의:

- 상태를 가진 static 변수는 전역 상태가 됩니다.
- 테스트 격리와 동시성 문제가 생기기 쉽습니다.
- static 필드가 객체를 계속 참조하면 GC 대상이 되지 않아 누수가 날 수 있습니다.

### enum

`enum`은 타입 안전한 상수 집합입니다.

장점:

- 잘못된 값을 전달하기 어렵습니다.
- 각 상수는 JVM 안에서 하나만 존재합니다.
- `==` 비교가 가능합니다.
- 필드와 메서드를 가질 수 있습니다.

주의:

- DB에는 `ordinal`보다 `name`으로 저장하는 편이 안전합니다.
- enum 상수 이름을 바꾸면 직렬화/DB 호환성 문제가 생길 수 있습니다.

### record

`record`는 불변 데이터 전달 객체를 간결하게 만들기 위한 타입입니다.

자동 생성:

- canonical constructor
- accessor
- `equals`
- `hashCode`
- `toString`

적합한 곳:

- 요청/응답 DTO
- 단순 값 객체
- 읽기 모델

주의:

- 다른 클래스를 `extends`할 수 없습니다.
- 모든 필드는 final입니다.
- 복잡한 도메인 모델을 무조건 record로 대체하면 안 됩니다.

### sealed class와 pattern matching

`sealed`는 상속 가능한 하위 타입을 명시적으로 제한합니다.

```java
sealed interface PaymentResult permits Approved, Declined, Pending {}

record Approved(String transactionId) implements PaymentResult {}
record Declined(String reason) implements PaymentResult {}
record Pending(String requestId) implements PaymentResult {}
```

이 구조는 가능한 상태 집합이 닫혀 있는 도메인에 적합합니다.

- 결제 결과
- 주문 상태 전이 결과
- API command/result
- 파서의 AST node

Pattern matching for switch와 함께 쓰면 타입 검사, 캐스팅, 분기 누락을 줄일 수 있습니다.

```java
String message = switch (result) {
    case Approved approved -> "approved: " + approved.transactionId();
    case Declined declined -> "declined: " + declined.reason();
    case Pending pending -> "pending: " + pending.requestId();
};
```

주의:

- 외부 확장이 필요한 public API에는 sealed가 너무 닫힌 설계가 될 수 있습니다.
- `default`를 무조건 넣으면 새 하위 타입 추가 시 컴파일러의 exhaustiveness 검사를 덜 활용하게 됩니다.
- record pattern은 record 내부 값을 분해해 읽기 편하게 만들지만, 도메인 불변식은 여전히 생성자나 factory에서 지켜야 합니다.

### Generic

Java generic은 기본적으로 invariant입니다.

```java
List<Cat> cats = new ArrayList<>();
// List<Animal> animals = cats; // 불가능
```

PECS 원칙:

| 목적 | 사용 |
| --- | --- |
| 읽기 producer | `<? extends T>` |
| 쓰기 consumer | `<? super T>` |

### Type Erasure

Java generic은 컴파일 타임 타입 안정성을 제공하지만 런타임에는 대부분의 generic 타입 정보가 지워집니다.

```java
List<String> names = new ArrayList<>();
List<Integer> numbers = new ArrayList<>();

names.getClass() == numbers.getClass(); // true
```

결과:

- `new T()`를 직접 만들 수 없습니다.
- `T.class`를 직접 사용할 수 없습니다.
- primitive type을 generic type argument로 사용할 수 없습니다.
- overload가 type erasure 이후 같은 signature가 되면 사용할 수 없습니다.

```java
// erasure 이후 둘 다 handle(List)가 되어 충돌
void handle(List<String> values) {}
void handle(List<Integer> values) {}
```

해결:

- 생성에는 `Supplier<T>`나 `Class<T>`를 전달합니다.
- 런타임 타입 정보가 필요하면 type token 또는 framework의 `TypeReference` 계열을 사용합니다.
- API 설계에서는 wildcard로 읽기/쓰기 의도를 표현합니다.

### Annotation

Annotation은 코드에 metadata를 붙이는 문법입니다.

| retention | 의미 |
| --- | --- |
| `SOURCE` | 컴파일 후 사라짐 |
| `CLASS` | class 파일에는 남지만 런타임 reflection 조회 대상은 아님 |
| `RUNTIME` | 런타임 reflection으로 조회 가능 |

| target | 예 |
| --- | --- |
| `TYPE` | class, interface |
| `METHOD` | method |
| `FIELD` | field |
| `PARAMETER` | parameter |

사용 사례:

- Spring mapping, DI, transaction
- JPA entity mapping
- Bean Validation
- Lombok compile-time code generation
- JUnit test discovery

주의:

- annotation 자체는 동작을 만들지 않습니다.
- reflection, annotation processor, bytecode enhancement, proxy 같은 처리기가 annotation을 해석해야 의미가 생깁니다.

### Serialization

Java serialization은 객체를 byte stream으로 변환하는 기능입니다.

면접 포인트:

- `serialVersionUID`가 다르면 역직렬화 호환성 문제가 납니다.
- `transient` 필드는 직렬화에서 제외됩니다.
- 역직렬화는 생성자 우회, gadget chain 같은 보안 위험이 있어 신뢰할 수 없는 입력에 사용하면 안 됩니다.
- API payload에는 Java native serialization보다 JSON, Protobuf, Avro 같은 명시적 포맷을 주로 씁니다.

### BigDecimal

금액 계산에는 부동소수점 오차 때문에 `double`보다 `BigDecimal`을 사용합니다.

```java
new BigDecimal("0.1"); // 권장
new BigDecimal(0.1);   // 이진 부동소수점 오차 반영 가능
```

주의:

- `equals()`는 값과 scale을 모두 비교합니다. `1.0`과 `1.00`이 다를 수 있습니다.
- 숫자 크기 비교에는 `compareTo()`를 사용합니다.
- 나눗셈은 무한소수가 될 수 있어 scale과 rounding mode를 명시해야 합니다.

### Date and Time API

Java 8 이후 날짜/시간은 `java.time` API를 우선 사용합니다.

| 타입 | 용도 |
| --- | --- |
| `Instant` | UTC timeline의 한 시점 |
| `LocalDate` | 시간대 없는 날짜 |
| `LocalDateTime` | 시간대 없는 날짜와 시간 |
| `ZonedDateTime` | 시간대 포함 날짜와 시간 |
| `Duration` | 시간 기반 간격 |
| `Period` | 날짜 기반 간격 |

실무 기준:

- DB 저장과 이벤트 시간은 `Instant` 또는 명확한 UTC 기준을 선호합니다.
- 사용자에게 보여줄 때만 사용자의 timezone으로 변환합니다.
- `LocalDateTime`은 timezone이 없어 전 세계 서비스의 절대 시각 표현에는 부적합할 수 있습니다.
