---
title: JWT와 세션 인증 방식 비교
tags:
  - authentication
  - jwt
  - session
  - web-security
  - stateless
  - stateful
created: 2025-05-29
permalink: /jwt-vs-session-authentication-comparison
---

# JWT와 세션 인증 방식 비교

## JWT와 세션이란?

### 세션(Session) 인증
세션 인증은 **서버에 사용자 정보를 저장하는 전통적인 인증 방식**입니다. 사용자가 로그인하면 서버는 세션을 생성하고, 클라이언트에게는 세션을 식별할 수 있는 세션 ID만 전달합니다.

**핵심 개념**: 서버가 상태를 기억하는 **Stateful** 방식

### JWT(JSON Web Token) 인증
JWT는 **토큰 자체에 사용자 정보를 포함하는 인증 방식**입니다. 서버는 사용자 정보를 따로 저장하지 않고, 토큰의 유효성만 검증합니다.

**핵심 개념**: 서버가 상태를 저장하지 않는 **Stateless** 방식

## 관련 문서
- [[데이터베이스 인덱스와 B-Tree 구조]] - 세션 저장소 성능 최적화에 참고