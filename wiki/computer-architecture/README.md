# 컴퓨터 구조

컴퓨터 구조 면접은 **CPU가 명령어를 어떻게 처리하고, 메모리 접근 지연을 어떻게 줄이는지**를 설명하는 것이 핵심입니다.

운영체제, JVM, 데이터베이스 성능 질문과도 연결되므로 **명령어 실행, 병렬성, 메모리 계층, 캐시 일관성, I/O 병목**을 함께 봐야 합니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | CPU 실행 모델 | CPU가 fetch, decode, execute, memory, write-back 단계를 거쳐 명령어를 처리하는 흐름을 설명할 수 있는가? |
| 2 | 파이프라이닝과 Hazard | pipeline이 처리량을 높이는 방식과 data/control/structural hazard 대응을 구분할 수 있는가? |
| 3 | 메모리 계층 | register, cache, memory, storage의 속도·용량 trade-off를 설명할 수 있는가? |
| 4 | Cache와 지역성 | cache line, hit/miss, temporal/spatial locality, prefetch가 성능에 미치는 영향을 설명할 수 있는가? |
| 5 | 멀티코어와 일관성 | cache coherence, MESI, false sharing, memory ordering을 실무 성능 문제와 연결할 수 있는가? |
| 6 | 병렬성과 한계 | ILP, SIMD, Amdahl's law, branch prediction 실패가 처리량을 제한하는 이유를 말할 수 있는가? |
| 7 | I/O와 저장장치 | CPU-bound와 I/O-bound를 구분하고 DMA, interrupt, SSD/NVMe 특성을 설명할 수 있는가? |
| 8 | 실전 면접 Q&A | 짧은 답변으로 cache locality, pipeline, false sharing, CPU-bound 질문을 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| ISA | 소프트웨어가 CPU에게 제공하는 명령어와 register의 계약입니다. |
| Microarchitecture | 같은 ISA를 더 빠르게 구현하기 위한 pipeline, cache, predictor 같은 내부 설계입니다. |
| 파이프라이닝 | 명령어 처리 단계를 겹쳐 CPU 처리량을 높입니다. |
| Hazard | 파이프라인이 멈추거나 잘못된 명령을 가져오는 상황입니다. |
| 데이터 위험 | 앞 명령 결과가 아직 준비되지 않았는데 뒤 명령이 필요로 합니다. |
| 제어 위험 | 분기 결과를 알기 전 다음 명령을 확정하지 못합니다. |
| 구조적 위험 | 여러 명령이 같은 하드웨어 자원을 동시에 요구합니다. |
| 참조 지역성 | 최근 접근한 데이터나 주변 데이터에 다시 접근할 가능성이 높습니다. |
| Cache | 자주 쓰는 데이터를 CPU 가까이에 저장해 지연을 줄입니다. |
| Cache Line | cache와 memory 사이 데이터 이동의 기본 단위입니다. |
| Cache Coherence | 여러 core의 cache가 같은 메모리 값을 모순 없이 보게 하는 규칙입니다. |
| SIMD | 하나의 명령으로 여러 데이터에 같은 연산을 수행합니다. |
| DMA | 장치가 CPU 개입을 줄이고 메모리에 직접 데이터를 전송하는 방식입니다. |

## 면접 답변 프레임

컴퓨터 구조 질문은 “하드웨어 용어”를 나열하기보다 **성능 병목이 어디서 생기는지**로 답하면 좋습니다.

1. 실행 단위: instruction, register, pipeline stage, core 중 무엇을 다루는지 정의합니다.
2. 병목 위치: CPU 계산, memory access, branch, synchronization, I/O 중 어디서 기다리는지 말합니다.
3. 완화 기법: pipeline, cache, prefetch, branch prediction, SIMD, multi-core, DMA를 연결합니다.
4. 한계: hazard, cache miss, memory bandwidth, lock contention, false sharing, Amdahl's law를 설명합니다.
5. 실무 연결: 배열 순회, HashMap 접근, thread 수 증가, GC, DB buffer pool, network I/O까지 이어 말합니다.

## 1. CPU 실행 모델

### ISA와 Microarchitecture

