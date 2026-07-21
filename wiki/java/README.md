# Java

Java 면접은 문법 암기보다 **JVM이 코드를 어떻게 실행하고, 메모리와 동시성을 어떻게 관리하는지**를 설명하는 데 초점이 있습니다.

이 문서는 Java 주제 전체를 한 페이지에서 읽되, 오른쪽 목차로 필요한 섹션을 빠르게 이동하는 구조입니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | 런타임과 메모리 | JVM은 Java 코드를 어떤 흐름으로 실행하고, Stack/Heap은 어떻게 나뉘는가? |
| 2 | GC와 메모리 장애 | GC Root 기반 reachability, Full GC, OOM 원인을 설명할 수 있는가? |
| 3 | 문자열과 컬렉션 | String 불변성, HashMap 내부 구조, Collection 구현체 선택 기준을 설명할 수 있는가? |
| 4 | 동시성 핵심 | JMM, happens-before, volatile, lock, deadlock을 구분할 수 있는가? |
| 5 | Executor와 비동기 | ThreadPoolExecutor, CompletableFuture, Virtual Thread의 사용 기준을 설명할 수 있는가? |
| 6 | Java 언어 기능 | Optional, Stream, Lambda, record, sealed, generic type erasure를 설명할 수 있는가? |
| 7 | 객체 설계와 예외 | equals/hashCode, 방어적 복사, checked/unchecked 예외 선택 기준을 말할 수 있는가? |
| 8 | 성능 분석과 운영 진단 | safepoint, JIT 최적화, thread dump, heap dump, JFR, native memory 문제를 진단할 수 있는가? |
| 9 | 심화: 객체 메모리 레이아웃과 락 내부 | object header, compressed oops, synchronized 락 확장, false sharing이 메모리·동시성 성능에 어떻게 영향을 주는가? |
| 10 | 실전 면접 Q&A | 짧은 답변으로 핵심 질문을 빠르게 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| JVM 메모리 | Heap/Method Area는 공유, Stack/PC/Native Stack은 스레드별로 분리됩니다. |
| GC | GC Root에서 도달할 수 없는 Heap 객체를 회수합니다. |
| String | 불변 객체라 안전하지만 반복 연결은 새 객체를 많이 만들 수 있습니다. |
| Collection | 구현체마다 조회, 삽입, 순서, 중복, 동시성 특성이 다릅니다. |
| 동시성 | 공유 상태, 가시성, 원자성, 순서 보장이 핵심입니다. |
| Virtual Thread | I/O 대기 많은 서버에서 thread-per-request 모델을 더 적은 비용으로 확장하게 해줍니다. |
| JMM | volatile, lock, thread start/join 같은 happens-before 관계로 가시성과 순서를 보장합니다. |
| Generic | 컴파일 타임 타입 안정성을 제공하지만 런타임에는 type erasure로 동작합니다. |
| Safepoint | GC, deoptimization 같은 JVM 작업을 위해 스레드들이 도달해야 하는 안전 지점입니다. |

## 면접 답변 프레임

Java 질문은 단순 정의보다 **런타임 동작, 비용, 실무 선택 기준**까지 이어서 답하면 좋습니다.

1. 정의: 기능이 무엇인지 한 문장으로 말합니다.
2. 내부 동작: JVM, 메모리, JMM, 자료구조 관점에서 어떻게 동작하는지 설명합니다.
3. 장단점: 성능, 안정성, 가독성, 운영 리스크를 비교합니다.
4. 사용 기준: 언제 쓰고 언제 피할지 말합니다.
5. 장애 사례: OOM, deadlock, GC pause, thread pool 고갈, race condition 같은 실패 모드를 붙입니다.

## 1. 런타임과 메모리

### 버전과 LTS 선택

Java는 6개월 주기로 feature release를 내고, 일부 버전은 LTS로 장기 지원됩니다.

| 버전 | 성격 | 실무 포인트 |
| --- | --- | --- |
| Java 17 | LTS | Spring Boot 3 초기 기준선으로 많이 쓰이며, sealed class가 정식 기능입니다. |
| Java 21 | LTS | virtual thread, pattern matching for switch, record pattern이 정식 기능입니다. |
| Java 25 | LTS | 2025-09-16 GA. Scoped Value가 정식 기능이고, 21 이후의 개선을 새 LTS 기준선으로 묶습니다. |
| Java 26 | non-LTS | 2026-03-17 GA된 단기 release입니다. 운영 표준보다는 기능 검증에 적합합니다. |

선택 기준:

- 운영 안정성과 라이브러리 호환성이 중요하면 LTS를 우선합니다.
- 신규 서버 프로젝트는 프레임워크 지원 여부를 확인한 뒤 Java 21 또는 25를 검토합니다.
- non-LTS는 다음 release가 나오면 빠르게 supersede되므로 장기 운영 기준선으로 잡기 어렵습니다.
- Oracle JDK, Eclipse Temurin, Amazon Corretto 같은 배포판마다 업데이트 정책과 지원 기간이 다를 수 있습니다.

### JVM 실행 흐름

1. `.java` 파일을 `javac`가 `.class` bytecode로 컴파일합니다.
2. ClassLoader가 필요한 클래스를 로딩합니다.
3. JVM은 loading, linking, initialization을 거쳐 클래스를 사용할 수 있게 만듭니다.
4. 처음에는 interpreter가 실행하고, 자주 실행되는 코드는 JIT compiler가 native code로 최적화합니다.

### Class Loading

클래스는 처음부터 모두 로딩되지 않고, 실제 사용 시점에 필요한 클래스가 로딩됩니다.

| 단계 | 의미 | 면접 포인트 |
| --- | --- | --- |
| Loading | `.class` bytecode를 읽어 JVM 내부의 Class 객체로 만듦 | ClassLoader가 담당 |
| Verification | bytecode가 JVM 규칙을 위반하지 않는지 검증 | 잘못된 bytecode 실행 방지 |
| Preparation | static 필드에 기본값 할당 | 명시적 초기값은 아직 아님 |
| Resolution | symbolic reference를 direct reference로 변환 | lazy하게 일어날 수 있음 |
| Initialization | static initializer와 static 필드 초기화 실행 | 코드에 작성한 초기값 반영 |

ClassLoader 계층:

| ClassLoader | 역할 |
| --- | --- |
| Bootstrap ClassLoader | 핵심 Java runtime class 로딩 |
| Platform ClassLoader | Java platform module/class 로딩 |
| Application ClassLoader | application classpath/module path 로딩 |
| Custom ClassLoader | WAS, plugin, agent, hot reload 등 특수 로딩 |

Delegation model:

