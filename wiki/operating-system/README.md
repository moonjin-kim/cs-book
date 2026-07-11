# Operating System

운영체제 면접은 **프로그램이 CPU, 메모리, 파일, 네트워크, 디스크 같은 자원을 커널을 통해 안전하고 효율적으로 사용하는 방식**을 설명하는 것이 핵심입니다.

처음부터 끝까지 외우기보다 아래 핵심 섹션 단위로 나눠 보는 편이 효율적입니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | 프로세스, 스레드, 시스템 콜 | process와 thread가 어떤 자원을 공유하고, user mode에서 kernel mode로 왜 전환되는가? |
| 2 | CPU 스케줄링과 Context Switching | scheduler가 실행 대상을 고르고 context switch 비용이 latency와 throughput에 어떤 영향을 주는가? |
| 3 | 동기화와 Deadlock | mutex, semaphore, condition variable, futex가 race condition과 blocking을 어떻게 다루는가? |
| 4 | 가상 메모리와 Paging | address space, page table, TLB, page fault, copy-on-write를 설명할 수 있는가? |
| 5 | 메모리 관리와 OOM | heap/stack/mmap, page cache, swap, overcommit, OOM killer가 애플리케이션에 어떤 영향을 주는가? |
| 6 | File, I/O, Event Multiplexing | file descriptor, VFS, page cache, blocking/non-blocking I/O, select/poll/epoll 차이는 무엇인가? |
| 7 | 저장장치, 컨테이너, 관측 | HDD/SSD/NVMe, fsync, cgroup, namespace, metrics로 운영 문제를 어떻게 해석하는가? |
| 8 | 실전 면접 Q&A | 짧은 답변으로 process/thread, memory, deadlock, I/O, container 질문을 빠르게 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| Process | 실행 중인 프로그램과 주소 공간, 파일 디스크립터, 권한, signal, resource limit을 묶은 단위입니다. |
| Thread | 같은 process 안의 실행 흐름입니다. heap과 file descriptor는 공유하고 stack/register는 별도입니다. |
| System Call | user program이 file, socket, memory, process 같은 kernel 기능을 요청하는 경계입니다. |
| Scheduling | runnable task 중 CPU를 줄 대상을 고릅니다. 응답 시간, 공정성, throughput 사이 trade-off가 있습니다. |
| Context Switch | register, scheduling state를 바꾸고 cache/TLB locality를 잃을 수 있어 비용이 있습니다. |
| Synchronization | 공유 상태 접근 순서를 제어해 race condition과 memory visibility 문제를 줄입니다. |
| Deadlock | 상호 배제, 점유 대기, 비선점, 원형 대기가 동시에 성립하면 발생할 수 있습니다. |
| Virtual Memory | process마다 독립 주소 공간을 제공하고 page table로 virtual address를 physical frame에 매핑합니다. |
| Page Fault | 접근한 page가 현재 매핑/메모리에 없거나 권한이 맞지 않을 때 kernel이 처리하는 예외입니다. |
| Page Cache | 파일 데이터를 RAM에 cache해 disk I/O를 줄입니다. dirty page writeback과 fsync가 중요합니다. |
| File Descriptor | process가 open file, socket, pipe 등을 참조하는 정수 handle입니다. |
| epoll | 많은 fd를 event 기반으로 감시해 scalable network server에 자주 사용됩니다. |
| cgroup/namespace | container의 자원 제한과 격리 기반입니다. |

## 면접 답변 프레임

OS 질문은 “개념 정의”보다 **자원, 경계, 비용, 장애 증상** 순서로 답하면 실무 연결이 강합니다.

1. 자원: CPU, memory, file descriptor, disk, network, lock 중 무엇을 다루는지 정의합니다.
2. 경계: user/kernel mode, process/thread, virtual/physical memory, blocking/non-blocking 경계를 말합니다.
3. 비용: context switch, cache miss, page fault, syscall, disk seek, fsync, lock contention을 붙입니다.
4. 실패 모드: deadlock, starvation, OOM, fd leak, page cache pressure, thundering herd를 연결합니다.
5. 관측: `top`, `ps`, `vmstat`, `iostat`, `strace`, `lsof`, thread dump, metrics로 확인 방법을 말합니다.

## 1. 프로세스, 스레드, 시스템 콜

### Process

Process는 실행 중인 program을 kernel이 관리하기 위한 단위입니다.

