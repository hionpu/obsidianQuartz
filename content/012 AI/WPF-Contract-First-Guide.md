---
type: reference
created: 2026-05-15
---

# AI와 함께하는 C#/WPF 데스크톱 개발 가이드 (Contract-first + Verification Loop)

> 이 문서는 [AI와 TDD 없는 상태에서 시작하는 Low Tech Dept 개발 가이드]의 C#/WPF 전용 파생 문서다.
> 원본 가이드의 핵심 철학(계약-first, AI는 구현, 사람은 계약 소유)은 동일하지만,
> WPF의 구조적 특성 때문에 **적용 범위와 방식이 다르다.**
>
> 예시 도메인은 **2D CAD 프로그램**(선/원/호 등의 엔티티를 캔버스에 그리고 편집하는 데스크톱 앱)을 가정한다.

---

## 0. WPF에서 이 방법론이 마찰을 일으키는 이유

원본 가이드는 입력/출력이 명확한 순수 로직(백엔드, 서버 코드)에서 가장 자연스럽게 작동한다.
WPF는 구조적으로 다른 세 가지 특성이 있다.

### 0.1 Dispatcher / UI 스레드는 계약 바깥에 있다

```csharp
// 인터페이스를 아무리 잘 정의해도
public interface IDrawingViewModel
{
    ObservableCollection<EntityViewItem> Entities { get; }
    Task LoadDrawingAsync(string filePath);
}

// 이 구현체는 UI 스레드 컨텍스트를 벗어나면 터진다
public class DrawingViewModel : IDrawingViewModel
{
    public ObservableCollection<EntityViewItem> Entities { get; } = new();

    public async Task LoadDrawingAsync(string filePath)
    {
        var entities = await _parser.ParseAsync(filePath); // 백그라운드 스레드 OK
        Entities.Clear();                                  // UI 스레드 아니면 InvalidOperationException
        foreach (var e in entities) Entities.Add(e);
    }
}
```

`LoadDrawingAsync`라는 계약은 존재하지만, **언제/어느 스레드에서 호출해야 안전한지는 WPF Dispatcher가 결정**한다.
이 스레드 친화도(thread affinity)는 인터페이스나 Invariant로 잠그기 어렵다.

### 0.2 XAML / Visual Tree 자체가 상태다

ViewModel을 아무리 순수하게 테스트해도, 실제 화면에서는
- 어떤 DataTemplate이 적용되는지 (Line vs Circle vs Arc 각각의 시각적 표현)
- Binding이 OneWay/TwoWay/OneTime인지
- Canvas / ItemsControl 가상화(Virtualization)가 켜져 있는지
- DataContext가 언제 설정되는지

에 따라 동작이 달라진다. Visual Tree 상태는 Invariant로 완전히 기술하기 어렵다.

### 0.3 UX "느낌"은 Spec-first와 충돌한다

```
// 이 Spec은 검증 가능하다
// AC1. 도면 열기: 1만 개 미만 엔티티 도면 → 1초 이내 렌더링
// AC2. 빈 도면 처리: 엔티티 0개일 때 빈 캔버스 + 안내 메시지

// 하지만 이 Spec은 쓸 수 없다
// AC3. 줌/팬이 "부드러워야" 한다
// AC4. 스냅 표시가 "직관적이어야" 한다
// AC5. 명령 입력이 "AutoCAD스러워야" 한다
```

UI 이터레이션은 **만들어보고 판단하는 루프**다.
요구사항이 디자이너/사용자의 시각적 피드백으로 정해지는 영역에 Spec-first를 강제하면 오히려 느려진다.

---

## 1. 핵심 원칙: 레이어를 나누고, 레이어마다 다른 전략을 쓴다

WPF 개발을 세 개의 레이어로 분리한다.

```
┌──────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (View, XAML, Code-behind, Style)     │
│  → Spec-first X  / 시각/UX 이터레이션 O                  │
│  → AI: XAML 보일러플레이트 생성, 스타일 보조             │
├──────────────────────────────────────────────────────────┤
│  APPLICATION LAYER (ViewModel, Command, Navigation)      │
│  → 얇게 유지. ViewModel = View ↔ Core 어댑터             │
│  → AI: 보일러플레이트 + INotifyPropertyChanged 생성      │
├──────────────────────────────────────────────────────────┤
│  CORE LAYER (순수 C#, WPF/UI 의존 없음)                  │
│  → 원본 가이드 방법론 그대로 적용                        │
│  → AI: Spec/Interface 기반 구현 위임                     │
└──────────────────────────────────────────────────────────┘
```

**이 세 레이어를 물리적으로 분리하는 것이 이 가이드 전체의 전제조건이다.**

ViewModel이 두 번째 레이어로 따로 있는 이유는, MVVM에서 ViewModel이 "View와 Core 사이의 얇은 변환층"이라는
역할을 항상 잊기 쉽기 때문이다. ViewModel은 자체적인 비즈니스 로직(예: 두 점 사이의 거리 계산, 교차점 판정)을
갖지 않는다 — 가지면 Core로 옮긴다.

---

## 2. 솔루션 구조와 프로젝트 분리

