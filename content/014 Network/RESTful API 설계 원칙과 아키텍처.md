---
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
references:
  - "[[HTTP-HTTPS-SSL-TLS-OSI-네트워크-기초]]"
  - "[[JWT와 세션 인증 방식 비교]]"
created: 2025-05-29
permalink: /restful-api-design-principles-architecture
---
# RESTful API 설계 원칙과 아키텍처
REST(Representational State Transfer)는 2000년 로이 필딩(Roy Fielding)이 제안한 웹 아키텍처 스타일로, 현대 웹 서비스의 표준적인 설계 원칙이 되었습니다. 확장 가능하고 유지보수가 용이한 웹 서비스를 구축하기 위한 핵심 개념들을 정리해보겠습니다.

# REST의 6가지 설계 원칙
## 1. Uniform Interface (통일된 인터페이스)
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
**자기 서술적 메시지 (Self-descriptive Messages)**
```http
GET /users/123 HTTP/1.1
Host: api.example.com
Accept: application/json
Content-Type: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=3600
```
**HATEOAS (Hypermedia as the Engine of Application State)**
```json
{
  "id": 123,
  "name": "김철수",
  "links": {
    "self": "/users/123",
    "orders": "/users/123/orders",
    "edit": "/users/123"
  }
}
```
## 2. Stateless (무상태성)
**핵심 개념**: 서버는 클라이언트의 상태 정보를 저장하지 않습니다.
```http
# ❌ 잘못된 예 - 서버가 세션 상태를 기억
GET /next-page HTTP/1.1
Cookie: sessionId=abc123

# ✅ 올바른 예 - 모든 정보를 요청에 포함
GET /users?page=2&limit=10 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
**장점**:
*   **확장성**: 어떤 서버든 요청을 처리 가능
*   **신뢰성**: 서버 장애 시에도 상태 손실 없음
*   **단순성**: 서버 로직이 단순해짐

**실제 구현**:
```javascript
// Stateless API 예시
app.get('/orders', (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
  const token = req.headers.authorization;
  
  // 토큰에서 사용자 정보 추출 (상태 저장하지 않음)
  const user = jwt.verify(token, SECRET_KEY);
  
  const orders = getOrders({ userId: user.id, page, limit });
  res.json(orders);
});
```

**비고**: REST의 무상태성 원칙은 서버가 클라이언트의 상태를 저장하지 않아야 함을 의미합니다. 이는 세션 기반 인증이 서버에 사용자 상태(세션 정보)를 저장하는 Stateful 방식과는 상반됩니다. 따라서 순수 RESTful 아키텍처에서는 세션 인증 대신 토큰 기반 인증(예: JWT)이 더 선호됩니다. 자세한 비교는 [[JWT와 세션 인증 방식 비교]] 문서를 참조하세요.

## 3. Cacheable (캐시 가능)
**브라우저 캐시와의 관계**: REST API의 캐시는 브라우저의 임시 파일 저장과 같은 개념이지만, 더 체계적이고 다양한 레벨에서 동작합니다.
**캐시 레벨**:
```
클라이언트(브라우저) → CDN → 프록시 서버 → 웹 서버
     ↑캐시          ↑캐시      ↑캐시
```
**HTTP 헤더를 통한 캐시 제어**:
```http
# 서버 응답
HTTP/1.1 200 OK
Cache-Control: max-age=3600, public
ETag: "abc123def456"
Last-Modified: Mon, 01 Jan 2024 12:00:00 GMT

# 클라이언트의 조건부 요청
GET /products/123 HTTP/1.1
If-None-Match: "abc123def456"
If-Modified-Since: Mon, 01 Jan 2024 12:00:00 GMT

# 캐시가 유효할 때 서버 응답
HTTP/1.1 304 Not Modified
```
**실제 사용 예시**:
```javascript
app.get('/products/:id', (req, res) => {
  const product = getProduct(req.params.id);
  
  // ETag 생성 (데이터의 해시값)
  const etag = generateETag(product);
  
  // 클라이언트의 ETag와 비교
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified
  }
  
  res.set({
    'Cache-Control': 'max-age=1800', // 30분 캐시
    'ETag': etag
  });
  
  res.json(product);
});
```
**캐시 전략별 활용**:
*   **정적 리소스**: `Cache-Control: max-age=31536000` (1년)
*   **사용자 프로필**: `Cache-Control: max-age=3600` (1시간)
*   **실시간 데이터**: `Cache-Control: no-cache` (매번 검증)
*   **민감한 데이터**: `Cache-Control: no-store` (캐시 금지)

## 4. Client-Server Architecture (클라이언트-서버 구조)
**관심사의 분리**를 통해 시스템의 각 부분이 독립적으로 진화할 수 있습니다.
```
클라이언트 (사용자 인터페이스)  ←→  서버 (데이터 저장 및 비즈니스 로직)
     ↓                              ↓
