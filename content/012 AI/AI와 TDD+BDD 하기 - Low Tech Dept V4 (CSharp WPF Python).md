# AI와 TDD 없는 상태에서 시작하는 Low Tech Dept 개발 가이드 (v4 – C#/WPF + Python)

## 1. 이 문서의 목표

이 문서는 **TDD/BDD 경험이 전혀 없는 개발자**가, Claude Code 같은 AI 코딩 도구를 쓰면서도

- 이해하지 못한 코드가 쌓이지 않고
- 장기적으로 유지보수성이 높으며
- 기술부채가 최소화된 코드베이스

를 만들 수 있도록, **실질적인 작업 순서와 예시**를 제공하는 가이드다.

> **플랫폼/언어에 독립적인 방법론**: 이 문서의 예시는 C#/WPF와 Python을 기준으로 하지만, 핵심 원칙은 다른 어떤 프로그래밍 언어 환경에서도 동일하게 적용된다. 부록 A에서 각 플랫폼별 도구 매핑을 참고.

핵심 아이디어는:

1. 사람(나)은 **"계약(Contract)"을 100% 이해/승인**한다.
2. AI는 그 계약을 만족시키기 위해 **구현을 반복**한다.
3. 계약은 점점 더 **자동 검증(테스트/빌드/린트 등)** 으로 옮겨간다.

여기서 "계약"은 다음 네 가지다.

- 요구사항(행동/Spec)
- 공개 인터페이스(API)
- 불변식(Invariants)
- 검증 수단(테스트, 빌드, 린트, 출력 확인 등)

---

## 2. "100% 이해"를 재정의하기

기존에 나는 AI가 작성한 코드를 상세하게 읽고 100% 이해해야만 추후에 디버깅, 유지보수를 할 수 있다고 생각했다. 하지만 대규모/장기 프로젝트에서, **변경된 모든 코드 라인을 사람이 100% 이해하는 것**은 현실적으로 불가능에 가깝다. 특히:

- 반복적인 변환/리네이밍/보일러플레이트
- 단순 상태 전파/UI 배치 같은 기계적인 코드

까지 전부 머릿속에 넣으려 하면, 개발 속도는 극단적으로 느려진다. 그래서 이 가이드는 "이해해야 하는 단위"를 다음처럼 재정의한다.

### 사람이 100% 이해해야 하는 것(반드시 나의 소유)

- 기능의 요구사항(입력/출력, 유저 행동, 실패 조건)
- 공개 API/인터페이스(함수 시그니처, 타입, 모듈 경계)
- 불변식(invariant): "절대 깨지면 안 되는 성질"
- 주요 리스크(보안, 성능, 동시성, 데이터 일관성)
- 검증 방법(테스트/빌드/플레이테스트 체크리스트)

### 사람이 라인단위로 모두 이해하지 않아도 되는 것(가능한 범위)

- 내부 구현의 기계적인 디테일
- 반복적인 변환/리팩토링/리네이밍
- 테스트로 충분히 커버되는 순수 로직

즉, **"코드 전체" 대신 "계약 + 검증"을 신뢰 단위로 삼는다.**

---

## 2.5. 용어 정리 및 대응 관계

### 용어 정의

| 용어            | 역할               | 형태               |
| ------------- | ---------------- | ---------------- |
| **Spec**      | 기능이 "무엇을 하는지" 정의 | .md 문서 또는 테스트 코드 |
| **Invariant** | "절대 깨지면 안 되는 규칙" | .md 문서           |
| **Interface** | 입출력 형태와 의존성 경계   | 코드 (.cs, .py 등)  |
| **Test**      | 행동 명세 + 자동 검증    | 코드               |
| **Class/구현**  | 실제 동작            | 코드 (AI가 생성 가능)   |

### 대응 관계

```
Spec ←→ Invariant     다:다 (하나의 spec이 여러 invariant 참조 가능, 역도 성립)
Spec ←→ Interface     1:다 (하나의 spec에 여러 interface)
Spec ←→ Test          1:다 (하나의 spec에 여러 test)
Interface ←→ Class    1:다 (하나의 interface에 여러 구현체 가능)
```

### 모든 것에 전부 필요하진 않다

**Interface가 필요한 경우:**

- 테스트에서 mock 필요
- 구현체가 여러 개
- 의존성 주입

**Interface 없어도 되는 경우:**

- 순수 데이터 (struct, record, dataclass)
- 상태 없는 유틸 함수
- 구현체 하나, 바뀔 일 없음

### 계약의 형태

명시적 문서가 없어도 계약은 존재한다:

| 형태               | 언제 쓰나                  |
| ---------------- | ---------------------- |
| 명시적 문서 (spec.md) | 복잡한 기능, 여러 클래스 협력      |
| 테스트 코드           | 행동 명세 (가장 작은 형태의 spec) |
| 타입/시그니처          | 입출력 형태                 |
| 네이밍              | 의도                     |
| 예외/검증 코드         | 제약조건                   |

**문서화 기준:**

```
코드가 자명함 (Normalize, Distance 등)
→ 시그니처 + 테스트면 충분

코드가 복잡함 (도메인 규칙, 여러 분기, 클래스 협력)
→ 별도 spec 문서 필요
```

### 권장 파일 경로 예시

#### 문서 구조 (기능 단위로 구성, 코드 구조 모방 ❌)

```
docs/
├── specs/
│   ├── item-detail-panel.md        ← 기능 단위
│   ├── inventory-system.md
│   ├── settings-panel.md
│   └── order-state.md
│
└── invariants/
    ├── session-rules.md            ← 도메인 규칙 단위
    ├── mvvm-boundary.md
    └── data-consistency-rules.md
```

코드 구조를 그대로 모방하면 (예: `specs/ViewModels/ItemDetailPanelViewModel.md`) 코드 리팩토링할 때마다 문서 경로도 바꿔야 하고, 폴더 깊이만 깊어져서 찾기 어려워진다.

#### 코드 구조: 소규모 (인터페이스 10개 이하)

**C#/WPF:**

```
src/
├── Interfaces/
│   ├── IItemDetailPanel.cs
│   └── ISessionStore.cs
├── ViewModels/
│   └── ItemDetailPanelViewModel.cs
├── Views/
│   └── ItemDetailPanelView.xaml
├── Models/
│   └── ItemContext.cs
└── Tests/
    └── ItemDetailSessionStoreTests.cs
```

**Python:**

```
src/
├── interfaces/
│   └── item_detail_panel.py   # Protocol 정의
├── services/
│   └── session_store.py
├── models/
│   └── item_context.py        # dataclass
└── tests/
    └── test_session_store.py
```

#### 코드 구조: 중규모 (인터페이스 10~30개)

기능 도메인별로 폴더 분리:

**C#/WPF:**

```
src/
├── ItemDetail/
│   ├── Interfaces/
│   │   └── IItemDetailPanel.cs
│   ├── ViewModels/
│   │   └── ItemDetailPanelViewModel.cs
│   ├── Views/
│   │   └── ItemDetailPanelView.xaml
│   └── Tests/
│       └── ItemDetailSessionStoreTests.cs
├── Inventory/
│   └── ...
└── Settings/
    └── ...
```

**Python:**

```
src/
├── item_detail/
│   ├── interfaces.py
│   ├── session_store.py
│   └── tests/
│       └── test_session_store.py
├── inventory/
│   └── ...
└── settings/
    └── ...
```

#### 코드 구조: 대규모 (인터페이스 30개 이상)

별도 어셈블리/패키지로 분리:

**C#/WPF:**

```
src/
├── Core/                           ← 순수 로직 (별도 프로젝트)
│   ├── Core.csproj
│   ├── ItemDetail/
│   ├── Inventory/
│   └── Settings/
│
├── WpfApp/                         ← WPF 의존 구현체
│   ├── WpfApp.csproj               ← Core 참조
│   ├── ItemDetail/
│   └── ...
│
└── Tests/
    ├── Tests.csproj
    └── ...
```

**Python:**

```
src/
├── core/                           ← 순수 로직 (패키지)
│   ├── item_detail/
│   ├── inventory/
│   └── settings/
│
├── app/                            ← UI/프레임워크 의존 구현체
│   └── ...
│
└── tests/
    └── ...
```

#### 분리 시점 판단 기준

|신호|조치|
|---|---|
|한 폴더에 파일 15개 이상|도메인별 하위 폴더 분리|
|순환 참조 발생|별도 어셈블리/패키지로 분리|
|빌드 시간 급증|Core/App 분리|
|팀원 간 충돌 잦음|도메인별 소유권 분리|

#### Spec ↔ Interface ↔ Invariant 매핑 예시

```
item-detail-panel.md (spec)
├── 참조하는 invariants:
│   ├── mvvm-boundary.md
│   └── session-rules.md
├── 관련 interfaces:
│   ├── IItemDetailPanel.cs (C#/WPF) 또는 item_detail_panel.py (Python)
│   └── ItemContext (record/dataclass)
└── 관련 tests:
    └── ItemDetailSessionStoreTests.cs 또는 test_session_store.py
```

