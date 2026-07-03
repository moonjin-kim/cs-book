# Java: 동시성 핵심

← [Java 개요](README.md)

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
