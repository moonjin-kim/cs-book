# Java: GC와 메모리 장애

← [Java 개요](README.md)

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