### 2.6 문서 간 링크 규칙 (권장)

각 기능(Feature)마다 아래 4개 아티팩트가 **서로 하이퍼링크로 연결**되도록 한다.

```
Spec ←→ Invariants ←→ Interface ←→ Tests
         ↑___________________________↓
```

#### 상단 링크 블록 템플릿

모든 문서/코드 파일에 동일한 포맷 사용:

```md
<!-- Links -->
- Specs: (this file) 또는 [item-detail-panel.md](...)
- Invariants: [session-rules.md](...), [mvvm-boundary.md](...)
- Interfaces: [IItemDetailPanel.cs](...) 또는 [item_detail_panel.py](...)
- Tests: [ItemDetailSessionStoreTests.cs](...) 또는 [test_session_store.py](...)
```

**Spec 파일 상단 (docs/specs/item-detail-panel.md):**

```md
<!-- Links -->
- Specs: (this file)
- Invariants: [session-rules.md](../invariants/session-rules.md)
- Interfaces: [IItemDetailPanel.cs](../../src/Interfaces/IItemDetailPanel.cs)
- Tests: [ItemDetailSessionStoreTests.cs](../../src/Tests/ItemDetailSessionStoreTests.cs)
```

**Invariants 파일 상단 (docs/invariants/session-rules.md):**

```md
<!-- Links -->
- Specs: [item-detail-panel.md](../specs/item-detail-panel.md), [inventory-system.md](../specs/inventory-system.md)
- Invariants: (this file)
- Interfaces: [IItemDetailPanel.cs](../../src/Interfaces/IItemDetailPanel.cs)
- Tests: [ItemDetailSessionStoreTests.cs](../../src/Tests/ItemDetailSessionStoreTests.cs)
```

**C# Interface/Test 코드 상단 주석:**

```csharp
// Links:
// Specs: docs/specs/item-detail-panel.md
// Invariants: docs/invariants/session-rules.md
// Interfaces: (this file)
// Tests: src/Tests/ItemDetailSessionStoreTests.cs
```

**Python Interface/Test 코드 상단 주석:**

```python
# Links:
# Specs: docs/specs/item-detail-panel.md
# Invariants: docs/invariants/session-rules.md
# Interfaces: (this file)
# Tests: src/tests/test_session_store.py
```

#### 링크의 가치

- **탐색 비용 감소**: "이 테스트가 어떤 스펙을 검증하지?" → 바로 점프
- **변경 영향도 파악**: 스펙 바꾸면 어떤 테스트/인터페이스가 영향받는지 한눈에
- **AI에게 컨텍스트 제공**: "이 파일과 연결된 spec, invariant 읽어"가 가능

#### Links 유지보수

테스트나 불변식이 추가되면 관련 문서의 Links도 함께 업데이트한다.

```
새 테스트 파일 생성
    ↓
"이 테스트는 어떤 spec을 검증하지?"
    ↓
해당 spec의 Links → Tests에 추가
    ↓
테스트 파일 상단에도 Links 작성
```

```
새 불변식 발견
    ↓
"이건 어떤 분류지? Safety? Boundary?"
    ↓
해당 invariant 파일에 규칙 추가
    ↓
관련 spec들의 Links → Invariants 업데이트
```

> **중요**: 이 작업은 사람이 직접 한다. Links 추가/수정은 계약 변경이므로 AI에게 맡기지 않는다.

---

## 3. 불변식(Invariant)이란 무엇인가

### 3.1 정의

불변식은 한 문장으로 말하면:

> "이 모듈/시스템이 **정상 상태**로 간주되려면 **항상 참이어야 하는 조건**"

이다.

예시:

- 한 사용자에 대해 ItemDetailPanel은 동시에 **1개만** 열려 있어야 한다.
- View는 절대 Model을 직접 수정하지 않는다. 반드시 ViewModel을 통한다 (MVVM 경계).
- 계좌 잔고는 어떤 연산이 있었더라도 항상 0 이상이어야 한다.

### 3.2 테스트와의 차이

- 테스트: "이 입력 → 이런 출력" 같은 **샘플 케이스**
- 불변식: 모든 실행 경로, 모든 시점에서 항상 지켜져야 하는 **전역 규칙**

이상적으로는 **불변식을 테스트/검증 코드로 표현**해야 하지만, 당장 전부 자동화하지 못하더라도 **문장으로 먼저 고정**해두는 것만으로도 큰 가치가 있다.

### 3.3 불변식을 왜 먼저 적어두는가

- 불변식은 코드 리팩토링/확장 시 "어디까지 건드려도 안전한지"를 알려주는 안전선이다.
- AI에게도 "이건 어떤 구현이건 절대 깨지면 안 되는 규칙"이라 못 박을 수 있다.
- 테스트로 다 표현하기 어려운 아키텍처 경계(MVVM 레이어, 모듈 간 책임 분리)에 특히 유용하다.

### 3.4 불변식 분류와 작성 규칙

불변식은 유지보수 과정에서 계속 늘어나므로, 처음부터 **종류별로 분류**해서 관리한다.

#### 분류

|종류|설명|예시|
|---|---|---|
|**Safety (안전)**|깨지면 치명적 (중복 보상/데이터 유실/권한 우회)|"데이터 저장은 서비스 계층에서만 한다"|
|**Consistency (일관성)**|상태/데이터 관계|"잔고 ≥ 0", "세션당 패널 1개", "중복 생성 금지"|
|**Boundary (경계)**|레이어 책임 분리|"View는 Model을 직접 수정하지 않는다"|
|**Performance (성능)**|리소스/프레임 예산|"대용량 데이터 로딩은 async로만 한다"|

#### ItemDetailPanel 예시에 분류 적용

```md
- I1. [Consistency] 한 사용자에 대해 ItemDetailPanel은 동시에 1개만 열린다.
- I2. [Boundary] View는 Model을 직접 수정하지 않는다. 반드시 ViewModel을 통한다 (MVVM 경계).
- I3. [Consistency] Panel을 열 때 항상 itemId를 포함한 ItemContext를 전달한다.
```

#### 작성 규칙 (권장)

1. **"항상(Always)", "절대(Never)"가 들어가는 문장으로 쓴다.**
    
    - ❌ "UI는 하나만 띄우는 게 좋다"
    - ✅ "UI는 항상 1개만 열린다"
2. **어디에서 강제할지 명시한다.**
    
    - 예: "(ViewModel에서 강제)", "(SessionStore에서 체크)", "(서비스 계층에서 관리)"
3. **가능하면 테스트/verify로 옮긴다.**
    
    - 처음엔 문장으로 고정해도 되지만, 시간이 지나면 자동 검증으로 이전

### 3.5 디자인패턴/프레임워크와 불변식

프로젝트에서 특정 디자인패턴이나 프레임워크를 따른다면, **그 패턴이 강제하는 구조와 제약을 불변식으로 정의**한다.

#### 왜 불변식으로 정의하나?

- 패턴의 핵심 규칙을 명시적으로 문서화
- AI가 패턴을 위반하는 구현을 하지 않도록 방지
- 새 모듈 추가 시 어떤 구조를 따라야 하는지 명확

#### 예시: MVVM 패턴 (WPF)

```md
# docs/invariants/architecture-mvvm.md

## Boundary (MVVM 패턴)
- [Boundary] View는 절대 Model을 직접 수정하지 않는다.
- [Boundary] Model은 View를 알지 못한다 (의존성 방향: View → ViewModel → Model).
- [Boundary] ViewModel만 Model과 View 양쪽을 참조한다.
- [Consistency] 하나의 View는 하나의 ViewModel에만 연결된다.
- [Boundary] 사용자 입력은 ICommand를 통해서만 ViewModel에 전달된다.
```

#### 예시: MVC 패턴

```md
# docs/invariants/architecture-mvc.md

## Boundary (MVC 패턴)
- [Boundary] View는 절대 Model을 직접 수정하지 않는다.
- [Boundary] Model은 View를 알지 못한다 (의존성 방향: View → Controller → Model).
- [Boundary] Controller만 Model과 View 양쪽을 참조한다.
- [Consistency] 하나의 View는 하나의 Controller에만 연결된다.
```

#### 예시: Flux/Redux 패턴 (상태 관리)

```md
# docs/invariants/architecture-flux.md

## Boundary (Flux 패턴)
- [Boundary] State는 오직 Reducer(또는 Store)를 통해서만 변경된다.
- [Boundary] View는 State를 직접 수정하지 않고 Action을 dispatch한다.
- [Consistency] State 변경은 항상 동기적이고 예측 가능해야 한다.
- [Safety] Side effect(API 호출 등)는 Middleware/Thunk에서만 처리한다.
```