구성:

| 자원 | 설명 |
| --- | --- |
| Virtual address space | code, data, heap, stack, mmap 영역 |
| File descriptor table | 열린 file, socket, pipe |
| Credentials | user/group id, capability |
| Signal handling state | signal disposition, pending signal |
| Resource limits | process/thread 수, open file 수, memory 제한 |
| Scheduling state | runnable, sleeping, stopped 등 |

핵심:

- process는 다른 process와 기본적으로 주소 공간이 분리됩니다.
- open file descriptor, signal, credential 같은 OS 자원이 process에 연결됩니다.
- `fork()`는 부모 process를 복제해 child process를 만들고, Linux에서는 copy-on-write로 비용을 줄입니다.
- `execve()`는 현재 process image를 새 program으로 교체합니다.

### fork, exec, wait

대표 흐름:

```text
parent process
 -> fork()
 -> child process
 -> execve("/bin/program")
 -> parent wait()/waitpid()
```

면접 포인트:

- `fork()` 후 parent와 child는 별도 virtual address space를 갖습니다.
- 처음에는 같은 내용을 보는 것처럼 보이지만 write 시 copy-on-write로 분리됩니다.
- child는 parent의 open file descriptor를 복사받고, 같은 open file description을 가리키면 file offset을 공유할 수 있습니다.
- `execve()`는 PID를 유지한 채 code/heap/stack/data를 새 program으로 바꿉니다.
- parent가 child 종료를 회수하지 않으면 zombie process가 남을 수 있습니다.

### Thread

Thread는 같은 process 안에서 실행되는 흐름입니다.

| 구분 | Process | Thread |
| --- | --- | --- |
| 주소 공간 | 독립 | 같은 process 안에서 공유 |
| heap/data | 독립 | 공유 |
| stack/register | 각 process별 | 각 thread별 |
| file descriptor | process별 | process 안에서 공유 |
| 생성/전환 비용 | 상대적으로 큼 | 상대적으로 작음 |
| 장애 영향 | process 단위 격리 | 같은 process 전체에 영향 |

Linux/POSIX 관점:

- 한 process는 여러 POSIX thread를 가질 수 있습니다.
- thread들은 global memory와 heap을 공유하고 각자 stack을 가집니다.
- Linux NPTL은 thread를 kernel scheduling entity에 매핑하는 1:1 모델입니다.
- thread 동기화 primitive는 Linux에서 futex를 사용해 user space fast path와 kernel wait/wake를 조합합니다.

실무 포인트:

- 플랫폼 스레드는 OS 커널 레벨에서 스케줄링되며 JNI를 통해 OS 스레드에 1:1로 매핑되지만, Virtual Thread는 JVM 런타임 레벨에서 스케줄링되어 스레드 생성 오버헤드가 약 10배, 메모리가 약 200배 절감됩니다. 플랫폼 스레드는 OS 최대 스레드 수에 묶이지만 경량 스레드는 힙 한도 내에서 사실상 무제한으로 만들 수 있습니다. (출처: 카카오페이)
- 스레드 수 제한이 있는 모델(플랫폼 스레드 + 톰캣 풀)은 자연스러운 back pressure로 하위 자원(DB 커넥션 풀)을 보호하지만, 경량 스레드로 유입을 무제한 수용하면 커넥션 풀 borrow timeout 예외가 발생합니다. 스레드를 늘리는 것은 병목을 하위 자원으로 옮길 뿐이므로, 전면 전환보다 I/O 집중 구간에만 선택 적용하는 편이 안전합니다. (출처: 카카오페이)
- `synchronized` 진입 시 Virtual Thread가 캐리어 스레드에 고정(pinning)되며 `-Djdk.tracePinnedThreads=short` 옵션으로 감지할 수 있습니다. MySQL 드라이버나 Jedis 같은 기존 라이브러리에서 warning이 확인되어 성능 저하가 생길 수 있습니다. (출처: 카카오페이)

### User Mode와 Kernel Mode

CPU는 권한 수준을 나눠 사용자 program이 kernel memory나 device를 직접 건드리지 못하게 합니다.

| 모드 | 역할 |
| --- | --- |
| User mode | 애플리케이션 코드 실행 |
| Kernel mode | OS kernel code 실행, hardware/resource 접근 |

System call이 필요한 이유:

