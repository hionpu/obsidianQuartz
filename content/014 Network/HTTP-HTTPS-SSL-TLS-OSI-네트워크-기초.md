---
title: HTTP/HTTPS와 SSL/TLS, OSI 7계층 네트워크 기초
tags:
  - network
  - http
  - https
  - ssl
  - tls
  - osi
  - websocket
  - encryption
  - security
  - protocol
created: 2025-05-29
permalink: /http-https-ssl-tls-osi-network-basics
---

# HTTP/HTTPS와 SSL/TLS, OSI 7계층 네트워크 기초

## HTTP vs HTTPS

**HTTP (HyperText Transfer Protocol)**는 웹에서 데이터를 주고받기 위한 기본 프로토콜입니다. 반면 **HTTPS (HTTP Secure)**는 HTTP에 보안 계층을 추가한 것입니다.

### 주요 차이점

**보안성**
- HTTP: 평문으로 데이터 전송, 제3자가 쉽게 도청 가능
- HTTPS: 암호화된 데이터 전송, 도청 방지

**포트**
- HTTP: 기본 포트 80
- HTTPS: 기본 포트 443

## SSL/TLS 동작 원리

SSL/TLS는 공개키 암호화와 대칭키 암호화를 조합하여 작동합니다.

### 핸드셰이크 과정

1. **Client Hello**: 클라이언트가 지원하는 암호화 방식 목록을 서버에 전송
2. **Server Hello**: 서버가 선택한 암호화 방식과 인증서를 클라이언트에 전송
3. **인증서 검증**: 클라이언트가 서버 인증서의 유효성을 확인
4. **키 교환**: 클라이언트가 대칭키를 생성하고 서버의 공개키로 암호화하여 전송
5. **암호화 통신 시작**: 양쪽 모두 대칭키를 사용하여 데이터 암호화

## 대칭 암호화 vs 비대칭 암호화

### 대칭 암호화 (Symmetric Encryption)
- **같은 키**로 암호화와 복호화를 수행
- **장점**: 매우 빠름 (AES 등)
- **단점**: 키를 안전하게 공유하는 문제

### 비대칭 암호화 (Asymmetric Encryption)
- **공개키**와 **개인키** 한 쌍을 사용
- 공개키로 암호화 → 개인키로 복호화
- 개인키로 서명 → 공개키로 검증
- **장점**: 키 공유 문제 해결
- **단점**: 느림 (RSA, ECDSA 등)

## OSI 7계층 모델

OSI 7계층은 네트워크 통신을 7개의 논리적 계층으로 나눈 표준 모델입니다.

### 7계층 - 응용 계층 (Application Layer)
**역할**: 사용자가 직접 상호작용하는 계층
- **프로토콜**: HTTP, HTTPS, FTP, SMTP, DNS, SSH

### 4계층 - 전송 계층 (Transport Layer)
**역할**: 신뢰성 있는 데이터 전송, 흐름 제어
- **프로토콜**: TCP, UDP

### 3계층 - 네트워크 계층 (Network Layer)
**역할**: 라우팅, 경로 설정
- **프로토콜**: IP, ICMP, ARP, OSPF

### 2계층 - 데이터 링크 계층 (Data Link Layer)
**역할**: 같은 네트워크 내에서 노드 간 신뢰성 있는 전송
- **프로토콜**: Ethernet, Wi-Fi, PPP

### 1계층 - 물리 계층 (Physical Layer)
**역할**: 전기적 신호로 비트 전송
- **매체**: 케이블, 광섬유, 무선

## 마무리

현대 웹 개발에서는 보안상의 이유로 HTTPS 사용이 필수가 되었으며, 많은 브라우저에서 HTTP 사이트에 대해 "안전하지 않음" 경고를 표시합니다.