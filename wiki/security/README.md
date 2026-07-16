# Security

보안 면접은 **인증과 인가를 분리하고, 입력·출력·상태·암호·운영 경계에서 어떤 위협을 어떤 통제로 줄이는지**를 설명하는 것이 핵심입니다.

처음부터 끝까지 외우기보다 아래 핵심 섹션 단위로 나눠 보는 편이 효율적입니다.

## 핵심 섹션 맵

| 우선순위 | 섹션 | 먼저 답할 수 있어야 하는 질문 |
| --- | --- | --- |
| 1 | 인증과 인가 | Authentication, Authorization, principal, role, permission, object-level authorization을 구분할 수 있는가? |
| 2 | Session, Cookie, JWT | 세션과 토큰의 폐기, 탈취, 만료, refresh, cookie 보안 속성 trade-off는 무엇인가? |
| 3 | 암호화, TLS, 비밀번호 저장 | 암호화·해시·서명·MAC을 구분하고 password hashing을 왜 느리게 해야 하는가? |
| 4 | 입력 처리와 Injection | SQL/Command/NoSQL Injection, XSS, SSRF가 입력을 어떻게 악용하는지 설명할 수 있는가? |
| 5 | 브라우저 보안 | CORS, CSRF, SameSite, CSP, Clickjacking이 브라우저 경계에서 어떤 문제를 막는가? |
| 6 | OWASP Top 10과 설계 보안 | Broken Access Control, Misconfiguration, Supply Chain, Insecure Design을 실무 사례로 설명할 수 있는가? |
| 7 | API·운영 보안 | Rate limit, logging/alerting, secret 관리, dependency 관리, error handling을 운영 관점으로 설명할 수 있는가? |
| 8 | 실전 면접 Q&A | 짧은 답변으로 JWT, CSRF, XSS, SQL Injection, TLS, 비밀번호 저장 질문을 빠르게 복습할 수 있는가? |

## 빠른 요약

| 주제 | 핵심 답변 |
| --- | --- |
| 인증 | 사용자가 누구인지 확인합니다. 비밀번호, MFA, OAuth/OIDC, client certificate 등이 사용됩니다. |
| 인가 | 인증된 주체가 특정 resource/action을 수행할 권한이 있는지 판단합니다. |
| Access Control | 서버에서 매 요청마다 deny-by-default, least privilege, object ownership 검증을 수행해야 합니다. |
| Session | 서버가 상태를 저장하고 client에는 예측 불가능한 session id만 전달합니다. |
| JWT | JSON claim을 서명한 compact token입니다. Payload는 암호화가 아니며 만료, audience, issuer, key rotation이 중요합니다. |
| TLS | 서버 인증, 키 교환, 암호화, 무결성으로 전송 구간을 보호합니다. |
| Password Hashing | salt와 Argon2id/bcrypt/scrypt/PBKDF2 같은 느린 hash로 offline cracking 비용을 높입니다. |
| Injection | 입력이 query, command, template, parser 구조를 바꾸는 취약점입니다. |
| XSS | 신뢰하지 못한 데이터가 브라우저에서 script로 실행되는 취약점입니다. |
| CSRF | cookie 자동 전송을 악용해 사용자가 의도하지 않은 상태 변경 요청을 보내게 합니다. |
| SSRF | 서버가 공격자가 지정한 내부/외부 URL로 요청을 보내게 하는 취약점입니다. |
| Security Logging | 공격 탐지와 사고 대응을 위해 인증, 권한 실패, 민감 작업을 구조적으로 기록합니다. |

## 면접 답변 프레임

보안 질문은 “막는다”가 아니라 **위협 모델, 신뢰 경계, 통제, 잔여 위험** 순서로 답해야 합니다.

1. 자산과 경계: 보호할 데이터, 사용자, 내부망, 외부 API, DB 권한을 먼저 정의합니다.
2. 위협: 탈취, 위조, 변조, 권한 상승, 주입, 재전송, 자동화 공격을 구분합니다.
3. 통제: 인증, 인가, 검증, escaping, parameter binding, TLS, hashing, rate limit을 배치합니다.
4. 실패 모드: token 탈취, session fixation, IDOR, replay, misconfiguration, dependency CVE를 붙입니다.
5. 운영: logging, alert, secret rotation, dependency update, incident response로 마무리합니다.

## 1. 인증과 인가

### 인증과 인가 차이

| 구분 | 질문 | 예 |
| --- | --- | --- |
| Authentication | 누구인가? | 로그인, MFA, client certificate |
| Authorization | 무엇을 할 수 있는가? | 주문 조회 권한, 관리자 API 접근 |
| Accounting/Audit | 무엇을 했는가? | 보안 로그, 감사 추적 |

