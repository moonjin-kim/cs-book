# 자료구조와 알고리즘

자료구조와 알고리즘 면접은 **문제를 어떤 구조로 표현하고, 시간·공간 복잡도를 어떤 trade-off로 선택하는지**를 설명하는 것이 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| 복잡도 | 입력 크기에 따른 시간과 메모리 증가량을 표현합니다. |
| 배열 | 임의 접근이 빠르지만 중간 삽입·삭제가 비쌉니다. |
| 연결 리스트 | 삽입·삭제는 유리할 수 있지만 임의 접근이 느립니다. |
| Stack | LIFO 구조로 함수 호출, undo, 괄호 검사에 사용됩니다. |
| Hash Table | 평균 O(1) 조회를 제공하지만 충돌과 resize를 고려해야 합니다. |
| Tree/Graph | 계층, 연결, 경로 탐색을 표현합니다. |
| BFS/DFS | 그래프와 트리를 너비/깊이 우선으로 탐색합니다. |

## 시간/공간 복잡도

| 표기 | 의미 | 예 |
| --- | --- | --- |
| O(1) | 입력 크기와 무관 | 배열 index 접근 |
| O(log n) | 절반씩 줄어듦 | 이진 탐색 |
| O(n) | 전체 한 번 순회 | 선형 탐색 |
| O(n log n) | 효율적 정렬 | merge sort |
| O(n²) | 이중 반복 | 단순 비교 정렬 |

면접 포인트:

- 최악, 평균, 최선 복잡도를 구분합니다.
- 시간 복잡도만 보지 말고 메모리 사용량도 함께 봅니다.

## 배열과 리스트

| 구분 | 배열/ArrayList | LinkedList |
| --- | --- | --- |
| 메모리 | 연속 | 노드가 포인터로 연결 |
| 임의 접근 | O(1) | O(n) |
| 중간 삽입/삭제 | O(n) | 위치를 알면 O(1) |
| 캐시 지역성 | 좋음 | 상대적으로 나쁨 |

주의:

- `LinkedList`는 삽입/삭제가 항상 빠른 것이 아닙니다. 삽입 위치를 찾는 비용이 필요합니다.
- 대부분의 단순 목록 처리에서는 `ArrayList`가 캐시 효율 때문에 더 유리한 경우가 많습니다.

## Stack과 Queue

| 구조 | 원칙 | 사용 |
| --- | --- | --- |
| Stack | LIFO | 함수 호출, undo, 괄호 검사 |
| Queue | FIFO | 작업 대기열, BFS |
| Deque | 양방향 삽입/삭제 | Stack/Queue 대체 |

## Hash Table

Hash Table은 key를 hash function으로 bucket에 매핑합니다.

장점:

- 평균 O(1) 조회/삽입/삭제

주의:

- hash collision이 발생할 수 있습니다.
- load factor가 높아지면 resize와 rehash가 발생합니다.
- hashCode와 equals 계약이 중요합니다.

충돌 해결:

| 방식 | 설명 |
| --- | --- |
| Separate Chaining | bucket에 linked list/tree 저장 |
| Open Addressing | 다른 빈 bucket을 찾아 저장 |

## Tree와 Graph

| 구조 | 설명 |
| --- | --- |
| Tree | cycle이 없는 계층 구조 |
| Binary Tree | 각 노드가 최대 두 자식 |
| Trie | 문자열 prefix 탐색에 강한 트리 |
| Graph | 정점과 간선으로 관계 표현 |

Graph 표현:

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| 인접 행렬 | 간선 존재 확인 빠름 | 메모리 O(V²) |
| 인접 리스트 | 희소 그래프에 효율적 | 간선 존재 확인은 느릴 수 있음 |

## BFS와 DFS

| 구분 | BFS | DFS |
| --- | --- | --- |
| 자료구조 | Queue | Stack/재귀 |
| 탐색 | 가까운 노드부터 | 깊게 들어감 |
| 사용 | 최단 거리, level 탐색 | 경로 탐색, backtracking |

주의:

- 재귀 DFS는 call stack overflow를 고려합니다.
- BFS는 큐에 많은 노드가 쌓이면 메모리를 많이 쓸 수 있습니다.

## 정렬과 탐색

| 알고리즘 | 평균 | 특징 |
| --- | --- | --- |
| Bubble/Selection/Insertion | O(n²) | 단순하지만 큰 입력에 부적합 |
| Merge Sort | O(n log n) | 안정 정렬, 추가 메모리 필요 |
| Quick Sort | O(n log n) 평균 | pivot에 따라 최악 O(n²) |
| Heap Sort | O(n log n) | 추가 메모리 적음 |

이진 탐색 조건:

- 데이터가 정렬되어 있어야 합니다.
- 탐색 범위를 절반씩 줄입니다.
- O(log n)입니다.
