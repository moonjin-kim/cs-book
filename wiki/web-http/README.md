# Web과 HTTP

Web/HTTP 면접은 **브라우저가 요청을 만들고 서버가 응답하기까지 HTTP semantics, 상태 관리, 캐시, 보안 정책, 프록시, 렌더링 방식이 어떻게 연결되는지**를 설명하는 것이 핵심입니다.

처음부터 끝까지 외우기보다 아래 핵심 섹션 단위로 나눠 보는 편이 효율적입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| HTTP | stateless application-level request/response protocol입니다. |
| HTTP 메시지 | start line/control data, header field, content/body, trailer로 구성됩니다. |
| Method | resource에 대해 수행하려는 의미입니다. GET/HEAD/OPTIONS/TRACE는 safe, PUT/DELETE는 idempotent입니다. |
| Status Code | 응답 결과를 1xx, 2xx, 3xx, 4xx, 5xx 범주로 표현합니다. |
| URI/URL | URI는 식별자, URL은 위치를 포함한 URI입니다. |
| REST | resource를 URI로 식별하고 representation을 교환하며 stateless constraint를 지키는 설계 스타일입니다. |
| Cookie | browser가 domain/path 조건에 맞춰 request에 자동 전송하는 작은 상태 저장 수단입니다. |
| Session | 서버 저장소에 상태를 두고 client에는 session id만 전달하는 방식입니다. |
| Cache | freshness와 validation으로 origin 부하와 latency를 줄입니다. |
| CORS | browser가 cross-origin fetch를 할 때 서버 허용 정책을 확인하는 메커니즘입니다. |
| Proxy | client나 server를 대신해 요청을 전달, 변환, 캐시, 라우팅합니다. |

## 면접 답변 프레임

HTTP 질문은 “API 호출” 하나를 **의미, 연결, 상태, 캐시, 브라우저 정책**으로 나눠 답하면 좋습니다.

1. 의미: method, target URI, header, content, status code로 무엇을 요청/응답하는지 설명합니다.
2. 연결: HTTP/1.1 keep-alive, HTTP/2 multiplexing, HTTP/3/QUIC 차이를 붙입니다.
3. 상태: HTTP는 stateless라 cookie, session, token, CSRF, SameSite를 함께 말합니다.
4. 캐시: Cache-Control, ETag, Vary, CDN/browser cache가 응답 재사용을 결정합니다.
5. 브라우저 경계: Same-Origin Policy, CORS, credential, preflight가 서버 간 호출과 다름을 강조합니다.

## 1. HTTP 메시지와 Semantics

### HTTP는 무엇인가

HTTP는 분산 hypertext system을 위한 stateless application-level protocol입니다.

핵심:

- client가 request를 보내고 server가 response를 보냅니다.
- protocol 자체는 이전 요청의 application state를 기억하지 않습니다.
- 같은 HTTP semantics가 HTTP/1.1, HTTP/2, HTTP/3 같은 여러 wire format 위에서 동작합니다.

### Request와 Response

HTTP 메시지는 다음 요소로 이해하면 됩니다.

| 요소 | Request | Response |
| --- | --- | --- |
| Control data | method, target URI, protocol version | status code, reason phrase 또는 pseudo-header |
| Header field | metadata, content negotiation, auth, cache | metadata, cache, cookie, content type |
| Content | request body | response body |
| Trailer | content 뒤에 붙는 추가 field | streaming 검증 등 제한적 사용 |

HTTP/1.1 예:

```http
GET /orders/123 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer ...
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{"id":123,"status":"PAID"}
```

### Header와 Body

자주 쓰는 header:

| Header | 의미 |
| --- | --- |
| `Host` | 요청 대상 authority |
| `Accept` | client가 받을 수 있는 media type |
| `Content-Type` | content의 media type |
| `Content-Length` | content 길이 |
| `Authorization` | 인증 정보 |
| `Cookie` | client가 보내는 cookie |
| `Set-Cookie` | server가 cookie 저장 지시 |
| `Cache-Control` | cache 정책 |
| `ETag` | representation validator |
| `Location` | redirect 또는 생성된 resource 위치 |
| `Vary` | cache key에 영향을 주는 request header |