- 먼저 부모 ClassLoader에게 로딩을 위임합니다.
- 부모가 찾지 못하면 자식 ClassLoader가 직접 로딩합니다.
- 핵심 Java class를 애플리케이션이 임의로 바꾸는 위험을 줄입니다.
- 같은 이름의 클래스라도 ClassLoader가 다르면 JVM에서는 다른 타입으로 취급될 수 있습니다.

### 클래스 초기화 순서

초기화 순서는 면접에서 static, 상속, 생성자 질문으로 자주 나옵니다.

1. 부모 클래스 static 필드와 static block
2. 자식 클래스 static 필드와 static block
3. 부모 클래스 instance 필드와 instance initializer
4. 부모 생성자
5. 자식 클래스 instance 필드와 instance initializer
6. 자식 생성자

주의:

- static 초기화는 클래스별로 한 번만 실행됩니다.
- instance 초기화와 생성자는 객체를 만들 때마다 실행됩니다.
- 생성자에서 override 가능한 메서드를 호출하면 자식 필드 초기화 전 상태를 볼 수 있어 위험합니다.

### Interpreter, JIT, AOT

JVM은 bytecode를 곧바로 기계어 파일로 고정하지 않고 실행 중 정보를 이용해 최적화합니다.

| 방식 | 설명 | 장단점 |
| --- | --- | --- |
| Interpreter | bytecode를 한 줄씩 해석 실행 | 시작은 빠르지만 반복 실행은 느릴 수 있음 |
| JIT Compiler | 자주 실행되는 hot code를 native code로 컴파일 | warm-up 이후 성능 향상 |
| AOT / Native Image | 실행 전에 native binary로 컴파일 | 빠른 시작과 작은 런타임을 기대할 수 있지만 reflection/dynamic proxy 제약 검토 필요 |

JIT 최적화 예:

- method inlining
- escape analysis
- lock elision
- dead code elimination
- loop optimization

실무 포인트:

- Java 서버는 warm-up 전후 성능이 다를 수 있습니다.
- 벤치마크는 JIT warm-up, GC, dead code elimination을 통제해야 의미가 있습니다.
- `final`, 불변 객체, 작은 메서드는 JIT가 최적화하기 좋은 힌트가 될 수 있지만 무조건 빠르다고 단정하면 안 됩니다.

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

## 2. GC와 메모리 장애

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

### Minor GC, Major GC, Full GC

| 구분 | 의미 | 주의점 |
| --- | --- | --- |
| Minor GC | Young 영역 중심 회수 | 짧고 자주 발생할 수 있음 |
| Major GC | Old 영역 중심 회수 | 용어가 GC 구현체마다 다르게 쓰일 수 있음 |
| Full GC | Heap과 Metaspace 등을 넓게 정리하는 stop-the-world GC | 긴 pause의 원인이 될 수 있음 |

면접에서는 용어 정의보다 **애플리케이션에 어떤 영향이 있는지**가 중요합니다.

- pause time이 길면 API latency가 튈 수 있습니다.
- allocation rate가 높으면 GC 빈도가 늘어납니다.
- Old 영역 증가가 계속되면 memory leak이나 cache 정책 문제를 의심합니다.

### Java 참조 종류

| 참조 | 회수 기준 | 사용 예 |
| --- | --- | --- |
| Strong Reference | 참조가 살아 있으면 회수되지 않음 | 일반 객체 참조 |
| Soft Reference | 메모리가 부족할 때 회수 가능 | 메모리 민감 cache, 단 현대 서버에서는 명시적 cache 정책 선호 |
| Weak Reference | 다음 GC에서 회수 가능 | `WeakHashMap`, listener 누수 완화 |
| Phantom Reference | 객체 finalize 이후 후처리 감지 | native resource 정리 추적 |

주의:

- cache는 `SoftReference`에 의존하기보다 Caffeine 같은 cache 라이브러리로 크기, TTL, 통계를 명확히 관리하는 편이 실무적입니다.
- `finalize()`는 예측 가능성이 낮고 deprecated 되었으므로 `try-with-resources`, `Cleaner`, 명시적 close를 우선합니다.

### 메모리 누수와 OOM

Java에도 메모리 누수가 있습니다. GC가 있어도 **도달 가능한 객체**는 회수하지 못합니다.

흔한 원인:

- static collection에 객체를 계속 저장
- listener, callback 등록 후 해제 누락
- ThreadLocal `remove()` 누락
- unbounded cache, unbounded queue
- 큰 파일이나 응답을 한 번에 메모리에 적재
- classloader leak

대표 OOM:

| 오류 | 원인 예 |
| --- | --- |
| `Java heap space` | Heap 객체 증가, cache/collection 누수 |
| `GC overhead limit exceeded` | GC는 오래 도는데 회수량이 매우 적음 |
| `Metaspace` | class metadata 증가, classloader leak |
| `Unable to create new native thread` | 스레드 과다 생성, OS thread 한도 |
| `Direct buffer memory` | NIO direct buffer, Netty buffer 관리 문제 |

분석 순서:

1. GC log와 heap 사용량 추세를 봅니다.
2. heap dump에서 dominator tree와 retained size를 확인합니다.
3. thread dump로 thread 폭증, deadlock, blocking 위치를 봅니다.
4. cache, queue, ThreadLocal, static field를 우선 의심합니다.

## 3. 문자열과 컬렉션

### String

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

### Collection

#### List, Set, Map

| 구조 | 특징 | 대표 구현체 |
| --- | --- | --- |
| List | 순서 보장, 중복 허용 | `ArrayList`, `LinkedList` |
| Set | 중복 불가 | `HashSet`, `TreeSet`, `LinkedHashSet` |
| Map | key-value 저장 | `HashMap`, `TreeMap`, `ConcurrentHashMap` |

#### 구현체 선택 기준

| 구현체 | 평균 조회 | 삽입/삭제 | 순서 | 면접 포인트 |
| --- | --- | --- | --- | --- |
| `ArrayList` | index 조회 O(1) | 중간 삽입/삭제 O(n) | 입력 순서 | 대부분의 List 기본 선택 |
| `LinkedList` | index 조회 O(n) | 노드 위치를 알면 O(1) | 입력 순서 | 캐시 친화성이 낮아 실무 기본 선택은 아님 |
| `HashSet` | O(1) | O(1) | 보장 안 함 | `hashCode`/`equals` 품질 중요 |
| `LinkedHashSet` | O(1) | O(1) | 입력 순서 | 순서가 필요한 중복 제거 |
| `TreeSet` | O(log n) | O(log n) | 정렬 순서 | `Comparable`/`Comparator` 필요 |
| `HashMap` | O(1) | O(1) | 보장 안 함 | 충돌, resize, load factor 설명 |
| `LinkedHashMap` | O(1) | O(1) | 입력 또는 접근 순서 | LRU cache 구현에 활용 가능 |
| `TreeMap` | O(log n) | O(log n) | key 정렬 순서 | range query에 유리 |

