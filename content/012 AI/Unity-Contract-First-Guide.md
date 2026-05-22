---
type: reference
created: 2026-05-15
---

# AI와 함께하는 Unity 게임 개발 가이드 (Contract-first + Verification Loop)

> 이 문서는 [AI와 TDD 없는 상태에서 시작하는 Low Tech Dept 개발 가이드]의 Unity 전용 파생 문서다.
> 원본 가이드의 핵심 철학(계약-first, AI는 구현, 사람은 계약 소유)은 동일하지만,
> Unity의 구조적 특성 때문에 **적용 범위와 방식이 다르다.**

---

## 0. Unity에서 이 방법론이 마찰을 일으키는 이유

원본 가이드는 입력/출력이 명확한 순수 로직(백엔드, 서버 코드)에서 가장 자연스럽게 작동한다.
Unity는 구조적으로 다른 세 가지 특성이 있다.

### 0.1 MonoBehaviour 라이프사이클은 계약 바깥에 있다

```
// 인터페이스를 아무리 잘 정의해도
public interface IInventoryUI
{
    void Open(InventoryData data);
    void Close();
}

// 이 구현체는 Awake/Start가 끝나야 Open()이 동작한다
public class InventoryUIView : MonoBehaviour, IInventoryUI
{
    [SerializeField] private GameObject panel; // Awake 이전엔 null

    public void Open(InventoryData data)
    {
        panel.SetActive(true); // Awake 전에 호출하면 NullReferenceException
    }
}
```

`Open()`이라는 계약은 존재하지만, **언제 호출 가능한지는 Unity 엔진이 결정**한다.
이 타이밍 문제는 인터페이스나 Invariant로 잠글 수 없다.

### 0.2 씬(Scene) 자체가 상태다

인벤토리 로직을 아무리 순수하게 테스트해도, 실제 게임에서는
- 어떤 씬인지
- 씬에 어떤 오브젝트가 있는지
- 어떤 컴포넌트가 활성화되어 있는지

에 따라 동작이 달라진다. 씬 상태는 Invariant로 완전히 기술하기 어렵다.

### 0.3 게임플레이 "느낌"은 Spec-first와 충돌한다

```
// 이 Spec은 검증 가능하다
// AC1. 데미지 계산: 방어력 50, 공격력 100 → 실제 데미지 50
// AC2. 최소 데미지 보장: 방어력 > 공격력일 때 → 최소 1 데미지

// 하지만 이 Spec은 쓸 수 없다
// AC3. 전투가 "재밌어야" 한다
// AC4. 히트 느낌이 "묵직해야" 한다
```

게임플레이 이터레이션은 **만들어보고 판단하는 루프**다.
요구사항이 플레이해봐야 정해지는 영역에 Spec-first를 강제하면 오히려 느려진다.

---

## 1. 핵심 원칙: 레이어를 나누고, 레이어마다 다른 전략을 쓴다

Unity 개발을 두 개의 레이어로 분리한다.

```
┌─────────────────────────────────────────────────────┐
│  GAMEPLAY LAYER (MonoBehaviour, Scene, Physics)     │
│  → Spec-first X  / 플레이테스트 이터레이션 O         │
│  → AI: 보일러플레이트 생성, 리팩토링 보조            │
├─────────────────────────────────────────────────────┤
│  LOGIC LAYER (순수 C#, MonoBehaviour 의존 없음)      │
│  → 원본 가이드 방법론 그대로 적용                    │
│  → AI: Spec/Interface 기반 구현 위임                 │
└─────────────────────────────────────────────────────┘
```

**이 두 레이어를 물리적으로 분리하는 것이 이 가이드 전체의 전제조건이다.**

---

## 2. 폴더 구조와 Assembly Definition

레이어 분리는 Assembly Definition(.asmdef)으로 강제한다.
asmdef로 분리하면 Logic 레이어가 Unity 엔진 API를 참조하는 순간 **컴파일 에러**가 난다.
실수로 MonoBehaviour 의존성이 섞이는 것을 구조적으로 막는다.