- file read/write
- socket send/receive
- process 생성
- memory mapping
- timer, signal
- device control

주의:

- system call은 mode switch 비용이 있습니다.
- system call이 blocking되면 해당 thread가 sleep 상태가 될 수 있습니다.
- user space library 호출과 system call을 구분해야 합니다.

### Signal

Signal은 process/thread에 비동기 event를 전달하는 메커니즘입니다.

예:

| Signal | 의미 |
| --- | --- |
| `SIGTERM` | 정상 종료 요청 |
| `SIGKILL` | 강제 종료, catch 불가 |
| `SIGINT` | interrupt |
| `SIGCHLD` | child 상태 변경 |
| `SIGSEGV` | 잘못된 memory 접근 |

실무 포인트:

- graceful shutdown은 `SIGTERM`을 받아 요청 중단, queue drain, resource close를 수행합니다.
- `SIGKILL`은 정리 기회를 주지 않습니다.
- signal handler 안에서는 async-signal-safe 함수만 안전하게 호출해야 합니다.

## 2. CPU 스케줄링과 Context Switching

### Scheduling 목표

CPU scheduling은 runnable task 중 어떤 task를 언제 실행할지 결정합니다.

목표:

- CPU utilization
- throughput
- response time
- latency
- fairness
- starvation 방지
- real-time deadline

기본 정책:

| 정책 | 특징 | 단점 |
| --- | --- | --- |
| FCFS | 먼저 온 작업 우선 | 긴 작업이 뒤 작업을 막음 |
| SJF | 짧은 작업 우선 | 실행 시간 예측 어려움 |
| Round Robin | time quantum 순환 | quantum 선택 중요 |
| Priority | 우선순위 기반 | starvation 가능 |
| MLFQ | queue와 priority 조정 | 정책 복잡 |

Linux는 일반 task, real-time task, deadline task 등 scheduling class를 나눠 처리합니다.

### Preemptive Scheduling

Preemptive scheduling은 실행 중인 task를 중단하고 다른 task를 실행할 수 있게 합니다.

장점:

- interactive latency 개선
- 우선순위 높은 작업에 빠르게 CPU 제공

비용:

- context switch 증가
- cache locality 저하
- lock 보유 중 preemption이면 지연 확대 가능

### Context Switching

Context switch는 CPU가 실행 중인 task 상태를 저장하고 다른 task 상태를 복원하는 과정입니다.

비용:

- register 저장/복원
- kernel scheduler 실행
- cache locality 손실
- TLB 영향
- branch predictor warm-up 손실

면접 포인트:

- thread 전환이 process 전환보다 대체로 싸지만 공짜는 아닙니다.
- runnable thread가 CPU core보다 너무 많으면 context switch가 증가합니다.
- blocking I/O thread가 많으면 scheduling과 stack memory 비용도 함께 봐야 합니다.

실무 포인트:

- 플랫폼 스레드는 생성에 약 1ms, 컨텍스트 스위칭에 약 100µs가 들지만, JVM이 스케줄링하는 경량 스레드(Virtual Thread)는 스택 약 10KB에 생성 약 1µs, 스위칭 약 10µs로 커널 개입 없는 전환이 훨씬 저렴합니다. 스레드 1개당 스택이 약 2MB인 플랫폼 스레드는 4GB 메모리 환경에서 최대 약 4,000개가 한계입니다. (출처: 우아한형제들)
- Virtual Thread는 캐리어 스레드 위에서 실행되다가 I/O나 sleep을 만나면 park되어 힙으로 내려가고, 캐리어 스레드는 ForkJoinPool의 work stealing으로 다른 작업을 처리합니다. blocking 시 커널 스레드를 통째로 재우는 대신 유저 레벨에서 실행 흐름만 전환하는 M:N 스케줄링 사례입니다. (출처: 우아한형제들)
- 컨텍스트 스위칭 절감 효과는 워크로드 특성에 의존합니다. I/O bound 부하 테스트(힙 256MB 제한)에서는 Virtual Thread가 일반 스레드 대비 약 51% 이상 처리량이 높았고 vuser 250 초과 시 일반 스레드 서버는 장애가 발생했지만, CPU bound 작업은 스위칭 감소 이득이 없어 플랫폼 스레드가 유리합니다. (출처: 우아한형제들)

### Starvation과 Priority Inversion