흐름:

```text
credential 검증
 -> principal 식별
 -> session/token 발급
 -> resource/action 요청
 -> authorization policy 평가
 -> audit log 기록
```

주의:

- 인증 성공은 권한 허용이 아닙니다.
- 인가는 UI에서 숨기는 것이 아니라 서버에서 강제해야 합니다.
- 관리자, batch, internal service account 같은 민감 계정은 별도 정책과 감사가 필요합니다.

### Principal, Role, Permission

| 개념 | 의미 |
| --- | --- |
| Principal | 인증된 주체 |
| Role | 권한 묶음 |
| Permission | 특정 action/resource에 대한 허용 |
| Policy | 조건까지 포함한 권한 규칙 |

예:

```text
principal: user:123
role: SELLER
permission: inventory:write
resource: product:987
condition: product.owner_id == user.id
```

면접 포인트:

- role만 확인하면 horizontal privilege escalation을 놓치기 쉽습니다.
- “판매자” 역할이어도 본인 상품만 수정할 수 있는지 object ownership을 검증해야 합니다.
- 권한 판단은 controller 진입, service command 처리, repository query 조건 중 어디에 둘지 일관성이 필요합니다.

### Access Control 원칙

| 원칙 | 설명 |
| --- | --- |
| Deny by default | 명시적으로 허용하지 않으면 거부 |
| Least privilege | 필요한 최소 권한만 부여 |
| Server-side enforcement | client 표시 여부와 무관하게 서버에서 검증 |
| Object-level check | resource 소유권과 tenant 경계 검증 |
| Centralized policy | 중복된 ad hoc 검증을 줄임 |
| Auditability | 권한 변경과 민감 작업 추적 가능 |

자주 나오는 취약점:

- IDOR: `/users/123`을 `/users/124`로 바꿔 타인 정보 접근
- Function-level authorization 누락: 관리자 API URL을 알면 호출 가능
- Tenant isolation 실패: 다른 조직 데이터 조회
- Mass assignment: 요청 body의 `role=ADMIN` 같은 필드를 그대로 binding

실무 포인트:

- MSA 전환으로 백오피스가 물리적으로 분리되면서 서비스별로 흩어진 권한 관리를 중앙화하기 위해, 인증과 인가 중 인가만 전담하는 사내 권한관리 플랫폼을 도입한 사례가 있습니다 — "Centralized policy" 원칙의 실무 근거입니다. (출처: 우아한형제들)
- 권한 체크는 요청 처리 전에 유저 ID와 접근 URL을 권한 서버에 보내 접근 유효성을 판별받는 URI 기반의 단순 구조로 하고, Spring 환경에서는 Interceptor/Filter 형태의 클라이언트 라이브러리로 연동해 각 서비스의 연동 비용을 최소화했습니다. (출처: 우아한형제들)
- "심플함 우선" 설계로 기능적 한계를 인정하고 OAuth·LDAP 연동과 계정 통합은 후속 확장 과제로 남겼습니다. 중앙 권한 플랫폼이 처음부터 완전할 필요는 없다는 점진적 접근 사례입니다. (출처: 우아한형제들)

### MFA와 Re-authentication

MFA는 비밀번호 하나가 유출돼도 계정 탈취 가능성을 낮춥니다.

사용하면 좋은 상황:

- 관리자 계정
- 결제/정산/환불
- 비밀번호·이메일 변경
- 새 device 등록
- 비정상 login pattern

주의:

- SMS OTP는 SIM swap, 피싱에 취약할 수 있습니다.
- MFA recovery code와 device 분실 절차도 공격면입니다.
- 민감 작업 전 재인증은 CSRF/session hijacking 피해를 줄입니다.

실무 포인트:

