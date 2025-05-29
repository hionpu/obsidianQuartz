---
title: 백준 2533 SNS, Tree DP 풀이 전략
tags: 
categories: 
createdAt: 2025-04-30 17:50
lastmod: 2025-04-30 17:50
lang: ko
pin: true
math: true
mermaid: true
permalink: backjoon-2533-SNS-Tree-DP-solving-strategy
---
### 문제
https://www.acmicpc.net/problem/2533

2533번 문제를 풀면서 트리 구조에서 DP 적용 시 필요한 핵심을 짚고, 어떻게 재귀와 dp를 구성할지 생각해봤습니다.
### 트리 구조의 독립성
트리 DP 문제를 푸는 데 가장 중요한 것은 자식 노드들의 독립성입니다. 각 자식 노드의 최적 선택이 다른 자식 노드의 선택에 영향을 미치지 않기 때문에, 자식 노드들의 최적 상태를 독립적으로 계산한 후 부모 노드에 통합할 수 있어요. 아래는 재귀 부분 코드입니다(EA: 얼리어답터).

```csharp
  void fill_dp(int cur) {
      if (visited[cur]) return;
      visited[cur] = true;
      
      // dp[i][0]: min number of total EA when i-th node is NOT EA.
      // dp[i][1]: min number of total EA when i-th node IS EA.

      dp[cur][1] = 1;

      for (auto& next : graph[cur])
      {
          if (visited[next]) continue;
          fill_dp(next);
          // ✅(1)
          dp[cur][0] += dp[next][1];
          dp[cur][1] += min(dp[next][0], dp[next][1]);
      }
  }
```

### ✅(1)
이 부분이 자식 노드의 최적 상태를 부모 노드에 더하는 부분이에요. 트리는
1. 사이클이 없음(Acyclic)
2. 부모가 하나임(Single Parent ㅋㅋㅋ;;)
3. 모든 노드가 연결됨
4. 계층구조
5. 서브트리 경계가 명확함
6. 루트가 정해지면 탐색할 방향이 정해짐
와 같은 특징이 있기 때문에 자식 노드들의 독립성을 보장하여 DP로 문제를 해결할 수 있는것입니다.