### 소규모 프로젝트 (시스템 5개 이하)

```
Assets/
├── Logic/                          ← 순수 C# (Unity API 없음)
│   ├── Logic.asmdef                ← UnityEngine 참조 없음
│   ├── Inventory/
│   │   ├── IInventory.cs
│   │   ├── InventorySystem.cs
│   │   └── InventorySlot.cs
│   ├── Combat/
│   │   ├── IDamageCalculator.cs
│   │   └── DamageCalculator.cs
│   └── Quest/
│       ├── IQuestState.cs
│       └── QuestStateMachine.cs
│
├── Runtime/                        ← MonoBehaviour, Unity API
│   ├── Runtime.asmdef              ← Logic 참조 O, UnityEngine 참조 O
│   ├── Inventory/
│   │   └── InventoryUIView.cs      ← MonoBehaviour, Logic 레이어 호출
│   └── Combat/
│       └── CombatController.cs
│
└── Tests/
    ├── Tests.asmdef                ← Logic 참조 O, EditMode
    └── Logic/
        ├── InventoryTests.cs
        └── DamageCalculatorTests.cs
```

### 중규모 프로젝트 (시스템 6~20개)

```
Assets/
├── Core/                           ← 도메인별 Logic 묶음
│   ├── Core.asmdef
│   ├── Inventory/
│   │   ├── Interfaces/
│   │   │   └── IInventory.cs
│   │   ├── Models/
│   │   │   └── InventorySlot.cs
│   │   └── Systems/
│   │       └── InventorySystem.cs
│   ├── Combat/
│   └── Economy/
│
├── Runtime/
│   ├── Runtime.asmdef
│   ├── Inventory/
│   │   ├── InventoryUIView.cs
│   │   └── InventoryPresenter.cs   ← Core ↔ View 연결
│   └── Combat/
│
├── Tests/
│   ├── EditMode/                   ← Logic 레이어 단위 테스트
│   │   ├── EditMode.asmdef
│   │   ├── InventoryTests.cs
│   │   └── CombatTests.cs
│   └── PlayMode/                   ← 씬 통합 테스트 (최소한으로)
│       └── PlayMode.asmdef
│
└── docs/
    ├── specs/
    │   ├── inventory-system.md
    │   └── combat-system.md
    └── invariants/
        ├── economy-rules.md
        └── architecture-unity.md
```

### asmdef 설정 예시

**Logic.asmdef** (Unity API 참조 없음):
```json
{
    "name": "Logic",
    "references": [],
    "includePlatforms": [],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": false,
    "precompiledReferences": [],
    "autoReferenced": true,
    "defineConstraints": [],
    "noEngineReferences": true
}
```

`"noEngineReferences": true` — 이 한 줄이 Logic 레이어에서 UnityEngine을 쓰는 순간 컴파일 에러를 낸다.

---

## 3. Logic 레이어: 원본 가이드 그대로 적용

Logic 레이어는 순수 C# 이므로 원본 가이드의 Spec → Interface → Invariant → Test 흐름이 그대로 작동한다.

### 3.1 Spec 작성