| 문제 | 설명 | 대응 |
| --- | --- | --- |
| Starvation | 낮은 우선순위 작업이 계속 밀림 | aging, fair scheduling |
| Priority inversion | 낮은 우선순위가 lock을 잡고 높은 우선순위가 대기 | priority inheritance |

예:

```text
low priority thread: lock 보유
high priority thread: lock 대기
medium priority thread: CPU 점유
```

이 경우 high priority thread가 medium priority thread 때문에 간접적으로 지연될 수 있습니다.

## 3. 동기화와 Deadlock

### Race Condition과 Critical Section

Race condition은 실행 순서에 따라 결과가 달라지는 문제입니다.

예:

```text
counter = counter + 1
```

이 연산은 보통 load, add, store로 나뉘므로 여러 thread가 동시에 실행하면 update가 유실될 수 있습니다.

Critical section은 공유 자원을 일관되게 접근해야 하는 코드 영역입니다.

실무 포인트:

- 실무의 race condition은 중복 메시지 동시 수신, 더블 클릭·네트워크 재시도로 인한 중복 요청, 여러 작업자의 동시 조작 등으로 발현되며, read-modify-write가 원자적이지 않으면 update가 유실됩니다. (출처: 컬리)
- critical section의 경계는 공유 상태가 실제로 반영되는 시점까지 커버해야 합니다. 락 해제가 트랜잭션 커밋보다 먼저 일어나면 다음 진입자가 커밋 전 값을 읽어, 두 클라이언트가 모두 재고를 10으로 읽고 결과적으로 1개만 차감되는 정합성 문제가 생깁니다. (출처: 컬리)
- 대기 전략에는 트레이드오프가 있습니다. setnx 기반 스핀락은 락 획득까지 계속 폴링해 부하와 응답 지연을 만들고, pub/sub 방식은 락 해제 신호를 받을 때까지 블로킹 대기하는데, 이는 OS의 spinlock(바쁜 대기)과 sleep/wakeup(조건 대기) 트레이드오프와 같은 구조입니다. (출처: 컬리)
- 락에 waitTime(획득 대기 한도, 기본 5초)과 leaseTime(점유 자동 해제, 기본 3초)을 두면 락 보유자가 죽어도 영구 점유가 남지 않아, timeout 있는 lock으로 데드락·무한 대기를 방지할 수 있습니다. (출처: 컬리)

### Mutex, Semaphore, Condition Variable

| 도구 | 의미 | 사용 |
| --- | --- | --- |
| Mutex | 한 번에 하나만 진입 | 공유 상태 보호 |
| Semaphore | 허용 개수를 가진 counter | connection pool, 제한된 resource |
| Read/Write Lock | reader는 공유, writer는 배타 | 읽기 많은 구조 |
| Condition Variable | 조건이 만족될 때까지 대기/깨움 | producer-consumer |
| Spinlock | lock 획득까지 CPU를 쓰며 대기 | 매우 짧은 kernel critical section |

주의:

- mutex는 데이터 보호를 위해 lock/unlock 범위를 명확히 해야 합니다.
- condition variable은 spurious wakeup과 missed wakeup을 고려해 loop로 조건을 재확인합니다.
- semaphore는 ownership 개념이 약해 mutex 대체로 남용하면 디버깅이 어렵습니다.

### Futex

Futex는 fast userspace mutex의 줄임말입니다.

핵심:

- uncontended lock/unlock은 user space atomic operation으로 처리합니다.
- 대기자가 생길 때만 kernel에 wait/wake를 요청합니다.
- Java, pthread mutex 같은 고수준 동기화 구현의 기반이 될 수 있습니다.

면접 포인트:

- 모든 lock이 매번 kernel system call을 호출하면 비용이 큽니다.
- futex는 경쟁이 없는 흔한 경로를 빠르게 만들고, blocking이 필요할 때 kernel 도움을 받습니다.

### Deadlock

Deadlock 필요 조건:

1. Mutual exclusion
2. Hold and wait
3. No preemption
4. Circular wait

대응:

| 방식 | 설명 |
| --- | --- |
| Prevention | 필요 조건 중 하나를 깨기 |
| Avoidance | 안전 상태를 유지하며 할당 |
| Detection | 발생 후 탐지 |
| Recovery | 강제 종료, rollback, resource 회수 |

실무 대응:

