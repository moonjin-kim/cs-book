# Security

Security는 기능이 정상 동작하는 것과 별개로 "누가 무엇을 할 수 있고 데이터가 어떻게 보호되는가"를 검증합니다.

## 핵심 개념

| 개념 | 알아야 할 질문 |
| --- | --- |
| 인증 | 사용자가 누구인지 어떤 증거로 확인하는가? |
| 인가 | 인증된 사용자가 어떤 리소스에 접근할 수 있는가? |
| JWT | claim 기반 token은 무엇을 담고 어떤 위험이 있는가? |
| SQL Injection | 사용자 입력이 SQL 구조를 바꾸지 못하게 하려면 어떻게 해야 하는가? |
| CSRF | 브라우저가 자동으로 쿠키를 보내는 특성을 어떻게 악용하는가? |
| 암호화 | 대칭키, 공개키, 서명은 각각 어떤 보안 속성을 제공하는가? |
| HTTPS | TLS handshake와 인증서는 어떤 역할을 하는가? |
| 해시 | password hash에 salt와 느린 hash가 필요한 이유는 무엇인가? |
| OWASP | injection, XSS, broken access control은 어떻게 발생하고 막는가? |

## SQL Injection

SQL Injection은 사용자 입력이 SQL query에 안전하게 처리되지 않을 때 발생하는 취약점입니다. 공격자는 입력값에 SQL 조각을 섞어 query 구조를 바꾸고, 인증 우회, 데이터 탈취, 데이터 조작, 테이블 삭제를 시도할 수 있습니다.

취약한 예:

```java
public boolean login(String username, String password) {
    String sql = "SELECT * FROM users WHERE username = '" + username
        + "' AND password = '" + password + "'";

    try (Connection conn = DriverManager.getConnection("url");
         Statement stmt = conn.createStatement();
         ResultSet rs = stmt.executeQuery(sql)) {
        return rs.next();
    } catch (SQLException e) {
        throw new RuntimeException("Database error", e);
    }
}
```

공격자가 `username`에 `admin' --`를 입력하면 password 조건 뒤가 주석 처리되어 인증 우회가 가능해질 수 있습니다.

대표 payload:

- `' OR '1'='1`: 항상 참인 조건 추가
- `' UNION SELECT * FROM accounts --`: 다른 테이블 조회 시도
- `'; DROP TABLE users; --`: 파괴적 쿼리 실행 시도

방어:

1. `PreparedStatement`로 placeholder에 값을 바인딩합니다.

```java
String sql = "SELECT * FROM users WHERE username = ? AND password = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setString(1, username);
pstmt.setString(2, password);
```

2. JPA, Hibernate 같은 ORM을 사용하더라도 동적 query 문자열 결합은 피합니다.
3. 사용자 입력을 allow-list 기준으로 검증합니다.
4. 애플리케이션 DB 계정에는 최소 권한만 부여합니다.
5. SQL 오류와 stack trace를 사용자에게 직접 노출하지 않습니다.

## JWT

JWT(JSON Web Token)는 JSON 기반 claim을 안전하게 전달하기 위한 token 형식입니다. 보통 인증과 인가에 사용되며 `header.payload.signature` 세 부분으로 구성됩니다.

| 구성 | 내용 |
| --- | --- |
| Header | token type, signing algorithm |
| Payload | subject, 만료 시각, 권한, 사용자 식별자 같은 claim |
| Signature | header와 payload가 변조되지 않았는지 검증하기 위한 서명 |

장점:

- token 자체에 claim이 있어 사용자 정보를 조회하는 추가 작업을 줄일 수 있습니다.
- 서버가 session 상태를 저장하지 않아도 되어 다중 서버 환경에서 session 불일치 문제가 줄어듭니다.

주의:

- JWT payload는 Base64URL decoding만으로 볼 수 있으므로 민감 정보를 넣으면 안 됩니다.
- secret key가 약하면 brute force에 취약합니다.
- signing key는 안전한 secret storage에서 관리해야 합니다.
- 탈취된 token은 만료 전까지 악용될 수 있으므로 저장 위치, refresh token, refresh token rotation, 탈취 감지와 revoke 전략이 필요합니다.
- token 만료가 사용자 경험을 해치지 않도록 sliding session, refresh 전략을 설계해야 합니다.
- `alg: none` 공격을 막기 위해 안전한 라이브러리를 사용하고 허용 algorithm을 명시적으로 제한합니다.