```md
# InventorySystem – SPEC

## Goal
- 플레이어가 아이템을 획득/사용/드롭할 수 있는 인벤토리 로직을 제공한다.
- UI나 씬 구조에 의존하지 않는다.

## Non-goals (이번 티켓에서 하지 않음)
- UI 표시 (별도 InventoryUIView에서 담당)
- 아이템 저장/불러오기 (별도 SaveSystem 티켓)
- 장비 착용 효과 적용

## Out of scope (절대 건드리지 말 것)
- MonoBehaviour, UnityEngine 참조
- PlayerController, SceneManager 참조

## User Flow (시스템 관점)
1. 아이템 ID와 수량을 받아 슬롯에 추가한다.
2. 슬롯이 가득 차면 추가를 거부하고 false를 반환한다.
3. 없는 아이템을 제거하려 하면 false를 반환한다.

## Edge Cases
- 동일 아이템 ID를 maxStack 이상 추가 시도 → false
- 수량 0 또는 음수 추가 시도 → ArgumentException
- 존재하지 않는 아이템 제거 → false (throw 하지 않음)

## Acceptance Criteria
- AC1. AddItem("sword", 1) 후 GetCount("sword") == 1
- AC2. maxSlots=2인 인벤토리에 3번째 다른 아이템 추가 → false
- AC3. RemoveItem("sword", 1) 후 GetCount("sword") == 0
- AC4. RemoveItem 존재하지 않는 아이템 → false, 예외 없음
- AC5. AddItem(amount: 0) → ArgumentException

## Done 정의
### 자동 검증
- dotnet test (NUnit) 통과

### 수동 검증
- 없음 (Logic 레이어는 전부 자동 검증)
```

### 3.2 Interface 정의

```csharp
// Logic/Inventory/Interfaces/IInventory.cs

public interface IInventory
{
    bool AddItem(string itemId, int amount);
    bool RemoveItem(string itemId, int amount);
    int GetCount(string itemId);
    bool HasItem(string itemId, int amount);
    IReadOnlyList<InventorySlot> GetAllSlots();
}

public record InventorySlot(string ItemId, int Amount);
```

### 3.3 Invariant 정의

```md
# Inventory Rules – INVARIANTS

## Consistency
- I1. 어떤 연산 이후에도 슬롯의 아이템 수량은 항상 1 이상이다. (0이 되면 슬롯 제거)
- I2. 동일 itemId의 슬롯은 인벤토리 내에 최대 1개만 존재한다.
- I3. 슬롯 총 개수는 maxSlots를 초과하지 않는다.

## Boundary
- I4. IInventory 구현체는 UnityEngine을 참조하지 않는다. (asmdef로 강제)
- I5. IInventory 구현체는 UI 상태를 직접 변경하지 않는다.

## Safety
- I6. amount <= 0인 AddItem 호출은 ArgumentException을 던진다.
```

### 3.4 테스트 작성 (NUnit)

```csharp
// Tests/EditMode/InventoryTests.cs

[TestFixture]
public class InventorySystemTests
{
    private IInventory _inventory;

    [SetUp]
    public void SetUp()
    {
        _inventory = new InventorySystem(maxSlots: 10);
    }

    [Test]
    public void AddItem_NewItem_ReturnsTrue()
    {
        var result = _inventory.AddItem("sword", 1);
        Assert.IsTrue(result);
        Assert.AreEqual(1, _inventory.GetCount("sword"));
    }

    [Test]
    public void AddItem_WhenFull_ReturnsFalse()
    {
        var inventory = new InventorySystem(maxSlots: 2);
        inventory.AddItem("sword", 1);
        inventory.AddItem("shield", 1);

        var result = inventory.AddItem("potion", 1);
        Assert.IsFalse(result);
    }

    [Test]
    public void RemoveItem_NotExisting_ReturnsFalseWithoutException()
    {
        Assert.DoesNotThrow(() =>
        {
            var result = _inventory.RemoveItem("nonexistent", 1);
            Assert.IsFalse(result);
        });
    }

    [Test]
    public void AddItem_ZeroAmount_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => _inventory.AddItem("sword", 0));
    }

    [Test]
    public void Invariant_I1_SlotRemovedWhenCountReachesZero()
    {
        _inventory.AddItem("potion", 1);
        _inventory.RemoveItem("potion", 1);

        // 슬롯이 제거되어야 함 (count 0짜리 슬롯이 남으면 안 됨)
        var slots = _inventory.GetAllSlots();
        Assert.IsFalse(slots.Any(s => s.ItemId == "potion"));
    }
}
```

