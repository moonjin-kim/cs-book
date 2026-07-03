# Java: 실전 면접 Q&A

← [Java 개요](README.md)

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
