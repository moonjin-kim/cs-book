# Java: Executor와 비동기

← [Java 개요](README.md)

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
