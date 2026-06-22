---
type: reference
created: 2026-05-15
---

Elixir에는 `#`을 이용한 주석 외에도 `@` 기호가 붙은 코드들이 있습니다. `@doc`, `@moduledoc`, `@spec` 등등. 이것들은 단순한 주석이 아니라, Elixir 컴파일러가 특별하게 처리하는 **`module attribute`** 라는 중요한 개념입니다.

#### `module attribute`

다른 프로그래밍 언어에서 주석은 보통 컴파일 과정에서 완전히 무시됩니다. 하지만 Elixir의 `module attribute`는 컴파일러에게 특정 모듈이나 함수에 대한 메타데이터(metadata)를 제공하는 역할을 합니다. 컴파일러는 이 정보를 `.beam` 파일에 저장하여 런타임에 활용할 수 있게 합니다.

#### 1. `@doc`과 `@moduledoc`: 문서화를 `first-class citizen`으로

Elixir에서 `@doc`과 `@moduledoc`은 단순히 코드를 설명하는 것을 넘어, **문서화(documentation)를 `first-class citizen`**으로 만듭니다.

- `@moduledoc`: 모듈 전체에 대한 설명을 작성할 때 사용합니다.
- `@doc`: 바로 다음에 오는 함수나 매크로에 대한 설명을 작성할 때 사용합니다.

```
defmodule MyModule do
  @moduledoc """
  이 모듈은 간단한 계산을 수행합니다.
  """
  
  @doc """
  두 숫자를 더합니다.
  """
  def add(a, b), do: a + b
end
```

이렇게 작성된 문서는 컴파일된 `.beam` 파일에 포함됩니다. 그래서 `IEx`에서 `h MyModule.add`와 같이 명령어를 입력하면 해당 함수의 문서를 바로 확인할 수 있고, `ExDoc`과 같은 도구를 통해 _자동으로 HTML 문서로 변환할 수도 있습니다._

#### 2. 기타 중요한 `module attribute`들

`@doc` 외에도 개발 효율성과 코드 품질을 높이는 다양한 `module attribute`가 있습니다.

- **`@spec`**: 함수의 인자와 반환 값의 **타입(type)**을 명시합니다. 이는 Elixir의 정적 분석 도구인 **`Dialyzer`**가 코드의 잠재적 버그를 찾을 수 있도록 돕습니다.
    
    ```
    @spec add(integer(), integer()) :: integer()
    def add(a, b), do: a + b
    ```
    
- **`@behaviour`**: 모듈이 특정 **행동(behavior)**을 구현하도록 강제합니다. 예를 들어, `GenServer`를 구현하는 모듈은 `@behaviour GenServer`를 사용하여 필요한 모든 콜백 함수를 구현했는지 컴파일러가 확인할 수 있게 합니다. [[@Behaviour, @Callback attributes]] 에서 `@behavi`
    
- **`@derive`**: `struct`에 특정 **프로토콜(protocol)** 구현을 자동으로 추가해줍니다. 예를 들어, `Jason.Encoder`를 `@derive`하면 해당 `struct`를 JSON으로 쉽게 인코딩할 수 있게 됩니다.
    
    ```
    @derive Jason.Encoder
    defstruct [:name, :age]
    ```
    

#### 3. Phoenix/LiveView의 특별한 `attribute`

Phoenix와 LiveView 프레임워크는 Elixir의 `module attribute` 시스템을 적극적으로 활용하여 자신만의 DSL(Domain-Specific Language)을 구축했습니다.

- **`@attr`**: `Phoenix.Component`에서 **속성(attribute)**을 정의할 때 사용합니다. 이는 HTML 컴포넌트처럼 재사용 가능한 UI를 만들 때 인자를 명확하게 정의하는 역할을 합니다.
    
    ```
    defmodule MyComponent do
      use Phoenix.Component
    
      @attr :message, :string, required: true
      def render(assigns) do
        ~H"""
        <div><%= @message %></div>
        """
      end
    end
    ```
    

#### 요약

Elixir의 `module attribute`는 단순한 주석을 넘어, 컴파일러에게 코드를 어떻게 다룰지 알려주는 중요한 메타데이터입니다. `@doc`을 통해 문서화를 코드의 일부로 만들고, `@spec`으로 타입 검사를 강화하며, 프레임워크는 이를 활용해 더욱 강력하고 가독성 높은 코드를 작성할 수 있게 합니다. 이 개념을 잘 이해하고 활용하면 Elixir 개발의 생산성과 코드 품질을 한 단계 끌어올릴 수 있습니다.