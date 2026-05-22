---
type: reference
created: 2026-05-15
---

# 세그먼트 트리 업데이트: Lazy Propagation 유무에 따른 차이점

세그먼트 트리는 특정 구간의 합, 최솟값, 최댓값 등을 빠르게 찾거나 갱신할 때 사용되는 강력한 자료구조입니다. 이 트리에서 값을 갱신하는 방식은 크게 두 가지로 나눌 수 있는데, 바로 **Lazy Propagation(게으른 전파)**을 사용하는 경우와 사용하지 않는 경우입니다. 이 두 가지 방식의 `update` 함수가 어떻게 다른지 자세히 알아보겠습니다.

## 1. Lazy Propagation을 사용하지 않은 Segment Tree의 `update`

Lazy Propagation을 사용하지 않는 일반적인 세그먼트 트리는 주로 **단일 원소(point update)**의 값을 갱신할 때 효율적입니다. 특정 인덱스의 값을 변경하고 싶을 때 사용하죠.

### 동작 방식

1. **재귀적 하향 탐색:** `update` 함수는 갱신하고자 하는 **인덱스(`idx`)**를 찾을 때까지 트리의 리프 노드 방향으로 재귀적으로 내려갑니다.
    
2. **리프 노드 갱신:** `idx`에 해당하는 리프 노드에 도달하면 해당 노드의 값을 새로운 값(`val`)으로 직접 갱신합니다.
    
3. **상향식 전파:** 리프 노드의 값이 갱신된 후, 재귀 호출이 다시 상위로 반환되면서 부모 노드들의 값을 자식 노드들의 갱신된 값으로 **다시 계산하여 갱신**합니다 (예: 두 자식 노드의 합으로 부모 노드의 합을 갱신).
    

이 방식은 하나의 원소를 갱신하는 데 $O(\log N)$의 시간 복잡도를 가집니다. 하지만 만약 **범위(range)에 대한 업데이트** (예: "인덱스 3부터 7까지 모든 값에 5를 더하시오")가 필요하다면, 해당 범위 내의 모든 원소를 개별적으로 갱신해야 하므로 총 $O((R-L+1) \cdot \log N)$의 시간이 소요되어 매우 비효율적입니다.

### C++ `update` 함수 (Lazy Propagation 미사용)

```
// tree: 세그먼트 트리 배열
// node: 현재 노드의 인덱스
// start, end: 현재 노드가 커버하는 범위
// idx: 갱신할 원소의 인덱스
// val: 갱신할 값
void update_no_lazy(vector<long long>& tree, int node, int start, int end, int idx, long long val) {
    // 갱신할 인덱스가 리프 노드에 도달하면 값 갱신
    if (start == end) {
        tree[node] = val;
        return;
    }

    int mid = (start + end) / 2;
    // 갱신할 인덱스가 왼쪽 자식 범위에 있는지 확인
    if (idx <= mid) {
        update_no_lazy(tree, node * 2, start, mid, idx, val);
    }
    // 갱신할 인덱스가 오른쪽 자식 범위에 있는지 확인
    else {
        update_no_lazy(tree, node * 2 + 1, mid + 1, end, idx, val);
    }
    // 자식 노드의 갱신이 끝난 후 부모 노드의 값 갱신 (예: 합)
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
}
```

## 2. Lazy Propagation을 사용한 Segment Tree의 `update`

Lazy Propagation은 **범위 갱신(range update)** 연산을 효율적으로 처리하기 위해 고안된 기법입니다. "게으른 전파"라는 이름처럼, 갱신이 필요한 노드에 대한 정보를 `lazy` 배열에 저장해두고, 실제로 그 정보가 필요해질 때까지(예: 쿼리가 들어올 때) 하위 노드로의 전파를 **지연**시킵니다.

### 동작 방식

1. **지연된 갱신 처리:** `update` 함수가 호출되면, 현재 노드에 **지연된 갱신(`lazy` 값)**이 있는지 먼저 확인하고, 있다면 이를 현재 노드에 적용한 후 자식 노드들에게 전파하고 자신의 `lazy` 값을 초기화합니다.
    
2. **범위 포함 여부 확인:**
    
    - **완전 포함:** 현재 노드의 범위(`start`, `end`)가 갱신하고자 하는 범위(`left`, `right`)를 완전히 포함한다면, 더 이상 자식 노드로 내려가지 않고 현재 노드에만 갱신 값(`diff`)을 적용하고 `lazy` 배열에 해당 갱신 정보를 저장합니다.
        
    - **부분 포함/겹침:** 현재 노드의 범위가 갱신 범위와 겹치지만 완전히 포함하지 않는다면, 재귀적으로 자식 노드들로 내려가서 갱신 작업을 수행합니다.
        
3. **상향식 전파:** 자식 노드들의 갱신이 끝난 후, 부모 노드의 값을 자식 노드들의 값으로 다시 계산하여 갱신합니다.
    

이 방식을 통해 범위 갱신 또한 $O(\log N)$의 시간 복잡도로 처리할 수 있게 됩니다. 범위 갱신이 잦은 문제에서 Lazy Propagation은 필수적인 최적화 기법입니다.

### C++ `update` 함수 (Lazy Propagation 사용)