- lock 획득 순서 통일
- timeout 있는 lock 사용
- lock 범위 축소
- 외부 I/O 중 lock 보유 금지
- thread dump, lock graph, DB lock wait 확인

실무 포인트:

- 커넥션 풀 데드락은 "스레드 수 × 태스크당 동시 필요 커넥션 수 > pool size"일 때 발생하는 점유 대기(hold and wait)의 전형입니다. 각 스레드가 커넥션 1개를 점유한 채 두 번째 커넥션을 기다리며, 극단적으로 스레드 1개 + pool size 1 + 태스크당 커넥션 2개면 self-deadlock이 성립합니다. (출처: 우아한형제들)
- HikariCP는 기본 30초 대기 후 timeout 예외를 던져 데드락을 "영구 정지"가 아닌 "지연 + 실패"로 바꿉니다. 장애 시 `total=10, active=10, idle=0, waiting=16` 같은 자원 점유/대기 수치를 확인하는 것이 진단의 출발점입니다. (출처: 우아한형제들)
- 실제 장애(CPU 4코어, 컨슈머 스레드 16개, 풀 최대 10개)의 숨은 원인은 JPA `@GeneratedValue(AUTO)` + MySQL 조합에서 ID 채번이 별도 트랜잭션으로 추가 커넥션을 요구한 것이었습니다. 태스크당 필요 자원 수를 1개로 착각한 것이 근본 원인이므로, getConnection 디버깅으로 실제 자원 요구량을 계측해야 합니다. (출처: 우아한형제들)
- 회피 공식은 pool size = Tn × (Cm − 1) + 1 (Tn: 스레드 수, Cm: 태스크당 동시 필요 커넥션 수)이며 실제로는 여유분을 더해 설정합니다. pool size를 1로 줄이고 쿼리 1건을 실행해 timeout이 나면 한 태스크가 커넥션 2개 이상을 요구하는 코드로 판정할 수 있습니다. (출처: 우아한형제들)

## 4. 가상 메모리와 Paging

### Virtual Address Space

가상 메모리는 각 process에 독립적인 주소 공간을 제공합니다.

일반적인 영역:

```text
text/code
read-only data
data/bss
heap
mmap area
stack
kernel mapping
```

장점:

- process isolation
- protection bit로 read/write/execute 권한 제어
- demand paging
- file-backed mapping
- copy-on-write
- 물리 메모리보다 큰 주소 공간 제공 가능

### Paging과 Page Table

Paging은 virtual page를 physical frame에 매핑합니다.

| 개념 | 설명 |
| --- | --- |
| Page | virtual memory 고정 크기 블록 |
| Frame | physical memory 고정 크기 블록 |
| Page table | virtual page -> physical frame 매핑 |
| PTE | page table entry, frame 번호와 권한 bit |
| TLB | 최근 address translation cache |

주소 변환:

```text
virtual address
 -> page number + offset
 -> TLB lookup
 -> page table walk
 -> physical frame + offset
```

주의:

- page table walk는 비용이 큽니다.
- TLB miss가 많으면 memory access latency가 커집니다.
- context switch 시 address space 변경은 TLB 효율에 영향을 줄 수 있습니다.

### Page Fault

Page fault는 CPU가 접근한 virtual page를 즉시 사용할 수 없을 때 발생합니다.

종류:

| 유형 | 설명 |
| --- | --- |
| Minor fault | page가 memory에는 있지만 현재 page table에 매핑이 없음 |
| Major fault | disk에서 page를 읽어야 함 |
| Protection fault | 권한이 없는 접근 |
| Copy-on-write fault | 공유 page에 write해 private copy 필요 |

면접 포인트:

- 모든 page fault가 오류는 아닙니다.
- demand paging과 COW는 정상적으로 page fault를 활용합니다.
- major page fault가 많으면 disk I/O와 latency가 급증할 수 있습니다.

### Copy-on-Write

`fork()` 후 parent와 child는 같은 physical page를 읽기 전용으로 공유할 수 있습니다.

```text
parent page -> physical frame A
child page  -> physical frame A

child write
 -> page fault
 -> frame A copy to frame B
 -> child maps frame B writable
```

장점:

- fork 비용 감소
- 실제 write한 page만 복사

주의:

- 큰 process에서 fork 후 많은 write가 일어나면 COW 비용이 커집니다.
- GC heap이 큰 application에서 fork를 사용하는 방식은 memory spike를 만들 수 있습니다.

