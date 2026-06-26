# Java

Java 학습의 핵심은 문법보다 JVM 런타임에서 코드가 어떻게 실행되는지 설명하는 것입니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| JVM 런타임 | class loading, bytecode, JIT는 실행 성능과 어떤 관련이 있는가? |
| Java Memory Model | happens-before와 visibility 문제는 언제 발생하는가? |
| GC | GC root, young/old generation, stop-the-world는 무엇인가? |
| Collections | ArrayList, LinkedList, HashMap, ConcurrentHashMap의 trade-off와 resize 비용은 무엇인가? |
| Thread와 동시성 | Executor, Future, CompletableFuture는 어떤 문제를 해결하는가? |
| 예외 처리 | checked exception과 unchecked exception을 어떤 기준으로 선택하는가? |

## 실무 판단

- GC 튜닝은 먼저 allocation pattern과 pause 목표를 확인한 뒤 접근합니다.
- 동시성 문제는 "공유 상태가 있는가"와 "가시성 보장이 있는가"부터 확인합니다.
- 컬렉션 선택은 평균 복잡도뿐 아니라 순서, 중복, thread-safety까지 봅니다.
- 예상 원소 수가 큰 `ArrayList`, `HashMap`은 초기 용량을 지정해 resize, rehash, 배열 복사 비용을 줄입니다.

## Collections 초기 용량

JCF의 가변 크기 자료구조는 내부 배열이 가득 차면 resize를 수행합니다. `ArrayList`는 용량이 부족할 때 내부 배열을 더 크게 만들고 기존 원소를 복사합니다. 원소 수를 미리 알고 있다면 초기 용량을 지정하는 편이 유리합니다.

```java
int max = 5_000_000;
List<String> values = new ArrayList<>(max);
```

`HashMap`은 capacity와 load factor로 threshold를 계산합니다. 기본 capacity가 16이고 load factor가 0.75라면 threshold는 12입니다. entry 수가 threshold를 넘으면 내부 배열을 키우고 rehash가 발생합니다. 대량 데이터를 넣을 때는 목표 원소 수와 load factor를 고려해 초기 capacity를 잡는 것이 좋습니다.

## HashMap과 ConcurrentHashMap

`HashMap`은 thread-safe하지 않습니다. 여러 스레드가 동시에 구조를 변경하면 데이터 유실이나 잘못된 조회가 발생할 수 있습니다. 단일 스레드 또는 생성 후 읽기 전용으로 공유되는 상황에 적합하고, `null` key와 `null` value를 허용합니다.

`ConcurrentHashMap`은 여러 스레드가 동시에 읽고 쓸 수 있도록 설계된 map입니다. JDK 8 이후에는 읽기는 대부분 lock 없이 수행하고, 쓰기는 필요한 bucket 단위에서 CAS와 `synchronized`를 조합해 경합 범위를 줄입니다. 충돌이 심한 bucket은 tree bin으로 전환되어 최악 탐색 비용을 낮춥니다. `null` key/value는 허용하지 않습니다. `get()` 결과가 null일 때 "키 없음"과 "값이 null"을 구분해야 동시성 API가 단순해지기 때문입니다.

주의할 점은 복합 연산입니다. `ConcurrentHashMap`도 `get` 후 `put`을 따로 호출하면 그 사이에 다른 스레드가 끼어들 수 있습니다. 원자적 갱신이 필요하면 `putIfAbsent`, `computeIfAbsent`, `compute`, `merge`를 사용해야 합니다.

## JVM 실행 흐름과 메모리 구조

`.java` 파일은 `javac`로 컴파일되어 JVM이 이해하는 bytecode인 `.class` 파일이 됩니다. JVM은 필요한 시점에 class loader로 bytecode를 로드하고, loading, linking, initialization을 거쳐 실행 가능한 상태로 만듭니다. 실행 엔진은 interpreter로 빠르게 시작하고, 자주 실행되는 hotspot은 JIT compiler가 native code로 변환해 캐싱합니다.

JVM 메모리는 크게 공유 영역과 스레드별 독립 영역으로 나뉩니다.

| 영역 | 공유 여부 | 내용 |
| --- | --- | --- |
| Method Area/Metaspace | 공유 | class metadata, constant pool, static 변수, method bytecode |
| Heap | 공유 | `new`로 생성된 객체와 배열, GC 주요 대상 |
| Stack | 스레드별 | method frame, 지역 변수, 인자, operand stack, return address |
| PC Register | 스레드별 | 현재 실행 중인 JVM instruction 위치 |
| Native Method Stack | 스레드별 | JNI native method 실행 정보 |

지역 변수는 각 스레드의 stack에 있어 기본적으로 안전하지만, 객체 필드는 heap에 있고 여러 스레드가 공유할 수 있어 동기화가 필요할 수 있습니다.

## GC와 Reachability

GC는 heap 객체가 더 이상 도달 가능하지 않을 때 회수합니다. Stack 변수, static 변수, JNI 참조 같은 GC Root에서 시작해 참조 사슬로 닿을 수 있는 객체는 살아 있다고 판단합니다.