`ArrayList`와 `LinkedList` 비교에서 자주 틀리는 지점:

- `LinkedList`의 삽입/삭제 O(1)은 **이미 노드 위치를 알고 있을 때**입니다.
- 특정 index를 찾아야 하면 탐색 O(n)이 먼저 듭니다.
- `ArrayList`는 연속 배열이라 CPU cache locality가 좋아 실제 순회 성능이 좋은 경우가 많습니다.

#### 초기 용량

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

#### HashMap vs ConcurrentHashMap

| 항목 | HashMap | ConcurrentHashMap |
| --- | --- | --- |
| 스레드 안전성 | 안전하지 않음 | 안전함 |
| null key/value | 허용 | 허용하지 않음 |
| 주요 용도 | 단일 스레드, 읽기 전용 공유 | 멀티스레드 읽기/쓰기 |
| 복합 연산 | 직접 동기화 필요 | `compute`, `merge`, `putIfAbsent` 제공 |

주의할 점:

- `ConcurrentHashMap`도 `get()` 후 `put()`을 따로 호출하면 원자적이지 않습니다.
- 원자적 갱신이 필요하면 `computeIfAbsent`, `compute`, `merge`를 사용합니다.

#### HashMap 내부 동작

`HashMap`은 key의 hash 값을 이용해 bucket 위치를 찾고, 같은 bucket 안에서는 key 동등성을 확인합니다.

```text
key -> hashCode -> bucket index -> equals로 실제 key 비교
```

핵심:

- 평균적으로 조회/삽입은 O(1)입니다.
- hash 충돌이 심하면 한 bucket에 원소가 몰려 성능이 나빠집니다.
- Java 8 이후에는 충돌 bucket이 커지면 linked list가 red-black tree로 바뀔 수 있습니다.
- resize는 새 table을 만들고 기존 entry를 재배치하므로 비용이 큽니다.

좋은 key 조건:

- `equals()`와 `hashCode()` 계약을 지킵니다.
- key로 사용하는 동안 값이 바뀌지 않습니다.
- hash 분포가 한쪽으로 몰리지 않습니다.

`HashMap` key를 mutable 객체로 만들면 위험합니다.

```java
Map<UserKey, String> map = new HashMap<>();
UserKey key = new UserKey("u1");
map.put(key, "A");

key.changeId("u2");
map.get(key); // hash 위치가 달라져 못 찾을 수 있음
```

#### Fail-fast와 Fail-safe

Java collection iterator는 순회 중 구조 변경을 감지하면 `ConcurrentModificationException`을 던질 수 있습니다.

| 구분 | 예 | 특징 |
| --- | --- | --- |
| Fail-fast | `ArrayList`, `HashMap` iterator | 빠르게 오류를 드러내지만 동시성 보장 장치는 아님 |
| Fail-safe / weakly consistent | `ConcurrentHashMap` iterator | 순회 중 변경을 허용하되 최신 상태 전체를 보장하지 않을 수 있음 |

주의:

- fail-fast는 버그 탐지에 가깝고, 멀티스레드 안전성을 제공하지 않습니다.
- 순회 중 삭제가 필요하면 iterator의 `remove()` 또는 별도 수집 후 삭제를 사용합니다.

#### 불변 컬렉션

`List.of`, `Set.of`, `Map.of`, `List.copyOf`는 수정 불가능한 컬렉션을 만듭니다.

장점:

- 외부 변경으로 내부 상태가 깨지는 일을 줄입니다.
- DTO, VO, 설정값 전달에 적합합니다.
- thread-safe 설계가 쉬워집니다.

주의:

- 컬렉션 자체만 불변이고 내부 원소 객체가 가변이면 deep immutability는 아닙니다.
- `Collections.unmodifiableList(list)`는 원본 list가 바뀌면 view도 영향을 받습니다.
- 방어적 복사에는 `List.copyOf(input)`처럼 새 불변 컬렉션을 만드는 방식이 더 명확합니다.

## 4. 동시성 핵심

### 동시성 문제의 핵심

| 문제 | 의미 | 대응 |
| --- | --- | --- |
| 공유 상태 | 여러 스레드가 같은 데이터를 사용 | 불변 객체, 락, ThreadLocal |
| 가시성 | 한 스레드의 변경이 다른 스레드에 보이지 않음 | `volatile`, synchronized, lock |
| 원자성 | 중간에 다른 스레드가 끼어듦 | lock, `Atomic*`, concurrent collection |
| 순서 보장 | 실행 순서가 예상과 달라짐 | happens-before 관계 확보 |

### Java Memory Model과 happens-before

Java Memory Model은 여러 스레드가 공유 변수를 읽고 쓸 때 어떤 값이 보이는지, 어떤 순서가 보장되는지 정의합니다.

핵심 개념:

| 개념 | 의미 |
| --- | --- |
| Atomicity | 연산이 중간 상태 없이 한 번에 일어나는 성질 |
| Visibility | 한 스레드의 변경이 다른 스레드에 보이는 성질 |
| Ordering | 컴파일러, CPU, JVM 재정렬에도 관찰 가능한 순서가 보장되는 성질 |
| Happens-before | 앞선 작업의 결과가 뒤 작업에 보인다는 순서 관계 |

대표 happens-before 관계:

- 같은 스레드 안의 앞선 작업은 뒤 작업보다 happens-before입니다.
- `unlock`은 같은 monitor의 이후 `lock`보다 happens-before입니다.
- `volatile` write는 같은 변수의 이후 `volatile` read보다 happens-before입니다.
- `Thread.start()` 이전 작업은 시작된 스레드 안의 작업보다 happens-before입니다.
- 스레드의 모든 작업은 다른 스레드가 그 스레드의 `join()`에서 성공적으로 돌아온 이후보다 happens-before입니다.

면접 답변:

- `volatile`은 최신 값을 보게 하고 재정렬을 제한하지만 `count++` 같은 read-modify-write를 원자적으로 만들지는 못합니다.
- `synchronized`는 mutual exclusion뿐 아니라 lock/unlock을 통해 가시성도 보장합니다.
- 불변 객체는 생성 후 상태가 바뀌지 않아 공유하기 쉽지만, 생성 중 `this`가 외부로 escape하면 안전하지 않을 수 있습니다.

### Thread 상태

