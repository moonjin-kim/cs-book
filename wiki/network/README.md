# 네트워크

네트워크는 "요청이 어디서 지연되거나 실패했는지"를 좁혀가기 위한 계층적 사고방식입니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| OSI/TCP-IP | 각 계층의 책임이 무엇이고 장애를 어떻게 분리하는가? |
| 회선 교환/패킷 교환 | 전용 경로를 미리 점유하는 방식과 패킷 단위 공유 방식은 어떻게 다른가? |
| IP와 라우팅 | 패킷은 목적지까지 어떤 기준으로 이동하는가? |
| IP 주소 체계 | classful, classless, subnet mask, CIDR은 무엇을 해결하는가? |
| DHCP | Discover, Offer, Request, ACK로 IP를 어떻게 임대하는가? |
| NAT/NAPT | 사설 IP는 어떻게 공인 인터넷과 통신하는가? |
| TCP | 3-way handshake, 재전송, 흐름 제어, 혼잡 제어는 왜 필요한가? |
| DNS | recursive resolver, root, TLD, authoritative server는 어떤 역할인가? |
| Keep-Alive | HTTP 연결 재사용과 TCP 생존 확인은 어떻게 다른가? |
| CDN | edge cache, push/pull, TTL, invalidation을 어떻게 설계하는가? |
| 로드밸런싱 | L4/L7, 라운드 로빈, 최소 연결, IP 해시를 언제 쓰는가? |
| Timeout | connection, socket, read timeout은 각각 어떤 대기를 제한하는가? |

## 회선 교환과 패킷 교환

회선 교환 방식은 통신 전에 특정 사용자 사이의 전용 경로를 미리 설정하고, 해당 회선을 통해 메시지를 주고받는 방식입니다. 전송량이 일정하고 안정적이지만, 데이터를 보내지 않는 순간에도 회선을 점유하므로 이용 효율이 낮습니다. 유선 전화망이 대표적인 예입니다.

패킷 교환 방식은 메시지를 작은 패킷으로 나누어 보내고 목적지에서 다시 조립합니다. 라우터는 각 패킷을 목적지로 전달하며, 경로는 상황에 따라 달라질 수 있습니다. 네트워크 자원을 전송 중에만 공유해 효율이 높지만, 라우팅 지연과 헤더 오버헤드가 발생합니다.

## DNS

DNS는 도메인 이름에 대응되는 IP 주소를 관리하고 질의하는 계층적 분산 시스템입니다. 도메인 주소는 사람이 기억하기 쉽고, IP 주소 변경을 서비스 이름 뒤에 숨길 수 있습니다.

DNS 질의에는 보통 다음 서버들이 등장합니다.

| 서버 | 역할 |
| --- | --- |
| Local Name Server | 클라이언트와 가까운 resolver. 통신사 DNS, Google DNS 등이 해당 |
| Root Name Server | root domain을 관리하고 TLD name server 위치를 알려줌 |
| TLD Name Server | `.com`, `.kr`, `.net` 같은 최상위 도메인을 관리 |
| Authoritative Name Server | 특정 도메인의 실제 record를 관리 |

`api.example.com`을 조회할 때 local name server에 캐시가 없으면 root → TLD → authoritative name server 순서로 질의해 최종 IP를 얻고, 이를 클라이언트에 응답합니다.

## 정적 IP, 동적 IP, DHCP

정적 IP 할당은 호스트의 IP 주소, subnet mask, gateway, DNS 주소를 수동으로 설정하는 방식입니다. 서버처럼 주소가 고정되어야 하는 대상에 적합하지만, 호스트 수가 많아지면 관리 비용과 중복 설정 위험이 커집니다.

동적 IP 할당은 DHCP를 이용해 현재 사용하지 않는 IP를 일정 기간 임대하는 방식입니다. DHCP 과정은 DORA로 요약할 수 있습니다.

| 단계 | 설명 |
| --- | --- |
| Discover | 호스트가 DHCP 서버를 찾기 위해 broadcast |
| Offer | DHCP 서버가 할당 가능한 IP와 임대 기간을 제안 |
| Request | 호스트가 제안받은 IP 사용을 요청 |
| ACK | DHCP 서버가 임대를 승인 |

임대 기간이 끝나기 전에는 DHCP lease renewal로 임대를 갱신할 수 있습니다.

## NAT와 NAPT

공인 IP는 전 세계에서 고유하지만, 사설 IP는 특정 사설 네트워크 안에서만 유효합니다. 사설 IP만으로는 외부 인터넷과 직접 통신하기 어려우므로 라우터는 NAT를 통해 사설 IP를 공인 IP로 변환합니다.

일반적으로는 공인 IP 하나에 여러 사설 IP를 매핑해야 하므로 NAPT를 사용합니다. NAPT는 IP 주소뿐 아니라 port까지 함께 변환 테이블에 기록합니다.

| Private IP | Private Port | Public IP | Public Port |
| --- | --- | --- | --- |
| 192.168.10.2 | 8000 | 1.2.3.4 | 8001 |
| 192.168.10.3 | 8000 | 1.2.3.4 | 8002 |

## Classful, Classless, CIDR

IPv4 주소는 32비트이며 보통 1바이트씩 끊어 4개의 octet으로 표기합니다.

Classful addressing은 IP 주소를 A, B, C 같은 고정 크기 class로 나누는 방식입니다.

| Class | 시작 비트 | 네트워크 주소 | 호스트 주소 | 특징 |
| --- | --- | --- | --- | --- |
| A | `0` | 1 octet | 3 octet | 큰 네트워크에 적합 |
| B | `10` | 2 octet | 2 octet | 중간 크기 네트워크 |
| C | `110` | 3 octet | 1 octet | 작은 네트워크 |