대표 GC:

| GC | 특징 |
| --- | --- |
| Serial GC | 단일 스레드, 작은 heap/단일 CPU에 적합 |
| Parallel GC | 처리량 중심, Young/Old GC를 멀티스레드로 수행 |
| CMS | STW 단축 목적, 단편화 문제로 Java 14에서 제거 |
| G1 GC | region 기반, Java 9+ 기본 GC, pause와 throughput 균형 |
| ZGC/Shenandoah | 대용량 heap과 저지연 pause 목표 |
| Epsilon GC | 회수하지 않는 실험용 GC |

G1에서 humongous 객체는 region 크기의 50% 이상을 차지하는 큰 객체입니다. Young을 거치지 않고 Old 영역에 할당되며 연속 region을 점유해 단편화와 Full GC 가능성을 높일 수 있습니다.

JDK 17에서 명시적으로 GC를 지정하지 않으면 JVM은 서버 등급 환경 여부와 리소스를 보고 기본 GC를 선택합니다. 일반적으로 server-class machine에서는 G1이 기본이지만, CPU와 메모리가 작아 server-class 조건을 만족하지 못하면 Serial GC가 선택될 수 있습니다. 예를 들어 2 vCPU, 1GB 메모리 환경은 메모리 조건이 부족해 Serial GC가 선택될 가능성이 높으므로 운영에서는 `jcmd <pid> VM.info`, `jinfo <pid>` 등으로 실제 GC를 확인해야 합니다.

## 동시성 기본

`synchronized`와 `ReentrantLock`은 상호 배제를 제공합니다. `synchronized`는 블록을 벗어나면 자동 해제되어 간결하지만 timeout, interrupt 대기, fairness 제어가 어렵습니다. `ReentrantLock`은 `tryLock`, `lockInterruptibly`, fair mode, 여러 `Condition`을 제공하지만 `unlock()`을 `finally`에서 직접 보장해야 합니다.

`volatile`은 공유 변수의 가시성을 보장하지만 `count++` 같은 read-modify-write 복합 연산의 원자성은 보장하지 않습니다. 원자성과 가시성이 모두 필요하면 lock, `Atomic*`, concurrent collection을 사용합니다.

CAS는 현재 값이 기대값과 같을 때만 새 값으로 바꾸는 원자 연산입니다. `AtomicInteger`, `AtomicReference`는 CAS loop로 lock 없이 원자성을 제공합니다. 경합이 적으면 빠르지만, 경합이 심하면 spin으로 CPU를 낭비할 수 있고 A → B → A를 감지하지 못하는 ABA 문제가 있습니다. ABA는 `AtomicStampedReference`처럼 version을 함께 비교해 완화합니다.

Thread-safe는 여러 스레드가 동시에 접근해도 순차 실행과 같은 결과가 보장되는 성질입니다. 불변 객체, lock, atomic, ThreadLocal, concurrent collection으로 달성할 수 있습니다. 단, 개별 메서드가 안전해도 `get` 후 `put` 같은 복합 연산은 원자적이지 않을 수 있으므로 `putIfAbsent`, `computeIfAbsent`를 사용합니다.

## Executor, Future, ThreadLocal

생산자-소비자 패턴은 작업을 만드는 생산자와 처리하는 소비자를 `BlockingQueue` 같은 중간 버퍼로 분리합니다. 큐가 가득 차면 생산자가 대기하고, 비어 있으면 소비자가 대기해 backpressure를 만들 수 있습니다.

`ThreadPoolExecutor`는 `corePoolSize`, `maximumPoolSize`, `workQueue`, `RejectedExecutionHandler`로 동작합니다. pool과 queue가 모두 찬 포화 상태에서 실행되는 정책은 다음과 같습니다.

| 정책 | 동작 |
| --- | --- |
| AbortPolicy | 예외 발생 |
| DiscardPolicy | 새 작업 폐기 |
| DiscardOldestPolicy | 가장 오래된 대기 작업 폐기 |
| CallerRunsPolicy | 요청 스레드가 직접 실행 |

Fork/Join은 분할 정복 CPU-bound 작업에 적합한 work stealing 기반 pool입니다. 각 worker가 deque를 가지고, 일이 없으면 다른 worker의 작업을 훔쳐 부하 불균형을 줄입니다. I/O 작업은 common pool을 막지 않도록 별도 executor를 쓰는 편이 안전합니다.

`CompletableFuture`는 기존 `Future.get()`의 blocking 한계를 보완해 비동기 작업 chaining, 조합, 예외 처리를 제공합니다. executor를 지정하지 않으면 `ForkJoinPool.commonPool`을 쓰므로 I/O 중심 작업에는 custom executor를 지정합니다.

`ThreadLocal`은 스레드별 독립 값을 저장합니다. Spring의 트랜잭션 동기화, security context, request context에 사용됩니다. 스레드 풀에서는 스레드가 재사용되므로 작업 종료 시 `remove()`가 필요하고, `@Async`처럼 다른 스레드로 넘어가면 기존 ThreadLocal 값이 자동 전파되지 않습니다.

## Java 언어 기능

