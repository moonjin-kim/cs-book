# Java

Java 면접은 문법 암기보다 **JVM이 코드를 어떻게 실행하고, 메모리와 동시성을 어떻게 관리하는지**를 설명하는 데 초점이 있습니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| JVM 메모리 | Heap/Method Area는 공유, Stack/PC/Native Stack은 스레드별로 분리됩니다. |
| GC | GC Root에서 도달할 수 없는 Heap 객체를 회수합니다. |
| String | 불변 객체라 안전하지만 반복 연결은 새 객체를 많이 만들 수 있습니다. |
| Collection | 구현체마다 조회, 삽입, 순서, 중복, 동시성 특성이 다릅니다. |
| 동시성 | 공유 상태, 가시성, 원자성, 순서 보장이 핵심입니다. |
| 예외 | 복구 가능하면 checked, 프로그래밍 오류에 가까우면 unchecked를 고려합니다. |
| record | 불변 데이터 전달 타입에 적합하지만 복잡한 도메인 객체를 대체하진 않습니다. |

## JVM과 메모리

### JVM 실행 흐름

1. `.java` 파일을 `javac`가 `.class` bytecode로 컴파일합니다.
2. ClassLoader가 필요한 클래스를 로딩합니다.
3. JVM은 loading, linking, initialization을 거쳐 클래스를 사용할 수 있게 만듭니다.
4. 처음에는 interpreter가 실행하고, 자주 실행되는 코드는 JIT compiler가 native code로 최적화합니다.

### JVM 메모리 구조

| 영역 | 공유 여부 | 저장 내용 | 면접 포인트 |
| --- | --- | --- | --- |
| Method Area / Metaspace | 공유 | 클래스 메타데이터, 상수 풀, static 변수 | JDK 8부터 PermGen이 Metaspace로 대체 |
| Heap | 공유 | 객체, 배열 | GC 주요 대상 |
| Stack | 스레드별 | 지역 변수, 인자, operand stack, frame | 지역 변수는 기본적으로 스레드 독립 |
| PC Register | 스레드별 | 현재 실행 중인 JVM 명령 위치 | 스레드마다 존재 |
| Native Method Stack | 스레드별 | JNI 네이티브 메서드 실행 정보 | C/C++ native call 처리 |

주의할 점:

- 지역 변수는 Stack에 있어 스레드 간 공유되지 않습니다.
- 객체 필드는 Heap에 있으므로 여러 스레드가 같은 객체를 공유하면 동기화가 필요할 수 있습니다.
- `static` 필드는 클래스 단위 공유 상태라 동시성, 테스트 격리에 주의해야 합니다.

## GC

### GC 대상 판단

GC는 **도달 가능성(Reachability)** 으로 객체 생존 여부를 판단합니다.

| 구분 | 설명 |
| --- | --- |
| GC Root | Stack 지역 변수, static 참조, JNI 참조 등 |
| Reachable | GC Root에서 참조 사슬로 도달 가능한 객체 |
| Unreachable | 더 이상 참조되지 않아 회수 가능한 객체 |

### 주요 GC 비교

| GC | 특징 | 적합한 상황 |
| --- | --- | --- |
| Serial GC | 단일 스레드 GC | 작은 Heap, 단일 CPU |
| Parallel GC | 처리량 중심 | pause보다 throughput이 중요할 때 |
| G1 GC | region 기반, pause와 throughput 균형 | 일반적인 서버 애플리케이션 |
| ZGC / Shenandoah | 저지연 GC | 큰 Heap, 짧은 pause 목표 |
| Epsilon GC | 회수하지 않음 | 실험, 성능 측정 |

실무 포인트:

- GC 튜닝 전에는 먼저 allocation pattern, pause 목표, 실제 GC 로그를 확인합니다.
- JDK 17에서도 환경에 따라 기본 GC가 달라질 수 있으므로 `jcmd`, `jinfo` 등으로 실제 설정을 확인합니다.
- G1의 humongous 객체는 큰 객체가 연속 region을 차지해 단편화와 Full GC 위험을 높일 수 있습니다.

## String

