---
type: reference
tags:
  - guide
---

# AI와 TDD 없는 상태에서 시작하는 Low Tech Dept 개발 가이드 (v5)

## 1. 이 문서의 목표

이 문서는 **TDD 경험이 전혀 없는 1인 개발자**가, Claude Code 같은 AI 코딩 도구를 쓰면서도

- 이해하지 못한 코드가 쌓이지 않고
- 장기적으로 유지보수성이 높으며
- 기술부채가 최소화된 코드베이스

를 만들 수 있도록, **실질적인 작업 순서와 예시**를 제공하는 가이드다.

> **플랫폼/언어에 독립적인 방법론**: 이 문서의 예시는 Roblox(Luau)를 기준으로 하지만, 핵심 원칙은 **Unity(C#), Elixir, Python, TypeScript** 등 어떤 환경에서도 동일하게 적용된다. 부록 A에서 각 플랫폼별 도구 매핑을 참고.

핵심 아이디어는:

1. 사람(너)은 **"계약(Contract)"을 100% 이해/승인**한다.
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

### 사람이 100% 이해해야 하는 것(반드시 네 소유)

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

|용어|역할|형태|
|---|---|---|
|**Spec**|기능이 "무엇을 하는지" 정의|.md 문서 또는 테스트 코드|
|**Invariant**|"절대 깨지면 안 되는 규칙"|.md 문서|
|**Interface**|입출력 형태와 의존성 경계|코드 (.cs, .lua, .ts 등)|
|**Test**|행동 명세 + 자동 검증|코드|
|**Class/구현**|실제 동작|코드 (AI가 생성 가능)|

### 대응 관계

```
Spec ←→ Invariant     다:다 (하나의 spec이 여러 invariant 참조 가능, 역도 성립)
Spec ←→ Interface     1:다 (하나의 spec에 여러 interface)
Spec ←→ Test          1:다 (하나의 spec에 여러 test)
Interface ←→ Class    1:다 (하나의 interface에 여러 구현체 가능)
```

### 항상 전부 필요한 것은 아니다

**Interface가 필요한 경우:**

- 테스트에서 mock 필요
- 구현체가 여러 개
- 의존성 주입

**Interface 없어도 되는 경우:**

- 순수 데이터 (struct, record)
- 상태 없는 유틸 함수
- 구현체 하나, 바뀔 일 없음

### 계약의 형태

명시적 문서가 없어도 계약은 존재한다:

|형태|언제 쓰나|
|---|---|
|명시적 문서 (spec.md)|복잡한 기능, 여러 클래스 협력|
|테스트 코드|행동 명세 (가장 작은 형태의 spec)|
|타입/시그니처|입출력 형태|
|네이밍|의도|
|예외/검증 코드|제약조건|

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
│   ├── minigame-ui.md              ← 기능 단위
│   ├── inventory-system.md
│   ├── crafting-system.md
│   └── quest-state.md
│
└── invariants/
    ├── session-rules.md            ← 도메인 규칙 단위
    ├── server-client-boundary.md
    └── economy-rules.md
```

코드 구조를 그대로 모방하면 (예: `specs/client/controllers/InteractionController.md`) 코드 리팩토링할 때마다 문서 경로도 바꿔야 하고, 폴더 깊이만 깊어져서 찾기 어려워진다.

#### 코드 구조: 소규모 (인터페이스 10개 이하)

**Unity (C#):**

```
Assets/
├── Scripts/
│   ├── Interfaces/
│   │   ├── IInventory.cs
│   │   ├── ICraftingSystem.cs
│   │   └── IDamageCalculator.cs
│   ├── Models/
│   ├── Systems/
│   └── MonoBehaviours/
└── Tests/
    └── EditMode/
```

**Roblox (Luau):**

```
src/
├── Shared/
│   ├── Interfaces/
│   │   ├── InventoryTypes.luau
│   │   └── CraftingTypes.luau
│   ├── Systems/
│   └── Utils/
├── Server/
├── Client/
└── Tests/
```

#### 코드 구조: 중규모 (인터페이스 10~30개)

기능 도메인별로 폴더 분리:

**Unity (C#):**

```
Assets/
├── Scripts/
│   ├── Inventory/
│   │   ├── Interfaces/
│   │   │   └── IInventory.cs
│   │   ├── Models/
│   │   │   └── InventorySlot.cs
│   │   ├── Systems/
│   │   │   └── InventorySystem.cs
│   │   └── Tests/
│   │       └── InventoryTests.cs
│   │
│   ├── Crafting/
│   │   ├── Interfaces/
│   │   ├── Models/
│   │   └── Systems/
│   │
│   └── Combat/
│       └── ...
```

**Roblox (Luau):**

```
src/
├── Shared/
│   ├── Inventory/
│   │   ├── Types.luau
│   │   ├── InventoryStore.luau
│   │   └── InventoryStore.spec.luau
│   │
│   ├── Crafting/
│   │   ├── Types.luau
│   │   ├── CraftingRules.luau
│   │   └── CraftingRules.spec.luau
│   │
│   └── Combat/
│       └── ...
├── Server/
└── Client/
```

#### 코드 구조: 대규모 (인터페이스 30개 이상)

별도 어셈블리/패키지로 분리:

**Unity (C#):**

```
Assets/
├── Core/                           ← 순수 로직 (Assembly Definition)
│   ├── Core.asmdef
│   ├── Inventory/
│   ├── Crafting/
│   └── Combat/
│
├── Runtime/                        ← 엔진 의존 구현체
│   ├── Runtime.asmdef              ← Core 참조
│   ├── Inventory/
│   └── ...
│
└── Tests/
    ├── Tests.asmdef
    └── ...
```

**Roblox (Luau):**

```
Packages/                           ← wally 패키지로 분리
├── core-systems/
│   ├── src/
│   │   ├── Inventory/
│   │   ├── Crafting/
│   │   └── Combat/
│   └── wally.toml
│
game/
├── src/
│   ├── Server/                     ← 패키지 사용
│   └── Client/
└── wally.toml
```

#### 분리 시점 판단 기준

|신호|조치|
|---|---|
|한 폴더에 파일 15개 이상|도메인별 하위 폴더 분리|
|순환 참조 발생|별도 어셈블리/패키지로 분리|
|빌드 시간 급증|Core/Runtime 분리|
|팀원 간 충돌 잦음|도메인별 소유권 분리|

#### Spec ↔ Interface ↔ Invariant 매핑 예시

```
inventory-system.md (spec)
├── 참조하는 invariants:
│   ├── economy-rules.md
│   └── session-rules.md
├── 관련 interfaces:
│   ├── IInventory.cs (Unity) 또는 InventoryTypes.luau (Roblox)
│   └── InventorySlot (struct/type)
└── 관련 tests:
    └── InventoryTests.cs 또는 InventoryStore.spec.luau
```

### 2.6 문서 간 링크 규칙 (권장)

각 기능(Feature)마다 아래 4개 아티팩트가 **서로 하이퍼링크로 연결**되도록 한다.

```
Spec ←→ Invariants ←→ Interface ←→ Tests
  ↑__________________________________↓
```

#### 상단 링크 블록 템플릿

모든 문서/코드 파일에 동일한 포맷 사용:

```md
<!-- Links -->
- Specs: (this file) 또는 [minigame-ui.md](...)
- Invariants: [session-rules.md](...), [server-client-boundary.md](...)
- Interfaces: [MiniGameUI.luau](...)
- Tests: [MiniGameSessionStore.spec.luau](...)
```

**Spec 파일 상단 (docs/specs/minigame-ui.md):**

```md
<!-- Links -->
- Specs: (this file)
- Invariants: [session-rules.md](../invariants/session-rules.md)
- Interfaces: [MiniGameUITypes.luau](../../src/Shared/Interfaces/MiniGameUITypes.luau)
- Tests: [MiniGameSessionStore.spec.luau](../../src/Shared/MiniGameSessionStore.spec.luau)
```

**Invariants 파일 상단 (docs/invariants/session-rules.md):**

```md
<!-- Links -->
- Specs: [minigame-ui.md](../specs/minigame-ui.md), [inventory-system.md](../specs/inventory-system.md)
- Invariants: (this file)
- Interfaces: [MiniGameUITypes.luau](../../src/Shared/Interfaces/MiniGameUITypes.luau)
- Tests: [MiniGameSessionStore.spec.luau](../../src/Shared/MiniGameSessionStore.spec.luau)
```

**Interface/Test 코드 상단 주석:**
```lua
--!strict
-- Links:
-- Specs: docs/specs/minigame-ui.md
-- Invariants: docs/invariants/session-rules.md
-- Interfaces: (this file)
-- Tests: src/Shared/MiniGameSessionStore.spec.luau
```

 >코드 주석에 링크를 넣는 것은 내가 구현한 VSCode extension으로 가능하다. 아래와 같이 경로를 변수로 저장하고
 ![[Pasted image 20260226173050.png]]
> 코드에서 해당 변수를 '%' 사이에 넣어서 상대 경로 호출을 간소화할 수 있다.
> ![[Pasted image 20260226173152.png]]
> 밑줄이 생긴 텍스트에 마우스를 올리면 아래와 같이 변수, 경로, 연결된 파일의 존재 유무 등을 알 수 있고, `alt+click`으로 직접 열 수도 있다.
> ![[Pasted image 20260226173305.png]]
> 또한 `INV:` 라는 글자가 하이라이트 되도록 하는 것은 `TODO Highlight`라는 extension을 사용하면 된다.

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

- 어떤 플레이어에 대해 미니게임 UI는 동시에 **1개만** 떠 있어야 한다.
- 서버는 절대 클라이언트의 GUI를 직접 조작하지 않는다(서버/클라 경계).
- 계좌 잔고는 어떤 연산이 있었더라도 항상 0 이상이어야 한다.

### 3.2 테스트와의 차이

- 테스트: "이 입력 → 이런 출력" 같은 **샘플 케이스**
- 불변식: 모든 실행 경로, 모든 시점에서 항상 지켜져야 하는 **전역 규칙**

이상적으로는 **불변식을 테스트/검증 코드로 표현**해야 하지만, 당장 전부 자동화하지 못하더라도 **문장으로 먼저 고정**해두는 것만으로도 큰 가치가 있다.

### 3.3 불변식을 왜 먼저 적어두는가

- 불변식은 코드 리팩토링/확장 시 "어디까지 건드려도 안전한지"를 알려주는 안전선이다.
- AI에게도 "이건 어떤 구현이건 절대 깨지면 안 되는 규칙"이라 못 박을 수 있다.
- 테스트로 다 표현하기 어려운 아키텍처 경계(서버/클라, 모듈 간 책임 분리)에 특히 유용하다.

### 3.4 불변식 분류와 작성 규칙

불변식은 유지보수 과정에서 계속 늘어나므로, 처음부터 **종류별로 분류**해서 관리한다.

#### 분류

|종류|설명|예시|
|---|---|---|
|**Safety (안전)**|깨지면 치명적 (중복 보상/데이터 유실/권한 우회/치트 가능성)|"보상은 서버에서만 지급한다"|
|**Consistency (일관성)**|상태/데이터 관계|"잔고 ≥ 0", "세션당 UI 1개", "중복 생성 금지"|
|**Boundary (경계)**|레이어 책임 분리|"서버는 UI를 직접 조작하지 않는다"|
|**Performance (성능)**|리소스/프레임 예산|"프레임당 생성 제한", "이벤트 연결 누수 금지"|

#### MiniGame 예시에 분류 적용

```md
- I1. [Consistency] 한 플레이어에 대해 미니게임 UI는 동시에 1개만 열린다.
- I2. [Boundary] 실제 화면에 GUI를 추가/제거하는 작업은 클라이언트에서만 한다.
- I3. [Consistency] 서버가 클라이언트에게 미니게임을 열라고 요청할 때, 항상 objectId를 포함한 context를 보낸다.
```

#### 작성 규칙 (권장)

1. **"항상(Always)", "절대(Never)"가 들어가는 문장으로 쓴다.**
    
    - ❌ "UI는 하나만 띄우는 게 좋다"
    - ✅ "UI는 항상 1개만 열린다"
2. **어디에서 강제할지 명시한다.**
    
    - 예: "(서버에서 강제)", "(클라이언트 모듈에서 체크)", "(공유 Store에서 관리)"
3. **가능하면 테스트/verify로 옮긴다.**
    
    - 처음엔 문장으로 고정해도 되지만, 시간이 지나면 자동 검증으로 이전

### 3.5 디자인패턴/프레임워크와 불변식

프로젝트에서 특정 디자인패턴이나 프레임워크를 따른다면, **그 패턴이 강제하는 구조와 제약을 불변식으로 정의**한다.

#### 왜 불변식으로 정의하나?

- 패턴의 핵심 규칙을 명시적으로 문서화
- AI가 패턴을 위반하는 구현을 하지 않도록 방지
- 새 모듈 추가 시 어떤 구조를 따라야 하는지 명확

#### 예시: MVC 패턴

```md
# docs/invariants/architecture-mvc.md

## Boundary (MVC 패턴)
- [Boundary] View는 절대 Model을 직접 수정하지 않는다.
- [Boundary] Model은 View를 알지 못한다 (의존성 방향: View → Controller → Model).
- [Boundary] Controller만 Model과 View 양쪽을 참조한다.
- [Consistency] 하나의 View는 하나의 Controller에만 연결된다.
```

#### 예시: ECS (Entity-Component-System)

```md
# docs/invariants/architecture-ecs.md

## Boundary (ECS 패턴)
- [Boundary] Component는 데이터만 가진다. 로직을 포함하지 않는다.
- [Boundary] System만 Component를 읽고 수정한다.
- [Boundary] Entity는 Component의 컨테이너일 뿐, 자체 로직이 없다.
- [Performance] System은 매 프레임 실행되므로, O(n) 이하 복잡도를 유지한다.
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
# docs/specs/inventory-system.md

<!-- 관련 문서 -->
- Invariants: 
  - [architecture-flux.md](../invariants/architecture-flux.md)  ← 아키텍처
  - [economy-rules.md](../invariants/economy-rules.md)          ← 도메인
```

이렇게 하면 AI가 구현할 때 아키텍처 규칙과 도메인 규칙을 모두 참조하게 된다.

---

## 4. 전체 방법론: Contract-first + Verification Loop

이제 실제로 기능을 만들 때, 어떤 순서로 진행하는지 단계별로 정리한다.

### Step 0. 기능/티켓을 하나 고른다

예시(로블록스 미니게임 케이스):

> 상호작용 가능한 오브젝트를 이미 배치했다. 플레이어가 상호작용 키를 누르면 미니게임 화면(UI)이 뜨게 만들고 싶다.

이 기능 하나를 단위로, 아래 과정을 수행한다.

---

### Step 1. 기능이 크면 수직 슬라이스로 쪼갠다

Step 0에서 고른 기능이 크다면, **규모 판단(Step 2) 전에 먼저 쪼개야 한다.** "미니게임"이나 "결제 시스템"처럼 하나의 큰 기능을 통째로 SPEC에 담으면 디테일이 너무 길어지고, 한 번에 너무 많은 코드를 작성하게 된다.

#### 수평 분할 vs 수직 분할

기능을 쪼개는 방법에는 두 가지가 있다.

**수평 분할 (레이어별 분할) — ❌ 피할 것**

기술 레이어(UI, 로직, 네트워크, DB 등)를 기준으로 나눈다. 한 레이어를 전부 만든 뒤 다음 레이어로 넘어가는 방식이다.

```
[수평 분할: 게임 — 미니게임]

슬라이스 A: UI 전부 만들기
    → 프레임, 버튼, 레이아웃, 애니메이션 등
    → 끝나도 실제 동작 없음 ❌

슬라이스 B: 게임 로직 전부 만들기
    → 상태 머신, 타이머, 점수 계산 등
    → UI가 없어서 확인 불가 ❌

슬라이스 C: 서버 통신 + 보상 전부 만들기
    → A, B와 합칠 때 대량 버그 ❌
```

```
[수평 분할: 웹 — 결제 시스템]

슬라이스 A: 결제 UI 전부 만들기
    → 폼, 카드 입력, 주소 입력, 확인 화면 등
    → 끝나도 실제 결제 안 됨 ❌

슬라이스 B: 결제 API 전부 만들기
    → 카드 검증, PG 연동, 트랜잭션 처리 등
    → 호출할 UI가 없어서 테스트 번거로움 ❌

슬라이스 C: 주문/재고 DB 전부 만들기
    → A, B와 합칠 때 대량 버그 ❌
```

이 방식은 슬라이스 A가 끝나도 **실행해서 확인할 수 있는 것이 아무것도 없다.** UI는 있는데 로직이 없고, 로직을 붙이면 통합 버그가 한꺼번에 터진다. 각 슬라이스가 독립적으로 의미 있는 결과를 내지 못한다.

**수직 분할 (기능 단위 분할) — ✅ 권장**

User Flow를 따라, **각 슬라이스가 끝나면 실제로 동작하는 무언가가 있는** 단위로 나눈다. 한 슬라이스 안에 필요한 모든 레이어(UI + 로직 + 네트워크 + DB)를 얇게 포함시킨다.

```
[수직 분할: 게임 — 미니게임]

슬라이스 1: "E 누르면 빈 UI가 뜨고 닫을 수 있다"
    → Server: ProximityPrompt → RemoteEvent 발신
    → Client: RemoteEvent 수신 → 빈 Frame 표시 → 닫기 버튼/ESC
    → 끝나면 확인 가능: E 누르면 뭔가 뜨고 닫힌다 ✅

슬라이스 2: "미니게임 로직이 UI 안에서 돌아간다"
    → Client: 게임 상태 머신 + 타이머 + UI 연동
    → 끝나면 확인 가능: E 누르면 미니게임을 플레이할 수 있다 ✅

슬라이스 3: "미니게임 완료 시 보상을 받는다"
    → Client→Server: 완료 신호 전송
    → Server: 완료 검증 + 보상 지급
    → 끝나면 확인 가능: 미니게임 끝나면 아이템을 받는다 ✅
```

```
[수직 분할: 웹 — 결제 시스템]

슬라이스 1: "상품을 선택하면 결제 금액이 표시된다"
    → Frontend: 상품 선택 UI + 금액 계산
    → Backend: 상품 가격 API
    → 끝나면 확인 가능: 상품 고르면 총액이 보인다 ✅

슬라이스 2: "카드 정보를 입력하면 결제가 처리된다"
    → Frontend: 카드 입력 폼
    → Backend: PG 연동 + 결제 요청
    → DB: 주문 레코드 생성
    → 끝나면 확인 가능: 테스트 카드로 결제하면 주문이 생긴다 ✅

슬라이스 3: "결제 실패 시 에러 메시지와 재시도가 가능하다"
    → Frontend: 에러 표시 + 재시도 버튼
    → Backend: 실패 처리 + 롤백
    → 끝나면 확인 가능: 잘못된 카드 → 에러 → 다시 시도 가능 ✅
```

이 방식은 슬라이스 1만 끝나도 실행해서 "의도대로 동작하는가?"를 바로 확인할 수 있다. 각 슬라이스가 이전 슬라이스 위에 쌓이면서, 점진적으로 완성된 기능이 된다.

#### 수직 분할의 핵심: "동작을 확인할 수 있는 지점"에서 끊기

```
전체 User Flow를 한 줄씩 쓴다:
    [게임] E 누름 → UI 열림 → 게임 시작 → 게임 진행 → 완료 → 보상 → UI 닫힘
    [웹]   상품 선택 → 금액 표시 → 카드 입력 → 결제 처리 → 성공/실패 → 영수증

"실행해서 확인 가능한 지점"마다 선을 긋는다:
    [게임] E 누름 → UI 열림 → UI 닫힘          ← 슬라이스 1
           게임 시작 → 게임 진행 → 완료         ← 슬라이스 2
           완료 → 보상                          ← 슬라이스 3

    [웹]   상품 선택 → 금액 표시                ← 슬라이스 1
           카드 입력 → 결제 처리 → 주문 생성    ← 슬라이스 2
           실패 처리 → 에러 → 재시도            ← 슬라이스 3
```

#### 슬라이스 크기 판단 기준

한 슬라이스가 적절한 크기인지 확인하는 질문 3가지:

1. **"이 슬라이스만 끝나면 실행해서 뭔가 확인할 수 있는가?"** — Yes면 적절한 크기. No면 너무 작거나 수평 분할이 된 것이다. (게임이면 플레이테스트, 웹이면 브라우저에서 확인, 백엔드면 API 호출로 확인, CLI면 커맨드 실행으로 확인)
2. **"Acceptance Criteria가 3~7개로 쓸 수 있는가?"** — 7개를 넘기면 더 쪼개야 하고, 3개 미만이면 다른 슬라이스와 합치는 걸 고려한다.
3. **"하루(4~8시간) 안에 구현 + 검증이 끝나는가?"** — 넘기면 중간에 미완성 상태가 길어져서 디버깅이 어려워진다.

> **너무 작게 쪼개는 것도 문제다.** "RemoteEvent 만들기", "DB 테이블 생성하기", "빈 컴포넌트 파일 만들기"처럼 나누면 독립적으로 확인할 수 있는 것이 없다. 이런 것은 슬라이스가 아니라 슬라이스 안의 구현 단계일 뿐이다.

#### 쪼갠 뒤에는 각 슬라이스에 Step 2(규모 판단) 이후를 각각 적용한다

```
미니게임 (큰 기능)
    ├─ 슬라이스 1: UI 열기/닫기 → Step 2에서 규모 판단 → Large → Step 3~11 적용
    ├─ 슬라이스 2: 게임 로직    → Step 2에서 규모 판단 → Medium → Step 3~4, 6, 11 적용
    └─ 슬라이스 3: 보상 지급    → Step 2에서 규모 판단 → Large → Step 3~11 적용
```

기능이 작아서 슬라이스 1개면 충분하다면(예: 유틸 함수 추가), 이 단계를 건너뛰고 바로 Step 2(규모 판단)로 간다.

#### 💡 팁: 슬라이싱은 AI에게 맡겨도 된다

이 가이드는 SPEC / 불변식 / 인터페이스 / 테스트는 **사람이 직접 쓰는 것**을 권장한다. 이것들은 "계약"이기 때문에 사람의 소유여야 한다. 그러나 **"큰 기능을 수직 슬라이스로 쪼개는 작업"은 AI에게 맡겨도 된다.** 슬라이싱은 계약이 아니라 작업 분해(task decomposition)이고, 잘못 쪼개져도 사람이 경계만 확인/조정하면 되며, Step 2 이후에서 다시 판단할 수 있기 때문이다. 실무에서 이 가이드를 적용해본 결과, 큰 기능을 앞에 두고 직접 슬라이스 경계를 긋는 것보다 AI에게 초안을 요청하고 사람이 검토/조정하는 흐름이 훨씬 효율적이었다.

사람은 AI가 내놓은 슬라이스에 대해 다음 두 가지만 검증하면 된다:

1. **각 슬라이스가 "실행해서 확인 가능한" 단위인가?** (수직 분할 원칙)
2. **각 슬라이스 크기가 적절한가?** (위 3가지 판단 기준: 확인 가능성 / AC 3~7개 / 4~8시간)

##### 슬라이싱 요청 프롬프트 (간단 버전)

아래는 세션 내에서 바로 쓰는 짧은 버전이다. 가이드 문서 없이 AI에게 맡길 수 있는 **자립형(self-contained) 전체 프롬프트는 §8.4 "슬라이싱 요청 (자립형)" 참고.**

```
다음 기능을 수직 슬라이스로 쪼개줘.

기능: <기능 설명, User Flow 포함>

제약:
- 수평 분할(UI만, 로직만, DB만 식의 레이어 분할) 금지.
  반드시 수직 분할(한 슬라이스 안에 UI+로직+네트워크+DB 모두 얇게 포함).
- 각 슬라이스는 끝났을 때 실행해서 "의도대로 동작하는가?"를 바로 확인 가능해야 함.
- 각 슬라이스의 Acceptance Criteria가 3~7개 수준으로 쓸 수 있는 크기.
- 한 슬라이스는 4~8시간 안에 구현+검증이 끝나는 크기.

출력 형식:
- 슬라이스 개수
- 각 슬라이스: (1) 한 줄 요약, (2) 포함 레이어, (3) 끝났을 때 확인 방법
- 구현 세부사항은 쓰지 말 것. (SPEC/인터페이스는 내가 직접 쓴다)

초안이 나오면 내가 경계를 확인하고 필요하면 조정한다.
```

> 주의: AI가 내놓은 슬라이스를 그대로 수용하지 말 것. 특히 AI는 종종 수평 분할로 흘러가거나("1단계: 데이터 모델 설계", "2단계: API 만들기"), 너무 잘게 쪼개는 경향이 있다. 위 2가지 검증 질문으로 반드시 통과시킨 뒤에 Step 2로 넘어간다.

---

### Step 2. 규모를 판단하고, 적용할 단계를 결정한다

기능을 고른 뒤, 코드를 작성하기 전에 **"이 기능에 어느 수준의 문서가 필요한가?"** 를 먼저 판단한다. 모든 기능에 Step 3~11 전체를 적용하면 작은 기능에서 문서 오버헤드가 발생하고, 반대로 큰 기능에 문서를 생략하면 장기적 유지보수가 어려워진다.

자세하게는 [[부록1-규모별-개발-접근-방법_V2]]을 참고

#### 공통 출발 질문

> **"이 기능은 어떻게 깨질 수 있지?"**

이 질문의 답이 규모를 결정한다:

- "경계값 하나 틀리면 끝" → Micro
- "상태가 꼬이면 복구 불가" → Small+
- "다른 모듈까지 연쇄 영향" → Medium+
- "보안 사고 / 데이터 손실" → Large

#### 판단 플로우차트

```
Q0: 기존 공용 인터페이스/스키마/공유 타입을 수정하는가?
    ├─ 예 → 최소 Medium (+ Q2 신뢰 경계 체크)
    └─ 아니오 → Q1로

Q1: 상태(state)를 관리하는가?
    ├─ 아니오 (순수 함수/계산만) → Micro
    └─ 예 → Q2로

Q2: 신뢰 경계를 넘나드는가?
    (서버/클라, Public API, User Input, 서비스 간 통신 등)
    ├─ 예 → Large
    └─ 아니오 → Q3로

Q3: 3개 이상의 독립적 관심사(concern)가 협력하는가?
    ├─ 예 → Medium
    └─ 아니오 → Small
```

#### 규모별 적용 단계

|규모|필수 산출물|이 가이드에서 적용할 Step|위험도|
|---|---|---|---|
|**Micro**|타입 + 테스트 1~2개|Step 4 + Step 11만|Low|
|**Small**|타입 + CONTRACT 주석 + 테스트 3~5개|Step 4 + Step 11만|Medium|
|**Medium**|spec.md(간소화) + 타입 + CONTRACT + 테스트 5~10개|Step 3 + Step 4 + Step 11|High|
|**Large**|spec.md + invariant.md + 타입 + 통신 계약 + 테스트 10개+|Step 3~11 전체|Critical|

> **CONTRACT 주석**: Small/Medium에서 별도 invariant.md를 작성하지 않을 때, 불변식을 **파일 최상단 Links 블록 바로 아래**에 `CONTRACT` 키워드로 명시한다. AI가 파일을 읽을 때 가장 먼저 인지하게 하기 위함이다.

```lua
--!strict
-- Links: Tests: Module.spec.luau

-- CONTRACT (Do not modify/delete):
-- [Consistency] 아이템 개수는 항상 0 이상
-- [Safety] 제작 실패 시 인벤토리는 변경되지 않음
```

> 규모별 판단 기준, 각 Level의 상세 템플릿/예시, 승격·강등 신호는 별도 문서 **「규모별 개발 접근 방법 가이드」**[[부록1-규모별-개발-접근-방법_V2]]를 참고한다.

Micro/Small로 판단되었다면, 아래 Step 3(SPEC 작성)과 Step 5(불변식 문장 고정)을 건너뛰고 **Step 4(인터페이스) → Step 11(테스트)**으로 바로 진행해도 된다. Medium 이상이면 Step 3부터 순서대로 따른다.

---

### Step 3. 행동 기반 Spec 작성 (사람 100% 이해) — Medium 이상 적용

먼저 코드를 쓰지 말고, **사용자 입장에서 보이는 행동**을 스펙으로 적는다.

#### SPEC 템플릿 (권장)

```md
# <Feature Name> – SPEC

## Goal
- (이 기능이 사용자에게 주는 가치 1~2줄)

## Non-goals (이번 티켓에서 하지 않음)
- (예: 보상 지급, 랭킹, 애니메이션, 사운드 등)

## Out of scope (절대 건드리지 말 것)
- (예: 기존 인벤토리 로직 수정 금지, 네트워크 구조 변경 금지 등)

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

### 수동 검증 (플레이테스트)
- (예: UI 위치 확인, 체감 성능 확인)

## Risks / Notes
- (예: 서버/클라 경계, 중복 방지, 동시성 등)
```

> **중요:**
> 
> - Acceptance Criteria는 반드시 **'예/아니오'로 판정 가능**해야 한다.
> - **Non-goals/Out of scope가 비어 있으면 AI가 과구현할 확률이 높다.** 반드시 채울 것.

#### 예시: MiniGame UI SPEC

```md
# MiniGame UI – SPEC

## Goal
- 플레이어가 특정 오브젝트와 상호작용(ProximityPrompt)을 하면 미니게임 UI가 열린다.

## Non-goals (이번 티켓에서 하지 않음)
- 미니게임 내부 로직 (별도 티켓)
- 보상 지급
- 사운드/애니메이션 효과
- 랭킹/리더보드

## Out of scope (절대 건드리지 말 것)
- 기존 ProximityPrompt 시스템 구조
- 플레이어 데이터 저장 로직
- 네트워크 아키텍처

## User Flow
1. 플레이어가 오브젝트 근처로 이동한다.
2. 상호작용 키(E)를 누른다.
3. 화면 중앙에 미니게임 UI가 뜬다.
4. 미니게임이 끝나면 닫기 버튼 또는 ESC로 닫을 수 있다.

## Edge Cases
- 이미 UI가 열려 있는 상태에서 다시 상호작용하면 UI가 **추가로 생성되지 않는다**.
- UI를 닫은 뒤 다시 상호작용하면 정상적으로 다시 열린다.

## Acceptance Criteria
- AC1. ProximityPrompt 트리거 시 UI가 화면 중앙에 표시된다.
- AC2. 3번 연속 트리거해도 UI는 1개만 유지된다.
- AC3. 닫기 버튼 클릭 시 UI가 사라진다.
- AC4. ESC 키로도 UI를 닫을 수 있다.
- AC5. 서버 로그에 "MiniGameOpen: player=..., objectId=..." 형태가 찍힌다.

## Done 정의
### 자동 검증
- verify 스크립트 통과
- MiniGameSessionStore.spec 테스트 통과

### 수동 검증 (플레이테스트)
- UI 위치/레이아웃 정상 확인
- 반응 속도 체감 확인

## Risks / Notes
- 서버/클라 경계 주의 (I2 불변식)
- 중복 생성 방지 로직 필수 (I1 불변식)
```

이 문서는

- 나중에 스펙 이상 동작이 발생했을 때 비교 기준
- AI에게 "무엇이 성공인지"를 알려주는 기준

이 된다.

---

### Step 4. 공개 인터페이스(API) 고정 (사람 100% 이해)

**되도록이면 작성도 사람이 할 것 → Syntax, 라이브러리 감각, 디버깅 근육 퇴화 방지**

구현(내부 로직)보다 먼저, **모듈들 사이의 경계**를 타입/함수 시그니처로 정한다.

#### 인터페이스란?

"이 모듈을 사용하려면 이 함수들만 알면 된다"는 **공개 API 정의**다. 내부 구현이 어떻게 바뀌든, 이 시그니처만 유지되면 다른 코드에 영향이 없다.

#### 2.1 언어별 인터페이스 정의 방법

**C# (interface 키워드 사용):**

```csharp
// Interfaces/IMiniGameUI.cs
public interface IMiniGameUI
{
    void Open(MiniGameContext context);
    void Close();
    bool IsOpen { get; }
}

public record MiniGameContext(string ObjectId);
```

**TypeScript (interface 키워드 사용):**

```typescript
// interfaces/MiniGameUI.ts
export interface MiniGameContext {
    objectId: string;
}

export interface IMiniGameUI {
    open(context: MiniGameContext): void;
    close(): void;
    isOpen(): boolean;
}
```

**Luau/Roblox (interface 키워드 없음 → export type으로 우회):**

```lua
--!strict
-- Shared/Interfaces/MiniGameUITypes.luau

export type Context = {
    objectId: string,
}

export type IMiniGameUI = {
    Open: (context: Context) -> (),
    Close: () -> (),
    IsOpen: () -> boolean,
}

-- 타입만 정의, 구현은 별도 파일에서
return nil
```

> **Luau 참고**: `interface` 키워드가 없어서 `export type`으로 함수 시그니처를 정의한다. 실제 구현체는 이 타입을 만족하도록 작성.

#### 2.2 통신 계약 (서버↔클라이언트, API 등)

타입 시스템으로 강제할 수 없는 경계는 **문서로 명시**한다.

**Roblox RemoteEvent 예시:**

```md
## 통신 계약: OpenMiniGame

- Event: `ReplicatedStorage/Remotes/OpenMiniGame`
- 방향: Server → Client
- Payload: `{ objectId: string }`
- 서버: `OpenMiniGame:FireClient(player, { objectId = "..." })`
- 클라: `OpenMiniGame.OnClientEvent:Connect(function(context) ... end)`
```

**REST API 예시:**

```md
## 통신 계약: POST /api/minigame/open

- Request Body: `{ objectId: string }`
- Response: `{ success: boolean, sessionId?: string }`
- 에러: 400 (잘못된 objectId), 409 (이미 열린 세션 존재)
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

### Step 5. 불변식(Invariants) 문장으로 잠그기 (사람 100% 이해) — Large 필수, Medium은 CONTRACT 주석으로 대체 가능

이 기능에서 절대 깨지면 안 되는 규칙을 목록으로 적는다.

예시:

- I1. 한 플레이어에 대해 미니게임 UI는 **동시에 1개만** 열린다. (중복 생성 금지)
- I2. 실제 화면에 GUI를 추가/제거하는 작업은 **클라이언트에서만** 한다. 서버는 RemoteEvent로 신호만 보낸다.
- I3. 서버가 클라이언트에게 미니게임을 열라고 요청할 때, 항상 `objectId`를 포함한 context를 보낸다.

이제 앞으로 **어떤 구현/리팩토링/AI 수정이 들어와도 I1~I3가 깨지는 변경은 버그**라고 간주한다.

---

### Step 6. 검증 방법(테스트/검증 루프) 설계

TDD 경험이 없고 테스트 인프라도 아직 없다면, 처음에는 **수동 검증 절차**부터 만든다.

#### 4.0 테스트 케이스도 직접 작성할 것 (권장)

인터페이스와 마찬가지로, **테스트 케이스 작성도 되도록 사람이 직접 하는 게 좋다.**

이유:

- 테스트를 작성하려면 "이 함수가 뭘 해야 하는지"를 정확히 이해해야 함
- AI한테 테스트까지 맡기면, 구현과 테스트가 같은 오해를 공유할 수 있음
- 테스트 작성은 디버깅 근육과 직결됨 - 뭘 검증해야 하는지 아는 게 핵심

현실적 타협:

1. **테스트 케이스 목록**은 사람이 작성 (어떤 시나리오를 검증할지)
2. **테스트 코드 boilerplate**는 AI한테 맡겨도 됨 (setup/teardown 등)
3. **assertion 부분**은 사람이 직접 작성하거나 최소한 한 줄씩 읽고 이해

```text
// AI한테 줄 프롬프트
테스트 파일 구조만 만들어줘. describe/it 블록과 setup만.
assertion은 비워두고, 내가 직접 채울게.
```

#### 4.1 수동 검증(Verification) 체크리스트

- V1. 플레이 모드에서 ProximityPrompt를 3번 연속 눌러도 UI는 1개만 떠 있어야 한다. (I1)
- V2. UI를 닫고 다시 눌렀을 때 정상적으로 다시 떠야 한다. (I1)
- V3. 서버 Output에서 `MiniGameOpen: player=..., objectId=...` 로그가 매번 찍히는지 확인한다. (I3)

> 💡 나중에 자동화하려면 Step 11을 참고

나중에 TestEZ 같은 프레임워크를 도입하면, V1~V3 중 일부를 자동화된 테스트로 옮겨갈 수 있다.

---

### Step 7. AI에게 Plan(계획) 먼저 뽑게 하기 — Large 권장

Claude Code는 "큰/복잡한 작업일수록 Explore → Plan → Implement → Commit 순서로 진행"하는 것을 권장한다.

#### 5.1 Claude Code에 줄 프롬프트 예시 (Plan Mode)

```text
아래 SPEC, 인터페이스, 불변식(I1~I3)은 고정이고 수정하면 안 돼.
이걸 기준으로 미니게임 UI 오픈 기능을 구현하기 위한 계획만 세워줘.

규칙:
- 지금은 코드를 수정하지 말고, 관련 파일을 읽고 PLAN.md에 계획만 작성해.
- 어떤 파일을 새로 만들지, 어떤 파일을 수정할지, 각 단계에서 무엇을 검증할지 적어줘.

[SPEC]
(여기에 SPEC.md 내용 붙여넣기)

[INTERFACE]
(MiniGameUI.luau 타입 정의 등)

[INVARIANTS]
- I1 ...
- I2 ...
- I3 ...
```

Claude가 만들어줄 `PLAN.md` 예시는 대략 이런 구조가 될 것이다:

```md
# PLAN – MiniGame UI

## Files to create
- ReplicatedStorage/Remotes/OpenMiniGame (RemoteEvent)
- ServerScriptService/MiniGamePrompt.server.luau
- StarterPlayerScripts/MiniGameClient.client.luau
- ReplicatedStorage/Shared/MiniGameUI.luau (이미 정의된 인터페이스 구현)

## Steps
1. RemoteEvent 생성 및 참조 코드 추가.
2. ProximityPrompt.Triggered에서 OpenMiniGame:FireClient(player, context) 호출.
3. 클라이언트에서 OnClientEvent로 MiniGameUI.Open(context) 호출.
4. MiniGameUI 내부에서 UI 생성/표시 및 IsOpen 상태 관리.
5. Close 버튼/ESC로 MiniGameUI.Close() 구현.

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

### Step 8. AI에게 구현을 맡기되, 계약/불변식은 금지 영역으로 둔다

이제 Normal 모드에서 실제 코드를 작성하게 한다.

#### 6.1 구현 프롬프트 예시

##### 턴 3

```text
이제 PLAN.md대로 구현을 진행해줘.

중요 규칙:
- SPEC, INTERFACE(MiniGameUI 타입 정의), INVARIANTS(I1~I3)는 수정하면 안 돼.
- 변경은 작은 단위로 진행해.
- 각 단계가 끝나면 내가 V1~V3를 수동으로 검증할 수 있도록,
  어떤 동작을 테스트해야 하는지 간단히 설명해줘.

우선 1~3단계까지만 구현하고 멈춰.
```

Claude가 서버/클라 스크립트를 작성해줄 것이고, 너는 그때그때 V1~V3를 수동으로 검증한다.

#### 6.2 커밋 전략

##### 커밋 단위

- 하나의 V(검증)를 통과할 때마다 커밋
- 커밋 메시지에 통과한 검증 명시: `feat: MiniGameUI Open 구현 (V1, V2 통과)`

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
V1 검증 실패: ProximityPrompt 3번 누르니 UI가 2개 떴어.

규칙:
- 새 코드를 추가하지 말고, 기존 코드에서 I1 위반 원인만 찾아줘
- MiniGameUI.Open()이 호출되는 시점에 IsOpen() 체크가 있는지 확인해줘
- 원인 분석만 하고, 수정은 내가 승인하면 해
```

##### 3단계 디버깅

1. AI한테 원인 분석만 시킴 (수정 금지)
2. 분석 결과 읽고 이해했으면 수정 승인
3. 수정 후 V1~V3 전체 재검증

---

### Step 9. Reviewer 세션(별도 에이전트/세션)으로 불변식/리스크만 검토 — Large 권장

Writer와는 다른 새로운 Claude 세션을 열어, **코드 리뷰 전용**으로 사용한다.

#### 7.1 Reviewer 프롬프트 예시

```text
다음 변경 사항은 MiniGame UI를 ProximityPrompt로 여는 기능이야.

규칙:
- 코드는 수정하지 마.
- 오직 다음 항목만 검토해:
  - I1: 플레이어당 UI가 동시에 1개만 열리도록 보장하는지.
  - I2: GUI 생성/표시가 클라이언트에서만 이루어지는지.
  - I3: 서버→클라이언트로 objectId 컨텍스트가 항상 전달되는지.
  - 불필요한 복잡도나 잠재적인 버그 패턴.

코드:
(여기에 관련 서버/클라 코드를 붙여넣기)
```

Reviewer는 보통 다음 같은 문제를 찾아낼 수 있다:

- 서버에서 직접 PlayerGui를 건드리고 있는 부분 (I2 위반)
- UI가 열려 있는지 체크 없이 매번 새 ScreenGui를 만드는 부분 (I1 위반 가능성)
- objectId를 빼먹고 FireClient하는 부분 (I3 위반)

이 지적을 다시 Writer 세션에 가져가서 "이 부분만 수정"하도록 시키면 된다.

---

### Step 10. 검증의 진화: 수동 → 자동 → 하이브리드

Step 8에서 "그때그때 V1~V3를 수동으로 검증한다"고 했는데, 이건 시간이 지나면서 진화한다.

#### Phase 1: 전부 수동

테스트 인프라가 없을 때. 모든 검증을 사람이 직접 한다.

```
V1. ProximityPrompt 3번 눌러도 UI 1개  → 내가 플레이해서 확인
V2. 닫고 다시 열기                      → 내가 확인
V3. 서버 로그에 objectId 찍히나         → 내가 Output 창 확인
```

#### Phase 2: 테스트 프레임워크 도입 후

자동화 가능한 검증은 테스트 코드로 옮긴다.

```
V1. → MiniGameSessionStore.spec.luau   ✅ 자동
V2. → MiniGameSessionStore.spec.luau   ✅ 자동
V3. → MiniGameRemote.spec.luau         ✅ 자동 (mock으로 검증 가능)
```

#### Phase 3: 자동화 불가능한 것들은 수동 유지

모든 게 자동화되진 않는다. 다음은 계속 사람이 해야 함:

```
V4. "UI가 화면 중앙에 뜨는가"           ❌ 수동 (시각적 확인)
V5. "반응 속도가 체감상 괜찮은가"        ❌ 수동 (플레이테스트)
V6. "서버/클라 경계 위반 없나"          ❌ 수동 (코드리뷰/Reviewer 세션)
```

#### 최종 형태: 하이브리드 체크리스트

```markdown
# MiniGameUI - Verification Checklist

## 자동 검증 (CI/verify 스크립트)
- [x] V1. 중복 생성 방지 → `MiniGameSessionStore.spec`
- [x] V2. 닫고 다시 열기 → `MiniGameSessionStore.spec`
- [x] V3. objectId 전달 → `MiniGameRemote.spec`

## 수동 검증 (릴리즈 전 플레이테스트)
- [ ] V4. UI 위치/레이아웃 정상
- [ ] V5. 반응 속도 체감
- [ ] V6. 에러 로그 없음

## 코드리뷰 검증 (Reviewer 세션)
- [ ] I2. 서버에서 GUI 직접 조작 없음
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
V4~V5는 내가 플레이테스트로 확인할게.
```

---

### Step 11. 검증 인프라 레이어를 한 겹씩 추가하기

지금까지는 **수동 검증**만으로도 꽤 견고한 구조를 만들었다. 여기에 인프라를 한 겹씩 올리면, "네가 매번 플레이/눈으로 확인"해야 하는 부담이 줄어든다.

#### 8.1 1겹: 로컬 `verify` 스크립트

- `verify` 스크립트 하나로 최소한의 검증을 묶는다.
    - 예: `rojo build`, `luau-lsp` 타입체크, 간단한 스크립트 실행 등
- Claude에게 "각 변경 후 `verify`를 실행해서 통과해야 완료"라고 지시한다.

#### 8.2 2겹: TestEZ로 순수 로직 테스트 추가

Roblox용 TestEZ는 BDD 스타일 테스트 프레임워크로, `.spec` 파일에서 `it`, `describe` 등으로 테스트를 작성한다. 이 방식은 Roblox 내부에서도 사용되는 것으로 문서에 소개되어 있다.

여기서는 UI 전체를 테스트하려 하지 말고, I1(중복 오픈 금지)을 담당하는 **상태 관리 모듈**만 떼어 테스트한다.

예시:

```lua
--!strict
-- ReplicatedStorage/Shared/MiniGameSessionStore.luau
export type Store = {
    IsOpen: (playerId: string) -> boolean,
    MarkOpen: (playerId: string) -> (),
    MarkClosed: (playerId: string) -> (),
}

-- 실제 구현은 나중에 AI에게 시킴
return {} :: Store
```

```lua
-- ReplicatedStorage/Tests/MiniGameSessionStore.spec.luau
return function()
    local StoreModule = require(game.ReplicatedStorage.Shared.MiniGameSessionStore)

    it("does not open twice for the same player", function()
        local store = StoreModule.new()
        local playerId = "Player_1"

        expect(store:IsOpen(playerId)).to.equal(false)
        store:MarkOpen(playerId)
        expect(store:IsOpen(playerId)).to.equal(true)

        -- 다시 열어도 true지만, 중복으로 쌓이지는 않는다는 의미
        store:MarkOpen(playerId)
        expect(store:IsOpen(playerId)).to.equal(true)
    end)

    it("close makes IsOpen false", function()
        local store = StoreModule.new()
        local playerId = "Player_1"

        store:MarkOpen(playerId)
        store:MarkClosed(playerId)
        expect(store:IsOpen(playerId)).to.equal(false)
    end)
end
```

이제 I1은 사람 머릿속이 아니라 **테스트 + 코드**로 고정된다. 나중에 누가(또는 AI가) 상태 관리 로직을 건드려도, 이 테스트가 깨지면 즉시 알 수 있다.

#### 8.3 3겹 이후(선택)

- CI(GitHub Actions 등)에서 동일 테스트/빌드를 돌려, 다른 PC/환경에서도 동일 검증이 돌아가게 함.
- 더 복잡한 기능(보상 지급, 쿨다운, 랭킹 등)에 대해서도 같은 패턴을 확장.

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
refactor(contract): I1 불변식 완화 - 동일 objectId에 한해 중복 허용

이유: 같은 오브젝트 재상호작용 시 UI 리프레시가 필요한 케이스 발견
변경 전: "한 플레이어에 대해 미니게임 UI는 동시에 1개만"
변경 후: "한 플레이어에 대해 *서로 다른* objectId의 미니게임 UI는 동시에 1개만"

SPEC 업데이트:
- AC2 수정: "3번 연속 트리거해도 UI는 1개만" → "다른 objectId 트리거 시 기존 UI 교체"
- Non-goals에 "동일 objectId 재트리거 시 리프레시" 제거

관련 테스트 업데이트: MiniGameSessionStore.spec.luau
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

예: MiniGame UI → MiniGame 세션 관리 + UI 렌더링 + 입력 처리

### 분리 프롬프트 예시

```text
현재 MiniGame 모듈이 너무 커졌어.
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

0. 기능 하나를 고른다.
1. 기능이 크면 **수직 슬라이스로 쪼갠다** — "플레이테스트로 확인 가능한 최소 단위"로 나눈다.
2. 각 슬라이스(또는 작은 기능)에 대해 **규모를 판단**한다 (Micro/Small/Medium/Large).
3. **Medium 이상이면** SPEC(행동)을 먼저 적는다. **Small 이하면** 건너뛴다.
4. 인터페이스(API)를 고정한다. **Small 이하면** CONTRACT 주석 + 테스트만으로 충분하다.
5. **Large면** 불변식을 별도 파일로, **Medium이면** CONTRACT 주석으로 잠근다.
6. 테스트 인프라가 없어도, **수동 검증 체크리스트(V1~V3)** 를 정의해둔다.
7. **Large면** Claude Code에 Plan Mode로 계획부터 뽑게 한 뒤, Normal 모드에서 구현을 맡긴다.
8. 이때 SPEC/인터페이스/불변식/CONTRACT 주석은 "수정 금지" 영역으로 둔다.
9. **Large면** Writer 세션과 별도 Reviewer 세션을 만들어, Reviewer는 **계약 위반/리스크만** 지적하게 한다.
10. **검증 실패 시 즉시 롤백**하고, AI한테 원인 분석 → 승인 후 수정 순서로 진행한다.
11. 점점 **불변식 중 핵심 몇 개를 자동화된 테스트로 옮긴다.**

이 흐름을 따르면, TDD를 정석대로 배운 적이 없어도:

- 아무도 이해하지 못하는 코드를 그냥 쌓아두지 않고,
- **계약/테스트/불변식/인터페이스**를 기준으로 코드를 신뢰할 수 있고,
- Claude Code의 빠른 개발 속도를 그대로 활용하면서도
- 장기적으로 기술부채가 적은 코드베이스를 유지할 수 있다.

---

## 8. 빠른 참조: 체크리스트 & 프롬프트 템플릿

### 8.1 새 기능 시작 체크리스트

- [ ] "어떻게 깨질 수 있지?" 질문
- [ ] 기능이 크면 수직 슬라이스로 분할
- [ ] 각 슬라이스에 규모 판단 (Micro/Small/Medium/Large)
- [ ] (Medium+) SPEC.md 작성 완료
- [ ] 인터페이스 정의 완료 (직접 타이핑)
- [ ] (Large) 불변식 3개 이상 정의 / (Small~Medium) CONTRACT 주석 작성
- [ ] 수동 검증 체크리스트 작성
- [ ] (Large) AI에게 PLAN 요청
- [ ] (Large) PLAN 검토 및 승인

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

> **자립형(Self-contained) vs 축약형(In-session)**
> - **자립형**: 가이드 문서를 함께 제공하지 않아도 AI가 올바르게 동작하는 프롬프트. 새 세션이나 다른 AI 도구를 쓸 때 복사해서 쓴다.
> - **축약형**: 이미 계약(SPEC/INTERFACE/INVARIANTS) 파일이 열려 있는 세션 안에서 쓰는 짧은 프롬프트.

#### 슬라이싱 요청 (자립형) — Step 1

큰 기능을 수직 슬라이스로 쪼개는 작업만 AI에게 맡길 때. 가이드 문서를 주지 않아도 된다. (Step 1의 "💡 팁: 슬라이싱은 AI에게 맡겨도 된다" 참고)

```text
# 역할
너는 기능을 "수직 슬라이스(vertical slice)"로 쪼개는 작업만 한다.
SPEC 내용, 인터페이스 시그니처, 코드, 파일 경로, 함수 이름은 쓰지 마라.

# 수직 슬라이스란?

한 슬라이스 안에 필요한 모든 레이어(UI + 로직 + 네트워크 + 저장)를 얇게 포함해서,
끝났을 때 실행해서 "의도대로 동작하는가?"를 바로 확인할 수 있는 단위.

## 올바른 예 — 수직 분할 ✅
미니게임을 이렇게 쪼갠다:
- 슬라이스 1: E 누르면 빈 UI가 뜨고 닫힌다 (Server 프롬프트+RemoteEvent / Client 빈 Frame)
- 슬라이스 2: UI 안에서 게임 로직이 돈다 (Client 상태머신+타이머+UI 연동)
- 슬라이스 3: 완료 시 보상을 받는다 (Client→Server 완료 / Server 검증+DB 지급)
→ 각 슬라이스가 끝나면 즉시 플레이테스트로 확인 가능.

## 잘못된 예 — 수평 분할 ❌
- 슬라이스 A: UI 전부 만들기
- 슬라이스 B: 로직 전부 만들기
- 슬라이스 C: 서버/DB 전부 만들기
→ A가 끝나도 확인할 게 없다. 마지막에 통합 버그 폭발.

# 슬라이스 크기 기준 (3가지 모두 Yes일 것)
1. 이 슬라이스만 끝나면 실행해서 뭔가 확인할 수 있는가? (플레이테스트/브라우저/API/CLI)
2. Acceptance Criteria가 3~7개 수준으로 쓸 수 있는가?
3. 4~8시간 안에 구현+검증이 끝나는가?

너무 잘게 쪼개지 마라: "RemoteEvent 정의", "빈 컴포넌트 파일", "DB 테이블만" 같은 건
슬라이스가 아니라 구현 단계다.

# 입력

## 기능
<한 단락 설명>

## User Flow (사용자 관점, 단계별)
1.
2.
3.

## 기술 컨텍스트
- 플랫폼:
- 레이어:
- 재사용할 기존 시스템:

# 출력 형식 (이 형식만)

## 슬라이스 개요
- 총 개수: N
- 흐름: 1 → 2 → 3 → ...

## 슬라이스 K: <한 줄 제목>
- 포함 레이어:
- 끝났을 때 확인 방법 (한 문장, 구체적으로):
- 이전 슬라이스에 무엇이 추가/확장되는가:
- 예상 AC 개수: N개

## 자가 검증
- [ ] 모든 슬라이스가 수직 분할
- [ ] 각 슬라이스 독립 확인 가능
- [ ] 각 슬라이스가 4~8시간 크기
- 가장 걱정되는 슬라이스와 이유:

# 금지
- SPEC 본문, 인터페이스 시그니처, 함수명, 파일명, 코드 예시, 구현 전략 쓰지 말 것.
- "데이터 모델부터 / API부터 / UI부터" 수평 접근 금지.
```

#### 구현 요청 (자립형) — Step 8

한 슬라이스의 구현을 AI에게 맡길 때. **계약 파일(SPEC/인터페이스/불변식/테스트) 자체가 프롬프트의 대부분**이므로 프롬프트는 "울타리"만 친다. 가이드 문서를 주지 않아도 된다.

```text
# 역할
너는 주어진 계약을 충족하는 구현을 작성한다.
계약(SPEC, 인터페이스, 불변식, 테스트)은 고정이다. 나의 소유이며, 너는 건드리지 않는다.

# 읽을 것 (READ-ONLY)
- SPEC:        <경로>
- 인터페이스:  <경로 또는 파일 상단 CONTRACT 주석이 있는 파일들>
- 불변식:      <경로>
- 테스트:      <경로>

# 작성/수정할 것
- <경로 목록>  (없으면 "네가 구조를 제안하고 내 승인 후 작성")

# 규칙

## 계약은 건드리지 마라
- SPEC / 인터페이스 시그니처 / 불변식 / 테스트 파일 절대 수정 금지.
- 테스트가 틀려 보여도 수정하지 말고 멈추고 물어봐라.
- 인터페이스 시그니처(함수명, 파라미터, 반환 타입) 변경이 필요하다고 판단되면
  구현을 멈추고 "왜 바꿔야 하는지"를 먼저 보고하라.

## 구현 범위
- SPEC의 Acceptance Criteria를 모두 충족.
- 주어진 테스트를 모두 통과.
- 불변식을 위반하지 말 것.
- Non-goals / Out of scope는 건드리지 말 것.
- SPEC에 없는 기능을 "이왕 하는 김에" 추가하지 말 것.

## 모호할 때
- 계약만으로 판단 불가능한 지점이 나오면 추정하지 말고 멈춰서 질문.
- 계약끼리 모순되면 구현 중단 후 보고.

## 진행 순서 (반드시 이대로)

### Phase 1: 이해 및 PLAN
1. 계약 파일들을 모두 읽는다.
2. "내가 이해한 계약"을 5줄 이내로 요약.
3. 구현 순서를 5~10 스텝으로 제시. 각 스텝은 "무엇을 / 어느 파일에 / 어느 테스트를 통과시키는가".
4. 여기서 멈추고 내 승인을 기다린다.

### Phase 2: 구현
5. 승인된 PLAN대로 진행.
6. 각 스텝 끝나면 `<verify 커맨드>` 실행 결과 보고.
7. 한 슬라이스를 1~3 커밋으로 정리 (준비 / 주구현 / 마감).

### Phase 3: 완료 보고
8. AC 체크리스트 (각 항목 ✅ / ❌ + 근거).
9. 실행한 테스트 결과.
10. 변경된 파일 목록.

# 즉시 중단 조건 (멈추고 보고)
- 테스트가 처음부터 실행 자체가 안 될 때 (환경 문제)
- 계약끼리 모순될 때
- 불변식을 지키려면 인터페이스를 바꿔야 할 때
- 같은 테스트가 3번 시도해도 깨질 때 (디버깅 늪 방지)
```

> **이 프롬프트가 짧아도 되는 이유**: SPEC/인터페이스/불변식/테스트 파일 자체가 이미 "무엇을 / 어떻게 / 어디까지" 다 말해준다. 프롬프트는 AI가 자주 어기는 5가지 경계("계약 수정 금지", "Plan 먼저", "모호하면 멈춤", "범위 벗어난 추가 금지", "디버깅 늪 중단")만 세운다.

#### Plan 요청 (축약형 — 세션 내)

```text
[SPEC], [INTERFACE], [INVARIANTS] 고정. 코드 수정 금지.
PLAN.md만 작성해줘: FILES, STEPS, VALIDATION 포함.
```

#### 구현 요청 (축약형 — 세션 내)

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

### 수동 검증 (플레이테스트)
- 

## Risks / Notes
- 
```

### 8.6 상호 링크 템플릿 (복붙용)

```md
<!-- Links -->
- Specs: (this file) 또는 [feature.md](../specs/feature.md)
- Invariants: [rules.md](../invariants/rules.md)
- Interfaces: [Module.luau](../../src/Shared/Interfaces/Module.luau)
- Tests: [Module.spec.luau](../../src/Shared/Module.spec.luau)
```

코드 파일용:

```lua
-- Links:
-- Specs: docs/specs/<feature>.md
-- Invariants: docs/invariants/<rules>.md
-- Interfaces: (this file) 또는 src/.../<Module>.luau
-- Tests: (this file) 또는 src/.../<Module>.spec.luau
```

### 8.7 불변식 템플릿 (복붙용)

```md
# <Domain> Rules – INVARIANTS

<!-- Links -->
- Specs: [feature.md](../specs/feature.md)
- Invariants: (this file)
- Interfaces: [Module.luau](../../src/...)
- Tests: [Module.spec.luau](../../src/...)

## Safety (깨지면 치명적)
- 

## Consistency (상태/데이터 관계)
- 

## Boundary (레이어 책임 분리)
- 

## Performance (리소스/프레임 예산)
- 
```

---

## 부록 A. 테스트 가능 영역 분리

### A.1 핵심 원칙

TDD의 효과는 **엔진/UI 의존을 최소화한 순수 로직 층을 분리**할 때 극대화된다.

```
UI/엔진 의존 (테스트 어려움)          순수 로직 (테스트 가능)
──────────────────────────────────────────────────────────
피킹, 렌더링, 뷰포트             →     Calculator, Resolver
엔티티 생성                      ←     Input/Result 데이터
설계변수 UI                      →     규칙/계산 로직
```

### A.2 분야별 테스트 가능 영역

#### 게임 개발 (Unity/Roblox)

**테스트 가능:**

- 데미지/스탯 계산
- 인벤토리 로직 (추가/제거/스택)
- 퀘스트 상태 머신
- 경제 시스템 (가격, 거래 규칙)
- 세이브/로드 직렬화
- 절차적 생성 알고리즘
- 제작(크래프팅) 규칙

**테스트 어려움:**

- 물리 충돌 결과
- 애니메이션 타이밍
- 렌더링/비주얼
- 입력 처리
- 네트워크 동기화 타이밍

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

    // 여기만 엔진 의존
    var dimEntity = CreateDimensionEntity(result);
    Document.Add(dimEntity);
}
```

### A.4 구조 예시: Roblox 인벤토리

```lua
-- 순수 로직 - Inventory.lua
local Inventory = {}
Inventory.__index = Inventory

