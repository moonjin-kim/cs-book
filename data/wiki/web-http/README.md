# Web과 HTTP

Web/HTTP는 브라우저와 서버가 상태 없는 메시지를 주고받으며 사용자 경험과 보안을 구성하는 방식입니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| HTTP 메시지 | method, header, body, status code는 각각 어떤 의미인가? |
| URI/URL/URN | 자원 식별, 위치, 이름은 어떻게 구분되는가? |
| HTTP/1.1과 HTTP/2 | persistent connection, pipelining, multiplexing은 무엇을 해결하는가? |
| REST API | resource 중심 설계와 action 중심 설계는 어떻게 다른가? |
| HTTP 멱등성 | 어떤 메서드는 왜 안전하게 재시도할 수 있는가? |
| Cookie/Session | stateless HTTP에서 로그인 상태는 어떻게 유지되는가? |
| CORS | 브라우저가 cross-origin 요청을 막는 이유와 preflight는 무엇인가? |
| Proxy | forward proxy와 reverse proxy는 어느 쪽을 숨기고 보호하는가? |
| 브라우저 요청 흐름 | URL 입력 후 DNS, TCP/TLS, HTTP, 렌더링은 어떤 순서로 진행되는가? |

## Cookie와 Session

쿠키와 세션은 HTTP의 stateless 특성을 보완해 사용자 상태를 유지하는 방법입니다.

| 기준 | Cookie | Session |
| --- | --- | --- |
| 저장 위치 | 클라이언트 브라우저 | 서버 |
| 전달 방식 | 요청마다 Cookie header로 전송 | session id만 cookie로 전달 |
| 보안성 | 사용자가 접근/수정 가능해 민감 정보 저장에 부적합 | 중요 데이터가 서버에 있어 상대적으로 안전 |
| 용량 | 보통 도메인별 수 KB 수준 | 서버 리소스 한도에 따름 |
| 라이프사이클 | 만료 시간 또는 브라우저 종료까지 | 서버 설정, idle timeout 등에 따름 |
| 성능 영향 | 요청마다 전송되어 트래픽 증가 | 사용자 수가 늘수록 서버 메모리/저장소 부담 증가 |

사용자 선호 설정이나 비로그인 장바구니 같은 비민감 정보는 cookie에 둘 수 있습니다. 로그인 상태나 중요한 사용자 정보는 session에 두는 편이 안전합니다. 최근에는 JWT 같은 token 기반 인증도 많이 사용됩니다.

## URI, URL, URN

URI는 인터넷에서 자원을 식별하기 위한 문자열이며 URL과 URN을 포함하는 상위 개념입니다.

| 용어 | 의미 | 예시 |
| --- | --- | --- |
| URI | 자원을 식별하는 포괄적 식별자 | URL 또는 URN |
| URL | 자원의 위치와 접근 방법을 나타냄 | `https://www.example.com/path` |
| URN | 위치와 무관한 자원의 이름을 나타냄 | `urn:isbn:0451450523` |

## HTTP/1.1과 HTTP/2

HTTP/1.0은 요청/응답마다 TCP connection을 새로 만드는 방식이 일반적이어서 handshake 비용이 컸습니다. HTTP/1.1은 persistent connection으로 timeout 동안 connection을 유지하고 재사용합니다.

HTTP/1.1 pipelining은 여러 요청을 연속으로 보내고 응답을 기다릴 수 있게 했지만, 응답 순서를 지켜야 하므로 앞 요청이 느리면 뒤 요청도 막히는 application layer Head-of-Line Blocking 문제가 있습니다. 또한 매 요청마다 반복 header를 전송하는 비용도 큽니다.

HTTP/2는 HTTP 메시지를 binary frame으로 나누어 전송합니다. 하나의 connection에서 여러 요청/응답 stream을 동시에 처리하는 multiplexing을 지원해 HTTP/1.1 pipelining의 HOL blocking을 완화합니다. 또한 HPACK header compression으로 반복 header 전송 비용을 줄입니다.

## REST API

REST는 Representational State Transfer의 약자로, resource의 표현을 이용해 상태를 주고받는 방식입니다. HTTP URI로 resource를 식별하고, HTTP method로 CRUD 성격의 행위를 표현합니다. 최근에는 resource representation으로 JSON을 많이 사용합니다.