| 구분 | 의미 | 예 |
| --- | --- | --- |
| ISA | 소프트웨어가 보는 명령어 집합과 register, memory model 계약 | x86-64, ARM64, RISC-V |
| Microarchitecture | ISA를 실제 칩에서 구현하는 내부 구조 | pipeline 깊이, cache 크기, branch predictor |

핵심:

- 같은 ISA라도 CPU 모델이 다르면 성능 특성이 다를 수 있습니다.
- 프로그램은 ISA 명령어로 실행되지만, 실제 CPU 내부에서는 명령어를 더 작은 micro-operation으로 쪼개 실행할 수 있습니다.
- 컴파일러와 JIT는 target architecture의 특성을 고려해 instruction selection, register allocation, vectorization을 수행합니다.

### CPU 기본 구성

| 구성 요소 | 역할 |
| --- | --- |
| Control Unit | 명령어 해석과 실행 흐름 제어 |
| ALU | 산술·논리 연산 |
| Register | CPU 내부의 가장 빠른 저장 공간 |
| Program Counter | 다음에 가져올 명령어 주소 |
| Cache | memory 접근 지연 완화 |
| Bus/Interconnect | core, cache, memory, I/O 장치 연결 |

주의:

- CPU 연산 자체보다 memory에서 데이터를 기다리는 시간이 더 큰 병목이 되는 경우가 많습니다.
- register에 올라오지 않은 데이터는 cache와 memory 계층을 거쳐야 합니다.

## 2. 명령어 파이프라이닝

명령어 실행 단계를 나누고 여러 명령어의 단계를 겹쳐 실행하는 기법입니다.

예시 단계:

1. Instruction Fetch
2. Instruction Decode
3. Execute
4. Memory Access
5. Write Back

장점:

- 한 명령어의 지연 시간을 줄이는 것이 아니라 처리량을 높입니다.
- 각 단계가 균형 있게 나뉘면 cycle마다 하나의 명령어를 완료하는 이상적인 처리량에 가까워질 수 있습니다.

주의:

- hazard가 발생하면 stall이나 flush가 필요합니다.
- pipeline stage가 깊어질수록 clock을 높일 여지는 있지만 branch misprediction penalty도 커질 수 있습니다.
- 실제 CPU는 superscalar, out-of-order execution, speculative execution 등으로 여러 명령을 더 공격적으로 실행합니다.

## 3. Pipeline Hazard

| Hazard | 원인 | 대응 |
| --- | --- | --- |
| Data Hazard | 이전 명령 결과가 아직 없음 | forwarding, stall |
| Control Hazard | branch 결과를 모름 | branch prediction, flush |
| Structural Hazard | 같은 하드웨어 자원 경합 | 자원 분리, stall |

### Data Hazard

예:

```text
R1 = R2 + R3
R4 = R1 + R5
```

두 번째 명령은 첫 번째 명령의 결과인 `R1`이 필요합니다. 결과가 아직 register에 쓰이지 않았다면 pipeline이 기다려야 합니다.

대응:

- forwarding/bypassing으로 write-back 전 결과를 다음 stage에 전달합니다.
- load-use hazard처럼 forwarding으로도 부족하면 stall을 넣습니다.
- compiler가 독립 명령을 사이에 배치해 지연을 숨길 수 있습니다.

### Control Hazard

분기 명령은 다음에 실행할 instruction stream을 바꿀 수 있습니다.

대응:

- branch prediction으로 분기 방향과 target을 예측합니다.
- 예측이 맞으면 pipeline을 유지합니다.
- 틀리면 speculative execution 결과를 버리고 pipeline을 flush합니다.

실무 연결:

- 예측하기 어려운 branch가 많은 코드는 pipeline 효율을 떨어뜨릴 수 있습니다.
- 정렬된 데이터에서 조건 분기가 더 빠르게 보이는 사례는 branch prediction과 cache locality가 함께 작용할 수 있습니다.

### Structural Hazard

같은 cycle에 여러 명령이 같은 hardware resource를 필요로 할 때 발생합니다.

예:

- instruction fetch와 data memory access가 같은 memory port를 요구합니다.
- 여러 연산이 같은 execution unit을 요구합니다.

대응:

- instruction cache와 data cache 분리
- execution unit 추가
- scheduling으로 resource contention 완화

## 4. 병렬 실행과 한계

### Superscalar와 Out-of-Order Execution