- Gateway 계층에서 인증을 일원화하는 패턴이 있습니다. 앱이 유저 식별키로 요청하면 Gateway가 인증 서버에서 디바이스와 유저 정보를 담은 인증 컨텍스트(토큰)를 발급받아 serialize해 하위 서비스로 전파하므로, 각 서비스가 유저 API를 개별 호출할 필요가 없어집니다(Netflix가 공개한 Passport 구조와 유사). (출처: 토스)
- 이 인증 컨텍스트용 유저 정보는 짧은 TTL로 캐시하고 Redis pub/sub으로 변경 이벤트 시 expire합니다 — 캐시 성능과 claim 최신성의 트레이드오프를 짧은 TTL과 무효화 이벤트로 절충한 사례입니다. (출처: 토스)
- 요청 위변조 대응으로 매 요청을 아주 짧은 유효기간의 키로 서명하고 Gateway가 서명·중복 사용·유효기간을 검증해 앱 위변조, delayed request, replay attack을 방지합니다. 의심 요청은 FDS로 넘겨 계정을 비활성화합니다. (출처: 토스)
- 대부분의 API에 종단간 암호화를 적용해 패킷 분석 허들을 높이고(앱이 요청 바디 암호화 → Gateway 복호화 시점에 인증/인가 처리), 외부사·내부 개발자 호출은 클라이언트 인증서 기반 mTLS로 처리해 X.509 SAN에서 사용자 정보를 추출해 인가와 감사에 사용합니다. (출처: 토스)
- Istio matching rule만으로도 인증/인가가 가능하지만, 코드 기반 Gateway 애플리케이션이 자유도·auditing·카나리 배포에서 유리해 애플리케이션 계층에 두었습니다 — 인프라 계층 vs 애플리케이션 계층 인가 배치의 트레이드오프입니다. (출처: 토스)

## 2. Session, Cookie, JWT

### Session 방식

Session은 서버가 상태를 저장하고 client에는 session id만 전달합니다.

```text
login 성공
 -> server session store에 session 생성
 -> Set-Cookie: SESSION=opaque-random-id
 -> 이후 요청에서 Cookie 전송
 -> server가 session 조회
```

좋은 session id 조건:

- 충분히 길고 예측 불가능
- 인증 전후 session id rotation
- 만료와 idle timeout
- logout 시 서버 측 invalidation
- 권한 상승/민감 작업 후 재발급 고려

scale-out 선택지:

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| Sticky session | 구현 쉬움 | 장애 시 session 손실, 쏠림 |
| External session store | 서버 수평 확장 용이 | Redis 등 저장소 의존 |
| Stateless token | 서버 저장소 감소 | 즉시 폐기와 claim 최신성 어려움 |

### Cookie 보안 속성

| 속성 | 역할 |
| --- | --- |
| `Secure` | HTTPS에서만 전송 |
| `HttpOnly` | JavaScript 접근 차단 |
| `SameSite` | cross-site 요청의 cookie 전송 제한 |
| `Domain` | 전송 domain 범위 |
| `Path` | 전송 path 범위 |
| `Max-Age` / `Expires` | 만료 |

권장:

- 인증 cookie는 `Secure`, `HttpOnly`, 적절한 `SameSite`를 사용합니다.
- `Domain`을 넓게 잡지 않습니다.
- 민감 데이터는 cookie 값에 직접 넣지 않습니다.
- session fixation을 막기 위해 login 성공 시 session id를 재발급합니다.

### JWT

JWT는 세 부분으로 구성됩니다.

```text
Base64URL(Header).Base64URL(Payload).Base64URL(Signature)
```

| 부분 | 내용 |
| --- | --- |
| Header | token type, signing algorithm, key id |
| Payload | issuer, subject, audience, expiration 같은 claim |
| Signature | header와 payload 위변조 검증 |

등록 claim 예:

| Claim | 의미 |
| --- | --- |
| `iss` | issuer |
| `sub` | subject |
| `aud` | audience |
| `exp` | expiration time |
| `nbf` | not before |
| `iat` | issued at |
| `jti` | token identifier |

주의:

- JWT payload는 암호화가 아니라 Base64URL encoding입니다.
- 민감 정보를 payload에 넣지 않습니다.
- `alg=none`, 알고리즘 혼동, 잘못된 key 선택을 방지해야 합니다.
- `iss`, `aud`, `exp`, `nbf`를 검증합니다.
- key rotation을 위해 `kid`와 JWKS 전략을 둡니다.

### Access Token과 Refresh Token

| 구분 | Access Token | Refresh Token |
| --- | --- | --- |
| 목적 | API 접근 | access token 재발급 |
| 수명 | 짧게 | 길게 |
| 저장 | memory 또는 보호된 저장소 | 더 강한 보호 필요 |
| 폐기 | 짧은 만료로 위험 제한 | rotation, reuse detection |

Refresh token 운영:

- rotation을 적용합니다.
- 이전 refresh token 재사용을 탐지하면 token family를 폐기합니다.
- logout, 비밀번호 변경, 계정 잠금 시 refresh token을 폐기합니다.
- browser 저장 위치는 XSS/CSRF threat model에 맞춰 결정합니다.

### Session vs JWT 선택 기준

