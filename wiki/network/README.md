# 네트워크

네트워크 면접은 **사용자 요청이 서버까지 도달하는 과정을 계층, 주소, 이름 해석, 전송 보장, 암호화, 트래픽 분산, 장애 진단 관점으로 설명하는 것**이 핵심입니다.

처음부터 끝까지 외우기보다 아래 핵심 섹션 단위로 나눠 보는 편이 효율적입니다.

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| OSI/TCP-IP | 네트워크 기능을 계층별 책임으로 나누어 장애 위치와 프로토콜 역할을 분리합니다. |
| IP | 목적지 주소를 기준으로 datagram을 다음 hop으로 전달합니다. 신뢰성은 제공하지 않습니다. |
| Routing | routing table을 보고 목적지 network prefix에 맞는 next hop/interface를 선택합니다. |
| NAT/NAPT | 사설 IP와 공인 IP, port를 변환해 내부 여러 장비가 외부와 통신하게 합니다. |
| TCP | reliable, in-order, byte-stream 전송을 제공하고 sequence, ACK, retransmission, window를 사용합니다. |
| UDP | 연결 설정과 재전송 없이 datagram을 보내며 신뢰성은 애플리케이션이나 상위 프로토콜이 보완합니다. |
| DNS | 도메인 이름을 IP 주소로 변환하는 계층적 분산 시스템입니다. TTL cache가 성능과 전파 지연을 만듭니다. |
| TLS | 인증서 검증과 키 교환 후 대칭키 암호화로 기밀성, 무결성, 서버 인증을 제공합니다. |
| Load Balancer | health check로 정상 backend를 고르고 알고리즘에 따라 트래픽을 분산합니다. |
| CDN | 사용자 가까운 edge에서 콘텐츠를 cache해 latency와 origin 부하를 줄입니다. |
| Timeout | 연결·읽기·전체 요청 시간을 제한해 장애 전파와 thread/connection 고갈을 막습니다. |

## 면접 답변 프레임

네트워크 질문은 “프로토콜 이름”보다 **요청이 어느 계층에서 멈췄는지**를 기준으로 답하면 강합니다.

1. 이름 해석: domain을 DNS로 IP에 매핑하고 TTL cache 영향을 설명합니다.
2. 경로 선택: client, gateway, NAT, router, load balancer, server까지 packet이 이동하는 흐름을 말합니다.
3. 전송 보장: TCP/UDP 선택, handshake, retransmission, congestion/flow control을 붙입니다.
4. 보안 경계: TLS certificate, key exchange, SNI, ALPN, session resumption을 설명합니다.
5. 운영 실패: timeout, retry storm, connection pool 고갈, DNS cache, LB health check, CDN cache miss를 연결합니다.

## 1. 계층 모델과 요청 흐름

### OSI와 TCP/IP

면접에서는 OSI 7계층을 외우는 것보다 TCP/IP 계층으로 실제 요청을 설명하는 편이 실용적입니다.

| TCP/IP 계층 | 역할 | 예시 |
| --- | --- | --- |
| Application | 애플리케이션 프로토콜과 메시지 의미 | HTTP, DNS, SMTP |
| Transport | 프로세스 간 전송, port multiplexing | TCP, UDP, QUIC |
| Internet | host 간 datagram 전달과 routing | IP, ICMP |
| Link | 같은 네트워크 안의 frame 전달 | Ethernet, Wi-Fi, ARP |

핵심:

- 계층을 나누면 장애 위치를 좁힐 수 있습니다.
- HTTP 500은 application 문제일 수 있지만, timeout은 DNS, TCP, TLS, LB, backend 어디서든 생길 수 있습니다.
- TCP/IP는 하위 계층이 완벽하다고 가정하지 않고 상위 계층에서 필요한 보장을 추가합니다.

### URL 입력 후 흐름

```text
Browser
 -> DNS cache 확인
 -> Recursive resolver 질의
 -> IP 획득
 -> TCP handshake
 -> TLS handshake
 -> HTTP request
 -> Reverse proxy / Load balancer
 -> Application server
 -> DB / Cache / 외부 API
 -> HTTP response
```

답변할 때 빠뜨리기 쉬운 지점:

- browser, OS, resolver, CDN, application cache가 모두 개입할 수 있습니다.
- HTTPS라면 TCP 연결 이후 TLS handshake가 필요합니다.
- HTTP/2는 하나의 TCP 연결에서 여러 stream을 multiplexing할 수 있습니다.
- HTTP/3는 TCP가 아니라 QUIC 위에서 동작합니다.

### Encapsulation

애플리케이션 데이터는 계층을 내려가며 header가 붙습니다.

```text
HTTP message
 -> TCP segment
 -> IP packet/datagram
 -> Ethernet frame
```

수신 측은 반대로 header를 해석하며 상위 계층으로 데이터를 전달합니다.

면접 포인트:

- 각 계층은 자기 header를 보고 책임을 수행합니다.
- IP는 host까지, TCP/UDP port는 process까지 전달하는 데 관여합니다.
- payload 크기가 MTU를 넘으면 fragmentation 또는 segmentation 문제가 생길 수 있습니다.

## 2. IP, 라우팅, NAT

### IP의 역할

IP는 packet-switched network에서 datagram을 source에서 destination까지 전달하기 위한 주소 지정과 routing을 담당합니다.

| 개념 | 설명 |
| --- | --- |
| IP address | host/interface를 식별하는 논리 주소 |
| Subnet | 같은 network prefix를 공유하는 주소 범위 |
| CIDR | `/24`, `/16`처럼 prefix 길이로 network 범위를 표현하는 방식 |
| Gateway | 다른 network로 나가기 위한 next hop |
| Routing table | 목적지 prefix별 next hop/interface 선택 규칙 |
| TTL / Hop Limit | routing loop에서 packet이 무한히 돌지 않도록 수명을 제한 |
| MTU | 한 link에서 보낼 수 있는 최대 frame payload 크기 |

주의:

- IP는 end-to-end 신뢰성, 순서, 흐름 제어를 제공하지 않습니다.
- packet은 각 router에서 독립적으로 처리됩니다.
- 같은 연결의 packet도 network 상황에 따라 다른 경로를 지날 수 있습니다.

### IPv4와 IPv6

| 구분 | IPv4 | IPv6 |
| --- | --- | --- |
| 주소 길이 | 32bit | 128bit |
| 표기 | `192.0.2.10` | `2001:db8::1` |
| 주소 부족 대응 | NAT를 많이 사용 | 넓은 주소 공간 |
| header | variable length | fixed base header + extension header |
| fragmentation | router와 host가 가능 | source host 중심 |

면접에서는 “IPv6는 주소가 길다”에서 끝내지 말고 운영 차이를 말해야 합니다.

- NAT 의존도를 줄일 수 있습니다.
- dual stack 운영에서는 IPv4/IPv6 경로와 방화벽 정책을 모두 봐야 합니다.
- IPv6에서는 ICMPv6가 neighbor discovery, path MTU discovery 등에 중요합니다.

### Subnet과 CIDR

예시:

```text
10.0.1.0/24
network prefix: 10.0.1
host range: 10.0.1.1 ~ 10.0.1.254
```

핵심:

- subnet은 broadcast domain과 routing 단위를 나누는 데 쓰입니다.
- CIDR은 classful addressing보다 유연하게 주소 공간을 표현합니다.
- cloud VPC에서는 subnet, route table, security group, NAT gateway가 함께 동작합니다.

### ARP와 Gateway

같은 subnet 안이라도 IP만으로는 frame을 보낼 수 없습니다. Ethernet frame에는 MAC address가 필요합니다.

흐름:

1. 목적지 IP가 같은 subnet인지 확인합니다.
2. 같은 subnet이면 대상 IP의 MAC을 ARP로 찾습니다.
3. 다른 subnet이면 default gateway의 MAC을 ARP로 찾습니다.
4. frame은 gateway로 가고, gateway가 다음 hop으로 전달합니다.

면접 포인트:

- 목적지 서버가 다른 network에 있으면 client는 목적지 MAC이 아니라 gateway MAC으로 frame을 보냅니다.
- IP header의 destination IP는 최종 목적지로 유지되지만, link layer frame의 destination MAC은 hop마다 바뀝니다.

### NAT/NAPT

