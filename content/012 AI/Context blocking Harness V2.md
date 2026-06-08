# LLM 코딩 Harness 기획안 (v2)

> 컨텍스트 차단형 · tool-agnostic · 3-mode vertical slice 개발 환경

## 변경 이력

|버전|핵심 변경|
|---|---|
|v1|3계층 아키텍처, 차단형 작동 원리, slice 산출물, MCP 4개 도구|
|v2|① 차단 메커니즘을 tool-agnostic(MCP 권위 기반)으로 정정 ② Build/Refactor/Debug 3-mode 정식 도입 ③ propose_slice 2단계 분리 ④ Unity 동기화 에디터 ON/OFF 분기 ⑤ 권한 상승 안전장치|

---

## 1. 배경과 목표

LLM으로 코딩 작업을 할 때 다음 세 규칙을 **시스템적으로 강제**하는 harness를 구축한다.

|#|규칙|의미|
|---|---|---|
|1|유지·보수성|기능 한 개를 구현할 때 영향받는 다른 코드를 최소화|
|2|토큰 최적화|기능을 vertical slice로 쪼개 slice마다 한 세션에서 대화함으로써 누적 토큰 사용량을 줄임|
|3|조립식 코드|특정 기능을 구현하기 위해 알아야 하는 컨텍스트의 양을 최소화|

### 핵심 통찰

세 규칙은 별개가 아니라 **하나의 메커니즘으로 동시에 해결된다.** "기능 = 계약(contract)으로 정의된 vertical slice"라는 단위를 강제하면:

- 영향 범위가 slice 경계로 한정됨 → 규칙 1
- slice 단위로 세션을 격리 → 규칙 2
- slice 간 의존이 인터페이스로만 노출 → 규칙 3

따라서 harness의 본질은 **slice 경계를 정의하고, 경계 밖 코드는 시그니처만 노출하고 경계 안은 전부 노출하는 게이트키퍼**다.

## 2. 설계 결정

|항목|결정|
|---|---|
|대상 언어 스택|Unity/C# 우선. LSP MCP는 언어 스택마다 별도 구현 (현재는 Roslyn 기반 1개)|
|slice 경계 정의 주체|AI가 제안 → 사람이 승인 (경계가 명시적 산출물로 파일에 남음)|
|강제 수준|MCP가 **컨텍스트 차단으로 강제**|
|**도구 종속성**|**tool-agnostic. 특정 에이전트(opencode/pi/Claude Code)에 종속되지 않음**|

### tool-agnostic이 강제하는 원칙

차단(enforcement)을 에이전트의 hook에 의존하면 tool-specific해진다. opencode의 `tool.execute.before`, pi의 `tool_call`, Claude Code의 PreToolUse는 전부 다른 인터페이스이고, 거기에 코드를 박으면 그 도구에 종속된다.

발상을 뒤집는다. **차단의 권위를 에이전트가 아니라 MCP 서버 자신이 갖게 한다.** 업계 공통 사실: "지시 파일(instruction file)은 권고일 뿐이고, 실제 차단은 hook으로만 성립한다." 이를 우회하는 유일한 방법은 **읽을 코드가 MCP를 거치는 것 외에는 물리적으로 존재하지 않게** 만드는 것이다.

## 3. 차단 메커니즘 (정정)

차단을 두 종류로 분리한다.

### 강한 차단 (tool-agnostic, 권장)

에이전트에게 보이는 작업 디렉토리에는 실제 소스가 없다. MCP 서버만 진짜 코드베이스에 접근하고, 에이전트는 `enter_slice`로 받은 조각만 본다. 어떤 에이전트를 쓰든 — Read/Grep/hook 설정과 무관하게 — 읽을 것이 없으니 차단이 성립한다. MCP는 모든 주요 에이전트가 공유하는 유일한 공통 표준이므로, 여기에 권위를 두면 자동으로 tool-agnostic이 된다.

### 약한 차단 (tool-specific, 선택)

강한 차단이 과할 때, 각 에이전트의 hook으로 파일 읽기를 막는다. 단 이것은 **어댑터로 격리**한다. 핵심 harness는 hook을 모르고, `adapters/opencode.ts`, `adapters/pi.ts` 같은 얇은 껍데기만 각 도구의 hook 규약을 번역한다.

