---
title: 
tags: 
categories: 
createdAt: "2025-04-25 10:27"
lastmod: "2025-04-25 10:27"
lang: ko
pin: true
math: true
mermaid: true
---

### 기존
```c#
await Application.Current.Dispatcher.InvokeAsync(() =>
{
// ✅[1]
	 ((System.Windows.Media.ImageBrush)this.grid_scrollviewer.Background).ImageSource = Common.ConvertBitmap(uri);

});
```

### 1단계
```c#

// ✅[1]
byte[]? imageData = await Task.Run(() =>
{
	try
	{
		using (var wc = new System.Net.WebClient())
		{
			return wc.DownloadData(uri);
		}
	}
	catch (Exception ex)
	{
		// skip
	}
});

if (imageData == null)
{
// skip
}

// ✅[2]
// Create the BitmapImage on the UI thread.
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
		// skip
	}
}, System.Windows.Threading.DispatcherPriority.Background);

if (bitmap == null)
{
	return;
}

await Application.Current.Dispatcher.InvokeAsync(() =>
{
// ✅[3]
((System.Windows.Media.ImageBrush)this.grid_scrollviewer.Background).ImageSource = bitmap;

});
```


### 2단계

```c#
// Put placeholder before download
// 다운로드 시작 전에 미리 준비한 임시 화면(여기서는 null)으로 채우기
WriteableBitmap? writeableBitmap = null;

await this.Dispatcher.InvokeAsync(() =>
{
// ✅[1]
	((System.Windows.Media.ImageBrush)this.grid_scrollviewer.Background).ImageSource = null;
    grid_scrollviewer.Width = width;
    grid_scrollviewer.Height = height;
}, System.Windows.Threading.DispatcherPriority.Send);

// ✅[2]
// Download image on Background thread
// Background thread에서 다운로드 진행
byte[]? imageData = await Task.Run(async () =>
{
    try
    {
        using (var httpClient = new System.Net.Http.HttpClient())
        {
            httpClient.Timeout = TimeSpan.FromSeconds(30);
            return await httpClient.GetByteArrayAsync(uri);
        }
    }
    catch (Exception ex)
    {
       // skip
    }
});

if (imageData == null)
{
    // skip
}

// Create a decoder and get image information on a background thread
// 디코더를 생성하고 백그라운드 스레드에서 이미지에 대한 정보 추출
BitmapImage? tempImage = null;
BitmapDecoder? decoder = null;
int pixelWidth = 0;
int pixelHeight = 0;
PixelFormat pixelFormat = PixelFormats.Bgra32;
byte[]? pixelData = null;

try
{
    await Task.Run(() =>
    {
        try
        {
            using (var ms = new MemoryStream(imageData))
            {
	            // ✅[3]
                // Create a decoder to get image dimensions
                // 디코더 생성
                decoder = BitmapDecoder.Create(
                    ms,
                    BitmapCreateOptions.None,
                    BitmapCacheOption.OnLoad);

                // Get image dimensions
                // 이미지 사이즈 추출
                pixelWidth = decoder.Frames[0].PixelWidth;
                pixelHeight = decoder.Frames[0].PixelHeight;

                // Convert to a standard format for easier processing
                // FormatConvertedBitmap으로 변환
                FormatConvertedBitmap convertedBitmap = new FormatConvertedBitmap(
                    decoder.Frames[0],
                    pixelFormat,
                    null,
                    0);

                // Get the pixel data
                int stride = (pixelWidth * pixelFormat.BitsPerPixel + 7) / 8;
                pixelData = new byte[stride * pixelHeight];
                convertedBitmap.CopyPixels(pixelData, stride, 0);
            }
        }
        catch (Exception ex)
        {
            // skip
        }
    });
}
catch (Exception ex)
{
    // skip
}

// 예외처리
if (pixelData == null || pixelWidth == 0 || pixelHeight == 0)
{
    // skip
}
else
{
    // Create and update the WriteableBitmap on the UI thread
    writeableBitmap = await this.Dispatcher.InvokeAsync(() =>
    {
        try
        {
            // Create the WriteableBitmap on the UI thread
            var bitmap = new WriteableBitmap(
                pixelWidth,
                pixelHeight,
                96, 96,  // Default DPI
                pixelFormat,
                null);

            // Update the bitmap with our pixel data
            int stride = (pixelWidth * pixelFormat.BitsPerPixel + 7) / 8;
            bitmap.WritePixels(
                new Int32Rect(0, 0, pixelWidth, pixelHeight),
                pixelData,
                stride,
                0);

            if (bitmap.CanFreeze)
                bitmap.Freeze();

            return bitmap;
        }
        catch (Exception ex)
        {
            // skip
        }
    }, System.Windows.Threading.DispatcherPriority.Background);
}

// Apply the bitmap on a low-priority UI operation
BitmapSource? finalBitmap = writeableBitmap != null ? (BitmapSource)writeableBitmap : (BitmapSource)tempImage;
if (finalBitmap != null)
{
    await this.Dispatcher.InvokeAsync(() =>
    {
       
        var imageBrush = (System.Windows.Media.ImageBrush)this.grid_scrollviewer.Background;

        // Apply RenderOptions to the brush
        RenderOptions.SetBitmapScalingMode(imageBrush, BitmapScalingMode.HighQuality);

        // Set the image source
        imageBrush.ImageSource = finalBitmap;

    }, System.Windows.Threading.DispatcherPriority.Background);
}
```