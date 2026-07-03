# 자료구조와 알고리즘

자료구조와 알고리즘 면접은 **문제를 어떤 구조로 표현하고, 시간·공간 복잡도를 어떤 trade-off로 선택하는지**를 설명하는 것이 핵심입니다.

처음부터 모든 알고리즘을 외우기보다, 문제를 읽고 **상태 표현 -> 자료구조 선택 -> 탐색/갱신 전략 -> 복잡도 검증** 순서로 말할 수 있어야 합니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | 복잡도와 입력 크기 | 입력 제한을 보고 O(n), O(n log n), O(n²) 중 어떤 풀이가 가능한지 판단할 수 있는가? |
| 2 | 선형 자료구조 | 배열, 리스트, 스택, 큐, 덱을 접근·삽입·삭제·캐시 지역성 관점으로 비교할 수 있는가? |
| 3 | Hash Table | 평균 O(1)이 언제 깨지고, 충돌·load factor·equals/hashCode 계약이 왜 중요한가? |
| 4 | Tree와 Heap | 계층 구조, 우선순위 처리, 균형 트리, heap invariant를 구분할 수 있는가? |
| 5 | Graph와 탐색 | 그래프 표현 방식과 BFS/DFS, 최단 거리, 위상 정렬을 문제 유형에 맞게 고를 수 있는가? |
| 6 | 정렬과 탐색 | 정렬 안정성, in-place 여부, binary search의 조건과 경계 처리를 설명할 수 있는가? |
| 7 | 문제 해결 패턴 | two pointer, sliding window, prefix sum, greedy, dynamic programming을 언제 쓰는지 구분할 수 있는가? |
| 8 | 실전 면접 Q&A | 짧은 답변으로 자료구조 선택 이유와 복잡도를 방어할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| 복잡도 | 입력 크기에 따른 시간과 메모리 증가량을 표현합니다. |
| 배열 | 임의 접근이 빠르지만 중간 삽입·삭제가 비쌉니다. |
| 연결 리스트 | 삽입·삭제는 유리할 수 있지만 임의 접근이 느립니다. |
| Stack | LIFO 구조로 함수 호출, undo, 괄호 검사에 사용됩니다. |
| Queue/Deque | FIFO 또는 양끝 삽입·삭제로 BFS, monotonic queue, 캐시 처리에 사용됩니다. |
| Hash Table | 평균 O(1) 조회를 제공하지만 충돌과 resize를 고려해야 합니다. |
| Heap | 최솟값/최댓값을 빠르게 꺼내는 완전 이진 트리 기반 우선순위 큐입니다. |
| Tree/Graph | 계층, 연결, 경로 탐색, 의존 관계를 표현합니다. |
| BFS/DFS | 그래프와 트리를 너비/깊이 우선으로 탐색하며 최단 거리와 백트래킹에 자주 쓰입니다. |
| Greedy | 매 단계의 최선 선택이 전체 최적해로 이어진다는 증명이 필요합니다. |
| DP | 중복 부분 문제와 최적 부분 구조가 있을 때 상태와 점화식을 세웁니다. |

## 면접 답변 프레임

알고리즘 질문은 정답 코드보다 **선택 근거와 검증 과정**이 중요합니다.

1. 문제 모델링: 입력을 배열, 그래프, 구간, 문자열, 상태 공간 중 무엇으로 볼지 정합니다.
2. 제약 확인: `n`, 값 범위, 정렬 여부, 중복 가능성, 메모리 제한을 확인합니다.
3. 자료구조 선택: 조회가 많은지, 순서가 필요한지, 최솟값을 자주 꺼내는지, 구간 합이 필요한지에 맞춥니다.
4. 알고리즘 선택: 완전 탐색에서 시작해 pruning, greedy, DP, graph algorithm으로 개선합니다.
5. 복잡도 검증: 최악 시간, 추가 메모리, recursion depth, overflow 가능성을 말합니다.
6. 경계 조건: 빈 입력, 원소 1개, 중복, 음수, cycle, disconnected graph를 확인합니다.

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
- 입력 제한으로 가능한 풀이를 역산합니다. 예를 들어 `n = 100,000`이면 O(n²)은 대체로 위험합니다.
- Big-O는 상수와 하위항을 제거하지만, 실무에서는 cache miss, allocation, I/O 비용도 성능에 영향을 줍니다.
- recursive algorithm은 call stack 공간도 공간 복잡도에 포함해 설명합니다.

### 입력 크기로 풀이 가늠하기

대략적인 감각:

| 입력 크기 | 보통 가능한 접근 |
| --- | --- |
| `n <= 20` | bitmask, backtracking, 완전 탐색 |
| `n <= 500` | O(n³) DP나 Floyd-Warshall 검토 |
| `n <= 5,000` | O(n²) 가능 여부 검토 |
| `n <= 100,000` | O(n log n), O(n), hash, heap, graph traversal |
| `n >= 1,000,000` | O(n) 또는 streaming, 메모리 사용량까지 엄격히 확인 |