## 5. 메모리 관리와 OOM

### Heap, Stack, mmap

| 영역 | 용도 | 주의 |
| --- | --- | --- |
| Heap | 동적 할당 | fragmentation, leak |
| Stack | 함수 호출, local variable | stack overflow |
| mmap | file mapping, anonymous mapping | page fault, TLB, lifecycle |
| Shared memory | process 간 memory 공유 | synchronization 필요 |

`mmap()`은 file이나 anonymous memory를 process address space에 매핑합니다.

사용:

- 큰 file memory mapping
- shared memory
- allocator 내부 large allocation
- library loading

### Page Cache와 Dirty Page

Page cache는 file data를 memory에 cache합니다.

읽기:

```text
read()
 -> page cache hit: memory에서 복사
 -> page cache miss: disk에서 읽고 cache
```

쓰기:

```text
write()
 -> page cache에 dirty page 생성
 -> kernel writeback
 -> fsync/fdatasync로 durability 요청
```

주의:

- `write()` 성공이 곧 disk 영속화를 뜻하지 않을 수 있습니다.
- `fsync()`는 durability를 높이지만 latency가 큽니다.
- page cache는 “사용 중인 메모리”이지만 필요하면 reclaim될 수 있습니다.

### Swap과 Thrashing

Swap은 physical memory가 부족할 때 일부 page를 disk로 내보내는 방식입니다.

장점:

- 메모리 부족 순간에 완충 역할

단점:

- disk I/O가 memory보다 매우 느립니다.
- working set이 memory보다 크면 계속 page in/out이 발생해 thrashing이 됩니다.

운영 증상:

- CPU는 낮은데 latency가 큼
- major page fault 증가
- disk I/O wait 증가
- application timeout 증가

### Overcommit과 OOM

OS는 할당 요청을 받았다고 즉시 물리 메모리를 모두 예약하지 않을 수 있습니다.

위험:

- allocation은 성공했지만 실제 접근 시 memory pressure가 발생
- container memory limit과 host memory 정책이 다르게 작동
- OOM killer가 process를 종료

운영 포인트:

- RSS, virtual memory, page cache, swap, cgroup memory를 구분합니다.
- Java heap limit과 container memory limit 사이 여유를 둡니다.
- direct buffer, thread stack, metaspace/native memory도 봐야 합니다.

## 6. File, I/O, Event Multiplexing

### File Descriptor

File descriptor는 process가 open file description을 참조하는 정수 handle입니다.

대상:

- regular file
- directory
- socket
- pipe
- eventfd/timerfd
- device

주의:

- fd leak이 나면 `EMFILE` 또는 `Too many open files`가 발생할 수 있습니다.
- `fork()`로 fd가 child에 상속될 수 있으므로 `close-on-exec` 설정이 중요합니다.
- socket도 fd이므로 file I/O와 network I/O가 같은 event loop에서 다뤄질 수 있습니다.

### VFS

VFS는 user space에 일관된 filesystem interface를 제공하고 여러 filesystem 구현을 추상화합니다.

핵심 object:

| object | 의미 |
| --- | --- |
| inode | 파일 metadata와 실제 filesystem 객체 |
| dentry | path component와 inode 연결 cache |
| file | open된 파일 상태, file operation |
| superblock | mounted filesystem instance |

면접 포인트:

- path lookup은 dentry cache와 inode lookup을 거칩니다.
- 같은 inode가 여러 dentry를 가질 수 있습니다.
- file descriptor는 process의 fd table에서 kernel의 file object를 가리킵니다.

### Blocking, Non-blocking, Async

| 방식 | 설명 | 장점 | 단점 |
| --- | --- | --- | --- |
| Blocking I/O | 완료까지 thread 대기 | 단순 | thread 많이 필요 |
| Non-blocking I/O | 준비 안 됐으면 즉시 반환 | event loop 적합 | 상태 관리 복잡 |
| I/O multiplexing | 여러 fd readiness 감시 | scalable server | readiness와 실제 I/O 구분 필요 |
| Async I/O | 완료 이벤트 중심 | thread 대기 감소 | 플랫폼/구현 복잡 |

주의:

- non-blocking은 I/O가 “즉시 완료”된다는 뜻이 아니라 준비 안 됐을 때 기다리지 않는다는 뜻입니다.
- readiness notification을 받은 뒤에도 read/write는 일부만 처리될 수 있습니다.
- backpressure 없이 계속 쓰면 buffer가 커지고 memory pressure가 생깁니다.