주의:

- GET에도 body를 넣을 수 있지만 의미와 상호운용성이 약해 실무 API에서는 피하는 편이 안전합니다.
- `Content-Type`은 body 형식을 말하고, `Accept`는 원하는 응답 형식을 말합니다.
- header 크기가 커지면 proxy, WAS, browser 제한에 걸릴 수 있습니다.

### Status Code

| 범주 | 의미 | 예 |
| --- | --- | --- |
| 1xx | informational | 100 Continue |
| 2xx | successful | 200 OK, 201 Created, 204 No Content |
| 3xx | redirection | 301, 302, 303, 307, 308 |
| 4xx | client error | 400, 401, 403, 404, 409, 422, 429 |
| 5xx | server error | 500, 502, 503, 504 |

자주 헷갈리는 코드:

| 코드 | 의미 | 면접 포인트 |
| --- | --- | --- |
| 401 | 인증 필요 또는 실패 | `WWW-Authenticate`와 연결 |
| 403 | 인증됐더라도 권한 없음 | 인가 실패 |
| 404 | resource 없음 | 존재 은닉을 위해 403 대신 쓰기도 함 |
| 409 | 현재 resource state와 충돌 | 중복 생성, version conflict |
| 422 | 문법은 맞지만 의미 검증 실패 | validation error에 사용 |
| 429 | rate limit | `Retry-After` 고려 |
| 502 | gateway/proxy가 upstream에서 잘못된 응답 | reverse proxy 뒤 backend 문제 |
| 503 | 일시적 과부하/점검 | retry 가능성 |
| 504 | gateway timeout | upstream 응답 시간 초과 |

### Method의 Safe와 Idempotent

| Method | 주 용도 | Safe | Idempotent | Body |
| --- | --- | --- | --- | --- |
| GET | 조회 | O | O | 보통 사용하지 않음 |
| HEAD | header만 조회 | O | O | 없음 |
| POST | 생성, 명령, 처리 | X | X | 주로 사용 |
| PUT | 전체 대체 또는 known URI 생성 | X | O | 사용 |
| PATCH | 부분 수정 | X | 보장 아님 | 사용 |
| DELETE | 삭제 | X | O | 가능하지만 주의 |
| OPTIONS | 지원 method/정책 조회 | O | O | 보통 없음 |

면접 포인트:

- Safe는 server state를 바꾸려는 의미가 없다는 뜻입니다.
- Idempotent는 같은 요청을 여러 번 보내도 의도한 최종 server state가 같다는 뜻입니다.
- Idempotent여도 응답 코드나 로그, metric, updated_at 같은 부수 효과는 달라질 수 있습니다.
- 재시도 가능성은 method만 보지 말고 idempotency key, DB constraint, transaction 설계까지 봐야 합니다.

## 2. URI와 REST API 설계

### URI, URL, URN

| 구분 | 의미 | 예 |
| --- | --- | --- |
| URI | resource identifier 전체 개념 | `https://example.com/orders/1` |
| URL | 위치와 접근 방법을 포함한 URI | `https://example.com/orders/1` |
| URN | 위치와 무관한 이름 | `urn:isbn:...` |

URL 구성:

```text
scheme://authority/path?query#fragment
https://api.example.com:443/orders/123?include=items#summary
```

| 부분 | 의미 |
| --- | --- |
| scheme | `http`, `https` |
| authority | host와 optional port |
| path | resource 경로 |
| query | 필터, 정렬, 페이지 같은 추가 조건 |
| fragment | client-side 식별자, HTTP request에는 보통 전송되지 않음 |

### Resource와 Representation

REST 관점에서 중요한 구분:

| 개념 | 의미 |
| --- | --- |
| Resource | 식별 가능한 대상 |
| Representation | resource의 현재 상태를 JSON, HTML 등으로 표현한 것 |
| Media Type | representation 형식 |
| Link | resource 간 전이 가능성 표현 |

예:

```text
Resource: 주문 123
URI: /orders/123
Representation: {"id":123,"status":"PAID"}
Media Type: application/json
```

### REST API 설계 기준

좋은 답변 축:

- resource는 명사 중심 URI로 표현합니다.
- 행위 의미는 HTTP method로 표현합니다.
- filtering, sorting, pagination은 query string으로 표현합니다.
- request/response representation을 명확히 정의합니다.
- stateless하게 설계해 server가 client context를 session에 과도하게 의존하지 않게 합니다.

예:

```http
GET /orders?status=paid&cursor=eyJpZCI6MTIzfQ
POST /orders
GET /orders/123
PATCH /orders/123/shipping-address
POST /orders/123/cancel-requests
```

주의:

- 모든 작업을 CRUD로 억지 매핑하지 않습니다.
- 결제 승인, 주문 취소처럼 business action은 하위 resource나 command resource로 표현할 수 있습니다.
- idempotent create가 필요하면 client-generated id 또는 `Idempotency-Key`를 검토합니다.

### PUT vs PATCH vs POST

| 구분 | 의미 | 예 |
| --- | --- | --- |
| POST | resource collection에 새 처리 요청 또는 생성 | `POST /orders` |
| PUT | target URI의 representation 전체 대체 | `PUT /users/123/profile` |
| PATCH | 부분 변경 문서 적용 | `PATCH /users/123/profile` |

면접 포인트:

- PUT은 같은 representation을 반복 적용하면 최종 상태가 같습니다.
- PATCH는 patch 문서 의미에 따라 idempotent할 수도, 아닐 수도 있습니다.
- POST도 idempotency key로 안전한 재시도를 설계할 수 있습니다.

## 3. HTTP 버전과 연결 관리

### HTTP/1.1

HTTP/1.1 특징:

- text 기반 메시지 framing
- persistent connection 기본 사용
- chunked transfer coding
- request pipelining은 존재하지만 실무에서는 제약이 큼
- 한 연결에서 response 순서가 request 순서를 따라야 하므로 HOL blocking 문제가 생길 수 있음

주의:

- connection을 많이 만들면 TCP/TLS handshake, file descriptor, TIME_WAIT 비용이 커집니다.
- connection pool과 keep-alive timeout을 LB/WAS 설정과 맞춰야 합니다.

### HTTP/2

HTTP/2 특징:

| 기능 | 의미 |
| --- | --- |
| Binary Frame | 메시지를 frame으로 쪼개 전송 |
| Stream | 하나의 connection 안의 독립 logical 흐름 |
| Multiplexing | 여러 stream을 한 TCP connection에서 동시 전송 |
| HPACK | header 압축 |
| Flow Control | stream과 connection 단위 흐름 제어 |

장점:

- HTTP/1.1의 여러 연결 필요성을 줄입니다.
- 작은 resource가 많은 page에서 성능이 좋아질 수 있습니다.
- header 반복 전송 비용을 줄입니다.

주의:

- TCP 위에서 동작하므로 packet loss가 생기면 connection 전체가 영향을 받을 수 있습니다.
- server push는 기대만큼 범용적으로 쓰이지 않았고 브라우저 지원도 줄었습니다.

### HTTP/3

HTTP/3는 HTTP semantics를 QUIC 위에 매핑합니다.

| 구분 | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| 전송 | TCP | TCP | QUIC/UDP |
| 메시지 | text | binary frame | QUIC stream/frame |
| Multiplexing | 제한적 | O | O |
| Header 압축 | 없음 | HPACK | QPACK |
| TCP HOL 영향 | 큼 | 남아 있음 | 완화 |
| TLS | 선택/별도 | 보통 TLS | QUIC에 TLS 1.3 통합 |