function Inventory.new(maxSlots)
    return setmetatable({
        _slots = {},
        _maxSlots = maxSlots,
    }, Inventory)
end

function Inventory:count(item)
    return self._slots[item] or 0
end

function Inventory:add(item, amount)
    -- 순수 로직
end

function Inventory:remove(item, amount)
    -- 순수 로직
end

return Inventory
```

```lua
-- 테스트
local Inventory = require(...)

local function test_addItem_basic()
    local inv = Inventory.new(10)
    local success = inv:add("iron", 5)
    
    assert(success == true)
    assert(inv:count("iron") == 5)
end
```

```lua
-- 게임 연결 부분 - 얇게
local playerInventory = Inventory.new(20)

RemoteEvent.OnServerEvent:Connect(function(player, item, amount)
    local success = playerInventory:add(item, amount)
    if success then
        UpdateClientUI:FireClient(player, playerInventory)
    end
end)
```

### A.5 적용 전략

**당장 전부 리팩토링 안 해도 된다:**

1. **새 기능 추가할 때** → 로직을 별도 클래스/함수로 빼고, 거기만 테스트 작성
2. **버그 고칠 때** → 버그 재현하는 테스트 먼저 작성 → 테스트 통과하게 수정
3. **점진적으로 확장**

**AI한테 맡기는 방식:**

```
"아래 테스트가 통과하도록 DimensionCalculator.Calculate 구현해줘.
테스트 코드는 수정하지 마."
```

테스트가 "정답"이니까, AI가 이상하게 구현해도 테스트 돌리면 바로 알 수 있어.

---

## 부록 B. 플랫폼별 도구 매핑

이 가이드의 방법론은 언어/플랫폼에 독립적이다. 아래는 각 환경에서 동일한 역할을 하는 도구들.

### B.1 인터페이스 정의

|플랫폼|도구/방식|
|---|---|
|Roblox (Luau)|`export type` + `--!strict`|
|Unity (C#)|`interface` + nullable reference types|
|Elixir|`@spec`, `@type`, Typespecs + Dialyzer|
|TypeScript|`interface` / `type`|
|Python|`Protocol`, `typing` module, dataclasses|

#### Unity (C#) 인터페이스 예시

```csharp
// IMiniGameUI.cs
public interface IMiniGameUI
{
    void Open(MiniGameContext context);
    void Close();
    bool IsOpen { get; }
}