| 타입 | 가변성 | 스레드 안전성 | 사용 상황 |
| --- | --- | --- | --- |
| `String` | 불변 | 안전 | 문자열 변경이 적을 때 |
| `StringBuilder` | 가변 | 안전하지 않음 | 단일 스레드 문자열 조합 |
| `StringBuffer` | 가변 | 안전 | 여러 스레드가 공유하는 문자열 조합 |

핵심 포인트:

- `String`은 불변 객체라 공유해도 안전합니다.
- 문자열 리터럴은 String Constant Pool에 저장됩니다.
- `new String("abc")`는 새 객체를 만들 수 있으므로 리터럴과 `==` 비교 결과가 다를 수 있습니다.
- 반복문에서 문자열을 계속 `+`로 연결하면 불필요한 객체가 많이 생길 수 있습니다.
- 문자열 값 비교는 항상 `equals()`를 사용합니다.

## Collection

### List, Set, Map

| 구조 | 특징 | 대표 구현체 |
| --- | --- | --- |
| List | 순서 보장, 중복 허용 | `ArrayList`, `LinkedList` |
| Set | 중복 불가 | `HashSet`, `TreeSet`, `LinkedHashSet` |
| Map | key-value 저장 | `HashMap`, `TreeMap`, `ConcurrentHashMap` |

### 초기 용량

`ArrayList`와 `HashMap`은 내부 배열이 가득 차면 resize를 수행합니다.

```java
int expectedSize = 5_000_000;
List<String> values = new ArrayList<>(expectedSize);
```

`HashMap`은 다음 기준으로 resize 시점을 계산합니다.

```text
threshold = capacity * loadFactor
```

예를 들어 기본 capacity 16, load factor 0.75라면 threshold는 12입니다.

### HashMap vs ConcurrentHashMap

| 항목 | HashMap | ConcurrentHashMap |
| --- | --- | --- |
| 스레드 안전성 | 안전하지 않음 | 안전함 |
| null key/value | 허용 | 허용하지 않음 |
| 주요 용도 | 단일 스레드, 읽기 전용 공유 | 멀티스레드 읽기/쓰기 |
| 복합 연산 | 직접 동기화 필요 | `compute`, `merge`, `putIfAbsent` 제공 |

주의할 점:

- `ConcurrentHashMap`도 `get()` 후 `put()`을 따로 호출하면 원자적이지 않습니다.
- 원자적 갱신이 필요하면 `computeIfAbsent`, `compute`, `merge`를 사용합니다.

## 동시성

### 동시성 문제의 핵심

| 문제 | 의미 | 대응 |
| --- | --- | --- |
| 공유 상태 | 여러 스레드가 같은 데이터를 사용 | 불변 객체, 락, ThreadLocal |
| 가시성 | 한 스레드의 변경이 다른 스레드에 보이지 않음 | `volatile`, synchronized, lock |
| 원자성 | 중간에 다른 스레드가 끼어듦 | lock, `Atomic*`, concurrent collection |
| 순서 보장 | 실행 순서가 예상과 달라짐 | happens-before 관계 확보 |

### synchronized vs ReentrantLock

| 항목 | synchronized | ReentrantLock |
| --- | --- | --- |
| 해제 | 블록 종료 시 자동 | `unlock()` 직접 호출 |
| timeout | 어려움 | `tryLock()` 가능 |
| interrupt 대기 | 제한적 | `lockInterruptibly()` 가능 |
| 공정성 | 제어 어려움 | fair mode 가능 |

### volatile

`volatile`은 **가시성**을 보장하지만 **복합 연산의 원자성**은 보장하지 않습니다.

```java
volatile int count;
count++; // 원자적이지 않음
```

원자적 증가가 필요하면 다음을 사용합니다.

- `synchronized`
- `ReentrantLock`
- `AtomicInteger`
- `LongAdder`

### CAS와 Atomic

CAS는 현재 값이 기대값과 같을 때만 새 값으로 바꾸는 원자 연산입니다.

장점:

- 락 없이 원자적 갱신 가능
- 경합이 낮으면 빠름

주의점:

- 경합이 심하면 재시도로 CPU를 많이 쓸 수 있습니다.
- A → B → A 변화를 감지하지 못하는 ABA 문제가 있습니다.
- ABA는 version을 함께 비교하는 `AtomicStampedReference`로 완화할 수 있습니다.

## Executor와 비동기

### ThreadPoolExecutor

