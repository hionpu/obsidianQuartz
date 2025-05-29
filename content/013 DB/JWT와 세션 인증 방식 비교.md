---
title: JWT와 세션 인증 방식 비교
tags:
  - authentication
  - jwt
  - session
  - web-security
  - stateless
  - stateful
references:
  - "[[데이터베이스 인덱스와 B-Tree 구조]]"
created: 2025-05-29
---

# JWT와 세션 인증 방식 비교

## JWT와 세션이란?

### 세션(Session) 인증
세션 인증은 **서버에 사용자 정보를 저장하는 전통적인 인증 방식**입니다. 사용자가 로그인하면 서버는 세션을 생성하고, 클라이언트에게는 세션을 식별할 수 있는 세션 ID만 전달합니다.

**핵심 개념**: 서버가 상태를 기억하는 **Stateful** 방식

### JWT(JSON Web Token) 인증
JWT는 **토큰 자체에 사용자 정보를 포함하는 인증 방식**입니다. 서버는 사용자 정보를 따로 저장하지 않고, 토큰의 유효성만 검증합니다.

**핵심 개념**: 서버가 상태를 저장하지 않는 **Stateless** 방식

## 구조 비교

### 세션 방식의 구조
```
1. 로그인 요청
   클라이언트 → 서버: 사용자 정보

2. 세션 생성 및 응답
   서버: 세션 저장소에 사용자 정보 저장
   서버 → 클라이언트: 세션 ID (쿠키)

3. 인증이 필요한 요청
   클라이언트 → 서버: 세션 ID
   서버: 세션 저장소에서 사용자 정보 조회
```

**구성 요소**:
- **클라이언트**: 세션 ID (보통 쿠키로 저장)
- **서버**: 세션 저장소 (메모리, Redis, DB 등)
- **세션 ID**: 무작위 문자열, 사용자 정보와 매핑

### JWT 방식의 구조
```
1. 로그인 요청
   클라이언트 → 서버: 사용자 정보

2. JWT 토큰 생성 및 응답
   서버: JWT 토큰 생성 (사용자 정보 포함)
   서버 → 클라이언트: JWT 토큰

3. 인증이 필요한 요청
   클라이언트 → 서버: JWT 토큰 (Authorization 헤더)
   서버: 토큰 서명 검증 후 정보 추출
```

**JWT 구조**: `Header.Payload.Signature`
- **Header**: 토큰 타입, 암호화 알고리즘
- **Payload**: 사용자 정보, 권한, 만료시간 등
- **Signature**: 토큰 위변조 방지를 위한 서명

## 세부 동작 과정

### 세션 인증 흐름
```javascript
// 로그인 처리
app.post('/login', (req, res) => {
  // 사용자 인증 후
  const sessionId = generateSessionId();
  sessionStore[sessionId] = {
    userId: user.id,
    username: user.username,
    role: user.role
  };
  
  res.cookie('sessionId', sessionId);
  res.json({ success: true });
});

// 인증 확인
app.get('/profile', (req, res) => {
  const sessionId = req.cookies.sessionId;
  const userInfo = sessionStore[sessionId];
  
  if (!userInfo) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json(userInfo);
});
```

