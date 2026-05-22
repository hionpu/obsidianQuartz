---
type: reference
title: 백준 4013 ATM - SCC와 위상정렬
tags:
  - 알고리즘
  - 코딩테스트
  - "#scc"
  - "#topological-sort"
  - "#graph"
categories: null
createdAt: 2025-06-02 18:00
lastmod: 2025-06-02 18:00
lang: ko
pin: true
math: true
mermaid: true
permalink: baekjoon-4013-atm-scc-topological-sort
---

## 문제 유형

이 문제는 **강한 연결 컴포넌트(Strongly Connected Component, SCC)**와 **위상 정렬(Topological Sort)**을 조합한 고급 그래프 문제입니다.

핵심 아이디어는:
1. 원본 그래프에서 SCC를 찾아서 각 컴포넌트를 하나의 노드로 압축
2. 압축된 DAG(Directed Acyclic Graph)에서 위상 정렬을 통해 최대 현금을 구함

## 접근 방법

### 1단계: 문제 분석

- 일방통행 도로로 이루어진 그래프에서 시작점에서 출발해 레스토랑 중 하나에 도달
- 경로상 모든 ATM에서 현금 인출 (같은 교차로 재방문 시 추가 인출 불가)
- 사이클이 있다면 그 사이클 내의 모든 현금을 인출할 수 있음

### 2단계: SCC 압축

사이클을 하나의 노드로 압축하면:
- 각 SCC 내부의 모든 현금을 합쳐서 하나의 값으로 처리
- SCC들 간의 관계는 DAG가 됨

### 3단계: 위상 정렬로 최대값 계산

압축된 DAG에서 시작 SCC부터 레스토랑이 있는 SCC까지의 경로 중 현금 합이 최대인 경로를 찾음

## 내가 했던 실수와 해결

### 실수 1: 위상 정렬 초기화 오류

```cpp
// ❌ 잘못된 방식
queue<int> q;
q.push(startScc); // 시작 SCC만 큐에 삽입

while (!q.empty()) {
    int curr = q.front();
    q.pop();
    // 시작점 체크 로직 없음
}
```

### 실수 2: 시작점 플래그 누락

위상 정렬에서 시작점이 startScc인지 확인하는 로직이 없어서 올바른 계산이 되지 않았습니다.

### 해결 방법

```cpp
// ✅ 올바른 방식
queue<int> q;
// in-degree가 0인 모든 SCC를 큐에 삽입
for (int i = 0; i < sccCount; i++) {
    if (indegree[i] == 0) {
        q.push(i);
    }
}

vector<bool> visited(sccCount, false);
while (!q.empty()) {
    int curr = q.front();
    q.pop();
    
    // 시작점에서 도달 가능한지 확인
    if (curr == startScc || visited[curr]) {
        visited[curr] = true;
        // DP 계산 로직
        for (int next : sccGraph[curr]) {
            indegree[next]--;
            if (indegree[next] == 0) {
                q.push(next);
            }
        }
    }
}
```

## 핵심 깨달음

### 위상 정렬의 올바른 이해

위상 정렬은 **전체 DAG의 노드들을 의존성 순서에 따라 정렬**하는 것입니다. 

- 시작점이 특정 노드라고 해서 그 노드만 큐에 넣고 시작하는 것이 아님
- **모든 in-degree가 0인 노드**를 큐에 넣고 시작해야 함
- 대신 방문 가능성을 별도로 체크해서 실제로 시작점에서 도달 가능한 노드만 처리

### SCC + 위상정렬 패턴

이런 유형의 문제에서는:
1. [[백준 2533 SNS, Tree DP 풀이 전략|Tree DP]]처럼 구조를 단순화한 후
2. 단순화된 구조에서 최적화 문제를 해결하는 패턴

이 문제를 통해 위상 정렬이 단순히 "한 점에서 시작하는 탐색"이 아니라 "전체 그래프의 의존성 순서를 보장하는 정렬"이라는 점을 명확히 이해할 수 있었습니다.

## 통과한 코드