현대 CPU는 한 cycle에 여러 instruction을 issue할 수 있습니다.

| 개념 | 설명 |
| --- | --- |
| Superscalar | 여러 execution unit으로 여러 명령을 동시에 실행 |
| Out-of-order | 의존성이 없는 명령을 원래 순서보다 먼저 실행 |
| Speculative execution | 분기 예측 결과를 믿고 미리 실행 |
| Reorder buffer | 결과를 program order에 맞춰 commit하기 위한 구조 |

핵심:

- CPU는 program의 의미를 유지하는 범위에서 내부 실행 순서를 바꿀 수 있습니다.
- data dependency가 많으면 out-of-order로 숨길 수 있는 지연이 줄어듭니다.
- memory ordering은 single-thread code보다 multi-thread code에서 중요해집니다.

### SIMD

SIMD는 하나의 명령으로 여러 데이터에 같은 연산을 적용합니다.

사용:

- 이미지/영상 처리
- 암호화
- 압축
- 벡터·행렬 연산
- 데이터 분석 scan

주의:

- 데이터가 연속적이고 정렬되어 있으면 vectorization에 유리합니다.
- branch가 많거나 데이터 의존성이 강하면 SIMD 효율이 떨어집니다.

실무 포인트:

- 데이터 처리 라이브러리 Polars는 벡터화 연산과 SIMD로 CPU를 최적화하는데, 그 전제로 Apache Arrow 기반 컬럼(columnar) 메모리 배치를 사용합니다. 같은 연산을 연속된 값에 일괄 적용하려면 데이터가 메모리상 칼럼 구조로 연속 배치되어야 하므로, 공간 지역성이 벡터화 효율의 조건입니다. (출처: 우아한형제들)
- 벡터화 파이프라인 중간에 Python UDF 같은 스칼라 콜백을 끼우면 "러스트 코어의 장점이나 벡터화 연산의 장점을 많이 잃어버린다"고 명시합니다. 스칼라 콜백이 SIMD 이득을 무너뜨리는 전형적 안티패턴입니다. (출처: 우아한형제들)
- 710MB parquet 읽기에서 Polars는 4초 554ms, Pandas는 33초 916ms였고, 1.8GB 처리 시 Eager API 17.84GB/9.07초에서 Lazy API 5.9GB/1.009초로 메모리와 시간이 동시에 개선되어 데이터 처리가 memory-bound임을 실측으로 보여줍니다. (출처: 우아한형제들)

### Amdahl's Law

병렬화로 얻을 수 있는 성능 향상은 병렬화할 수 없는 부분에 의해 제한됩니다.

```text
speedup = 1 / ((1 - p) + p / n)
```

- `p`: 병렬화 가능한 비율
- `n`: 병렬 worker 수

면접 포인트:

- thread 수를 늘려도 항상 빨라지지 않습니다.
- lock, serialization, memory bandwidth, GC pause, I/O wait가 병렬화 한계를 만듭니다.
- 성능 개선은 병목 구간을 측정한 뒤 적용해야 합니다.

실무 포인트:

- CPU 사용량(Usage)은 시간 기반(100ns 샘플링) 지표이고 활용률(Utilization)은 주파수 기반(유효 주파수÷기본 주파수) 지표라 근본이 다릅니다. 기본 2.5GHz 코어가 터보 부스트로 3.1GHz로 돌면 활용률은 3.1/2.5 = 124%로 100%를 넘을 수 있어, 시간 점유율만으로는 실제 처리량을 잡지 못합니다. (출처: 넷마블)
- 사용률 측정 단위가 논리 프로세서(Logical Processor) 기준이라 SMT/하이퍼스레딩에서 물리코어 1개가 논리코어 2개로 잡힙니다. "CPU 사용률이 낮다=여유 있다"가 항상 참이 아니며, 유효 주파수는 RDTSC 같은 하드웨어 카운터로 봐야 정확합니다. (출처: 넷마블)
- 연산량이 많은 HD 계층 압축을 전용 하드웨어 코덱에 오프로딩하면 소프트웨어 코덱 대비 압축 시간을 약 20% 수준으로 줄이고, 그동안 CPU는 병렬로 다른 작업을 진행할 수 있습니다. 특화 하드웨어로 넘겨 CPU 병렬성을 확보하는 구조입니다. (출처: LINE)
- 소프트웨어 코덱만으로는 50% 이상의 시간을 압축에만 써야 해 실시간 HD가 어렵지만, 하이브리드는 iPhone 8·HD 30FPS·10초 영상 기준 데드라인의 56% 수준에서 압축을 끝냅니다. CPU-bound 실시간 작업의 한계와 하드웨어 분담 효과를 수치로 보여줍니다. (출처: LINE)