```
// tree: 세그먼트 트리 배열
// lazy: 지연된 갱신 정보를 담은 배열 (lazy[node]는 node가 담당하는 구간에 적용되어야 할 값)
// node: 현재 노드의 인덱스
// start, end: 현재 노드가 커버하는 범위
// left, right: 갱신할 범위의 시작과 끝
// diff: 갱신할 값 (더하거나 빼는 값)
void update_lazy(vector<long long>& tree, vector<long long>& lazy, int node, int start, int end, int left, int right, long long diff) {
    // 1. 지연된 갱신이 있으면 먼저 처리
    if (lazy[node] != 0) {
        // 현재 노드의 값에 lazy 값을 적용 (구간의 길이를 곱해줌)
        tree[node] += (end - start + 1) * lazy[node];
        // 리프 노드가 아니면 자식에게 lazy 값을 전파
        if (start != end) {
            lazy[node * 2] += lazy[node];
            lazy[node * 2 + 1] += lazy[node];
        }
        lazy[node] = 0; // 현재 노드의 lazy 값 초기화
    }

    // 2. 현재 노드의 범위가 갱신 범위에 전혀 포함되지 않으면 종료
    if (start > end || start > right || end < left) {
        return;
    }

    // 3. 현재 노드의 범위가 갱신 범위를 완전히 포함하면
    if (left <= start && end <= right) {
        // 현재 노드의 값에 diff를 적용
        tree[node] += (end - start + 1) * diff;
        // 리프 노드가 아니면 자식에게 전파할 lazy 값 저장
        if (start != end) {
            lazy[node * 2] += diff;
            lazy[node * 2 + 1] += diff;
        }
        return;
    }

    // 4. 현재 노드의 범위가 갱신 범위와 부분적으로 겹치면, 자식 노드로 재귀 호출
    int mid = (start + end) / 2;
    update_lazy(tree, lazy, node * 2, start, mid, left, right, diff);
    update_lazy(tree, lazy, node * 2 + 1, mid + 1, end, left, right, diff);

    // 5. 자식 노드의 갱신이 끝난 후 부모 노드의 값 갱신 (자식 노드의 값 합산 등)
    tree[node] = tree[node * 2] + tree[node * 2 + 1];
}
```

## 3. Lazy Propagation과 연산의 결합 법칙 (Associativity)

Lazy Propagation은 모든 종류의 범위 업데이트에 적용될 수 있는 것은 아닙니다. Lazy Propagation을 효과적으로 사용하려면, 세그먼트 트리가 수행하는 연산이 **결합 법칙(Associativity)**을 따라야 합니다.

### 결합 법칙이란?

결합 법칙이란 $(A \cdot B) \cdot C = A \cdot (B \cdot C)$와 같이 여러 연산이 있을 때 연산 순서에 관계없이 결과가 동일하게 나오는 성질을 말합니다. 세그먼트 트리에서 주로 다루는 연산인 합(Sum), 최솟값(Min), 최댓값(Max), XOR 등은 모두 결합 법칙을 따릅니다.

### 왜 결합 법칙이 중요할까?

Lazy Propagation의 핵심은 상위 노드에 저장된 **"지연된 갱신" 정보(`lazy` 값)**를 하위 노드로 전파할 때, 이미 하위 노드에 적용되어야 할 다른 지연된 갱신 정보가 있을 경우, 이 둘을 **안전하게 합칠 수 있어야 한다**는 것입니다.

예를 들어,

1. 어떤 구간에 `+5`를 더하라는 `lazy` 값이 있는데,
    
2. 나중에 다시 그 구간에 `+3`을 더하라는 새로운 `lazy` 값이 들어왔을 때,
    
3. 이 두 갱신을 합쳐서 `+8`을 더하라는 식으로 처리할 수 있는 것이 결합 법칙 덕분입니다. 즉, `(원래 값 + 5) + 3`과 `원래 값 + (5 + 3)`이 같기 때문에 지연된 갱신들을 단순히 더해서 누적할 수 있습니다.
    

만약 연산이 결합 법칙을 따르지 않는다면, `lazy` 배열에 여러 갱신 정보를 쌓아두었을 때, 어떤 순서로 이 갱신들을 처리해야 할지, 혹은 이 갱신들을 어떻게 합쳐야 할지 명확하지 않아지거나 결과가 달라질 수 있습니다.

### 결론: 결합 법칙이 성립하지 않는 경우

따라서, 연산이 결합 법칙을 따르지 않는 세그먼트 트리에서 범위 업데이트가 필요하다면, Lazy Propagation의 이점을 누릴 수 없습니다. 이 경우, **해당 범위에 있는 모든 원소에 대해 단일 원소 업데이트(point update)를 반복**해야 할 가능성이 높으며, 이는 $O((R-L+1) \cdot \log N)$의 시간 복잡도를 가지게 됩니다.

## 최종 결론: 언제 어떤 방식을 사용해야 할까?


|            | **Lazy Propagation 미사용**                      | **Lazy Propagation 사용**            |
| ---------- | --------------------------------------------- | ---------------------------------- |
| **갱신 대상**  | 주로 **단일 원소(Point Update)**                    | 주로 **범위(Range Update)**            |
| **시간 복잡도** | 단일 갱신: O(logN) <br> 범위 갱신: O((R−L+1)cdotlogN) | 단일 갱신: O(logN) <br> 범위 갱신: O(logN) |
| **활용 분야**  | 배열의 특정 값만 자주 바뀌는 문제                           | 특정 구간의 값들이 일괄적으로 자주 바뀌는 문제         |
| **구현 복잡도** | 비교적 간단함                                       | `lazy` 배열 관리 및 전파 로직으로 인해 더 복잡함    |
| **연산 제약**  | 연산 종류에 큰 제약 없음                                | 연산이 **결합 법칙**을 따라야 함               |

요약하자면, 프로그램에서 **단일 원소에 대한 갱신만 필요**하고 범위 갱신이 거의 없다면 Lazy Propagation 없이 간단한 세그먼트 트리를 사용하는 것이 좋습니다. 하지만 **넓은 범위의 값들을 한꺼번에 자주 갱신**해야 하고, 사용하는 연산이 **결합 법칙을 만족**한다면, Lazy Propagation을 적용한 세그먼트 트리가 훨씬 효율적이고 필수적입니다.