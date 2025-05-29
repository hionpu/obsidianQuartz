---
title: using과 MemoryStream 활용하기
tags:
  - "#WPF"
  - "#CSharp"
categories: WPF
createdAt: 2025-04-25 14:50
lastmod: 2025-04-25 14:50
lang: ko
pin: true
math: true
mermaid: true
permalink: csharp-using-memorystream-utilization
---
## using

C#에서 `using` 구문은 `IDisposable` 인터페이스를 구현하는 객체의 자원을 자동으로 해제하기 위한 필수적인 패턴입니다. 특히 스트림Stream과 같은 시스템 리소스를 다룰 때 중요합니다.

#### `IDisposable`, `Dispose()`
>`IDisposable` 인터페이스를 구현한 객체에서 `Dispose()`를 호출하면 해당 객체가 소유하고 있던 unmanaged resources에 대한 메모리를 해제합니다. 따라서 가비지 컬렉터가 수거하기를 기다리지 않고 즉시 해제할 수 있어요. 

```csharp
using (var resource = new SomeDisposableResource())
{
    // 리소스 사용
} // 블록이 끝나면 자동으로 resource.Dispose()가 호출됨
```

사실 다음 코드와 동일합니다:

```csharp
var resource = new SomeDisposableResource();
try
{
    // 리소스 사용
}
finally
{
    if (resource != null)
        ((IDisposable)resource).Dispose();
}
```

## MemoryStream

`MemoryStream`은 파일이나 네트워크가 아닌 메모리에 데이터를 읽고 쓰기 위한 스트림 클래스입니다. 디스크 I/O 없이 바이트 데이터를 효율적으로 처리할 수 있어요. 특징으로는:

- 메모리 내 데이터 처리로 I/O 병목 현상 제거
- 임시 데이터 저장 및 조작을 위한 유연한 API
- 바이트 배열과 스트림 API 간의 가교 역할 => MemoryStream은 Stream 추상 클래스의 하위 클래스이므로, 파일 스트림, 네트워크 스트림 등과 같은 다른 스트림과 동일한 API로 데이터를 읽고 쓸 수 있습니다.

## 이미지 처리에서의 활용

다음은 이미지 데이터를 처리하기 위해 `MemoryStream`을 사용하는 예시입니다:

```csharp
using (var ms = new MemoryStream(imageData))
{
    // MemoryStream을 사용하여 바이트 배열에서 이미지 디코더 생성
    decoder = BitmapDecoder.Create(
        ms,
        BitmapCreateOptions.None,
        BitmapCacheOption.OnLoad); // 이미지를 모두 메모리에 로드
    
    // 이미지 크기 정보 추출
    pixelWidth = decoder.Frames[0].PixelWidth;
    pixelHeight = decoder.Frames[0].PixelHeight;
    
    // 표준 형식으로 변환하여 처리 단순화
    FormatConvertedBitmap convertedBitmap = new FormatConvertedBitmap(
        decoder.Frames[0],
        pixelFormat,
        null,
        0);
    
    // 픽셀 데이터 추출
    int stride = (pixelWidth * pixelFormat.BitsPerPixel + 7) / 8;
    pixelData = new byte[stride * pixelHeight];
    convertedBitmap.CopyPixels(pixelData, stride, 0);
}
```

이 코드에서 `using` 블록을 사용함으로써 `MemoryStream`이 사용한 리소스가 블록이 종료될 때 자동으로 해제됩니다.

## 다양한 데이터 형식 처리하기

`MemoryStream`은 이미지뿐만 아니라 다양한 데이터 형식을 처리하는 데 활용할 수 있습니다.

### 정수 배열 직렬화 예시

```csharp
public byte[] SerializeIntArray(int[] data)
{
    using (MemoryStream ms = new MemoryStream())
    {
        using (BinaryWriter writer = new BinaryWriter(ms))
        {
            // 배열 길이 저장
            writer.Write(data.Length);
            
            // 각 요소 저장
            foreach (int value in data)
            {
                writer.Write(value);
            }
        }
        
        // 직렬화된 바이트 배열 반환
        return ms.ToArray();
    }
}

public int[] DeserializeIntArray(byte[] bytes)
{
    using (MemoryStream ms = new MemoryStream(bytes))
    {
        using (BinaryReader reader = new BinaryReader(ms))
        {
            // 배열 길이 읽기
            int length = reader.ReadInt32();
            int[] result = new int[length];
            
            // 각 요소 읽기
            for (int i = 0; i < length; i++)
            {
                result[i] = reader.ReadInt32();
            }
            
            return result;
        }
    }
}
```

## 스트림 결합 및 파이프라인 처리

`MemoryStream`의 강력한 기능 중 하나는 다른 스트림과 결합하여 데이터 처리 파이프라인을 구성할 수 있다는 점입니다:

```csharp
public byte[] CompressData(byte[] originalData)
{
    using (MemoryStream output = new MemoryStream())
    {
        using (GZipStream compressionStream = new GZipStream(output, CompressionMode.Compress))
        {
            using (MemoryStream input = new MemoryStream(originalData))
            {
                // 데이터 스트림을 압축 스트림으로 복사
                input.CopyTo(compressionStream);
            } // input MemoryStream 해제
        } // compressionStream 해제 (중요: 이때 내부 버퍼가 출력에 기록됨)
        
        return output.ToArray();
    } // output MemoryStream 해제
}
```

## 성능 고려사항

1. **초기 용량 설정**: 데이터 크기를 미리 알고 있다면 초기 용량을 지정하여 재할당을 줄일 수 있습니다.
    
    ```csharp
    // 초기 용량 지정
    using (var ms = new MemoryStream(capacity: expectedSize))
    ```
    
2. **ToArray() 사용 주의**: `ToArray()`는 새로운 배열을 생성하므로 불필요한 메모리 할당을 피해야 합니다.
    
3. **대용량 데이터**: 매우 큰 데이터(수백 MB 이상)를 처리할 때는 메모리 사용량에 주의해야 합니다.
    

## `using` + `MemoryStream`

`using` 구문과 `MemoryStream`의 조합은 리소스 관리와 메모리 기반 데이터 처리를 효율적으로 수행할 수 있게 해줍니다. 특히 이미지 처리, 직렬화/역직렬화, 네트워크 통신 등에서 디스크 I/O 없이 데이터를 빠르게 처리할 수 있어요.