## 5. 메모리 계층과 참조 지역성

| 계층 | 특징 |
| --- | --- |
| Register | 가장 빠르지만 수가 매우 적음 |
| L1 Cache | core에 가장 가깝고 작음 |
| L2 Cache | L1보다 크고 느림 |
| L3 Cache | 여러 core가 공유하는 경우 많음 |
| Main Memory | 크지만 cache보다 훨씬 느림 |
| SSD/HDD | 영속 저장소, latency가 가장 큼 |

### 참조 지역성

| 구분 | 의미 | 예 |
| --- | --- | --- |
| 시간 지역성 | 최근 접근한 데이터를 다시 접근 | loop 변수, hot object |
| 공간 지역성 | 접근한 데이터 주변을 접근 | 배열 순회, sequential scan |

Cache는 참조 지역성을 이용해 메모리 접근 비용을 줄입니다.

추가 설명:

- 시간 지역성은 같은 값을 반복해서 읽는 loop, memoization, hot object에서 나타납니다.
- 공간 지역성은 배열 순회, sequential scan, cache line prefetch에서 나타납니다.
- LinkedList는 논리적으로 순차 구조지만 노드가 메모리에 흩어져 있으면 공간 지역성이 나쁠 수 있습니다.

### CPU Cache

Cache line:

- CPU cache가 memory와 주고받는 기본 단위입니다.
- 보통 하나의 변수만 읽어도 같은 cache line에 있는 주변 데이터가 함께 올라옵니다.
- 배열 순회가 빠른 이유 중 하나입니다.

Cache 관련 면접 포인트:

- cache hit면 빠르게 데이터에 접근합니다.
- cache miss면 하위 계층에서 가져와야 해 느립니다.
- 배열 순회가 linked list보다 캐시 효율이 좋은 경우가 많습니다.
- cache는 application이 직접 관리하지 않지만 데이터 배치와 접근 패턴으로 hit ratio에 영향을 줄 수 있습니다.

### Cache Miss 종류

| 종류 | 설명 | 대응 방향 |
| --- | --- | --- |
| Compulsory miss | 처음 접근해서 발생 | prefetch, warm-up |
| Capacity miss | cache 용량보다 working set이 큼 | working set 축소, blocking |
| Conflict miss | cache mapping 충돌 | 데이터 배치 조정 |

### Write 정책

| 정책 | 설명 |
| --- | --- |
| Write-through | cache와 memory에 동시에 기록 |
| Write-back | cache에 먼저 쓰고 나중에 memory에 반영 |
| Write-allocate | write miss 시 cache line을 가져온 뒤 씀 |
| No-write-allocate | write miss 시 memory에 직접 씀 |

실무에서는 CPU cache뿐 아니라 DB buffer pool, OS page cache, CDN cache도 비슷하게 hit/miss, eviction, write-back 관점으로 설명할 수 있습니다.

실무 포인트:

- 멀티코어 CPU에서 각 코어는 메모리 컨트롤러를 경유해 메모리에 접근하며, 서버용 메인보드처럼 CPU 소켓이 여러 개면 소켓 간 통신 경로가 누적되어 로컬 메모리 대비 리모트 메모리 접근 비용이 커집니다. 같은 메인 메모리라도 물리적 거리(NUMA 노드)에 따라 지연이 달라진다는 점입니다. (출처: 넷마블)
- NUMA 기본 설정에서는 단일 프로세스의 스레드가 한 소켓 노드에만 몰리는 코어 쏠림이 생깁니다. 실측에서 밸런싱 없이 스레드 40개일 때 한쪽 노드만 100%(총 CPU 50%)에 대기열 26.0이었고, 밸런싱 시 양쪽 100%(총 100%)에 대기열 16.0으로, 절반의 코어를 놀리는 손실이 확인됐습니다. (출처: 넷마블)
- Node interleaving(NUMA를 UMA처럼 동작)을 켜자 코어 쏠림이 해소됐습니다. 단일 프로세스 서버 앱에서는 이 옵션을 권장하며, 메모리 배치 정책이 멀티코어 활용률을 직접 좌우함을 보여줍니다. (출처: 넷마블)

