---
id: "3c"
type: permanent
created: 2026-05-15
tags: [tech-stack, directx, graphics, hlsl]
up: "[[3 기술 스택]]"
---

# 3c DirectX 그래픽스

핵심 모델: **CPU는 명령을 제출하고, GPU가 실행한다.**
`Device`와 `DeviceContext`의 분리가 이 모델을 구현.

## Device vs DeviceContext

| | Device | DeviceContext |
|---|--------|--------------|
| 역할 | 리소스 생성 | 렌더링 명령 실행 |
| 사용 시점 | 초기화 | 매 프레임 |
| 예시 | Buffer, Texture 생성 | Draw 호출, 셰이더 설정 |

## 렌더링 파이프라인 순서

```
1. Vertex Buffer → 정점 데이터 GPU에 전달
2. Vertex Shader (HLSL) → 정점 변환 (Model → World → View → Clip)
3. Rasterizer → 정점을 픽셀로 변환
4. Pixel Shader (HLSL) → 각 픽셀 색상 결정
5. Output Merger → 최종 렌더 타겟에 출력
```

## 행렬 변환 순서
`World → View → Projection`
- World: 오브젝트 위치·회전·크기
- View: 카메라 시점으로 변환
- Projection: 원근감 적용 (3D → 2D)

셰이더에서: `output.pos = mul(mul(mul(input.pos, world), view), proj)`

---


## 관련 레퍼런스
- [[World, View, Projection matrix]]
- [[2024-12-06 Device 와 DeviceContext]]
- [[24-12-10-Buffers, Shaders, and HLSL]]
- [[linetype 작업]]