| 기준 | Session | JWT |
| --- | --- | --- |
| 즉시 폐기 | 쉬움 | 별도 denylist 또는 짧은 만료 필요 |
| 서버 저장소 | 필요 | 보통 불필요 |
| claim 최신성 | 서버 조회로 반영 쉬움 | 만료 전 stale claim 가능 |
| 확장성 | session store 필요 | 서비스 간 검증 쉬움 |
| 보안 사고 대응 | 중앙 invalidation 쉬움 | rotation/denylist 설계 필요 |

면접 답변:

> JWT가 session보다 항상 안전하거나 확장성이 좋은 것은 아닙니다. 폐기, claim 최신성, token 탈취 대응, 저장 위치를 기준으로 선택해야 합니다.

실무 포인트:

- 웹은 세션 만료 시 재인증이 자연스럽지만, 모바일 앱은 "스마트폰 = 본인 소유 기기"라는 전제 하에 자동 재발급되는 토큰(OAuth2) 방식이 UX상 낫다고 판단한 사례가 있습니다. (출처: 우아한형제들)
- 서버 저장형 토큰(opaque token)은 저장소 부하 비용이 있습니다. DB 기반 토큰 스토어에서 토큰 발급 9회, 검증 4회, 재발급 14회의 쿼리가 발생했고 동일한 client 조회 쿼리가 단일 요청에서 최대 6회 중복 실행됐으며, API 호출마다 발생하는 토큰 검증 쿼리가 가장 심각한 부하 지점이었습니다. (출처: 우아한형제들)
- AOP로 토큰 스토어의 read/write 메서드에 Redis 캐시를 주입한 결과 토큰 검증 쿼리 4회 → 0회, 발급 9회 → 5회, 재발급 14회 → 7회로 감소했습니다 — 서버 상태 저장 방식은 저장소 부하를 캐시로 상쇄해야 한다는 트레이드오프 사례입니다. (출처: 우아한형제들)
- 토큰이 만료·폐기됐는데 캐시가 유효한 구간, 즉 캐시 TTL과 토큰 유효기간의 정합 문제가 후속 과제로 남았습니다. 토큰 폐기와 캐시 무효화는 함께 설계해야 합니다. (출처: 우아한형제들)

## 3. 암호화, TLS, 비밀번호 저장

### 암호화, 해시, 서명, MAC

| 구분 | 목적 | 복호화 | 예 |
| --- | --- | --- | --- |
| 대칭키 암호화 | 기밀성 | 가능 | AES-GCM |
| 공개키 암호화 | 키 교환, 암호화 | private key로 가능 | RSA-OAEP |
| 해시 | 무결성, 식별 | 불가능 | SHA-256 |
| MAC | 공유키 기반 무결성/인증 | 불가능 | HMAC |
| 전자서명 | 무결성, 인증, 부인 방지 | 검증만 | RSA/ECDSA/EdDSA |

주의:

- hash는 암호화가 아닙니다.
- password 저장에는 일반 SHA-256이 아니라 password hashing algorithm이 필요합니다.
- 직접 crypto protocol을 설계하지 말고 검증된 library와 표준 모드를 사용합니다.

실무 포인트:

- 서버가 복호화·재암호화를 수행하는 구조에서는 매우 짧은 순간이라도 메시지가 서버에서 평문으로 노출되는 구간이 생겨 내부 공격자 위협에 취약합니다 — 메신저에 종단간 암호화(E2EE)를 도입한 근거입니다. (출처: LINE)
- E2EE 구성은 ECDH(타원곡선 Diffie-Hellman)로 서버를 거치지 않고 양측만 아는 256비트 shared secret을 만들고, 메시지는 AES-CBC-256으로 암호화하며, 무결성은 HMAC으로 검증합니다 — 키 교환·대칭 암호화·MAC의 역할 분리를 보여주는 실무 예입니다. (출처: LINE)
- 암호화 주체가 서버에서 송신자로 이동하면서 서버는 평문 접근이 기술적으로 불가능해집니다. (출처: LINE)
- 트레이드오프도 있습니다. 양측 모두 기능을 켜야 동작하고, 초기에는 1:1 텍스트·위치 메시지에만 적용(그룹채팅 미지원)됐으며 다중 기기 사용자는 기본 제외됐습니다 — E2EE는 기능 범위·멀티 디바이스 지원과 충돌하는 비용이 있습니다. (출처: LINE)

### TLS/HTTPS

TLS가 제공하는 것:

- 서버 인증
- 키 교환
- 전송 내용 암호화
- 메시지 무결성

면접 포인트:

- HTTPS는 HTTP 메시지를 TLS로 보호합니다.
- 인증서 검증은 hostname, CA chain, 유효기간, 폐기 상태를 확인합니다.
- SNI로 하나의 IP에서 hostname별 인증서를 선택할 수 있습니다.
- HSTS는 browser가 이후 접속에서 HTTPS만 사용하도록 강제하는 데 도움을 줍니다.

주의:

- TLS termination을 LB에서 하면 LB-backend 구간 암호화 여부를 별도로 결정해야 합니다.
- 오래된 TLS version과 약한 cipher suite는 비활성화해야 합니다.
- 인증서 private key와 secret은 코드 저장소에 두지 않습니다.

실무 포인트:

- 전사 모든 네트워크 엔드포인트에 TLSv1.3을 적용(TLSv1.2도 병행 지원)해 전체 트래픽의 80% 이상이 TLSv1.3으로 통신하는 사례가 있습니다. TLSv1.3은 더 강한 암호화와 함께 핸드셰이크 RTT가 줄어 보안성과 성능을 동시에 개선합니다. (출처: 토스페이먼츠)
- TLS만으로는 중간자 공격을 완전히 차단할 수 없다고 보고, JWE 기반 애플리케이션 레이어 암호화를 추가 옵션으로 제공합니다 — 전송 계층 암호화와 애플리케이션 계층 암호화의 역할 분리 사례입니다. (출처: 토스페이먼츠)
- 재전송(replay) 공격 방지를 위해 JWE 헤더에 `iat`(생성 시각)와 `nonce`를 포함하고, 일정 시간을 벗어난 요청은 거부합니다. (출처: 토스페이먼츠)
- API 인증은 가맹점별 API Key를 `Authorization: Basic` 헤더로 전달하고, 웹훅은 사전 교환된 키로 만든 HMAC 서명값을 헤더에 실어 검증합니다. API 키 유출 시 피해를 줄이기 위해 비정상 반복 요청에는 429(rate limiting)를 적용합니다. (출처: 토스페이먼츠)

### 비밀번호 저장

비밀번호는 복호화 가능한 암호화가 아니라 password hashing으로 저장합니다.

필수 요소:

- 사용자별 random salt
- 느린 hashing
- 충분한 work factor
- 장기 secret을 추가하는 pepper는 별도 secret store에 보관
- hash 비교는 timing attack을 줄이는 방식 사용

권장 알고리즘:

| 알고리즘 | 특징 |
| --- | --- |
| Argon2id | memory-hard, 현대적 password hashing |
| bcrypt | 널리 사용, 입력 길이 제한 주의 |
| scrypt | memory-hard |
| PBKDF2 | FIPS 요구 환경에서 자주 사용 |

지양:

- 평문 저장
- 단순 SHA-256/MD5
- salt 없는 hash
- 모든 사용자에게 같은 salt
- 너무 낮은 cost

### Password Policy

좋은 정책:

- 충분한 최소 길이
- 긴 passphrase 허용
- 유출된 password 차단
- MFA 권장
- 비정상 login throttling
- 비밀번호 변경 시 현재 비밀번호 확인

주의:

- 과도한 조합 규칙은 사용자가 예측 가능한 변형을 만들게 할 수 있습니다.
- 임의의 주기적 변경 강제보다 유출·위험 이벤트 기반 변경이 더 실용적입니다.
- login 실패 메시지는 계정 존재 여부를 과도하게 노출하지 않게 설계합니다.

## 4. 입력 처리와 Injection

### Injection 공통 원리

Injection은 신뢰하지 못한 입력이 interpreter의 문법 구조로 해석될 때 발생합니다.

| 종류 | 공격 대상 |
| --- | --- |
| SQL Injection | SQL query |
| Command Injection | OS shell command |
| NoSQL Injection | MongoDB 등 query object |
| LDAP Injection | LDAP filter |
| Template Injection | template engine |
| XXE | XML parser |

대응 원칙:

- 구조와 데이터를 분리합니다.
- allowlist 기반 validation을 적용합니다.
- parameter binding 또는 safe API를 사용합니다.
- 최소 권한 계정을 사용합니다.
- error detail을 외부에 과도하게 노출하지 않습니다.

### SQL Injection

취약한 예:

```java
String sql = "select * from users where email = '" + email + "'";
```

대응:

```java
PreparedStatement ps = connection.prepareStatement(
    "select * from users where email = ?"
);
ps.setString(1, email);
```

핵심:

- PreparedStatement는 SQL 구조와 값을 분리합니다.
- ORM을 써도 문자열 query 조립을 하면 취약할 수 있습니다.
- 동적 order by, table name은 parameter binding 대상이 아니므로 allowlist가 필요합니다.
- DB 계정 권한을 최소화해 피해 범위를 줄입니다.