NAT는 private address와 public address를 변환합니다. NAPT는 port까지 변환해 여러 내부 host가 하나의 public IP를 공유하게 합니다.

```text
10.0.1.10:53120 -> NAT -> 203.0.113.7:40001 -> Internet
10.0.1.11:53120 -> NAT -> 203.0.113.7:40002 -> Internet
```

장점:

- IPv4 주소 부족을 완화합니다.
- 내부 주소 체계를 외부에 직접 노출하지 않습니다.

주의:

- NAT table이 connection tracking state를 가지므로 stateful 장비가 됩니다.
- port 고갈, idle timeout, long-lived connection 끊김이 생길 수 있습니다.
- inbound 연결은 port forwarding, load balancer, reverse proxy 같은 별도 구성이 필요합니다.

### DHCP

DHCP는 host가 네트워크 설정을 자동으로 받게 합니다.

```text
Discover -> Offer -> Request -> ACK
```

할당 정보:

- IP address
- subnet mask
- default gateway
- DNS server
- lease time

주의:

- lease가 만료되면 갱신이 필요합니다.
- 서버 환경에서는 고정 IP 또는 reservation을 사용하기도 합니다.

## 3. TCP와 UDP

### TCP가 제공하는 것

TCP는 애플리케이션에 reliable, in-order, byte-stream service를 제공합니다.

| 기능 | 설명 |
| --- | --- |
| Connection | 3-way handshake로 양쪽 상태를 설정 |
| Sequence Number | byte stream 순서와 손실 감지 |
| ACK | 수신자가 다음에 기대하는 sequence를 알림 |
| Retransmission | 손실로 판단한 segment를 재전송 |
| Flow Control | receiver window로 수신자 buffer 초과 방지 |
| Congestion Control | network 혼잡을 추정해 송신량 조절 |
| Port Multiplexing | 같은 host의 여러 process/service 구분 |

핵심:

- TCP는 message boundary가 아니라 byte stream을 제공합니다.
- 애플리케이션 protocol은 length prefix, delimiter, HTTP header 같은 방식으로 메시지 경계를 정해야 합니다.
- TCP가 보장하는 순서 때문에 앞 segment가 손실되면 뒤 segment가 도착해도 application 전달이 막힐 수 있습니다.

### 3-way Handshake

```text
Client -> Server: SYN
Server -> Client: SYN + ACK
Client -> Server: ACK
```

목적:

- 양쪽이 송수신 가능한지 확인합니다.
- 초기 sequence number를 교환합니다.
- connection state를 생성합니다.

장애 포인트:

- SYN packet이 방화벽에서 막히면 connection timeout이 납니다.
- server backlog가 가득 차면 연결 수립이 지연되거나 실패할 수 있습니다.
- SYN flood는 half-open connection 자원을 소모시킬 수 있습니다.

### 연결 종료와 TIME_WAIT

TCP 종료는 일반적으로 FIN/ACK 교환으로 이루어집니다.

```text
Client -> Server: FIN
Server -> Client: ACK
Server -> Client: FIN
Client -> Server: ACK
```

TIME_WAIT가 필요한 이유:

- 마지막 ACK가 유실됐을 때 재전송 FIN에 응답할 수 있습니다.
- 이전 연결의 지연 segment가 새 연결에 섞이는 위험을 줄입니다.

실무 포인트:

- 짧은 연결을 대량으로 만들면 TIME_WAIT socket이 많이 생길 수 있습니다.
- HTTP Keep-Alive와 connection pooling은 연결 생성/종료 비용을 줄입니다.

### Flow Control과 Congestion Control

| 구분 | 목적 | 기준 |
| --- | --- | --- |
| Flow Control | 수신자 buffer 보호 | receiver window |
| Congestion Control | 네트워크 혼잡 완화 | loss, RTT, congestion window |

혼동하면 안 되는 지점:

- 수신자가 느린 문제와 네트워크가 혼잡한 문제는 다릅니다.
- 처리 속도가 느린 application은 receive buffer를 비우지 못해 window를 줄일 수 있습니다.
- packet loss는 무선 품질, queue overflow, 혼잡, 장비 문제 등 다양한 원인이 있습니다.

### Nagle, Delayed ACK, TCP_NODELAY

Nagle algorithm은 작은 segment를 너무 많이 보내지 않도록 모아서 보냅니다.

