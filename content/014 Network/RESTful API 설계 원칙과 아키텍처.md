---
type: reference
title: RESTful API 설계 원칙과 아키텍처
tags:
  - rest
  - api
  - web-architecture
  - http
  - stateless
  - cache
  - design-pattern
  - microservices
created: 2025-05-29
permalink: /restful-api-design-principles-architecture
---

# RESTful API 설계 원칙과 아키텍처

REST(Representational State Transfer)는 2000년 로이 필딩(Roy Fielding)이 제안한 웹 아키텍처 스타일로, 현대 웹 서비스의 표준적인 설계 원칙이 되었습니다. 확장 가능하고 유지보수가 용이한 웹 서비스를 구축하기 위한 핵심 개념들을 정리해보겠습니다.

## REST의 6가지 설계 원칙

### 1. Uniform Interface (통일된 인터페이스)
REST의 가장 중요한 제약조건으로, 시스템의 모든 컴포넌트가 일관된 인터페이스를 통해 상호작용합니다.

**구성 요소**:
**리소스 식별 (Resource Identification)**
```http
GET /users/123           # 사용자 ID 123
GET /users/123/orders    # 사용자 123의 주문 목록
POST /products           # 새 제품 생성
```

**표현을 통한 리소스 조작 (Manipulation through Representations)**
```json
// JSON 표현으로 사용자 정보 전송
{
  "id": 123,
  "name": "김철수",
  "email": "kim@example.com"
}
```

### 2. Stateless (무상태성)
**핵심 개념**: 서버는 클라이언트의 상태 정보를 저장하지 않습니다.

**비고**: REST의 무상태성 원칙은 서버가 클라이언트의 상태를 저장하지 않아야 함을 의미합니다. 이는 세션 기반 인증이 서버에 사용자 상태(세션 정보)를 저장하는 Stateful 방식과는 상반됩니다. 따라서 순수 RESTful 아키텍처에서는 세션 인증 대신 토큰 기반 인증(예: JWT)이 더 선호됩니다. 자세한 비교는 [[JWT와 세션 인증 방식 비교]] 문서를 참조하세요.

### 3. Cacheable (캐시 가능)
**브라우저 캐시와의 관계**: REST API의 캐시는 브라우저의 임시 파일 저장과 같은 개념이지만, 더 체계적이고 다양한 레벨에서 동작합니다.

### 4. Client-Server Architecture (클라이언트-서버 구조)
**관심사의 분리**를 통해 시스템의 각 부분이 독립적으로 진화할 수 있습니다.

### 5. Layered System (계층화된 시스템)
**의미**: "계층화를 허용한다"는 것이지, "반드시 계층화해야 한다"는 강제가 아닙니다.

### 6. Code on Demand (주문형 코드) - 선택사항
유일한 **선택적 제약조건**으로, 서버가 클라이언트에게 실행 가능한 코드를 전송할 수 있습니다.

## REST API 설계 모범 사례

### URL 설계 원칙
**리소스 중심 설계**:
```http
# ✅ 리소스 중심
GET    /users          # 사용자 목록
POST   /users          # 사용자 생성
GET    /users/123      # 특정 사용자
PUT    /users/123      # 사용자 전체 수정
PATCH  /users/123      # 사용자 일부 수정
DELETE /users/123      # 사용자 삭제

# ❌ 동작 중심 (피해야 할 설계)
GET /getUsers
POST /createUser
GET /getUserById?id=123
```

### HTTP 상태 코드 활용
```javascript
app.post('/users', (req, res) => {
  try {
    const user = createUser(req.body);
    res.status(201).json(user); // Created
  } catch (error) {
    if (error.type === 'VALIDATION_ERROR') {
      res.status(400).json({ error: error.message }); // Bad Request
    } else if (error.type === 'DUPLICATE_EMAIL') {
      res.status(409).json({ error: 'Email already exists' }); // Conflict
    } else {
      res.status(500).json({ error: 'Internal server error' }); // Server Error
    }
  }
});
```

## 마무리

서비스의 특성, 보안 요구사항, 확장성 계획을 종합적으로 고려하여 적절한 인증 방식을 선택하는 것이 중요합니다.

## 관련 문서
- [[HTTP-HTTPS-SSL-TLS-OSI-네트워크-기초]] - HTTPS와 보안 프로토콜의 기본 개념
- [[JWT와 세션 인증 방식 비교]] - 인증 방식별 상세 비교