### Command Injection

원인:

- 사용자 입력을 shell command 문자열에 직접 결합
- shell metacharacter가 명령 구조를 바꿈

대응:

- shell을 거치지 않는 API 사용
- argument array로 전달
- allowlist validation
- 작업 권한 최소화
- container/seccomp/AppArmor 같은 실행 환경 격리

### XSS

XSS는 신뢰하지 못한 데이터가 browser에서 script로 실행되는 취약점입니다.

| 유형 | 설명 |
| --- | --- |
| Stored XSS | DB 등에 저장된 payload가 다른 사용자에게 실행 |
| Reflected XSS | 요청 parameter가 즉시 response에 반사 |
| DOM XSS | client-side JS가 안전하지 않게 DOM 조작 |

대응:

- context-aware output encoding
- HTML sanitizer 사용
- template engine auto escaping 유지
- unsafe sink 사용 제한
- CSP로 피해 완화
- cookie `HttpOnly`로 token 탈취 위험 감소

주의:

- 입력 검증만으로 XSS를 완전히 막기 어렵습니다.
- HTML, attribute, JavaScript, URL, CSS context마다 escaping 규칙이 다릅니다.
- CSP는 보조 방어선이지 output encoding 대체가 아닙니다.

### SSRF

SSRF는 공격자가 지정한 URL로 서버가 요청하게 만드는 취약점입니다.

위험:

- cloud metadata endpoint 접근
- internal admin API 접근
- localhost service 접근
- internal network scan
- file/protocol abuse

대응:

- allowlist 기반 destination 제한
- private IP, link-local, localhost 차단
- DNS rebinding 대응
- redirect 후 최종 목적지 재검증
- outbound egress firewall
- metadata service 보호
- response를 그대로 외부에 노출하지 않음

## 5. 브라우저 보안

### CSRF

CSRF는 로그인된 사이트로 browser가 cookie를 자동 전송하는 성질을 악용합니다.

```text
사용자 로그인 상태
 -> 공격 페이지 방문
 -> 공격 페이지가 은행/쇼핑몰로 상태 변경 요청 전송
 -> browser가 cookie 자동 첨부
```

대응:

- CSRF token
- SameSite cookie
- Origin/Referer 검증
- 상태 변경을 GET으로 처리하지 않음
- 민감 작업 재인증

주의:

- CORS는 CSRF 방어를 대체하지 않습니다.
- CSRF는 응답을 읽는 문제가 아니라 요청이 전송되는 문제입니다.
- JSON API도 cookie 인증을 쓰면 CSRF threat model을 봐야 합니다.

### CORS

CORS는 browser가 cross-origin response를 JavaScript에 노출할 수 있는지 서버 정책으로 확인하는 메커니즘입니다.

핵심:

- server-to-server 요청에는 CORS가 적용되지 않습니다.
- CORS는 인증/인가가 아닙니다.
- credential request에서는 `Access-Control-Allow-Origin: *`를 사용할 수 없습니다.
- 허용 origin을 동적으로 반사할 때 allowlist 검증이 필요합니다.

### CSP

Content Security Policy는 browser가 실행하거나 로드할 수 있는 resource 출처를 제한합니다.

효과:

- XSS 피해 완화
- inline script 제한
- 외부 script 출처 제한
- clickjacking 일부 완화는 `frame-ancestors`로 가능

주의:

- CSP는 XSS 방지의 보조 수단입니다.
- nonce/hash 기반 script 허용이 단순 `unsafe-inline`보다 안전합니다.
- report-only 모드로 먼저 영향도를 확인할 수 있습니다.

### Clickjacking

Clickjacking은 보이지 않는 frame 위에서 사용자가 의도치 않은 클릭을 하게 만드는 공격입니다.

대응:

- `Content-Security-Policy: frame-ancestors 'none'`
- `X-Frame-Options: DENY` 또는 `SAMEORIGIN`

주의:

- 최신 정책은 CSP `frame-ancestors`가 더 유연합니다.
- 결제, 권한 변경, 관리자 화면은 frame embedding 정책을 명확히 해야 합니다.

## 6. OWASP Top 10과 설계 보안

### OWASP Top 10 2025 기준

OWASP Top 10은 개발자와 웹 애플리케이션 보안을 위한 awareness 문서입니다.

