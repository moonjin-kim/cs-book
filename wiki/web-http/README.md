# Web과 HTTP

Web/HTTP 면접은 **브라우저가 요청을 만들고 서버가 응답하기까지 HTTP 메시지, 상태 관리, 보안 정책, 렌더링 방식이 어떻게 연결되는지**를 설명하는 것이 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| HTTP 메시지 | Method, path, header, body, status code로 구성됩니다. |
| URI/URL/URN | URI는 식별자, URL은 위치, URN은 이름입니다. |
| REST | 자원을 URI로 표현하고 HTTP method로 행위를 나타냅니다. |
| Cookie/Session | stateless HTTP 위에서 사용자 상태를 유지합니다. |
| CORS | 브라우저의 cross-origin 요청 제한 정책입니다. |
| Proxy | Forward는 client 쪽, Reverse는 server 쪽 대리자입니다. |
| SSR/CSR | 서버가 HTML을 만들지, 브라우저가 JS로 만들지의 차이입니다. |

## HTTP 메시지

| 구성 | 설명 |
| --- | --- |
| Method | GET, POST, PUT, PATCH, DELETE |
| Path | 요청 대상 리소스 |
| Header | metadata |
| Body | 요청/응답 데이터 |
| Status Code | 처리 결과 |

대표 상태 코드:

| 코드 | 의미 |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 301/302 | Redirect |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## URI, URL, URN

| 구분 | 의미 |
| --- | --- |
| URI | 자원을 식별하는 전체 개념 |
| URL | 자원의 위치를 나타내는 URI |
| URN | 자원의 이름을 나타내는 URI |

```text
URI = URL 또는 URN을 포함하는 상위 개념
```

## HTTP 버전

| 구분 | HTTP/1.1 | HTTP/2 |
| --- | --- | --- |
| 메시지 | text 기반 | binary frame |
| 연결 | keep-alive, pipelining | multiplexing |
| HOL Blocking | TCP 연결 단위 문제 | stream multiplexing으로 완화 |
| Header | 반복 전송 | HPACK 압축 |

## REST API

REST는 자원을 중심으로 API를 설계하는 방식입니다.

핵심:

- 자원은 URI로 표현합니다.
- 행위는 HTTP method로 표현합니다.
- 응답은 representation입니다.
- stateless해야 합니다.

Method 특성:

| Method | 의미 | 멱등성 |
| --- | --- | --- |
| GET | 조회 | O |
| POST | 생성/처리 | X |
| PUT | 전체 수정/대체 | O |
| PATCH | 부분 수정 | 보장 아님 |
| DELETE | 삭제 | O |

## Cookie와 Session

HTTP는 stateless이므로 서버는 기본적으로 이전 요청 상태를 기억하지 않습니다.

| 구분 | Cookie | Session |
| --- | --- | --- |
| 저장 위치 | Client | Server |
| 전송 | 매 요청 header에 포함 | session id만 cookie로 전달 |
| 장점 | 서버 저장소 부담 적음 | 민감 정보 서버 보관 |
| 주의 | 탈취, 조작 위험 | 서버 확장 시 세션 공유 필요 |

## CORS

CORS는 브라우저가 다른 origin 요청을 제한하는 보안 모델입니다.

Origin 구성:

```text
scheme + host + port
```

Preflight:

- 실제 요청 전 `OPTIONS` 요청을 보냅니다.
- 서버가 허용 method/header/origin을 응답합니다.

주의:

- CORS는 브라우저 정책입니다.
- 서버 간 호출에는 적용되지 않습니다.

## Proxy

| 구분 | Forward Proxy | Reverse Proxy |
| --- | --- | --- |
| 위치 | Client 앞 | Server 앞 |
| 숨기는 대상 | Client | Server |
| 사용 | 사내망, 우회, 캐시 | 로드밸런싱, TLS 종료, 보안 |

## 브라우저 요청 흐름

1. URL 입력
2. DNS 조회
3. TCP 연결
4. TLS handshake
5. HTTP request 전송
6. Server 처리
7. HTTP response 수신
8. HTML/CSS/JS 파싱과 렌더링

## Web Server와 WAS

| 구분 | Web Server | WAS |
| --- | --- | --- |
| 역할 | 정적 리소스, reverse proxy | 애플리케이션 로직 실행 |
| 예시 | Nginx, Apache | Tomcat |
| 장점 | TLS, 캐시, 압축, 로드밸런싱 | Servlet, 비즈니스 처리 |

WAS도 정적 파일을 줄 수 있지만, Web Server를 앞에 두면 정적 리소스와 애플리케이션 처리를 분리할 수 있습니다.

## SSR과 CSR

| 구분 | SSR | CSR |
| --- | --- | --- |
| 렌더링 위치 | Server | Browser |
| 초기 로딩 | 빠른 편 | JS 다운로드 후 렌더링 |
| SEO | 유리 | 불리할 수 있음 |
| 서버 부하 | 상대적으로 큼 | 상대적으로 작음 |
| 이후 UX | 서버 요청 필요 | 빠른 화면 전환 가능 |

## PRG Pattern

PRG는 Post/Redirect/Get 패턴입니다.

흐름:

1. Client가 POST 요청
2. Server가 상태 변경 처리
3. Server가 Redirect 응답
4. Client가 GET으로 결과 페이지 조회

효과:

- 새로고침으로 POST가 중복 전송되는 문제를 줄입니다.
- 주문, 결제, 폼 제출 후 결과 페이지에 자주 사용합니다.
