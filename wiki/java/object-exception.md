# Java: 객체 설계와 예외

← [Java 개요](README.md)

### 객체 비교와 복사

#### Object 기본 메서드

모든 Java 객체는 `Object`를 상속합니다.

| 메서드 | 의미 | 면접 포인트 |
| --- | --- | --- |
| `equals` | 논리적 동등성 비교 | 재정의 시 `hashCode`도 함께 재정의 |
| `hashCode` | hash 기반 자료구조 bucket 결정 | equals가 true면 hashCode도 같아야 함 |
| `toString` | 문자열 표현 | 로그와 디버깅에 도움 |
| `getClass` | runtime class 조회 | reflection, proxy에서 주의 |
| `clone` | 객체 복사 | 얕은 복사 기본, 사용 주의 |
| `wait/notify` | monitor 기반 스레드 협력 | `synchronized` 안에서 호출 |

#### 동일성 vs 동등성

| 비교 | 연산 | 의미 |
| --- | --- | --- |
| 동일성 | `==` | 같은 객체 참조인가 |
| 동등성 | `equals()` | 논리적으로 같은 값인가 |

`equals()`를 재정의하면 반드시 `hashCode()`도 함께 재정의해야 합니다.

이유:

- `HashMap`, `HashSet`은 먼저 hashCode로 bucket을 찾습니다.
- 이후 equals로 실제 동등성을 확인합니다.
- 둘 중 하나만 재정의하면 중복 판단이 깨질 수 있습니다.

#### 얕은 복사 vs 깊은 복사

| 복사 | 의미 | 주의점 |
| --- | --- | --- |
| 얕은 복사 | 내부 참조 객체를 공유 | 한쪽 변경이 다른 쪽에 영향 |
| 깊은 복사 | 내부 참조 객체까지 새로 생성 | 비용은 크지만 독립성 보장 |

`clone()` 주의:

- `Cloneable`은 marker interface라 복사 정책을 명확히 표현하기 어렵습니다.
- 기본 `Object.clone()`은 얕은 복사입니다.
- 상속 구조에서 복사 생성자나 정적 factory가 더 명확한 경우가 많습니다.

#### 방어적 복사

방어적 복사는 외부에서 받은 가변 객체를 그대로 저장하지 않고 복사해서 보관하는 방식입니다.

사용 시점:

- 생성자에서 가변 인자를 받을 때
- getter에서 내부 컬렉션을 반환할 때

```java
public Lotto(List<LottoNumber> numbers) {
    this.numbers = List.copyOf(numbers);
}
```

주의:

- 컬렉션만 복사하면 내부 원소 객체는 여전히 공유될 수 있습니다.
- 검증 전에 먼저 복사해야 TOCTOU 문제가 줄어듭니다.

### 예외 처리

#### Checked vs Unchecked

| 구분 | Checked Exception | Unchecked Exception |
| --- | --- | --- |
| 처리 강제 | 컴파일러가 강제 | 강제하지 않음 |
| 대표 예 | `IOException`, `SQLException` | `NullPointerException`, `IllegalArgumentException` |
| 사용 기준 | 호출자가 복구 가능 | 프로그래밍 오류 또는 복구 어려움 |

#### Error와 Exception

| 구분 | 의미 |
| --- | --- |
| Error | JVM 수준의 심각한 문제, 일반적으로 복구 대상 아님 |
| Exception | 애플리케이션 실행 중 발생 가능한 예외 상황 |

### Call By Value

Java는 항상 **call by value**입니다.

| 인자 타입 | 전달되는 값 |
| --- | --- |
| primitive | 실제 값의 복사본 |
| reference | 객체 참조값의 복사본 |

핵심:

- 객체 내부 상태는 바뀔 수 있습니다.
- 하지만 파라미터 변수를 새 객체로 바꿔도 호출자의 참조 변수는 바뀌지 않습니다.

```java
void change(Student student) {
    student = new Student(); // 호출자의 student 참조는 바뀌지 않음
}
```