#### 적용 흐름

```
1. 사용할 패턴/프레임워크 선택 (너)
         ↓
2. 패턴의 핵심 규칙을 불변식으로 작성 (docs/invariants/architecture-*.md)
         ↓
3. 불변식에 맞는 Interface 정의
         ↓
4. SPEC 작성 시 "Related invariants"에 아키텍처 불변식 링크
         ↓
5. AI는 아키텍처 불변식 + 기능 불변식 모두 준수하며 구현
```

#### SPEC에서 참조하는 방법

```md
# docs/specs/item-detail-panel.md

<!-- 관련 문서 -->
- Invariants: 
  - [architecture-mvvm.md](../invariants/architecture-mvvm.md)  ← 아키텍처
  - [session-rules.md](../invariants/session-rules.md)          ← 도메인
```

이렇게 하면 AI가 구현할 때 아키텍처 규칙과 도메인 규칙을 모두 참조하게 된다.

---

## 4. 전체 방법론: Contract-first + Verification Loop

이제 실제로 기능을 만들 때, 어떤 순서로 진행하는지 단계별로 정리한다.

### Step 0. 기능/티켓을 하나 고른다

예시(C#/WPF ItemDetailPanel 케이스):

> 목록 화면에 아이템 목록이 이미 표시되어 있다. 사용자가 목록에서 항목을 더블클릭하면 ItemDetailPanel(상세 창)이 열리게 만들고 싶다.

이 기능 하나를 단위로, 아래 과정을 수행한다.

---

### Step 1. 행동 기반 Spec 작성 (사람 100% 이해)

먼저 코드를 쓰지 말고, **사용자 입장에서 보이는 행동**을 스펙으로 적는다.

#### SPEC 템플릿 (권장)

```md
# <Feature Name> – SPEC

## Goal
- (이 기능이 사용자에게 주는 가치 1~2줄)

## Non-goals (이번 티켓에서 하지 않음)
- (예: 수정/삭제 기능, 애니메이션, 사운드 등)

## Out of scope (절대 건드리지 말 것)
- (예: 기존 목록 로직 수정 금지, 데이터 저장 구조 변경 금지 등)

## User Flow
1. ...
2. ...
3. ...

## Edge Cases
- ...
- ...

## Acceptance Criteria (검증 가능한 문장 3~7개)
- AC1. ...
- AC2. ...
- AC3. ...

## Done 정의 (Exit criteria)
### 자동 검증
- (예: verify 스크립트 통과, 특정 테스트 통과)

### 수동 검증 (UI 확인)
- (예: 패널 위치 확인, 체감 성능 확인)

## Risks / Notes
- (예: MVVM 경계, 중복 방지, 동시성 등)
```

> **중요:**
> 
> - Acceptance Criteria는 반드시 **'예/아니오'로 판정 가능**해야 한다.
> - **Non-goals/Out of scope가 비어 있으면 AI가 과구현할 확률이 높다.** 반드시 채울 것.

#### 예시: ItemDetailPanel SPEC

```md
# ItemDetailPanel – SPEC

## Goal
- 사용자가 목록에서 항목을 더블클릭하면 ItemDetailPanel(상세 창)이 열린다.

## Non-goals (이번 티켓에서 하지 않음)
- 아이템 수정/삭제 기능 (별도 티켓)
- 애니메이션/전환 효과
- 인쇄/내보내기 기능
- 랭킹/통계

## Out of scope (절대 건드리지 말 것)
- 기존 목록(ListViewModel) 로직 수정 금지
- 데이터 저장/서버 연동 로직
- 네트워크 아키텍처

## User Flow
1. 사용자가 목록 화면에서 항목을 더블클릭한다.
2. ItemDetailPanel이 화면에 열린다.
3. 선택한 항목의 상세 정보(이름, 설명 등)가 표시된다.
4. 닫기 버튼 또는 ESC로 패널을 닫을 수 있다.

## Edge Cases
- 이미 패널이 열려 있는 상태에서 다른 항목을 더블클릭하면 패널이 **추가로 생성되지 않고** 기존 패널 내용이 교체된다.
- 패널을 닫은 뒤 다시 더블클릭하면 정상적으로 다시 열린다.

## Acceptance Criteria
- AC1. 항목 더블클릭 시 ItemDetailPanel이 화면에 표시된다.
- AC2. 3번 연속 더블클릭해도 패널은 1개만 유지된다.
- AC3. 닫기 버튼 클릭 시 패널이 사라진다.
- AC4. ESC 키로도 패널을 닫을 수 있다.
- AC5. 앱 로그에 "ItemDetailOpen: userId=..., itemId=..." 형태가 찍힌다.

## Done 정의
### 자동 검증
- verify 스크립트 통과
- ItemDetailSessionStoreTests 테스트 통과

### 수동 검증 (UI 확인)
- 패널 위치/레이아웃 정상 확인
- 반응 속도 체감 확인

## Risks / Notes
- MVVM 경계 주의 (I2 불변식)
- 중복 생성 방지 로직 필수 (I1 불변식)
- ItemContext 누락 방지 (I3 불변식)
```

이 문서는

- 나중에 스펙 이상 동작이 발생했을 때 비교 기준
- AI에게 "무엇이 성공인지"를 알려주는 기준

이 된다.

---

### Step 2. 공개 인터페이스(API) 고정 (사람 100% 이해)

**되도록이면 작성도 사람이 할 것 → Syntax, 라이브러리 감각, 디버깅 근육 퇴화 방지**

구현(내부 로직)보다 먼저, **모듈들 사이의 경계**를 타입/함수 시그니처로 정한다.

#### 인터페이스란?

"이 모듈을 사용하려면 이 함수들만 알면 된다"는 **공개 API 정의**다. 내부 구현이 어떻게 바뀌든, 이 시그니처만 유지되면 다른 코드에 영향이 없다.

#### 2.1 언어별 인터페이스 정의 방법

**C#/WPF (interface 키워드 사용):**

```csharp
// Interfaces/IItemDetailPanel.cs
public interface IItemDetailPanel
{
    void Open(ItemContext context);
    void Close();
    bool IsOpen { get; }
}

public record ItemContext(string ItemId, string ItemName);
```

**Python (Protocol 사용):**

```python
# interfaces/item_detail_panel.py
from typing import Protocol
from dataclasses import dataclass

@dataclass
class ItemContext:
    item_id: str
    item_name: str

class IItemDetailPanel(Protocol):
    def open(self, context: ItemContext) -> None: ...
    def close(self) -> None: ...
    @property
    def is_open(self) -> bool: ...
```

> **Python 참고**: `interface` 키워드가 없어서 `Protocol`로 구조적 서브타이핑을 정의한다. 실제 구현체는 이 Protocol을 만족하도록 작성.

#### 2.2 통신 계약 (ViewModel ↔ Service, IPC 등)

타입 시스템으로 강제할 수 없는 경계는 **문서로 명시**한다.

**WPF ICommand 계약 예시:**

```md
## 통신 계약: OpenItemDetailCommand

- 타입: ICommand (RelayCommand 구현)
- 위치: ItemDetailPanelViewModel.OpenItemDetailCommand
- 파라미터: ItemContext (선택된 항목 컨텍스트)
- 실행 조건: CanExecute는 항상 true (패널이 열려도 교체 허용)
- 실행 결과: ItemDetailPanel이 열리고 IsOpen = true
```

**REST API 예시:**

```md
## 통신 계약: GET /api/items/{itemId}

- Response: `{ itemId: string, itemName: string, description: string }`
- 에러: 404 (존재하지 않는 itemId)
```

#### 2.3 인터페이스 작성: 현실적 타협안

**이상적**: 사람이 100% 직접 작성

**현실적 타협**: AI한테 초안을 받되, 다음 과정을 거침

1. AI에게 "인터페이스만 제안해줘, 구현은 하지 마" 요청
2. 제안받은 인터페이스를 **한 줄씩 읽고** 이해
3. 이해 안 되는 부분은 질문하거나 단순화 요청
4. 최종 승인한 인터페이스를 **직접 타이핑**해서 커밋 (복붙 금지. 타이핑하면서 한 번 더 이해하게 됨)

이 과정을 생략하고 AI 제안을 그대로 쓰면, "내가 이해 못하는 인터페이스"가 계약이 되어버림.

---

### Step 3. 불변식(Invariants) 문장으로 잠그기 (사람 100% 이해)

이 기능에서 절대 깨지면 안 되는 규칙을 목록으로 적는다.

예시:

- I1. 한 사용자에 대해 ItemDetailPanel은 **동시에 1개만** 열린다. (중복 생성 금지)
- I2. View는 Model을 직접 수정하지 않는다. **반드시 ViewModel을 통한다** (MVVM 경계). ViewModel의 ICommand를 통해서만 사용자 입력이 전달된다.
- I3. Panel을 열 때 항상 `itemId`를 포함한 `ItemContext`를 전달한다.

이제 앞으로 **어떤 구현/리팩토링/AI 수정이 들어와도 I1~I3가 깨지는 변경은 버그**라고 간주한다.

---

### Step 4. 검증 방법(테스트/검증 루프) 설계

TDD 경험이 없고 테스트 인프라도 아직 없다면, 처음에는 **수동 검증 절차**부터 만든다.

#### 4.0 테스트 케이스도 직접 작성할 것 (권장)

인터페이스와 마찬가지로, **테스트 케이스 작성도 되도록 사람이 직접 하는 게 좋다.**

이유:

- 테스트를 작성하려면 "이 함수가 뭘 해야 하는지"를 정확히 이해해야 함
- AI한테 테스트까지 맡기면, 구현과 테스트가 같은 오해를 공유할 수 있음
- 테스트 작성은 디버깅 근육과 직결됨 - 뭘 검증해야 하는지 아는 게 핵심

현실적 타협:

1. **테스트 케이스 목록**은 사람이 작성 (어떤 시나리오를 검증할지)
2. **테스트 코드 boilerplate**는 AI한테 맡겨도 됨 (SetUp/TearDown 등)
3. **assertion 부분**은 사람이 직접 작성하거나 최소한 한 줄씩 읽고 이해

```text
// AI한테 줄 프롬프트
테스트 파일 구조만 만들어줘. [TestFixture]/[Test] 블록과 SetUp만.
assertion은 비워두고, 내가 직접 채울게.
```

#### 4.1 수동 검증(Verification) 체크리스트

- V1. 목록에서 항목을 3번 연속 더블클릭해도 패널은 1개만 떠 있어야 한다. (I1)
- V2. 패널을 닫고 다시 더블클릭했을 때 정상적으로 다시 떠야 한다. (I1)
- V3. 앱 로그에서 `ItemDetailOpen: userId=..., itemId=...` 로그가 매번 찍히는지 확인한다. (I3)

> 나중에 자동화하려면 Step 8을 참고

나중에 NUnit/xUnit 같은 프레임워크를 도입하면, V1~V3 중 일부를 자동화된 테스트로 옮겨갈 수 있다.

---

### Step 5. AI에게 Plan(계획) 먼저 뽑게 하기

Claude Code는 "큰/복잡한 작업일수록 Explore → Plan → Implement → Commit 순서로 진행"하는 것을 권장한다.

#### 5.1 Claude Code에 줄 프롬프트 예시 (Plan Mode)

```text
아래 SPEC, 인터페이스, 불변식(I1~I3)은 고정이고 수정하면 안 돼.
이걸 기준으로 ItemDetailPanel 오픈 기능을 구현하기 위한 계획만 세워줘.

규칙:
- 지금은 코드를 수정하지 말고, 관련 파일을 읽고 PLAN.md에 계획만 작성해.
- 어떤 파일을 새로 만들지, 어떤 파일을 수정할지, 각 단계에서 무엇을 검증할지 적어줘.

[SPEC]
(여기에 SPEC.md 내용 붙여넣기)

[INTERFACE]
(IItemDetailPanel.cs 또는 item_detail_panel.py 내용)

[INVARIANTS]
- I1 ...
- I2 ...
- I3 ...
```

Claude가 만들어줄 `PLAN.md` 예시는 대략 이런 구조가 될 것이다:

```md
# PLAN – ItemDetailPanel

## Files to create
- src/Interfaces/IItemDetailPanel.cs (이미 정의된 인터페이스)
- src/Models/ItemContext.cs
- src/ViewModels/ItemDetailPanelViewModel.cs
- src/Views/ItemDetailPanelView.xaml
- src/Services/ItemDetailSessionStore.cs

## Steps
1. ItemContext record 및 IItemDetailPanel 인터페이스 확인.
2. ItemDetailSessionStore 구현 (I1 중복 방지 로직 포함).
3. ItemDetailPanelViewModel 구현 (OpenCommand, CloseCommand, IsOpen 바인딩).
4. ItemDetailPanelView.xaml 구현 (ViewModel DataContext 연결, 더블클릭 커맨드 바인딩).
5. 목록 View에서 더블클릭 시 OpenItemDetailCommand 호출.

## Manual Verification
- V1, V2, V3 체크리스트 수행.
```

이 시점까지는 여전히 코드 변경이 없다. **방향과 책임 분리를 먼저 고정**한 것.

#### 5.2 Plan mode 없을 때

##### "코드 작성 금지. 먼저 질문/탐색/계획만."

```text
역할: 시니어 엔지니어. 아직 코드는 쓰지 마. 

목표: (기능/버그 한 문장) 

제약: (수정 금지 파일, API 변경 금지, 불변식 등) 

1) 먼저 필요한 질문 3~7개만 해줘. 
2) 코드베이스에서 확인해야 할 파일/진입점 목록을 적어줘. 
3) PLAN을 Markdown으로 작성해줘:    
   - SCOPE: 바꾸는 것 / 안 바꾸는 것   
   - FILES: 수정/추가할 파일 목록   
   - STEPS: 30분 내로 끝나는 작은 단계들   
   - VALIDATION: 각 단계 후 확인할 테스트/커맨드/수동 체크리스트   
   - RISKS: 실패 가능성/롤백 
대답 출력은 PLAN.md 내용만 할 것
```

##### 턴 2: PLAN.md 읽고 승인 또는 수정

---

### Step 6. AI에게 구현을 맡기되, 계약/불변식은 금지 영역으로 둔다

이제 Normal 모드에서 실제 코드를 작성하게 한다.

#### 6.1 구현 프롬프트 예시

##### 턴 3

```text
이제 PLAN.md대로 구현을 진행해줘.

중요 규칙:
- SPEC, INTERFACE(IItemDetailPanel 정의), INVARIANTS(I1~I3)는 수정하면 안 돼.
- 변경은 작은 단위로 진행해.
- 각 단계가 끝나면 내가 V1~V3를 수동으로 검증할 수 있도록,
  어떤 동작을 테스트해야 하는지 간단히 설명해줘.

우선 1~3단계까지만 구현하고 멈춰.
```

Claude가 ViewModel/서비스 코드를 작성해줄 것이고, 너는 그때그때 V1~V3를 수동으로 검증한다.

#### 6.2 커밋 전략

##### 커밋 단위

- 하나의 V(검증)를 통과할 때마다 커밋
- 커밋 메시지에 통과한 검증 명시: `feat: ItemDetailPanel Open 구현 (V1, V2 통과)`

##### 커밋 전 체크리스트

- [ ] 관련 불변식 위반 없음 확인
- [ ] 인터페이스 변경 없음 (있으면 별도 커밋)
- [ ] verify 스크립트 통과 (있다면)

##### WIP 커밋 금지

검증 통과 전 "일단 커밋"은 나중에 bisect/blame을 망침.

#### 6.3 검증 실패 시 대응

##### 즉시 롤백 조건

- 불변식(I1~I3) 위반이 발견되면 해당 변경 전체를 revert
- "일단 넣고 나중에 고치자"는 기술부채의 시작

##### 디버깅 프롬프트 예시

```text
V1 검증 실패: 항목을 3번 더블클릭하니 패널이 2개 떴어.

규칙:
- 새 코드를 추가하지 말고, 기존 코드에서 I1 위반 원인만 찾아줘
- ItemDetailPanelViewModel.OpenCommand가 실행되는 시점에 IsOpen 체크가 있는지 확인해줘
- 원인 분석만 하고, 수정은 내가 승인하면 해
```

##### 3단계 디버깅

1. AI한테 원인 분석만 시킴 (수정 금지)
2. 분석 결과 읽고 이해했으면 수정 승인
3. 수정 후 V1~V3 전체 재검증

---

### Step 7. Reviewer 세션(별도 에이전트/세션)으로 불변식/리스크만 검토

Writer와는 다른 새로운 Claude 세션을 열어, **코드 리뷰 전용**으로 사용한다.

#### 7.1 Reviewer 프롬프트 예시

```text
다음 변경 사항은 ItemDetailPanel을 더블클릭으로 여는 기능이야.

규칙:
- 코드는 수정하지 마.
- 오직 다음 항목만 검토해:
  - I1: 사용자당 패널이 동시에 1개만 열리도록 보장하는지.
  - I2: View가 Model을 직접 수정하지 않고 ViewModel을 통하는지 (MVVM 경계).
  - I3: 패널을 열 때 항상 itemId를 포함한 ItemContext가 전달되는지.
  - 불필요한 복잡도나 잠재적인 버그 패턴.

코드:
(여기에 관련 ViewModel/View 코드를 붙여넣기)
```

Reviewer는 보통 다음 같은 문제를 찾아낼 수 있다:

- View의 코드비하인드에서 직접 Model을 수정하고 있는 부분 (I2 위반)
- 패널이 열려 있는지 체크 없이 매번 새 Window를 만드는 부분 (I1 위반 가능성)
- ItemContext 없이 패널을 여는 부분 (I3 위반)

이 지적을 다시 Writer 세션에 가져가서 "이 부분만 수정"하도록 시키면 된다.

---

### Step 7.5. 검증의 진화: 수동 → 자동 → 하이브리드

Step 6에서 "그때그때 V1~V3를 수동으로 검증한다"고 했는데, 이건 시간이 지나면서 진화한다.

#### Phase 1: 전부 수동

테스트 인프라가 없을 때. 모든 검증을 사람이 직접 한다.

```
V1. 더블클릭 3번 눌러도 패널 1개  → 내가 직접 확인
V2. 닫고 다시 열기                 → 내가 확인
V3. 앱 로그에 itemId 찍히나        → 내가 출력 창 확인
```

#### Phase 2: 테스트 프레임워크 도입 후

자동화 가능한 검증은 테스트 코드로 옮긴다.

```
V1. → ItemDetailSessionStoreTests.cs   ✅ 자동 (NUnit/xUnit)
V2. → ItemDetailSessionStoreTests.cs   ✅ 자동
V3. → test_session_store.py            ✅ 자동 (pytest, mock으로 검증 가능)
```

#### Phase 3: 자동화 불가능한 것들은 수동 유지

모든 게 자동화되진 않는다. 다음은 계속 사람이 해야 함:

```
V4. "패널이 화면에 올바르게 나타나는가"  ❌ 수동 (시각적 확인)
V5. "반응 속도가 체감상 괜찮은가"        ❌ 수동 (실사용 테스트)
V6. "MVVM 경계 위반 없나"               ❌ 수동 (코드리뷰/Reviewer 세션)
```

#### 최종 형태: 하이브리드 체크리스트

```markdown
# ItemDetailPanel - Verification Checklist

## 자동 검증 (CI/verify 스크립트)
- [x] V1. 중복 생성 방지 → `ItemDetailSessionStoreTests`
- [x] V2. 닫고 다시 열기 → `ItemDetailSessionStoreTests`
- [x] V3. itemId 전달 → `test_session_store.py`

## 수동 검증 (릴리즈 전 UI 확인)
- [ ] V4. 패널 위치/레이아웃 정상
- [ ] V5. 반응 속도 체감
- [ ] V6. 에러 로그 없음

## 코드리뷰 검증 (Reviewer 세션)
- [ ] I2. View에서 Model 직접 수정 없음 (MVVM 경계)
```

#### 프롬프트도 진화한다

**Phase 1 (전부 수동)**

```text
Step 1-3 구현 완료되면 멈춰.
내가 V1~V3 수동으로 검증할게.
```

**Phase 2+ (하이브리드)**

```text
Step 1-3 구현하고 테스트도 실행해서 통과 확인해줘.
V1~V3은 자동 검증되니까,
V4~V5는 내가 직접 확인할게.
```

---

### Step 8. 검증 인프라 레이어를 한 겹씩 추가하기

지금까지는 **수동 검증**만으로도 꽤 견고한 구조를 만들었다. 여기에 인프라를 한 겹씩 올리면, "네가 매번 눈으로 확인"해야 하는 부담이 줄어든다.

#### 8.1 1겹: 로컬 `verify` 스크립트

- `verify` 스크립트 하나로 최소한의 검증을 묶는다.

**C#/WPF verify.sh:**

```bash
#!/bin/bash
set -e

echo "=== Build ==="
dotnet build --no-restore

echo "=== Test ==="
dotnet test --no-build --verbosity normal

echo "=== All checks passed ==="
```

**Python verify.sh:**

```bash
#!/bin/bash
set -e

echo "=== Type Check ==="
mypy src/

echo "=== Lint ==="
pylint src/

echo "=== Test ==="
pytest tests/ -v

echo "=== All checks passed ==="
```

- Claude에게 "각 변경 후 `verify`를 실행해서 통과해야 완료"라고 지시한다.

#### 8.2 2겹: NUnit/pytest로 순수 로직 테스트 추가

여기서는 UI 전체를 테스트하려 하지 말고, I1(중복 오픈 금지)을 담당하는 **상태 관리 모듈**만 떼어 테스트한다.

**C# 인터페이스 먼저 고정:**

```csharp
// Interfaces/ISessionStore.cs
public interface ISessionStore
{
    bool IsOpen(string userId);
    void MarkOpen(string userId);
    void MarkClosed(string userId);
}
```

**C# NUnit 테스트:**

```csharp
// Tests/ItemDetailSessionStoreTests.cs
using NUnit.Framework;

[TestFixture]
public class ItemDetailSessionStoreTests
{
    private ItemDetailSessionStore _store;

    [SetUp]
    public void SetUp() => _store = new ItemDetailSessionStore();

    [Test]
    public void DoesNotOpenTwiceForSameUser()
    {
        const string userId = "User_1";
        Assert.IsFalse(_store.IsOpen(userId));
        _store.MarkOpen(userId);
        Assert.IsTrue(_store.IsOpen(userId));
        _store.MarkOpen(userId);  // 중복 호출
        Assert.IsTrue(_store.IsOpen(userId));
    }

    [Test]
    public void CloseMakesIsOpenFalse()
    {
        const string userId = "User_1";
        _store.MarkOpen(userId);
        _store.MarkClosed(userId);
        Assert.IsFalse(_store.IsOpen(userId));
    }
}
```

**Python pytest 테스트:**

```python
# tests/test_session_store.py
import pytest
from services.session_store import ItemDetailSessionStore

@pytest.fixture
def store():
    return ItemDetailSessionStore()

def test_does_not_open_twice_for_same_user(store):
    user_id = "User_1"
    assert not store.is_open(user_id)
    store.mark_open(user_id)
    assert store.is_open(user_id)
    store.mark_open(user_id)  # 중복 호출
    assert store.is_open(user_id)

def test_close_makes_is_open_false(store):
    user_id = "User_1"
    store.mark_open(user_id)
    store.mark_closed(user_id)
    assert not store.is_open(user_id)
```

이제 I1은 사람 머릿속이 아니라 **테스트 + 코드**로 고정된다. 나중에 누가(또는 AI가) 상태 관리 로직을 건드려도, 이 테스트가 깨지면 즉시 알 수 있다.

#### 8.3 3겹 이후(선택)

- CI(GitHub Actions 등)에서 동일 테스트/빌드를 돌려, 다른 PC/환경에서도 동일 검증이 돌아가게 함.
- 더 복잡한 기능(상세 편집, 연동, 대용량 로딩 등)에 대해서도 같은 패턴을 확장.

---

## 5. 계약 변경 프로세스

계약(SPEC/인터페이스/불변식)은 고정이 원칙이지만, 다음 상황에서는 변경이 필요하다:

1. **요구사항 자체가 바뀔 때** - 기획 변경, 피드백 반영
2. **불변식이 너무 강하거나 약할 때** - 실제 구현하다 보면 발견됨
3. **인터페이스가 확장성을 막을 때**

### 변경이 정당한 경우 (가드레일)

계약 변경은 **다음 경우에만** 허용한다:

1. **요구사항 자체가 변경됨** (기획/피드백)
2. **기존 계약에 모순/누락이 발견됨** (명세가 실제 사용을 설명하지 못함)
3. **계약이 현실적으로 구현/운영을 불가능하게 막고 있음** (과도하게 강한 불변식/제약)

그 외의 경우는 "계약 변경"이 아니라 **"구현 수정"**으로 처리한다.

> ⚠️ **경고**: 테스트를 바꿔서 통과시키는 행위는 기술부채를 숨기는 지름길이다. "테스트가 틀렸다"가 아니라 "구현이 틀렸다"가 기본 가정이어야 한다.

### 변경 프로세스

1. 변경 이유를 CHANGELOG.md나 커밋 메시지에 명시
2. 관련 테스트/검증 체크리스트도 함께 업데이트
3. **절대 AI한테 계약 변경을 맡기지 않는다** - 사람이 직접 수정
4. Non-goals/Acceptance Criteria도 함께 업데이트
5. 변경 후 기존 구현이 새 계약을 만족하는지 재검증

### 계약 변경 커밋 예시

```
refactor(contract): I1 불변식 완화 - 동일 itemId에 한해 패널 교체 허용

이유: 같은 항목 재더블클릭 시 패널 리프레시가 필요한 케이스 발견
변경 전: "한 사용자에 대해 ItemDetailPanel은 동시에 1개만"
변경 후: "한 사용자에 대해 *서로 다른* itemId의 ItemDetailPanel은 동시에 1개만"

SPEC 업데이트:
- AC2 수정: "3번 연속 더블클릭해도 패널은 1개만" → "다른 itemId 더블클릭 시 기존 패널 교체"
- Non-goals에 "동일 itemId 재더블클릭 시 리프레시" 제거

관련 테스트 업데이트: ItemDetailSessionStoreTests.cs, test_session_store.py
```

---

## 6. 기능이 커질 때: 분리 기준

하나의 SPEC/인터페이스/불변식 세트가 다음 신호를 보이면 분리를 고려:

### 분리 신호

- 불변식이 5개를 넘어감
- 인터페이스 함수가 7개를 넘어감
- V(검증) 체크리스트가 10개를 넘어감
- PLAN.md의 Steps가 15개를 넘어감

### 분리 방법

1. 독립적으로 테스트 가능한 단위로 쪼갬
2. 각 단위마다 별도 SPEC/인터페이스/불변식 작성
3. 단위 간 통신은 새로운 인터페이스로 정의

예: ItemDetailPanel → 세션 관리 + UI 렌더링 + 데이터 로딩

### 분리 프롬프트 예시

```text
현재 ItemDetail 모듈이 너무 커졌어.
- 불변식 7개
- 인터페이스 함수 12개
- 검증 체크리스트 15개

규칙:
- 코드는 수정하지 마
- 독립적으로 테스트 가능한 3개 이하의 모듈로 분리 방안을 제안해줘
- 각 모듈별로 SPEC/인터페이스/불변식 초안을 작성해줘
- 모듈 간 의존성 방향을 명시해줘
```

---

## 7. 요약: 이 가이드의 핵심 흐름

1. **기능 하나당** SPEC(행동) → 인터페이스(API) → 불변식(Invariants)을 먼저 적는다.
2. 테스트 인프라가 없어도, **수동 검증 체크리스트(V1~V3)** 를 정의해둔다.
3. Claude Code에 Plan Mode로 계획부터 뽑게 한 뒤, Normal 모드에서 구현을 맡긴다.
4. 이때 SPEC/인터페이스/불변식은 "수정 금지" 영역으로 둔다.
5. Writer 세션과 별도 Reviewer 세션을 만들어, Reviewer는 **계약 위반/리스크만** 지적하게 한다.
6. **검증 실패 시 즉시 롤백**하고, AI한테 원인 분석 → 승인 후 수정 순서로 진행한다.
7. **계약 변경이 필요하면 사람이 직접** 수정하고, 변경 이유를 명시한다.
8. 점점 NUnit/xUnit/pytest 같은 도구로 **불변식 중 핵심 몇 개(I1 등)를 자동화된 테스트로 옮긴다.**
9. 기능이 커지면 **분리 신호**를 감지하고 독립 모듈로 쪼갠다.
10. 최종적으로는 "사람은 계약을 이해/승인"하고, "AI는 그 계약을 만족시키는 구현/수정을 검증 루프 안에서 반복"하는 구조로 수렴한다.

이 흐름을 따르면, TDD를 정석대로 배운 적이 없어도:

- 아무도 이해하지 못하는 코드를 그냥 쌓아두지 않고,
- **계약/테스트/불변식/인터페이스**를 기준으로 코드를 신뢰할 수 있고,
- Claude Code의 빠른 개발 속도를 그대로 활용하면서도
- 장기적으로 기술부채가 적은 코드베이스를 유지할 수 있다.

---

## 8. 빠른 참조: 체크리스트 & 프롬프트 템플릿

### 8.1 새 기능 시작 체크리스트

- [ ] SPEC.md 작성 완료
- [ ] 인터페이스 정의 완료 (직접 타이핑)
- [ ] 불변식 3개 이상 정의
- [ ] 수동 검증 체크리스트 작성
- [ ] AI에게 PLAN 요청
- [ ] PLAN 검토 및 승인

### 8.2 구현 중 체크리스트

- [ ] 각 단계별 검증 통과
- [ ] 불변식 위반 없음
- [ ] 검증 통과 시마다 커밋
- [ ] WIP 커밋 안 함

### 8.3 검증 실패 시 체크리스트

- [ ] 해당 변경 revert
- [ ] AI에게 원인 분석만 요청 (수정 금지)
- [ ] 분석 결과 이해
- [ ] 수정 승인
- [ ] 전체 검증 재수행

### 8.4 자주 쓰는 프롬프트 템플릿

#### Plan 요청

```text
[SPEC], [INTERFACE], [INVARIANTS] 고정. 코드 수정 금지.
PLAN.md만 작성해줘: FILES, STEPS, VALIDATION 포함.
```

#### 구현 요청

```text
PLAN.md Step 1~3까지만 구현해줘.
SPEC/INTERFACE/INVARIANTS 수정 금지.
각 단계 후 검증 방법 설명해줘.
```

#### 디버깅 요청

```text
V1 실패: [증상 설명]
코드 수정 금지. 원인 분석만 해줘.
[관련 불변식] 위반 지점을 찾아줘.
```

#### 리뷰 요청

```text
코드 수정 금지. 검토만 해줘.
- I1 보장 여부
- I2 보장 여부  
- I3 보장 여부
- 잠재적 버그 패턴
```

#### 분리 요청

```text
현재 모듈이 너무 커짐. 코드 수정 금지.
독립 테스트 가능한 모듈로 분리 방안 제안해줘.
각 모듈별 SPEC/인터페이스/불변식 초안 작성해줘.
```

### 8.5 SPEC 템플릿 (복붙용)

```md
# <Feature Name> – SPEC

## Goal
- (이 기능이 사용자에게 주는 가치 1~2줄)

## Non-goals (이번 티켓에서 하지 않음)
- 

## Out of scope (절대 건드리지 말 것)
- 

## User Flow
1. 
2. 
3. 

## Edge Cases
- 
- 

## Acceptance Criteria
- AC1. 
- AC2. 
- AC3. 

## Done 정의
### 자동 검증
- 

### 수동 검증 (UI 확인)
- 

## Risks / Notes
- 
```

### 8.6 상호 링크 템플릿 (복붙용)

```md
<!-- Links -->
- Specs: (this file) 또는 [feature.md](../specs/feature.md)
- Invariants: [rules.md](../invariants/rules.md)
- Interfaces: [IModule.cs](../../src/Interfaces/IModule.cs) 또는 [module.py](../../src/interfaces/module.py)
- Tests: [ModuleTests.cs](../../src/Tests/ModuleTests.cs) 또는 [test_module.py](../../src/tests/test_module.py)
```

C# 코드 파일용:

```csharp
// Links:
// Specs: docs/specs/<feature>.md
// Invariants: docs/invariants/<rules>.md
// Interfaces: (this file) 또는 src/Interfaces/<IModule>.cs
// Tests: (this file) 또는 src/Tests/<Module>Tests.cs
```

Python 코드 파일용:

```python
# Links:
# Specs: docs/specs/<feature>.md
# Invariants: docs/invariants/<rules>.md
# Interfaces: (this file) 또는 src/interfaces/<module>.py
# Tests: (this file) 또는 src/tests/test_<module>.py
```

### 8.7 불변식 템플릿 (복붙용)

```md
# <Domain> Rules – INVARIANTS

<!-- Links -->
- Specs: [feature.md](../specs/feature.md)
- Invariants: (this file)
- Interfaces: [IModule.cs](../../src/Interfaces/IModule.cs) 또는 [module.py](../../src/interfaces/module.py)
- Tests: [ModuleTests.cs](../../src/Tests/) 또는 [test_module.py](../../src/tests/)

## Safety (깨지면 치명적)
- 

## Consistency (상태/데이터 관계)
- 

## Boundary (레이어 책임 분리)
- 

## Performance (리소스 예산)
- 
```

---

## 부록 A. 테스트 가능 영역 분리

### A.1 핵심 원칙

TDD의 효과는 **UI/프레임워크 의존을 최소화한 순수 로직 층을 분리**할 때 극대화된다.

```
UI/프레임워크 의존 (테스트 어려움)      순수 로직 (테스트 가능)
──────────────────────────────────────────────────────────────
WPF 렌더링, 시각적 레이아웃       →     Calculator, Resolver
ViewModel → View 바인딩           ←     Input/Result 데이터
XAML 컨트롤 상태                  →     규칙/계산 로직
```

### A.2 분야별 테스트 가능 영역

#### 애플리케이션 개발 (C#/WPF + Python)

**테스트 가능:**

- 세션 상태 관리 (SessionStore)
- 비즈니스 규칙 계산 (가격 계산, 할인 로직)
- 데이터 변환/직렬화
- 상태 머신 전이 규칙
- 유효성 검증 로직
- 인벤토리/카탈로그 로직 (추가/제거/조회)
- ViewModel 상태 (IsOpen, SelectedItem 등 순수 상태 변화)

**테스트 어려움:**

- WPF 렌더링 결과
- 애니메이션/전환 효과
- 마우스 이벤트 좌표
- 시각적 레이아웃 위치

#### CAD/설계 자동화

**테스트 가능:**

- 지오메트리 연산 (점, 선, 면 계산)
- 좌표 변환 (로컬 ↔ 월드 ↔ 스크린)
- 파라메트릭 규칙 (치수 → 형상 생성 로직)
- 간섭 체크 로직 (충돌 판정 수학 부분)
- BOM 생성 (부품 집계, 수량 계산)
- 파일 파싱 (DXF, IFC 등)
- 유효성 검증 (설계 규칙 위반 체크)
- 단위 변환
- 치수 계산

**테스트 어려움:**

- 실제 렌더링 결과
- 마우스 피킹 (객체 선택)
- 뷰포트 조작
- GPU 가속 연산

### A.3 구조 예시: CAD 치수 시스템

```csharp
// 순수 로직 - DimensionCalculator.cs
public class DimensionCalculator
{
    public DimensionResult Calculate(DimensionInput input)
    {
        // 순수 계산만
    }
}

public struct DimensionInput
{
    public Point3D StartPoint;
    public Point3D EndPoint;
    public DimensionDirection Direction;
    public double Offset;
}

public struct DimensionResult
{
    public double Value;
    public Point3D DimLineStart;
    public Point3D DimLineEnd;
    public Point3D TextPosition;
}
```

```csharp
// 테스트 - DimensionCalculatorTests.cs
[TestMethod]
public void XDirection_HorizontalEdge()
{
    var input = new DimensionInput
    {
        StartPoint = new Point3D(0, 0, 0),
        EndPoint = new Point3D(100, 0, 0),
        Direction = DimensionDirection.X,
        Offset = 20
    };

    var result = _calc.Calculate(input);

    Assert.AreEqual(100, result.Value);
}
```

```csharp
// 엔진 연결 부분 - 얇게 유지
public void OnCreateDimension(Edge selectedEdge, DimensionDirection dir)
{
    var input = new DimensionInput
    {
        StartPoint = selectedEdge.StartVertex.Position,
        EndPoint = selectedEdge.EndVertex.Position,
        Direction = dir,
        Offset = Settings.DefaultDimensionOffset
    };

    var result = _calculator.Calculate(input);

    // 여기만 WPF/엔진 의존
    var dimEntity = CreateDimensionEntity(result);
    Document.Add(dimEntity);
}
```

### A.4 구조 예시: Python 인벤토리

```python
# 순수 로직 - services/inventory.py
from dataclasses import dataclass, field
from typing import Dict

@dataclass
class Inventory:
    max_slots: int
    _slots: Dict[str, int] = field(default_factory=dict)

    def count(self, item: str) -> int:
        return self._slots.get(item, 0)

    def add(self, item: str, amount: int) -> bool:
        if len(self._slots) >= self.max_slots and item not in self._slots:
            return False
        self._slots[item] = self._slots.get(item, 0) + amount
        return True

    def remove(self, item: str, amount: int) -> bool:
        if self.count(item) < amount:
            return False
        self._slots[item] -= amount
        if self._slots[item] == 0:
            del self._slots[item]
        return True
```

```python
# 테스트 - tests/test_inventory.py
from services.inventory import Inventory

def test_add_item_basic():
    inv = Inventory(max_slots=10)
    success = inv.add("iron", 5)

    assert success is True
    assert inv.count("iron") == 5

def test_remove_item():
    inv = Inventory(max_slots=10)
    inv.add("iron", 5)
    success = inv.remove("iron", 3)

    assert success is True
    assert inv.count("iron") == 2
```

```python
# UI/서비스 연결 부분 - 얇게
class InventoryService:
    def __init__(self):
        self._inventory = Inventory(max_slots=20)

    def handle_add_request(self, item: str, amount: int) -> bool:
        success = self._inventory.add(item, amount)
        if success:
            self._notify_ui_update()
        return success

    def _notify_ui_update(self):
        # 여기만 UI/프레임워크 의존
        pass
```

### A.5 적용 전략

**당장 전부 리팩토링 안 해도 된다:**

1. **새 기능 추가할 때** → 로직을 별도 클래스/함수로 빼고, 거기만 테스트 작성
2. **버그 고칠 때** → 버그 재현하는 테스트 먼저 작성 → 테스트 통과하게 수정
3. **점진적으로 확장**

**AI한테 맡기는 방식:**

```
"아래 테스트가 통과하도록 ItemDetailSessionStore 구현해줘.
테스트 코드는 수정하지 마."
```

테스트가 "정답"이니까, AI가 이상하게 구현해도 테스트 돌리면 바로 알 수 있어.

---

## 부록 B. 플랫폼별 도구 매핑

이 가이드의 방법론은 언어/플랫폼에 독립적이다. 아래는 C#/WPF와 Python 환경에서 동일한 역할을 하는 도구들.

### B.1 인터페이스 정의

|플랫폼|도구/방식|
|---|---|
|C#/WPF|`interface` 키워드 + nullable reference types|
|Python|`Protocol` (typing 모듈), `dataclasses`, `TypeVar`|

#### C#/WPF 인터페이스 예시

```csharp
// Interfaces/IItemDetailPanel.cs
public interface IItemDetailPanel
{
    void Open(ItemContext context);
    void Close();
    bool IsOpen { get; }
}

public record ItemContext(string ItemId, string ItemName);
```

#### Python Protocol 예시

```python
# interfaces/item_detail_panel.py
from typing import Protocol
from dataclasses import dataclass

@dataclass
class ItemContext:
    item_id: str
    item_name: str

class IItemDetailPanel(Protocol):
    def open(self, context: ItemContext) -> None: ...
    def close(self) -> None: ...
    @property
    def is_open(self) -> bool: ...
```

### B.2 테스트 프레임워크

|플랫폼|프레임워크|실행 방법|
|---|---|---|
|C#/WPF|NUnit / xUnit / MSTest|`dotnet test`|
|Python|pytest|`pytest tests/ -v`|

#### C#/WPF NUnit 테스트 예시

```csharp
// Tests/ItemDetailSessionStoreTests.cs
using NUnit.Framework;

[TestFixture]
public class ItemDetailSessionStoreTests
{
    private ItemDetailSessionStore _store;

    [SetUp]
    public void SetUp() => _store = new ItemDetailSessionStore();

    [Test]
    public void DoesNotOpenTwiceForSameUser()
    {
        const string userId = "User_1";

        Assert.IsFalse(_store.IsOpen(userId));
        _store.MarkOpen(userId);
        Assert.IsTrue(_store.IsOpen(userId));

        // 다시 열어도 true, 중복 쌓이지 않음
        _store.MarkOpen(userId);
        Assert.IsTrue(_store.IsOpen(userId));
    }

    [Test]
    public void CloseMakesIsOpenFalse()
    {
        const string userId = "User_1";

        _store.MarkOpen(userId);
        _store.MarkClosed(userId);
        Assert.IsFalse(_store.IsOpen(userId));
    }
}
```

#### Python pytest 테스트 예시

```python
# tests/test_session_store.py
import pytest
from services.session_store import ItemDetailSessionStore

@pytest.fixture
def store():
    return ItemDetailSessionStore()

def test_does_not_open_twice_for_same_user(store):
    user_id = "User_1"
    assert not store.is_open(user_id)
    store.mark_open(user_id)
    assert store.is_open(user_id)

    # 다시 열어도 true, 중복 쌓이지 않음
    store.mark_open(user_id)
    assert store.is_open(user_id)

def test_close_makes_is_open_false(store):
    user_id = "User_1"
    store.mark_open(user_id)
    store.mark_closed(user_id)
    assert not store.is_open(user_id)
```

### B.3 verify 스크립트 구성

|플랫폼|타입체크|빌드|테스트|린트|
|---|---|---|---|---|
|C#/WPF|Roslyn (IDE 내장)|`dotnet build`|`dotnet test`|StyleCop / Roslyn Analyzer|
|Python|mypy|N/A|pytest|pylint / ruff|

#### C#/WPF verify 스크립트 예시

```bash
#!/bin/bash
# verify.sh for C#/WPF
set -e

echo "=== Build ==="
dotnet build --no-restore

echo "=== Test ==="
dotnet test --no-build --verbosity normal

echo "=== All checks passed ==="
```

#### Python verify 스크립트 예시

```bash
#!/bin/bash
# verify.sh for Python
set -e

echo "=== Type Check ==="
mypy src/

echo "=== Lint ==="
pylint src/

echo "=== Test ==="
pytest tests/ -v

echo "=== All checks passed ==="
```

### B.4 서비스/계층 간 통신 계약

|플랫폼|방식|
|---|---|
|C#/WPF (MVVM)|ICommand, PropertyChanged, Messenger (CommunityToolkit)|
|C#/WPF (서비스 계층)|인터페이스 주입, DI Container (Microsoft.Extensions.DI)|
|Python (서비스 계층)|Protocol 기반 의존성 주입, dataclass 전달|
|Python (IPC)|REST API (FastAPI), gRPC, 또는 메시지 큐|

**WPF ICommand 계약 예시:**

```csharp
// ViewModels/ItemDetailPanelViewModel.cs
public class ItemDetailPanelViewModel : INotifyPropertyChanged
{
    private readonly IItemDetailSessionStore _sessionStore;
    private bool _isOpen;

    public bool IsOpen
    {
        get => _isOpen;
        private set { _isOpen = value; OnPropertyChanged(); }
    }

    public ICommand OpenCommand { get; }
    public ICommand CloseCommand { get; }

    public ItemDetailPanelViewModel(IItemDetailSessionStore sessionStore)
    {
        _sessionStore = sessionStore;
        OpenCommand = new RelayCommand<ItemContext>(Open);
        CloseCommand = new RelayCommand(Close);
    }

    private void Open(ItemContext context)
    {
        if (!_sessionStore.IsOpen(context.ItemId))
        {
            _sessionStore.MarkOpen(context.ItemId);
            IsOpen = true;
        }
    }

    private void Close()
    {
        IsOpen = false;
    }

    // INotifyPropertyChanged 구현 생략
}
```

### B.5 핵심 원칙은 동일

어떤 플랫폼이든 이 순서는 똑같다:

1. **SPEC** 먼저 (사용자 행동 기준)
2. **인터페이스** 고정 (해당 언어의 타입 시스템 활용)
3. **불변식** 문장으로 정의
4. **검증** 체크리스트 (수동 → 자동화)
5. **AI한테 Plan → 구현** 위임
6. **계약은 사람이 소유**, 구현은 AI가 반복

---

## 부록 C. 테스트 온보딩 (테스트 인프라 0에서 시작)

> **목표**: NUnit/pytest를 당장 도입하지 않아도, "검증 가능한 순수 로직"을 1개 만들어 자동(또는 반자동) 검증 루프를 시작한다.

### C.1 첫 원칙: UI/프레임워크를 테스트하려 하지 말고, 순수 로직부터

**테스트하기 쉬운 것부터 시작:**

- 중복 오픈 방지 (SessionStore)
- 인벤토리 계산 (add/remove/count)
- 쿨다운 계산
- 상태 머신 전이 규칙
- 비즈니스 로직/공식

**첫날부터 하면 안 되는 것:**

- WPF UI 통합 테스트
- 렌더링 결과 검증
- 마우스 이벤트 기반 테스트

### C.2 가장 작은 시작 (Assert 기반)

#### Step 1: 순수 로직 모듈 1개 만들기

**C# 버전:**

```csharp
// Services/ItemDetailSessionStore.cs
public class ItemDetailSessionStore
{
    private readonly HashSet<string> _openSessions = new();

    public bool IsOpen(string userId) => _openSessions.Contains(userId);

    public void MarkOpen(string userId) => _openSessions.Add(userId);

    public void MarkClosed(string userId) => _openSessions.Remove(userId);
}
```

**Python 버전:**

```python
# services/session_store.py
class ItemDetailSessionStore:
    def __init__(self):
        self._open_sessions: set[str] = set()

    def is_open(self, user_id: str) -> bool:
        return user_id in self._open_sessions

    def mark_open(self, user_id: str) -> None:
        self._open_sessions.add(user_id)

    def mark_closed(self, user_id: str) -> None:
        self._open_sessions.discard(user_id)
```

#### Step 2: 테스트 러너 (임시) 만들기

**C# Simple Assert 버전 (NUnit 없이):**

```csharp
// 임시 테스트 러너 - 나중에 NUnit으로 이전
public static class SimpleTestRunner
{
    public static void Run()
    {
        var store = new ItemDetailSessionStore();

        System.Diagnostics.Debug.Assert(!store.IsOpen("user1"), "새 store는 비어있어야 함");

        store.MarkOpen("user1");
        System.Diagnostics.Debug.Assert(store.IsOpen("user1"), "MarkOpen 후 IsOpen은 true");

        store.MarkOpen("user1");  // 중복 호출
        System.Diagnostics.Debug.Assert(store.IsOpen("user1"), "중복 MarkOpen도 true 유지");

        store.MarkClosed("user1");
        System.Diagnostics.Debug.Assert(!store.IsOpen("user1"), "MarkClosed 후 IsOpen은 false");

        System.Console.WriteLine("=== All tests passed ===");
    }
}
```

**Python Simple Assert 버전 (pytest 없이):**

```python
# tests/run_simple_tests.py
from services.session_store import ItemDetailSessionStore

def assert_eq(actual, expected, message):
    if actual != expected:
        raise AssertionError(f"FAIL: {message} (expected {expected}, got {actual})")
    print(f"PASS: {message}")

store = ItemDetailSessionStore()
assert_eq(store.is_open("user1"), False, "새 store는 비어있어야 함")

store.mark_open("user1")
assert_eq(store.is_open("user1"), True, "mark_open 후 is_open은 True")

store.mark_open("user1")  # 중복 호출
assert_eq(store.is_open("user1"), True, "중복 mark_open도 True 유지")

store.mark_closed("user1")
assert_eq(store.is_open("user1"), False, "mark_closed 후 is_open은 False")

print("=== All tests passed ===")
```

#### Step 3: assert는 사람이 직접 쓴다

> 이 단계의 목표는 "테스트 프레임워크"가 아니라 **"검증 루프가 돌아간다"**는 경험이다.

- 테스트 케이스 목록은 사람이 정한다
- 기대값은 사람이 직접 쓴다
- AI한테는 "이 테스트가 통과하게 구현해"만 시킨다

### C.3 NUnit/pytest로 이전 (권장)

assert 기반 테스트가 5개 이상 쌓이면, 프레임워크 형태로 옮긴다.

**C# Before (assert 기반) → After (NUnit):**

```csharp
// Before
System.Diagnostics.Debug.Assert(!store.IsOpen("user1"), "새 store는 비어있어야 함");

// After (NUnit)
[Test]
public void StartsWithEmptyState()
{
    var store = new ItemDetailSessionStore();
    Assert.IsFalse(store.IsOpen("user1"));
}
```

**Python Before (assert 기반) → After (pytest):**

```python
# Before
assert_eq(store.is_open("user1"), False, "새 store는 비어있어야 함")

# After (pytest)
def test_starts_with_empty_state(store):
    assert not store.is_open("user1")
```

**이전 원칙:**

- 테스트(계약)는 고정
- 구현만 수정해서 통과시키는 루프를 만든다
- 테스트를 바꿔서 통과시키는 건 금지

### C.4 C# NUnit 온보딩

NUnit을 처음 도입할 때 최소한의 설정:

```xml
<!-- Tests/Tests.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="NUnit" Version="3.*" />
    <PackageReference Include="NUnit3TestAdapter" Version="4.*" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.*" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="../Core/Core.csproj" />
  </ItemGroup>
</Project>
```

```csharp
// Tests/ItemDetailSessionStoreTests.cs
using NUnit.Framework;

[TestFixture]
public class ItemDetailSessionStoreTests
{
    private ItemDetailSessionStore _store;

    [SetUp]
    public void SetUp() => _store = new ItemDetailSessionStore();

    [Test]
    public void StartsWithEmptyState()
    {
        Assert.IsFalse(_store.IsOpen("user1"));
    }

    [Test]
    public void MarkOpenSetsIsOpenTrue()
    {
        _store.MarkOpen("user1");
        Assert.IsTrue(_store.IsOpen("user1"));
    }

    [Test]
    public void MarkClosedSetsIsOpenFalse()
    {
        _store.MarkOpen("user1");
        _store.MarkClosed("user1");
        Assert.IsFalse(_store.IsOpen("user1"));
    }
}
```

실행:

```bash
dotnet test
```

### C.5 Python pytest 온보딩

pytest를 처음 도입할 때 최소한의 설정:

```ini
# pytest.ini 또는 pyproject.toml의 [tool.pytest.ini_options]
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*
```

```python
# tests/test_session_store.py
import pytest
from services.session_store import ItemDetailSessionStore

@pytest.fixture
def store():
    return ItemDetailSessionStore()

def test_starts_with_empty_state(store):
    assert not store.is_open("user1")

def test_mark_open_sets_is_open_true(store):
    store.mark_open("user1")
    assert store.is_open("user1")

def test_mark_closed_sets_is_open_false(store):
    store.mark_open("user1")
    store.mark_closed("user1")
    assert not store.is_open("user1")
```

실행:

```bash
pytest tests/ -v
```

### C.6 온보딩 체크리스트

- [ ] 순수 로직 모듈 1개 만들기 (UI/프레임워크 의존 없음)
- [ ] assert 기반 테스트 3개 이상 작성
- [ ] Run/실행으로 테스트 통과 확인
- [ ] AI한테 "이 테스트 통과하게 구현해" 1회 시도
- [ ] NUnit/pytest 프레임워크로 이전 (선택)
