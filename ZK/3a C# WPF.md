---
id: "3a"
type: permanent
created: 2026-05-15
tags: [tech-stack, csharp, wpf]
up: "[[3 기술 스택]]"
---

# 3a C# WPF

핵심 모델: **MVVM (Model-View-ViewModel)**
View는 XAML, ViewModel은 C#, Model은 비즈니스 로직. View는 ViewModel을 바인딩으로만 안다.

## UI 스레드 규칙

WPF의 모든 UI 요소는 **Dispatcher 스레드**에서만 수정 가능.

```csharp
// 다른 스레드에서 UI 업데이트 시
Application.Current.Dispatcher.Invoke(() => {
    myLabel.Content = "업데이트";
});

// 또는 async/await 패턴 (더 권장)
await Task.Run(() => BackgroundWork());
myLabel.Content = "완료"; // await 이후는 UI 스레드
```

## 주요 함정

| 상황 | 문제 | 해결 |
|------|------|------|
| 고해상도 이미지 렌더링 | 매 프레임 BitmapImage 재생성 → GC 폭발 | WriteableBitmap 캐싱 |
| 백그라운드 작업 결과 UI 반영 | `Cross-thread operation` 예외 | Dispatcher.Invoke 또는 async/await |
| 단일 구현 인터페이스 남발 | 불필요한 추상화 계층 | → [[2b 인터페이스 설계]] |

## DirectX와의 연계
WPF 렌더러 위에서 DirectX를 쓰려면 D3DImage 또는 별도 창 활용.
→ [[3c DirectX 그래픽스]] 참고.

---


## 관련 레퍼런스
- [[WriteableBitmap을 이용한 성능 최적화 및 UI 스레드 블로킹 최소화]]
- [[UI Control에 고해상도 이미지 채울 때 stuttering 최적화]]
- [[구현체가 1개뿐인 인터페이스]]
- [[using과 MemoryStream 활용하기]]