- UI/UX 담당                    - 데이터 처리 담당
- 사용자 상호작용                - 비즈니스 규칙
- 플랫폼별 최적화                - 보안 및 인증
```
**실제 예시**:
```javascript
// 클라이언트 (React)
const UserProfile = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setUser);
  }, []);
  
  return <div>{user?.name}</div>;
};

// 서버 (Express)
app.get('/api/users/me', authenticate, (req, res) => {
  const user = getUserById(req.user.id);
  res.json(user);
});
```
## 5. Layered System (계층화된 시스템)
**의미**: "계층화를 허용한다"는 것이지, "반드시 계층화해야 한다"는 강제가 아닙니다.
**계층화를 허용하지 않는다면**:
```
클라이언트 ←→ 서버 (직접 연결만 허용)
```
이는 현실적으로 불가능한 제약이 됩니다.
**실제 계층화 예시**:
**로드 밸런서 계층**:
```
클라이언트 → 로드밸런서 → 서버1
                   → 서버2
                   → 서버3
```
**API 게이트웨이 계층**:
```
모바일앱 → API Gateway → 사용자 서비스
웹앱           ↓       → 주문 서비스
              ↓       → 결제 서비스
            인증/로깅/   
            모니터링
```
**CDN 계층**:
```
브라우저 → CDN (엣지 서버) → 원본 서버
```
**핵심 원칙 - 투명성**: 각 계층은 바로 인접한 계층과만 통신하고, 그 너머는 알 필요가 없습니다.
```javascript
// 클라이언트는 API Gateway만 알면 됨
fetch('https://api.example.com/users')

// API Gateway는 실제 서비스들을 라우팅
app.use('/users', (req, res) => {
  // 내부적으로 user-service:3001로 프록시
  proxy('http://user-service:3001')(req, res);
});
```
## 6. Code on Demand (주문형 코드) - 선택사항
유일한 **선택적 제약조건**으로, 서버가 클라이언트에게 실행 가능한 코드를 전송할 수 있습니다.
**예시**:
```javascript
// 서버에서 클라이언트 로직 전송
app.get('/widget-config', (req, res) => {
  res.json({
    widgetCode: `
      function createWidget(data) {
        const div = document.createElement('div');
        div.innerHTML = data.template;
        return div;
      }
    `,
    template: '<div class="widget">{{title}}</div>'
  });
});

// 클라이언트에서 동적 실행
fetch('/widget-config')
  .then(res => res.json())
  .then(config => {
    eval(config.widgetCode); // 동적 코드 실행
    const widget = createWidget({ title: '동적 위젯' });
  });
```
# REST API 설계 모범 사례
## URL 설계 원칙
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
**계층적 리소스**:
```http
GET /users/123/orders           # 사용자의 주문 목록
GET /users/123/orders/456       # 특정 주문
POST /users/123/orders          # 새 주문 생성
GET /categories/books/products  # 도서 카테고리의 상품들
```
## HTTP 상태 코드 활용
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

app.get('/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' }); // Not Found
  }
  res.json(user); // 200 OK (기본값)
});
```
## 버전 관리
```http
# URL 경로를 통한 버전 관리
GET /api/v1/users
GET /api/v2/users

# 헤더를 통한 버전 관리
GET /api/users
Accept: application/vnd.api.v1+json

# 쿼리 파라미터를 통한 버전 관리
GET /api/users?version=1
```
# 실제 구현 예시
## Express.js를 사용한 RESTful API
```javascript
const express = require('express');
const app = express();

// 미들웨어
app.use(express.json());
app.use(cors());

// 사용자 리소스
const users = [
  { id: 1, name: '김철수', email: 'kim@example.com' },
  { id: 2, name: '이영희', email: 'lee@example.com' }
];

// GET /users - 사용자 목록 조회
app.get('/users', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endInde
```