| 상태 | 의미 | 예 |
| --- | --- | --- |
| `NEW` | 생성됐지만 시작 전 | `new Thread()` |
| `RUNNABLE` | 실행 가능 또는 실행 중 | CPU 할당 대기 포함 |
| `BLOCKED` | monitor lock 획득 대기 | `synchronized` 진입 대기 |
| `WAITING` | 다른 스레드의 신호를 무기한 대기 | `wait()`, `join()` |
| `TIMED_WAITING` | 제한 시간 동안 대기 | `sleep()`, `wait(timeout)` |
| `TERMINATED` | 실행 종료 | `run()` 종료 |

주의:

- `sleep()`은 lock을 놓지 않습니다.
- `wait()`은 monitor lock을 놓고 대기합니다.
- `wait()`, `notify()`, `notifyAll()`은 같은 monitor를 가진 `synchronized` 블록 안에서 호출해야 합니다.

### synchronized vs ReentrantLock

| 항목 | synchronized | ReentrantLock |
| --- | --- | --- |
| 해제 | 블록 종료 시 자동 | `unlock()` 직접 호출 |
| timeout | 어려움 | `tryLock()` 가능 |
| interrupt 대기 | 제한적 | `lockInterruptibly()` 가능 |
| 공정성 | 제어 어려움 | fair mode 가능 |

### Deadlock, Livelock, Starvation

| 문제 | 의미 | 예 |
| --- | --- | --- |
| Deadlock | 서로가 가진 자원을 기다리며 영원히 멈춤 | A는 lock1 보유 후 lock2 대기, B는 lock2 보유 후 lock1 대기 |
| Livelock | 계속 반응하지만 진행은 못 함 | 서로 양보만 반복 |
| Starvation | 특정 작업이 계속 자원을 얻지 못함 | 낮은 우선순위 스레드가 계속 밀림 |

Deadlock 필요 조건:

1. 상호 배제
2. 점유와 대기
3. 비선점
4. 순환 대기

예방:

- lock 획득 순서를 전역적으로 고정합니다.
- timeout이 있는 `tryLock()`을 사용합니다.
- lock 범위를 짧게 유지합니다.
- 외부 API 호출이나 I/O를 lock 안에서 오래 수행하지 않습니다.

### wait/notify와 BlockingQueue

`wait/notify`는 낮은 수준의 coordination 도구입니다.

```java
synchronized (lock) {
    while (!condition) {
        lock.wait();
    }
    // condition이 참일 때 작업
}
```

주의:

- `if`가 아니라 `while`로 조건을 다시 확인합니다.
- spurious wakeup과 다른 소비자가 먼저 조건을 바꾸는 상황을 고려해야 합니다.
- `notify()`는 어떤 스레드가 깨어날지 제어하기 어렵습니다.

실무에서는 생산자-소비자 문제에 `BlockingQueue`를 우선 고려합니다.

| 도구 | 특징 |
| --- | --- |
| `ArrayBlockingQueue` | 고정 크기, backpressure 표현 쉬움 |
| `LinkedBlockingQueue` | 선택적으로 capacity 지정 가능 |
| `PriorityBlockingQueue` | 우선순위 기반 처리 |
| `SynchronousQueue` | 저장 공간 없이 생산자와 소비자 직접 handoff |

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

## 5. Executor와 비동기

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

Thread pool 설계 질문:

| 질문 | 답변 방향 |
| --- | --- |
| CPU-bound 작업의 pool size는? | CPU core 수 근처에서 시작해 측정으로 조정 |
| I/O-bound 작업의 pool size는? | 대기 시간이 길어 core 수보다 크게 잡을 수 있지만 외부 자원 한도와 함께 조정 |
| unbounded queue가 위험한 이유는? | 요청 폭증 시 메모리 증가와 latency 증가가 뒤늦게 드러남 |
| rejection policy가 필요한 이유는? | 시스템이 포화됐을 때 실패, 지연, caller backpressure 중 하나를 명시적으로 선택 |
| thread pool을 여러 용도에 공유하면? | 느린 작업이 빠른 작업까지 막는 head-of-line blocking 발생 가능 |

운영 포인트:

- API 요청 처리, 배치, 외부 연동, 이벤트 발행은 성격이 다르면 executor를 분리합니다.
- queue size, active thread, completed task, rejection count를 metric으로 봅니다.
- DB connection pool보다 thread pool이 훨씬 크면 많은 스레드가 connection 대기만 할 수 있습니다.

### Virtual Threads