장점:

- client와 server 역할을 명확히 분리합니다.
- HTTP 기반이므로 플랫폼과 도구 호환성이 좋습니다.
- curl, Postman 등으로 테스트하기 쉽습니다.
- JSON은 자기 서술적이고 일부 필드만 읽어도 되므로 하위 호환성 관리가 비교적 쉽습니다.

단점:

- 요청/응답 스타일 통신에 치우쳐 있습니다.
- 복잡한 행위를 HTTP method만으로 표현하기 어려울 수 있습니다.
- 한 번의 요청으로 여러 resource를 조합해 가져오기 어렵습니다.
- JSON은 텍스트 기반이라 binary format보다 길고 parsing overhead가 있습니다.

## HTTP 멱등성

멱등성은 같은 연산을 여러 번 적용해도 결과가 달라지지 않는 성질입니다. HTTP에서는 같은 요청을 한 번 보내는 것과 여러 번 보내는 것이 서버 상태에 같은 효과를 남기면 멱등하다고 봅니다.

대표적으로 `GET`, `HEAD`, `PUT`, `DELETE`, `TRACE`, `OPTIONS`는 멱등한 메서드로 분류됩니다. 단, `DELETE`는 첫 요청 후 resource가 사라져 다음 응답 status가 달라질 수 있지만, 서버 상태 효과는 동일하므로 멱등하다고 봅니다.

멱등성은 retry 판단의 근거입니다. connection이 끊기거나 timeout이 발생했을 때 멱등 요청은 재시도하기 쉽습니다. 결제처럼 중복 실행이 위험한 API는 idempotency key를 두어 같은 요청을 여러 번 받아도 한 번만 처리되게 설계해야 합니다.

## Forward Proxy와 Reverse Proxy

Forward proxy는 클라이언트 쪽에 위치해 사용자의 외부 요청을 대신 전달합니다. 사용자의 실제 IP를 숨기고, 접근 제어, 보안 필터링, 캐싱을 수행할 수 있습니다. 회사 내부망에서 외부 웹 접근을 통제하는 구성이 대표적입니다.

Reverse proxy는 서버 쪽에 위치해 외부 요청을 내부 backend server로 전달합니다. backend server를 직접 노출하지 않고, load balancing, SSL termination, caching, compression, 보안 필터링을 수행합니다.

| 구분 | Forward Proxy | Reverse Proxy |
| --- | --- | --- |
| 위치 | 클라이언트 앞 | 서버 앞 |
| 숨기는 대상 | 클라이언트 | 백엔드 서버 |
| 주요 목적 | 익명성, 접근 제어, 캐싱 | 로드밸런싱, SSL 종료, 보호, 캐싱 |

## Web Server와 WAS

Web server는 HTML, CSS, JS, image 같은 정적 콘텐츠 제공에 특화되어 있습니다. Nginx, Apache가 대표적입니다. WAS(Web Application Server)는 servlet container와 애플리케이션 실행 환경을 제공해 동적 콘텐츠와 비즈니스 로직을 처리합니다. Java 진영에서는 Tomcat이 대표적인 WAS/servlet container입니다.

WAS도 정적 파일을 제공할 수 있지만, web server를 앞에 두면 정적 파일, TLS termination, compression, caching, reverse proxy, load balancing을 분리할 수 있습니다. 이렇게 하면 WAS는 애플리케이션 로직에 집중하고, 트래픽 특성에 따라 web server와 WAS를 독립적으로 확장할 수 있습니다.

## SSR과 CSR

SSR(Server-Side Rendering)은 서버가 데이터를 포함한 HTML을 만들어 응답합니다. 브라우저는 JS 실행 전에도 콘텐츠를 볼 수 있어 초기 표시와 SEO에 유리합니다. 대신 서버가 렌더링 부담을 더 많이 집니다.

CSR(Client-Side Rendering)은 서버가 빈 HTML shell과 JS bundle을 내려주고, 브라우저가 JS로 데이터를 요청해 화면을 구성합니다. 초기 로딩과 SEO에는 불리할 수 있지만, 이후 화면 전환과 상호작용은 빠르고 서버 렌더링 부하는 작습니다.

