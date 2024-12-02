---
title: Liquid curly bracket 그대로 표시하기
tags:
  - "#html"
  - "#liquid"
  - "#escape"
  - "#curlybracket"
categories:
  - html
createdAt: 2023-12-11 17:12
lastmod: 2023-12-11 17:12
lang: ko
permalink: /posts/liquid_curly_bracket
pin: true
math: true
mermaid: true
---
# 1. html 문법에서
>&#38;\#123; 
와
>&#38;\#125;

를 사용하는 것이 가장 편한것 같다. 문제는 코드 블럭 안에 &#123;&#123; something &#125;&#125; 를 넣어야 할 때이다.

# 2. .md파일이 html로 변경될 상황에서 코드블럭 내부의 이중 curly bracket

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/de9c4ac4-36c4-456a-8f15-511773299c9b)
 

&#123;% raw %}{&#123; date }} {&#123; time }}&#123;% endraw %}

를 사용하면 된다.