### 3.5 AI에게 구현 위임

```
[SPEC] inventory-system.md 참고
[INTERFACE] IInventory.cs
[INVARIANTS] I1~I6

아래 테스트가 전부 통과하도록 InventorySystem.cs를 구현해줘.
테스트 코드는 수정하지 마.
UnityEngine 참조 없음. 순수 C# 클래스로만.
```

---

## 4. Runtime 레이어: 다른 전략

Runtime 레이어(MonoBehaviour, Scene, Physics)는 Spec-first가 아니라
**"얇게 유지 + 플레이테스트 이터레이션"** 전략을 쓴다.

### 4.1 핵심 원칙: Runtime 레이어는 얇아야 한다

Runtime 레이어의 역할은 단 두 가지다.

1. **유저 입력/씬 이벤트를 Logic 레이어로 전달**
2. **Logic 레이어 결과를 화면에 표시**

```csharp
// Runtime/Inventory/InventoryPresenter.cs
// 이 파일은 최대한 얇게 유지한다.
// 비즈니스 로직이 한 줄도 없어야 정상이다.

public class InventoryPresenter : MonoBehaviour
{
    [SerializeField] private InventoryUIView _view;
    private IInventory _inventory;

    private void Awake()
    {
        _inventory = new InventorySystem(maxSlots: 20);
    }

    // 입력 이벤트 → Logic 호출
    public void OnPickupItem(string itemId, int amount)
    {
        var success = _inventory.AddItem(itemId, amount);
        if (success)
            _view.RefreshSlots(_inventory.GetAllSlots());
        else
            _view.ShowFullMessage();
    }

    // Logic 결과 → View 갱신
    public void OnDropItem(string itemId)
    {
        _inventory.RemoveItem(itemId, 1);
        _view.RefreshSlots(_inventory.GetAllSlots());
    }
}
```

**이 파일에 조건문이 늘어나기 시작하면 Logic 레이어로 옮겨야 한다는 신호다.**

### 4.2 Runtime 레이어에 Spec을 쓰는 기준

Runtime 레이어에도 Spec이 필요한 경우가 있다.
하지만 형태가 다르다 — Acceptance Criteria가 "예/아니오"가 아니라 **플레이테스트 체크리스트**다.

```md
# InventoryUIView – SPEC

## Goal
- 인벤토리 슬롯을 화면에 표시하고 드래그/클릭 입력을 받는다.

## Non-goals
- 인벤토리 로직 (InventorySystem이 담당)
- 아이템 효과 적용

## Acceptance Criteria
- AC1. RefreshSlots() 호출 시 슬롯 UI가 데이터와 일치한다.
- AC2. 슬롯 클릭 시 OnDropItem 이벤트가 발생한다.

## Done 정의
### 자동 검증
- 없음 (UI는 수동 검증)

### 수동 검증 (플레이테스트)
- [ ] 아이템 획득 시 슬롯에 즉시 표시되는가
- [ ] 20개 슬롯 모두 표시될 때 레이아웃이 깨지지 않는가
- [ ] 드래그 중 아이템이 커서를 따라오는가
- [ ] 드롭 후 원래 슬롯이 비워지는가
```

자동 검증이 없는 Spec도 유효하다.
**"수동 검증 체크리스트"만으로도 AI가 과구현하는 것을 막고, 완료 기준을 명확히 한다.**

### 4.3 게임플레이 이터레이션 구역

물리, 전투 느낌, 카메라, 이동감 같은 영역은 Spec 자체를 쓰기 어렵다.
이 구역은 다른 루프를 쓴다.

```
[게임플레이 이터레이션 루프]

1. AI에게 기본 구현 요청
   → "플레이어 이동 컨트롤러 만들어줘. WASD + 점프, 리지드바디 기반."

2. 플레이해보고 느낌 기록
   → "점프가 너무 가볍다. 중력감이 없다."

3. 구체적인 수치/동작으로 번역
   → "점프 후 하강 가속도를 2배로. fallMultiplier = 2.5f"

4. AI에게 수치 수정 요청
   → 파라미터 노출, SerializeField로 에디터에서 조정 가능하게

5. 만족할 때까지 반복
```

