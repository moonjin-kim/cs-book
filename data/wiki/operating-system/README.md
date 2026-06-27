# Operating System

운영체제 면접은 **프로그램이 CPU, 메모리, 디스크 같은 자원을 어떻게 안전하고 효율적으로 사용하는지**를 설명하는 것이 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| Process | 실행 중인 프로그램과 자원을 묶은 단위입니다. |
| Thread | 프로세스 안의 실행 흐름이며 stack은 분리, heap은 공유합니다. |
| Scheduling | CPU 시간을 어떤 실행 흐름에 줄지 결정합니다. |
| Context Switching | 현재 CPU 상태를 저장하고 다른 작업의 상태를 복원합니다. |
| System Call | 사용자 프로그램이 커널 기능을 요청하는 통로입니다. |
| 동기화 | 공유 자원 접근 순서를 제어해 race condition을 막습니다. |
| 가상 메모리 | 프로세스마다 독립 주소 공간을 제공합니다. |

## Process와 Thread

| 구분 | Process | Thread |
| --- | --- | --- |
| 의미 | 실행 중인 프로그램 | 프로세스 안의 실행 흐름 |
| 메모리 | 독립 주소 공간 | heap 공유, stack 분리 |
| 생성 비용 | 큼 | 상대적으로 작음 |
| 통신 | IPC 필요 | 공유 메모리 사용 가능 |
| 장애 영향 | 상대적으로 격리 | 같은 프로세스에 영향 |

## Scheduling

CPU Scheduling은 여러 작업에 CPU 시간을 배분하는 정책입니다.

| 정책 | 특징 |
| --- | --- |
| FCFS | 먼저 온 작업 먼저 처리 |
| SJF | 짧은 작업 우선 |
| Round Robin | time quantum 단위로 순환 |
| Priority | 우선순위 기반 |
| MLFQ | 여러 queue와 우선순위 조정 |

주의:

- 처리량, 응답 시간, 공정성 사이 trade-off가 있습니다.
- starvation 방지를 위해 aging을 사용할 수 있습니다.

## Context Switching

Context Switching은 실행 중인 작업의 CPU 상태를 저장하고 다른 작업 상태를 복원하는 과정입니다.

비용:

- 레지스터 저장/복원
- 캐시 효율 저하
- TLB 영향

너무 잦으면 CPU가 실제 작업보다 전환에 시간을 많이 씁니다.

## System Call

사용자 모드 프로그램은 직접 하드웨어나 커널 자원에 접근할 수 없습니다.

System call 예:

- file open/read/write
- socket
- process 생성
- memory mapping

## 동기화

| 도구 | 설명 |
| --- | --- |
| Mutex | 한 번에 하나의 스레드만 접근 |
| Semaphore | 허용 개수를 가진 동기화 도구 |
| Monitor | lock과 condition을 묶은 고수준 도구 |
| Condition Variable | 특정 조건이 될 때까지 대기/깨움 |

## Deadlock

Deadlock은 여러 작업이 서로 가진 자원을 기다리며 멈춘 상태입니다.

필요 조건:

1. 상호 배제
2. 점유 대기
3. 비선점
4. 원형 대기

대응:

- lock 획득 순서 통일
- timeout
- deadlock detection
- 자원 선점 또는 회피

## 동시성 vs 병렬성

| 구분 | 의미 |
| --- | --- |
| 동시성 | 여러 작업이 번갈아 실행되어 동시에 진행되는 것처럼 보임 |
| 병렬성 | 여러 코어에서 실제로 동시에 실행 |

## 가상 메모리

가상 메모리는 프로세스마다 독립적인 주소 공간을 제공합니다.

장점:

- 프로세스 격리
- 물리 메모리보다 큰 주소 공간 사용 가능
- paging으로 메모리 관리 단순화

## 연속 메모리와 페이징

| 방식 | 특징 | 문제 |
| --- | --- | --- |
| 연속 메모리 할당 | 연속된 물리 공간 할당 | 내부/외부 단편화 |
| Paging | 고정 크기 page/frame 매핑 | page table 비용 |

## 페이지 교체

물리 메모리가 부족하면 어떤 page를 내보낼지 정해야 합니다.

| 알고리즘 | 설명 |
| --- | --- |
| FIFO | 먼저 들어온 page 제거 |
| OPT | 앞으로 가장 늦게 쓸 page 제거, 이론적 최적 |
| LRU | 가장 오래 사용하지 않은 page 제거 |
| LFU | 사용 빈도 낮은 page 제거 |

## File과 I/O

| 개념 | 설명 |
| --- | --- |
| File Descriptor | 열린 파일/소켓을 가리키는 번호 |
| Buffer | I/O 효율을 위한 임시 저장 공간 |
| Blocking I/O | 작업 완료까지 대기 |
| Non-blocking I/O | 즉시 반환 |
| Page Cache | 디스크 데이터를 메모리에 캐싱 |

## Disk Access Time

디스크 접근 시간:

```text
Access Time = Seek Time + Rotational Latency + Transfer Time
```

SSD는 HDD와 달리 회전 지연이 없지만, 여전히 I/O latency와 write amplification을 고려해야 합니다.