| 상황 | 고려 |
| --- | --- |
| 작은 메시지를 자주 보냄 | Nagle이 latency를 늘릴 수 있음 |
| bulk transfer | segment 수를 줄여 효율적일 수 있음 |
| interactive/RPC | `TCP_NODELAY` 검토 |

주의:

- Delayed ACK와 Nagle이 만나면 작은 request/response에서 지연이 커질 수 있습니다.
- 무조건 끄는 것이 아니라 payload 크기, latency 요구, 전송 패턴을 보고 결정합니다.

### Keep-Alive

| 구분 | 의미 | 목적 |
| --- | --- | --- |
| HTTP Keep-Alive | 여러 HTTP 요청이 TCP 연결을 재사용 | handshake 비용 감소 |
| TCP Keep-Alive | 유휴 TCP 연결이 살아 있는지 probe | half-open connection 감지 |
| Application heartbeat | 애플리케이션 레벨 ping/pong | 업무 의미에 맞는 liveness 확인 |

주의:

- TCP 자체는 연결 상대가 갑자기 사라진 것을 즉시 알지 못할 수 있습니다.
- NAT, load balancer, firewall의 idle timeout보다 keepalive/heartbeat 주기를 짧게 잡아야 연결이 유지됩니다.

### UDP

UDP는 연결 설정 없이 datagram을 보냅니다.

| 장점 | 단점 |
| --- | --- |
| handshake 비용이 낮음 | 손실, 중복, 순서 바뀜 가능 |
| header가 단순함 | 혼잡 제어를 직접 고려해야 함 |
| multicast/broadcast에 적합 | 신뢰성이 필요하면 상위 계층 구현 필요 |

사용 예:

- DNS
- 실시간 음성/영상
- 게임
- QUIC
- service discovery

면접 포인트:

- UDP가 “항상 빠르다”는 말은 부정확합니다.
- 재전송, 순서 보장, 혼잡 제어를 애플리케이션에서 구현하면 비용이 생깁니다.
- 낮은 latency나 head-of-line blocking 회피가 더 중요할 때 선택할 수 있습니다.

### QUIC

QUIC은 UDP 위에서 동작하는 multiplexed, secure transport입니다.

| 구분 | TCP + TLS + HTTP/2 | QUIC + HTTP/3 |
| --- | --- | --- |
| 전송 기반 | TCP | UDP |
| 암호화 | TLS 별도 handshake | TLS 1.3 통합 |
| stream multiplexing | TCP 연결 하나 안에서 multiplexing | QUIC stream 단위 multiplexing |
| HOL blocking | TCP packet loss가 모든 stream에 영향 | stream 단위 영향으로 완화 |
| 연결 식별 | 4-tuple 중심 | connection ID 사용 |

주의:

- QUIC도 혼잡 제어와 손실 복구가 필요합니다.
- UDP 차단 또는 rate limit 환경에서는 fallback이 필요할 수 있습니다.

## 4. DNS

### DNS가 하는 일

DNS는 사람이 읽는 domain name을 IP 주소와 여러 resource record로 변환하는 분산 database입니다.

| Record | 의미 |
| --- | --- |
| A | domain -> IPv4 |
| AAAA | domain -> IPv6 |
| CNAME | alias |
| MX | mail server |
| NS | authoritative name server |
| TXT | 검증, SPF, DKIM 등 텍스트 정보 |
| SRV | service 위치 |

### 질의 흐름

```text
Browser/OS cache
 -> Recursive resolver
 -> Root name server
 -> TLD name server
 -> Authoritative name server
 -> Recursive resolver cache
 -> Client
```

핵심:

- root server는 최종 IP를 주는 것이 아니라 TLD server 위치를 알려줍니다.
- authoritative server가 해당 zone의 권한 있는 답을 제공합니다.
- recursive resolver는 결과를 TTL 동안 cache합니다.

### Recursive vs Iterative

| 구분 | 의미 |
| --- | --- |
| Recursive query | resolver가 최종 답을 찾아 client에게 반환 |
| Iterative query | 한 서버가 다음에 물어볼 서버를 알려줌 |

일반 사용자는 ISP, public DNS, 사내 DNS 같은 recursive resolver에 물어봅니다.