| 항목 | 면접에서 연결할 내용 |
| --- | --- |
| Broken Access Control | IDOR, tenant isolation, object-level authorization |
| Security Misconfiguration | debug endpoint, default account, permissive CORS, directory listing |
| Software Supply Chain Failures | dependency CVE, build pipeline, artifact integrity |
| Cryptographic Failures | 민감 정보 평문 저장, 약한 TLS, key 관리 실패 |
| Injection | SQL/Command/NoSQL/Template injection |
| Insecure Design | threat modeling 부재, abuse case 미고려 |
| Authentication Failures | weak password, session fixation, brute force, MFA 부재 |
| Software or Data Integrity Failures | insecure deserialization, update 검증 실패 |
| Security Logging and Alerting Failures | 공격 탐지와 사고 대응 불가 |
| Mishandling of Exceptional Conditions | 예외 처리 실패, 민감 정보 노출, 비정상 상태 처리 누락 |

면접 포인트:

- OWASP Top 10은 체크리스트의 시작점이지 전체 보안 대책이 아닙니다.
- 취약점 이름보다 “우리 API에서 어떻게 발생하고 어디에서 막는지”가 중요합니다.

### Insecure Design과 Threat Modeling

설계 단계 질문:

- 누가 공격자인가?
- 어떤 자산을 보호하는가?
- 신뢰 경계는 어디인가?
- 어떤 misuse/abuse case가 가능한가?
- 실패하면 어떤 피해가 나는가?

예:

```text
쿠폰 발급 API
위협: 자동화 발급, 중복 발급, 타인 쿠폰 사용, rate limit 우회
통제: idempotency key, unique constraint, per-user limit, Redis counter, audit log
```

### Security Misconfiguration

자주 나오는 사례:

- production debug mode
- actuator/admin endpoint 노출
- default password
- permissive CORS
- security header 누락
- cloud storage public exposure
- verbose error response
- 불필요한 port open

대응:

- secure default
- environment별 설정 분리
- IaC와 policy scan
- secret scanning
- deployment checklist
- 최소 노출 원칙

## 7. API·운영 보안

### Rate Limit과 Anti-Automation

필요한 곳:

- login
- password reset
- OTP resend
- signup
- coupon/payment/order
- search API abuse

설계 축:

- IP 기준
- user 기준
- device/session 기준
- API key 기준
- sliding window/token bucket
- CAPTCHA 또는 step-up auth

주의:

- IP 기준만 쓰면 NAT 환경에서 정상 사용자를 막을 수 있습니다.
- login rate limit은 account enumeration과 credential stuffing을 함께 고려해야 합니다.
- 429와 `Retry-After`를 적절히 사용합니다.

### Secret 관리

Secret 예:

- DB password
- JWT signing key
- API key
- OAuth client secret
- encryption key

원칙:

- 코드와 이미지에 secret을 넣지 않습니다.
- secret manager나 환경별 안전한 주입 방식을 사용합니다.
- 접근 권한과 audit log를 관리합니다.
- rotation 절차를 둡니다.
- 유출 시 폐기와 재발급이 가능해야 합니다.

### Dependency와 Supply Chain

위험:

- 취약한 library
- typosquatting package
- compromised maintainer
- 악성 build script
- CI/CD secret 탈취

대응:

- dependency scanning
- lockfile 관리
- SBOM
- 최소 권한 CI token
- artifact signing/provenance
- 보안 업데이트 정책

### Logging과 Alerting

기록하면 좋은 이벤트:

- login 성공/실패
- MFA 실패
- password reset
- 권한 거부
- 관리자 작업
- token refresh/revoke
- rate limit 초과
- 민감 데이터 export

주의:

- password, access token, refresh token, full card number 같은 secret은 로그에 남기지 않습니다.
- user id, request id, client IP, user agent, action, result를 구조화합니다.
- log만 쌓고 alert와 대응 절차가 없으면 사고 대응에 부족합니다.

### Error Handling

원칙:

- 사용자에게는 일반화된 오류 메시지
- 내부에는 correlation id와 상세 log
- stack trace, SQL, secret, internal host 노출 금지
- 인증 실패 메시지는 account enumeration을 고려
- 예외 상황에서도 권한 우회나 데이터 불일치가 없어야 함

## 8. 실전 면접 Q&A

### 인증 / 인가

| 질문 | 답변 핵심 |
| --- | --- |
| 인증과 인가 차이는? | 인증은 주체 확인, 인가는 인증된 주체의 resource/action 권한 판단입니다. |
| Role check만으로 부족한 이유는? | 같은 role이라도 resource 소유권, tenant, 상태 조건을 확인해야 IDOR를 막을 수 있습니다. |
| Access control은 어디서 해야 하나? | UI가 아니라 서버에서 매 요청마다 deny-by-default와 object-level check를 강제해야 합니다. |
| MFA는 언제 필요한가? | 관리자, 결제, 개인정보 변경, 비정상 로그인, 민감 작업에서 step-up으로 사용합니다. |