Virtual thread는 OS thread를 직접 점유하는 platform thread보다 가볍게 많은 동시 작업을 표현하기 위한 `Thread` 구현입니다.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<String> user = executor.submit(() -> userClient.fetch(userId));
    Future<List<Order>> orders = executor.submit(() -> orderClient.fetch(userId));

    return new UserSummary(user.get(), orders.get());
}
```

적합한 상황:

- HTTP call, DB query, file/network I/O처럼 대기 시간이 긴 작업
- 요청 하나를 스레드 하나가 처리하는 단순한 thread-per-request 구조
- `CompletableFuture` 체인이 복잡해져 예외와 취소 흐름을 추적하기 어려운 코드

주의할 점:

- CPU-bound 작업을 더 빠르게 만드는 기능은 아닙니다.
- platform thread pool처럼 크기를 맞춰 재사용하는 방식보다 task마다 새 virtual thread를 만드는 방식이 자연스럽습니다.
- 많은 virtual thread에 큰 `ThreadLocal` 값을 넣으면 메모리 사용량이 커질 수 있습니다.
- DB connection pool, HTTP client connection pool 같은 외부 자원 한도는 여전히 별도로 제어해야 합니다.

### Fork/Join

Fork/Join은 큰 작업을 작은 작업으로 나눠 병렬 처리하는 모델입니다.

| 개념 | 설명 |
| --- | --- |
| fork | 하위 작업을 비동기로 분할 |
| join | 하위 작업 결과 대기 |
| work stealing | 바쁜 worker와 한가한 worker의 작업량 차이를 줄임 |

적합한 작업:

- 큰 배열 처리
- divide and conquer 알고리즘
- CPU-bound 계산

주의:

- blocking I/O 작업을 common pool에 많이 넣으면 다른 병렬 작업까지 막을 수 있습니다.
- `parallelStream()`은 내부적으로 common pool을 사용하므로 서버 요청 처리 코드에서는 신중해야 합니다.
- 작업 분할 비용이 실제 계산 비용보다 크면 오히려 느려집니다.

### Scoped Value와 Structured Concurrency

Scoped Value는 특정 실행 범위 안에서 불변 값을 하위 호출과 자식 스레드에 안전하게 공유하는 API입니다.

ThreadLocal과 비교하면 다음 차이가 중요합니다.

| 항목 | ThreadLocal | Scoped Value |
| --- | --- | --- |
| 값 변경 | `set()`으로 변경 가능 | 바인딩된 범위 안에서 불변 공유 |
| 생명주기 | `remove()` 누락 시 누수 위험 | lexical scope 종료와 함께 해제 |
| virtual thread 대량 사용 | 값 복사와 저장 비용 주의 | 많은 thread와 함께 쓰기 쉽게 설계 |
| 대표 용도 | legacy context, MDC, transaction context | request context, 인증 정보, trace id 전달 |

Structured Concurrency는 부모 작업이 여러 자식 작업을 만들었을 때, 성공·실패·취소·대기를 하나의 작업 단위로 다루려는 모델입니다.

핵심 질문:

- 한 자식 작업이 실패하면 나머지를 취소해야 하는가?
- 부모 요청이 timeout되면 자식 작업도 함께 멈추는가?
- thread dump나 tracing에서 부모-자식 관계가 보이는가?

Java 25 기준 Structured Concurrency는 preview API이므로 운영 도입 전 컴파일 옵션, 프레임워크 지원, API 변경 가능성을 확인해야 합니다.

### CompletableFuture

`CompletableFuture`는 비동기 작업을 chaining, 조합, 예외 처리할 수 있게 해줍니다.

주의할 점:

- executor를 지정하지 않으면 `ForkJoinPool.commonPool`을 사용합니다.
- I/O 중심 작업은 별도 executor를 지정하는 편이 안전합니다.
- `get()`을 남용하면 비동기 장점이 사라집니다.

자주 쓰는 메서드:

| 메서드 | 의미 |
| --- | --- |
| `thenApply` | 결과를 동기 변환 |
| `thenCompose` | 비동기 작업을 평탄화 |
| `thenCombine` | 독립 작업 두 개의 결과 조합 |
| `allOf` | 여러 작업 완료 대기 |
| `exceptionally` | 예외를 값으로 복구 |
| `handle` | 성공/실패를 모두 처리 |
| `orTimeout` | 지정 시간 초과 시 예외 |

면접 포인트:

- `thenApply`가 `CompletableFuture<CompletableFuture<T>>`를 만들 상황이면 `thenCompose`를 고려합니다.
- `allOf`는 개별 결과를 직접 반환하지 않으므로 각 future에서 다시 결과를 꺼내야 합니다.
- 취소와 timeout은 하위 작업이나 외부 호출까지 자동으로 중단하지 않을 수 있어 client timeout도 함께 설계해야 합니다.

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

## 6. Java 언어 기능

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

## 7. 객체 설계와 예외

### 객체 비교와 복사

#### Object 기본 메서드

모든 Java 객체는 `Object`를 상속합니다.

| 메서드 | 의미 | 면접 포인트 |
| --- | --- | --- |
| `equals` | 논리적 동등성 비교 | 재정의 시 `hashCode`도 함께 재정의 |
| `hashCode` | hash 기반 자료구조 bucket 결정 | equals가 true면 hashCode도 같아야 함 |
| `toString` | 문자열 표현 | 로그와 디버깅에 도움 |
| `getClass` | runtime class 조회 | reflection, proxy에서 주의 |
| `clone` | 객체 복사 | 얕은 복사 기본, 사용 주의 |
| `wait/notify` | monitor 기반 스레드 협력 | `synchronized` 안에서 호출 |

#### 동일성 vs 동등성

| 비교 | 연산 | 의미 |
| --- | --- | --- |
| 동일성 | `==` | 같은 객체 참조인가 |
| 동등성 | `equals()` | 논리적으로 같은 값인가 |

`equals()`를 재정의하면 반드시 `hashCode()`도 함께 재정의해야 합니다.

이유:

- `HashMap`, `HashSet`은 먼저 hashCode로 bucket을 찾습니다.
- 이후 equals로 실제 동등성을 확인합니다.
- 둘 중 하나만 재정의하면 중복 판단이 깨질 수 있습니다.

#### 얕은 복사 vs 깊은 복사

| 복사 | 의미 | 주의점 |
| --- | --- | --- |
| 얕은 복사 | 내부 참조 객체를 공유 | 한쪽 변경이 다른 쪽에 영향 |
| 깊은 복사 | 내부 참조 객체까지 새로 생성 | 비용은 크지만 독립성 보장 |

`clone()` 주의:

- `Cloneable`은 marker interface라 복사 정책을 명확히 표현하기 어렵습니다.
- 기본 `Object.clone()`은 얕은 복사입니다.
- 상속 구조에서 복사 생성자나 정적 factory가 더 명확한 경우가 많습니다.

#### 방어적 복사

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

### 예외 처리

#### Checked vs Unchecked

| 구분 | Checked Exception | Unchecked Exception |
| --- | --- | --- |
| 처리 강제 | 컴파일러가 강제 | 강제하지 않음 |
| 대표 예 | `IOException`, `SQLException` | `NullPointerException`, `IllegalArgumentException` |
| 사용 기준 | 호출자가 복구 가능 | 프로그래밍 오류 또는 복구 어려움 |

#### Error와 Exception

| 구분 | 의미 |
| --- | --- |
| Error | JVM 수준의 심각한 문제, 일반적으로 복구 대상 아님 |
| Exception | 애플리케이션 실행 중 발생 가능한 예외 상황 |

### Call By Value

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

## 8. 성능 분석과 운영 진단

### JIT 최적화와 Deoptimization

JIT는 실행 중 수집한 profile을 바탕으로 hot code를 native code로 바꾸고 최적화합니다. 이 때문에 Java 성능은 “컴파일된 코드”만 보면 부족하고, **warm-up, profile, deoptimization**까지 함께 봐야 합니다.

대표 최적화:

| 최적화 | 설명 | 주의 |
| --- | --- | --- |
| Method inlining | 작은 메서드 호출을 호출 지점에 펼침 | 너무 큰 메서드는 inlining 한계에 걸릴 수 있음 |
| Escape analysis | 객체가 메서드 밖으로 escape하는지 분석 | allocation 제거, scalar replacement 가능 |
| Lock elision | escape하지 않는 객체의 lock 제거 | 공유 객체에는 적용 어려움 |
| Loop optimization | loop unrolling, bounds check 제거 등 | benchmark 작성 방식에 민감 |
| Devirtualization | 실제 타입이 좁혀지면 virtual call 비용 감소 | 타입 profile이 바뀌면 deoptimization 가능 |

Deoptimization:

- JIT가 “대부분 이 타입일 것”이라고 가정하고 최적화했는데 런타임 상황이 바뀌면 최적화 코드를 버릴 수 있습니다.
- reflection, dynamic proxy, polymorphic call site가 많으면 최적화가 어려워질 수 있습니다.
- microbenchmark는 JMH처럼 warm-up과 dead code elimination을 통제하는 도구로 봐야 합니다.

### Escape Analysis

객체가 현재 메서드나 스레드 밖으로 노출되지 않으면 JVM은 더 공격적으로 최적화할 수 있습니다.

예:

```java
int sum(int a, int b) {
    Point p = new Point(a, b);
    return p.x() + p.y();
}
```

가능한 최적화:

- 객체 allocation 자체를 제거합니다.
- 객체 필드를 개별 scalar 값처럼 다룹니다.
- 동기화가 불필요하면 lock을 제거합니다.

주의:

- escape analysis는 JVM 구현과 상황에 따라 달라지는 최적화입니다.
- 코드를 “무조건 stack allocation된다”고 설명하면 부정확합니다.
- 실제 성능은 JIT log, JFR, benchmark로 확인해야 합니다.

### Safepoint와 Stop-the-world

Safepoint는 JVM이 GC, class unloading, deoptimization 같은 전역 작업을 안전하게 수행하기 위해 Java thread들이 도달해야 하는 지점입니다.

흐름:

```text
JVM requests safepoint
 -> Java threads reach safepoint
 -> JVM performs VM operation
 -> threads resume