```cpp
#include <iostream>   
#include <vector>
#include <climits>
#include <algorithm>
#include <stack>
#include <functional>
#include <queue>
using namespace std;
vector<vector<int>> graph;
vector<int> cash;
vector<bool> isRest;
vector<vector<int>> SCC;
vector<int> id;
vector<bool> finished;
stack<int> s;
int idNum;
int sccNum;
vector<int> nodeToScc;
vector<int> sccInDegree;
vector<bool> sccContainRest;
vector<vector<int>> sccGraph;
vector<int> sccTotalCash;
int main() {
	ios::sync_with_stdio(false);
	cin.tie(0);
	cout.tie(0);
	int N, M; cin >> N >> M;
	graph.resize(N + 1);
	cash.resize(N + 1);
	id.resize(N + 1);
	finished.resize(N + 1);
	nodeToScc.resize(N + 1);
	idNum = 1;
	sccNum = 0;
	isRest.assign(N + 1, 0);
	for (int i = 0; i < M; ++i)
	{
		int a, b; cin >> a >> b;
		graph[a].push_back(b);
	}
	for (int i = 1; i <= N; ++i)
	{
		cin >> cash[i];
	}
	// S: start node, P: # of restaurant
	int S, P;
	cin >> S >> P;
	for (int i = 0; i < P; ++i)
	{
		int restaurant; cin >> restaurant;
		isRest[restaurant] = true;
	}
	function<int(int)> DFS = [&](int n) -> int
		{
			id[n] = idNum++;
			s.push(n);
			int result = id[n];
			for (auto& next : graph[n])
			{
				if (id[next] == 0)
				{
					result = min(result, DFS(next));
				}
				else if (!finished[next])
				{
					result = min(result, id[next]);
				}
			}
			if (result == id[n])
			{
				vector<int> scc;
				int totalCash = 0;
				while (true)
				{
					int top = s.top();
					s.pop();
					finished[top] = true;
					scc.push_back(top);
					nodeToScc[top] = sccNum;
					totalCash += cash[top];
					if (top == n) break;
				}
				SCC.push_back(scc);
				sccTotalCash.push_back(totalCash);
				sccNum++;
			}
			return result;
		};
	for (int node = 1; node <= N; ++node)
	{
		if (id[node] == 0) DFS(node);
	}
	sccGraph.resize(sccNum);
	sccInDegree.assign(sccNum, 0);
	sccContainRest.assign(sccNum, false);
	for (int node = 1; node <= N; ++node)
	{
		int sccA = nodeToScc[node];
		for (auto& next : graph[node])
		{
			int sccB = nodeToScc[next];
			if (sccA != sccB)
			{
				sccGraph[sccA].push_back(sccB);
				sccInDegree[sccB]++;
			}
		}
		if (isRest[node] && !sccContainRest[sccA])
		{
			sccContainRest[sccA] = true;
		}
	}
	vector<int> maxCash(sccNum, 0);
	queue<int> q;
	int startScc = nodeToScc[S];
	maxCash[startScc] = sccTotalCash[startScc];
	for (int i = 0; i < sccNum; ++i)
	{
		if (sccInDegree[i] == 0) q.push(i);
	}
	bool flag = false;
	while (!q.empty())
	{
		int current = q.front();
		q.pop();
		if (current == startScc) flag = true;
		for (int next : sccGraph[current])
		{
			if (flag)
			{
				maxCash[next] = max(maxCash[next], maxCash[current] + sccTotalCash[next]);
			}
			if (--sccInDegree[next] == 0)
			{
				q.push(next);
			}
		}
	}
	int ans = 0;
	for (int i = 0; i < sccNum; ++i)
	{
		if (sccContainRest[i]) ans = max(ans, maxCash[i]);
	}
	cout << ans << '\n';
	return 0;
}
```

### 코드의 핵심 포인트

1. **Tarjan 알고리즘으로 SCC 찾기**: `function<int(int)> DFS` 람다 함수 사용
2. **SCC 압축**: 각 SCC의 현금 합계와 레스토랑 포함 여부를 미리 계산
3. **올바른 위상 정렬**: 모든 in-degree 0인 SCC를 큐에 삽입
4. **플래그를 통한 도달 가능성 체크**: `flag` 변수로 시작 SCC에서 도달 가능한지 확인

특히 위상 정렬 부분에서 `flag` 변수를 사용해 시작점에서 도달 가능한 경우에만 DP 계산을 수행하는 것이 핵심입니다.

## 관련 문제들

- [[백준 1949 우수마을, Maximum Independent Dominating Set|백준 1949 우수마을]]: Tree DP로 구조 단순화
- [[백준 2533 SNS, Tree DP 풀이 전략|백준 2533 SNS]]: Tree에서의 최적화 문제

SCC와 위상정렬의 조합은 복잡한 그래프 문제를 해결하는 강력한 도구임을 다시 한번 확인할 수 있는 문제였습니다.