이 루프에서 Spec은 **이터레이션이 끝난 뒤** 결과를 기록하는 용도로 쓴다.

```md
# PlayerController – 완료된 수치 기록

## 결정된 파라미터 (2024-xx-xx 플레이테스트 기준)
- moveSpeed: 5f
- jumpForce: 8f
- fallMultiplier: 2.5f
- groundCheckRadius: 0.2f

## 변경 금지 이유
- fallMultiplier 2.5 미만 → 점프가 플로팅 느낌
- jumpForce 10 초과 → 씬 천장에 닿음
```

---

## 5. Unity 전용 Invariant

Unity 구조 때문에 추가로 필요한 불변식들이다.
`docs/invariants/architecture-unity.md`에 프로젝트 시작 시 작성해둔다.

```md
# Unity Architecture – INVARIANTS

## Boundary (레이어 분리)
- I-U1. [Boundary] Logic 레이어(.asmdef noEngineReferences)는 UnityEngine을 참조하지 않는다.
- I-U2. [Boundary] Logic 레이어는 MonoBehaviour를 상속하지 않는다.
- I-U3. [Boundary] Presenter/Controller는 비즈니스 로직을 직접 포함하지 않는다.
         조건 분기가 필요하면 Logic 레이어 메서드로 위임한다.

## Consistency (씬/오브젝트)
- I-U4. [Consistency] SerializeField로 연결된 참조는 Awake()에서 null 체크한다.
- I-U5. [Consistency] 씬 간 유지되는 데이터는 ScriptableObject 또는 별도 Manager를 통해서만 전달한다.
         DontDestroyOnLoad를 MonoBehaviour 내부에서 직접 호출하지 않는다.

## Safety
- I-U6. [Safety] Update()에서 GetComponent()를 호출하지 않는다. Awake/Start에서 캐싱.
- I-U7. [Safety] Find(), FindObjectOfType()을 런타임 Update 루프에서 호출하지 않는다.
```

---

## 6. 검증 전략 요약

