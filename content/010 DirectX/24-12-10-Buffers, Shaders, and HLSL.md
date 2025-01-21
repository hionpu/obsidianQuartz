---
title: Buffers, Shaders, and HLSL
tags:
  - "#directX"
  - "#graphics"
  - "#buffer"
  - "#shader"
  - "#hlsl"
categories: 
createdAt: 2024-12-10 11:27
lastmod: 2024-12-10 11:27
lang: ko
pin: true
math: true
mermaid: true
---
https://www.rastertek.com/ 의 DirectX 튜토리얼(4편)을 번역한 내용입니다.

# `.vs` , `.ps` vs `.hlsl`
.vs와 .ps 파일은 보통 정해진 셰이더 스테이지(버텍스 셰이더, 픽셀 셰이더)를 명확히 하기 위해 사용되는 확장자이고 .hlsl 파일은 확장자만으로 셰이더 종류를 특정하지 않는 일반적인 HLSL 코드 파일을 말합니다. 각 파일 내용은 hlsl 코드로 동일합니다.

`.vs`는 vertex shader, `.ps`는 pixel shader라고 확장자로 용도를 명시할 수 있어서 가독성에 도움을 줄 수 있겠습니다.

`.vs`, `.ps`, `.hlsl` 모두 컴파일할 때 `D3DCompileFromFils("shader.vs", ...)` 또는 `D3DCompileFromFile("Shader.hlsl", ...)`처럼 같은 방식으로 컴파일하면 되고 이  함수에 `"vs_5_0", "ps_5_0"` 등의 파라미터를 넘기면서 타입을 결정하게 됩니다.
[[2024-12-06 Device 와 DeviceContext]]



