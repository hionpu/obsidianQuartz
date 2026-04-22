# 보충 자료: 왜 컨텍스트를 줄여야 하는가

> 이 문서는 _AI와 TDD 없는 상태에서 시작하는 Low Tech Dept 개발 가이드 (v4)_ 의 보충 자료다. 메인 가이드의 방법론—Spec, Invariant, Interface, Test를 먼저 정의하고 AI에게 구현을 위임하는 방식—이 **왜 효율적인가**를 컨텍스트 관점에서 설명한다.

---

## 1. 문제 설정

AI에게 기능 구현을 시킬 때, 가장 흔하게 하는 실수는 이것이다:

> "코드베이스 전체를 넣어주면 AI가 알아서 잘 짜겠지."

실제로는 반대다. 컨텍스트가 클수록 AI의 응답 품질은 오히려 떨어진다. 이유는 두 가지다.

- **토큰 비용**: 입력 토큰은 돈과 시간이다.
- **Lost in the Middle**: 컨텍스트가 길어질수록 LLM은 중간에 있는 정보를 놓친다.

메인 가이드의 TDD+BDD 방법론은 이 두 문제를 동시에 해결하는 구조를 자연스럽게 만들어낸다.

---

## 2. 컨텍스트 경계가 명확해지는 이유

### 2.1 계약이 곧 컨텍스트 경계다

메인 가이드에서 사람이 소유해야 하는 것들—Spec, Invariant, Interface, Test—은 구현이 의존해야 할 **최소 필요 정보**다. 이 네 가지를 먼저 정의하면, AI에게 넘겨야 할 컨텍스트가 자동으로 결정된다.

```
AI에게 필요한 것:
  ✓ 이 기능이 무엇을 해야 하는가   → Spec
  ✓ 절대 깨지면 안 되는 규칙은?    → Invariants
  ✓ 입출력 형태는?                → Interface
  ✓ 통과해야 하는 테스트는?        → Tests

AI에게 불필요한 것:
  ✗ 다른 모듈의 내부 구현
  ✗ 관련 없는 파일들
  ✗ 프로젝트 전체 히스토리
```

계약이 없는 상태에서 AI에게 구현을 시키면, AI는 어디까지가 자기 책임인지 모른다. 그래서 개발자는 불안하게 "혹시 몰라서" 파일을 더 넣게 된다. 계약이 있으면 경계가 명확하니 그럴 필요가 없다.

### 2.2 모듈 경계 = 컨텍스트 경계

Interface를 먼저 정의하는 습관은 모듈 간 의존성을 낮게 유지한다. 의존성이 낮으면 한 모듈을 구현할 때 다른 모듈의 내부를 볼 필요가 없다. 컨텍스트에 넣을 파일 수가 줄어드는 건 자연스러운 결과다.

**계약 없는 개발의 컨텍스트:**

```
DocumentApprovalService 구현 요청 시 필요한 파일:
  - DocumentApprovalService.cs (기존 코드)
  - UserPermissionRepository.cs (권한 확인 방식 알아야 하니까)
  - ApprovalViewModel.cs (ViewModel 업데이트 방식 알아야 하니까)
  - NotificationService.cs (알림 발송 방식 알아야 하니까)
  - AppConfig.cs (설정값 참조하니까)
  - ...
```

**계약 기반 개발의 컨텍스트:**

```
DocumentApprovalService 구현 요청 시 필요한 파일:
  - document-approval.md (Spec)
  - approval-rules.md (Invariant)
  - IDocumentApprovalService.cs (Interface)
  - DocumentApprovalServiceTests.cs (Tests)
```

전자는 경계가 없어서 파일이 계속 추가된다. 후자는 계약이 경계를 만들어 딱 4개로 끝난다.

---

## 3. Lost in the Middle: LLM 아키텍처의 구조적 한계

### 3.1 현상

2023년 연구(Liu et al., "Lost in the Middle")에서 처음 체계적으로 문서화된 현상이다. LLM에 긴 컨텍스트를 줬을 때, **모델은 앞과 뒤에 있는 정보를 훨씬 잘 활용하고, 중간에 있는 정보는 잘 놓친다.**

```
컨텍스트 길이와 정보 활용도의 관계:

활용도
  ↑
  █                               █
  █                               █
  █         (중간은 낮음)          █
  █  ░  ░  ░  ░  ░  ░  ░  ░  █
  └─────────────────────────────→ 위치
  앞                             뒤
```

실용적으로 번역하면: **중요한 정보를 컨텍스트 중간에 넣으면 AI가 그걸 무시하거나 잘못 참조할 가능성이 높아진다.**

### 3.2 왜 이게 LLM 아키텍처 자체의 문제인가

Transformer 기반 LLM의 Attention 메커니즘은 이론적으로는 시퀀스 내 모든 토큰에 동등하게 접근할 수 있다. 그러나 실제 훈련 과정에서 패턴이 생긴다.

**훈련 데이터의 편향**: 자연어와 코드 문서 대부분은 도입부와 결론부에 중요 정보가 집중된다. 모델은 이 패턴을 학습한다.