public record MiniGameContext(string ObjectId);
```

#### Elixir 인터페이스 예시

```elixir
# mini_game_ui.ex
defmodule MiniGameUI do
  @type context :: %{object_id: String.t()}
  
  @callback open(context()) :: :ok | {:error, term()}
  @callback close() :: :ok
  @callback is_open?() :: boolean()
end
```

### B.2 테스트 프레임워크

|플랫폼|프레임워크|실행 방법|
|---|---|---|
|Roblox|TestEZ|`rojo build` → Studio에서 실행|
|Unity|NUnit / Unity Test Framework|Test Runner 창 또는 `dotnet test`|
|Elixir|ExUnit|`mix test`|
|TypeScript|Jest / Vitest|`npm test`|
|Python|pytest|`pytest`|

#### Unity (C#) 테스트 예시

```csharp
// MiniGameSessionStoreTests.cs
using NUnit.Framework;

[TestFixture]
public class MiniGameSessionStoreTests
{
    [Test]
    public void DoesNotOpenTwiceForSamePlayer()
    {
        var store = new MiniGameSessionStore();
        var playerId = "Player_1";
        
        Assert.IsFalse(store.IsOpen(playerId));
        store.MarkOpen(playerId);
        Assert.IsTrue(store.IsOpen(playerId));
        
        // 다시 열어도 true, 중복 쌓이지 않음
        store.MarkOpen(playerId);
        Assert.IsTrue(store.IsOpen(playerId));
    }
    