### 의존성 경계

```
┌─────────────────────────────────────┐
│  Core harness (tool-agnostic)        │
│  - slice.yaml 규약                    │
│  - MCP 도구 (표준 MCP만)              │
│  - Roslyn 컨텍스트 추출 엔진          │
└──────────────┬──────────────────────┘
               │ MCP (공통 표준)
   ┌───────────┼───────────┐
   ▼           ▼           ▼
opencode      pi      Claude Code   ← 어댑터는 선택적 (약한 차단용)
```

Core는 MCP 표준만 안다. 특정 에이전트의 hook·config·플러그인 API는 전부 어댑터 뒤로 민다. 새 에이전트 지원 = 얇은 어댑터 하나 추가이며, 그 에이전트가 MCP만 지원해도 강한 차단 모드로는 즉시 동작한다.

> **트레이드오프:** 강한 차단(작업 디렉토리에서 소스 분리)은 가장 견고하고 tool-agnostic하지만, "에이전트가 빌드/테스트를 직접 실행"하는 워크플로우와 마찰이 있다. slice 안의 코드만 따로 빌드 가능한 형태로 떼어줄 수 있느냐가 관건이며, 이는 Refactor Mode 설계와 얽힌다.

## 4. 전체 아키텍처 (3계층)

```
규칙 정의(.md)  →  컨텍스트 게이트키퍼(LSP MCP)  →  검증(MCP/CI)
```

### 4.1 계층 1 — 규칙은 작게, 계층적으로 (.md)

토큰 문제의 핵심은 "규칙 .md를 매 세션 다 읽으면 안 된다"는 것이다.

- `harness.md` (루트, ~30줄): 불변 원칙만. 예) "경계 밖 코드는 직접 읽지 말고 MCP를 호출하라", "구현 전 contract를 먼저 확정하라"
- 상세 가이드(contract 작성법, 테스트 패턴 등): **MCP 도구가 필요할 때만 응답에 실어 반환**

규칙을 프롬프트에 상주시키지 말고 MCP 응답에 lazy하게 실어 보낸다. 이것이 harness 자체의 토큰 사용량을 줄이는 핵심 트릭이다.

### 4.2 계층 2 — LSP MCP가 컨텍스트의 양을 물리적으로 제어

|LSP 기능|용도|대응 규칙|
|---|---|---|
|`documentSymbol` / `workspace/symbol`|slice 안의 심볼 목록|—|
|`definition`, `references`, `callHierarchy`|"이 함수를 건드리면 영향받는 곳" 산출|규칙 1|
|`hover` / `signatureHelp`|경계 밖 코드를 본문 없이 시그니처+요약만 노출|규칙 3|

### 4.3 계층 3 — 검증으로 규칙을 닫기

slice 경계를 넘는 참조가 생기면 막는다. LSP의 `references` 그래프를 재활용해 "slice A의 심볼이 contract에 선언되지 않은 채 slice B에서 참조되면 위반"으로 판정하는 린터를 MCP 도구 또는 pre-commit 훅으로 노출한다.

## 5. 산출물 구조

slice 하나당 디렉토리 하나. 경계가 **검토 가능한 파일**로 남는다.

```
/slices/0042-inventory-quality-grade/
  slice.yaml        ← 경계 정의 (사람이 승인하는 핵심 파일)
  contract.md       ← Spec/Invariant/Interface (구현 전 확정)
  session.log       ← 이 slice를 다룬 세션 기록
```

### slice.yaml 예시

```yaml
id: 0042-inventory-quality-grade
owns:                    # 전문(full-text)으로 받는 심볼
  - InventorySystem.AddItem
  - QualityGrade
depends_on:              # 경계 밖 — 시그니처만 받음
  - ItemDatabase.Lookup
  - PlayerStats.Luck
forbidden:               # 명시적으로 만지면 안 되는 영역
  - SaveSystem.*
```

- `owns`: 전문 제공 / `depends_on`: hover 시그니처 + 요약만 / 나머지 전체: **존재조차 보이지 않음**

## 6. 운영 모드: Build / Refactor / Debug

harness는 신규 기능 개발만 지원해서는 실무의 절반만 쓸 수 있다. 코드베이스는 짜는 시간보다 고치고 이해하는 시간이 더 길다. 따라서 세 모드를 **정식 구조**로 둔다.