주의:

- 제한 시간, 언어, I/O 방식에 따라 실제 가능 범위는 달라집니다.
- 숫자 범위가 크면 `int` overflow를 확인합니다.
- `n`은 작아도 상태 수가 `n * m * k`로 커질 수 있습니다.

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
- 배열은 연속 메모리라 CPU cache prefetch에 유리합니다.
- 동적 배열은 용량이 부족하면 더 큰 배열을 만들고 복사합니다. 이때 한 번의 삽입은 O(n)이지만 amortized O(1)로 설명합니다.

### 배열을 고르는 경우

- index 기반 접근이 많습니다.
- 정렬, binary search, prefix sum처럼 위치가 의미를 가집니다.
- primitive 배열처럼 메모리 배치를 조밀하게 가져가고 싶습니다.

### 연결 리스트를 고르는 경우

- 이미 노드 참조를 알고 있고 중간 삽입·삭제가 많습니다.
- iterator를 유지하면서 splice가 필요한 구조입니다.
- 다만 일반적인 코딩 테스트와 서버 애플리케이션에서는 배열 기반 구조가 더 단순하고 빠른 경우가 많습니다.

## Stack과 Queue

| 구조 | 원칙 | 사용 |
| --- | --- | --- |
| Stack | LIFO | 함수 호출, undo, 괄호 검사 |
| Queue | FIFO | 작업 대기열, BFS |
| Deque | 양방향 삽입/삭제 | Stack/Queue 대체 |

Stack 예시:

- 괄호 유효성 검사
- monotonic stack으로 다음 큰 값 찾기
- DFS iterative 구현
- expression parsing

Queue 예시:

- BFS level traversal
- producer-consumer buffer
- rate limiting queue
- cache eviction 후보 관리

Deque 예시:

- sliding window maximum에서 monotonic deque 사용
- 양방향 BFS
- undo/redo history 일부 구현

## Hash Table

Hash Table은 key를 hash function으로 bucket에 매핑합니다.

장점:

- 평균 O(1) 조회/삽입/삭제

주의:

- hash collision이 발생할 수 있습니다.
- load factor가 높아지면 resize와 rehash가 발생합니다.
- hashCode와 equals 계약이 중요합니다.
- key가 mutable이면 저장 후 hash 값이 바뀌어 조회가 깨질 수 있습니다.
- 최악의 경우 충돌이 몰리면 O(n)이 될 수 있어 충돌 대응 전략이 필요합니다.

충돌 해결:

| 방식 | 설명 | 고려점 |
| --- | --- | --- |
| Separate Chaining | bucket에 linked list/tree 저장 | bucket 내부 구조가 길어지면 성능 저하 |
| Open Addressing | 다른 빈 bucket을 찾아 저장 | 삭제 처리와 clustering을 주의 |

### HashMap 면접 포인트

- 평균 O(1)은 좋은 hash function과 적절한 load factor를 가정합니다.
- resize는 전체 bucket 재배치가 필요해 순간 비용이 큽니다.
- Java의 `HashMap`은 충돌 bucket이 길어지면 tree 구조로 전환할 수 있습니다.
- `equals()`가 true인 두 객체는 반드시 같은 `hashCode()`를 가져야 합니다.
- `hashCode()`가 같다고 `equals()`가 true일 필요는 없습니다.

## Tree와 Graph

| 구조 | 설명 |
| --- | --- |
| Tree | cycle이 없는 계층 구조 |
| Binary Tree | 각 노드가 최대 두 자식 |
| Binary Search Tree | 왼쪽은 작고 오른쪽은 큰 순서 invariant를 유지 |
| Heap | 부모가 자식보다 우선순위가 높다는 heap invariant를 유지 |
| Trie | 문자열 prefix 탐색에 강한 트리 |
| Graph | 정점과 간선으로 관계 표현 |

### Tree 기본 용어

| 용어 | 의미 |
| --- | --- |
| Root | 부모가 없는 최상위 노드 |
| Leaf | 자식이 없는 노드 |
| Depth | root에서 해당 노드까지의 간선 수 |
| Height | 해당 노드에서 가장 먼 leaf까지의 간선 수 |
| Balanced | 높이가 과도하게 한쪽으로 치우치지 않은 상태 |

### Binary Search Tree

BST는 정렬된 데이터를 tree 형태로 저장해 평균 O(log n) 탐색을 기대합니다.

주의:

- 삽입 순서가 정렬되어 있으면 한쪽으로 치우쳐 O(n)이 됩니다.
- AVL Tree, Red-Black Tree 같은 균형 트리는 회전으로 높이를 제한합니다.
- 범위 검색, 정렬 순회, predecessor/successor 조회에 유리합니다.

