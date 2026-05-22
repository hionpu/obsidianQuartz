---
type: index
keyword: lazy propagation
created: 2026-05-15
---

# Keyword: Lazy Propagation

세그먼트 트리에서 **범위 업데이트**를 O(log N)에 처리하기 위한 기법.
업데이트를 즉시 전파하지 않고 "나중에"(lazy) 처리한다.

## 적용 조건
- 단일 원소 업데이트만 → Lazy 불필요
- **범위 업데이트** (구간 전체에 +5 등) → Lazy 필수

## ZK 노트
- [[1a 자료구조]] — 자료구조 선택 원칙 (언제 세그트리+Lazy인가)

## 레퍼런스 노트
- [[백준 1395 switch Lazy Propagation의 의미, 조건]] — Lazy Prop 상세 설명 및 C++ 구현

## 관련 키워드
- [[세그먼트-트리]]
