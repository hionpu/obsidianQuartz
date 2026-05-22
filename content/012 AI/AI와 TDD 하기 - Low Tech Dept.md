---
type: reference
created: 2026-05-15
---

# AI와 TDD 없는 상태에서 시작하는 Low Tech Dept 개발 가이드 (v2)

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

### 모든 것에 전부 필요하진 않다

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

---

## 4. 전체 방법론: Contract-first + Verification Loop

이제 실제로 기능을 만들 때, 어떤 순서로 진행하는지 단계별로 정리한다.

### Step 0. 기능/티켓을 하나 고른다

예시(로블록스 미니게임 케이스):

> 상호작용 가능한 오브젝트를 이미 배치했다. 플레이어가 상호작용 키를 누르면 미니게임 화면(UI)이 뜨게 만들고 싶다.

이 기능 하나를 단위로, 아래 과정을 수행한다.

---

### Step 1. 행동 기반 Spec 작성 (사람 100% 이해)

먼저 코드를 쓰지 말고, **사용자 입장에서 보이는 행동**을 스펙으로 적는다.

예시 `SPEC.md`:

```md
# MiniGame UI – SPEC

## Goal
- 플레이어가 특정 오브젝트와 상호작용(ProximityPrompt)을 하면 미니게임 UI가 열린다.

## User Flow
1. 플레이어가 오브젝트 근처로 이동한다.
2. 상호작용 키(E)를 누른다.
3. 화면 중앙에 미니게임 UI가 뜬다.
4. 미니게임이 끝나면 닫기 버튼 또는 ESC로 닫을 수 있다.

## Edge Cases
- 이미 UI가 열려 있는 상태에서 다시 상호작용하면 UI가 **추가로 생성되지 않는다**.
- UI를 닫은 뒤 다시 상호작용하면 정상적으로 다시 열린다.

## Verification(검증 방법)
- 플레이 모드에서 ProximityPrompt를 3번 연속 눌렀을 때 UI가 하나만 유지되는지 확인.
- 서버 Output 로그에 "MiniGameOpen: player=..., objectId=..." 형태 로그가 찍히는지 확인.
```

이 문서는

- 나중에 스펙 이상 동작이 발생했을 때 비교 기준
- AI에게 "무엇이 성공인지"를 알려주는 기준

이 된다.

---

### Step 2. 공개 인터페이스(API) 고정 (사람 100% 이해)

**되도록이면 작성도 사람이 할 것 → Syntax, 라이브러리 감각, 디버깅 근육 퇴화 방지**

구현(내부 로직)보다 먼저, **모듈들 사이의 경계**를 타입/함수 시그니처로 정한다.

#### 2.1 서버 ↔ 클라이언트 통신 계약

- RemoteEvent: `ReplicatedStorage/Remotes/OpenMiniGame`
    - 서버: `OpenMiniGame:FireClient(player, context)`
    - 클라: `OpenMiniGame.OnClientEvent:Connect(function(context) ... end)`

#### 2.2 클라이언트 UI 모듈 계약

```lua
--!strict
-- ReplicatedStorage/Shared/MiniGameUI.luau

export type Context = {
    objectId: string,
    -- 나중에 source: "ProximityPrompt" | "Button" 등 확장 가능
}

export type MiniGameUI = {
    Open: (context: Context) -> (),
    Close: () -> (),
    IsOpen: () -> boolean,
}

return {} :: MiniGameUI
```

이 인터페이스는 **"나중에 코드가 어떻게 바뀌어도, 이 함수들만 알고 있으면 된다"** 라는 안정된 접점이다.

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

- I1. 한 플레이어에 대해 미니게임 UI는 **동시에 1개만** 열린다. (중복 생성 금지)
- I2. 실제 화면에 GUI를 추가/제거하는 작업은 **클라이언트에서만** 한다. 서버는 RemoteEvent로 신호만 보낸다.
- I3. 서버가 클라이언트에게 미니게임을 열라고 요청할 때, 항상 `objectId`를 포함한 context를 보낸다.

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

> 💡 나중에 자동화하려면 Step 8을 참고

나중에 TestEZ 같은 프레임워크를 도입하면, V1~V3 중 일부를 자동화된 테스트로 옮겨갈 수 있다.

---

### Step 5. AI에게 Plan(계획) 먼저 뽑게 하기

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

### Step 6. AI에게 구현을 맡기되, 계약/불변식은 금지 영역으로 둔다

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

### Step 7. Reviewer 세션(별도 에이전트/세션)으로 불변식/리스크만 검토

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

### Step 7.5. 검증의 진화: 수동 → 자동 → 하이브리드

Step 6에서 "그때그때 V1~V3를 수동으로 검증한다"고 했는데, 이건 시간이 지나면서 진화한다.

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

### Step 8. 검증 인프라 레이어를 한 겹씩 추가하기

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

### 변경 프로세스

1. 변경 이유를 CHANGELOG.md나 커밋 메시지에 명시
2. 관련 테스트/검증 체크리스트도 함께 업데이트
3. **절대 AI한테 계약 변경을 맡기지 않는다** - 사람이 직접 수정
4. 변경 후 기존 구현이 새 계약을 만족하는지 재검증

### 계약 변경 커밋 예시

```
refactor(contract): I1 불변식 완화 - 동일 objectId에 한해 중복 허용

이유: 같은 오브젝트 재상호작용 시 UI 리프레시가 필요한 케이스 발견
변경 전: "한 플레이어에 대해 미니게임 UI는 동시에 1개만"
변경 후: "한 플레이어에 대해 *서로 다른* objectId의 미니게임 UI는 동시에 1개만"

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

1. **기능 하나당** SPEC(행동) → 인터페이스(API) → 불변식(Invariants)을 먼저 적는다.
2. 테스트 인프라가 없어도, **수동 검증 체크리스트(V1~V3)** 를 정의해둔다.
3. Claude Code에 Plan Mode로 계획부터 뽑게 한 뒤, Normal 모드에서 구현을 맡긴다.
4. 이때 SPEC/인터페이스/불변식은 "수정 금지" 영역으로 둔다.
5. Writer 세션과 별도 Reviewer 세션을 만들어, Reviewer는 **계약 위반/리스크만** 지적하게 한다.
6. **검증 실패 시 즉시 롤백**하고, AI한테 원인 분석 → 승인 후 수정 순서로 진행한다.
7. **계약 변경이 필요하면 사람이 직접** 수정하고, 변경 이유를 명시한다.
8. 점점 TestEZ 같은 도구로 **불변식 중 핵심 몇 개(I1 등)를 자동화된 테스트로 옮긴다.**
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