| 레이어 | 검증 방법 | AI 역할 |
|---|---|---|
| Logic (순수 C#) | NUnit 자동 테스트 (dotnet test) | 테스트 통과하는 구현 생성 |
| Presenter/Controller | 인터페이스 계약 리뷰 (Reviewer 세션) | 얇게 유지되는지 확인 |
| View (MonoBehaviour) | 수동 플레이테스트 체크리스트 | UI 보일러플레이트 생성 |
| 게임플레이 (Physics 등) | 플레이테스트 이터레이션 | 수치 파라미터 SerializeField 노출 |

---

## 7. verify 스크립트

```bash
#!/bin/bash
# verify.sh
set -e

echo "=== Build ==="
dotnet build

echo "=== EditMode Tests ==="
# Unity Test Runner CLI (Unity 설치 필요)
# /path/to/Unity -runTests -testPlatform EditMode -testResults results.xml
# 또는 Unity 없이 Logic만 테스트:
dotnet test

echo "=== All checks passed ==="
```

Logic 레이어를 asmdef로 분리했으면 Unity 에디터 없이 `dotnet test`만으로도
Logic 레이어 전체를 검증할 수 있다. CI 파이프라인 구성이 훨씬 단순해진다.

---

## 8. 분리 신호: Logic 레이어로 옮겨야 할 때

Runtime 레이어 파일에서 아래 신호가 보이면 Logic으로 추출한다.

| 신호 | 예시 |
|---|---|
| Presenter에 조건 분기 3개 이상 | if (isEquipped && hasMana && level > 5) |
| 수치 계산이 Presenter에 직접 있음 | float damage = atk * 1.5f - def * 0.3f; |
| 동일 로직이 두 곳 이상의 MonoBehaviour에 반복 | 각 Controller마다 쿨다운 계산 |
| Update()가 50줄을 넘어감 | 상태 관리 + 입력 + 로직이 뒤섞임 |

추출 프롬프트:
```
InventoryPresenter.cs에서 아이템 스택 가능 여부 판단 로직을 
Logic 레이어의 순수 C# 클래스로 추출해줘.
MonoBehaviour 의존 없음. 추출 후 NUnit 테스트도 작성해줘.
Presenter는 결과값을 받아서 View에 전달하는 역할만 남겨야 해.
```

---

## 9. 전체 흐름 요약

```
새 시스템 개발 시작
        ↓
이 시스템이 어느 레이어인가?
        ↓
┌───────────────────┬────────────────────────────┐
│   Logic 레이어    │     Runtime 레이어          │
│                   │                            │
│ 1. Spec 작성      │ 1. Spec 작성               │
│ 2. Interface 정의 │    (수동 검증 체크리스트만) │
│ 3. Invariant 정의 │ 2. 얇게 구현               │
│ 4. Test 작성      │ 3. 플레이테스트             │
│ 5. AI 구현 위임   │ 4. 이터레이션              │
│ 6. dotnet test    │ 5. 느낌 → 수치로 번역      │
└───────────────────┴────────────────────────────┘
        ↓
Runtime 레이어에 로직이 쌓이기 시작하면
→ Logic 레이어로 추출 (분리 신호 참고)
```

---

## 부록 A. AI 프롬프트 템플릿

### Logic 구현 요청
```
[SPEC] (spec 내용)
[INTERFACE] (인터페이스 코드)
[INVARIANTS] (I1~In)
[TESTS] (테스트 코드)

테스트가 전부 통과하도록 구현해줘.
테스트 수정 금지. UnityEngine 참조 없음. 순수 C#만.
```

### Runtime 보일러플레이트 요청
```
InventoryPresenter.cs를 만들어줘.

역할:
- IInventory (Logic 레이어)를 DI로 받아서 사용
- OnPickupItem(string itemId, int amount) 이벤트 처리
- InventoryUIView.RefreshSlots() 호출

규칙:
- 비즈니스 로직 직접 작성 금지
- 조건 분기가 필요하면 IInventory 메서드로 위임
- Awake에서 null 체크 포함 (I-U4)
```

### 게임플레이 이터레이션 요청
```
PlayerController.cs의 점프 느낌을 개선해줘.

현재 문제: 점프 후 하강이 너무 가볍다.
원하는 느낌: 정점 이후 빠르게 떨어지는 묵직한 느낌.

수치는 SerializeField로 노출해서 에디터에서 조정 가능하게.
fallMultiplier, lowJumpMultiplier 파라미터 추가.
```

### Reviewer 세션 요청
```
코드 수정 금지. 검토만 해줘.

- I-U1: Logic 레이어에 UnityEngine 참조 없는지
- I-U3: Presenter에 비즈니스 로직이 직접 있는지
- I-U6: Update()에서 GetComponent() 호출하는지

[코드 붙여넣기]
```

---

## 부록 B. 체크리스트

### 새 시스템 시작
- [ ] Logic / Runtime 레이어 분류 결정
- [ ] Logic이면: Spec, Interface, Invariant, Test 작성
- [ ] Runtime이면: 수동 검증 체크리스트 작성
- [ ] asmdef 설정 확인 (noEngineReferences)

### 커밋 전
- [ ] dotnet test 통과
- [ ] I-U1~I-U7 위반 없음
- [ ] Presenter에 비즈니스 로직 없음

### 분리 신호 점검 (주 1회 권장)
- [ ] Presenter에 조건 분기 3개 이상?
- [ ] Update()가 50줄 이상?
- [ ] 동일 로직이 두 곳 이상 반복?