### Heap과 Priority Queue

Heap은 전체 정렬을 유지하지 않고, root에 최우선 원소가 오도록 유지합니다.

| 연산 | 복잡도 |
| --- | --- |
| peek | O(1) |
| push | O(log n) |
| pop | O(log n) |
| heapify | O(n) |

사용:

- 작업 스케줄링
- top K
- Dijkstra 최단 거리
- merge k sorted lists

Graph 표현:

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| 인접 행렬 | 간선 존재 확인 빠름 | 메모리 O(V²) |
| 인접 리스트 | 희소 그래프에 효율적 | 간선 존재 확인은 느릴 수 있음 |

그래프 질문에서 먼저 확인할 것:

- directed인지 undirected인지
- weighted인지 unweighted인지
- cycle이 가능한지
- connected인지 disconnected인지
- node 수 `V`, edge 수 `E`가 어느 정도인지

## BFS와 DFS

| 구분 | BFS | DFS |
| --- | --- | --- |
| 자료구조 | Queue | Stack/재귀 |
| 탐색 | 가까운 노드부터 | 깊게 들어감 |
| 사용 | 최단 거리, level 탐색 | 경로 탐색, backtracking |

주의:

- 재귀 DFS는 call stack overflow를 고려합니다.
- BFS는 큐에 많은 노드가 쌓이면 메모리를 많이 쓸 수 있습니다.
- 방문 처리를 언제 하는지 중요합니다. 일반적으로 queue에 넣을 때 방문 처리해야 중복 enqueue를 줄입니다.
- disconnected graph라면 모든 정점을 시작점 후보로 순회해야 합니다.

### BFS를 고르는 경우

- unweighted graph의 최단 거리
- level order traversal
- 최소 횟수 문제
- 시작점이 여러 개인 multi-source BFS

### DFS를 고르는 경우

- 모든 경로 탐색
- cycle detection
- connected component
- topological sort
- backtracking

### Topological Sort

위상 정렬은 DAG에서 의존 순서를 구합니다.

대표 방식:

- indegree가 0인 정점을 queue에 넣는 Kahn algorithm
- DFS finish order를 이용하는 방식

주의:

- cycle이 있으면 모든 정점을 정렬할 수 없습니다.
- 작업 순서, 선수 과목, 빌드 의존성 문제에 자주 나옵니다.

## 정렬과 탐색

| 알고리즘 | 평균 | 안정성 | 추가 공간 | 특징 |
| --- | --- | --- | --- | --- |
| Bubble/Selection/Insertion | O(n²) | 일부 안정 | O(1) | 단순하지만 큰 입력에 부적합 |
| Merge Sort | O(n log n) | 안정 | O(n) | linked list나 안정 정렬에 유리 |
| Quick Sort | O(n log n) 평균 | 불안정 | O(log n) 평균 | pivot에 따라 최악 O(n²) |
| Heap Sort | O(n log n) | 불안정 | O(1) | 추가 메모리 적지만 cache locality는 불리 |
| Counting Sort | O(n + k) | 구현에 따라 안정 | O(k) | 값 범위가 작을 때 유리 |

이진 탐색 조건:

- 데이터가 정렬되어 있어야 합니다.
- 탐색 범위를 절반씩 줄입니다.
- O(log n)입니다.

### Binary Search 경계 처리

Binary search는 “정렬된 배열에서 값 찾기”뿐 아니라 **조건을 만족하는 첫 지점/마지막 지점 찾기**로 확장됩니다.

패턴:

```text
left = 가능한 최소값
right = 가능한 최대값
while left < right:
    mid = (left + right) / 2
    if condition(mid):
        right = mid
    else:
        left = mid + 1
```

주의:

- `mid = left + (right - left) / 2`로 overflow를 피합니다.
- `condition(mid)`가 monotonic해야 합니다.
- `lower_bound`, `upper_bound` 차이를 명확히 말합니다.

## 문제 해결 패턴

### Two Pointer

정렬 배열이나 양끝에서 좁혀가는 문제에 사용합니다.

사용 조건:

- 포인터 이동이 답을 놓치지 않는다는 단조성이 있습니다.
- 한쪽 포인터를 움직이면 합, 길이, 조건이 예측 가능하게 변합니다.

예:

- 정렬 배열의 두 수 합
- palindrome 검사
- partition

### Sliding Window

연속 구간을 유지하며 조건을 만족하는 최대/최소 길이, 개수, 합을 구합니다.

사용 조건:

- 구간의 시작과 끝이 한 방향으로만 움직입니다.
- 원소를 추가/제거하면서 상태를 빠르게 갱신할 수 있습니다.

주의:

- 음수가 있으면 합의 단조성이 깨져 단순 window가 안 될 수 있습니다.
- distinct count는 hash map으로 빈도를 관리합니다.

