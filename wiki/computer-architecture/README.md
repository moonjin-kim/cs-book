# 컴퓨터 구조

컴퓨터 구조 면접은 **CPU가 명령어를 어떻게 처리하고, 메모리 접근 지연을 어떻게 줄이는지**를 설명하는 것이 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| 파이프라이닝 | 명령어 처리 단계를 겹쳐 CPU 처리량을 높입니다. |
| Hazard | 파이프라인이 멈추거나 잘못된 명령을 가져오는 상황입니다. |
| 데이터 위험 | 앞 명령 결과가 아직 준비되지 않았는데 뒤 명령이 필요로 합니다. |
| 제어 위험 | 분기 결과를 알기 전 다음 명령을 확정하지 못합니다. |
| 구조적 위험 | 여러 명령이 같은 하드웨어 자원을 동시에 요구합니다. |
| 참조 지역성 | 최근 접근한 데이터나 주변 데이터에 다시 접근할 가능성이 높습니다. |
| Cache | 자주 쓰는 데이터를 CPU 가까이에 저장해 지연을 줄입니다. |

## 명령어 파이프라이닝

명령어 실행 단계를 나누고 여러 명령어의 단계를 겹쳐 실행하는 기법입니다.

예시 단계:

1. Instruction Fetch
2. Instruction Decode
3. Execute
4. Memory Access
5. Write Back

장점:

- 한 명령어의 지연 시간을 줄이는 것이 아니라 처리량을 높입니다.

주의:

- hazard가 발생하면 stall이나 flush가 필요합니다.

## Pipeline Hazard

| Hazard | 원인 | 대응 |
| --- | --- | --- |
| Data Hazard | 이전 명령 결과가 아직 없음 | forwarding, stall |
| Control Hazard | branch 결과를 모름 | branch prediction, flush |
| Structural Hazard | 같은 하드웨어 자원 경합 | 자원 분리, stall |

## 참조 지역성

| 구분 | 의미 | 예 |
| --- | --- | --- |
| 시간 지역성 | 최근 접근한 데이터를 다시 접근 | loop 변수 |
| 공간 지역성 | 접근한 데이터 주변을 접근 | 배열 순회 |

Cache는 참조 지역성을 이용해 메모리 접근 비용을 줄입니다.

## CPU Cache

| 계층 | 특징 |
| --- | --- |
| L1 | 가장 작고 빠름 |
| L2 | 중간 크기와 속도 |
| L3 | 여러 코어가 공유하는 경우 많음 |
| Main Memory | 크지만 느림 |

Cache 관련 면접 포인트:

- cache hit면 빠르게 데이터 접근
- cache miss면 하위 계층에서 가져와야 해 느림
- 배열 순회가 linked list보다 캐시 효율이 좋은 경우가 많음

## Cache와 성능

성능에 영향을 주는 것:

- cache hit ratio
- 데이터 배치
- 순차 접근 vs 랜덤 접근
- false sharing

False sharing:

- 서로 다른 변수가 같은 cache line에 있어 여러 코어가 불필요하게 cache invalidation을 일으키는 현상입니다.
