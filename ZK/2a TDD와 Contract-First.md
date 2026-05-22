---
id: "2a"
type: permanent
created: 2026-05-15
tags: [engineering, TDD, contract-first, ai]
up: "[[2 프로그래밍 실천]]"
---

# 2a TDD와 Contract-First

핵심 통찰: **사람이 계약을 소유하고, AI가 구현을 반복한다.**
"코드를 100% 이해해야 한다"는 전제를 버리고, "계약을 100% 이해해야 한다"로 재정의.

## 계약의 4가지 구성 요소

```
1. Spec      — 이 기능이 어떻게 동작해야 하는가 (행동 명세)
2. Interface — 공개 API는 어떻게 생겼는가 (타입, 시그니처)
3. Invariants— 항상 참이어야 하는 조건 (불변식)
4. Tests     — 위 셋을 자동으로 검증하는 수단
```

사람은 이 4가지를 설계하고 승인. AI는 이 계약을 통과하는 구현을 작성.

## 실천 순서
1. 계약 작성 (사람)
2. 계약 기반 테스트 작성 (사람 + AI)
3. 구현 생성 (AI)
4. 테스트 통과 확인 (자동)
5. 계약 범위 외 리뷰는 생략 가능

## 언제 이 방법론이 빛을 발하는가
- 1인 개발 / 장기 프로젝트
- AI가 생성한 코드 비율이 높을 때
- 기술부채가 쌓이기 시작할 때

---


## 관련 레퍼런스
- [[AI와 TDD+BDD 하기 - Low Tech Dept V5]] — 전체 방법론 (최신)
- [[WPF-Contract-First-Guide]] — WPF 적용 예시
- [[Unity-Contract-First-Guide]] — Unity 적용 예시
- [[AI TDD BDD prompt]] — 프롬프트 템플릿