면접 답변:

- HTTP/2는 application layer multiplexing을 제공하지만 TCP packet loss의 HOL blocking은 남습니다.
- HTTP/3는 QUIC stream 단위로 손실 영향을 줄이고 연결 수립 지연을 낮출 수 있습니다.
- UDP 차단 환경과 운영 관측 도구 차이를 고려해야 합니다.

### Keep-Alive와 Connection Pool

| 개념 | 의미 |
| --- | --- |
| HTTP keep-alive | 요청마다 TCP 연결을 새로 만들지 않고 재사용 |
| Connection pool | client/server가 재사용 가능한 연결을 관리 |
| Idle timeout | 유휴 연결을 얼마나 유지할지 결정 |

실무 포인트:

- LB idle timeout이 client pool idle timeout보다 짧으면 재사용 시 broken pipe/reset이 날 수 있습니다.
- pool 크기가 너무 작으면 대기 시간이 늘고, 너무 크면 server connection 자원을 고갈시킬 수 있습니다.
- HTTP/2는 한 연결에서 여러 stream을 처리하므로 pool sizing 관점이 HTTP/1.1과 다릅니다.

## 4. Cookie, Session, 인증 상태

### HTTP는 Stateless

HTTP 자체는 각 요청을 독립적으로 처리합니다.

상태 유지 방법:

| 방식 | 저장 위치 | 장점 | 주의 |
| --- | --- | --- | --- |
| Cookie | client | 간단, browser 자동 전송 | 탈취, CSRF, 크기 제한 |
| Session | server | 민감 정보 서버 보관 | scale-out 시 공유 저장소 필요 |
| Bearer Token | client | stateless API에 적합 | 탈취 시 재사용 위험 |
| JWT | client | 자체 claim 포함, 검증 가능 | revoke, 만료, payload 노출 주의 |

### Cookie 속성

| 속성 | 의미 |
| --- | --- |
| `Domain` | cookie가 전송될 domain 범위 |
| `Path` | 전송될 path 범위 |
| `Expires` / `Max-Age` | 만료 |
| `Secure` | HTTPS에서만 전송 |
| `HttpOnly` | JavaScript 접근 차단 |
| `SameSite` | cross-site 요청 전송 제한 |

보안 기준:

- session cookie에는 `Secure`, `HttpOnly`, 적절한 `SameSite`를 설정합니다.
- cookie에는 민감 정보를 직접 넣지 않습니다.
- domain을 넓게 잡으면 subdomain 탈취나 오염 위험이 커집니다.

### Cookie와 Session

| 구분 | Cookie | Session |
| --- | --- | --- |
| 저장 위치 | client | server |
| client 전송 | 매 요청 자동 전송 | session id cookie 전송 |
| 확장성 | 서버 부담 적음 | session store 필요 |
| 보안 | 변조/탈취 대비 필요 | session id 탈취 대비 필요 |
| 무효화 | 만료 또는 삭제 지시 | server에서 즉시 invalidation 가능 |

Session scale-out 선택지:

- sticky session
- session clustering
- Redis 같은 external session store
- stateless token 전환

### CSRF와 SameSite

CSRF는 browser가 cross-site 요청에도 cookie를 자동 전송하는 성질을 악용합니다.

대응:

- SameSite cookie
- CSRF token
- Origin/Referer 검증
- 중요한 변경 요청은 idempotency와 재인증 고려

주의:

- CORS를 막는다고 CSRF가 자동으로 막히는 것은 아닙니다.
- CSRF는 응답을 읽는 문제가 아니라 요청이 전송되는 문제가 핵심입니다.

## 5. HTTP Cache와 CDN

### Cache가 필요한 이유

Cache는 response를 재사용해 latency와 origin 부하를 줄입니다.