### TTL과 Cache

TTL은 DNS 응답을 cache할 수 있는 시간입니다.

장점:

- 반복 질의를 줄입니다.
- latency를 낮춥니다.
- authoritative DNS 부하를 줄입니다.

주의:

- IP 변경 전파가 TTL만큼 지연될 수 있습니다.
- 장애 failover를 DNS만으로 처리하면 resolver cache 때문에 즉시 전환이 안 될 수 있습니다.
- 너무 낮은 TTL은 DNS 부하와 lookup latency를 늘릴 수 있습니다.

### DNS는 UDP인가 TCP인가

일반 DNS 질의는 UDP 53번을 우선 사용합니다.

TCP를 사용하는 경우:

- 응답이 커서 UDP로 처리하기 어려운 경우
- zone transfer
- DNS over TCP/TLS/HTTPS 같은 구성

면접 답변:

> DNS는 보통 UDP를 사용하지만 TCP도 사용합니다. 단순히 "DNS는 UDP"라고 말하면 예외를 놓친 답변입니다.

### DNS 장애 패턴

| 증상 | 가능한 원인 |
| --- | --- |
| 특정 사용자만 접속 실패 | 지역 resolver cache, ISP DNS 문제 |
| 새 IP로 전환이 늦음 | TTL cache |
| 간헐적 timeout | recursive resolver 지연, authoritative 장애 |
| 도메인은 되지만 HTTPS 실패 | DNS는 정상, TLS certificate/SNI 문제 |
| CDN 일부 지역 장애 | geo DNS, edge health 문제 |

## 5. TLS와 HTTPS

### TLS가 제공하는 것

TLS는 transport 위에서 application data를 보호합니다.

| 속성 | 설명 |
| --- | --- |
| Server Authentication | 인증서로 서버 신원 검증 |
| Confidentiality | 대칭키 암호화로 내용 보호 |
| Integrity | 변조 감지 |
| Key Exchange | session key 안전하게 합의 |
| Forward Secrecy | 장기 private key 유출 시 과거 통신 보호 범위 확대 |

HTTPS는 HTTP 메시지를 TLS로 보호하는 구성입니다.

```text
HTTP
TLS
TCP
IP
```

HTTP/3에서는 TLS 1.3이 QUIC에 통합됩니다.

### TLS Handshake

TLS 1.3 기준 단순화 흐름:

```text
ClientHello
ServerHello
EncryptedExtensions
Certificate
CertificateVerify
Finished
Application Data
```

핵심:

- client는 지원 cipher suite, key share, SNI, ALPN 등을 보냅니다.
- server는 인증서와 key exchange 정보를 보냅니다.
- 양쪽은 handshake 결과로 application data를 암호화할 대칭키를 얻습니다.

### 인증서 검증

Client가 확인하는 것:

- 인증서의 subject/SAN이 접속한 hostname과 맞는가?
- 인증서가 신뢰할 수 있는 CA chain으로 이어지는가?
- 유효 기간이 지나지 않았는가?
- 폐기 여부를 확인할 수 있는가?
- key usage와 algorithm이 정책에 맞는가?

운영 장애:

- certificate 만료
- intermediate certificate 누락
- SNI 미설정으로 기본 인증서 반환
- hostname mismatch
- 오래된 TLS version/cipher만 지원하는 client

### SNI와 ALPN

| 확장 | 역할 |
| --- | --- |
| SNI | 하나의 IP에서 여러 hostname certificate를 고르기 위해 client가 hostname을 전달 |
| ALPN | TLS handshake 중 HTTP/1.1, HTTP/2 같은 application protocol 협상 |

면접 포인트:

- SNI가 없으면 reverse proxy/CDN이 어떤 인증서를 줄지 결정하기 어렵습니다.
- ALPN 협상 결과에 따라 HTTP/2 사용 여부가 결정됩니다.

### Session Resumption과 0-RTT

TLS handshake는 비용이 크므로, 재접속 시 session resumption으로 이를 줄일 수 있습니다.

주의:

- 0-RTT는 replay risk가 있어 멱등하지 않은 요청에는 신중해야 합니다.
- resumption은 인증서 검증과 key exchange 비용을 줄이지만 보안 정책과 ticket lifetime을 함께 봐야 합니다.

