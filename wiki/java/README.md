# Java

Java 면접은 문법 암기보다 **JVM이 코드를 어떻게 실행하고, 메모리와 동시성을 어떻게 관리하는지**를 설명하는 데 초점이 있습니다.

이 문서는 전체 내용을 한 번에 읽는 입구가 아니라, 필요한 세부 문서로 들어가는 목차입니다.

## 먼저 읽을 순서

| 순서 | 문서 | 먼저 답할 질문 |
| --- | --- | --- |
| 1 | [런타임과 메모리](runtime-memory.md) | JVM은 Java 코드를 어떤 흐름으로 실행하고, Stack/Heap은 어떻게 나뉘는가? |
| 2 | [GC와 메모리 장애](gc-memory.md) | GC Root 기반 reachability, Full GC, OOM 원인을 설명할 수 있는가? |
| 3 | [문자열과 컬렉션](collections.md) | String 불변성, HashMap 내부 구조, Collection 구현체 선택 기준을 설명할 수 있는가? |
| 4 | [동시성 핵심](concurrency.md) | JMM, happens-before, `volatile`, lock, deadlock을 구분할 수 있는가? |
| 5 | [Executor와 비동기](executor-async.md) | ThreadPoolExecutor, CompletableFuture, Virtual Thread의 사용 기준을 설명할 수 있는가? |
| 6 | [Java 언어 기능](language-features.md) | Optional, Stream, Lambda, record, sealed, generic type erasure를 설명할 수 있는가? |
| 7 | [객체 설계와 예외](object-exception.md) | equals/hashCode, 방어적 복사, checked/unchecked 예외 선택 기준을 말할 수 있는가? |
| 8 | [성능 분석과 운영 진단](performance-diagnostics.md) | safepoint, JIT 최적화, thread dump, heap dump, JFR, native memory 문제를 진단할 수 있는가? |
| 9 | [실전 면접 Q&A](interview-qna.md) | 짧은 답변으로 핵심 질문을 빠르게 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| JVM 메모리 | Heap/Method Area는 공유, Stack/PC/Native Stack은 스레드별로 분리됩니다. |
| GC | GC Root에서 도달할 수 없는 Heap 객체를 회수합니다. |
| String | 불변 객체라 안전하지만 반복 연결은 새 객체를 많이 만들 수 있습니다. |
| Collection | 구현체마다 조회, 삽입, 순서, 중복, 동시성 특성이 다릅니다. |
| 동시성 | 공유 상태, 가시성, 원자성, 순서 보장이 핵심입니다. |
| Virtual Thread | I/O 대기 많은 서버에서 thread-per-request 모델을 더 적은 비용으로 확장하게 해줍니다. |
| JMM | `volatile`, lock, thread start/join 같은 happens-before 관계로 가시성과 순서를 보장합니다. |
| Generic | 컴파일 타임 타입 안정성을 제공하지만 런타임에는 type erasure로 동작합니다. |
| Safepoint | GC, deoptimization 같은 JVM 작업을 위해 스레드들이 도달해야 하는 안전 지점입니다. |

## 답변 프레임

Java 질문은 단순 정의보다 **런타임 동작, 비용, 실무 선택 기준**까지 이어서 답하면 좋습니다.

1. 정의: 기능이 무엇인지 한 문장으로 말합니다.
2. 내부 동작: JVM, 메모리, JMM, 자료구조 관점에서 어떻게 동작하는지 설명합니다.
3. 장단점: 성능, 안정성, 가독성, 운영 리스크를 비교합니다.
4. 사용 기준: 언제 쓰고 언제 피할지 말합니다.
5. 장애 사례: OOM, deadlock, GC pause, thread pool 고갈, race condition 같은 실패 모드를 붙입니다.

## 상황별 바로가기

| 상황 | 볼 문서 |
| --- | --- |
| GC, OOM, memory leak 질문이 약함 | [GC와 메모리 장애](gc-memory.md), [성능 분석과 운영 진단](performance-diagnostics.md) |
| 동시성 질문이 약함 | [동시성 핵심](concurrency.md), [Executor와 비동기](executor-async.md) |
| Java 문법은 아는데 깊이가 부족함 | [런타임과 메모리](runtime-memory.md), [Java 언어 기능](language-features.md) |
| 실무 장애 대응 답변을 보강하고 싶음 | [성능 분석과 운영 진단](performance-diagnostics.md) |
| 면접 직전 빠르게 복습함 | [실전 면접 Q&A](interview-qna.md) |

## 참고

- [공식 문서 링크 모음](references.md)