레이어 분리는 .csproj 분리로 강제한다.
Core 프로젝트가 `PresentationFramework`, `WindowsBase`, `System.Xaml`을 참조하는 순간 **참조 경로상 명백한 위반**이
드러난다. 실수로 UI 의존성이 섞이는 것을 구조적으로 막는다.

### 소규모 프로젝트 (도메인 모듈 5개 이하)

```
MyCad.sln
├── MyCad.Core/                      ← 순수 C# (UI 참조 없음)
│   ├── MyCad.Core.csproj            ← <UseWPF>false</UseWPF>
│   ├── Drawing/
│   │   ├── IDrawing.cs
│   │   ├── DrawingService.cs
│   │   └── EntityId.cs
│   ├── Entities/
│   │   ├── IEntity.cs
│   │   ├── Line.cs
│   │   ├── Circle.cs
│   │   └── Arc.cs
│   └── Geometry/
│       ├── Point2D.cs
│       ├── IDistanceCalculator.cs
│       └── DistanceCalculator.cs
│
├── MyCad.Wpf/                       ← View + ViewModel + App
│   ├── MyCad.Wpf.csproj             ← <UseWPF>true</UseWPF>, MyCad.Core 참조
│   ├── Views/
│   │   ├── MainWindow.xaml(.cs)
│   │   └── DrawingView.xaml(.cs)
│   ├── ViewModels/
│   │   ├── MainViewModel.cs
│   │   └── DrawingViewModel.cs
│   ├── EntityViewItems/
│   │   ├── LineViewItem.cs
│   │   └── CircleViewItem.cs
│   └── App.xaml(.cs)
│
└── MyCad.Core.Tests/                ← Core만 테스트 (UI 미포함)
    ├── MyCad.Core.Tests.csproj      ← MyCad.Core 참조, xUnit/NUnit
    └── Drawing/
        └── DrawingServiceTests.cs
```

### 중규모 프로젝트 (도메인 모듈 6~20개)

```
MyCad.sln
├── src/
│   ├── MyCad.Core/                  ← 도메인 모델 + 비즈니스 규칙
│   │   ├── Drawing/
│   │   │   ├── Interfaces/
│   │   │   │   └── IDrawing.cs
│   │   │   ├── Models/
│   │   │   │   └── EntityId.cs
│   │   │   └── Services/
│   │   │       └── DrawingService.cs
│   │   ├── Entities/
│   │   ├── Geometry/
│   │   ├── Layers/
│   │   └── Snap/
│   │
│   ├── MyCad.Application/           ← UseCase / 애플리케이션 서비스 (선택적)
│   │   ├── Drawing/
│   │   │   └── DrawLineUseCase.cs
│   │   └── FileIo/
│   │
│   ├── MyCad.Infrastructure/        ← 파일 포맷, 외부 라이브러리 어댑터
│   │   ├── DwgIo/
│   │   └── DxfIo/
│   │
│   └── MyCad.Wpf/                   ← View + ViewModel
│       ├── Views/
│       ├── ViewModels/
│       ├── Behaviors/
│       ├── Converters/
│       └── App.xaml(.cs)
│
├── tests/
│   ├── MyCad.Core.Tests/            ← 단위 테스트 (UI 없음)
│   ├── MyCad.Application.Tests/
│   └── MyCad.Wpf.SmokeTests/        ← 통합 테스트 (최소한으로)
│
└── docs/
    ├── specs/
    │   ├── drawing-service.md
    │   └── snap-system.md
    └── invariants/
        ├── geometry-rules.md
        └── architecture-wpf.md
```

### .csproj 설정 예시

**MyCad.Core.csproj** (UI 참조 절대 금지):
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <UseWPF>false</UseWPF>
    <UseWindowsForms>false</UseWindowsForms>
  </PropertyGroup>
</Project>
```

**MyCad.Wpf.csproj** (Core 참조 O, UI 프레임워크 참조 O):
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0-windows</TargetFramework>
    <OutputType>WinExe</OutputType>
    <UseWPF>true</UseWPF>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\MyCad.Core\MyCad.Core.csproj" />
  </ItemGroup>
</Project>
```

`<UseWPF>false</UseWPF>` — 이 한 줄이 Core 레이어에서 `Window`, `DependencyProperty`, `ICommand`(WPF)를 쓰는 순간
컴파일 에러를 낸다.

> **참고**: `ICommand`는 `System.Windows.Input` 네임스페이스이지만 WPF가 아닌 `WindowsBase`에 들어 있어 Core에서도 참조 가능하다.
> 하지만 가급적 Core는 `ICommand`도 쓰지 않는 것이 깔끔하다 — Command는 ViewModel(Application 레이어)의 책임이다.

### CI에서 경계 강제하기

```xml
<!-- Directory.Build.props 등에 추가 -->
<Target Name="EnforceCoreNoUI" BeforeTargets="Build" Condition="'$(MSBuildProjectName)' == 'MyCad.Core'">
  <Error Condition="'$(UseWPF)' == 'true'" Text="MyCad.Core must not reference WPF." />
  <Error Condition="'$(UseWindowsForms)' == 'true'" Text="MyCad.Core must not reference WinForms." />
</Target>
```