### select, poll, epoll

| 방식 | 특징 | 한계 |
| --- | --- | --- |
| select | fd set 사용 | fd 수 제한, 매번 scan |
| poll | fd 배열 사용 | 매번 전체 scan |
| epoll | interest list와 ready list 기반 | Linux 전용, edge/level trigger 이해 필요 |

epoll 모드:

| 모드 | 의미 | 주의 |
| --- | --- | --- |
| Level-triggered | 조건이 남아 있으면 계속 알림 | 사용 단순 |
| Edge-triggered | 상태 변화 순간 알림 | non-blocking + drain loop 필요 |
| One-shot | 한 번 알림 후 재등록 필요 | worker thread 처리에 유용 |

면접 포인트:

- epoll은 많은 idle connection이 있는 server에 유리합니다.
- 모든 fd가 항상 active하면 application 처리 비용이 병목일 수 있습니다.
- thundering herd를 줄이기 위한 설정과 accept loop 설계가 중요합니다.

## 7. 저장장치, 컨테이너, 관측

### Disk Access와 Storage

HDD 접근 시간:

```text
Access Time = Seek Time + Rotational Latency + Transfer Time
```

SSD/NVMe 차이:

| 구분 | HDD | SSD | NVMe |
| --- | --- | --- | --- |
| Random access | seek/rotation 비용 큼 | 낮음 | 낮고 병렬성 높음 |
| 병목 | 기계적 이동 | flash erase/write amplification | queue depth, PCIe, CPU |
| 주의 | sequential I/O 유리 | write amplification, endurance | interrupt, queue 관리 |

운영 포인트:

- sequential vs random I/O를 구분합니다.
- fsync-heavy workload는 latency tail이 커질 수 있습니다.
- page cache hit ratio와 disk queue depth를 함께 봅니다.

### Container 격리

Container는 별도 kernel을 띄우는 VM과 다르게 host kernel을 공유하고 namespace/cgroup으로 격리합니다.

| 기능 | 역할 |
| --- | --- |
| Namespace | PID, mount, network, user, IPC 등 이름 공간 격리 |
| cgroup | CPU, memory, pids, I/O 같은 자원 제한과 계측 |
| capability | root 권한을 세분화 |
| seccomp/AppArmor/SELinux | system call과 접근 정책 제한 |

주의:

- container 안의 root가 host root와 같은 의미가 되지 않도록 user namespace와 capability를 봐야 합니다.
- CPU limit은 throttling을 만들 수 있습니다.
- memory limit 초과는 container OOM으로 이어질 수 있습니다.
- PID 1 process는 signal과 zombie reaping을 제대로 처리해야 합니다.

### OS 관측 도구

| 문제 | 볼 지표/도구 |
| --- | --- |
| CPU 포화 | `top`, `pidstat`, run queue, context switch |
| Memory pressure | RSS, page fault, swap, `free`, `vmstat` |
| I/O 병목 | `iostat`, disk util, queue depth, await |
| fd leak | `lsof`, `/proc/{pid}/fd`, open files limit |
| syscall 병목 | `strace`, perf |
| lock contention | thread dump, perf lock, application metrics |
| network wait | socket state, `ss`, timeout metrics |
| container 제한 | cgroup cpu/memory/pids metrics |

면접에서는 도구 이름보다 “어떤 가설을 검증하려는지”를 먼저 말하는 편이 좋습니다.

## 8. 실전 면접 Q&A

### Process / Thread / System Call

| 질문 | 답변 핵심 |
| --- | --- |
| process와 thread 차이는? | process는 주소 공간과 자원 단위, thread는 process 안 실행 흐름이며 heap/fd는 공유하고 stack/register는 분리됩니다. |
| `fork()`와 `exec()` 차이는? | `fork()`는 child process를 만들고, `exec()`는 현재 process image를 새 program으로 교체합니다. |
| system call은 왜 필요한가? | user program이 file, socket, memory 같은 kernel 자원에 안전하게 접근하기 위한 경계입니다. |
| zombie process는 무엇인가? | child가 종료됐지만 parent가 wait으로 종료 상태를 회수하지 않아 process table entry가 남은 상태입니다. |

### Scheduling / Synchronization