| 구성 요소 | 의미 |
| --- | --- |
| `corePoolSize` | 기본 유지 스레드 수 |
| `maximumPoolSize` | 최대 스레드 수 |
| `workQueue` | 대기 작업 큐 |
| `RejectedExecutionHandler` | 포화 시 거부 정책 |

거부 정책:

| 정책 | 동작 |
| --- | --- |
| `AbortPolicy` | 예외 발생 |
| `DiscardPolicy` | 새 작업 폐기 |
| `DiscardOldestPolicy` | 가장 오래된 대기 작업 폐기 |
| `CallerRunsPolicy` | 요청 스레드가 직접 실행 |

### CompletableFuture

`CompletableFuture`는 비동기 작업을 chaining, 조합, 예외 처리할 수 있게 해줍니다.

주의할 점:

- executor를 지정하지 않으면 `ForkJoinPool.commonPool`을 사용합니다.
- I/O 중심 작업은 별도 executor를 지정하는 편이 안전합니다.
- `get()`을 남용하면 비동기 장점이 사라집니다.

### ThreadLocal

`ThreadLocal`은 스레드별 독립 값을 저장합니다.

주요 사용처:

- Spring transaction context
- security context
- request context
- MDC logging context

주의할 점:

- 스레드 풀에서는 스레드가 재사용되므로 `remove()`가 필요합니다.
- `@Async`처럼 다른 스레드로 넘어가면 값이 자동 전파되지 않습니다.

## Java 언어 기능

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

## 객체 비교와 복사

### 동일성 vs 동등성

| 비교 | 연산 | 의미 |
| --- | --- | --- |
| 동일성 | `==` | 같은 객체 참조인가 |
| 동등성 | `equals()` | 논리적으로 같은 값인가 |

`equals()`를 재정의하면 반드시 `hashCode()`도 함께 재정의해야 합니다.

이유:

- `HashMap`, `HashSet`은 먼저 hashCode로 bucket을 찾습니다.
- 이후 equals로 실제 동등성을 확인합니다.
- 둘 중 하나만 재정의하면 중복 판단이 깨질 수 있습니다.

### 얕은 복사 vs 깊은 복사

| 복사 | 의미 | 주의점 |
| --- | --- | --- |
| 얕은 복사 | 내부 참조 객체를 공유 | 한쪽 변경이 다른 쪽에 영향 |
| 깊은 복사 | 내부 참조 객체까지 새로 생성 | 비용은 크지만 독립성 보장 |

### 방어적 복사

방어적 복사는 외부에서 받은 가변 객체를 그대로 저장하지 않고 복사해서 보관하는 방식입니다.

사용 시점:

- 생성자에서 가변 인자를 받을 때
- getter에서 내부 컬렉션을 반환할 때

```java
public Lotto(List<LottoNumber> numbers) {
    this.numbers = List.copyOf(numbers);
}
```

주의:

- 컬렉션만 복사하면 내부 원소 객체는 여전히 공유될 수 있습니다.
- 검증 전에 먼저 복사해야 TOCTOU 문제가 줄어듭니다.

## 예외 처리

### Checked vs Unchecked

| 구분 | Checked Exception | Unchecked Exception |
| --- | --- | --- |
| 처리 강제 | 컴파일러가 강제 | 강제하지 않음 |
| 대표 예 | `IOException`, `SQLException` | `NullPointerException`, `IllegalArgumentException` |
| 사용 기준 | 호출자가 복구 가능 | 프로그래밍 오류 또는 복구 어려움 |

### Error와 Exception

| 구분 | 의미 |
| --- | --- |
| Error | JVM 수준의 심각한 문제, 일반적으로 복구 대상 아님 |
| Exception | 애플리케이션 실행 중 발생 가능한 예외 상황 |

## Call By Value

Java는 항상 **call by value**입니다.

| 인자 타입 | 전달되는 값 |
| --- | --- |
| primitive | 실제 값의 복사본 |
| reference | 객체 참조값의 복사본 |

핵심:

- 객체 내부 상태는 바뀔 수 있습니다.
- 하지만 파라미터 변수를 새 객체로 바꿔도 호출자의 참조 변수는 바뀌지 않습니다.

```java
void change(Student student) {
    student = new Student(); // 호출자의 student 참조는 바뀌지 않음
}
```
