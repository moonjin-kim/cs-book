# Java: 문자열과 컬렉션

← [Java 개요](README.md)

### String

| 타입 | 가변성 | 스레드 안전성 | 사용 상황 |
| --- | --- | --- | --- |
| `String` | 불변 | 안전 | 문자열 변경이 적을 때 |
| `StringBuilder` | 가변 | 안전하지 않음 | 단일 스레드 문자열 조합 |
| `StringBuffer` | 가변 | 안전 | 여러 스레드가 공유하는 문자열 조합 |

핵심 포인트:

- `String`은 불변 객체라 공유해도 안전합니다.
- 문자열 리터럴은 String Constant Pool에 저장됩니다.
- `new String("abc")`는 새 객체를 만들 수 있으므로 리터럴과 `==` 비교 결과가 다를 수 있습니다.
- 반복문에서 문자열을 계속 `+`로 연결하면 불필요한 객체가 많이 생길 수 있습니다.
- 문자열 값 비교는 항상 `equals()`를 사용합니다.

### Collection

#### List, Set, Map

| 구조 | 특징 | 대표 구현체 |
| --- | --- | --- |
| List | 순서 보장, 중복 허용 | `ArrayList`, `LinkedList` |
| Set | 중복 불가 | `HashSet`, `TreeSet`, `LinkedHashSet` |
| Map | key-value 저장 | `HashMap`, `TreeMap`, `ConcurrentHashMap` |

#### 구현체 선택 기준

| 구현체 | 평균 조회 | 삽입/삭제 | 순서 | 면접 포인트 |
| --- | --- | --- | --- | --- |
| `ArrayList` | index 조회 O(1) | 중간 삽입/삭제 O(n) | 입력 순서 | 대부분의 List 기본 선택 |
| `LinkedList` | index 조회 O(n) | 노드 위치를 알면 O(1) | 입력 순서 | 캐시 친화성이 낮아 실무 기본 선택은 아님 |
| `HashSet` | O(1) | O(1) | 보장 안 함 | `hashCode`/`equals` 품질 중요 |
| `LinkedHashSet` | O(1) | O(1) | 입력 순서 | 순서가 필요한 중복 제거 |
| `TreeSet` | O(log n) | O(log n) | 정렬 순서 | `Comparable`/`Comparator` 필요 |
| `HashMap` | O(1) | O(1) | 보장 안 함 | 충돌, resize, load factor 설명 |
| `LinkedHashMap` | O(1) | O(1) | 입력 또는 접근 순서 | LRU cache 구현에 활용 가능 |
| `TreeMap` | O(log n) | O(log n) | key 정렬 순서 | range query에 유리 |

`ArrayList`와 `LinkedList` 비교에서 자주 틀리는 지점:

- `LinkedList`의 삽입/삭제 O(1)은 **이미 노드 위치를 알고 있을 때**입니다.
- 특정 index를 찾아야 하면 탐색 O(n)이 먼저 듭니다.
- `ArrayList`는 연속 배열이라 CPU cache locality가 좋아 실제 순회 성능이 좋은 경우가 많습니다.

#### 초기 용량

`ArrayList`와 `HashMap`은 내부 배열이 가득 차면 resize를 수행합니다.

```java
int expectedSize = 5_000_000;
List<String> values = new ArrayList<>(expectedSize);
```

`HashMap`은 다음 기준으로 resize 시점을 계산합니다.

```text
threshold = capacity * loadFactor
```

예를 들어 기본 capacity 16, load factor 0.75라면 threshold는 12입니다.

#### HashMap vs ConcurrentHashMap

| 항목 | HashMap | ConcurrentHashMap |
| --- | --- | --- |
| 스레드 안전성 | 안전하지 않음 | 안전함 |
| null key/value | 허용 | 허용하지 않음 |
| 주요 용도 | 단일 스레드, 읽기 전용 공유 | 멀티스레드 읽기/쓰기 |
| 복합 연산 | 직접 동기화 필요 | `compute`, `merge`, `putIfAbsent` 제공 |

주의할 점:

- `ConcurrentHashMap`도 `get()` 후 `put()`을 따로 호출하면 원자적이지 않습니다.
- 원자적 갱신이 필요하면 `computeIfAbsent`, `compute`, `merge`를 사용합니다.

#### HashMap 내부 동작

`HashMap`은 key의 hash 값을 이용해 bucket 위치를 찾고, 같은 bucket 안에서는 key 동등성을 확인합니다.

```text
key -> hashCode -> bucket index -> equals로 실제 key 비교
```

핵심:

- 평균적으로 조회/삽입은 O(1)입니다.
- hash 충돌이 심하면 한 bucket에 원소가 몰려 성능이 나빠집니다.
- Java 8 이후에는 충돌 bucket이 커지면 linked list가 red-black tree로 바뀔 수 있습니다.
- resize는 새 table을 만들고 기존 entry를 재배치하므로 비용이 큽니다.

좋은 key 조건:

- `equals()`와 `hashCode()` 계약을 지킵니다.
- key로 사용하는 동안 값이 바뀌지 않습니다.
- hash 분포가 한쪽으로 몰리지 않습니다.

`HashMap` key를 mutable 객체로 만들면 위험합니다.

```java
Map<UserKey, String> map = new HashMap<>();
UserKey key = new UserKey("u1");
map.put(key, "A");

key.changeId("u2");
map.get(key); // hash 위치가 달라져 못 찾을 수 있음
```

#### Fail-fast와 Fail-safe

Java collection iterator는 순회 중 구조 변경을 감지하면 `ConcurrentModificationException`을 던질 수 있습니다.

| 구분 | 예 | 특징 |
| --- | --- | --- |
| Fail-fast | `ArrayList`, `HashMap` iterator | 빠르게 오류를 드러내지만 동시성 보장 장치는 아님 |
| Fail-safe / weakly consistent | `ConcurrentHashMap` iterator | 순회 중 변경을 허용하되 최신 상태 전체를 보장하지 않을 수 있음 |

주의:

- fail-fast는 버그 탐지에 가깝고, 멀티스레드 안전성을 제공하지 않습니다.
- 순회 중 삭제가 필요하면 iterator의 `remove()` 또는 별도 수집 후 삭제를 사용합니다.

#### 불변 컬렉션

`List.of`, `Set.of`, `Map.of`, `List.copyOf`는 수정 불가능한 컬렉션을 만듭니다.

장점:

- 외부 변경으로 내부 상태가 깨지는 일을 줄입니다.
- DTO, VO, 설정값 전달에 적합합니다.
- thread-safe 설계가 쉬워집니다.

주의:

- 컬렉션 자체만 불변이고 내부 원소 객체가 가변이면 deep immutability는 아닙니다.
- `Collections.unmodifiableList(list)`는 원본 list가 바뀌면 view도 영향을 받습니다.
- 방어적 복사에는 `List.copyOf(input)`처럼 새 불변 컬렉션을 만드는 방식이 더 명확합니다.