# Draft
---
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
references:
  - "[[HTTP-HTTPS-SSL-TLS-OSI-네트워크-기초]]"
  - "[[JWT와 세션 인증 방식 비교]]"
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
**자기 서술적 메시지 (Self-descriptive Messages)**
```http
GET /users/123 HTTP/1.1
Host: api.example.com
Accept: application/json
Content-Type: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=3600
```
**HATEOAS (Hypermedia as the Engine of Application State)**
```json
{
  "id": 123,
  "name": "김철수",
  "links": {
    "self": "/users/123",
    "orders": "/users/123/orders",
    "edit": "/users/123"
  }
}
```
### 2. Stateless (무상태성)
**핵심 개념**: 서버는 클라이언트의 상태 정보를 저장하지 않습니다.
```http
# ❌ 잘못된 예 - 서버가 세션 상태를 기억
GET /next-page HTTP/1.1
Cookie: sessionId=abc123

# ✅ 올바른 예 - 모든 정보를 요청에 포함
GET /users?page=2&limit=10 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
**장점**:
*   **확장성**: 어떤 서버든 요청을 처리 가능
*   **신뢰성**: 서버 장애 시에도 상태 손실 없음
*   **단순성**: 서버 로직이 단순해짐

**실제 구현**:
```javascript
// Stateless API 예시
app.get('/orders', (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
  const token = req.headers.authorization;

  // 토큰에서 사용자 정보 추출 (상태 저장하지 않음)
  const user = jwt.verify(token, SECRET_KEY);

  const orders = getOrders({ userId: user.id, page, limit });
  res.json(orders);
});
```

**비고**: REST의 무상태성 원칙은 서버가 클라이언트의 상태를 저장하지 않아야 함을 의미합니다. 이는 세션 기반 인증이 서버에 사용자 상태(세션 정보)를 저장하는 Stateful 방식과는 상반됩니다. 따라서 순수 RESTful 아키텍처에서는 세션 인증 대신 토큰 기반 인증(예: JWT)이 더 선호됩니다. 자세한 비교는 [[JWT와 세션 인증 방식 비교]] 문서를 참조하세요.

### 3. Cacheable (캐시 가능)
**브라우저 캐시와의 관계**: REST API의 캐시는 브라우저의 임시 파일 저장과 같은 개념이지만, 더 체계적이고 다양한 레벨에서 동작합니다.
**캐시 레벨**:
```
클라이언트(브라우저) → CDN → 프록시 서버 → 웹 서버
     ↑캐시          ↑캐시      ↑캐시
```
**HTTP 헤더를 통한 캐시 제어**:
```http
# 서버 응답
HTTP/1.1 200 OK
Cache-Control: max-age=3600, public
ETag: "abc123def456"
Last-Modified: Mon, 01 Jan 2024 12:00:00 GMT

# 클라이언트의 조건부 요청
GET /products/123 HTTP/1.1
If-None-Match: "abc123def456"
If-Modified-Since: Mon, 01 Jan 2024 12:00:00 GMT

# 캐시가 유효할 때 서버 응답
HTTP/1.1 304 Not Modified
```
**실제 사용 예시**:
```javascript
app.get('/products/:id', (req, res) => {
  const product = getProduct(req.params.id);

  // ETag 생성 (데이터의 해시값)
  const etag = generateETag(product);

  // 클라이언트의 ETag와 비교
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified
  }

  res.set({
    'Cache-Control': 'max-age=1800', // 30분 캐시
    'ETag': etag
  });

  res.json(product);
});
```
**캐시 전략별 활용**:
*   **정적 리소스**: `Cache-Control: max-age=31536000` (1년)
*   **사용자 프로필**: `Cache-Control: max-age=3600` (1시간)
*   **실시간 데이터**: `Cache-Control: no-cache` (매번 검증)
*   **민감한 데이터**: `Cache-Control: no-store` (캐시 금지)

### 4. Client-Server Architecture (클라이언트-서버 구조)
**관심사의 분리**를 통해 시스템의 각 부분이 독립적으로 진화할 수 있습니다.
```
클라이언트 (사용자 인터페이스)  ←→  서버 (데이터 저장 및 비즈니스 로직)
     ↓                              ↓