    [Test]
    public void CloseMakesIsOpenFalse()
    {
        var store = new MiniGameSessionStore();
        var playerId = "Player_1";
        
        store.MarkOpen(playerId);
        store.MarkClosed(playerId);
        Assert.IsFalse(store.IsOpen(playerId));
    }
}
```

#### Elixir 테스트 예시

```elixir
# test/mini_game_session_store_test.exs
defmodule MiniGameSessionStoreTest do
  use ExUnit.Case
  
  test "does not open twice for same player" do
    {:ok, store} = MiniGameSessionStore.start_link()
    player_id = "Player_1"
    
    refute MiniGameSessionStore.is_open?(store, player_id)
    :ok = MiniGameSessionStore.mark_open(store, player_id)
    assert MiniGameSessionStore.is_open?(store, player_id)
    
    # 다시 열어도 true
    :ok = MiniGameSessionStore.mark_open(store, player_id)
    assert MiniGameSessionStore.is_open?(store, player_id)
  end
  
  test "close makes is_open? false" do
    {:ok, store} = MiniGameSessionStore.start_link()
    player_id = "Player_1"
    
    :ok = MiniGameSessionStore.mark_open(store, player_id)
    :ok = MiniGameSessionStore.mark_closed(store, player_id)
    refute MiniGameSessionStore.is_open?(store, player_id)
  end
