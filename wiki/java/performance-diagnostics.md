# Java: 성능 분석과 운영 진단

← [Java 개요](README.md)

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