## 6. 멀티코어와 Cache Coherence

### False Sharing

서로 다른 변수가 같은 cache line에 있어 여러 코어가 불필요하게 cache invalidation을 일으키는 현상입니다.

예:

```text
cache line: [ counterA ][ counterB ][ padding ... ]
core 1 writes counterA
core 2 writes counterB
```

두 변수는 논리적으로 독립이지만 같은 cache line에 있으면 한 core의 write가 다른 core cache line을 invalidation시킵니다.

대응:

- padding으로 hot field를 cache line 단위로 분리합니다.
- thread-local counter를 사용하고 나중에 합칩니다.
- 공유 mutable state를 줄입니다.

### Cache Coherence

멀티코어 CPU에서는 각 core가 자기 cache를 가질 수 있습니다. 같은 메모리 주소를 여러 cache가 들고 있으면 값이 어긋날 수 있으므로 coherence protocol이 필요합니다.

대표 개념:

| 상태 | 의미 |
| --- | --- |
| Modified | 현재 cache가 수정한 최신 값을 가짐 |
| Exclusive | 다른 cache에는 없고 현재 cache만 clean copy를 가짐 |
| Shared | 여러 cache가 같은 clean copy를 공유 |
| Invalid | 해당 cache line이 유효하지 않음 |

면접 포인트:

- coherence는 같은 주소에 대한 일관성을 다루지만, 모든 memory operation의 순서를 직관적으로 보장한다는 뜻은 아닙니다.
- Java의 `volatile`, lock, atomic operation은 memory visibility와 ordering을 다루기 위해 필요합니다.
- lock contention이 심하면 cache line bouncing이 늘어 성능이 급격히 나빠질 수 있습니다.

## 7. 메모리 주소와 가상 메모리 연결

컴퓨터 구조와 OS는 메모리 계층에서 연결됩니다.

흐름:

```text
virtual address
 -> TLB lookup
 -> page table walk if TLB miss
 -> physical address
 -> cache lookup
 -> memory access if cache miss
```

핵심:

- CPU가 실행하는 load/store는 가상 주소를 사용하고, MMU가 물리 주소로 변환합니다.
- TLB는 page table translation 결과를 cache합니다.
- TLB miss는 page table walk 비용을 만들고, page fault는 OS 개입으로 훨씬 비싼 경로가 됩니다.
- 큰 working set은 cache miss뿐 아니라 TLB pressure도 만들 수 있습니다.

## 8. I/O와 저장장치

### CPU-bound vs I/O-bound

| 구분 | 병목 | 예 |
| --- | --- | --- |
| CPU-bound | 계산, 압축, 암호화, serialization | 이미지 처리, 대량 JSON 변환 |
| Memory-bound | memory bandwidth, cache miss | 큰 배열 scan, random access |
| I/O-bound | disk, network, external system wait | DB 조회, 파일 읽기, API 호출 |

주의:

- CPU 사용률이 낮다고 항상 여유가 있는 것은 아닙니다. thread가 I/O wait로 잠들어 있을 수 있습니다.
- latency 최적화와 throughput 최적화는 다를 수 있습니다.

### Interrupt, Polling, DMA

| 방식 | 설명 | 장단점 |
| --- | --- | --- |
| Interrupt | 장치가 CPU에 event를 알림 | idle 효율 좋지만 interrupt storm 가능 |
| Polling | CPU가 장치 상태를 반복 확인 | low latency 가능하지만 CPU 사용 |
| DMA | 장치가 memory에 직접 전송 | CPU copy 부담 감소 |

네트워크와 디스크 I/O에서는 DMA와 kernel buffer, user buffer copy 비용이 성능에 영향을 줍니다.

### HDD, SSD, NVMe

| 저장장치 | 특징 |
| --- | --- |
| HDD | seek와 회전 지연이 커서 random I/O가 느림 |
| SATA SSD | flash 기반, random I/O가 HDD보다 빠름 |
| NVMe SSD | PCIe 기반, 병렬 queue와 낮은 latency에 유리 |