## 6. Load Balancing, Proxy, CDN

### L4와 L7 Load Balancing

| 구분 | 기준 | 장점 | 주의 |
| --- | --- | --- | --- |
| L4 | IP, port, TCP/UDP connection | 빠르고 단순 | HTTP header/path 기반 routing 어려움 |
| L7 | HTTP host, path, header, cookie | 세밀한 routing | application layer 처리 비용 증가 |

알고리즘:

- round robin
- least connections
- weighted round robin
- consistent hashing
- latency 기반
- locality 기반

Health check:

- TCP port open만 볼 수 있습니다.
- HTTP `/health`로 application 상태를 볼 수 있습니다.
- DB까지 health check에 포함할지 기준을 정해야 합니다.

주의:

- 너무 무거운 health check는 장애 시 부하를 더 키울 수 있습니다.
- liveness와 readiness를 분리해야 배포 중 traffic 유입을 제어할 수 있습니다.

### Session Affinity

상태를 서버 메모리에 저장하면 load balancing에서 문제가 생깁니다.

해결 방법:

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| Sticky session | 구현이 쉬움 | 특정 서버 쏠림, 장애 시 session 손실 |
| Session clustering | 서버 간 session 공유 | 복잡도와 동기화 비용 |
| External session store | scale-out에 유리 | Redis 같은 외부 저장소 의존 |
| Stateless token | 서버 상태 감소 | 탈취, 만료, revoke 설계 필요 |

면접에서는 session affinity보다 상태 외부화나 stateless 설계를 우선 검토한다고 답하는 편이 좋습니다.

### Forward Proxy와 Reverse Proxy

| 구분 | 위치 | 목적 |
| --- | --- | --- |
| Forward Proxy | client 앞 | client 대리, 접근 제어, 익명화, 사내 egress 통제 |
| Reverse Proxy | server 앞 | server 대리, TLS termination, routing, compression, caching |

예시:

- forward proxy: 회사 내부에서 외부 인터넷 접근 통제
- reverse proxy: Nginx, Envoy, CDN, API gateway

### TLS Termination

Reverse proxy나 load balancer에서 TLS를 종료할 수 있습니다.

장점:

- application server의 인증서/암호화 부담 감소
- 중앙에서 TLS 정책 관리
- L7 routing 가능

주의:

- LB와 backend 사이 구간 암호화 여부를 결정해야 합니다.
- `X-Forwarded-For`, `X-Forwarded-Proto`, `Forwarded` header를 신뢰할 범위를 제한해야 합니다.
- client IP 기반 보안 로직은 proxy chain을 고려해야 합니다.

### CDN

CDN은 사용자 가까운 edge에서 콘텐츠를 제공합니다.

장점:

- latency 감소
- origin server 부하 감소
- 대용량 정적 리소스 전송 최적화
- DDoS 흡수와 TLS termination 보조

캐시 설계:

| 요소 | 설명 |
| --- | --- |
| Cache-Control | browser/CDN cache 정책 |
| TTL | edge에 보관할 시간 |
| Invalidation | 배포 후 기존 cache 제거 |
| Versioned URL | 파일명/hash 변경으로 새 리소스 배포 |
| Vary | header별 cache key 분리 |

주의:

- 개인화 응답을 잘못 cache하면 개인정보가 노출될 수 있습니다.
- cookie나 authorization header가 cache key에 영향을 주는지 확인해야 합니다.
- stale cache와 origin 장애 fallback 정책을 정해야 합니다.

## 7. Timeout, Retry, 장애 진단

### Timeout 종류

| 종류 | 의미 |
| --- | --- |
| DNS timeout | name resolution 대기 시간 |
| Connection timeout | TCP 연결 수립까지 허용하는 시간 |
| TLS handshake timeout | TLS 협상 완료까지 허용하는 시간 |
| Read timeout | 요청 후 응답 byte를 기다리는 시간 |
| Write timeout | request body 전송 대기 시간 |
| Idle timeout | 유휴 연결을 유지하는 시간 |
| Overall deadline | 전체 작업의 최대 허용 시간 |

실무 원칙:

- timeout이 없으면 장애 서비스 때문에 thread와 connection이 고갈될 수 있습니다.
- connect timeout과 read timeout은 다르게 잡습니다.
- client timeout은 server 처리 timeout보다 짧거나 길 때 각각 다른 실패 양상을 만듭니다.
- load balancer idle timeout과 application keepalive 설정을 맞춰야 합니다.

### Retry와 Backoff

Retry는 일시적 장애를 숨길 수 있지만 장애를 키울 수도 있습니다.

필수 조건:

- timeout
- retry 횟수 제한
- exponential backoff
- jitter
- idempotency
- circuit breaker 또는 rate limit

주의:

- POST, 결제, 주문 생성처럼 side effect가 있는 요청은 idempotency key가 필요합니다.
- 모든 client가 동시에 retry하면 retry storm이 됩니다.
- 이미 server에서 처리됐지만 response만 유실된 경우를 고려해야 합니다.

### Latency를 나눠서 보기

```text
total latency
 = DNS lookup
 + TCP connect
 + TLS handshake
 + request upload
 + server processing
 + queueing
 + response download
```

진단 도구:

| 도구 | 보는 것 |
| --- | --- |
| `dig`, `nslookup` | DNS 응답과 TTL |
| `ping` | ICMP reachability와 RTT, 단 방화벽 영향 있음 |
| `traceroute`, `mtr` | hop별 경로와 지연 |
| `curl -v` | DNS, TCP, TLS, HTTP 흐름 |
| `tcpdump`, Wireshark | packet level 증거 |
| access log | request/response 상태 |
| metric/tracing | 구간별 latency와 error rate |

### 자주 나오는 장애 패턴

| 증상 | 가능한 원인 | 확인 |
| --- | --- | --- |
| connection timeout | 방화벽, routing, server down, SYN drop | `curl -v`, security group, route table |
| connection refused | host는 도달했지만 port listen 안 함 | server listen socket, service 상태 |
| TLS handshake failure | certificate, SNI, cipher, protocol mismatch | `openssl s_client`, LB TLS 설정 |
| 간헐적 502/503 | backend health, LB timeout, deploy 중 readiness | LB target 상태, application log |
| read timeout | backend 처리 지연, DB/API 지연, packet loss | tracing, server metric |
| 특정 지역만 장애 | DNS/CDN/ISP/edge 문제 | resolver별 `dig`, CDN status |
| 대량 CLOSE_WAIT | application이 socket close를 안 함 | process socket 상태, thread dump |
| 대량 TIME_WAIT | 짧은 outbound connection 과다 | connection pooling, keepalive |

## 8. 실전 면접 Q&A

### 요청 흐름 / 계층

| 질문 | 답변 핵심 |
| --- | --- |
| URL을 입력하면 어떤 일이 일어나는가? | DNS로 IP를 얻고 TCP/TLS 연결을 만든 뒤 HTTP 요청이 LB/proxy를 거쳐 application server로 갑니다. |
| OSI 7계층을 왜 나누는가? | 각 계층의 책임을 분리해 구현과 장애 진단을 단순화하기 위해서입니다. |
| IP와 TCP의 역할 차이는? | IP는 host 간 datagram 전달, TCP는 process 간 reliable byte stream을 담당합니다. |
| port는 왜 필요한가? | 같은 host 안에서 여러 application process/service로 traffic을 multiplexing하기 위해서입니다. |

### IP / 라우팅 / NAT

| 질문 | 답변 핵심 |
| --- | --- |
| subnet과 gateway는 무엇인가? | subnet은 같은 network prefix 범위이고 gateway는 다른 network로 나가는 next hop입니다. |
| 같은 subnet이 아니면 packet은 어디로 가는가? | 최종 목적지 IP는 유지한 채 link layer에서는 default gateway MAC으로 frame을 보냅니다. |
| NAT와 NAPT 차이는? | NAT는 IP 변환, NAPT는 IP와 port를 함께 변환해 여러 내부 host가 public IP를 공유하게 합니다. |
| NAT의 단점은? | connection tracking state, port 고갈, idle timeout, inbound 연결 복잡도가 생깁니다. |

### TCP / UDP

