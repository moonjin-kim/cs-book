# Java: 런타임과 메모리

← [Java 개요](README.md)

### 버전과 LTS 선택

Java는 6개월 주기로 feature release를 내고, 일부 버전은 LTS로 장기 지원됩니다.

| 버전 | 성격 | 실무 포인트 |
| --- | --- | --- |
| Java 17 | LTS | Spring Boot 3 초기 기준선으로 많이 쓰이며, sealed class가 정식 기능입니다. |
| Java 21 | LTS | virtual thread, pattern matching for switch, record pattern이 정식 기능입니다. |
| Java 25 | LTS | 2025-09-16 GA. Scoped Value가 정식 기능이고, 21 이후의 개선을 새 LTS 기준선으로 묶습니다. |
| Java 26 | non-LTS | 2026-03-17 GA된 단기 release입니다. 운영 표준보다는 기능 검증에 적합합니다. |

선택 기준:

- 운영 안정성과 라이브러리 호환성이 중요하면 LTS를 우선합니다.
- 신규 서버 프로젝트는 프레임워크 지원 여부를 확인한 뒤 Java 21 또는 25를 검토합니다.
- non-LTS는 다음 release가 나오면 빠르게 supersede되므로 장기 운영 기준선으로 잡기 어렵습니다.
- Oracle JDK, Eclipse Temurin, Amazon Corretto 같은 배포판마다 업데이트 정책과 지원 기간이 다를 수 있습니다.

### JVM 실행 흐름

1. `.java` 파일을 `javac`가 `.class` bytecode로 컴파일합니다.
2. ClassLoader가 필요한 클래스를 로딩합니다.
3. JVM은 loading, linking, initialization을 거쳐 클래스를 사용할 수 있게 만듭니다.
4. 처음에는 interpreter가 실행하고, 자주 실행되는 코드는 JIT compiler가 native code로 최적화합니다.

### Class Loading

클래스는 처음부터 모두 로딩되지 않고, 실제 사용 시점에 필요한 클래스가 로딩됩니다.

| 단계 | 의미 | 면접 포인트 |
| --- | --- | --- |
| Loading | `.class` bytecode를 읽어 JVM 내부의 Class 객체로 만듦 | ClassLoader가 담당 |
| Verification | bytecode가 JVM 규칙을 위반하지 않는지 검증 | 잘못된 bytecode 실행 방지 |
| Preparation | static 필드에 기본값 할당 | 명시적 초기값은 아직 아님 |
| Resolution | symbolic reference를 direct reference로 변환 | lazy하게 일어날 수 있음 |
| Initialization | static initializer와 static 필드 초기화 실행 | 코드에 작성한 초기값 반영 |

ClassLoader 계층:

| ClassLoader | 역할 |
| --- | --- |
| Bootstrap ClassLoader | 핵심 Java runtime class 로딩 |
| Platform ClassLoader | Java platform module/class 로딩 |
| Application ClassLoader | application classpath/module path 로딩 |
| Custom ClassLoader | WAS, plugin, agent, hot reload 등 특수 로딩 |

Delegation model:

- 먼저 부모 ClassLoader에게 로딩을 위임합니다.
- 부모가 찾지 못하면 자식 ClassLoader가 직접 로딩합니다.
- 핵심 Java class를 애플리케이션이 임의로 바꾸는 위험을 줄입니다.
- 같은 이름의 클래스라도 ClassLoader가 다르면 JVM에서는 다른 타입으로 취급될 수 있습니다.

### 클래스 초기화 순서

초기화 순서는 면접에서 static, 상속, 생성자 질문으로 자주 나옵니다.

1. 부모 클래스 static 필드와 static block
2. 자식 클래스 static 필드와 static block
3. 부모 클래스 instance 필드와 instance initializer
4. 부모 생성자
5. 자식 클래스 instance 필드와 instance initializer
6. 자식 생성자

주의:

- static 초기화는 클래스별로 한 번만 실행됩니다.
- instance 초기화와 생성자는 객체를 만들 때마다 실행됩니다.
- 생성자에서 override 가능한 메서드를 호출하면 자식 필드 초기화 전 상태를 볼 수 있어 위험합니다.

### Interpreter, JIT, AOT

JVM은 bytecode를 곧바로 기계어 파일로 고정하지 않고 실행 중 정보를 이용해 최적화합니다.

| 방식 | 설명 | 장단점 |
| --- | --- | --- |
| Interpreter | bytecode를 한 줄씩 해석 실행 | 시작은 빠르지만 반복 실행은 느릴 수 있음 |
| JIT Compiler | 자주 실행되는 hot code를 native code로 컴파일 | warm-up 이후 성능 향상 |
| AOT / Native Image | 실행 전에 native binary로 컴파일 | 빠른 시작과 작은 런타임을 기대할 수 있지만 reflection/dynamic proxy 제약 검토 필요 |

JIT 최적화 예:

- method inlining
- escape analysis
- lock elision
- dead code elimination
- loop optimization

실무 포인트:

- Java 서버는 warm-up 전후 성능이 다를 수 있습니다.
- 벤치마크는 JIT warm-up, GC, dead code elimination을 통제해야 의미가 있습니다.
- `final`, 불변 객체, 작은 메서드는 JIT가 최적화하기 좋은 힌트가 될 수 있지만 무조건 빠르다고 단정하면 안 됩니다.

### JVM 메모리 구조

| 영역 | 공유 여부 | 저장 내용 | 면접 포인트 |
| --- | --- | --- | --- |
| Method Area / Metaspace | 공유 | 클래스 메타데이터, 상수 풀, static 변수 | JDK 8부터 PermGen이 Metaspace로 대체 |
| Heap | 공유 | 객체, 배열 | GC 주요 대상 |
| Stack | 스레드별 | 지역 변수, 인자, operand stack, frame | 지역 변수는 기본적으로 스레드 독립 |
| PC Register | 스레드별 | 현재 실행 중인 JVM 명령 위치 | 스레드마다 존재 |
| Native Method Stack | 스레드별 | JNI 네이티브 메서드 실행 정보 | C/C++ native call 처리 |

주의할 점:

- 지역 변수는 Stack에 있어 스레드 간 공유되지 않습니다.
- 객체 필드는 Heap에 있으므로 여러 스레드가 같은 객체를 공유하면 동기화가 필요할 수 있습니다.
- `static` 필드는 클래스 단위 공유 상태라 동시성, 테스트 격리에 주의해야 합니다.