end
```

### B.3 verify 스크립트 구성

|플랫폼|타입체크|빌드|테스트|린트|
|---|---|---|---|---|
|Roblox|`luau-lsp`|`rojo build`|TestEZ|selene|
|Unity|Roslyn (IDE 내장)|`dotnet build`|`dotnet test`|StyleCop / Rider|
|Elixir|Dialyzer|`mix compile`|`mix test`|Credo|
|TypeScript|`tsc --noEmit`|`npm run build`|`npm test`|ESLint|

#### Unity verify 스크립트 예시

```bash
#!/bin/bash
# verify.sh for Unity (C#)
set -e

echo "=== Build ==="
dotnet build --no-restore

echo "=== Test ==="
dotnet test --no-build --verbosity normal

echo "=== All checks passed ==="
```

#### Elixir verify 스크립트 예시

```bash
#!/bin/bash
# verify.sh for Elixir
set -e

echo "=== Compile ==="
mix compile --warnings-as-errors

echo "=== Test ==="
mix test

echo "=== Dialyzer ==="
mix dialyzer

echo "=== Credo ==="
mix credo --strict

echo "=== All checks passed ==="
```

### B.4 서버/클라이언트 통신 계약

|플랫폼|방식|
|---|---|
|Roblox|RemoteEvent / RemoteFunction|
|Unity (Netcode)|RPC, NetworkVariable|
|Unity (Mirror)|[Command], [ClientRpc]|
|Elixir (Phoenix)|Channels, PubSub|
|TypeScript (웹)|REST API 스키마, tRPC, GraphQL|

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

> **목표**: TestEZ를 당장 도입하지 않아도, "검증 가능한 순수 로직"을 1개 만들어 자동(또는 반자동) 검증 루프를 시작한다.

### C.1 첫 원칙: UI/엔진을 테스트하려 하지 말고, 순수 로직부터

**테스트하기 쉬운 것부터 시작:**

- 중복 오픈 방지 (SessionStore)
- 인벤토리 계산 (add/remove/count)
- 쿨다운 계산
- 상태 머신 전이 규칙
- 데미지/스탯 공식

**첫날부터 하면 안 되는 것:**

- UI 통합 테스트
- 렌더링 결과 검증
- 네트워크 동기화 테스트

### C.2 가장 작은 시작 (Assert 기반)

#### Step 1: 순수 로직 모듈 1개 만들기

```lua
-- ReplicatedStorage/Shared/SessionStore.luau
local SessionStore = {}
SessionStore.__index = SessionStore