### Prefix Sum

누적 합으로 구간 합을 O(1)에 구합니다.

```text
sum(left, right) = prefix[right + 1] - prefix[left]
```

응용:

- 구간 합
- 2D prefix sum
- 나머지 빈도 기반 subarray count
- difference array로 구간 업데이트 최적화

### Greedy

Greedy는 매 순간의 선택이 전체 최적해로 이어질 때 사용합니다.

증명 방식:

- 교환 논증: 최적해의 일부를 greedy 선택으로 바꿔도 손해가 없음을 보입니다.
- cut property: 특정 경계를 기준으로 안전한 선택임을 보입니다.
- 반례 탐색: 작은 입력에서 greedy가 깨지는지 확인합니다.

대표 문제:

- interval scheduling
- minimum spanning tree
- Huffman coding
- coin change는 화폐 체계에 따라 greedy가 깨질 수 있습니다.

### Dynamic Programming

DP는 중복 부분 문제와 최적 부분 구조가 있을 때 사용합니다.

설계 순서:

1. 상태 정의: `dp[i]`가 정확히 무엇을 의미하는지 문장으로 씁니다.
2. 전이 정의: 이전 상태에서 현재 상태를 어떻게 만드는지 정합니다.
3. 초기값: 가장 작은 상태를 정합니다.
4. 순회 순서: 전이에 필요한 값이 먼저 계산되도록 합니다.
5. 답 위치: 마지막 값인지, 전체 최댓값인지 정합니다.

주의:

- 상태 정의가 애매하면 점화식도 흔들립니다.
- top-down은 구현이 직관적이지만 recursion depth와 memo key 비용을 봅니다.
- bottom-up은 반복 순서가 중요하지만 stack overflow 위험이 적습니다.
- 공간 최적화는 이전 행/이전 값만 필요할 때만 적용합니다.

## 실전 선택 기준

| 문제 신호 | 의심할 접근 |
| --- | --- |
| “가장 짧은 횟수”, “최소 이동” + 가중치 없음 | BFS |
| “최단 거리” + 양수 가중치 | Dijkstra + Priority Queue |
| “의존 순서”, “선수 조건” | Topological Sort |
| “연속 부분 배열” | Sliding Window, Prefix Sum |
| “상위 K개”, “매번 최솟값” | Heap |
| “중복 없이 빠른 조회” | Hash Set/Map |
| “정렬된 데이터에서 경계” | Binary Search |
| “모든 조합/순열” + 작은 n | Backtracking |
| “최대/최소 값” + 선택 반복 | Greedy 또는 DP 검증 |
| “중복 부분 문제” | DP |

## 실전 면접 Q&A

### HashMap 조회가 항상 O(1)인가요?

평균적으로 O(1)이지만 항상은 아닙니다. hash collision이 많거나 load factor가 높으면 bucket 탐색 비용이 증가합니다. resize 시점에는 재해싱 비용도 발생합니다. 좋은 hash function, 적절한 capacity/load factor, immutable key가 중요합니다.

### ArrayList와 LinkedList 중 무엇을 고르겠습니까?

대부분의 임의 접근과 순차 순회에는 ArrayList를 고릅니다. 연속 메모리라 cache locality가 좋고 구현도 단순합니다. LinkedList는 이미 노드 위치를 알고 중간 삽입·삭제가 매우 많을 때만 장점이 있습니다. 위치를 찾는 비용까지 포함하면 삽입·삭제가 항상 O(1)은 아닙니다.

### BFS와 DFS 차이는 무엇인가요?

BFS는 queue로 가까운 노드부터 방문하므로 unweighted graph의 최단 거리에 적합합니다. DFS는 stack 또는 재귀로 깊게 탐색하므로 경로 탐색, cycle detection, backtracking에 적합합니다. BFS는 frontier가 커지면 메모리 사용량이 커지고, 재귀 DFS는 stack overflow를 조심해야 합니다.

### Greedy와 DP를 어떻게 구분하나요?

Greedy는 현재 최선 선택이 미래 선택을 망치지 않는다는 증명이 필요합니다. DP는 선택의 결과가 이후 상태에 영향을 주고 중복 부분 문제가 반복될 때 적합합니다. Greedy로 풀린다고 생각되면 작은 반례를 먼저 찾아보고, 교환 논증이나 cut property로 방어합니다.

### 정렬 알고리즘에서 안정성이 왜 중요한가요?

안정 정렬은 같은 key를 가진 원소의 기존 순서를 유지합니다. 여러 기준으로 정렬하거나, 이미 정렬된 보조 기준을 유지해야 할 때 중요합니다. 예를 들어 가입일로 정렬된 사용자 목록을 등급별로 안정 정렬하면 같은 등급 안에서는 가입일 순서가 유지됩니다.