```

면접 포인트:

- stop-the-world는 GC에서만 발생하는 것이 아닙니다.
- 모든 스레드가 safepoint에 빨리 도달하지 못하면 time-to-safepoint가 길어질 수 있습니다.
- 긴 native call, 큰 loop, JVM 버전/옵션에 따라 safepoint 지연이 latency spike로 보일 수 있습니다.

### Heap Dump, Thread Dump, GC Log

운영 장애에서는 하나의 도구만 보지 말고 증상별로 조합합니다.

| 증상 | 먼저 볼 것 | 확인할 내용 |
| --- | --- | --- |
| 메모리 증가 | GC log, heap dump | Old gen 증가, dominator tree, retained size |
| CPU 높음 | thread dump, profiler, JFR | runnable thread, hot method, busy loop |
| 응답 지연 | thread dump, metrics, trace | BLOCKED/WAITING, lock contention, 외부 I/O |
| GC pause | GC log, JFR | pause time, allocation rate, humongous object |
| 스레드 폭증 | thread dump, OS limit | thread 생성 위치, pool 설정, native thread OOM |

Thread dump에서 볼 것:

- `RUNNABLE`: CPU를 쓰는지, native I/O 대기인지 구분해야 합니다.
- `BLOCKED`: monitor lock을 기다립니다.
- `WAITING` / `TIMED_WAITING`: condition, sleep, queue, park 상태를 확인합니다.
- deadlock detection 결과와 stack trace의 lock 획득 순서를 봅니다.

Heap dump에서 볼 것:

- retained size가 큰 객체
- static collection
- unbounded cache/queue
- ThreadLocal value
- classloader leak

### JFR, jcmd, jstack, jmap

| 도구 | 용도 |
| --- | --- |
| JFR | 낮은 오버헤드로 JVM event, allocation, GC, lock, thread, I/O 관측 |
| `jcmd` | JVM command 실행, JFR 시작/종료, GC heap 정보 조회 |
| `jstack` | thread dump 수집 |
| `jmap` | heap dump나 heap summary 확인 |
| `jstat` | GC, class loading, compiler 통계 확인 |

실무 포인트:

- production에서는 무거운 heap dump가 pause와 disk 압박을 만들 수 있어 시점과 저장 공간을 확인합니다.
- JFR은 장시간 저부담 관측에 유리합니다.
- container 환경에서는 JVM이 cgroup memory/CPU 제한을 제대로 인식하는지 확인합니다.

### Native Memory와 Direct Buffer

Java 메모리 문제는 Heap만으로 끝나지 않습니다.

Heap 밖 메모리:

- Metaspace
- thread stack
- direct buffer
- mmap
- JNI/native library allocation
- JIT compiled code cache

Direct buffer:

- NIO, Netty 같은 I/O 라이브러리에서 자주 사용합니다.
- GC 대상 객체가 direct memory 참조를 놓아야 정리가 진행될 수 있습니다.
- leak detection, pool 설정, `MaxDirectMemorySize`를 확인해야 합니다.

장애 예:

| 오류 | 의심할 것 |
| --- | --- |
| `OutOfMemoryError: Direct buffer memory` | direct buffer leak, pool 미반납, direct memory limit |
| `Unable to create new native thread` | thread 수 과다, stack size, OS limit |
| `Metaspace` OOM | classloader leak, dynamic class generation |

### ThreadPool 튜닝과 Backpressure

Thread pool은 요청을 빠르게 만드는 장치가 아니라 **동시 실행량과 대기열을 제한하는 자원 경계**입니다.

설정 요소:

| 요소 | 의미 | 위험 |
| --- | --- | --- |
| core/max pool size | 동시에 실행할 worker 수 | 너무 크면 context switch, DB connection 고갈 |
| queue capacity | 대기 작업 수 | unbounded queue는 장애를 메모리 증가로 바꿈 |
| keep alive | 초과 thread 유지 시간 | 짧으면 생성/소멸 반복, 길면 자원 점유 |
| rejection policy | 포화 시 처리 | 실패를 숨기면 장애 전파 |

선택 기준:

- CPU-bound 작업은 core 수 근처에서 시작합니다.
- I/O-bound 작업은 대기 시간이 많아 더 많은 동시성을 둘 수 있지만, DB/API connection limit을 함께 봅니다.
- queue가 길어지는 것은 처리량 부족 신호입니다.
- timeout, bulkhead, circuit breaker, rate limit으로 backpressure를 설계합니다.

### Virtual Thread 운영 주의점

Virtual thread는 I/O 대기 많은 서버에서 thread-per-request 모델을 쉽게 확장하게 해줍니다. 하지만 외부 자원 제한이 사라지는 것은 아닙니다.

주의:

- DB connection pool, HTTP connection pool, rate limit은 여전히 필요합니다.
- CPU-bound 작업을 무한히 늘리면 platform thread와 마찬가지로 CPU가 병목입니다.
- `synchronized` 블록 안에서 blocking I/O를 하면 carrier thread pinning 문제가 생길 수 있습니다.
- ThreadLocal을 많이 쓰면 virtual thread 수만큼 값이 생겨 메모리 비용이 커질 수 있습니다.

운영 기준:

- 요청당 blocking I/O가 많고 코드를 단순하게 유지하고 싶으면 virtual thread를 검토합니다.
- reactive stack을 이미 잘 운영 중이면 migration 비용과 관측 도구 호환성을 함께 봅니다.
- 부하 테스트로 DB pool, downstream API, timeout 정책을 먼저 확인합니다.

### Java 성능 문제 진단 순서

1. 증상을 분류합니다: CPU, memory, GC, lock, I/O, thread pool, 외부 dependency.
2. 지표를 봅니다: latency percentile, throughput, error rate, heap, GC pause, thread count.
3. dump/profile을 수집합니다: thread dump, heap dump, JFR, GC log.
4. 병목을 좁힙니다: allocation hot spot, lock contention, slow I/O, queue 증가.
5. 변경은 작게 적용합니다: pool size, timeout, cache size, query, allocation 감소.
6. 개선 전후를 같은 부하 조건에서 비교합니다.

## 9. 심화: 객체 메모리 레이아웃과 락 내부

객체가 힙에서 실제로 어떤 바이트로 놓이는지, `synchronized`가 하드웨어 레벨에서 어떻게 동작하는지는 메모리 사용량과 동시성 성능을 이해하는 바탕입니다.

### 객체 메모리 레이아웃

모든 Java 객체는 데이터 앞에 **object header**를 가집니다.

| 구성 | 크기(64-bit) | 내용 |
| --- | --- | --- |
| Mark Word | 8B | identity hashCode, GC age, 락 상태 비트 |
| Klass Pointer | 4B(compressed) | 클래스 메타데이터 위치 |
| (배열이면) length | 4B | 배열 길이 |
| 인스턴스 필드 | 가변 | 실제 데이터 |
| Padding | — | 8바이트 정렬을 맞추는 여백 |

면접 포인트:

- header(약 12B)와 8바이트 정렬 때문에 **빈 객체도 최소 16바이트**입니다. 작은 객체를 수억 개 만들면 header/padding 오버헤드가 무시할 수 없습니다.
- **Compressed Oops**: heap이 32GB 이하이면 64-bit 참조를 32-bit로 압축해(8바이트 정렬을 이용) 메모리와 캐시 효율을 높입니다. 그래서 heap을 32GB를 살짝 넘기면 오히려 참조가 커져 실효 메모리가 줄 수 있습니다 — "32GB 근처는 피하라"는 튜닝 상식의 근거입니다.
- 필드 순서와 정렬(padding)에 따라 같은 필드라도 객체 크기가 달라질 수 있습니다.

### synchronized 락의 단계적 확장

`synchronized`의 락 상태는 앞서 본 **mark word**에 저장되며, 경합 정도에 따라 단계적으로 승격(escalation)됩니다.

| 단계 | 동작 | 비용 |
| --- | --- | --- |
| Lightweight Lock | 경합이 없으면 mark word에 CAS로 락 획득 | 매우 저렴(사용자 공간) |
| Heavyweight Lock | 경합이 생기면 OS mutex 기반 monitor로 승격, 스레드가 blocking/park | 비쌈(커널 전환) |

면접 포인트:

- 경합이 없을 때 `synchronized`는 CAS 한 번 수준으로 저렴합니다. "synchronized는 무조건 느리다"는 옛말입니다.
- 경합이 심해져 heavyweight로 승격되면 스레드가 커널에서 blocking되어 context switch 비용이 발생합니다. 락 구간을 짧게 유지하는 이유입니다.
- **biased locking**(단일 스레드 반복 획득 최적화)은 JDK 15부터 기본 비활성화·deprecated(JEP 374)되었습니다. 오래된 자료의 "편향 락" 설명은 최신 JVM엔 해당하지 않습니다.
- `ReentrantLock`은 JVM monitor가 아니라 **AQS(AbstractQueuedSynchronizer)** 기반으로, CAS + FIFO 대기 큐를 사용자 공간에서 구현합니다. 그래서 tryLock/타임아웃/공정성 같은 기능을 제공합니다.

### False Sharing과 cache line

CPU는 메모리를 **cache line**(보통 64바이트) 단위로 캐싱합니다. 서로 다른 스레드가 같은 cache line 안의 **다른 변수**를 각각 갱신하면, 캐시 일관성 프로토콜이 그 line을 계속 무효화해 성능이 급락합니다. 이것이 **false sharing**입니다.

```text
[cache line 64B]  [ counterA ][ counterB ] ...
  Thread-1이 counterA를 갱신 → line 무효화 → Thread-2의 counterB 캐시도 무효화