| Cache 위치 | 예 |
| --- | --- |
| Browser cache | 사용자 브라우저 |
| Shared cache | CDN, proxy |
| Application cache | 서버 내부 cache |

HTTP cache 질문에서는 browser cache와 shared cache를 구분해야 합니다.

### Cache-Control

| Directive | 의미 |
| --- | --- |
| `max-age=60` | 60초 동안 fresh |
| `s-maxage=60` | shared cache에 별도 freshness 적용 |
| `no-cache` | 저장은 가능하지만 사용 전 재검증 필요 |
| `no-store` | 저장 금지 |
| `private` | browser 같은 private cache만 저장 |
| `public` | shared cache 저장 가능 |
| `must-revalidate` | stale response 사용 제한 |
| `stale-while-revalidate` | stale 응답 제공하며 background revalidation 가능 |

주의:

- `no-cache`는 cache하지 말라는 뜻이 아니라 재검증하라는 뜻입니다.
- 개인정보가 포함된 응답은 `private` 또는 `no-store`를 검토합니다.
- CDN을 쓰면 `s-maxage`, `Surrogate-Control`, vendor-specific header까지 볼 수 있습니다.

### ETag와 Last-Modified

Validation 방식:

| Validator | Request Header | Response |
| --- | --- | --- |
| ETag | `If-None-Match` | 같으면 `304 Not Modified` |
| Last-Modified | `If-Modified-Since` | 변경 없으면 `304 Not Modified` |

흐름:

```text
GET /app.js
<- 200 OK
   ETag: "abc"

GET /app.js
If-None-Match: "abc"
<- 304 Not Modified
```

장점:

- body 전송을 줄입니다.
- freshness가 끝나도 origin 검증 후 재사용할 수 있습니다.

### Vary와 Cache Key

`Vary`는 어떤 request header가 cache key에 영향을 주는지 알려줍니다.

예:

```http
Vary: Accept-Encoding
Vary: Origin
Vary: Authorization
```

주의:

- `Vary: *` 또는 과도한 `Vary`는 cache hit ratio를 낮춥니다.
- `Origin`, `Cookie`, `Authorization`을 고려하지 않으면 잘못된 사용자에게 cache된 응답이 갈 수 있습니다.
- CDN cache key는 path/query/header/cookie 정책을 명시적으로 설계해야 합니다.

## 6. CORS와 브라우저 보안 경계

### Same-Origin Policy

Origin은 다음 3개가 모두 같아야 같은 origin입니다.

```text
scheme + host + port
```

Same-Origin Policy는 다른 origin의 resource를 마음대로 읽지 못하게 하는 브라우저 보안 정책입니다.

주의:

- CORS는 server-to-server 호출에는 적용되지 않습니다.
- CORS는 인증/인가가 아닙니다.
- CORS 허용은 browser가 response를 JavaScript에 노출할 수 있게 하는 정책입니다.

### Simple Request와 Preflight

Preflight가 생기는 대표 조건:

- simple method가 아님
- simple header가 아닌 custom header 사용
- 특정 content type이 아님
- credential이 포함되고 정책 확인이 필요함

흐름:

```text
OPTIONS /orders
Origin: https://web.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization, content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://web.example.com
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: authorization, content-type
Access-Control-Max-Age: 600
```

이후 실제 요청을 보냅니다.

### CORS Header

| Header | 의미 |
| --- | --- |
| `Access-Control-Allow-Origin` | 허용 origin |
| `Access-Control-Allow-Methods` | 허용 method |
| `Access-Control-Allow-Headers` | 허용 request header |
| `Access-Control-Allow-Credentials` | credential 포함 허용 |
| `Access-Control-Expose-Headers` | JS에서 읽을 수 있는 response header |
| `Access-Control-Max-Age` | preflight cache 시간 |

Credential request 주의:

- credential을 허용할 때 `Access-Control-Allow-Origin: *`를 사용할 수 없습니다.
- cookie 기반 인증 API는 SameSite, Secure, CSRF까지 함께 봐야 합니다.
- preflight 성공은 인증 성공이 아니라 브라우저 정책상 요청 가능하다는 뜻입니다.

