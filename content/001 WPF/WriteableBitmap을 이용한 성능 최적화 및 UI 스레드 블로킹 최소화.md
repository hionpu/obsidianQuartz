---
title: WriteableBitmap을 이용한 성능 최적화 및 UI 스레드 블로킹 최소화
tags:
  - "#WPF"
  - "#CSharp"
  - "#Bitmap"
categories: WPF
createdAt: 2025-04-25 15:05
lastmod: 2025-04-25 15:05
lang: ko
pin: true
math: true
mermaid: true
---
WPF 애플리케이션에서 이미지 처리는 UI 반응성에 큰 영향을 미칠 수 있습니다. 특히 고해상도 이미지를 로드하거나 처리할 때 발생하는 UI 스레드 블로킹은 사용자 경험을 저하시키는 주요 원인입니다. 현재 개발중인 WPF 프로젝트에서도 `ListView`에서 항목을 클릭하면 8K 이미지를 서버에서 받고 화면에 표시하고 있는데 이 때 스터터링Stuttering이 항상 발생했습니다. 이것을 해결하기 위해`WriteableBitmap`을 사용해보았습니다.

## BitmapImage와 WriteableBitmap 비교

일반적으로 WPF에서 이미지를 표시할 때 `BitmapImage` 클래스를 많이 사용합니다:

csharp

```csharp
// 일반적인 BitmapImage 사용 방식
BitmapImage? bitmap = await Application.Current.Dispatcher.InvokeAsync(() =>
{
    try
    {
        var bmp = new BitmapImage();
        using (var ms = new MemoryStream(imageData))
        {
            bmp.BeginInit();
            bmp.CacheOption = BitmapCacheOption.OnLoad;
            bmp.StreamSource = ms;
            bmp.EndInit();
        }
        if (bmp.CanFreeze)
            bmp.Freeze();
        return bmp;
    }
    catch (Exception ex)
    {
        // 오류 처리
        return null;
    }
}, System.Windows.Threading.DispatcherPriority.Background);
```

그러나 이 방식은 내부적으로 이미지 변환 과정이 UI 스레드에서 처리되어 애플리케이션이 끊기는 현상(stuttering)을 유발할 수 있습니다.

대안으로 `WriteableBitmap`과 `FormatConvertedBitmap`을 함께 사용하면 성능을 크게 개선할 수 있습니다:

## 최적화된 이미지 처리 파이프라인

csharp

```csharp
// 1단계: 백그라운드 스레드에서 이미지 디코딩 및 픽셀 데이터 추출
await Task.Run(() =>
{
    try
    {
        using (var ms = new MemoryStream(imageData))
        {
            // 이미지 디코더 생성
            decoder = BitmapDecoder.Create(
                ms,
                BitmapCreateOptions.None,
                BitmapCacheOption.OnLoad);
                
            // 이미지 크기 정보 추출
            pixelWidth = decoder.Frames[0].PixelWidth;
            pixelHeight = decoder.Frames[0].PixelHeight;
            
            // 표준 형식으로 변환(FormatConvertedBitmap 사용)
            FormatConvertedBitmap convertedBitmap = new FormatConvertedBitmap(
                decoder.Frames[0],
                pixelFormat,  // 일관된 픽셀 형식(Bgra32)으로 변환
                null,
                0);
                
            // 픽셀 데이터 추출
            int stride = (pixelWidth * pixelFormat.BitsPerPixel + 7) / 8;
            pixelData = new byte[stride * pixelHeight];
            convertedBitmap.CopyPixels(pixelData, stride, 0);
        }
    }
    catch (Exception ex)
    {
        Logger.WriteLog(LogType.Error, $"Error decoding image: {ex.Message}");
    }
});

// 2단계: UI 스레드에서 WriteableBitmap 생성 및 픽셀 데이터 적용
writeableBitmap = await this.Dispatcher.InvokeAsync(() =>
{
    try
    {
        // WriteableBitmap 생성
        var bitmap = new WriteableBitmap(
            pixelWidth,
            pixelHeight,
            96, 96,  // 기본 DPI
            pixelFormat,
            null);
            
        // 픽셀 데이터 쓰기
        int stride = (pixelWidth * pixelFormat.BitsPerPixel + 7) / 8;
        bitmap.WritePixels(
            new Int32Rect(0, 0, pixelWidth, pixelHeight),
            pixelData,
            stride,
            0);
            
        // 성능 향상을 위해 가능하면 Freeze
        if (bitmap.CanFreeze)
            bitmap.Freeze();
            
        return bitmap;
    }
    catch (Exception ex)
    {
		// skip
    }
}, System.Windows.Threading.DispatcherPriority.Background);

// 3단계: 렌더링 품질 설정 및 이미지 적용
var imageBrush = (System.Windows.Media.ImageBrush)this.grid_scrollviewer.Background;
RenderOptions.SetBitmapScalingMode(imageBrush, BitmapScalingMode.HighQuality);
imageBrush.ImageSource = writeableBitmap;
```