## CSRF

CSRF(Cross-site Request Forgery)는 사용자가 로그인한 상태를 악용해, 사용자의 의지와 무관한 요청을 공격 대상 사이트로 보내게 하는 공격입니다.

브라우저는 특정 사이트에 대한 쿠키를 저장하고, 해당 사이트로 요청할 때 쿠키를 자동으로 첨부합니다. 공격자는 사용자를 악성 페이지로 유도하고, 그 페이지에서 공격 대상 사이트로 요청을 발생시킬 수 있습니다.

예:

```html
<img src="https://example.com/member/changePassword?newValue=1234" />
```

사용자가 `example.com`에 로그인되어 있고 쿠키가 자동 전송되면, 사용자의 의도와 무관하게 요청이 전달될 수 있습니다.

방어:

| 방법 | 설명 | 주의점 |
| --- | --- | --- |
| CSRF Token | 서버가 session에 token을 저장하고 form submit 시 hidden input token과 비교 | 서버 렌더링 form에 적합 |
| SameSite Cookie | cross-site 요청에서 쿠키 전송을 제한 | 브라우저 호환성과 OAuth flow 고려 |
| Referer/Origin 검증 | 요청 출처와 Host를 비교 | header 누락/조작 가능성을 고려해야 함 |
| SOP/CORS 설정 | cross-origin 접근을 필요한 범위만 허용 | CORS는 서버 간 통신 방어가 아니라 브라우저 정책 |

## 대칭키와 비대칭키 암호화

대칭키 암호화는 암호화와 복호화에 같은 키를 사용합니다. 속도가 빠르지만, 통신 참여자 사이에 안전하게 키를 교환해야 하고 대상이 많아질수록 키 관리가 복잡합니다.

비대칭키 암호화는 공개키와 개인키를 사용합니다. 송신자는 수신자의 공개키로 암호화하고, 수신자는 개인키로 복호화합니다. 키 교환 문제를 줄일 수 있지만 대칭키보다 느립니다.

개인키로 서명하고 공개키로 검증하는 방식은 "누가 만들었는지"와 "중간에 변조되지 않았는지"를 확인하는 데 사용됩니다.

## HTTPS

HTTP는 평문으로 데이터를 전송하므로 제3자가 내용을 볼 수 있습니다. HTTPS는 HTTP에 TLS를 적용해 전송 구간의 기밀성, 무결성, 서버 인증을 제공합니다.

HTTPS 적용에는 CA(Certificate Authority)가 발급한 인증서가 필요합니다. 인증서에는 서버 공개키와 서버 정보가 포함되며, CA의 개인키로 서명됩니다. 클라이언트는 신뢰하는 CA 공개키로 인증서를 검증합니다.

TLS handshake의 큰 흐름:

1. 클라이언트가 지원하는 TLS version, cipher suite, random 값을 보냅니다.
2. 서버가 선택한 암호화 방식, 인증서, random 값을 보냅니다.
3. 클라이언트는 인증서를 CA 공개키로 검증합니다.
4. 클라이언트와 서버는 key exchange를 통해 공통 secret을 만듭니다.
5. 이후 통신은 생성된 session key를 사용하는 대칭키 암호화로 보호합니다.

핵심은 비대칭키 암호화로 인증과 키 교환 문제를 해결하고, 실제 데이터 전송은 빠른 대칭키 암호화로 처리한다는 점입니다.

## 실무 판단

- 인증과 인가는 항상 분리해서 설계하고 테스트합니다.
- 비밀번호는 암호화가 아니라 password hashing으로 저장합니다.
- SQL은 문자열 결합 대신 parameter binding을 기본값으로 둡니다.
- JWT는 "암호화된 데이터"가 아니라 "서명된 token"으로 이해해야 합니다.
- CSRF 방어는 cookie 기반 인증을 사용할 때 특히 중요합니다.
- 보안 설정은 기본값을 믿기보다 실제 배포 환경에서 검증해야 합니다.
