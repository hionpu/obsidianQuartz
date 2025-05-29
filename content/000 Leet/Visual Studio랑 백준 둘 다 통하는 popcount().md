---
title: Visual Studio랑 백준 둘 다 통하는 popcount()
tags:
  - "#알고리즘"
categories: null
createdAt: 2025-05-13 17:41
lastmod: 2025-05-13 17:41
lang: ko
pin: true
math: true
mermaid: true
permalink: visual-studio-baekjoon-compatible-popcount
---
[[__builtin_popcount() 들여다보기]]

parellel popcount를 gcc에서는 `__builtint_popcount()` 로 쓸 수 있지만 visual studio에서는 못써요. 대신

```cpp
inline int popcount(unsigned int x) {
#if defined(__GNUC__) || defined(__clang__)
    return __builtin_popcount(x);
#elif defined(_MSC_VER)
    return __popcnt(x);
#else
    // Parallel bit count (Hacker's Delight)
    x = x - ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    x = (x + (x >> 4)) & 0x0F0F0F0F;
    x = x + (x >> 8);
    x = x + (x >> 16);
    return x & 0x3F;
#endif
}
```

이렇게 해놓고 popcount를 쓰면 백준에 코드 제출할때 수정 안해도 됩니다 개꿀 ㅋㅋㅋ