function SessionStore.new()
    return setmetatable({ _sessions = {} }, SessionStore)
end

function SessionStore:isOpen(playerId)
    return self._sessions[playerId] == true
end

function SessionStore:markOpen(playerId)
    self._sessions[playerId] = true
end

function SessionStore:markClosed(playerId)
    self._sessions[playerId] = nil
end

return SessionStore
```

#### Step 2: 테스트 러너 (임시) 만들기

**옵션 A: Studio에서 실행 가능한 TestRunner Script**

```lua
-- ServerScriptService/TestRunner.server.luau
-- Studio에서 Play 누르면 실행됨

local SessionStore = require(game.ReplicatedStorage.Shared.SessionStore)

local function assertEquals(actual, expected, message)
    if actual ~= expected then
        error(string.format("FAIL: %s (expected %s, got %s)", message, tostring(expected), tostring(actual)))
    end
    print(string.format("PASS: %s", message))
end

-- 테스트 1: 초기 상태
local store = SessionStore.new()
assertEquals(store:isOpen("player1"), false, "새 store는 비어있어야 함")

-- 테스트 2: markOpen 후 isOpen
store:markOpen("player1")
assertEquals(store:isOpen("player1"), true, "markOpen 후 isOpen은 true")

-- 테스트 3: 중복 markOpen
store:markOpen("player1")
assertEquals(store:isOpen("player1"), true, "중복 markOpen도 true 유지")