실무에서는 SSR, CSR, SSG, hydration을 조합합니다. 콘텐츠 SEO와 초기 로딩이 중요하면 SSR/SSG를, 로그인 후 복잡한 대시보드처럼 상호작용이 중요하면 CSR 비중을 높일 수 있습니다.

## PRG Pattern

PRG(Post/Redirect/Get)는 멱등하지 않은 POST 요청 처리 후 redirect를 응답하고, 브라우저가 결과 페이지를 GET으로 다시 요청하게 하는 패턴입니다. 사용자가 새로고침하거나 뒤로 가기를 눌렀을 때 POST가 재전송되어 주문, 결제, 글쓰기 같은 작업이 중복 실행되는 문제를 줄입니다.

단, PRG는 브라우저 재제출을 줄이는 UX 패턴이지 서버의 중복 처리 방지 자체를 보장하지 않습니다. 결제나 주문처럼 중복이 치명적인 작업은 idempotency key나 unique constraint도 함께 필요합니다.

## 브라우저 요청 흐름

사용자가 URL을 입력하면 브라우저는 먼저 DNS로 domain의 IP를 찾습니다. 이후 TCP 연결을 맺고, HTTPS라면 TLS handshake로 서버 인증과 세션 키 협상을 수행합니다. 브라우저는 HTTP request를 만들고, IP packet과 data link frame으로 캡슐화되어 네트워크를 지나 서버에 전달됩니다.

서버는 요청을 처리해 HTTP response를 반환하고, 브라우저는 HTML을 parsing해 DOM을 만들고 CSSOM, render tree, layout, paint 과정을 거쳐 화면을 표시합니다. JS, CSS, image 같은 subresource는 추가 요청을 만들 수 있습니다. HTTP/1.1 keep-alive나 HTTP/2 multiplexing이 켜져 있으면 매 resource마다 새 TCP 연결을 만들지 않고 connection을 재사용할 수 있습니다.

## CORS

CORS는 Cross-Origin Resource Sharing의 약자로, 다른 origin의 resource를 요청할 때 서버가 브라우저에 허용 여부를 알려주는 메커니즘입니다. Origin은 protocol, domain, port의 조합입니다.

브라우저는 기본적으로 Same-Origin Policy를 적용해 다른 origin 요청을 제한합니다. 하지만 현대 웹 애플리케이션은 API 서버, 이미지 서버, 인증 서버처럼 여러 origin을 함께 사용하므로, SOP를 안전하게 완화하는 CORS가 필요합니다.

### Simple Request

브라우저는 요청의 `Origin` header와 응답의 `Access-Control-Allow-Origin`을 비교합니다. 조건이 단순하면 preflight 없이 본 요청을 보냅니다.

Simple request 조건은 대략 다음과 같습니다.

- method가 `GET`, `POST`, `HEAD`
- 수동 설정 header가 제한된 safe-listed header
- `Content-Type`이 `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain` 중 하나

### Preflight Request

조건이 단순하지 않으면 브라우저는 실제 요청 전에 `OPTIONS` preflight request를 보냅니다. 이때 `Access-Control-Request-Method`, `Access-Control-Request-Headers`로 실제 요청 정보를 전달합니다.

서버는 `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`로 허용 범위를 응답합니다. `Access-Control-Max-Age`를 설정하면 preflight 결과를 캐시해 추가 요청 비용을 줄일 수 있습니다.

### Credential Request

cookie나 인증 정보를 포함한 요청은 더 엄격합니다. 서버는 `Access-Control-Allow-Credentials: true`를 응답해야 하며, `Access-Control-Allow-Origin`에 wildcard(`*`)를 사용할 수 없습니다.

## 실무 판단

- 상태 코드는 클라이언트가 다음 행동을 결정하는 계약입니다.
- 쿠키는 SameSite, Secure, HttpOnly 설정을 보안 요구에 맞게 잡아야 합니다.
- CORS는 서버 간 통신 문제가 아니라 브라우저 보안 정책입니다.
- 멱등하지 않은 API는 timeout 후 재시도 시 중복 처리 위험을 반드시 설계로 막아야 합니다.
- 리버스 프록시는 운영 진입점이므로 timeout, header size, body size, TLS, backend health check 설정을 함께 봐야 합니다.