### JWT 인증 흐름
```javascript
// 로그인 처리
app.post('/login', (req, res) => {
  // 사용자 인증 후
  const token = jwt.sign({
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1시간
  }, SECRET_KEY);
  
  res.json({ token });
});

// 인증 확인
app.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json(decoded);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

## 장단점 비교

### 세션 방식

**장점**:
- **즉시 제어 가능**: 서버에서 세션 삭제로 즉시 로그아웃
- **보안성**: 클라이언트에 민감한 정보 노출 없음
- **네트워크 효율**: 세션 ID만 전송하여 데이터 크기 작음
- **권한 변경 즉시 반영**: 서버에서 권한 수정 시 바로 적용

**단점**:
- **서버 자원 사용**: 메모리나 DB에 세션 정보 저장 필요
- **확장성 제약**: 여러 서버 간 세션 공유 복잡
- **CSRF 취약점**: 쿠키 기반이라 CSRF 공격에 노출 가능
- **모바일 앱 지원 어려움**: 쿠키 관리가 복잡

### JWT 방식

**장점**:
- **서버 부하 없음**: 상태 저장 불필요 (Stateless)
- **확장성 우수**: 분산 환경, 마이크로서비스에 적합
- **크로스 도메인**: 여러 도메인 간 인증 공유 용이
- **모바일 친화적**: HTTP 헤더로 간단한 전송
- **디코딩 가능**: 클라이언트에서 토큰 내용 확인 가능

**단점**:
- **토큰 크기**: 정보가 많을수록 토큰 크기 증가
- **중간 제어 어려움**: 만료 전까지 서버에서 무효화 불가
- **보안 위험**: 토큰 탈취 시 만료까지 사용 가능
- **갱신 복잡성**: 토큰 갱신 로직 별도 구현 필요

## 사용 시기 및 적합한 상황

### 세션을 사용해야 하는 경우

1. **전통적인 웹 애플리케이션**
   - 서버 사이드 렌더링 (SSR)
   - 단일 도메인 서비스

2. **실시간 권한 제어가 중요한 경우**
   - 관리자 시스템
   - 금융 서비스
   - 보안이 매우 중요한 애플리케이션

3. **단일 서버 환경**
   - 소규모 애플리케이션
   - 세션 공유가 필요 없는 환경

### JWT를 사용해야 하는 경우

1. **RESTful API**
   - 모바일 앱 백엔드
   - SPA (Single Page Application)
   - 써드파티 API 제공

2. **분산 환경**
   - 마이크로서비스 아키텍처
   - 로드 밸런서 사용 환경
   - 다중 서버 클러스터

3. **크로스 도메인 서비스**
   - 여러 서브도메인 간 인증 공유
   - 외부 서비스와의 연동

## 보안 고려사항

### 세션 보안
```javascript
// 세션 보안 설정
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // HTTPS에서만 전송
    httpOnly: true,    // XSS 방지
    maxAge: 1800000    // 30분 후 만료
  }
}));
```

### JWT 보안
```javascript
// JWT 보안 고려사항
const token = jwt.sign(payload, SECRET_KEY, {
  expiresIn: '1h',           // 짧은 만료 시간
  issuer: 'your-app',        // 발급자 확인
  audience: 'your-users'     // 대상 확인
});

// Refresh Token 패턴
const refreshToken = jwt.sign(
  { userId: user.id },
  REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

## 하이브리드 접근법

실제 서비스에서는 두 방식의 장점을 결합하여 사용하기도 합니다:

1. **JWT + Refresh Token**: 짧은 JWT와 긴 Refresh Token 조합
2. **JWT + 블랙리스트**: JWT와 함께 무효화된 토큰 목록 관리
3. **세션 + JWT**: 내부는 세션, 외부 API는 JWT 사용

## 성능 비교

### 처리 속도
- **세션**: DB/메모리 조회 필요 → 상대적으로 느림
- **JWT**: 토큰 검증만 필요 → 빠름

### 네트워크 사용량
- **세션**: 세션 ID만 전송 → 적은 대역폭
- **JWT**: 전체 토큰 전송 → 많은 대역폭

### 서버 자원
- **세션**: 메모리/DB 사용 → 서버 부하
- **JWT**: 상태 저장 없음 → 서버 부하 적음

## 마무리

JWT와 세션은 각각 다른 상황에 적합한 인증 방식입니다. 세션은 보안과 즉시 제어가 중요한 전통적인 웹 애플리케이션에, JWT는 확장성과 분산 처리가 중요한 현대적인 API 서비스에 더 적합합니다. 

서비스의 특성, 보안 요구사항, 확장성 계획을 종합적으로 고려하여 적절한 인증 방식을 선택하는 것이 중요합니다.