## 7. Proxy, Web Server, Rendering

### Forward Proxy와 Reverse Proxy

| 구분 | Forward Proxy | Reverse Proxy |
| --- | --- | --- |
| 위치 | client 앞 | server 앞 |
| 숨기는 대상 | client | origin server |
| 사용 | 사내망, 접근 제어, egress 통제 | TLS 종료, routing, compression, caching, LB |

HTTP proxy는 request/response를 전달하며 header를 추가하거나 변환할 수 있습니다.

주의:

- `X-Forwarded-For`, `X-Forwarded-Proto`, `Forwarded` header는 신뢰 가능한 proxy가 설정한 경우에만 믿어야 합니다.
- reverse proxy에서 TLS를 종료하면 backend 구간 보안 정책을 별도로 정해야 합니다.
- proxy buffering은 streaming 응답 latency에 영향을 줄 수 있습니다.

### Web Server와 WAS

| 구분 | Web Server | WAS |
| --- | --- | --- |
| 주요 역할 | 정적 리소스, reverse proxy, TLS, 압축, 캐시 | 애플리케이션 로직, Servlet, transaction |
| 예 | Nginx, Apache HTTP Server | Tomcat, Jetty, Undertow |
| scale 기준 | connection, static throughput | thread, DB connection, business latency |

WAS도 정적 파일을 줄 수 있지만, Web Server나 reverse proxy를 앞에 두면 다음 이점이 있습니다.

- TLS 정책 중앙화
- 정적 리소스 캐시/압축
- slow client로부터 application thread 보호
- routing과 health check
- 무중단 배포 시 backend 교체

### SSR, CSR, SSG

| 구분 | SSR | CSR | SSG |
| --- | --- | --- | --- |
| HTML 생성 | server request 시점 | browser JS 실행 후 | build 시점 |
| 초기 표시 | 빠른 편 | JS bundle 의존 | 매우 빠름 |
| SEO | 유리 | 추가 처리 필요 | 유리 |
| 서버 부하 | request마다 발생 | API 중심 | 낮음 |
| 적합 | 동적 페이지, SEO | 대시보드, 앱 | 문서, 마케팅, 블로그 |

주의:

- CSR은 초기 JS bundle, API latency, hydration을 고려해야 합니다.
- SSR은 서버 CPU와 cache 전략이 중요합니다.
- SSG는 데이터 최신성과 rebuild/invalidation 전략이 필요합니다.

### PRG Pattern

PRG는 Post/Redirect/Get 패턴입니다.

흐름:

1. Client가 POST 요청을 보냅니다.
2. Server가 상태 변경을 처리합니다.
3. Server가 `303 See Other` 또는 적절한 redirect 응답을 보냅니다.
4. Client가 GET으로 결과 resource를 조회합니다.

효과:

- 새로고침으로 POST가 중복 전송되는 문제를 줄입니다.
- 주문, 결제, 폼 제출 후 결과 페이지에 자주 사용합니다.

주의:

- PRG는 UX 중복 제출을 줄일 뿐, 서버 측 idempotency를 대체하지 않습니다.
- 결제나 주문 생성은 idempotency key와 unique constraint로 중복 처리를 막아야 합니다.

## 8. 실전 면접 Q&A

### HTTP 기본

| 질문 | 답변 핵심 |
| --- | --- |
| HTTP가 stateless라는 뜻은? | protocol이 이전 요청의 application state를 기억하지 않으며 상태는 cookie/session/token 등으로 보완합니다. |
| `Content-Type`과 `Accept` 차이는? | `Content-Type`은 보내는 body 형식, `Accept`는 받고 싶은 response 형식입니다. |
| 401과 403 차이는? | 401은 인증 필요/실패, 403은 인증됐어도 권한이 없는 인가 실패입니다. |
| 502와 504 차이는? | 502는 upstream의 잘못된 응답, 504는 gateway가 upstream 응답을 시간 내 받지 못한 경우입니다. |

