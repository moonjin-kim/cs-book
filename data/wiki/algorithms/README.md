# 자료구조와 알고리즘

자료구조와 알고리즘은 문제를 어떤 형태로 저장하고 어느 정도 비용으로 해결할지 판단하는 언어입니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| 복잡도 | Big-O는 최악, 평균, 상수 비용을 어떻게 다르게 숨기는가? |
| 배열/리스트 | 임의 접근과 삽입/삭제 비용은 왜 반대로 움직이는가? |
| 연결 리스트 | 탐색은 왜 O(n)이고, 위치를 알 때 삽입/삭제는 왜 O(1)인가? |
| Stack | LIFO 구조가 어떤 문제에 적합한가? |
| 해시 테이블 | 충돌, load factor, resizing은 성능에 어떤 영향을 주는가? |
| 이진 트리 | 포화, 완전, 편향 이진 트리는 높이와 성능이 어떻게 다른가? |
| Trie | 문자열 prefix 탐색을 왜 빠르게 할 수 있는가? |
| BFS/DFS | 최단 거리, 연결성, 위상 관계를 어떻게 탐색하는가? |

## 시간 복잡도와 공간 복잡도

시간 복잡도는 입력 크기에 따라 알고리즘이 수행해야 하는 연산 수가 어떻게 증가하는지를 표현합니다. 실제 실행 시간은 하드웨어, JVM, 캐시, 입력 분포에 영향을 받으므로, 알고리즘 자체의 증가율을 비교하기 위해 연산 수를 추상화합니다.

공간 복잡도는 입력 크기에 따라 추가로 필요한 메모리 사용량이 어떻게 증가하는지를 표현합니다.

Big-O 표기법은 입력이 커질수록 지배적인 증가율만 남기는 점근적 표기입니다.

```java
// O(n)
for (int i = 0; i < n; i++) { }

// 계수는 무시하므로 O(n)
for (int i = 0; i < n * 5; i++) { }

// n과 m이 독립 입력이면 O(n + m)
for (int i = 0; i < n; i++) { }
for (int j = 0; j < m; j++) { }

// 중첩 반복은 O(n^2)
for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) { }
}
```

## 연결 리스트

연결 리스트는 노드들이 포인터로 연결된 선형 자료구조입니다. 각 노드는 데이터와 다음 노드에 대한 참조를 가집니다. 첫 노드는 head, 마지막 노드는 tail이라고 부릅니다.

배열은 메모리에 연속적으로 배치되어 임의 접근이 빠르지만, 중간 삽입/삭제 시 뒤 요소 이동 비용이 큽니다. 연결 리스트는 노드가 메모리 여기저기에 흩어질 수 있어 임의 접근은 느리지만, 삽입/삭제할 위치의 이전 노드를 알고 있다면 포인터만 바꾸면 됩니다.

| 연산 | 시간 복잡도 | 설명 |
| --- | --- | --- |
| 탐색 | O(n) | head부터 다음 포인터를 따라가야 함 |
| 위치를 아는 삽입 | O(1) | 이전 노드와 새 노드의 포인터만 변경 |
| 위치를 아는 삭제 | O(1) | 이전 노드가 삭제 대상의 다음 노드를 가리키게 함 |
| 값을 찾아 삭제 | O(n) | 삭제 전 탐색이 필요 |

```java
class SinglyLinkedList {
    Node head;
    Node tail;

    Node insert(int value) {
        Node newNode = new Node(value);
        if (head == null) {
            head = newNode;
        } else {
            tail.next = newNode;
        }
        tail = newNode;
        return newNode;
    }

    Node find(int value) {
        Node current = head;
        while (current != null && current.value != value) {
            current = current.next;
        }
        return current;
    }

    void appendNext(Node prevNode, int value) {
        Node newNode = new Node(value);
        newNode.next = prevNode.next;
        prevNode.next = newNode;
    }

    void deleteNext(Node prevNode) {
        if (prevNode.next != null) {
            prevNode.next = prevNode.next.next;
        }
    }

    static class Node {
        int value;
        Node next;

        Node(int value) {
            this.value = value;
        }
    }
}
```

## Stack

Stack은 후입선출(LIFO, Last In First Out) 원칙을 따르는 자료구조입니다. 삽입은 push, 삭제는 pop이라고 하며 가장 위(top)에서만 일어납니다.

대표 활용 사례는 함수 호출 stack, 브라우저 뒤로가기, undo, 수식 괄호 검사입니다. 빈 stack에서 pop하면 stack underflow, stack 용량을 넘으면 stack overflow라고 합니다.

