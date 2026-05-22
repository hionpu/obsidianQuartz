---
id: "3d"
type: permanent
created: 2026-05-15
tags: [tech-stack, elixir, functional]
up: "[[3 기술 스택]]"
---

# 3d Elixir

핵심 철학: **모든 것이 함수 클로즈다.**
OOP의 메서드 오버라이딩 대신, 패턴 매칭으로 다형성을 표현한다.

## 함수 클로즈 (Function Clause)

```elixir
# 패턴 매칭으로 다른 케이스를 별도 함수로
def handle(:ok, data), do: process(data)
def handle(:error, reason), do: log_error(reason)
def handle(_, _), do: :unknown
```

위에서부터 순서대로 매칭 시도. 첫 번째 매칭되는 클로즈 실행.

## Behaviour와 Callback

Behaviour = Elixir의 인터페이스/프로토콜.

```elixir
# 계약 정의
defmodule MyBehaviour do
  @callback process(term()) :: {:ok, term()} | {:error, term()}
end

# 구현
defmodule MyImpl do
  @behaviour MyBehaviour
  def process(data), do: {:ok, data}
end
```

→ [[2b 인터페이스 설계]]의 인터페이스 설계 원칙이 여기서도 동일하게 적용.

## Module Attributes
`@doc`, `@spec`, `@moduledoc` — 컴파일 타임 메타데이터.
`@spec`은 타입 명세 (Dialyzer가 정적 분석에 활용).

---


## 관련 레퍼런스
- [[Function Clause]]
- [[@Behaviour, @Callback attributes]]
- [['@doc' 과 같은 Module Attribute]]