`String`은 불변 객체입니다. 리터럴은 String Constant Pool을 통해 같은 문자열을 재사용할 수 있고, `new String()`은 새 객체를 만듭니다. `intern()`은 pool의 문자열 참조를 반환합니다. 반복 문자열 조합은 단일 스레드면 `StringBuilder`, 공유 동기화가 필요하면 `StringBuffer`를 고려합니다.

함수형 인터페이스는 추상 메서드가 하나인 인터페이스이며, 람다는 이 구현 객체를 간결하게 만드는 문법입니다. `Function`, `Predicate`, `Consumer`, `Supplier`, `BiFunction`이 대표적입니다. 람다가 캡처하는 지역 변수는 effectively final이어야 합니다.

Stream API의 중간 연산(`filter`, `map`)은 terminal operation(`collect`, `count`, `findFirst`)이 호출될 때까지 실행되지 않습니다. 이를 lazy evaluation이라고 하며, short-circuit, 중간 컬렉션 회피, 무한 스트림 조합을 가능하게 합니다.

`Optional`은 값이 없을 수 있음을 반환 타입으로 표현하는 도구입니다. 필드, 파라미터, 컬렉션 원소 타입으로 남용하지 말고, `map`, `flatMap`, `orElseGet`, `orElseThrow`로 처리합니다.

Reflection은 런타임에 class, method, field, annotation metadata를 조사하고 호출하는 기능입니다. Spring, Jackson, JPA, JUnit 같은 프레임워크가 사용합니다. 단점은 성능 저하, 타입 안전성 약화, 캡슐화 위반 가능성입니다.

`static`은 인스턴스가 아닌 class 단위 멤버를 의미합니다. static 상태는 전역 공유 상태가 되므로 테스트와 동시성에 주의해야 합니다. enum은 타입 안전한 상수 집합이며, 필드/메서드/상수별 동작을 가질 수 있고 singleton 구현에도 쓰입니다.

불변 객체는 생성 후 상태가 변하지 않는 객체입니다. class를 `final`로 두고, 필드를 `private final`로 만들며, setter를 제공하지 않고, 가변 필드는 방어적 복사를 수행합니다. JDK 16+에서는 `record`가 간결한 불변 데이터 carrier로 유용합니다.

`record`는 모든 component가 `final`이고 canonical constructor, accessor, `equals`, `hashCode`, `toString`을 자동 생성합니다. 그래서 요청/응답 DTO처럼 데이터를 전달하는 타입에 잘 맞습니다.

모든 record가 DTO인 것은 아닙니다. DTO는 계층 간 데이터 전송 목적이고, VO는 도메인 안의 값을 표현하며 validation이나 비즈니스 규칙을 가질 수 있습니다. record는 VO 구현에도 쓸 수 있지만, 다른 class를 `extends`할 수 없고 component 재할당이 불가능하므로 복잡한 도메인 객체를 대체하는 만능 도구는 아닙니다.

Java generic은 기본적으로 invariant입니다. `List<Cat>`은 `List<Animal>`의 하위 타입이 아닙니다. 읽는 producer는 `<? extends T>`, 쓰는 consumer는 `<? super T>`를 쓰는 PECS 원칙을 적용합니다.

`(String) value`는 실제 타입이 String이 아니면 `ClassCastException`이 나고 null은 그대로 null입니다. `String.valueOf(value)`는 null을 `"null"` 문자열로 바꾸므로 안전하지만, 실제 null 의미가 필요하면 `Objects.toString(value, defaultValue)`나 명시적 null 처리가 낫습니다.

자바는 call by value만 사용합니다. 참조 타입을 넘겨도 객체 주소값의 복사본이 전달됩니다. 그래서 객체 내부 상태는 바뀔 수 있지만, 파라미터 변수 자체를 다른 객체로 바꿔도 호출자의 참조 변수는 바뀌지 않습니다.

동일성은 `==`로 같은 객체 참조인지 비교하고, 동등성은 `equals`로 논리적 값이 같은지 비교합니다. `equals`를 재정의하면 `hashCode`도 함께 재정의해야 `HashSet`, `HashMap`에서 중복 판단이 올바르게 동작합니다.

얕은 복사는 내부 참조 객체를 공유하고, 깊은 복사는 내부 참조 객체까지 새로 만듭니다. 가변 객체를 포함한 값 객체는 복사 방식이 버그의 원인이 되기 쉽습니다.

`try-with-resources`는 `AutoCloseable` 자원을 자동 해제합니다. 여러 자원은 선언 반대 순서로 닫히며, 본문 예외를 primary exception으로 유지하고 close 중 발생한 예외는 suppressed exception으로 보존합니다.

Checked exception은 컴파일러가 처리를 강제하며 파일, 네트워크처럼 호출자가 복구할 수 있는 외부 상황에 적합합니다. Unchecked exception은 `RuntimeException` 계층으로 프로그래밍 오류나 회복하기 어려운 상황에 주로 사용합니다. `Error`는 JVM 수준의 심각한 문제로 일반 애플리케이션에서 복구 대상으로 보지 않습니다.