Java에는 `Stack` 클래스가 있지만, 보통 `Deque` 구현체를 stack처럼 사용하는 것이 권장됩니다. `Stack`은 `Vector`를 상속해 index 기반 접근이 가능하고, LIFO 추상화가 흐려집니다. 또한 `Vector`의 synchronized 비용이 단일 스레드 환경에서 불필요할 수 있습니다.

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);
stack.push(2);
int top = stack.pop();
```

## 해시 테이블과 해시 충돌

해시 테이블은 key를 hash function에 넣어 얻은 값을 bucket 위치로 사용합니다. 평균적으로 O(1)에 조회할 수 있지만, 서로 다른 key가 같은 bucket에 매핑되는 hash collision이 발생할 수 있습니다.

충돌 완화 방법은 크게 두 가지입니다.

| 방법 | 설명 |
| --- | --- |
| Separate Chaining | bucket을 linked list나 tree로 두어 같은 bucket의 값을 연결 |
| Open Addressing | 충돌 시 다른 빈 bucket을 찾아 저장 |

Open Addressing의 탐사 방식:

| 방식 | 설명 | 주의점 |
| --- | --- | --- |
| Linear Probing | 한 칸씩 이동하며 빈 bucket 탐색 | 1차 군집 발생 가능 |
| Quadratic Probing | 이동 폭을 제곱으로 늘리며 탐색 | 2차 군집 발생 가능 |
| Double Hashing | 보조 hash function으로 이동 폭 결정 | 충돌 가능성은 낮지만 계산 비용 증가 |

## Load Factor와 Threshold

Load factor는 자료구조가 얼마나 채워졌는지 나타내는 비율입니다. HashMap 같은 가변 크기 자료구조는 `capacity * loadFactor`로 threshold를 계산하고, 원소 수가 threshold를 넘으면 resize와 rehash를 수행합니다.

예를 들어 Java HashMap의 기본 초기 capacity는 16이고 기본 load factor는 0.75입니다. threshold는 `16 * 0.75 = 12`입니다. 원소 수가 12를 넘으면 내부 배열을 늘리고 기존 entry를 다시 배치합니다.

ArrayList도 내부 배열이 가득 차면 resize가 발생합니다. Java ArrayList는 기본적으로 원소 추가 과정에서 용량이 부족해지면 기존 capacity의 약 1.5배로 증가합니다. 대량 원소 수를 미리 알고 있다면 초기 용량을 지정해 resize와 배열 복사 비용, 불필요한 메모리 증가를 줄일 수 있습니다.

```java
int max = 5_000_000;
List<String> values = new ArrayList<>(max);
```

## 이진 트리

트리는 부모 정점 아래에 자식 정점이 연결되는 재귀적 자료구조입니다. 이진 트리는 각 정점이 최대 두 개의 자식 정점을 가지는 트리입니다.

대표 형태:

| 종류 | 설명 |
| --- | --- |
| 포화 이진 트리 | 마지막 level까지 모든 정점이 채워진 트리 |
| 완전 이진 트리 | 마지막 level을 제외한 모든 level이 채워지고, 마지막 level은 왼쪽부터 채워진 트리 |
| 편향 이진 트리 | 한 방향으로만 정점이 이어지는 트리 |

특징:

- 정점이 N개인 이진 트리는 최악의 경우 높이가 N - 1이 될 수 있습니다.
- 포화/완전 이진 트리의 높이는 O(log N)입니다.
- 높이가 h인 포화 이진 트리는 `2^(h + 1) - 1`개의 정점을 가집니다.

이진 트리는 heap, binary search tree 같은 자료구조의 기반입니다.

## 이진 트리 순회

| 순회 | 방문 순서 | 활용 |
| --- | --- | --- |
| In-order | left → root → right | BST에서 정렬 순서 출력 |
| Pre-order | root → left → right | tree 복사, prefix 표현 |
| Post-order | left → right → root | tree 삭제, postfix 표현 |
| Level-order | level 순서 | BFS, 최단 거리 성격 탐색 |

## Trie

Trie는 문자열을 문자 단위 경로로 저장하는 트리형 자료구조입니다. root는 비어 있고, 각 간선 또는 다음 노드는 문자를 나타냅니다. prefix를 공유하는 문자열들이 같은 경로를 공유하므로 검색어 자동완성, 사전 검색, prefix matching에 적합합니다.

장점은 문자열을 하나씩 비교하는 방식보다 prefix 탐색을 효율적으로 할 수 있다는 점입니다. 단점은 각 노드가 자식 링크를 저장해야 하므로 메모리를 많이 사용할 수 있다는 점입니다.

```java
class Trie {
    private final Node root = new Node();

    void insert(String word) {
        Node current = root;
        for (char ch : word.toCharArray()) {
            current = current.children.computeIfAbsent(ch, key -> new Node());
        }
        current.word = true;
    }

    boolean contains(String word) {
        Node node = find(word);
        return node != null && node.word;
    }

    boolean startsWith(String prefix) {
        return find(prefix) != null;
    }

    private Node find(String text) {
        Node current = root;
        for (char ch : text.toCharArray()) {
            current = current.children.get(ch);
            if (current == null) return null;
        }
        return current;
    }

    static class Node {
        Map<Character, Node> children = new HashMap<>();
        boolean word;
    }
}
```

## 실무 판단

- 자료구조 선택은 평균 시간 복잡도뿐 아니라 메모리, 순서, 동시성, 데이터 크기를 같이 봅니다.
- 알고리즘 문제 풀이보다 중요한 것은 현재 병목이 어떤 복잡도에서 오는지 설명하는 능력입니다.
- Java Collection은 예상 원소 수를 알면 초기 용량을 지정해 resize 비용을 줄일 수 있습니다.