Classful 방식은 네트워크 크기가 고정되어 IP 낭비가 큽니다. Classless addressing은 subnet mask로 네트워크 주소와 호스트 주소를 구분합니다. CIDR은 `IP 주소/네트워크 비트 수` 형식으로 표기합니다. 예를 들어 `168.168.168.168/24`는 subnet mask가 `255.255.255.0`인 네트워크를 의미합니다.

## TCP 3-way Handshake

TCP 3-way handshake는 연결 지향 통신을 시작하기 위해 클라이언트와 서버가 세 개의 segment를 교환하는 과정입니다.

1. 클라이언트가 `SYN`을 보내 연결을 요청합니다. 초기 sequence number와 window size가 포함됩니다.
2. 서버가 요청을 수락하고 `SYN + ACK`를 보냅니다. 서버의 초기 sequence number와 클라이언트 sequence number에 대한 ACK가 포함됩니다.
3. 클라이언트가 서버 sequence number에 대한 `ACK`를 보내면 연결이 수립됩니다.

이후부터 양쪽은 sequence number와 ACK를 기반으로 신뢰성 있는 데이터 전송을 수행합니다.

## Keep-Alive

Keep-Alive는 연결을 계속 유지하거나 재사용하기 위한 설정입니다.

HTTP Keep-Alive는 하나의 TCP connection으로 여러 HTTP 요청과 응답을 주고받게 합니다. HTTP/1.0에서는 요청마다 연결을 열고 닫는 방식이 일반적이었지만, HTTP/1.1부터는 persistent connection이 기본입니다.

TCP Keep-Alive는 connection이 유휴 상태일 때 주기적으로 packet을 보내 상대가 살아 있는지 확인합니다.

| 구분 | 목적 | 동작 |
| --- | --- | --- |
| HTTP Keep-Alive | HTTP 요청/응답의 TCP connection 재사용 | timeout 동안 connection을 유지 |
| TCP Keep-Alive | 유휴 TCP connection 생존 확인 | 주기적 probe packet 전송 |

장점은 handshake 비용과 RTT를 줄이고 CPU/메모리 소비를 줄이는 것입니다. 단점은 유휴 연결도 socket을 점유하므로 timeout 설정이 나쁘면 리소스 낭비나 DoS 위험이 커집니다.

## CDN

CDN은 전 세계에 분산된 edge server가 사용자와 가까운 위치에서 콘텐츠를 제공하는 네트워크입니다. 정적 콘텐츠뿐 아니라 일부 동적 콘텐츠에도 활용되며, 원본 서버 부하를 줄이고 latency를 낮춥니다.

| 방식 | 설명 | 주의점 |
| --- | --- | --- |
| Push | 원본이 미리 CDN으로 콘텐츠를 전달 | 정확한 시점에 배포 가능하지만 관리 비용이 큼 |
| Pull | CDN miss 시 원본에서 가져와 cache | 초기 요청은 느릴 수 있음 |

CDN 도입 시에는 비용, TTL, 장애 시 fallback, cache invalidation을 반드시 고려해야 합니다. 무효화는 CDN API를 쓰거나, 파일명에 version hash를 넣는 object versioning으로 처리할 수 있습니다.

## 로드밸런싱

로드밸런싱은 애플리케이션 서버 앞에서 들어오는 트래픽을 여러 서버로 분산해 가용성, 확장성, 보안, 성능을 확보하는 기법입니다.

| 알고리즘 | 설명 | 적합한 상황 |
| --- | --- | --- |
| Round Robin | 서버에 순서대로 요청 전달 | 서버 성능이 비슷하고 단순 분산이 필요할 때 |
| Weighted Round Robin | 서버별 가중치에 따라 더 많은 요청 전달 | 서버 처리 능력이 다를 때 |
| Least Connections | 활성 연결 수가 가장 적은 서버 선택 | 연결 시간이 들쭉날쭉할 때 |
| Weighted Least Connections | 연결 수와 서버 가중치를 함께 고려 | 서버 성능이 다르고 연결 수 차이가 중요할 때 |
| Least Response Time | 응답 시간이 가장 빠른 서버 선택 | 응답 시간 모니터링이 가능할 때 |
| IP Hash | 클라이언트 IP hash로 서버 선택 | session affinity가 필요할 때 |

## Timeout

타임아웃은 외부 요청이 무한정 길어져 thread, connection, memory 같은 리소스를 잡고 있는 상황을 막기 위한 안전장치입니다.

| Timeout | 의미 |
| --- | --- |
| Connection Timeout | TCP 3-way handshake가 제한 시간 안에 완료되지 않을 때 |
| Socket Timeout | 연결 후 다음 packet을 일정 시간 안에 받지 못할 때 |
| Read Timeout | 연결 후 read I/O 작업이 제한 시간 안에 완료되지 않을 때 |

타임아웃은 장애 전파를 줄이는 핵심 설정입니다. 테스트는 지연 응답을 내는 가상 서버로 할 수 있지만, 자동화 테스트 시간이 늘어나는 비용과 얻는 보장을 비교해 결정해야 합니다.

## 자주 연결되는 주제

- Web/HTTP: HTTP 요청은 TCP/TLS 위에서 동작합니다.
- Security: TLS는 전송 구간 보안의 기본입니다.
- DevOps/Cloud: 로드밸런싱, health check, timeout은 운영 설정과 직접 연결됩니다.

