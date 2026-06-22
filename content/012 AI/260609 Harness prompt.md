claude code, codex, pi, opencode 등에서 모두 사용 가능한 skill + mcp + (필요 시) background process를 포함한 harness를 만드려는데 다음과 같은 요구사항을 충족시키면 좋겠음:

- low token usage
- 어떤 기능을 구현하려 할 때 end-to-end vertical slice로 쪼개고, 각 slice마다 별도의 chat session(s)에서 구현, 쪼개는 과정 자체도 이 harness에 포함되며 vertical slices를 사용자가 승인하면 진행.
- 어떤 slice를 구현할 때 필요한 관련 코드, dependency 등을 코드베이스 전체를 탐색하는 것이 아니라 어떤 알고리즘과 생략(압축) 기법(ast, cst, tree-sitter, lsp 등)을 이용해서 token usage를 최소화.
  
이런 harness가 있으면 좋겠다고 생각하게 된 원본 가이드 문서를 첨부했어. 꼭 이 문서의 모든 것을 따르는 harness일 필요는 없음(예를 들어 TDD를 꼭 포함할 필요는 없다는 얘기)