```

면접 포인트:

- 논리적으로 독립된 변수인데도 물리적으로 같은 line에 있으면 서로의 캐시를 깨뜨립니다. 원인을 코드만 봐서는 못 찾는 대표적 성능 함정입니다.
- 해결은 변수 사이에 padding을 넣거나 `@Contended`(`jdk.internal.vm.annotation.Contended`)로 별도 line에 배치하는 것입니다.
- `LongAdder`가 `AtomicLong`보다 고경합에서 빠른 이유가 이것입니다. 여러 cell로 카운터를 분산하고 각 cell을 padding해 false sharing을 피한 뒤, 읽을 때만 합산합니다.

## 10. 실전 면접 Q&A

### JVM / 메모리

| 질문 | 답변 핵심 |
| --- | --- |
| JVM, JRE, JDK의 차이는? | JVM은 실행 엔진, JRE는 실행 환경, JDK는 개발 도구까지 포함합니다. |
| Java가 platform independent하다는 의미는? | source가 아니라 bytecode가 JVM 위에서 실행되기 때문에 OS별 JVM만 있으면 같은 bytecode를 실행할 수 있습니다. |
| Stack과 Heap의 차이는? | Stack은 스레드별 frame과 지역 변수, Heap은 공유 객체 저장소입니다. |
| 지역 변수는 thread-safe한가? | 변수 자체는 스레드별 stack에 있지만, 지역 변수가 참조하는 객체가 공유 객체면 thread-safe하지 않을 수 있습니다. |
| static field는 어디에 저장되고 어떤 위험이 있나? | 클래스 단위 공유 상태라 동시성, 테스트 격리, 메모리 누수 위험이 있습니다. |
| ClassLoader leak은 왜 생기나? | 오래 사는 static/thread/local/native 참조가 이전 ClassLoader가 로딩한 class/object를 계속 잡으면 unload되지 못합니다. |
| JIT가 하는 일은? | 자주 실행되는 bytecode를 native code로 바꾸고 runtime profile 기반 최적화를 적용합니다. |
| Java에도 memory leak이 있나? | 있습니다. 객체가 더 이상 의미는 없어도 GC Root에서 도달 가능하면 회수되지 않습니다. |

### GC

| 질문 | 답변 핵심 |
| --- | --- |
| GC Root에는 무엇이 있나? | stack 지역 변수, static 참조, JNI 참조 등이 대표적입니다. |
| Mark and Sweep을 설명하라 | 도달 가능한 객체를 표시하고, 표시되지 않은 객체를 회수하는 방식입니다. |
| Stop-the-world란? | GC나 safepoint 작업을 위해 애플리케이션 스레드가 멈추는 구간입니다. |
| G1 GC의 특징은? | Heap을 region으로 나누고 pause 목표를 고려해 회수 대상을 선택합니다. |
| GC 튜닝 전에 무엇을 확인하나? | GC log, allocation rate, pause 목표, heap dump, latency 지표를 먼저 봅니다. |

### Collection

| 질문 | 답변 핵심 |
| --- | --- |
| HashMap의 평균 O(1)이 항상 보장되지 않는 이유는? | hash 충돌, resize, 나쁜 hash 분포 때문에 비용이 커질 수 있습니다. |
| HashMap key는 왜 불변이어야 하나? | key 값이 바뀌면 hash bucket 위치가 달라져 값을 찾지 못할 수 있습니다. |
| HashMap과 Hashtable의 차이는? | Hashtable은 오래된 synchronized Map이고 null을 허용하지 않으며, 현대 코드에서는 보통 HashMap 또는 ConcurrentHashMap을 선택합니다. |
| ConcurrentHashMap이 있는데 왜 복합 연산에 주의해야 하나? | 개별 메서드는 thread-safe해도 `get` 후 `put` 같은 조합은 원자적이지 않습니다. |
| ArrayList와 LinkedList 중 무엇을 기본 선택하나? | 대부분 ArrayList입니다. LinkedList는 index 접근 비용과 cache locality 때문에 일반적 기본값으로 불리합니다. |
| fail-fast iterator는 thread-safe를 의미하나? | 아닙니다. 구조 변경을 빠르게 감지하려는 장치일 뿐 동시성 보장은 아닙니다. |

### 동시성

| 질문 | 답변 핵심 |
| --- | --- |
| process와 thread 차이는? | process는 독립 주소 공간을 갖고, thread는 같은 process 안에서 heap을 공유합니다. |
| `volatile`과 `synchronized` 차이는? | volatile은 가시성과 일부 순서를 보장하고, synchronized는 mutual exclusion과 가시성을 함께 제공합니다. |
| `AtomicInteger`와 `LongAdder` 차이는? | AtomicInteger는 단일 값 CAS, LongAdder는 경합을 분산해 높은 쓰기 경합에서 유리할 수 있습니다. |
| `ThreadLocal`은 왜 remove가 필요한가? | 스레드 풀에서 스레드가 재사용되므로 이전 요청 값이 남거나 누수될 수 있습니다. |
| deadlock을 어떻게 찾나? | thread dump에서 blocked monitor와 순환 대기를 확인합니다. |
| `sleep`과 `wait` 차이는? | sleep은 lock을 놓지 않고, wait은 monitor lock을 놓고 notify를 기다립니다. |
| virtual thread를 쓰면 pool size 튜닝이 사라지나? | platform thread pool 튜닝 부담은 줄지만 DB connection, HTTP connection, rate limit 같은 외부 자원 제어는 필요합니다. |
| Sync/Async와 Blocking/Non-blocking 차이는? | Sync/Async는 "결과를 누가 언제 확인·통지하는가"(직접 확인이면 sync, 콜백/알림 위임이면 async), Blocking/Non-blocking은 "호출이 제어권을 즉시 돌려주는가"입니다. 두 축은 독립이라 4가지 조합이 가능합니다. |

### 언어 기능

| 질문 | 답변 핵심 |
| --- | --- |
| Java는 call by reference인가? | 아닙니다. 항상 call by value이며, 객체 인자는 참조값의 복사본이 전달됩니다. |
| `==`와 `equals` 차이는? | `==`는 참조 동일성, `equals`는 논리적 동등성입니다. |
| `String`이 불변인 이유는? | constant pool 공유, hash cache, 보안, thread-safety에 유리합니다. |
| `StringBuilder`와 `StringBuffer` 차이는? | Builder는 동기화하지 않고, Buffer는 주요 메서드가 동기화되어 있습니다. |
| `Optional`을 field로 쓰지 않는 이유는? | 반환 타입의 부재 표현 용도에 가깝고, field/parameter로 쓰면 직렬화와 모델 의미가 어색해질 수 있습니다. |
| generic type erasure란? | 컴파일 후 대부분의 generic 타입 정보가 지워져 런타임에는 raw type 중심으로 동작하는 방식입니다. |
| record는 불변 객체인가? | component field는 final이지만 내부 참조 객체가 가변이면 깊은 불변은 아닙니다. |
| sealed class는 언제 쓰나? | 가능한 하위 타입 집합이 닫혀 있고 switch exhaustiveness를 활용하고 싶을 때 적합합니다. |

### 예외와 API 설계

| 질문 | 답변 핵심 |
| --- | --- |
| checked exception은 언제 쓰나? | 호출자가 의미 있게 복구할 수 있고 처리 책임을 강제하고 싶을 때 씁니다. |
| RuntimeException은 언제 쓰나? | 프로그래밍 오류, 잘못된 인자, 복구 어려운 비즈니스 실패에 주로 씁니다. |
| 예외를 삼키면 왜 위험한가? | 실패가 관측되지 않아 데이터 불일치나 장애 원인 추적 실패로 이어집니다. |
| try-with-resources의 장점은? | `AutoCloseable` 자원을 예외 상황에서도 안정적으로 닫고 suppressed exception도 보존합니다. |

## 참고한 공식 문서

- Oracle Java SE Support Roadmap: https://www.oracle.com/java/technologies/java-se-support-roadmap.html
- OpenJDK JDK 25: https://openjdk.org/projects/jdk/25/
- OpenJDK JDK 26: https://openjdk.org/projects/jdk/26/
- JEP 444 Virtual Threads: https://openjdk.org/jeps/444
- JEP 506 Scoped Values: https://openjdk.org/jeps/506
- JEP 505 Structured Concurrency: https://openjdk.org/jeps/505
- JEP 409 Sealed Classes: https://openjdk.org/jeps/409
- JEP 441 Pattern Matching for switch: https://openjdk.org/jeps/441
- JEP 440 Record Patterns: https://openjdk.org/jeps/440
- (커뮤니티 면접 정리) Backend Interview for Beginner — Java: https://github.com/backtony/Backend_Interview_for_Beginner/blob/master/Java.md