### Method / REST

| 질문 | 답변 핵심 |
| --- | --- |
| Safe와 idempotent 차이는? | Safe는 상태 변경 의도가 없고, idempotent는 반복해도 최종 상태가 같은 성질입니다. |
| PUT과 PATCH 차이는? | PUT은 target resource 전체 대체, PATCH는 부분 변경 문서 적용입니다. |
| POST는 항상 non-idempotent인가? | method 의미상 보장되지 않지만 idempotency key와 저장소 제약으로 안전한 재시도를 설계할 수 있습니다. |
| REST에서 resource와 representation 차이는? | resource는 식별 대상, representation은 JSON/HTML 같은 현재 상태 표현입니다. |

### HTTP 버전 / 캐시

| 질문 | 답변 핵심 |
| --- | --- |
| HTTP/1.1과 HTTP/2 차이는? | HTTP/2는 binary frame, stream multiplexing, HPACK으로 여러 요청을 한 TCP 연결에서 처리합니다. |
| HTTP/2에도 HOL blocking이 남는 이유는? | TCP packet loss가 connection 전체 byte stream 전달에 영향을 주기 때문입니다. |
| HTTP/3의 장점은? | QUIC/UDP 기반 stream multiplexing과 TLS 1.3 통합으로 HOL blocking과 연결 수립 비용을 줄입니다. |
| `no-cache`와 `no-store` 차이는? | `no-cache`는 저장 후 재검증, `no-store`는 저장 금지입니다. |
| ETag는 왜 쓰나? | representation validator로 변경 없을 때 `304 Not Modified`를 받아 body 전송을 줄입니다. |
| `Vary`가 중요한 이유는? | 어떤 request header별로 cache entry를 분리해야 하는지 알려 개인정보 노출과 잘못된 cache를 막습니다. |

### Cookie / CORS / Proxy

| 질문 | 답변 핵심 |
| --- | --- |
| Cookie와 Session 차이는? | Cookie는 client 저장, Session은 server 저장이며 session id만 cookie로 전달하는 경우가 많습니다. |
| `HttpOnly`, `Secure`, `SameSite` 역할은? | JS 접근 차단, HTTPS 전송 제한, cross-site cookie 전송 제한입니다. |
| CORS는 무엇을 막는가? | browser가 cross-origin response를 JavaScript에 노출하는 것을 서버 정책으로 통제합니다. |
| Preflight는 왜 발생하나? | 실제 요청 전 method/header/credential 허용 여부를 `OPTIONS`로 확인하기 위해서입니다. |
| Forward proxy와 reverse proxy 차이는? | forward는 client 앞에서 client를 대리하고, reverse는 server 앞에서 origin을 대리합니다. |
| PRG는 중복 제출을 완전히 막는가? | 새로고침 중복 POST를 줄일 뿐 서버 측 idempotency 설계를 대체하지 않습니다. |

## 참고한 공식 문서

- RFC 9110 HTTP Semantics: https://www.rfc-editor.org/rfc/rfc9110.html
- RFC 9111 HTTP Caching: https://www.rfc-editor.org/rfc/rfc9111.html
- RFC 9112 HTTP/1.1: https://www.rfc-editor.org/rfc/rfc9112.html
- RFC 9113 HTTP/2: https://www.rfc-editor.org/rfc/rfc9113.html
- RFC 9114 HTTP/3: https://www.rfc-editor.org/rfc/rfc9114.html
- RFC 3986 URI Generic Syntax: https://www.rfc-editor.org/rfc/rfc3986.html
- RFC 6265 HTTP State Management Mechanism: https://www.rfc-editor.org/rfc/rfc6265.html
- WHATWG Fetch Standard: https://fetch.spec.whatwg.org/
