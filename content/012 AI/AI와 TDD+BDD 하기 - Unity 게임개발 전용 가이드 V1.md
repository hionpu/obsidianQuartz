# AI와 TDD+BDD 하기 – Unity 게임개발 전용 가이드 (V1)

> 이 문서는 [[AI와 TDD+BDD 하기 - Low Tech Dept V4]] 의 Unity(C#) 전용 특화 버전이다.
> 범용 가이드에서 "플랫폼 독립" 이라고 미뤄둔 부분을 Unity 환경 기준으로 풀어 쓴다.
> 방법론의 뼈대(Contract-first + Verification Loop, 사람이 계약 소유, AI가 구현 반복)는 동일하다.

---

## 1. 왜 Unity는 별도 가이드가 필요한가

### 1.1 Unity에서 Contract-first가 마찰을 일으키는 3가지 지점

원본 가이드는 입력/출력이 명확한 순수 로직(백엔드, 서버 코드)에서 가장 자연스럽게 작동한다. Unity는 구조적으로 다음 세 지점에서 충돌한다.

#### (1) MonoBehaviour 라이프사이클은 계약 바깥에 있다

```csharp
// 인터페이스를 아무리 잘 정의해도
public interface IInventoryUI
{
    void Open(InventoryData data);
    void Close();
}

// 이 구현체는 Awake/Start가 끝나야 Open()이 동작한다
public class InventoryUIView : MonoBehaviour, IInventoryUI
{
    [SerializeField] private GameObject panel;  // Awake 이전엔 null

    public void Open(InventoryData data)
    {
        panel.SetActive(true);  // Awake 전에 호출하면 NullReferenceException
    }
}
```

`Open()`이라는 계약은 존재하지만, **언제 호출 가능한지는 Unity 엔진이 결정**한다. 이 타이밍 문제는 인터페이스나 Invariant로 잠글 수 없다.

#### (2) 씬(Scene) 자체가 상태다

인벤토리 로직을 아무리 순수하게 테스트해도, 실제 게임에서는
- 어떤 씬인지
- 씬에 어떤 오브젝트가 있는지
- 어떤 컴포넌트가 활성화되어 있는지

에 따라 동작이 달라진다. 씬 상태는 Invariant로 완전히 기술하기 어렵다.

#### (3) 게임플레이 "느낌"은 Spec-first와 충돌한다

```md
// 이 Spec은 검증 가능하다
- AC1. 데미지 계산: 방어력 50, 공격력 100 → 실제 데미지 50
- AC2. 최소 데미지 보장: 방어력 > 공격력일 때 → 최소 1 데미지

// 하지만 이 Spec은 쓸 수 없다
- AC3. 전투가 "재밌어야" 한다
- AC4. 히트 느낌이 "묵직해야" 한다
```

게임플레이 이터레이션은 **만들어보고 판단하는 루프**다. 요구사항이 플레이해봐야 정해지는 영역에 Spec-first를 강제하면 오히려 느려진다.

### 1.2 추가적인 엔지니어링 제약

위 3가지는 방법론 충돌이고, 아래는 엔지니어링 제약이다.

1. **MonoBehaviour 자체가 테스트하기 어렵다.** 생성자 주입 불가, `new`로 만들 수 없음.
2. **`GetComponent`, `FindObjectOfType`, 싱글톤**으로 얽힌 코드는 단위 테스트 불가능.
3. **Edit Mode / Play Mode** 두 종류의 테스트가 있고 가능 범위가 다르다.
4. **Prefab, ScriptableObject, Scene** 같은 에셋이 코드와 섞여 있어 "계약" 경계가 애매.
5. **물리, 렌더링, 입력, 오디오**는 Unity 엔진이 책임지므로 내 코드에서 테스트할 영역이 아니다.
6. **Coroutine, async/UniTask, FixedUpdate** 등 시간 축이 여러 개라 테스트에서 시간 제어가 까다로움.

### 1.3 해결 축 3개

- **레이어 분리**: Logic(엔진 무의존) vs Runtime(엔진 의존). 각 레이어에 **다른 전략**을 쓴다.
- **Humble Object 패턴**: MonoBehaviour는 얇은 껍데기, 로직은 POCO로. 테스트는 POCO만.
- **어셈블리 분리**: `Core`(엔진 무의존), `Runtime`(엔진 의존), `Editor`, `Tests`를 asmdef로 분리. `noEngineReferences: true`로 강제.

### 1.4 레이어별 전략 한눈에 보기

```
┌─────────────────────────────────────────────────────────────┐
│  GAMEPLAY / RUNTIME LAYER (MonoBehaviour, Scene, Physics)   │
│  → Spec-first △  / 플레이테스트 이터레이션 ○                 │
│  → AI: 보일러플레이트 생성, 수치 조정, SerializeField 노출   │
│  → 검증: 수동 체크리스트, 결정된 수치 기록                   │
├─────────────────────────────────────────────────────────────┤
│  LOGIC LAYER (순수 C#, MonoBehaviour 의존 없음)              │
│  → 원본 가이드 방법론 그대로 적용                            │
│  → AI: Spec/Interface 기반 구현 위임                         │
│  → 검증: Edit Mode NUnit 자동 테스트                         │
└─────────────────────────────────────────────────────────────┘
```

**이 두 레이어를 물리적으로 분리하는 것이 이 가이드 전체의 전제조건이다.** 이게 안 되어 있으면 뒤의 모든 이야기가 공허해진다.

---

## 2. "100% 이해"를 Unity 맥락으로 재정의하기

### 사람이 100% 이해해야 하는 것 (계약, 반드시 나의 소유)

- 기능 요구사항 (User Flow, Acceptance Criteria)
- 공개 API/인터페이스 (`interface`, 퍼블릭 메서드 시그니처, ScriptableObject 필드)
- **MonoBehaviour 경계**: 어떤 컴포넌트가 어떤 책임을 갖는가
- **씬/Prefab 조립 규칙**: 어떤 오브젝트가 어떤 컴포넌트를 가져야 하는가
- **네트워크 경계** (멀티플레이일 경우): 서버 권한 / 클라이언트 권한
- 불변식 (프레임 예산, GC 할당 금지 구역, 상태 일관성 등)
- 검증 수단 (Edit Mode 테스트, Play Mode 테스트, 플레이테스트 체크리스트)

### 사람이 라인 단위로 전부 이해하지 않아도 되는 것

- MonoBehaviour 내부의 `SerializeField` 배선 코드
- 단순 UI 바인딩 / Animator 파라미터 설정
- 반복적인 DI 컨테이너 설정
- 엔진 API 호출의 기계적 래핑

즉 Unity에서도 "**계약 + 검증**" 이 신뢰 단위이고, 그 계약이 `interface + ScriptableObject 스키마 + Prefab 배선 규칙 + 불변식` 형태로 파편화되어 있다는 게 특이한 점이다.

---

## 3. Unity에서의 계약(Contract) 형태

범용 가이드의 계약 4종(Spec, Invariant, Interface, Test)에 더해, Unity에서는 추가로 다음이 계약 역할을 한다.

| 계약 형태 | 어디에 있나 | 누가 소유 |
|---|---|---|
| **Spec (.md)** | `docs/specs/` | 사람 |
| **Invariant (.md)** | `docs/invariants/` | 사람 |
| **C# interface (.cs)** | `Assets/Scripts/Core/Interfaces/` | 사람 (직접 타이핑) |
| **ScriptableObject 스키마** | `Assets/Scripts/Core/Data/` | 사람 |
| **MonoBehaviour 책임 경계** | `docs/specs/` 에 문서화 | 사람 |
| **Prefab 배선 규칙** | `docs/specs/` 에 문서화 | 사람 |
| **Test (Edit/Play Mode)** | `Assets/Tests/` | 사람이 케이스, AI가 보일러플레이트 |
| **Class/MonoBehaviour 구현** | `Assets/Scripts/Runtime/` | AI |

### 3.1 Unity 특유의 "암묵 계약" 주의

Unity는 **코드 밖에 계약이 숨어있는 경우가 많다.** 이걸 문서로 올려둬야 AI가 안전하게 작업할 수 있다.

- **Script Execution Order**: 어떤 컴포넌트의 `Awake`가 먼저 실행되는지
- **Required Components**: `[RequireComponent(typeof(Rigidbody))]` 같은 제약
- **Prefab 구조**: "이 Prefab 루트에는 반드시 `PlayerController`가 있어야 한다"
- **Tag / Layer / Sorting Layer** 약속
- **Addressable 주소 네이밍 규칙**
- **Input Action Map 이름**

이런 암묵 계약은 Spec이나 Invariant 문서에 **명시적으로** 적어둔다. AI가 Prefab 자체를 직접 보지 못하므로 문서가 유일한 힌트다.

---

## 4. 권장 프로젝트 구조 (Unity 특화)

### 4.1 소규모 (스크립트 30개 이하)

```
Assets/
├── Scripts/
│   ├── Core/                   ← 엔진 무의존 (using UnityEngine 금지)
│   │   ├── Core.asmdef
│   │   ├── Interfaces/
│   │   │   ├── IInventory.cs
│   │   │   └── IDamageCalculator.cs
│   │   ├── Models/
│   │   │   └── InventorySlot.cs
│   │   └── Systems/
│   │       └── DamageCalculator.cs
│   │
│   ├── Runtime/                ← 엔진 의존 (MonoBehaviour 등)
│   │   ├── Runtime.asmdef      ← Core 참조
│   │   ├── Player/
│   │   │   └── PlayerController.cs
│   │   └── UI/
│   │       └── InventoryUI.cs
│   │
│   └── Editor/                 ← 에디터 전용
│       ├── Editor.asmdef       ← Runtime 참조, includePlatforms=Editor
│       └── Tools/
│
└── Tests/
    ├── EditMode/
    │   ├── Tests.EditMode.asmdef  ← Core 참조, nunit.framework 참조
    │   └── DamageCalculatorTests.cs
    └── PlayMode/
        ├── Tests.PlayMode.asmdef  ← Core, Runtime 참조
        └── PlayerSpawnTests.cs
```

**핵심 규칙:**
- `Core.asmdef` 는 `UnityEngine` 을 참조하지 않는다. (asmdef 설정에서 제외 가능)
- `Tests.EditMode` 는 Core만 참조하고 Runtime은 참조하지 않는 것이 이상적. MonoBehaviour 없이 테스트 가능한 로직만 검증.
- `Tests.PlayMode` 는 Runtime까지 참조, Scene/Prefab이 필요한 통합 테스트용.

### 4.2 중~대규모 (스크립트 100개 이상)

도메인별로 Core를 더 쪼갠다.

```
Assets/
├── Scripts/
│   ├── Core.Inventory/         ← Core.Inventory.asmdef
│   ├── Core.Combat/            ← Core.Combat.asmdef
│   ├── Core.Quest/             ← Core.Quest.asmdef
│   ├── Core.Shared/            ← 공통 타입 (Vector3 래퍼 등)
│   ├── Runtime.Inventory/      ← Core.Inventory 참조
│   ├── Runtime.Combat/
│   └── Runtime.Quest/
└── Tests/
    ├── EditMode.Inventory/
    ├── EditMode.Combat/
    └── PlayMode.Integration/
```

### 4.3 문서 구조

```
docs/
├── specs/
│   ├── inventory-system.md
│   ├── damage-calculation.md
│   └── save-load.md
├── invariants/
│   ├── architecture-humble-object.md   ← Unity 핵심 아키텍처 규칙
│   ├── assembly-boundaries.md           ← Core/Runtime 경계
│   ├── monobehaviour-rules.md           ← MonoBehaviour 작성 규칙
│   ├── performance-budget.md            ← 프레임/GC 예산
│   └── network-authority.md             ← 멀티플레이일 경우
└── scene-contracts/
    ├── main-menu.md                     ← 씬별 필수 오브젝트/컴포넌트
    └── gameplay.md
```

### 4.4 어셈블리 분리 판정 기준

| 신호 | 조치 |
|---|---|
| 한 asmdef에 스크립트 50개 이상 | 도메인별로 분리 |
| Edit Mode 테스트 실행에 Unity 전체가 로드됨 | Core 분리 실패, asmdef 재검토 |
| 순환 참조 발생 | 인터페이스를 `Core.Shared` 로 끌어올림 |
| 빌드 시간이 증분 빌드에도 오래 걸림 | 에셈블리 쪼개서 변경 범위 축소 |

---

## 5. Humble Object 패턴: Unity 가이드의 심장

> MonoBehaviour 를 **얇은 껍데기**로 만들고, 실제 로직은 엔진 무의존 POCO로 뺀다.
> POCO 는 유닛 테스트가 쉬우므로, 로직의 대부분이 자동 검증 대상이 된다.

### 5.1 Before (엔진 의존이 로직과 섞임, 테스트 불가)

```csharp
// Assets/Scripts/PlayerCombat.cs (안 좋은 예)
public class PlayerCombat : MonoBehaviour
{
    [SerializeField] private int baseDamage = 10;
    [SerializeField] private float criticalChance = 0.1f;

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            var enemy = FindObjectOfType<Enemy>();
            var finalDamage = baseDamage;
            if (Random.value < criticalChance)
                finalDamage *= 2;
            enemy.GetComponent<Health>().TakeDamage(finalDamage);
        }
    }
}
```

문제점:
- 로직 (데미지 계산) 과 엔진 (Input, FindObjectOfType, Random) 이 한 덩어리
- `Random.value` 때문에 테스트가 비결정적
- 테스트를 쓰려면 Unity 씬을 띄워야 함

### 5.2 After (로직 분리, Edit Mode 테스트 가능)

```csharp
// Assets/Scripts/Core/Combat/DamageCalculator.cs  (엔진 무의존)
namespace Game.Core.Combat
{
    public interface IDamageCalculator
    {
        int Calculate(DamageInput input);
    }

    public readonly struct DamageInput
    {
        public int BaseDamage { get; init; }
        public float CriticalChance { get; init; }
        public float CriticalRoll { get; init; }  // 0~1, 외부에서 주입
    }

    public sealed class DamageCalculator : IDamageCalculator
    {
        public int Calculate(DamageInput input)
        {
            return input.CriticalRoll < input.CriticalChance
                ? input.BaseDamage * 2
                : input.BaseDamage;
        }
    }
}
```

```csharp
// Assets/Scripts/Runtime/Player/PlayerCombat.cs  (얇은 MonoBehaviour)
using UnityEngine;
using Game.Core.Combat;

namespace Game.Runtime.Player
{
    public class PlayerCombat : MonoBehaviour
    {
        [SerializeField] private int baseDamage = 10;
        [SerializeField, Range(0f, 1f)] private float criticalChance = 0.1f;
        [SerializeField] private Health target;

        private IDamageCalculator _calculator;

        private void Awake() => _calculator = new DamageCalculator();

        public void PerformAttack()
        {
            var damage = _calculator.Calculate(new DamageInput
            {
                BaseDamage = baseDamage,
                CriticalChance = criticalChance,
                CriticalRoll = Random.value,
            });
            target.TakeDamage(damage);
        }
    }
}
```

```csharp
// Assets/Tests/EditMode/DamageCalculatorTests.cs
using NUnit.Framework;
using Game.Core.Combat;

public class DamageCalculatorTests
{
    [Test]
    public void CriticalRoll_BelowChance_DoublesDamage()
    {
        var calc = new DamageCalculator();
        var result = calc.Calculate(new DamageInput
        {
            BaseDamage = 10,
            CriticalChance = 0.5f,
            CriticalRoll = 0.3f,  // below 0.5 → crit
        });
        Assert.AreEqual(20, result);
    }

    [Test]
    public void CriticalRoll_AtOrAboveChance_NormalDamage()
    {
        var calc = new DamageCalculator();
        var result = calc.Calculate(new DamageInput
        {
            BaseDamage = 10,
            CriticalChance = 0.5f,
            CriticalRoll = 0.5f,
        });
        Assert.AreEqual(10, result);
    }
}
```

### 5.3 Humble Object 체크리스트

MonoBehaviour를 작성하거나 리뷰할 때:

- [ ] 이 MonoBehaviour가 제거되어도, 로직은 Core에 남아 있는가?
- [ ] `if`/`for` 안의 "의사결정"이 Core의 순수 함수로 빠져 있는가?
- [ ] `Random`, `Time.deltaTime`, `Input` 을 직접 참조하는 곳이 로직 경계 안에 있는가? (밖으로 빼야 함)
- [ ] 외부 의존 (다른 MonoBehaviour) 이 `SerializeField` 로 명시되어 있는가? (`FindObjectOfType`, 싱글톤 금지)
- [ ] Core에는 `using UnityEngine;` 이 **없는가**?

### 5.4 Runtime → Logic 추출 신호 (구체적 숫자 기준)

"언제 Runtime 코드를 Logic 으로 빼야 하나?" 에 대해 감이 아닌 수치로 판단한다.

| 신호 | 수치 기준 | 예시 |
|---|---|---|
| Presenter/Controller 에 조건 분기 | 3개 이상 | `if (isEquipped && hasMana && level > 5) ...` |
| 수치 계산이 Presenter 에 직접 있음 | 1개라도 | `float damage = atk * 1.5f - def * 0.3f;` |
| 동일 로직이 MonoBehaviour 반복 | 2곳 이상 | 각 Controller 마다 쿨다운 계산 |
| `Update()` 줄 수 | 50줄 이상 | 상태 관리 + 입력 + 로직이 뒤섞임 |
| 한 MonoBehaviour 의 책임 | 2개 이상 | "입력 받기 + 데미지 계산 + UI 갱신" |

이 기준 중 **하나라도** 걸리면 Logic 으로 추출할 시점이다. 2개 이상 걸리면 지금 당장 하는 게 맞다.

추출 프롬프트 예시:

```text
<Presenter 이름>.cs 에서 "<구체적 로직 이름>" 을
Logic 레이어의 순수 C# 클래스로 추출해줘.

규칙:
- MonoBehaviour 의존 없음 (UnityEngine 참조 금지)
- 추출 후 NUnit 테스트도 함께 작성 (경계값 3개 이상)
- Presenter 는 결과값을 받아서 View 에 전달하는 역할만 남김
- 기존 동작 그대로 유지 (동작 변경 금지, 구조만 바꿈)
```

---

## 6. 시간·입력·난수 추상화 (테스트 결정성의 핵심)

Unity 로직은 대부분 "시간이 흐르고, 입력이 들어오고, 무작위가 섞인다"의 조합이다. 이 세 축을 추상화해두면 Edit Mode에서 대부분의 로직을 결정적으로 검증할 수 있다.

### 6.1 Time 추상화

```csharp
// Core/Shared/ITimeProvider.cs
namespace Game.Core.Shared
{
    public interface ITimeProvider
    {
        float Time { get; }
        float DeltaTime { get; }
    }
}

// Runtime/Shared/UnityTimeProvider.cs
using UnityEngine;
using Game.Core.Shared;

public sealed class UnityTimeProvider : ITimeProvider
{
    public float Time => UnityEngine.Time.time;
    public float DeltaTime => UnityEngine.Time.deltaTime;
}

// Tests/EditMode/FakeTimeProvider.cs
public sealed class FakeTimeProvider : ITimeProvider
{
    public float Time { get; set; }
    public float DeltaTime { get; set; }
    public void Advance(float seconds) { Time += seconds; DeltaTime = seconds; }
}
```

### 6.2 Random 추상화

```csharp
public interface IRandomProvider
{
    float Value { get; }       // 0~1
    int Range(int min, int max);
}

// 테스트용 결정적 구현
public sealed class FakeRandom : IRandomProvider
{
    private readonly Queue<float> _values;
    public FakeRandom(params float[] values) => _values = new Queue<float>(values);
    public float Value => _values.Dequeue();
    public int Range(int min, int max) => min + (int)(Value * (max - min));
}
```

### 6.3 Input 추상화 (Input System 사용 시)

```csharp
public interface IInputProvider
{
    Vector2 Movement { get; }
    bool JumpPressed { get; }
    bool AttackPressed { get; }
}
```

Input System의 `InputAction` 은 런타임 구현체 안쪽으로만 숨기고, 로직은 `IInputProvider` 만 본다.

### 6.4 쿨다운 예시 (세 추상화 조합)

```csharp
// Core/Combat/Cooldown.cs
public sealed class Cooldown
{
    private readonly ITimeProvider _time;
    private readonly float _duration;
    private float _readyAt;

    public Cooldown(ITimeProvider time, float duration)
    {
        _time = time;
        _duration = duration;
        _readyAt = float.NegativeInfinity;
    }

    public bool IsReady => _time.Time >= _readyAt;

    public bool TryUse()
    {
        if (!IsReady) return false;
        _readyAt = _time.Time + _duration;
        return true;
    }
}
```

```csharp
// Tests/EditMode/CooldownTests.cs
[Test]
public void TryUse_Twice_WithinCooldown_FailsSecondTime()
{
    var time = new FakeTimeProvider { Time = 0 };
    var cd = new Cooldown(time, duration: 2f);

    Assert.IsTrue(cd.TryUse());
    Assert.IsFalse(cd.TryUse());

    time.Advance(1.9f);
    Assert.IsFalse(cd.TryUse());

    time.Advance(0.2f);
    Assert.IsTrue(cd.TryUse());
}
```

이 테스트는 씬을 띄우지 않고 0.01초 안에 통과한다. Play Mode에서 실제로 2초를 기다리는 것보다 수백 배 빠르다.

---

## 6.5 Runtime Layer: 다른 전략이 필요한 구역

Logic 레이어는 Spec-first가 자연스럽게 작동한다. Runtime 레이어는 다르다.

### 6.5.1 Runtime 레이어의 Spec은 "수동 체크리스트"만 있어도 된다

UI 뷰, 애니메이션, 입력 처리 같은 영역은 자동 검증 불가능한 경우가 많다. 그래도 Spec은 쓴다. 단, Acceptance Criteria 가 "예/아니오"가 아니라 **플레이테스트 체크리스트**다.

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

자동 검증이 없는 Spec도 유효하다. **"수동 검증 체크리스트"만으로도 AI가 과구현하는 것을 막고, 완료 기준을 명확히 한다.**

### 6.5.2 게임플레이 이터레이션 루프 (느낌 구동 개발)

물리, 전투 느낌, 카메라, 이동감 같은 영역은 **Spec 자체를 쓰기 어렵다**. 요구사항이 플레이해봐야 정해지기 때문이다. 이 구역은 다른 루프를 쓴다.

```
[게임플레이 이터레이션 루프]

1. AI에게 기본 구현 요청
   → "플레이어 이동 컨트롤러 만들어줘. WASD + 점프, 리지드바디 기반.
      모든 수치는 SerializeField 로 노출."

2. 플레이해보고 느낌 기록 (한글 OK, 모호해도 OK)
   → "점프가 너무 가볍다. 중력감이 없다."
   → "벽에 닿으면 슬라이딩하는 느낌이 이상하다."

3. 구체적인 수치/동작으로 번역
   → "점프 후 하강 가속도를 2배로. fallMultiplier = 2.5f"
   → "벽 충돌 마찰계수를 0.8에서 0.95로"

4. 에디터에서 수치 조정 또는 AI에게 추가 파라미터 노출 요청

5. 만족할 때까지 반복

6. 결정된 수치를 문서로 고정 (다음 항목)
```

이 루프에서 Spec은 **이터레이션이 끝난 뒤** 결과를 기록하는 용도로 쓴다. 이터레이션 중에 Spec을 강제하면 오히려 느려진다.

### 6.5.3 "결정된 수치 기록" 템플릿 (회귀 방지)

플레이테스트로 한 번 합의된 수치는 다시 건드리기 싫다. 그런데 AI가 나중에 리팩토링하면서 "이 값은 이상해 보여서 5로 바꿨어" 같은 짓을 하기 쉽다. 이걸 막으려면 **수치의 이유**까지 기록해둔다.

```md
# PlayerController – 결정된 수치 기록

## 결정된 파라미터 (2026-04-18 플레이테스트 기준)

| 파라미터 | 값 | 이유 |
|---|---|---|
| moveSpeed | 5.0f | 3.0 → 느림, 7.0 → 조작감 무거움 |
| jumpForce | 8.0f | 10 초과 시 일반 천장 높이(4m)에 닿음 |
| fallMultiplier | 2.5f | 2.5 미만 → 점프가 플로팅 느낌 |
| lowJumpMultiplier | 2.0f | 짧게 누르면 낮게 점프, 1.5 미만은 차이 체감 안 됨 |
| groundCheckRadius | 0.2f | 0.1은 계단에서 점프 실패, 0.3은 공중에서 점프 가능 |

## 변경 금지 이유
- 이 수치들은 50회 이상 플레이테스트를 거쳐 합의된 값이다.
- 변경하려면 새로운 플레이테스트 라운드가 필요하다.
- AI가 "이 값은 이상해 보여" 라고 임의로 조정하는 것 금지.
```

이 문서를 Spec 옆에 두고, AI 리뷰 프롬프트에 "결정된 수치 기록과 다른 값으로 바꾸지 마" 를 포함한다.

---

## 7. Contract-first + Verification Loop (Unity 버전)

범용 가이드의 Step을 Unity 맥락으로 재정의한다. **Logic 레이어 한정**이다. Runtime 레이어는 6.5절의 루프를 쓴다.

### Step 0. 기능/티켓을 하나 고른다

예시:

> 플레이어가 적에게 근접 공격을 가하면 데미지를 입히고, 치명타는 2배 데미지를 낸다. 공격에는 1.5초 쿨다운이 있다.

### Step 1. SPEC 작성 (사람 100% 이해)

#### Unity 특화 SPEC 템플릿

```md
# <Feature Name> – SPEC

## Goal
- (사용자/플레이어에게 주는 가치 1~2줄)

## Non-goals
- (이 티켓에서 하지 않는 것: VFX, SFX, 네트워크 동기화 등)

## Out of scope
- (절대 건드리지 말 것: 기존 Input 바인딩, SaveSystem 구조 등)

## User Flow
1. ...
2. ...

## Acceptance Criteria
- AC1. ...
- AC2. ...

## Scene / Prefab 요구사항
- Player Prefab 루트에 `PlayerCombat` 컴포넌트 존재
- `PlayerCombat.target` 에 Enemy Prefab의 Health 컴포넌트 할당
- AttackAction은 Input Action "Attack" 에 바인딩

## Required Components / Assemblies
- Core.Combat (DamageCalculator, Cooldown)
- Runtime.Player (PlayerCombat)

## Done 정의
### 자동 검증 (Edit Mode)
- DamageCalculatorTests 전부 통과
- CooldownTests 전부 통과

### 자동 검증 (Play Mode, 선택)
- PlayerCombat 에서 Attack 입력 → Enemy.Health 감소

### 수동 검증 (플레이테스트)
- 공격 모션/반응 속도 체감
- 카메라/UI 피드백 자연스러움

## Risks / Notes
- Random.value 를 DamageCalculator 내부에서 쓰면 테스트 불가 → IRandomProvider 로 주입
- FixedUpdate vs Update 차이 주의 (물리 충돌이면 FixedUpdate)
```

### Step 2. 공개 인터페이스 고정 (사람이 직접 타이핑)

```csharp
// Core/Combat/Interfaces.cs
namespace Game.Core.Combat
{
    public interface IDamageCalculator
    {
        int Calculate(DamageInput input);
    }
}
```

**Unity 특화 주의점:**

- MonoBehaviour 자체는 인터페이스로 추상화하지 않는 경우가 많다 (`SerializeField` 가 걸림). 대신 MonoBehaviour **안에 들고 있는 서비스**를 인터페이스로 뺀다.
- `ScriptableObject` 는 그 자체가 데이터 스키마(계약)다. 필드를 바꾸면 기존 에셋이 깨지므로 변경 시 마이그레이션 계획 필요.

### Step 3. 불변식 (Invariants)

Unity 프로젝트에서 반드시 들어가는 공통 불변식 카테고리다. **Unity 아키텍처 불변식에는 `I-U` 접두어**를 붙여 도메인 불변식(`I1`, `I2` ...) 과 구분한다.

```md
# Unity Architecture – INVARIANTS

## Boundary (어셈블리 경계)
- I-U1. [Boundary] Core.* 어셈블리는 `using UnityEngine;` 을 사용하지 않는다. (asmdef `noEngineReferences: true` 로 강제)
- I-U2. [Boundary] Core.* 는 Core.Shared 외의 Runtime/Editor 어셈블리를 참조하지 않는다.
- I-U3. [Boundary] Editor 전용 코드는 Editor 어셈블리에만 존재한다. `#if UNITY_EDITOR` 로 Runtime에 섞이지 않는다.

## Boundary (MonoBehaviour 책임)
- I-U4. [Boundary] MonoBehaviour 는 의사결정 로직을 직접 담지 않는다. Core의 서비스에 위임한다 (Humble Object).
- I-U5. [Boundary] Presenter/Controller 는 비즈니스 로직을 직접 포함하지 않는다. 조건 분기가 필요하면 Logic 레이어로 위임.
- I-U6. [Boundary] 외부 컴포넌트 참조는 `SerializeField` 로 명시한다. `FindObjectOfType`, `GameObject.Find` 금지.
- I-U7. [Boundary] 싱글톤은 `Core` 에 두지 않는다. DI 컨테이너나 ScriptableObject 기반 서비스로 대체한다.

## Consistency (씬/오브젝트)
- I-U8. [Consistency] `SerializeField` 로 연결된 참조는 `Awake()` 에서 null 체크한다.
- I-U9. [Consistency] 씬 간 유지되는 데이터는 ScriptableObject 또는 별도 Manager 를 통해서만 전달한다.
- I-U10. [Consistency] Scene 로드 중에는 Gameplay 시스템이 Update를 돌리지 않는다.
- I-U11. [Consistency] SaveData의 버전 번호가 맞지 않으면 예외를 던진다 (자동 덮어쓰기 금지).

## Performance (프레임 예산)
- I-U12. [Performance] `Update` / `FixedUpdate` 안에서 매 프레임 `GetComponent` 호출 금지 (Awake에서 캐시).
- I-U13. [Performance] 매 프레임 `new` 로 클래스 인스턴스 생성 금지 (GC 압박). 구조체 또는 풀링 사용.
- I-U14. [Performance] LINQ `ToList`, `ToArray` 는 hot path에서 사용 금지.
- I-U15. [Performance] `Find()`, `FindObjectOfType()` 을 런타임 Update 루프에서 호출하지 않는다.

## Safety (치명적)
- I-U16. [Safety] 네트워크 게임에서, 데미지/보상 계산은 서버 권한에서만 한다.
- I-U17. [Safety] 결제/인앱 관련 콜백은 Ack 받기 전까지 상태를 확정하지 않는다.
```

도메인 불변식은 기능별 파일에 `I1`, `I2` 로 번호를 매기고, Unity 아키텍처 불변식만 `I-U` 로 구분한다. 리뷰 프롬프트에서 "I-U1~I-U17 위반 검토" 라고 하면 아키텍처 전역 검증이 한 줄로 끝난다.

### Step 4. 검증 방법 설계

#### Unity 검증은 3층 구조

```
┌─────────────────────────────────────────┐
│ Layer 1: Edit Mode Tests (NUnit)        │  ← 가장 많이, 가장 빠르게
│   - Core.* 어셈블리의 순수 로직          │
│   - 시간/입력/난수 추상화 주입            │
│   - 초 단위 안에 수백 개 통과            │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Layer 2: Play Mode Tests                │  ← 꼭 필요할 때만
│   - Prefab 조립, Scene, 물리             │
│   - [UnityTest] + IEnumerator + yield    │
│   - 수십 초 걸림, 느리고 깨지기 쉬움      │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Layer 3: 수동 플레이테스트               │  ← 자동화 불가능한 것만
│   - 체감, 밸런스, 비주얼, 사운드          │
│   - 체크리스트로 관리                    │
└─────────────────────────────────────────┘
```

**원칙: Edit Mode로 끝낼 수 있는 건 Play Mode에서 안 쓴다.** Humble Object 패턴이 잘 적용되어 있으면 Play Mode 테스트는 10%도 필요 없다.

#### 수동 검증 체크리스트 예시

```md
# PlayerCombat – Verification Checklist

## 자동 (Edit Mode)
- [x] V1. DamageCalculator: 치명타 경계값 (IDamageCalculator)
- [x] V2. Cooldown: 재사용 방지 (Cooldown)

## 자동 (Play Mode)
- [ ] V3. Attack 입력 → Enemy.Health 감소 (씬 전체)

## 수동 (플레이테스트)
- [ ] V4. 공격 모션 타이밍 자연스러움
- [ ] V5. 쿨다운 UI 피드백 선명함
- [ ] V6. Input Lag 체감 없음 (프레임 드롭 없음)

## Reviewer 세션 (코드 리뷰)
- [ ] I.Boundary. PlayerCombat이 DamageCalculator에 의사결정을 위임하는가
- [ ] I.Performance. Update에서 GetComponent 호출 없는가
```

### Step 5. AI에게 Plan 먼저 뽑게 하기

#### Unity 특화 Plan 프롬프트

```text
아래 SPEC, Interface, Invariants 는 고정이다. 수정하지 마.
Unity 프로젝트에서 이 기능을 구현하기 위한 PLAN.md 만 작성해.

규칙:
- 코드는 수정하지 말 것
- Core 와 Runtime 어셈블리를 분리해서 설계할 것
- `UnityEngine` 의존이 Core에 들어가면 지적할 것
- 어떤 파일을 Core에 두고 어떤 파일을 Runtime에 둘지 명시
- ScriptableObject 가 필요하면 스키마 초안도 제시
- 새로운 Prefab 구조가 필요하면 씬 그래프를 글로 설명
- Edit Mode 와 Play Mode 테스트를 각각 어떤 것으로 커버할지 구분

출력 형식:
# PLAN – <Feature Name>
## Assemblies to touch
## Files to create
## Files to modify
## ScriptableObjects
## Prefab / Scene changes (사람이 에디터에서 해야 하는 작업)
## Steps (30분 이내 단위)
## Edit Mode Tests
## Play Mode Tests (필요한 경우만)
## Manual Verification
## Risks

[SPEC]
...
[INTERFACE]
...
[INVARIANTS]
...
```

### Step 6. 구현 맡기기 (MonoBehaviour 배선 주의)

```text
PLAN.md 의 Step 1~3 까지 구현해.

제약:
- SPEC, Interface, Invariants, ScriptableObject 스키마 수정 금지
- Core 어셈블리에 `using UnityEngine;` 추가 금지
- `FindObjectOfType`, `GameObject.Find`, 싱글톤 사용 금지
- MonoBehaviour 는 얇게 유지, 로직은 Core에 위임
- 각 Step 후 Edit Mode 테스트가 통과해야 다음 Step 진행

내가 에디터에서 직접 해야 하는 작업(Prefab 배선, ScriptableObject 에셋 생성,
Input Action 등록 등)은 코드로 자동화하지 말고 지시사항으로 정리해줘.
```

> **중요**: AI는 Unity 에디터를 직접 조작할 수 없다. Prefab 수정, Inspector 에서 SerializeField 배선, ScriptableObject 에셋 생성, Input Action 편집, Scene 구성 같은 작업은 반드시 사람이 에디터에서 해야 한다. AI가 "자동으로 해두겠다"고 말하면 거짓말이다. 명시적으로 `// TODO: Inspector 에서 직접 할당` 주석을 달거나 지시서로 받는다.

### Step 7. Reviewer 세션

#### Unity 특화 Reviewer 프롬프트

```text
아래 변경을 검토해. 수정은 하지 마.

Unity 아키텍처 불변식 검토:
- I-U1: Core 어셈블리에 UnityEngine 의존이 섞이지 않았는가
- I-U4/I-U5: MonoBehaviour/Presenter 가 의사결정을 Core 에 위임했는가 (Humble Object)
- I-U6: FindObjectOfType / GameObject.Find 사용 없는가
- I-U7: 싱글톤 사용 없는가
- I-U12: Update/FixedUpdate 에서 매 프레임 GetComponent 없는가
- I-U13: Update 에서 new 할당 없는가
- I-U15: 런타임 루프에서 Find() 호출 없는가

추가 검토:
- Random, Time, Input 이 추상화를 거치지 않고 직접 호출되지 않았는가
- 새 로직이 Edit Mode 테스트로 커버되는가
- "결정된 수치 기록" 문서의 값을 임의로 변경하지 않았는가

변경 파일:
(코드 붙여넣기)
```

---

## 8. Unity 특유의 검증 인프라

### 8.1 Edit Mode 테스트 (Unity Test Framework + NUnit)

`Tests.EditMode.asmdef` 예시 (JSON):

```json
{
    "name": "Game.Tests.EditMode",
    "rootNamespace": "",
    "references": [
        "Game.Core.Combat",
        "Game.Core.Shared",
        "UnityEngine.TestRunner",
        "UnityEditor.TestRunner"
    ],
    "includePlatforms": ["Editor"],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": true,
    "precompiledReferences": [
        "nunit.framework.dll"
    ],
    "autoReferenced": false,
    "defineConstraints": [],
    "versionDefines": [],
    "noEngineReferences": true
}
```

> `noEngineReferences: true` 가 **핵심**이다. 이걸 켜면 테스트 어셈블리도 UnityEngine 을 참조하지 않고, Core의 엔진 의존성을 강제할 수 있다.

### 8.2 Play Mode 테스트

```csharp
using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

public class PlayerSpawnTests
{
    [UnityTest]
    public IEnumerator Player_Spawns_WithHealth100()
    {
        var prefab = Resources.Load<GameObject>("Player");
        var instance = Object.Instantiate(prefab);
        yield return null;  // 한 프레임 대기

        var health = instance.GetComponent<Health>();
        Assert.AreEqual(100, health.Current);

        Object.Destroy(instance);
    }
}
```

**Play Mode 테스트의 함정:**
- 씬 로드 간 상태 누수 → `[SetUp]` 에서 `SceneManager.LoadScene` 매번 호출
- `DontDestroyOnLoad` 오브젝트 → 테스트 간 청소 필요
- 코루틴/비동기 테스트는 `yield return new WaitForSeconds(x)` 로 실제 x초 기다림 (느림). 가능하면 Edit Mode로 옮길 것.

### 8.3 CLI에서 Unity 테스트 실행 (verify 스크립트)

```bash
#!/bin/bash
# verify.sh (Unity)
set -e

UNITY="/Applications/Unity/Hub/Editor/2022.3.20f1/Unity.app/Contents/MacOS/Unity"
PROJECT_PATH="$(pwd)"

echo "=== Edit Mode Tests ==="
"$UNITY" -batchmode -nographics -projectPath "$PROJECT_PATH" \
    -runTests -testPlatform EditMode \
    -testResults EditMode-results.xml \
    -logFile edit-log.txt \
    -quit || { cat edit-log.txt; exit 1; }

echo "=== Play Mode Tests (optional) ==="
"$UNITY" -batchmode -projectPath "$PROJECT_PATH" \
    -runTests -testPlatform PlayMode \
    -testResults PlayMode-results.xml \
    -logFile play-log.txt \
    -quit || { cat play-log.txt; exit 1; }

echo "=== All checks passed ==="
```

> Play Mode는 `-nographics` 를 쓰면 안 되는 경우가 있다 (렌더링 의존 코드). Edit Mode는 `-nographics` 로 CI에서 가볍게 돌린다.

### 8.4 GitHub Actions 예시

```yaml
# .github/workflows/test.yml
name: Unity Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true
      - uses: actions/cache@v4
        with:
          path: Library
          key: Library-${{ hashFiles('Assets/**', 'Packages/**', 'ProjectSettings/**') }}
      - uses: game-ci/unity-test-runner@v4
        env:
          UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
        with:
          testMode: EditMode
```

Edit Mode 만 CI 에서 돌려도 Humble Object 가 잘 되어 있으면 로직의 대부분을 커버한다.

---

## 9. ScriptableObject 활용 전략

### 9.1 ScriptableObject 가 계약 역할을 할 때

```csharp
// Core/Combat/CombatConfig.cs  (Core에 둘 때는 CreateAssetMenu 쓸 수 없음)
// Runtime/Combat/CombatConfig.cs  (현실적으로 Runtime에 두는 경우가 많음)
[CreateAssetMenu(menuName = "Combat/Config")]
public sealed class CombatConfig : ScriptableObject
{
    [Min(0)] public int BaseDamage = 10;
    [Range(0f, 1f)] public float CriticalChance = 0.1f;
    [Min(0f)] public float CooldownSeconds = 1.5f;
}
```

**트레이드오프:**
- ScriptableObject 는 `UnityEngine` 의존이라 Core에 넣기 어려움
- 해결: Core에는 POCO 로 `CombatParameters` 를 정의하고, Runtime 의 ScriptableObject 가 그걸로 변환해서 넘긴다

```csharp
// Core/Combat/CombatParameters.cs
public readonly struct CombatParameters
{
    public int BaseDamage { get; init; }
    public float CriticalChance { get; init; }
    public float CooldownSeconds { get; init; }
}

// Runtime/Combat/CombatConfig.cs
public sealed class CombatConfig : ScriptableObject
{
    [Min(0)] public int BaseDamage = 10;
    [Range(0f, 1f)] public float CriticalChance = 0.1f;
    [Min(0f)] public float CooldownSeconds = 1.5f;

    public CombatParameters ToParameters() => new()
    {
        BaseDamage = BaseDamage,
        CriticalChance = CriticalChance,
        CooldownSeconds = CooldownSeconds,
    };
}
```

이렇게 하면 Core의 로직 테스트는 `CombatParameters` 만 넣어서 돌아가고, 에셋 편집은 Runtime 쪽 ScriptableObject 로 한다.

### 9.2 ScriptableObject 계약 변경 시 주의

- 필드 이름 변경 → 기존 에셋의 값이 리셋됨. `[FormerlySerializedAs("oldName")]` 로 마이그레이션.
- 필드 타입 변경 → 수동 마이그레이션 필수. 커스텀 에디터 스크립트 또는 `ISerializationCallbackReceiver`.
- 삭제 → 에셋의 값이 사라짐. 삭제 전 다른 곳으로 옮겨야 할 데이터가 있는지 확인.

계약 변경 커밋 메시지에 마이그레이션 계획을 명시한다.

---

## 10. 의존성 주입 (DI) 전략

Unity에서 DI를 하는 방법은 크게 세 가지다. 규모에 맞게 선택한다.

### 10.1 수동 DI (소규모, 추천 시작점)

```csharp
public class PlayerCombat : MonoBehaviour
{
    [SerializeField] private CombatConfig config;
    [SerializeField] private Health target;

    private IDamageCalculator _calculator;
    private Cooldown _cooldown;
    private ITimeProvider _time;
    private IRandomProvider _random;

    private void Awake()
    {
        _time = new UnityTimeProvider();
        _random = new UnityRandomProvider();
        _calculator = new DamageCalculator();
        _cooldown = new Cooldown(_time, config.CooldownSeconds);
    }
}
```

장점: 단순, 빌드 의존성 없음.
단점: 규모 커지면 `Awake` 가 복잡해짐.

### 10.2 ScriptableObject 기반 서비스 로케이터

`ServiceRegistrySO` ScriptableObject 하나에 주요 서비스 인스턴스를 담아두고, MonoBehaviour 가 참조하는 방식. [Ryan Hipple 2017 Unite talk](https://www.youtube.com/watch?v=raQ3iHhE_Kk) 에서 소개된 패턴.

### 10.3 DI 컨테이너 (VContainer / Zenject)

VContainer 추천 (Zenject 보다 가볍고 AOT 친화적).

```csharp
public class GameLifetimeScope : LifetimeScope
{
    protected override void Configure(IContainerBuilder builder)
    {
        builder.Register<ITimeProvider, UnityTimeProvider>(Lifetime.Singleton);
        builder.Register<IRandomProvider, UnityRandomProvider>(Lifetime.Singleton);
        builder.Register<IDamageCalculator, DamageCalculator>(Lifetime.Singleton);
        builder.RegisterComponentInHierarchy<PlayerCombat>();
    }
}
```

**언제 DI 컨테이너를 도입하나:**
- 서비스 개수 10개 넘어감
- 테스트에서 서비스 교체 자주 필요
- 씬/스테이지별 서비스 범위 분리 필요

그 전까지는 수동 DI 로 충분하다. **초기에 DI 컨테이너를 먼저 깔지 말 것.**

---

## 11. 네트워크 (멀티플레이어 게임)

### 11.1 네트워크 권한 불변식

멀티플레이에서는 "누가 판단하는가" 가 생사를 가른다. 불변식 문서에 반드시 정의.

```md
# Network Authority – INVARIANTS

## Safety
- [Safety] 데미지 판정은 서버에서만 한다. 클라이언트는 입력과 시뮬레이션 힌트만 보낸다.
- [Safety] 재화/경험치 획득은 서버에서만 확정한다.
- [Safety] 클라이언트가 보낸 좌표/속도는 서버에서 검증 없이 신뢰하지 않는다.

## Consistency
- [Consistency] NetworkVariable / Rpc 페이로드는 스키마가 서버/클라에서 동일해야 한다.
- [Consistency] 서버 상태와 클라이언트 예측 상태가 맞지 않을 때, 서버를 진실로 간주한다.

## Boundary
- [Boundary] UI 는 서버 로직에서 직접 조작하지 않는다. 서버는 이벤트를 쏘고, 클라이언트가 렌더링.
```

### 11.2 테스트 전략

- **Core 로직 (데미지 계산, 경제 규칙 등) 은 Edit Mode 로 100% 커버**
- **RPC/NetworkVariable 직렬화** 는 ServerRpc/ClientRpc 모킹 어려움 → 간단한 통합 테스트 + 수동 검증
- **지연/패킷 로스** 는 자동화보다 실제 Playtest 로 검증

### 11.3 Netcode for GameObjects (NGO) 가이드

- NetworkBehaviour 도 Humble Object 패턴 적용: NetworkBehaviour 는 Rpc 배선만, 로직은 Core
- `ServerRpc` 안에서 Core의 `IDamageCalculator.Calculate` 호출하고 `ClientRpc` 로 결과 전파

---

## 12. Unity 특유의 함정 체크리스트

AI한테 넘기기 전에 또는 리뷰할 때 확인할 패턴들.

### 12.1 GC 할당 함정

- `foreach` on `List<T>` → GC 없음 (Unity 5.5+). 하지만 `IEnumerable<T>` 박싱은 alloc.
- `string.Format`, `$"..."` 보간 → 매번 alloc. 핫패스에서는 `StringBuilder` + reuse.
- `Camera.main` → 내부에서 `FindGameObjectWithTag` 호출. Awake에서 캐시.
- `GetComponent<T>` → 느리고 allocation 있음 (2022 이전). Awake에서 캐시.
- LINQ → 거의 항상 alloc. Hot path 금지.
- `gameObject.CompareTag("x")` vs `gameObject.tag == "x"` → CompareTag 가 빠르고 alloc 없음.

### 12.2 Lifecycle 함정

- `OnEnable` vs `Awake`: 씬 로드 시 `Awake` → `OnEnable` 순. 비활성 오브젝트는 `Awake` 도 안 불림.
- `OnDestroy` 에서 `FindObjectOfType` 금지: 앱 종료 시 다른 오브젝트가 이미 파괴되어 있을 수 있음.
- 정적 필드: 도메인 리로드 비활성화(Enter Play Mode Options) 시 값이 남아 있음. 명시적 초기화 필수.

### 12.3 코루틴 / async

- 코루틴은 MonoBehaviour 가 비활성/파괴되면 중단됨. 취소 로직 필요.
- `async Task` 는 Unity 씬 전환에 자동 취소되지 않음. 반드시 `CancellationToken` 전달.
- `UniTask` 추천: 할당 없음, Unity 생명주기 통합.

### 12.4 Prefab 참조 함정

- Prefab 내부 참조 vs Scene 참조: Prefab 인스턴스는 Scene 오브젝트를 참조할 수 없음.
- nested Prefab 수정 시 variant/override 주의.

---

## 13. 계약 변경 프로세스 (Unity 특화)

범용 가이드의 원칙은 동일하지만, Unity 에서는 **에셋까지 함께 변경되는 경우**가 많아 추가 단계가 필요하다.

### 변경 대상이 에셋(Prefab, ScriptableObject, Scene)일 때

1. **변경 전 에셋 버전을 git 태그로 남김** (롤백 가능하게)
2. 스크립트 필드 변경은 `[FormerlySerializedAs]` 우선
3. 데이터 마이그레이션은 **에디터 스크립트로 자동화** (`[MenuItem]`)
4. 모든 에셋이 새 스키마에 맞게 업데이트되었는지 검증하는 Editor 테스트 추가

### 계약 변경 커밋 예시

```
refactor(contract): CombatConfig.CriticalChance 를 곡선(AnimationCurve)으로 확장

이유: 레벨별 치명타 확률을 세밀하게 조정할 필요 발견
변경 전: float CriticalChance (0~1)
변경 후: AnimationCurve CriticalChanceByLevel

SPEC 업데이트:
- AC3 수정: "레벨 N 에서의 치명타 확률은 Curve.Evaluate(N)"

데이터 마이그레이션:
- Tools/Migrate/V2_CombatConfig.cs: 기존 float 값을 상수 Curve 로 변환
- 모든 CombatConfig.asset 에 대해 MenuItem 실행 완료

테스트 업데이트:
- DamageCalculatorTests 에 Curve 경계값 테스트 추가
```

---

## 14. 요약: Unity 가이드의 핵심 흐름

1. **Core 와 Runtime 을 asmdef 로 분리**한다. Core는 `UnityEngine` 을 모른다.
2. **Humble Object 패턴**: MonoBehaviour 는 얇게, 의사결정은 Core POCO 로.
3. **시간/입력/난수를 추상화**한다. Edit Mode 에서 결정적으로 테스트 가능해짐.
4. 기능 하나당 **SPEC(행동) → Interface(C#) → ScriptableObject 스키마 → 불변식** 순서로 계약을 고정한다.
5. **Edit Mode 테스트를 기본**으로 삼고, Play Mode는 꼭 필요한 통합 검증에만 쓴다.
6. AI에게 **PLAN → 구현** 순서로 위임하되, **Prefab 배선/에셋 생성/Inspector 작업은 반드시 사람이** 한다.
7. Reviewer 세션은 Core 경계 침해, MonoBehaviour 의사결정 포함, `FindObjectOfType`/싱글톤 사용 여부를 중점 검토.
8. 계약 변경 시에는 **에셋 마이그레이션 계획**까지 함께 설계한다.
9. DI 컨테이너는 필요해질 때 도입한다. 초기에는 수동 DI 로 시작.
10. 네트워크 게임은 "서버 권한 불변식" 을 제일 먼저 문서화한다.

---

## 15. 빠른 참조

### 15.1 새 기능 시작 체크리스트 (Unity)

- [ ] SPEC.md 작성 (씬/Prefab 요구사항 포함)
- [ ] Core 어셈블리에 인터페이스 직접 타이핑
- [ ] 불변식 3개 이상 (최소 Boundary, Performance, Consistency)
- [ ] ScriptableObject 가 필요하면 스키마 결정 + POCO 파라미터 구조체
- [ ] 시간/입력/난수 추상화 필요 여부 확인
- [ ] Edit Mode 테스트 케이스 목록 작성
- [ ] Play Mode 테스트가 필요한가? (기본은 No)
- [ ] 수동 체크리스트 작성 (체감/비주얼/사운드)
- [ ] AI 에게 PLAN 요청

### 15.2 구현 중 체크리스트

- [ ] Core 에 `using UnityEngine;` 안 섞임
- [ ] MonoBehaviour 에 `if/for` 로직 없음 (전부 Core 위임)
- [ ] `FindObjectOfType`, `GameObject.Find`, 싱글톤 사용 없음
- [ ] `Update`/`FixedUpdate` 에서 할당 없음
- [ ] Edit Mode 테스트 통과
- [ ] Inspector 배선 지시사항을 코드 주석이나 PR 설명에 기록

### 15.3 자주 쓰는 프롬프트 템플릿 (Unity)

#### Plan 요청

```text
[SPEC], [INTERFACE], [INVARIANTS] 고정. 코드 수정 금지.
Unity 프로젝트용 PLAN.md 작성:
- Core / Runtime / Tests 어셈블리 분리 명시
- Prefab/ScriptableObject 작업은 "사람이 에디터에서" 로 명시
- Edit Mode / Play Mode 테스트 구분
```

#### 구현 요청

```text
PLAN.md Step N 까지만 구현.
Core 에 UnityEngine 사용 금지.
MonoBehaviour 는 Humble Object 로.
FindObjectOfType/싱글톤 금지.
Random/Time/Input 직접 호출 금지 → 추상화 주입.
Edit Mode 테스트 통과까지 확인 후 멈춤.
내가 에디터에서 해야 할 작업을 별도로 나열해줘.
```

#### 리뷰 요청

```text
수정 없이 검토만.
1. Core.* 에 UnityEngine 의존 없는가
2. MonoBehaviour 가 Humble Object 인가
3. FindObjectOfType / 싱글톤 사용 없는가
4. Update/FixedUpdate 에 alloc/GetComponent 없는가
5. Random/Time/Input 추상화 우회 없는가
6. 새 로직이 Edit Mode 테스트로 커버되는가
```

### 15.4 SPEC 템플릿 (Unity 복붙용)

```md
# <Feature Name> – SPEC

## Goal
-

## Non-goals
-

## Out of scope
-

## User Flow
1.
2.

## Acceptance Criteria
- AC1.
- AC2.

## Scene / Prefab 요구사항
- (어떤 Prefab 에 어떤 Component 가 있어야 하는가)
- (SerializeField 배선 필요한 참조)

## Required Assemblies
- Core.
- Runtime.

## ScriptableObjects (필요시)
- <Name>SO: 필드 목록

## Input (Input System 사용 시)
- Action Map: ...
- Action 이름: ...

## Done 정의
### Edit Mode 자동 검증
-

### Play Mode 자동 검증 (필요한 경우만)
-

### 수동 검증 (플레이테스트)
-

## Risks / Notes
-
```

### 15.5 불변식 템플릿 (Unity 복붙용)

```md
# <Domain> – INVARIANTS

## Safety (치명적)
- [Safety] (네트워크 권한, 결제, 저장 등)

## Consistency (상태/데이터)
- [Consistency] (상태 머신, 세션, 중복 방지)

## Boundary (레이어/어셈블리 책임)
- [Boundary] Core.* 에 UnityEngine 의존 없음
- [Boundary] MonoBehaviour 는 의사결정 없음 (Humble Object)
- [Boundary] FindObjectOfType / 싱글톤 사용 금지
- [Boundary] (서버/클라 경계 등)

## Performance (프레임/GC)
- [Performance] Update/FixedUpdate 에서 alloc 없음
- [Performance] GetComponent 는 Awake 에서 캐시
- [Performance] (프레임 예산, Draw Call 한도 등)
```

---

## 부록 A. Unity 에서 테스트 가능한 영역 / 어려운 영역

### 테스트하기 쉬움 (Edit Mode 로 대부분 커버 가능)

- 데미지/스탯 계산
- 인벤토리 로직 (추가/제거/스택/정렬)
- 퀘스트 상태 머신
- 경제 시스템 (가격, 거래 규칙)
- 세이브/로드 직렬화 (JSON 변환)
- 절차적 생성 알고리즘
- 크래프팅/레시피 규칙
- 레벨업 곡선, 경험치 계산
- 입력 매핑 해석 (추상 층)
- 쿨다운, 타이머 (시간 추상화 사용 시)
- UI 상태 머신 (프레젠터 로직)

### 테스트하기 어려움 (Play Mode 또는 수동)

- 물리 시뮬레이션 결과 (Rigidbody, Collider)
- 애니메이션 블렌딩, 타이밍
- 렌더링 / 셰이더 / 포스트프로세싱
- 입력 디바이스 동작 (Gamepad, Touch)
- 오디오 재생 타이밍
- 네트워크 실제 전송/지연
- NavMesh 경로 탐색 결과
- Particle System 효과
- UI 레이아웃 (시각적 확인)

### 테스트하지 말 것

- Unity 엔진 자체의 API (`Mathf.Sqrt`, `Vector3.Distance` 등). Unity 를 신뢰한다.
- ThirdParty 에셋 내부 동작.
- 프레임 드롭 같은 성능 이슈는 테스트가 아니라 프로파일러로.

---

## 부록 B. MonoBehaviour ↔ POCO 리팩토링 레시피

기존 뚱뚱한 MonoBehaviour 를 Humble Object 로 리팩토링할 때의 순서.

### 단계 1. 로직 식별

MonoBehaviour 안에서 다음을 찾는다:
- `if`/`switch`/`for` 가 있는 블록
- 순수 함수로 떼어낼 수 있는 계산
- 상태 머신 전이

### 단계 2. 파라미터 구조체 만들기

```csharp
// Before
private void HandleAttack()
{
    if (_currentAmmo > 0 && _cooldownRemaining <= 0 && _target != null)
    {
        _currentAmmo--;
        _cooldownRemaining = _config.CooldownSeconds;
        var damage = _config.BaseDamage;
        if (Random.value < _config.CriticalChance) damage *= 2;
        _target.TakeDamage(damage);
    }
}
```

→ 입력/출력/의존을 분리.

```csharp
// Core
public readonly struct AttackInput
{
    public int CurrentAmmo { get; init; }
    public float CooldownRemaining { get; init; }
    public int BaseDamage { get; init; }
    public float CriticalChance { get; init; }
    public float CriticalRoll { get; init; }
    public bool HasTarget { get; init; }
}

public readonly struct AttackResult
{
    public bool Fired { get; init; }
    public int DamageDealt { get; init; }
    public int AmmoAfter { get; init; }
    public float CooldownAfter { get; init; }
}

public sealed class AttackResolver
{
    public AttackResult Resolve(AttackInput input, float cooldownDuration)
    {
        if (input.CurrentAmmo <= 0 || input.CooldownRemaining > 0 || !input.HasTarget)
            return new AttackResult { Fired = false, AmmoAfter = input.CurrentAmmo, CooldownAfter = input.CooldownRemaining };

        var damage = input.CriticalRoll < input.CriticalChance
            ? input.BaseDamage * 2
            : input.BaseDamage;

        return new AttackResult
        {
            Fired = true,
            DamageDealt = damage,
            AmmoAfter = input.CurrentAmmo - 1,
            CooldownAfter = cooldownDuration,
        };
    }
}
```

### 단계 3. MonoBehaviour 를 얇게

```csharp
// Runtime
private void HandleAttack()
{
    var result = _resolver.Resolve(new AttackInput
    {
        CurrentAmmo = _currentAmmo,
        CooldownRemaining = _cooldownRemaining,
        BaseDamage = _config.BaseDamage,
        CriticalChance = _config.CriticalChance,
        CriticalRoll = _random.Value,
        HasTarget = _target != null,
    }, _config.CooldownSeconds);

    if (result.Fired)
    {
        _currentAmmo = result.AmmoAfter;
        _cooldownRemaining = result.CooldownAfter;
        _target.TakeDamage(result.DamageDealt);
    }
}
```

### 단계 4. 테스트 작성

`AttackResolver` 는 이제 엔진 의존이 0이다. Edit Mode 테스트로 모든 분기 커버.

### 단계 5. 기존 Play Mode 테스트 삭제

Edit Mode 로 커버되면 느린 Play Mode 테스트는 삭제한다. 통합 테스트 한두 개만 남긴다.

---

## 부록 C. 테스트 온보딩 (Unity 에서 0 부터)

### C.1 테스트 인프라 0 에서 시작

Unity Test Framework 는 Package Manager 에 이미 들어있다 (`com.unity.test-framework`). 별도 설치 불필요.

### C.2 첫 Edit Mode 테스트 만들기

1. `Window > General > Test Runner` 열기
2. `Tests/EditMode` 폴더 생성
3. Test Runner 의 "Create EditMode Test Assembly Folder" 버튼 클릭
4. asmdef 가 자동 생성됨
5. `CreateEditModeTest.cs` 파일 생성:

```csharp
using NUnit.Framework;

public class FirstTests
{
    [Test]
    public void OnePlusOne_IsTwo()
    {
        Assert.AreEqual(2, 1 + 1);
    }
}
```

6. Test Runner 에서 Run All

### C.3 첫 Humble Object 실습

1. 기존 MonoBehaviour 하나 선정 (너무 크지 않은 것)
2. 안의 `if/for` 한 덩어리만 POCO 클래스로 추출
3. Edit Mode 테스트 3개 이상 작성 (성공 케이스 / 실패 케이스 / 경계값)
4. MonoBehaviour 에서 POCO 를 호출하도록 변경
5. Play Mode 로 게임 돌려서 기존 동작 유지되는지 확인

### C.4 첫 추상화 실습 (Time)

쿨다운이나 타이머 로직이 있으면 다음 순서로 진행:

1. `ITimeProvider` 인터페이스 선언
2. `UnityTimeProvider` 구현체
3. `FakeTimeProvider` 테스트 구현체
4. 기존 코드에서 `Time.time` 직접 참조 제거, `_time.Time` 으로 대체
5. `FakeTimeProvider.Advance()` 로 시간 건너뛰는 테스트 작성

이 한 번의 경험이 "시간 의존 로직도 자동 테스트 가능하다" 는 감각을 준다.

### C.5 온보딩 체크리스트

- [ ] Edit Mode asmdef 가 `noEngineReferences: true` 로 설정되었는가 (가능한 경우)
- [ ] 첫 POCO 로직이 엔진 의존 없이 분리되었는가
- [ ] Edit Mode 테스트 3개 이상 통과
- [ ] `FakeTimeProvider` (또는 `FakeRandom`) 로 비결정적 동작 하나를 결정적으로 테스트함
- [ ] CI 또는 verify 스크립트에서 Edit Mode 테스트 자동 실행 (선택)

---

## 부록 D. 플랫폼별 특이사항 (간단)

### D.1 모바일

- GC 할당에 특히 민감. Hot path 검사 더 엄격하게.
- `Application.targetFrameRate` 설정 확인.
- 메모리 예산 불변식 추가 ("씬당 텍스처 메모리 XMB 이하").

### D.2 WebGL

- 스레드/async 제약. `Task.Run` 불가. `UniTask` 에서도 제약 있음.
- IndexedDB 기반 저장. `PlayerPrefs` 는 용량 작음.

### D.3 콘솔 (PS/Xbox/Switch)

- IL2CPP + AOT. 동적 코드 생성(`Activator.CreateInstance<T>()` 등) 주의.
- 플랫폼 SDK 호출은 인터페이스 뒤에 숨긴다.

### D.4 VR/XR

- 프레임률 90Hz 이상 강제. 프레임 예산 불변식 더 엄격.
- 입력이 Gaze/Hand/Controller 등 다양. 추상화 더 중요.

---

## 참고: 이 문서를 효율적으로 쓰는 법

- 이 문서 전체를 한 번 읽고, 팀 프로젝트에 맞는 부분만 발췌해서 `docs/invariants/` 에 옮겨 둔다.
- AI 세션을 시작할 때 "Humble Object 패턴 준수", "Core 에 UnityEngine 금지" 같은 핵심 제약을 한 줄로 요약해 시스템 프롬프트나 CLAUDE.md 에 넣는다.
- 새 팀원/협업자가 합류할 때 이 문서를 첫날 교재로 사용.
- 프로젝트 규모가 커지면 이 가이드에서 파생된 **프로젝트 전용** 계약 규칙을 따로 관리한다.

---

관련 문서:
- [[AI와 TDD+BDD 하기 - Low Tech Dept V4]] – 플랫폼 독립 원본 가이드
- [[AI와 TDD+BDD 하기 - Low Tech Dept V4 (CSharp WPF Python)]] – 일반 C#/데스크탑 버전
- [[Unity-Contract-First-Guide]] – 또 다른 AI 가 쓴 Unity 가이드. 레이어 분리와 게임플레이 이터레이션 루프 관점에서 상보적으로 참고.

## 변경 이력

### V1.1 (2026-04-21)
- **1.1 추가**: "Unity에서 Contract-first 가 마찰을 일으키는 3가지 지점" 섹션 (MonoBehaviour 라이프사이클 / 씬 상태 / 게임플레이 느낌)
- **1.4 추가**: Logic/Runtime 레이어 다이어그램
- **6.5 신설**: Runtime Layer 전용 전략 섹션
  - 6.5.1: Runtime Spec 은 수동 체크리스트만 있어도 유효
  - 6.5.2: 게임플레이 이터레이션 루프 (느낌 구동 개발)
  - 6.5.3: "결정된 수치 기록" 템플릿 (회귀 방지)
- **5.4 추가**: Runtime → Logic 추출 신호 (구체적 숫자 기준 표)
- **섹션 3 개편**: 아키텍처 불변식에 `I-U` 접두어 적용, 번호 체계 통일 (I-U1~I-U17)
- **Reviewer 프롬프트**: I-U 번호 기반 검토 항목으로 재작성