### 핵심 원칙

> **권한 상승은 "차단을 푸는 것"이 아니라 "경계를 다시 그리는 것"이다.**

가장 안이한 설계는 "Refactor = 차단 해제"인데, 그러면 일반 에이전트로 돌아가 토큰·영향범위 통제가 증발한다. 대신 **여러 slice를 묶어 더 큰 경계 하나를 만들고, 그 합집합 안에서만 다시 차단**한다. 경계가 커질 뿐, 경계 밖은 여전히 시그니처만 보인다. "전체 해제"라는 상태는 harness에 존재하지 않는다.

세 모드는 같은 메커니즘의 변주이며, **차이는 "경계를 어떻게 결정하느냐"뿐이다.**

|모드|경계 결정 방식|트리거|
|---|---|---|
|Build|사람이 승인한 단일 slice.yaml|AI 제안 → 사람 승인|
|Refactor|여러 slice의 합집합 (impact_of 자동 수집 → 사람 승인)|의도(바꿀 인터페이스) 지정|
|Debug|런타임이 결정 (스택 트레이스 역추적)|에러 트레이스 / 실패 테스트|

### 6.1 Build Mode (차단형, 신규 기능)

경계 = 사람이 승인한 단일 `slice.yaml`. 기존 설계 그대로.

### 6.2 Refactor Mode (cross-slice 수정)

경계 = 여러 slice의 합집합. 사람이 _코드 그래프가 아니라 의도로_ 범위를 지정한다. "이 인터페이스를 바꾸겠다"고 하면 MCP가 `impact_of`(callHierarchy)로 영향 slice를 자동 수집해 **refactor manifest**를 만들고, 사람이 목록을 승인한다. 작업 중 manifest에 없는 slice를 건드리면 `check_boundary`가 막는다.

```yaml
# refactor-manifest.yaml (사람이 승인하는 임시 경계)
goal: "ItemDatabase.Lookup 시그니처에 LuckModifier 추가"
trigger: ItemDatabase.Lookup
owns:                      # impact_of가 자동 수집 → 사람이 가감
  - slices/0042-inventory-quality-grade
  - slices/0017-shop-pricing
  - slices/0031-loot-table
frozen:                    # 영향은 받지만 수정 금지 (시그니처만)
  - SaveSystem.Serialize
```

### 6.3 Debug Mode (버그 추적)

경계 = 런타임이 결정. 버그는 정적 코드 그래프가 아니라 **실제 실행 경로**를 따라 경계를 넘나든다. 그래서 경계를 사람이나 callHierarchy가 아니라 **스택 트레이스/로그가 제안**한다.

흐름: 에러 스택 트레이스나 실패한 테스트를 `elevate_from_trace(stacktrace)`에 던지면, 트레이스에 등장하는 심볼을 역추적해 관련 slice를 `owns`로 격상한 **임시 debug 경계**를 만든다. 버그는 보통 "내가 보던 slice의 가정이 다른 slice에서 깨져서" 생기므로, 트레이스가 정확히 그 "다른 slice"를 가리킨다. 세션이 끝나면 경계는 폐기되고 원래 slice로 복귀한다.

> **범위:** v2는 **정적 트레이스 기반**(스택 트레이스 텍스트 파싱)으로 한정한다. 런타임 계측(로그 주입 기반 동적 경계 확장)은 **향후 확장**으로 표기.

### 6.4 권한 상승 안전장치

권한 상승이 남용되면 차단이 유명무실해진다. 두 가지를 강제한다.

1. **모든 경계 확장은 명시적 산출물로 남는다.** refactor-manifest, debug 세션의 격상 기록 전부 파일로. 사람이 승인하고 git에 남으니 "왜 이 slice가 풀렸나"가 항상 추적된다.
2. **확장된 경계도 여전히 경계다.** refactor에서 10개 slice를 묶어도 11번째는 시그니처만 보이고, `frozen` 목록은 영향받더라도 수정 금지로 잠근다.

## 7. MCP 서버가 노출하는 도구

도구가 많으면 정의 자체가 토큰을 먹는다. 최소화하되, 3-mode를 지원한다. 전부 표준 MCP 도구이므로 어떤 에이전트든 그대로 쓴다.