| 질문 | 답변 핵심 |
| --- | --- |
| TCP 3-way handshake 목적은? | 양쪽 송수신 가능성과 초기 sequence number를 확인하고 connection state를 만들기 위해서입니다. |
| TCP가 신뢰성을 보장하는 방법은? | sequence number, ACK, checksum, retransmission, flow/congestion control을 사용합니다. |
| TCP는 메시지 단위를 보장하나? | 아닙니다. byte stream이므로 application protocol이 메시지 경계를 정의해야 합니다. |
| TIME_WAIT는 왜 필요한가? | 마지막 ACK 재전송 대응과 이전 연결 segment가 새 연결에 섞이는 위험을 줄이기 위해서입니다. |
| UDP는 언제 쓰나? | 낮은 지연, 단순 질의, 실시간성, QUIC처럼 상위 계층이 보장을 직접 설계하는 경우에 씁니다. |
| HTTP/3가 TCP가 아닌 이유는? | QUIC/UDP 위에서 stream 단위 multiplexing과 TLS 통합으로 TCP HOL blocking을 줄이기 위해서입니다. |

### DNS / TLS

| 질문 | 답변 핵심 |
| --- | --- |
| DNS 질의 흐름은? | recursive resolver가 root, TLD, authoritative server를 따라가 최종 record를 얻고 TTL 동안 cache합니다. |
| DNS는 UDP만 쓰나? | 일반 질의는 UDP가 많지만 큰 응답, zone transfer, DNS over TCP/TLS/HTTPS에서는 TCP도 씁니다. |
| TTL을 낮추면 좋은가? | 전환은 빨라지지만 DNS 부하와 lookup latency가 증가할 수 있습니다. |
| TLS가 제공하는 것은? | 서버 인증, 암호화, 무결성, key exchange를 제공합니다. |
| SNI는 왜 필요한가? | 하나의 IP에서 여러 hostname 인증서를 제공할 때 client가 접속 hostname을 알려주기 위해서입니다. |
| ALPN은 무엇인가? | TLS handshake 중 HTTP/1.1, HTTP/2 같은 application protocol을 협상하는 확장입니다. |

### LB / CDN / 장애

| 질문 | 답변 핵심 |
| --- | --- |
| L4와 L7 load balancer 차이는? | L4는 IP/port/connection 기준, L7은 HTTP host/path/header 같은 application 정보 기준으로 분산합니다. |
| sticky session의 단점은? | 특정 서버 쏠림과 장애 시 session 손실이 생기므로 상태 외부화나 stateless 설계를 검토합니다. |
| reverse proxy 역할은? | TLS termination, routing, compression, caching, access control, backend 보호를 담당합니다. |
| CDN 도입 시 주의점은? | TTL, invalidation, cache key, 개인정보 cache, origin 장애 fallback을 설계해야 합니다. |
| connection timeout과 read timeout 차이는? | connection timeout은 연결 수립 대기, read timeout은 연결 후 응답 data 대기입니다. |
| retry를 안전하게 하려면? | timeout, 횟수 제한, exponential backoff, jitter, idempotency key가 필요합니다. |
| 502와 504 차이는? | 502는 upstream으로부터 잘못된 응답, 504는 upstream 응답 시간 초과로 보는 경우가 많습니다. |

## 참고한 공식 문서

- RFC 791 Internet Protocol: https://www.rfc-editor.org/rfc/rfc791.html
- RFC 8200 Internet Protocol, Version 6: https://www.rfc-editor.org/rfc/rfc8200.html
- RFC 768 User Datagram Protocol: https://www.rfc-editor.org/rfc/rfc768.html
- RFC 9293 Transmission Control Protocol: https://www.rfc-editor.org/rfc/rfc9293.html
- RFC 1034 Domain Names - Concepts and Facilities: https://www.rfc-editor.org/rfc/rfc1034.html
- RFC 1035 Domain Names - Implementation and Specification: https://www.rfc-editor.org/rfc/rfc1035.html
- RFC 2131 Dynamic Host Configuration Protocol: https://www.rfc-editor.org/rfc/rfc2131.html
- RFC 8446 The Transport Layer Security Protocol Version 1.3: https://www.rfc-editor.org/rfc/rfc8446.html
- RFC 9000 QUIC - A UDP-Based Multiplexed and Secure Transport: https://www.rfc-editor.org/rfc/rfc9000.html