**Attention score의 희석**: 시퀀스가 길어질수록 각 토큰의 Attention 가중치 합은 1로 고정되므로, 개별 토큰이 받을 수 있는 가중치의 최대값이 낮아진다. 중간 토큰들은 구조적으로 불리하다.

**Positional encoding의 한계**: 훈련 시 사용된 최대 시퀀스 길이 근처에서 positional embedding의 신뢰도가 떨어지는 현상이 알려져 있다.

이 중 어느 것도 "더 좋은 프롬프트"나 "더 좋은 하드웨어"로 해결되지 않는다. LLM이라는 구조를 선택하는 순간 이 한계를 함께 선택하는 것이다.

### 3.3 컨텍스트 길이가 늘어나도 해결되지 않는 이유

2024~2025년 기준으로 주요 LLM의 컨텍스트 창은 100K, 200K, 심지어 1M 토큰을 넘어가고 있다. 그러나 이것은 "더 많이 넣을 수 있다"는 뜻이지, "더 길게 넣어도 품질이 유지된다"는 뜻이 아니다.

실제로 긴 컨텍스트를 지원하는 모델들의 벤치마크를 보면, 컨텍스트가 길어질수록 **관련 정보 검색 정확도(needle-in-a-haystack 테스트 등)** 는 여전히 하락한다. 컨텍스트 창이 커진 것은 하드웨어와 엔지니어링의 발전이지만, "중간 정보를 잘 놓치는" Attention 메커니즘의 특성은 여전히 그대로다.

요약하면:

||해결되는 것|해결 안 되는 것|
|---|---|---|
|더 큰 컨텍스트 창|더 많은 파일을 넣을 수 있음|중간 정보를 놓치는 경향|
|더 빠른 하드웨어|처리 속도|Attention 구조적 편향|
|더 긴 훈련|더 긴 시퀀스 일반화|위치에 따른 정보 활용 불균형|

---

## 4. 계약 기반 개발이 두 문제를 동시에 해결하는 방식

### 4.1 토큰 절약: 면적을 줄인다

메인 가이드의 방법론대로 구현 단위를 Spec → Interface → Test 순으로 정의하면, AI에게 제공하는 컨텍스트의 **총 토큰 수**가 줄어든다.

각 아티팩트는 작고 집중적이다:

- Spec: 기능의 행동을 서술하는 짧은 문서
- Invariant: 규칙 목록, 보통 한 파일에 수십 줄
- Interface: 타입 시그니처와 주석만 있는 파일, 구현 없음
- Tests: 통과해야 할 케이스들, 실제 구현은 없음

이 네 개를 합쳐도 수백~수천 토큰 수준이다. 구현 코드와 관련 파일들을 모두 넣는 것과는 자릿수가 다르다.

### 4.2 Lost in the Middle 대응: 밀도를 높인다

더 중요한 효과는 두 번째다. 컨텍스트가 작아지면 모든 정보가 앞이나 뒤에 가까워진다. "중간"이 줄어들거나 사라진다.

```
긴 컨텍스트:
[관련 있음][관련 없음 × 50][★핵심 제약조건★][관련 없음 × 30][관련 있음]
                              ↑ 여기가 중간 → 무시될 가능성 높음

짧은 컨텍스트 (계약만):
[Spec][Invariants][Interface][Tests]
  ↑ 모두 앞뒤 범위 내 → 전부 잘 참조됨
```

즉, **컨텍스트를 줄이는 것 자체가 Lost in the Middle 리스크를 낮추는 방법**이다. 별도의 "중요 정보를 앞에 배치하는" 테크닉보다 근본적인 해결책이다.

### 4.3 재사용성: 같은 컨텍스트로 여러 번 사용 가능

계약 파일들은 구현이 바뀌어도 변하지 않는다. 한 번 정의한 Spec + Invariants + Interface + Tests는 다음 상황에서도 동일하게 쓸 수 있다:

- 구현에 버그가 생겨서 다시 고칠 때
- 리팩토링 후 검증할 때
- 다른 모델이나 세션에서 같은 기능을 다시 작업할 때

매번 새로 컨텍스트를 구성하지 않아도 된다. **계약 파일 세트가 곧 이 기능의 영구적인 AI 작업 컨텍스트**가 된다.

---

## 5. 실전 비교

아래는 WPF 프로젝트에서 동일한 기능을 계약 없이 vs. 계약 기반으로 요청할 때의 차이다.

### 계약 없는 요청

```
"문서 결재 기능 만들어줘.
결재 요청/승인/반려 되고,
권한에 따라 접근 제어 있고,
상태 변경 시 알림도 가야 해.
참고로 현재 코드는 이래:

[UserPermissionRepository.cs - 220줄]
[ApprovalViewModel.cs - 380줄]
[NotificationService.cs - 160줄]
[DocumentRepository.cs - 210줄]
..."
```

문제:

- 토큰 수: 수천
- AI는 ApprovalViewModel.cs 중간쯤에 있는 제약조건을 놓칠 수 있음
- 어디까지 건드려도 되는지 AI가 추론해야 함 (ViewModel을 직접 건드려야 하나? Repository를 새로 만들어야 하나?)
- 매번 비슷한 컨텍스트를 다시 구성해야 함

### 계약 기반 요청

```
"아래 계약을 만족하는 DocumentApprovalService를 구현해줘.
테스트를 수정하지 말고, 테스트가 통과해야 해.

[document-approval.md - 35줄]
[approval-rules.md - 25줄]
[IDocumentApprovalService.cs - 30줄]
[DocumentApprovalServiceTests.cs - 70줄]"
```

특징:

- 토큰 수: ~600
- 모든 제약조건이 컨텍스트 범위 내에 밀집
- `IDocumentApprovalService.cs`가 의존성 경계를 명확히 정의하므로 AI가 ViewModel이나 Repository를 직접 건드리지 않음
- 이 파일 세트는 다음 번에도 그대로 재사용 가능

실제 계약 파일 예시:

**IDocumentApprovalService.cs (Interface, ~30줄):**

```csharp
public interface IDocumentApprovalService
{
    /// <summary>결재 요청. 이미 진행 중인 결재가 있으면 InvalidOperationException.</summary>
    Task RequestApprovalAsync(Guid documentId, Guid requesterId);

    /// <summary>승인. 결재자 권한 없으면 UnauthorizedAccessException.</summary>
    Task ApproveAsync(Guid documentId, Guid approverId);

    /// <summary>반려. 사유 필수.</summary>
    Task RejectAsync(Guid documentId, Guid approverId, string reason);

    Task<ApprovalStatus> GetStatusAsync(Guid documentId);
}

public enum ApprovalStatus { None, Pending, Approved, Rejected }
```

**DocumentApprovalServiceTests.cs (Tests, 일부):**

```csharp
[TestFixture]
public class DocumentApprovalServiceTests
{
    private IDocumentApprovalService _sut;

    [SetUp]
    public void SetUp()
    {
        // 의존성은 mock으로 주입 — 구현 내부는 테스트가 관심 없음
        var permissionRepo = Substitute.For<IPermissionRepository>();
        permissionRepo.IsApproverAsync(Arg.Any<Guid>()).Returns(true);

        _sut = new DocumentApprovalService(permissionRepo, ...);
    }

    [Test]
    public async Task RequestApproval_WhenAlreadyPending_ThrowsInvalidOperation()
    {
        await _sut.RequestApprovalAsync(_docId, _requesterId);

        Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.RequestApprovalAsync(_docId, _requesterId));
    }

    [Test]
    public async Task Approve_WithoutApproverPermission_ThrowsUnauthorized()
    {
        var noPermissionRepo = Substitute.For<IPermissionRepository>();
        noPermissionRepo.IsApproverAsync(Arg.Any<Guid>()).Returns(false);
        var sut = new DocumentApprovalService(noPermissionRepo, ...);

        await sut.RequestApprovalAsync(_docId, _requesterId);

        Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.ApproveAsync(_docId, _nonApproverId));
    }

    [Test]
    public async Task Approve_ValidApprover_StatusBecomesApproved()
    {
        await _sut.RequestApprovalAsync(_docId, _requesterId);
        await _sut.ApproveAsync(_docId, _approverId);

        var status = await _sut.GetStatusAsync(_docId);
        Assert.That(status, Is.EqualTo(ApprovalStatus.Approved));
    }
}
```

AI에게 넘기는 것은 이게 전부다. `ApprovalViewModel.cs`는 컨텍스트에 없어도 된다. ViewModel은 `IDocumentApprovalService`를 통해서만 이 서비스와 상호작용하므로, 구현이 어떻게 되든 ViewModel을 깨뜨릴 수 없다.

---

## 6. 요약

메인 가이드의 방법론은 코드 품질과 유지보수성을 위한 것이기도 하지만, **LLM을 효율적으로 사용하기 위한 설계**이기도 하다.

계약(Spec + Invariants + Interface + Tests)을 먼저 정의하면:

1. **AI에게 넘겨야 할 컨텍스트의 경계**가 자동으로 결정된다.
2. **토큰 수가 줄어들어** 비용과 속도가 개선된다.
3. **Lost in the Middle 문제의 노출 면적**이 줄어든다. 이것은 컨텍스트 창이 아무리 커져도 Attention 기반 LLM이라면 피할 수 없는 구조적 한계이므로, 근본적으로 대응하는 방법은 컨텍스트 자체를 줄이는 것이다.
4. **계약 파일 세트가 영구적인 작업 컨텍스트**가 되어 재사용된다.

LLM이라는 도구를 쓰는 이상, 이 도구의 한계를 이해하고 그 한계를 우회하는 방식으로 작업 단위를 설계하는 것이 핵심이다. TDD+BDD는 그 설계를 자연스럽게 강제하는 방법론이다.

---

_관련 문서: AI와 TDD 없는 상태에서 시작하는 Low Tech Dept 개발 가이드 (v4)_