|도구|모드|역할|
|---|---|---|
|`search_symbol(keyword)`|공통|가벼운 심볼 탐색. **결과는 시그니처 수준만 반환**(전문 금지). slice 제안 전 훑기용|
|`create_slice_yaml(symbols)`|Build|탐색 결과를 받아 slice.yaml 초안 생성 (사람 승인 대기)|
|`enter_slice(id)`|공통|승인된 경계(slice/manifest/debug)를 열고 owns 전문 + depends_on 시그니처 반환. contract 가이드(.md)도 이 응답에 lazy하게 실음|
|`impact_of(symbol)`|공통|callHierarchy로 영향 범위 산출 (규칙 1 검증 + refactor 수집)|
|`check_boundary()`|공통|현재 코드가 경계의 owns/forbidden/frozen을 위반하는지 references 그래프로 판정|
|`propose_refactor(trigger)`|Refactor|impact_of로 영향 slice 수집 → manifest 초안 (사람 승인)|
|`elevate_from_trace(stacktrace)`|Debug|스택 트레이스 역추적 → 임시 debug 경계 생성|

> **propose_slice 분리 (Gemini 피드백 A):** v1의 `propose_slice`는 한 호출로 전체 그래프를 훑어 거대한 컨텍스트를 빨아들이는 문제가 있었다. v2는 `search_symbol`(가벼운 시그니처 탐색) → `create_slice_yaml`(초안 생성) 2단계로 분리한다. 탐색 단계조차 시그니처만 반환해 토큰을 압축한다.

`enter_slice`는 단일 slice·refactor manifest·debug 경계를 모두 받게 일반화하여, 진입점 하나로 세 모드를 태운다.

## 8. 토큰 최적화 정리

|레버|방법|효과|
|---|---|---|
|규칙 .md 상주 최소화|루트 30줄 + 나머지는 MCP lazy 반환|harness 자체 토큰 절감|
|코드 컨텍스트 심볼 단위 추출|full-text 대신 hover 시그니처|의존 코드 토큰 절감 (실측 최대 절감 지점)|
|slice 세션 격리|slice마다 새 세션|누적 토큰 자체를 끊음|
|탐색도 시그니처만|search_symbol이 전문 반환 금지|경계 결정 단계의 토큰 절감|

## 9. C#/Roslyn 구현 노트

Unity C# 선택이 LSP MCP 구현엔 오히려 유리하다. **Roslyn이 풀 LSP보다 강력한 컴파일러 API를 직접 제공**한다. `MSBuildWorkspace`로 프로젝트를 열고 `SymbolFinder.FindReferencesAsync`, `CallHierarchy`, `SemanticModel`을 직접 호출하면 `owns` / `depends_on` / `impact_of`가 전부 한 API로 나온다.

### Unity 동기화 (Gemini 피드백 B)

Unity는 스크립트 변경 시마다 `.csproj` / `.sln`을 재생성하며, 이 과정에서 락이나 지연이 발생한다. MCP 서버가 Roslyn 워크스페이스를 잡고 있을 때 충돌할 수 있다. 두 모드로 분기한다.

|환경|로드 전략|
|---|---|
|에디터 OFF (CI/오프라인)|`Csc` 응답 파일 기준 로드. Unity `Library/` 상태에 비의존|
|에디터 ON (실시간 개발)|Unity 외부에서 독립 동작하는 파일와처 기반 **증분 갱신**. 변경된 파일에 대해서만 제한적으로 SemanticModel 업데이트|

## 10. 다음 단계 (구현 우선순위)

|순위|작업|이유|
|---|---|---|
|1|MCP 서버 스켈레톤 (Roslyn `MSBuildWorkspace` + 핵심 도구)|차단형 harness의 성패는 MCP가 owns/depends_on을 구분해 반환할 수 있느냐에 달림. 가장 큰 리스크를 먼저 제거|
|2|`harness.md` + `contract.md` 템플릿 초안|실제 텍스트 확정|
|3|강한 차단 검증|작업 디렉토리 소스 분리 + MCP-only 접근이 실제로 tool-agnostic하게 성립하는지|
|4|Refactor/Debug 모드 도구 시그니처 확정|propose_refactor / elevate_from_trace 입출력 스펙|
|5|어댑터(약한 차단)|opencode/pi hook 번역 레이어|