면접 포인트:

- 순차 I/O와 랜덤 I/O의 차이를 말합니다.
- fsync는 데이터를 durable하게 만들기 위해 비용이 큽니다.
- DB는 page cache, buffer pool, WAL, fsync 정책으로 저장장치 특성을 흡수합니다.

## 9. 실무 성능 관점

### 배열 순회가 LinkedList보다 빠를 수 있는 이유

Array는 데이터가 연속적으로 배치되어 cache line과 prefetch에 유리합니다. LinkedList는 각 노드를 따라 pointer chasing을 해야 하고, 노드가 heap에 흩어져 있으면 cache miss가 늘어납니다. 따라서 Big-O가 같거나 LinkedList가 이론상 유리해 보여도 실제 성능은 배열이 더 좋을 수 있습니다.

### Branch가 성능에 주는 영향

분기 예측이 잘 맞으면 pipeline을 유지할 수 있지만, 예측이 틀리면 speculative work를 버리고 pipeline을 다시 채워야 합니다. 조건 분기가 데이터에 따라 랜덤하게 바뀌면 예측률이 낮아질 수 있습니다.

### Allocation이 비용인 이유

객체 할당은 heap 공간 확보뿐 아니라 초기화, pointer write, GC 추적 대상 증가를 동반합니다. 많은 작은 객체는 cache locality를 악화시키고 GC pressure를 높일 수 있습니다. Java에서 primitive array, object pooling, batch 처리 같은 선택은 이런 비용을 줄이기 위한 trade-off입니다.

## 실전 면접 Q&A

### 파이프라이닝은 명령어 하나의 실행 시간을 줄이나요?

주로 줄이는 것은 단일 명령어 latency가 아니라 전체 처리량입니다. 여러 명령어의 fetch, decode, execute 단계를 겹쳐 실행해 일정 시간이 지난 뒤 cycle마다 더 많은 명령어를 완료하게 합니다. 다만 hazard가 생기면 stall이나 flush로 효율이 떨어집니다.

### Cache hit와 cache miss는 왜 중요한가요?

CPU와 main memory의 속도 차이가 크기 때문입니다. cache hit는 CPU 가까운 곳에서 데이터를 가져오지만, miss는 하위 cache나 memory까지 접근해야 합니다. 접근 패턴이 순차적이고 working set이 cache에 맞으면 성능이 좋아지고, random access가 많으면 miss가 늘 수 있습니다.

### False sharing은 무엇인가요?

서로 다른 thread가 서로 다른 변수를 수정하더라도 그 변수들이 같은 cache line에 있으면 cache coherence 때문에 line invalidation이 반복될 수 있습니다. 논리적 공유가 없어도 물리적 cache line 공유 때문에 성능이 나빠지는 현상입니다.

### CPU core를 늘리면 성능이 선형으로 좋아지나요?

항상 그렇지 않습니다. 병렬화할 수 없는 구간, lock contention, memory bandwidth, cache coherence traffic, I/O wait가 한계를 만듭니다. Amdahl's law처럼 전체 성능 향상은 병렬화 가능한 비율에 의해 제한됩니다.

### CPU-bound와 I/O-bound는 어떻게 구분하나요?

CPU-bound는 계산 때문에 core 사용률이 높고, I/O-bound는 disk, network, DB 같은 외부 응답을 기다리는 시간이 큽니다. CPU 사용률, run queue, context switch, I/O wait, latency breakdown, profiler를 함께 봐야 합니다.

## 참고한 기술블로그

- 우아한형제들 — Polars로 데이터 처리를 더 빠르고 가볍게 with 실무 적용기: https://techblog.woowahan.com/18632/
- 넷마블 — 단일 프로세스에서 NUMA가 야기한 성능 저하: https://netmarble.engineering/single-process-programming-numa-effect/
- 넷마블 — CPU 이용률의 두 가지 얼굴 – CPU 코어 사용량(Usage)과 활용률(Utilization): https://netmarble.engineering/cpu-core-usage-and-utilization/
- LINE — 하드웨어 비디오 코덱과 소프트웨어 비디오 코덱의 하이브리드!: https://engineering.linecorp.com/ko/blog/develop-hardware-software-hybrid-codec
