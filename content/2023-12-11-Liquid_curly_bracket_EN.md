---
Title: Displaying Liquid Curly Brackets As it is
tags:
  - "#html"
  - "#liquid"
  - "#escape"
  - "#curlybracket"
Categories:
  - html
CreatedAt: December 11, 2023, 17:12
LastMod: December 11, 2023, 17:12
Language: ko
Permalink: /posts/liquid_curly_bracket
Pin: true
Math: true
Mermaid: true
---
# 1. In HTML Syntax
Using 
>&#38;\#123; 
and 
>&#38;\#125;

seems to be the most convenient way. The issue arises when you need to insert &#123;&#123; something &#125;&#125; inside a code block.

# 2. Double Curly Brackets Inside a Code Block When .md Files are Converted to HTML

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/de9c4ac4-36c4-456a-8f15-511773299c9b)

Using 

&#123;% raw %}{&#123; date }} {&#123; time }}&#123;% endraw %}

is the solution.