또는 더 간단하게 [NetArchTest](https://github.com/BenMorris/NetArchTest)로 테스트화한다.

```csharp
[Fact]
public void Core_Should_Not_Reference_WPF()
{
    var result = Types.InAssembly(typeof(DrawingService).Assembly)
        .ShouldNot()
        .HaveDependencyOnAny("PresentationFramework", "PresentationCore", "WindowsBase", "System.Xaml")
        .GetResult();

    Assert.True(result.IsSuccessful, string.Join(", ", result.FailingTypeNames ?? Array.Empty<string>()));
}
```

이 한 개의 테스트가 I-W1 불변식을 자동 강제한다.

---

## 3. Core 레이어: 원본 가이드 그대로 적용

Core 레이어는 순수 C#이므로 원본 가이드의 Spec → Interface → Invariant → Test 흐름이 그대로 작동한다.

### 3.1 Spec 작성

```md
# DrawingService – SPEC

## Goal
- 사용자가 CAD 엔티티(선/원/호)를 도면에 추가/삭제/조회할 수 있는 도메인 로직을 제공한다.
- WPF Canvas나 파일 포맷에 의존하지 않는다.

## Non-goals (이번 티켓에서 하지 않음)
- 화면 렌더링 (DrawingView가 담당)
- 파일 저장/불러오기 (별도 DwgRepository 티켓)
- 명령 히스토리 / Undo·Redo (별도 티켓)
- 레이어 가시성/잠금 처리 (별도 LayerManager 티켓)

## Out of scope (절대 건드리지 말 것)
- WPF, Canvas, INotifyPropertyChanged 참조
- DXF/DWG 파서, AutoCAD .NET API 참조
- File / Network I/O

## User Flow (시스템 관점)
1. 엔티티(Line/Circle/Arc 등)를 받아 도면에 추가한다.
2. 도면에 담을 수 있는 maxEntities를 초과하면 거부하고 false를 반환한다.
3. 존재하지 않는 EntityId의 삭제 요청이면 false를 반환한다.

## Edge Cases
- maxEntities를 초과하는 추가 → false
- 동일 EntityId 중복 추가 → ArgumentException
- 길이 0인 Line(시작점 == 끝점) 추가 → ArgumentException
- 반지름 ≤ 0인 Circle 추가 → ArgumentException

## Acceptance Criteria
- AC1. AddEntity(line) 후 GetEntityCount() == 1
- AC2. maxEntities=2인 도면에 3번째 엔티티 추가 → false
- AC3. RemoveEntity(id) 후 GetEntityCount() == 0
- AC4. RemoveEntity(존재하지 않는 id) → false, 예외 없음
- AC5. AddEntity(null) → ArgumentNullException
- AC6. 동일 EntityId 두 번 AddEntity → ArgumentException

## Done 정의
### 자동 검증
- dotnet test (xUnit) 통과
- NetArchTest 경계 테스트 통과

### 수동 검증
- 없음 (Core 레이어는 전부 자동 검증)
```

### 3.2 Interface 정의

```csharp
// MyCad.Core/Drawing/Interfaces/IDrawing.cs

namespace MyCad.Core.Drawing;

public interface IDrawing
{
    bool AddEntity(IEntity entity);
    bool RemoveEntity(EntityId id);
    int GetEntityCount();
    bool ContainsEntity(EntityId id);
    IReadOnlyList<IEntity> GetAllEntities();
}

public sealed record EntityId(Guid Value)
{
    public static EntityId New() => new(Guid.NewGuid());
}

public interface IEntity
{
    EntityId Id { get; }
    EntityType Type { get; }
}

public enum EntityType { Line, Circle, Arc, Polyline }

public sealed record Point2D(double X, double Y);

public sealed record Line(EntityId Id, Point2D Start, Point2D End) : IEntity
{
    public EntityType Type => EntityType.Line;
}

public sealed record Circle(EntityId Id, Point2D Center, double Radius) : IEntity
{
    public EntityType Type => EntityType.Circle;
}
```

### 3.3 Invariant 정의

```md
# Drawing Rules – INVARIANTS

## Consistency
- I1. 어떤 연산 이후에도 도면 안에 동일한 EntityId를 가진 엔티티는 최대 1개만 존재한다.
- I2. GetAllEntities()는 추가된 모든 엔티티를 정확히 한 번씩 포함한다.
- I3. 엔티티 총 개수는 maxEntities를 초과하지 않는다.

## Boundary
- I4. IDrawing 구현체는 PresentationFramework / WindowsBase를 참조하지 않는다. (.csproj로 강제)
- I5. IDrawing 구현체는 INotifyPropertyChanged를 구현하지 않는다.
- I6. IDrawing 구현체는 파일/네트워크 I/O를 직접 수행하지 않는다.

## Safety
- I7. null 엔티티 추가 호출은 ArgumentNullException을 던진다.
- I8. 길이 0인 Line, 반지름 ≤ 0인 Circle은 생성 시점에 ArgumentException으로 막는다.
- I9. IDrawing 구현체는 thread-safe 하지 않다 (단일 스레드 호출자 책임).
```

### 3.4 테스트 작성 (xUnit)

```csharp
// MyCad.Core.Tests/Drawing/DrawingServiceTests.cs

using MyCad.Core.Drawing;

namespace MyCad.Core.Tests.Drawing;

public class DrawingServiceTests
{
    private static Line MakeLine() =>
        new(EntityId.New(), new Point2D(0, 0), new Point2D(10, 10));

    [Fact]
    public void AddEntity_NewEntity_ReturnsTrue()
    {
        var drawing = new DrawingService(maxEntities: 100);
        var line = MakeLine();

        var result = drawing.AddEntity(line);

        Assert.True(result);
        Assert.Equal(1, drawing.GetEntityCount());
        Assert.True(drawing.ContainsEntity(line.Id));
    }

    [Fact]
    public void AddEntity_WhenFull_ReturnsFalse()
    {
        var drawing = new DrawingService(maxEntities: 2);
        drawing.AddEntity(MakeLine());
        drawing.AddEntity(MakeLine());

        var result = drawing.AddEntity(MakeLine());

        Assert.False(result);
        Assert.Equal(2, drawing.GetEntityCount());
    }

    [Fact]
    public void RemoveEntity_NotExisting_ReturnsFalseWithoutException()
    {
        var drawing = new DrawingService(maxEntities: 100);
        var unknownId = EntityId.New();

        var ex = Record.Exception(() =>
        {
            var result = drawing.RemoveEntity(unknownId);
            Assert.False(result);
        });
        Assert.Null(ex);
    }

    [Fact]
    public void AddEntity_Null_ThrowsArgumentNullException()
    {
        var drawing = new DrawingService(maxEntities: 100);

        Assert.Throws<ArgumentNullException>(() => drawing.AddEntity(null!));
    }

    [Fact]
    public void Invariant_I1_DuplicateEntityIdRejected()
    {
        var drawing = new DrawingService(maxEntities: 100);
        var id = EntityId.New();
        var line1 = new Line(id, new Point2D(0, 0), new Point2D(10, 10));
        var line2 = new Line(id, new Point2D(5, 5), new Point2D(20, 20));

        drawing.AddEntity(line1);

        Assert.Throws<ArgumentException>(() => drawing.AddEntity(line2));
        Assert.Equal(1, drawing.GetEntityCount());
    }

    [Fact]
    public void Invariant_I8_ZeroLengthLineRejectedAtConstruction()
    {
        var p = new Point2D(5, 5);
        Assert.Throws<ArgumentException>(() => new Line(EntityId.New(), p, p));
    }
}
```

### 3.5 AI에게 구현 위임

```
[SPEC] drawing-service.md 참고
[INTERFACE] IDrawing.cs (Line, Circle, EntityId 포함)
[INVARIANTS] I1~I9

아래 테스트가 전부 통과하도록 DrawingService.cs를 구현해줘.
테스트 코드는 수정하지 마.
PresentationFramework, INotifyPropertyChanged, 파일/네트워크 I/O 참조 없음.
순수 C# 클래스로만. 파일 위치: MyCad.Core/Drawing/DrawingService.cs
```

---

## 4. ViewModel 레이어: 다른 전략

ViewModel 레이어는 Spec-first가 아니라 **"얇게 유지 + 어댑터 역할만"** 전략을 쓴다.

### 4.1 핵심 원칙: ViewModel은 얇아야 한다

ViewModel의 역할은 단 세 가지다.

1. **사용자 입력(Command/Binding)을 Core로 전달**
2. **Core 결과를 View가 바인딩할 수 있는 형태(Property/ObservableCollection)로 노출**
3. **UI 스레드 컨텍스트 / 비동기 / IsBusy 같은 화면 상태 관리**

```csharp
// MyCad.Wpf/ViewModels/DrawingViewModel.cs
// 이 파일은 최대한 얇게 유지한다.
// 비즈니스 로직(거리 계산, 교차점 판정, 스냅 규칙)은 한 줄도 없어야 정상이다.

public sealed class DrawingViewModel : ObservableObject
{
    private readonly IDrawing _drawing;
    private readonly IDialogService _dialog;
    private bool _isBusy;

    public DrawingViewModel(IDrawing drawing, IDialogService dialog)
    {
        _drawing = drawing;
        _dialog = dialog;

        Entities = new ObservableCollection<EntityViewItem>(
            _drawing.GetAllEntities().Select(EntityViewItem.From));
        AddLineCommand = new RelayCommand<Line>(OnAddLine);
        AddCircleCommand = new RelayCommand<Circle>(OnAddCircle);
        DeleteEntityCommand = new RelayCommand<EntityId>(OnDeleteEntity);
    }

    public ObservableCollection<EntityViewItem> Entities { get; }

    public bool IsBusy
    {
        get => _isBusy;
        set => SetProperty(ref _isBusy, value);
    }

    public IRelayCommand<Line> AddLineCommand { get; }
    public IRelayCommand<Circle> AddCircleCommand { get; }
    public IRelayCommand<EntityId> DeleteEntityCommand { get; }

    private void OnAddLine(Line? line)
    {
        if (line is null) return;

        var success = _drawing.AddEntity(line);
        if (success)
            RefreshEntities();
        else
            _dialog.ShowMessage("도면이 가득 찼습니다 (최대 엔티티 수 초과).");
    }

    private void OnAddCircle(Circle? circle)
    {
        if (circle is null) return;

        var success = _drawing.AddEntity(circle);
        if (success)
            RefreshEntities();
        else
            _dialog.ShowMessage("도면이 가득 찼습니다 (최대 엔티티 수 초과).");
    }

    private void OnDeleteEntity(EntityId? id)
    {
        if (id is null) return;

        _drawing.RemoveEntity(id);
        RefreshEntities();
    }

    private void RefreshEntities()
    {
        Entities.Clear();
        foreach (var e in _drawing.GetAllEntities())
            Entities.Add(EntityViewItem.From(e));
    }
}
```

**이 파일에 `if`/`switch`가 도메인 규칙(예: "두 선이 평행하면…", "원 안에 점이 있으면…")을 표현하기 시작하면
Core로 옮겨야 한다는 신호다.** ViewModel의 분기는 "UI 상태(IsBusy, IsSelected, ToolMode)"에 한정되어야 한다.

### 4.2 ViewModel 테스트는 가능하지만 적당히

ViewModel은 순수 클래스이므로 단위 테스트가 가능하다. 하지만 ViewModel이 얇다면 테스트 가치도 얇다.

**테스트할 가치가 있는 것:**
- Command의 CanExecute 로직 (예: 선택된 엔티티가 있을 때만 DeleteEntityCommand 활성)
- Core 결과를 View가 쓰는 형태로 가공하는 변환 (예: IEntity → LineViewItem/CircleViewItem)
- IsBusy 토글 시점, 비동기 흐름의 예외 처리

**테스트하지 않아도 되는 것:**
- 단순 Property → Property 위임
- Core 메서드를 그대로 호출하는 Command (이미 Core 테스트로 커버됨)

```csharp
[Fact]
public void AddLineCommand_WhenDrawingFull_ShowsDialog()
{
    var drawing = new FakeFullDrawing();
    var dialog = new SpyDialogService();
    var vm = new DrawingViewModel(drawing, dialog);
    var line = new Line(EntityId.New(), new Point2D(0, 0), new Point2D(10, 10));

    vm.AddLineCommand.Execute(line);

    Assert.Equal("도면이 가득 찼습니다 (최대 엔티티 수 초과).", dialog.LastMessage);
}
```

**UI 스레드가 필요한 테스트는 [Avalonia.Headless](https://docs.avaloniaui.net/) 같은 헤드리스 환경 또는 `STAThread` + `Dispatcher.Run`으로
돌릴 수 있지만, 비용이 크다. ViewModel을 충분히 얇게 유지하면 대부분 일반 단위 테스트로 충분하다.**

### 4.3 ViewModel에 Spec을 쓰는 기준

ViewModel에도 Spec이 필요한 경우가 있다 — 특히 비동기 흐름이 복잡하거나(예: 파일 비동기 로딩 + 진행률 표시),
여러 Command가 상호작용하거나(예: Line/Circle 그리기 도구 모드 전환), IsBusy/CanExecute가 도메인 결과와 결합될 때.

```md
# DrawingViewModel – SPEC (얇은 형태)

## Goal
- IDrawing의 결과를 View에 ObservableCollection으로 노출하고,
  Command를 통해 입력(엔티티 추가/삭제)을 Core로 전달한다.

## Non-goals
- 도면 도메인 규칙 (DrawingService가 담당)
- 파일 입출력 (Repository가 담당)
- 도구 팔레트 자체의 시각/배치 (View가 담당)

## Acceptance Criteria
- AC1. AddLineCommand 실행 시 Entities 컬렉션이 갱신된다.
- AC2. 추가 실패 시 IDialogService.ShowMessage가 호출된다.
- AC3. IsBusy=true일 때 모든 Command의 CanExecute는 false다.

## Done 정의
### 자동 검증
- ViewModel 단위 테스트 통과

### 수동 검증 (UI 확인)
- AC1~AC3 동작이 실제 화면에 반영되는지 도구 클릭으로 확인
```

---

## 5. View / XAML 레이어: 또 다른 전략

View(XAML, Code-behind, Style, Behavior)는 **"수동 검증 체크리스트 + UI 이터레이션"** 전략을 쓴다.

### 5.1 View Spec은 검증 체크리스트 형태

```md
# DrawingView – SPEC

## Goal
- 도면 캔버스에 엔티티를 그리고, 마우스/키보드 입력을 받는다.

## Non-goals
- 도면 도메인 로직 (DrawingService)
- ViewModel 상태 관리 (DrawingViewModel)

## Acceptance Criteria (수동 검증 위주)
- AC1. ItemsControl이 Entities에 바인딩되어 모든 엔티티가 캔버스에 그려진다.
- AC2. "선 그리기"/"원 그리기" 도구 버튼이 각 Command에 바인딩되어 있다.
- AC3. IsBusy=true일 때 도구 팔레트가 비활성화된다.

## Done 정의
### 자동 검증
- 없음 (XAML은 수동 검증)

### 수동 검증 (UI 체크리스트)
- [ ] 엔티티 1만 개 도면에서 줌/팬이 60fps로 유지되는가
- [ ] 엔티티 데이터 갱신 시 캔버스에 즉시 반영되는가
- [ ] 화면 리사이즈 시 도면 비율(가로:세로)이 유지되는가
- [ ] 다크 모드/라이트 모드 모두에서 라인/배경 대비가 충분한가
- [ ] 마우스 휠 줌이 커서 위치 기준으로 동작하는가
- [ ] Tab 키로 도구 팔레트 → 캔버스 → 속성 패널 순으로 Focus 이동하는가
- [ ] 디자이너에게 시안 받은 도구 아이콘/색과 일치하는가
```

자동 검증이 없는 Spec도 유효하다.
**"수동 검증 체크리스트"만으로도 AI가 과구현하는 것을 막고, 완료 기준을 명확히 한다.**

### 5.2 UI 이터레이션 구역

도구 팔레트 레이아웃, 그리드 표시, 스냅 마커 시각화, 줌/팬 애니메이션, 색상, 트랜지션 같은 영역은
Spec 자체를 쓰기 어렵다. 이 구역은 다른 루프를 쓴다.

```
[UI 이터레이션 루프]

1. AI에게 기본 구현 요청
   → "DrawingView.xaml 만들어줘. Canvas + ItemsControl + 도구 팔레트(StackPanel)."

2. 실행해보고 느낌 기록
   → "도구 버튼이 너무 작다. 캔버스 배경에 그리드가 없다. 선택된 엔티티 강조가 약하다."

3. 구체적인 수치/속성으로 번역
   → "ToolButton MinWidth/Height=44, 그리드 10px 간격, 선택 시 Stroke 두께 x2"

4. AI에게 수정 요청
   → 시안과 비교, 색상은 ResourceDictionary로 추출

5. 만족할 때까지 반복
```

이 루프에서 Spec은 **이터레이션이 끝난 뒤** 결과를 기록하는 용도로 쓴다.

```md
# DrawingView – 결정된 시각 사양 (2026-04-27 기준)

## 결정된 값
- 도구 버튼 크기: 44x44px (터치 + 정밀 마우스 양립)
- 그리드 간격: 10px (논리 좌표 1단위)
- 선택된 엔티티 강조: 기존 두께 x2 + Stroke=Highlight
- 빈 도면 안내: "Ctrl+N으로 새 도면을 시작하거나 파일을 여세요" 가운데 정렬
- 스냅 마커: 8x8px 정사각형, 끝점=노랑 / 중점=파랑 / 교차점=빨강

## 변경 금지 이유
- 도구 버튼 < 44 → 태블릿/펜 사용 시 미스 클릭 증가
- 선택 강조가 색상 변화만으로는 색약 사용자 식별 불가 → 두께 변화 필수
- 스냅 마커 색상은 AutoCAD 기본값과 일치시켜 학습 비용 최소화
```

---

## 6. WPF 전용 Invariant

WPF 구조 때문에 추가로 필요한 불변식들이다.
`docs/invariants/architecture-wpf.md`에 프로젝트 시작 시 작성해둔다.

```md
# WPF Architecture – INVARIANTS

## Boundary (레이어 분리)
- I-W1. [Boundary] Core 프로젝트(.csproj UseWPF=false)는 PresentationFramework /
         WindowsBase / System.Xaml을 참조하지 않는다. (NetArchTest로 강제)
- I-W2. [Boundary] Core 클래스는 INotifyPropertyChanged / DependencyObject를 상속하지 않는다.
- I-W3. [Boundary] ViewModel은 View(Window, UserControl, Page) 타입을 참조하지 않는다.
         View 갱신이 필요하면 Property/ObservableCollection을 통해 바인딩 시스템에 위임한다.
- I-W4. [Boundary] ViewModel에 비즈니스 분기(거리/각도/교차점 계산, 스냅 규칙 등)를 직접 작성하지 않는다.
         조건이 도메인 규칙이면 Core 메서드로 위임한다.

## Consistency (Threading / Binding)
- I-W5. [Consistency] ObservableCollection은 UI 스레드에서만 변경한다.
         (백그라운드 파일 로딩 등에서 변경해야 하면 BindingOperations.EnableCollectionSynchronization 사용)
- I-W6. [Consistency] DataContext는 View 측에서 한 번만 설정한다 (XAML 또는 생성자).
         Code-behind 곳곳에서 DataContext를 다시 할당하지 않는다.
- I-W7. [Consistency] async void는 이벤트 핸들러에서만 허용한다. ViewModel 메서드는 Task 반환.

## Safety
- I-W8. [Safety] Code-behind는 UI 전용 코드만 포함한다 (Focus, ScrollIntoView, Animation 트리거,
         InkCanvas 입력 변환 등). 도메인/파일/네트워크 호출 금지.
- I-W9. [Safety] Dispatcher.Invoke는 백그라운드 → UI 스레드 전이 시점에만 사용. UI 스레드에서 다시 호출하지 않는다.
- I-W10. [Safety] 이벤트 핸들러 / Messenger 구독은 명시적 Dispose 또는 WeakReference로 누수 방지.
         (도면 1개당 수백~수천 엔티티 ViewItem이 생성되므로 누수 영향이 크다)

## Performance
- I-W11. [Performance] 큰 ItemsControl(엔티티 컬렉션 등)은 VirtualizingStackPanel을 사용한다 (>500 항목).
- I-W12. [Performance] OneWay/OneTime으로 충분한 Binding은 Mode 명시적으로 지정한다.
- I-W13. [Performance] 캔버스 렌더링은 DrawingVisual / WriteableBitmap 우선 검토 (>5만 엔티티).
         ItemsControl만으로 처리하지 않는다.
```

---

## 7. 검증 전략 요약

| 레이어 | 검증 방법 | AI 역할 |
|---|---|---|
| Core (순수 C#) | xUnit 자동 테스트 (dotnet test) | 테스트 통과하는 구현 생성 |
| 경계 (Core ↔ UI) | NetArchTest 자동 테스트 | 위반 발견 시 리팩토링 보조 |
| ViewModel | 얇은 단위 테스트 + 코드 리뷰 (Reviewer 세션) | 보일러플레이트 생성 |
| View (XAML/Style) | 수동 UI 체크리스트 | XAML 보일러플레이트 + Style 작성 |
| 시각/UX (스냅·줌·팬 등) | UI 이터레이션 | 시안 → XAML 번역, ResourceDictionary 정리 |

---

## 8. verify 스크립트

```bash
#!/usr/bin/env bash
# verify.sh
set -e

echo "=== Restore ==="
dotnet restore

echo "=== Build (treat warnings as errors) ==="
dotnet build -warnaserror

echo "=== Core unit tests ==="
dotnet test tests/MyCad.Core.Tests --no-build --verbosity minimal

echo "=== Architecture tests (NetArchTest) ==="
dotnet test tests/MyCad.Architecture.Tests --no-build --verbosity minimal

echo "=== All checks passed ==="
```

Core 레이어와 NetArchTest는 GUI 없이 CI에서 그대로 돌아간다. 대부분의 회귀(거리 계산 오류, 엔티티 추가 거부 로직 등)는
이 단계에서 잡힌다.

---

## 9. 분리 신호: Core 레이어로 옮겨야 할 때

ViewModel 파일에서 아래 신호가 보이면 Core로 추출한다.

| 신호 | 예시 |
|---|---|
| ViewModel에 도메인 분기 3개 이상 | `if (entity.Type == Line && line.Length > 0 && !layer.IsLocked)` |
| 수치 계산이 ViewModel에 직접 있음 | `var distance = Math.Sqrt(dx*dx + dy*dy);` |
| 동일 계산이 두 ViewModel에 반복 | TrimViewModel/ExtendViewModel 양쪽에 교차점 계산 |
| async 메서드가 50줄을 넘어감 | DXF 파싱 + 검증 + 캔버스 갱신이 뒤섞임 |
| 스냅/허용오차 같은 도메인 상수가 ViewModel에 박혀있음 | `const double SnapTolerance = 5.0;`이 ViewModel에 |

추출 프롬프트:
```
DrawingViewModel.cs의 OnTrim() 안에 있는 두 직선의 교차점 계산 / 길이 계산 로직을
MyCad.Core/Geometry/IntersectionCalculator.cs로 추출해줘.

규칙:
- WPF / INotifyPropertyChanged 참조 없음
- 추출 후 xUnit 테스트도 작성해줘 (수직/평행/일점접근 케이스 포함)
- ViewModel은 IntersectionCalculator의 결과를 받아 ObservableCollection / IsBusy를 업데이트하는 역할만 남겨야 해
```

---

## 10. 전체 흐름 요약

```
새 기능 개발 시작
        ↓
이 기능이 어느 레이어에 속하는가?
        ↓
┌─────────────┬─────────────────┬─────────────────┐
│  Core       │   ViewModel     │   View / XAML   │
│             │                 │                 │
│ 1. Spec     │ 1. Spec(얇게)   │ 1. 체크리스트   │
│ 2. Interface│ 2. 얇게 구현    │ 2. XAML 작성    │
│ 3. Invariant│ 3. 단위 테스트  │ 3. 실행/확인    │
│ 4. Test     │    (얇은 부분만)│ 4. 이터레이션   │
│ 5. AI 위임  │ 4. AI 보일러    │ 5. 시안 → XAML  │
│ 6. dotnet   │    플레이트     │    번역         │
│    test     │                 │                 │
└─────────────┴─────────────────┴─────────────────┘
        ↓
ViewModel에 거리/교차점/스냅 같은 도메인 분기가 쌓이면 → Core로 추출
View Code-behind에 도면/파일 호출이 보이면 → ViewModel/Core로 추출
```

---

## 부록 A. AI 프롬프트 템플릿

### Core 구현 요청

```
[SPEC] (drawing-service.md 등)
[INTERFACE] (IDrawing.cs, Line/Circle 등)
[INVARIANTS] (I1~I9, I-W1~I-W13 중 관련된 것)
[TESTS] (DrawingServiceTests.cs)

테스트가 전부 통과하도록 구현해줘.
테스트 수정 금지. PresentationFramework / INotifyPropertyChanged / 파일·네트워크 I/O 참조 없음.
파일 위치: MyCad.Core/{도메인}/{ClassName}.cs
```

### ViewModel 보일러플레이트 요청

```
DrawingViewModel.cs를 만들어줘.

역할:
- IDrawing(Core) + IDialogService를 DI로 받아서 사용
- ObservableCollection<EntityViewItem> Entities 노출
- AddLineCommand, AddCircleCommand, DeleteEntityCommand
  (CommunityToolkit.Mvvm.RelayCommand)
- IsBusy 토글

규칙:
- 비즈니스 로직 직접 작성 금지 (도메인 분기는 IDrawing 메서드로 위임)
- INotifyPropertyChanged는 ObservableObject 상속으로 처리
- View(Window/UserControl) 타입 직접 참조 금지 (I-W3)
- async void는 사용 금지, Task 반환 (I-W7)
- 거리/각도/교차점 계산이 필요하면 Core의 IDistanceCalculator 등을 통해 처리 (I-W4)
```

### XAML 작성 요청

```
DrawingView.xaml을 만들어줘.

DataContext: DrawingViewModel
바인딩 대상:
- Entities → ItemsControl (ItemsPanel = Canvas, 항목 1만 개 가정)
- AddLineCommand → 도구 팔레트 "선" 버튼
- AddCircleCommand → 도구 팔레트 "원" 버튼
- DeleteEntityCommand → "삭제" 버튼
- IsBusy → 도구 팔레트 IsEnabled=false 토글

규칙:
- Code-behind 비워둘 것 (InitializeComponent만)
- Style은 인라인 대신 ResourceDictionary로 빼둘 것
- 모든 Binding은 Mode 명시 (OneWay/TwoWay/OneTime)
- ItemsControl 항목 500개 초과 시 Virtualization 필수 (I-W11)
- 5만 개 초과가 예상되면 DrawingVisual 기반 호스트 컴포넌트 별도 제안 (I-W13)
- DataTemplate은 Line/Circle/Arc 각각 따로 (DataTemplateSelector 사용)
```

### UI 이터레이션 요청

```
DrawingView.xaml의 도구 팔레트와 빈 도면 안내를 다듬어줘.

현재 문제:
- 도구 버튼이 작아서 펜 입력 시 자주 빗나간다.
- 빈 도면 상태일 때 화면이 휑하다.

원하는 결과:
- ToolButton MinWidth/MinHeight = 44px
- 빈 도면일 때 캔버스 가운데에
  "Ctrl+N으로 새 도면을 시작하거나 파일을 여세요" 표시
  (Entities.Count == 0 → DataTrigger로 토글)
- 색상은 기존 ResourceDictionary의 {DynamicResource Brush.Surface} / {Brush.OnSurface} 사용
```

### Reviewer 세션 요청

```
코드 수정 금지. 검토만 해줘.

다음 불변식 위반이 있는지 확인:
- I-W1: MyCad.Core 프로젝트에 PresentationFramework 참조 없음?
- I-W3: ViewModel이 Window/UserControl/DrawingView 타입을 참조하는 부분 있나?
- I-W4: ViewModel에 거리/교차점/스냅 같은 도메인 분기/계산이 직접 들어있나?
- I-W5: ObservableCollection<EntityViewItem>을 백그라운드 스레드(파일 로딩 등)에서 변경하는 곳 있나?
- I-W8: Code-behind에 도메인/파일/네트워크 호출 있나?
- I-W11/I-W13: 큰 도면 가정 시 Virtualization / DrawingVisual 사용 적절한가?

[코드 붙여넣기]
```

---

## 부록 B. 체크리스트

### 새 기능 시작
- [ ] Core / ViewModel / View 레이어 분류 결정
- [ ] Core면: Spec, Interface, Invariant, Test 작성
- [ ] ViewModel이면: 얇은 Spec + 핵심 부분만 단위 테스트
- [ ] View면: 수동 검증 체크리스트 작성
- [ ] .csproj `UseWPF` 설정 확인 (Core는 false)

### 커밋 전
- [ ] dotnet test 통과 (Core + Architecture)
- [ ] dotnet build -warnaserror 통과
- [ ] I-W1 ~ I-W13 위반 없음
- [ ] ViewModel에 도메인 분기 없음 (거리/교차점/스냅/허용오차 등)
- [ ] Code-behind에 도메인/파일·네트워크 호출 없음

### 분리 신호 점검 (주 1회 권장)
- [ ] ViewModel에 도메인 분기 3개 이상?
- [ ] async 메서드가 50줄 이상?
- [ ] 동일 기하 계산이 두 ViewModel에 반복?
- [ ] Code-behind가 InitializeComponent 외에 도면 호출을 가지나?
- [ ] 도메인 상수(SnapTolerance 등)가 ViewModel에 박혀있나?