-- 테스트 4: markClosed
store:markClosed("player1")
assertEquals(store:isOpen("player1"), false, "markClosed 후 isOpen은 false")

print("=== All tests passed ===")
```

**옵션 B: 커맨드라인에서 실행 (lune/luau 사용)**

```lua
-- tests/SessionStore.test.luau
local SessionStore = require("../src/Shared/SessionStore")

-- 동일한 테스트 코드
-- lune run tests/SessionStore.test.luau 로 실행
```

#### Step 3: assert는 사람이 직접 쓴다

> 이 단계의 목표는 "테스트 프레임워크"가 아니라 **"검증 루프가 돌아간다"**는 경험이다.

- 테스트 케이스 목록은 사람이 정한다
- assertEquals 안의 기대값은 사람이 직접 쓴다
- AI한테는 "이 테스트가 통과하게 구현해"만 시킨다

### C.3 TestEZ로 이전 (권장)

assert 기반 테스트가 5개 이상 쌓이면, TestEZ의 `describe/it/expect` 형태로 옮긴다.

**Before (assert 기반):**

```lua
assertEquals(store:isOpen("player1"), false, "새 store는 비어있어야 함")
```

**After (TestEZ):**

```lua
it("starts with empty state", function()
    local store = SessionStore.new()
    expect(store:isOpen("player1")).to.equal(false)
end)
```

**이전 원칙:**

- 테스트(계약)는 고정
- 구현만 수정해서 통과시키는 루프를 만든다
- 테스트를 바꿔서 통과시키는 건 금지

### C.4 Unity에서의 온보딩

```csharp
// Assets/Scripts/Tests/SessionStoreTests.cs
// Unity Test Framework 없이 시작하기

