# 함수 절(Function Clause)

Elixir를 처음 접하는 개발자라면 
```elixir
defp valid_url?(url) do ...
defp valid_url?(_) do ...
```

와 같은 코드는 하나의 함수인데 왜 여러 개의 정의가 있는 걸까요? 이것은 Elixir의 기능 중 하나인**함수 절(Function Clause)** 입니다

이번 포스팅에서는 함수 절이 무엇이며, 어떻게 작동하는지, 그리고 왜 이것이 Elixir에서 중요한 개념인지 설명합니다.

## 함수 절(Function Clause)이란?

**함수 절(Function Clause)**은 하나의 함수를 여러 개의 **패턴 매칭(Pattern Matching)** 조건으로 나누어 정의하는 방법입니다. Elixir는 함수가 호출될 때 전달된 **인자(Argument)**를 각 함수 절의 패턴과 비교합니다. 가장 먼저 일치하는 절이 선택되어 실행됩니다.

아래 예시를 통해 쉽게 이해해 봅시다.

```elixir
defp valid_url?(url) when is_binary(url) do
  url =~ ~r/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/
end

defp valid_url?(_), do: false
```

이 코드는 `valid_url?`이라는 하나의 함수에 두 개의 절이 정의되어 있습니다.

1. **첫 번째 절**: `(url) when is_binary(url)`
    
    - `url`이라는 인자를 받습니다.
        
    - `when is_binary(url)`는 **가드 절(Guard Clause)**로, 인자가 **바이너리(Binary)**(Elixir의 문자열 타입)일 때만 이 절이 실행될 자격을 얻습니다.
        
    - 인자가 유효한 YouTube URL 형식인지 정규식으로 검사합니다.
        
2. **두 번째 절**: `(_)`
    
    - `_` (언더스코어)는 와일드카드 패턴으로, **모든 값**에 매칭됩니다.
        
    - 만약 첫 번째 절의 조건(바이너리 여부)이 맞지 않으면, Elixir는 다음 절을 찾습니다. 이때 `_` 패턴을 가진 이 두 번째 절이 선택되어 즉시 `false`를 반환합니다.
        

## 함수 절의 순서

함수 절은 위에서 아래로 순서대로 실행됩니다. 따라서 **더 구체적인(Specific) 절을 먼저 배치하고, 덜 구체적인(General) 절을 나중에 배치하는 것이 매우 중요합니다.**

만약 순서를 바꾸어 `valid_url?(_)` 절을 먼저 정의하면 어떻게 될까요?

```
defp valid_url?(_), do: false

defp valid_url?(url) when is_binary(url) do
  url =~ ~r/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/
end
```

`_`는 모든 인자에 매칭되기 때문에, 어떤 값이 들어와도 첫 번째 절이 선택되어 항상 `false`를 반환하게 됩니다. 두 번째 절은 영원히 호출되지 않습니다.

## 함수 절의 장점

함수 절은 단순히 코드를 나누는 것을 넘어, 여러 가지 이점을 제공합니다.

1. **가독성(Readability)과 유지보수(Maintainability)**: 긴 `if/else` 또는 `case` 문 대신, 각기 다른 상황에 대한 코드를 독립적인 절로 분리하여 한눈에 로직을 파악하기 쉽습니다.
    
2. **불변성(Immutability)**: 각 절은 특정 인자 패턴에 대한 동작을 선언적으로 정의합니다. 이는 변수를 변경하는 절차적 프로그래밍과 달리, 데이터 불변성을 유지하는 함수형 프로그래밍의 핵심 개념과 잘 맞습니다.
    
3. **성능(Performance)**: Elixir 컴파일러와 Erlang VM(BEAM)은 함수 절의 패턴 매칭을 매우 효율적으로 최적화합니다. 이는 런타임에 동적으로 조건을 검사하는 것보다 더 빠른 성능을 낼 수 있습니다.
    
4. **견고성(Robustness)**: 만약 정의된 모든 함수 절의 패턴에 매칭되지 않는 인자가 들어오면, Elixir는 즉시 `FunctionClauseError`를 발생시킵니다. 이는 처리되지 않은 예외를 명확하게 알려주어 버그를 조기에 발견할 수 있게 돕습니다.
    

## 마무리

Elixir의 **함수 절(Function Clause)**은 코드를 명확하고, 효율적이며, 유지보수하기 쉽게 만들어주는 강력한 도구입니다. 이 개념은 Elixir의 패턴 매칭과 함께 작동하며, 복잡한 조건부 로직을 깔끔하게 표현하는 데 필수적입니다. 함수를 정의할 때 `if/else`나 `case` 보다 "어떤 인자 패턴일 때 어떤 동작을 해야 할까?"를 생각해서 함수 절을 사용하면 좋습니다.