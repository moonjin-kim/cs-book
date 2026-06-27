# 네트워크

네트워크 면접은 **사용자 요청이 서버까지 도달하는 과정을 계층, 주소, 전송, 이름 해석, 암호화, 부하 분산 관점으로 설명하는 것**이 핵심입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| OSI/TCP-IP | 네트워크 기능을 계층별 책임으로 나누어 이해합니다. |
| IP | 목적지 주소를 기준으로 패킷을 라우팅합니다. |
| TCP | 연결, 순서, 재전송, 흐름·혼잡 제어를 제공합니다. |
| UDP | 연결 없이 빠르게 보내며 신뢰성은 애플리케이션이 보완합니다. |
| DNS | 도메인 이름을 IP 주소로 변환합니다. |
| TLS | 인증서, 키 교환, 암호화로 전송 구간을 보호합니다. |
| Load Balancing | 여러 서버로 트래픽을 분산해 가용성과 처리량을 높입니다. |

## 계층 모델

| 계층 | 역할 | 예시 |
| --- | --- | --- |
| Application | 애플리케이션 프로토콜 | HTTP, DNS |
| Transport | 프로세스 간 전송 | TCP, UDP |
| Internet | 주소 지정과 라우팅 | IP |
| Network Access | 물리 네트워크 전송 | Ethernet, Wi-Fi |

면접 포인트:

- 계층을 나누면 장애 위치를 좁히기 쉽습니다.
- HTTP 문제인지, TCP 연결 문제인지, DNS 문제인지 분리해서 설명할 수 있어야 합니다.

## IP와 라우팅

IP는 출발지와 목적지 주소를 기준으로 패킷을 전달합니다.

| 개념 | 설명 |
| --- | --- |
| IP 주소 | 네트워크에서 장비를 식별하는 주소 |
| Subnet | 네트워크 범위를 나누는 단위 |
| CIDR | IP 범위를 간결하게 표현하는 방식 |
| Routing | 목적지까지 다음 hop을 선택하는 과정 |

### NAT/NAPT

NAT는 사설 IP와 공인 IP를 변환합니다.

NAPT는 IP뿐 아니라 port까지 변환해 여러 내부 장비가 하나의 공인 IP로 외부와 통신할 수 있게 합니다.

## DHCP

DHCP는 네트워크에 붙은 장비에 IP 주소와 네트워크 설정을 자동으로 할당합니다.

흐름:

1. Discover
2. Offer
3. Request
4. ACK

## TCP vs UDP

| 구분 | TCP | UDP |
| --- | --- | --- |
| 연결 | 연결 지향 | 비연결 |
| 신뢰성 | 재전송, 순서 보장 | 보장 없음 |
| 속도 | 상대적으로 느림 | 빠름 |
| 사용 | HTTP/1.1, HTTP/2, DB 연결 | DNS, 실시간 스트리밍, 게임 |

### TCP 연결

TCP는 3-way handshake로 연결을 맺고 4-way handshake로 종료합니다.

TCP가 제공하는 것:

- 순서 보장
- 재전송
- 흐름 제어
- 혼잡 제어

## Keep-Alive

Keep-Alive는 연결을 재사용해 연결 생성 비용을 줄입니다.

구분:

| 종류 | 의미 |
| --- | --- |
| HTTP Keep-Alive | HTTP 요청마다 TCP 연결을 새로 만들지 않음 |
| TCP Keep-Alive | 유휴 TCP 연결이 살아 있는지 확인 |

## DNS

DNS는 도메인 이름을 IP 주소로 변환하는 분산 시스템입니다.

흐름:

```text
Browser -> Resolver -> Root DNS -> TLD DNS -> Authoritative DNS
```

주의:

- DNS 응답은 TTL 동안 캐시될 수 있습니다.
- 일반 질의는 UDP 53번을 우선 사용합니다.
- 응답이 크거나 zone transfer는 TCP를 사용할 수 있습니다.

## TLS

TLS는 HTTP 전송 구간을 보호합니다.

제공하는 것:

- 서버 인증
- 키 교환
- 대칭키 암호화
- 무결성 검증

HTTPS는 HTTP 위에 TLS를 적용한 것입니다.

## Load Balancing

로드밸런싱은 여러 서버로 트래픽을 분산합니다.

| 방식 | 특징 |
| --- | --- |
| Round Robin | 순서대로 분배 |
| Least Connections | 연결 수가 적은 서버 선택 |
| Hash 기반 | 사용자나 key 기준으로 서버 고정 |
| Health Check | 비정상 서버를 대상에서 제외 |

주의:

- 세션 기반 인증은 서버 분산 시 세션 불일치가 생길 수 있습니다.
- 해결 방법은 sticky session, session clustering, 외부 session store가 있습니다.

## CDN

CDN은 사용자 가까운 edge server에서 콘텐츠를 제공합니다.

장점:

- 원본 서버 부하 감소
- 지연 시간 감소
- 정적 리소스 전송 최적화

주의:

- 캐시 무효화 전략이 필요합니다.
- 동적 콘텐츠에는 적용 범위를 신중히 정해야 합니다.

## Timeout

Timeout은 장애 전파와 리소스 고갈을 막는 방어선입니다.

| 종류 | 의미 |
| --- | --- |
| Connection Timeout | 연결을 맺는 데 허용하는 시간 |
| Read Timeout | 응답 데이터를 기다리는 시간 |
| Socket Timeout | 소켓 I/O 대기 시간 |

실무 포인트:

- timeout이 없으면 장애 서비스 때문에 thread와 connection이 고갈될 수 있습니다.
- retry는 timeout, backoff, idempotency와 함께 설계해야 합니다.