## 최적화 핵심 요소 분석

### 1. 작업 분리 및 백그라운드 처리

이미지 처리 작업을 CPU 집약적인 부분과 UI 관련 부분으로 분리합니다:

- **백그라운드 스레드에서 수행**:
    - 이미지 디코딩
    - 픽셀 형식 변환
    - 픽셀 데이터 추출
- **UI 스레드에서 수행**:
    - WriteableBitmap 생성
    - 픽셀 데이터 쓰기
    - 이미지 소스 설정

### 2. FormatConvertedBitmap의 활용

csharp

```csharp
FormatConvertedBitmap convertedBitmap = new FormatConvertedBitmap(
    decoder.Frames[0],
    pixelFormat,  // 일반적으로 PixelFormats.Bgra32
    null,
    0);
```

이 클래스는 다양한 이미지 형식을 일관된 형식으로 변환하는 역할을 합니다:

- **일관된 픽셀 형식**: 항상 Bgra32 같은 일관된 형식으로 변환하여 후속 처리 단순화
- **렌더링 최적화**: GPU 가속 렌더링에 최적화된 형식 사용
- **알파 채널 처리**: 투명도 정보가 올바르게 처리됨

### 3. stride 계산의 중요성

csharp

```csharp
int stride = (pixelWidth * pixelFormat.BitsPerPixel + 7) / 8;
```

이 계산은 픽셀 데이터 행의 바이트 크기를 결정합니다:

- **메모리 정렬**: `+7`과 `/8`의 조합은 8비트(1바이트) 경계에 정렬하기 위함
- **메모리 최적화**: 적절한 stride 값은 메모리 접근 효율성 향상
- **하드웨어 호환성**: 일부 그래픽 하드웨어는 특정 메모리 정렬을 요구

### 4. DispatcherPriority 활용

csharp

```csharp
await this.Dispatcher.InvokeAsync(() => { 
    // WriteableBitmap 생성 코드
}, System.Windows.Threading.DispatcherPriority.Background);
```

UI 스레드 작업을 최소화하고 우선순위를 조정하여 UI 반응성을 유지합니다:

- **Background 우선순위**: UI 상호작용보다 낮은 우선순위로 실행되어 UI 반응성 유지
- **비동기 처리**: `InvokeAsync`와 `await`를 사용하여 UI 스레드 블로킹 방지

## 성능 개선 효과
1. **UI 반응성 향상**: 무거운 이미지 처리가 UI 스레드를 차단하지 않음
2. **메모리 효율성**: 표준화된 픽셀 형식과 최적화된 메모리 레이아웃
3. **렌더링 성능**: 일관된 픽셀 형식으로 GPU 가속 최적화
4. **끊김 현상(stuttering) 감소**: 이미지 로딩 및 처리 중에도 UI가 반응함 << 이게 제일 중요하죠

## 주의사항

1. **UI 스레드**: `WriteableBitmap`은 반드시 UI 스레드에서 생성 및 조작해야 함 >> `WriteableBitmap`는 `DispatcherObject`의 하위 클래스이기 때문이에요
2. **메모리 사용량**: 큰 이미지의 경우 메모리 사용량 모니터링 필요