- UI/UX 담당                    - 데이터 처리 담당
- 사용자 상호작용                - 비즈니스 규칙
- 플랫폼별 최적화                - 보안 및 인증
```
**실제 예시**:
```javascript
// 클라이언트 (React)
const UserProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setUser);
  }, []);

  return <div>{user?.name}</div>;
};

// 서버 (Express)
app.get('/api/users/me', authenticate, (req, res) => {
  const user = getUserById(req.user.id);
  res.json(user);
});
```
### 5. Layered System (계층화된 시스템)
**의미**: "계층화를 허용한다"는 것이지, "반드시 계층화해야 한다"는 강제가 아닙니다.
**계층화를 허용하지 않는다면**:
```
클라이언트 ←→ 서버 (직접 연결만 허용)
```
이는 현실적으로 불가능한 제약이 됩니다.
**실제 계층화 예시**:
**로드 밸런서 계층**:
```
클라이언트 → 로드밸런서 → 서버1
                   → 서버2
                   → 서버3
```
**API 게이트웨이 계층**:
```
모바일앱 → API Gateway → 사용자 서비스
웹앱           ↓       → 주문 서비스
              ↓       → 결제 서비스
            인증/로깅/
            모니터링
```
**CDN 계층**:
```
브라우저 → CDN (엣지 서버) → 원본 서버
```
**핵심 원칙 - 투명성**: 각 계층은 바로 인접한 계층과만 통신하고, 그 너머는 알 필요가 없습니다.
```javascript
// 클라이언트는 API Gateway만 알면 됨
fetch('https://api.example.com/users')

// API Gateway는 실제 서비스들을 라우팅
app.use('/users', (req, res) => {
  // 내부적으로 user-service:3001로 프록시
  proxy('http://user-service:3001')(req, res);
});
```
### 6. Code on Demand (주문형 코드) - 선택사항
유일한 **선택적 제약조건**으로, 서버가 클라이언트에게 실행 가능한 코드를 전송할 수 있습니다.
**예시**:
```javascript
// 서버에서 클라이언트 로직 전송
app.get('/widget-config', (req, res) => {
  res.json({
    widgetCode: `
      function createWidget(data) {
        const div = document.createElement('div');
        div.innerHTML = data.template;
        return div;
      }
    `,
    template: '<div class="widget">{{title}}</div>'
  });
});

// 클라이언트에서 동적 실행
fetch('/widget-config')
  .then(res => res.json())
  .then(config => {
    eval(config.widgetCode); // 동적 코드 실행
    const widget = createWidget({ title: '동적 위젯' });
  });
```
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
**계층적 리소스**:
```http
GET /users/123/orders           # 사용자의 주문 목록
GET /users/123/orders/456       # 특정 주문
POST /users/123/orders          # 새 주문 생성
GET /categories/books/products  # 도서 카테고리의 상품들
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

app.get('/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' }); // Not Found
  }
  res.json(user); // 200 OK (기본값)
});
```
### 버전 관리
```http
# URL 경로를 통한 버전 관리
GET /api/v1/users
GET /api/v2/users

# 헤더를 통한 버전 관리
GET /api/users
Accept: application/vnd.api.v1+json

# 쿼리 파라미터를 통한 버전 관리
GET /api/users?version=1
```
## 실제 구현 예시
### Express.js를 사용한 RESTful API
```javascript
const express = require('express');
const app = express();

// 미들웨어
app.use(express.json());
app.use(cors());

// 사용자 리소스
const users = [
  { id: 1, name: '김철수', email: 'kim@example.com' },
  { id: 2, name: '이영희', email: 'lee@example.com' }
];

// GET /users - 사용자 목록 조회
app.get('/users', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const resultUsers = users.slice(startIndex, endIndex);
  res.json(resultUsers);
});

// GET /users/:id - 특정 사용자 조회
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// POST /users - 사용자 생성
app.post('/users', (req, res) => {
  const newUser = {
    id: users.length + 1,
    name: req.body.name,
    email: req.body.email
  };
  users.push(newUser);
  res.status(201).json(newUser); // 201 Created
});

// PUT /users/:id - 사용자 전체 수정
app.put('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[userIndex] = {
    id: userId,
    name: req.body.name,
    email: req.body.email
  };
  res.json(users[userIndex]);
});

// DELETE /users/:id - 사용자 삭제
app.delete('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const initialLength = users.length;
  users = users.filter(u => u.id !== userId);

  if (users.length === initialLength) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(204).end(); // 204 No Content
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```
```
```