### Session / JWT

| 질문 | 답변 핵심 |
| --- | --- |
| Session과 JWT 차이는? | Session은 서버 상태 저장과 즉시 폐기가 쉽고, JWT는 서버 저장소를 줄이지만 폐기와 claim 최신성이 어렵습니다. |
| JWT payload에 개인정보를 넣으면 안 되는 이유는? | payload는 암호화가 아니라 Base64URL encoding이므로 누구나 읽을 수 있습니다. |
| JWT 검증에서 봐야 할 claim은? | `iss`, `aud`, `exp`, `nbf`, 서명, 알고리즘, key id를 검증합니다. |
| Refresh token rotation은 왜 필요한가? | 탈취된 refresh token 재사용을 탐지하고 token family를 폐기하기 위해서입니다. |
| Cookie의 `HttpOnly`, `Secure`, `SameSite` 역할은? | JS 접근 차단, HTTPS 전송 제한, cross-site cookie 전송 제한입니다. |

### 암호 / 비밀번호

| 질문 | 답변 핵심 |
| --- | --- |
| 해시와 암호화 차이는? | 암호화는 복호화 가능, 해시는 단방향입니다. password 저장에는 password hashing이 필요합니다. |
| 비밀번호에 SHA-256만 쓰면 안 되는 이유는? | 너무 빨라 offline brute force에 취약하므로 salt와 느린 hash가 필요합니다. |
| Salt와 pepper 차이는? | Salt는 사용자별 공개 random 값, pepper는 별도 secret store에 두는 전역 secret입니다. |
| TLS가 제공하는 것은? | 서버 인증, 키 교환, 암호화, 무결성을 제공합니다. |

### 웹 취약점

| 질문 | 답변 핵심 |
| --- | --- |
| SQL Injection 대응은? | parameter binding, allowlist validation, 최소 권한 DB 계정, error 노출 제한을 사용합니다. |
| XSS 대응은? | context-aware output encoding, sanitizer, unsafe sink 제한, CSP, HttpOnly cookie를 사용합니다. |
| CSRF와 XSS 차이는? | CSRF는 사용자의 인증 상태로 요청을 보내게 하고, XSS는 브라우저에서 공격 script를 실행합니다. |
| SSRF가 위험한 이유는? | 서버 권한으로 내부망, metadata endpoint, localhost service에 접근할 수 있기 때문입니다. |
| CORS는 보안 기능인가? | 브라우저 response 노출 정책이며 인증/인가 대체 수단은 아닙니다. |

### 운영 보안

| 질문 | 답변 핵심 |
| --- | --- |
| Secret은 어떻게 관리해야 하나? | 코드에 넣지 않고 secret manager, 접근 제어, audit, rotation 절차로 관리합니다. |
| Rate limit은 어디에 필요한가? | login, password reset, OTP, 결제, 쿠폰, 검색 같은 자동화 남용 지점에 필요합니다. |
| 보안 로그에 남길 것과 남기면 안 되는 것은? | 민감 작업과 권한 실패는 남기되 password/token/secret은 남기지 않습니다. |
| OWASP Top 10은 어떻게 활용하나? | 취약점 목록 암기가 아니라 API 설계, 구현, 배포 체크리스트의 출발점으로 씁니다. |

## 참고한 공식 문서

- OWASP Top 10 2025: https://owasp.org/Top10/2025/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Cross Site Scripting Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- OWASP Cross-Site Request Forgery Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP SQL Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- OWASP Server Side Request Forgery Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- RFC 7519 JSON Web Token: https://www.rfc-editor.org/rfc/rfc7519.html
- RFC 8446 The Transport Layer Security Protocol Version 1.3: https://www.rfc-editor.org/rfc/rfc8446.html

## 참고한 기술블로그

- 우아한형제들 — OSORI 권한관리 플랫폼: https://techblog.woowahan.com/2519/
- 토스 — 토스는 Gateway 이렇게 씁니다: https://toss.tech/article/slash23-server
- 우아한형제들 — aop를 이용한 oauth2 캐시 적용하기: https://techblog.woowahan.com/2617/
- 토스페이먼츠 — 토스페이먼츠의 Open API 생태계: https://toss.tech/article/payments-legacy-4
- LINE — 더 안전한 대화를 위한 Letter Sealing: https://engineering.linecorp.com/ko/blog/new-generation-of-safe-messaging-letter-sealing