public static class SimpleTestRunner
{
    public static void Run()
    {
        var store = new SessionStore();
        
        Debug.Assert(!store.IsOpen("player1"), "새 store는 비어있어야 함");
        
        store.MarkOpen("player1");
        Debug.Assert(store.IsOpen("player1"), "MarkOpen 후 IsOpen은 true");
        
        store.MarkClosed("player1");
        Debug.Assert(!store.IsOpen("player1"), "MarkClosed 후 IsOpen은 false");
        
        Debug.Log("=== All tests passed ===");
    }
}

// 어디선가 호출: SimpleTestRunner.Run();
```

나중에 NUnit으로 이전:

```csharp
[Test]
public void StartsWithEmptyState()
{
    var store = new SessionStore();
    Assert.IsFalse(store.IsOpen("player1"));
}
```

### C.5 온보딩 체크리스트

- [ ] 순수 로직 모듈 1개 만들기 (UI/엔진 의존 없음)
- [ ] assert 기반 테스트 3개 이상 작성
- [ ] Play/Run으로 테스트 통과 확인
- [ ] AI한테 "이 테스트 통과하게 구현해" 1회 시도
- [ ] 테스트 프레임워크로 이전 (선택)

---

## 변경 이력

### v4 → v5 변경사항

**추가:**

- **Step 1 (기능 쪼개기)** 신설: 큰 기능을 수직 슬라이스로 분할하는 기준 제공 (수평 분할 vs 수직 분할 개념, 슬라이스 크기 판단 기준 3가지)
- **Step 2 (규모 판단)** 신설: 각 슬라이스에 대해 규모(Micro/Small/Medium/Large)를 판단하고, 적용할 Step 범위를 결정
- **CONTRACT 주석 표준**: Small/Medium에서 별도 invariant.md 없이 불변식을 관리하는 방법 정의
- 각 Step에 규모별 적용 표시 추가 (Medium 이상, Large 권장 등)

**수정:**

- Step 번호 전체 재배정 (기존 Step 1~8 → Step 3~11)
- 섹션 7(요약) 흐름에 슬라이스 분할 및 규모 판단 단계 반영
- 섹션 8.1(새 기능 시작 체크리스트)에 슬라이스 분할 및 조건부 항목 반영

**관련 문서:**

- 규모별 상세 가이드: 「규모별 개발 접근 방법 가이드」 별도 문서