| 질문 | 답변 핵심 |
| --- | --- |
| context switch 비용은? | register 저장/복원뿐 아니라 cache/TLB locality 손실과 scheduler 실행 비용이 있습니다. |
| concurrency와 parallelism 차이는? | concurrency는 여러 작업이 번갈아 진행되는 구조, parallelism은 여러 core에서 실제 동시 실행입니다. |
| mutex와 semaphore 차이는? | mutex는 소유권 있는 배타 lock, semaphore는 허용 개수를 가진 counter입니다. |
| condition variable은 어떻게 써야 하나? | lock과 함께 조건을 loop로 재확인해 spurious/missed wakeup을 방지합니다. |
| deadlock 네 가지 조건은? | 상호 배제, 점유 대기, 비선점, 원형 대기입니다. |

### Memory

| 질문 | 답변 핵심 |
| --- | --- |
| 가상 메모리 장점은? | process 격리, 보호 bit, demand paging, COW, file mapping을 가능하게 합니다. |
| TLB는 왜 필요한가? | page table walk 비용을 줄이기 위해 address translation 결과를 cache합니다. |
| page fault는 항상 오류인가? | 아닙니다. demand paging, COW, mmap lazy loading에서 정상적으로 발생할 수 있습니다. |
| minor fault와 major fault 차이는? | minor는 memory에 있는 page 매핑 문제, major는 disk I/O가 필요한 fault입니다. |
| OOM이 발생하면 무엇을 봐야 하나? | RSS, heap, native memory, thread stack, page cache, swap, cgroup limit을 함께 봅니다. |

### I/O / File / Container

| 질문 | 답변 핵심 |
| --- | --- |
| file descriptor란? | process가 open file/socket/pipe/device를 참조하는 정수 handle입니다. |
| `write()` 성공은 disk 저장 완료인가? | 아닐 수 있습니다. page cache dirty page가 생기고 durability는 fsync/fdatasync와 관련됩니다. |
| blocking과 non-blocking I/O 차이는? | blocking은 준비/완료까지 thread가 대기하고, non-blocking은 준비 안 됐으면 즉시 반환합니다. |
| select/poll/epoll 차이는? | select/poll은 매번 fd 집합을 scan하고, epoll은 interest/ready list로 많은 idle fd에 유리합니다. |
| container와 VM 차이는? | container는 host kernel을 공유하고 namespace/cgroup으로 격리하며, VM은 별도 guest OS/kernel을 가집니다. |
| cgroup은 무엇을 제한하나? | CPU, memory, pids, I/O 같은 자원을 제한하고 계측합니다. |

## 참고한 공식 문서

- Linux man-pages `fork(2)`: https://man7.org/linux/man-pages/man2/fork.2.html
- Linux man-pages `execve(2)`: https://man7.org/linux/man-pages/man2/execve.2.html
- Linux man-pages `pthreads(7)`: https://man7.org/linux/man-pages/man7/pthreads.7.html
- Linux man-pages `sched(7)`: https://man7.org/linux/man-pages/man7/sched.7.html
- Linux man-pages `mmap(2)`: https://man7.org/linux/man-pages/man2/mmap.2.html
- Linux man-pages `epoll(7)`: https://man7.org/linux/man-pages/man7/epoll.7.html
- Linux Kernel Scheduler docs: https://docs.kernel.org/scheduler/
- Linux Kernel Memory Management docs: https://docs.kernel.org/mm/
- Linux Kernel VFS docs: https://docs.kernel.org/filesystems/vfs.html
- Linux Kernel cgroup v2 docs: https://docs.kernel.org/admin-guide/cgroup-v2.html

## 참고한 기술블로그

- 우아한형제들 — Java의 미래, Virtual Thread: https://techblog.woowahan.com/15398/
- 카카오페이 — [Project Loom] Virtual Thread에 봄(Spring)은 왔는가: https://tech.kakaopay.com/post/ro-spring-virtual-thread/
- 우아한형제들 — HikariCP Dead lock에서 벗어나기 (이론편): https://techblog.woowahan.com/2664/
- 우아한형제들 — HikariCP Dead lock에서 벗어나기 (실전편): https://techblog.woowahan.com/2663/
- 컬리 — 풀필먼트 입고 서비스팀에서 분산락을 사용하는 방법 - Spring Redisson: https://helloworld.kurly.com/blog/distributed-redisson-lock/
