---
title: 
tags: 
categories: 
createdAt: 2024-12-18 15:45
lastmod: 2024-12-18 15:45
lang: ko
pin: true
math: true
mermaid: true
---
rastertek.com에서 dx11 튜토리얼 공부 => hlsl 코드 이해 

=> LocalSpaceRendering인 경우의 `if`  블럭에서 line shape 패턴 인스턴스에 대한 matrix의 offset 부분(`_m30_m31_m32`)에 `input.offset`을 할당해 줌 => 위치 벗어났던거 수정됨

shape의 원래 모델은 polyline인데 polyline의 각 점만 표현됨 => shape node의 렌더 테크닉의 default shader list 중 GS와 PS가 각각 `GSPointClipPlane` 과 `PSPoint`인 점 의심 => GS는 `GSLineClipPlane`, PS는 `PSLine`으로 변경했더니 약간의 문제(아래)가 있지만  polyline이 정상적으로 표시됨

상기된 문제: polyline으로 구성된 shape이 일부가 안보임 => 자세히(확대해서) 보니까 점점 흐려지는거같음(fading 관련인가 의심)

(비정상 케이스의 화질이 구린것을 감안하세요)

정상
![[Pasted image 20241219134649.png]]

비정상 - 화살표의 일부가 뜯어먹힌것처럼 보임 
![[Pasted image 20241219134714.png]]

fading 관련은 pixel shader에서 계산되는거로 보여서 렌더테크닉의 PSLine -> PSLineColor로 변경했더니 정상적으로 출력됨

PSLineColor로 변경하는게 올바른 해결 방법이 아닌 것으로 보임(patternLength에 따른 계산 등이 없고 그냥 받은 그대로 색상 표현하므로)

`psLine`의 `if (patternLength >0)` 아래 블럭에서 
```c
float4 texColor = texDiffuseMap.SampleLevel(samplerBillboard, input.tex.xy, 0);
```
부분의 
`input.tex.xy`를 `input.tex.yz` 로 변경했더니 사라진 라인 구성이 변함(다른 부분이 사라짐)

`psLine`은 line shape node가 아닌 일반 다른 line 관련된 모델을 렌더링 하기 위해서도 쓰이고 있고 정상작동 하므로 위 코드의 `texColor`를 계산하는 방법이나 파라미터형식 잘못됐을 확률(`input.tex.yz`라고 해야 했다던가)은 적어 보임 => `input.tex`의 값이 틀렸을 경우부터 확인

해당 모델의 Shader path는 다음과 같은 단계의 렌더링 파이프를 거친다
1. 픽셀 쉐이더: `vsPointClipInstancing` - Clipping과 Instancing(라인 타입 패턴에 대한 인스턴스) 정보만 추가로 가지고 `vsPoint` 쉐이더의 `main`함수 호출 => 결국 `vsPointLine`
2. 지오메트리 쉐이더: `GSLine`
3. 픽셀 쉐이더: `PSLine`

`PSLine`의 `input.tex`는 `GSLine`에서 결정해주는데 
```c
output.tex = float3(texMin, ?, polyLineLength);
또는
output.tex = float3(texMax, ?, polyLineLength);
```
여기서 `?`는 대충 조건에 따라 특정 인트로 들어가는 모양새

polyLineLength 부분은 픽셀 쉐이더`PSLine` 에서 `input.tex.xy`처럼 `z`성분을 사용하지 않으므로 상관 없고

그러면 이 `texMin`과 `texMax`는 어디서 정의하는지 보면

```c
 float texMin = segmentStartOffset / max(1e-5, texScale); // start u
 float texMax = (segmentStartOffset + segmentLength) / max(1e-5, texScale); // end u
```
그리고 `segmentStartOffset`과 `segmentLength`는 

```c
 float segmentLength = length(input[startIndex].wp.xyz - input[startIndex + 1].wp.xyz);
 float segmentStartOffset = input[startIndex].offset;
```

여기서의 `input`이라 하면 `vsPointClipInstancing` => `vsPointLine` 에서 전달해 준건데, 처음에 shape의 위치 관련 오류를 수정할 때 코드를 보면서 `vsPointLine` 에서 `input.offset`에다가 무엇을 할당해 준 기억이 없다. 그런데 
```c
float segmentStartOffset = input[startIndex].offset;
```
내가 할당해준 적 없는(기존 코드에서도 할당하는 부분이 없었음) `input.offset`을 여기서 사용하고 있음

`vsPointLine`로 가서 `InstancingParam`이 있는 경우의 `if` 블럭 안에서
```c
output.offset = input.offset;
```
을 추가해 주었다. `offset` 은 다른 점들에 대한 world, view, projection 매트릭스 연산을 안해줘도 되는가? 싶지만 일단 넣음

성공

CommonBuffer는 Material에 따라 정해지는것으로 보이는데  line의 경우 Pointline 인듯

