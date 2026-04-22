---
title: YouTube 한 채널에서 16:9, 9:16 동시 라이브 스트리밍
tags:
  - "#YouTube"
  - "#라이브스트리밍"
  - "#OBS"
  - "#듀얼스트림"
  - "#YouTubeShorts"
  - "#ApexLegends"
  - "#게임스트리밍"
createdAt: 2026-03-12 15:11
lastmod: 2026-03-12 15:22
lang: ko
---
# YouTube 한 채널에서 16:9, 9:16 동시 라이브 스트리밍

**Created:** 3/12/2026 15:11:26
**Updated:** 3/12/2026 15:22:07
**Exported:** 3/12/2026 15:24:05
**Link:** [https://claude.ai/chat/cdc5dc57-e988-4498-9c17-65736cefd2f0](https://claude.ai/chat/cdc5dc57-e988-4498-9c17-65736cefd2f0)

---

## 요약

### 문제

- OBS에 16:9 / 9:16 장면 세팅 완료, YouTube 한 채널에서 두 형식 동시 라이브 목표
- Dual Stream 토글은 ON이지만 Encoder/Auto 옵션이 나타나지 않음
- 스트림 키 2개를 따로 만들어 각각 탭에 할당했더니 키가 하나로 통일되어 한 화면만 송출됨

### 원인

- YouTube Dual Stream은 점진적 롤아웃 중이라 모든 채널에 완전 활성화되지 않은 상태
- 탭 2개에서 키를 바꾼 것은 **같은 라이브 이벤트** 안에서의 조작이라 YouTube가 하나로 덮어씀

### 해결 방법

1. YouTube Studio → **Create → Go live → "나중에 예약(Schedule stream)"** 으로 라이브 이벤트를 **완전히 별도로 2개** 생성
   - 하나는 16:9 가로용, 하나는 9:16 세로(Shorts)용
   - 각 이벤트는 독립된 URL(`/video/{다른ID}/livestreaming`)과 고유 스트림 키를 가짐
2. 각 이벤트 설정에서 **Auto-Start / Auto-Stop** 활성화
   - OBS에서 송출 시작하는 순간 자동으로 방송 시작, 종료 시 자동 종료
   - 이 옵션은 **예약된 스트림에서만** 표시됨
3. OBS에서 두 스트림 키로 각각 출력 → 완료

### 재사용 팁

- 방송 종료 후 이벤트는 완료 상태가 되므로, 다음 방송 전에 **Reuse settings**로 빠르게 이벤트 2개 복제
- 고정 스트림 키를 사용하면 OBS 설정은 그대로 유지됨

### 정책 위반 여부

- **문제 없음.** YouTube가 공식적으로 가로+세로 동시 송출을 지원하는 방향이며, 스트림 키 2개 방식은 이를 수동으로 구현하는 것

---

## 원본 대화

## Prompt:
2026. 3. 12. 오후 3:11:28

요구사항: OBS에서 16:9 (가로)와 9:16 (세로) 장면을 이미 설정 완료. YouTube에 동시 라이브 스트리밍 (한 채널에서 두 형식) 원함. Dual Stream 기능 기대했으나 Encoder/Auto 옵션 안 보임.
현재 문제:
* Dual Stream 토글 ON, 하지만 Auto나 Encoder 버튼/드롭다운 없음.
* 수동 방식 시도: 두 브라우저 탭으로 새 라이브 스트림 생성 → 고정 스트림 키 각각 만들기 ("16:9 고정", "9:16 고정") → 각 탭에 키 지정.
* 결과: 키 자동 변경/오버라이드 → 한 폼이 양쪽 브라우저 탭에 송출되고 자동으로 스트림 키가 하나로 통일됨
추가 맥락: 한국 채널, Apex Legends 스트리밍, 듀얼 PC 세팅. 정책 위반 없음 확인됨. 2026년 3월 기준.



## Response:
2026. 3. 12. 오후 3:12:18

좋은 질문이야. YouTube의 Dual Stream 기능과 현재 상황을 정리해볼게.

````plaintext
Web Search: YouTube dual stream horizontal vertical simultaneous 2026
````

> **How to Multistream in Vertical and Horizontal Mode on YouTube | Streamlabs** [streamlabs.com](https://streamlabs.com/content-hub/post/how-to-multistream-youtube-vertical-horizontal)
>
> **Stream vertical and horizontal at the same time from OBS | Restream Help Center** [restream.io](https://support.restream.io/en/articles/11730141-stream-vertical-and-horizontal-at-the-same-time-from-obs)
>
> **How to Stream to YouTube + YouTube Shorts at the Same Time (Horizontal + Vertical) in Meld Studio** [meldstudio.co](https://meldstudio.co/blog/how-to-stream-to-youtube-youtube-shorts-at-the-same-time-horizontal-vertical-in-meld-studio/)
>
> **YouTube Live gets a major update, introduces dual-format streaming, minigames, and more | TechCrunch** [techcrunch.com](https://techcrunch.com/2025/09/16/youtube-live-gets-a-major-update-introduces-dual-format-streaming-minigames-and-more/)
>
> **Stream Horizontal And Vertical Videos Together On YouTube** [yostream.io](https://yostream.io/tutorials/stream-horizontal-and-vertical-videos-together-on-youtube/)
>
> **Horizontal and Vertical streaming (Dual HD) - Streamrun** [streamrun.com](https://streamrun.com/templates/horizontal-and-vertical-streaming-dual-hd)
>
> **Dual Format Streaming - Streamrun docs** [streamrun.com](https://streamrun.com/docs/dual-format-streaming)
>
> **New YouTube Update 2025: Everything You Need to Know** [onestream.live](https://onestream.live/blog/youtube-update-dual-format-live-streaming/)
>
> **Live Stream in Horizontal and Vertical on Youtube** [meldstudio.co](https://meldstudio.co/blog/live-stream-in-horizontal-and-vertical-on-youtube/)
>
> **YouTube launches dual horizontal and vertical live streaming** [eloutput.com](https://en.eloutput.com/news/social-media/YouTube-launches-dual-horizontal-and-vertical-live-streaming/)
>
````plaintext
Web Search: YouTube dual stream encoder option OBS two stream keys setup 2026
````

> **OBS Studio: Stream to multiple platforms or channels at once | OBS Forums** [obsproject.com](https://obsproject.com/forum/resources/obs-studio-stream-to-multiple-platforms-or-channels-at-once.932/)
>
> **Stream on Twitch and YouTube at the Same Time in 2026** [obsbot.com](https://www.obsbot.com/blog/obs/stream-on-twitch-and-youtube-at-the-same-time)
>
> **Technical question regarding simultaneous streaming. | OBS Forums** [obsproject.com](https://obsproject.com/forum/threads/technical-question-regarding-simultaneous-streaming.186384/)
>
> **Best OBS Settings for Streaming in 2026 (Twitch, YouTube, Facebook, Dacast)** [dacast.com](https://www.dacast.com/blog/best-obs-studio-settings/)
>
> **How to Stream on YouTube with OBS in 2026** [onestream.live](https://onestream.live/blog/how-to-stream-on-youtube-with-obs/)
>
> **Create a YouTube live stream with an encoder - YouTube Help** [google.com](https://support.google.com/youtube/answer/2907883?hl=en)
>
> **How to Stream to Twitch & YouTube using OBS (Dual Stream) – Stream Designz** [streamdesignz.com](https://www.streamdesignz.com/blogs/live-streaming/how-to-stream-to-twitch-youtube-using-obs-dual-stream)
>
> **How to Stream to YouTube + YouTube Shorts at the Same Time (Horizontal + Vertical) in Meld Studio** [meldstudio.co](https://meldstudio.co/blog/how-to-stream-to-youtube-youtube-shorts-at-the-same-time-horizontal-vertical-in-meld-studio/)
>
> **Best OBS Settings for Streaming in 2026: Complete Setup Guide for Twitch, YouTube & Kick** [streamplacements.com](https://streamplacements.com/blog/best-obs-settings-for-streaming)
>
> **New YouTube Update 2025: Everything You Need to Know** [onestream.live](https://onestream.live/blog/youtube-update-dual-format-live-streaming/)
>
검색 결과를 종합해서 정리할게.

**핵심 문제: YouTube Dual Stream은 아직 점진적 롤아웃 중**

YouTube Live Control Room에서 Dual Stream 토글이 보이는 크리에이터가 있긴 하지만, 이 기능은 점진적으로 롤아웃되고 있어서 모든 채널에 제공되지는 않는 상태야. Live Dual이라고 불리는 이 기능은 특정 채널부터 배포가 시작되어 점차 확대될 예정이라고 해.

토글이 ON으로 보이는데 Encoder/Auto 옵션이 안 나타나는 건, 아마 채널에 아직 완전한 기능이 활성화되지 않았거나 UI만 노출된 상태일 가능성이 높아. 그리고 Dual Stream이 활성화된 경우에도, YouTube가 가로 캔버스를 자동으로 세로로 크롭하는 방식이라서 커스텀 세로 레이아웃을 쓰고 싶으면 오히려 별도 스트림 키 방식이 더 낫다고 해.

**스트림 키 오버라이드 문제**

같은 YouTube 채널에서 두 탭으로 각각 라이브를 만들어 키를 할당하면, YouTube Live Control Room이 세션 단위로 관리되기 때문에 한쪽이 다른 쪽을 덮어쓰는 현상이 발생해. 이건 YouTube의 의도된 동작이야 — 같은 채널에서 동시에 두 개의 독립 라이브를 돌리는 건 기본적으로 지원되지 않거든.

**실현 가능한 해결책들 (우선순위 순)**

**1. 별도 스트림 키 2개 + 올바른 설정 방법**
YouTube Studio에서 Create → Go live 후, Live Control Room의 Stream 영역에서 스트림 키 드롭다운을 통해 새 키를 만들거나 관리할 수 있고, 가로/세로 각각에 대해 별도 키를 생성해야 해. 핵심은 두 개의 **별도 라이브 이벤트**를 만드는 거야. 같은 탭에서 키만 바꾸는 게 아니라, 하나는 일반 라이브(16:9)로, 다른 하나는 Shorts 라이브(9:16)로 **각각 독립적인 예약 이벤트**를 생성해야 해. Auto-Start/Auto-Stop을 켜두면 OBS에서 송출 시작할 때 자동으로 방송이 시작돼.

**2. OBS에서 두 출력 보내기**
듀얼 PC 세팅이니까 스트리밍 PC(7900)에서 처리하면 되는데, OBS 하나에서 두 RTMP 출력을 보내는 방법이 필요해:

- **Aitum Vertical 플러그인**: OBS용 플러그인으로, 메인 가로 출력과 별도로 세로 캔버스를 구성해서 다른 RTMP 목적지로 보낼 수 있어. 이미 OBS에서 16:9/9:16 장면을 다 만들어둔 상태니까 이게 가장 깔끔할 거야.

- **obs-multi-rtmp 플러그인**: 메인 스트림 외에 추가 RTMP 출력을 설정할 수 있어. 다만 이건 같은 인코딩된 영상을 복제해서 보내는 방식이라 해상도/비율을 다르게 하려면 제한이 있어.

- **OBS 인스턴스 2개 실행**: 스트리밍 PC에서 OBS를 두 개 띄워서, 하나는 16:9 → YouTube 라이브 키, 다른 하나는 9:16 → YouTube Shorts 라이브 키로 보내는 방법. 인코딩 세션이 2개 필요하지만, 최신 NVIDIA GPU는 2개 이상의 동시 NVENC 스트림을 지원하니까 7900(AMD)이면 AMF 인코더 2세션 또는 하나는 x264, 하나는 AMF로 분리할 수 있어.

**3. 서드파티 서비스 활용**
Restream의 OBS 플러그인을 사용하면 YouTube 채널 설정에서 Stream orientation을 Landscape + Portrait로 지정하고, OBS에서 Restream 플러그인으로 송출하면 각 방향이 별도 YouTube 라이브 이벤트로 전달돼. 채팅도 통합되는 장점이 있어.

**내 추천 (네 세팅 기준)**

이미 OBS에서 16:9/9:16 장면을 각각 세팅해뒀고, 듀얼 PC에 스트리밍 전용 PC가 있으니까 **Aitum Vertical 플러그인 + 스트림 키 2개** 조합이 가장 현실적이야. YouTube에서 각각 독립 라이브 이벤트 2개를 예약하고, OBS Aitum에서 가로는 메인 출력, 세로는 Vertical 출력으로 각각 다른 키에 보내면 돼. 추가 인코딩 부하가 생기지만 스트리밍 PC에서 감당 가능한 수준일 거야.



## Prompt:
2026. 3. 12. 오후 3:13:48

2,3은 이미 해서 설명 필요 없음

1. 별도 스트림 키 2개 + 올바른 설정 방법 YouTube Studio에서 Create → Go live 후, Live Control Room의 Stream 영역에서 스트림 키 드롭다운을 통해 새 키를 만들거나 관리할 수 있고, 가로/세로 각각에 대해 별도 키를 생성해야 해. Meld Studio 핵심은 두 개의 별도 라이브 이벤트를 만드는 거야. 같은 탭에서 키만 바꾸는 게 아니라, 하나는 일반 라이브(16:9)로, 다른 하나는 Shorts 라이브(9:16)로 각각 독립적인 예약 이벤트를 생성해야 해. Auto-Start/Auto-Stop을 켜두면 OBS에서 송출 시작할 때 자동으로 방송이 시작돼.

이거만 자세히 설명해줘 라이브 이벤트를 별도로 만든다는게 뭐지? 이미 스트림 키 2개를 별도로 생성했음



## Response:
2026. 3. 12. 오후 3:14:03

알겠어. 핵심만 짚을게.

네가 한 방식이 아마 이럴 거야: 브라우저 탭 2개 열고, 같은 "라이브 스트리밍" 세션 안에서 스트림 키만 2개 만들어서 각각 할당한 거지? 그러면 YouTube가 그걸 **하나의 라이브 이벤트**로 인식해서 키가 오버라이드되는 거야.

"별도 라이브 이벤트"란 건 이거야:

YouTube Studio → Create(만들기) → Go live(실시간 스트리밍)를 **2번 완전히 따로** 실행해서, 라이브 이벤트 자체를 2개 만드는 거야. 각 이벤트는 자체 제목, 설명, 썸네일, 그리고 고유한 스트림 키를 가진 완전히 독립된 방송이 돼.

문제는 이게 YouTube UI에서 좀 까다로운데 — 한쪽 탭에서 라이브 컨트롤 룸을 열면 다른 쪽이 그걸로 점프하는 현상이 있거든. 이걸 우회하려면:

**"예약" 방식을 써야 해.** Go live → "나중에 예약(Schedule stream)"으로 가서 이벤트 하나를 16:9용으로 예약 생성하고, 다시 Go live → 예약으로 9:16용 이벤트를 별도 생성해. 예약된 이벤트는 각각 독립된 스트림 키를 갖고, Live Control Room에서 서로 간섭하지 않아. 각 이벤트의 스트림 설정에서 Auto-Start/Auto-Stop을 켜두면, OBS에서 해당 키로 송출 시작하는 순간 각각 독립적으로 방송이 시작돼.

즉, 네가 겪은 "키가 하나로 통일되는" 문제는 하나의 라이브 세션 안에서 키 2개를 쓰려 한 거고, 해결책은 **예약 이벤트 2개를 완전히 별도로 만드는 것**이야.



## Prompt:
2026. 3. 12. 오후 3:16:35

https://studio.youtube.com/video/xYcGW1ah0Ng/livestreaming

여기서 video와 livestreaming 사이의 url이 다른 새로운 탭이 생겼는데 이렇게 하면 된다는거지



## Response:
2026. 3. 12. 오후 3:16:40

맞아, 그게 정확히 맞아.

URL에서 `/video/xYcGW1ah0Ng/livestreaming`과 `/video/다른ID/livestreaming` 이렇게 비디오 ID가 다르면 그건 YouTube가 완전히 별개의 라이브 이벤트로 인식한다는 뜻이야. 각각 독립된 스트림 키를 갖고 서로 간섭하지 않아.

그러니까 탭 하나에 16:9 키, 다른 탭에 9:16 키 할당하고, 양쪽 다 Auto-Start/Auto-Stop 켜둔 뒤 OBS에서 두 키로 각각 송출하면 돼.



## Prompt:
2026. 3. 12. 오후 3:17:08

Auto-Start/Auto-Stop 이건 어디서 하는거?



## Response:
2026. 3. 12. 오후 3:17:20



````plaintext
Web Search: YouTube Live Control Room auto-start auto-stop stream setting
````

> **Live Streaming to YouTube : Socialive Support Center** [socialive.us](https://support.socialive.us/support/solutions/articles/67000665772-livestreaming-to-youtube)
>
> **Manage live stream settings - YouTube Help** [google.com](https://support.google.com/youtube/answer/9854503?hl=en)
>
> **Streaming to YouTube With Switcher Studio - Switcher Studio Help Center** [switcherstudio.com](https://support.switcherstudio.com/article/505-streaming-to-youtube-with-switcher-studio)
>
> **YouTube enable Auto-start & Auto-stop | Live Now – Live Stream for Gameplay & Sports** [livenow.one](https://livenow.one/youtube-auto-start-stop-stream/)
>
> **Tour of YouTube updates to Live Control Room** [peggyktc.com](https://www.peggyktc.com/2020/04/tour-of-youtube-updates-to-live-control.html)
>
> **How To Start A Permanent 24/7 YouTube Live Stream (Manual / RTMP) | Upstream Helpdesk** [upstream.so](https://help.upstream.so/en/article/how-to-start-a-permanent-247-youtube-live-stream-manual-rtmp-1tzuej4/)
>
> **Youtube stream auto stop & restart ? | OBS Forums** [obsproject.com](https://obsproject.com/forum/threads/youtube-stream-auto-stop-restart.171626/)
>
> **Start stream automatically** [epiphan.com](https://www.epiphan.com/userguides/webcaster-x2/Content/2_YouTube/tip-automatically-start-streaming.htm)
>
> **Scheduling A YouTube Stream With Switcher - Switcher Studio Help Center** [switcherstudio.com](https://support.switcherstudio.com/article/320-scheduling-a-youtube-stream-in-switcher-studio)
>
> **Configure automatic streaming** [epiphan.com](https://www.epiphan.com/userguides/webcaster-x1-yt/Content/2_YouTube/stream-pre-configure.htm)
>
각 라이브 이벤트의 스트림 설정 안에 있어. **"Enable Auto-start"**와 **"Enable Auto-stop"** 토글 슬라이더가 있고, 이걸 켜면 인코더(OBS)에서 데이터를 보내는 순간 자동으로 방송이 시작되고, 송출을 멈추면 자동으로 종료돼.

단, 이 옵션은 "예약된 스트림(Schedule Stream)"에서만 나타나고, 일반 즉시 방송에서는 보이지 않아.

네가 이미 별도 라이브 이벤트 2개를 만들었으니까, 각 이벤트 편집 화면에서 스트림 설정 쪽을 보면 Auto-start / Auto-stop 토글이 있을 거야. 둘 다 켜두면 OBS에서 키 2개로 송출 시작할 때 YouTube 쪽에서 수동으로 "라이브 시작" 버튼을 누를 필요 없이 알아서 잡혀.



## Prompt:
2026. 3. 12. 오후 3:20:01

와 됐다 미친 대박 그럼 한번 생성된 이벤트 주소 2개는 계속 쓸 수 있어?



## Response:
2026. 3. 12. 오후 3:20:10

응, 맞아. 스트림 키를 "고정 스트림 키"로 만들었으면 그 키는 재사용 가능해. 다만 라이브 이벤트 자체는 방송이 끝나면 완료 상태가 되기 때문에, 다음 방송 때는 이벤트를 새로 만들어야 해.

근데 매번 새로 만들기 귀찮으니까 팁 하나: 이전 스트림에서 "Reuse settings(설정 재사용)"를 선택하면 메타데이터, 설정, 스트림 키가 그대로 복사된 새 이벤트가 만들어져. Auto-start/Auto-stop 설정도 같이 복사돼.

그러니까 흐름은 이렇게 돼: 매 방송 전에 Manage 탭에서 이전 16:9 이벤트 → Reuse settings, 이전 9:16 이벤트 → Reuse settings 해서 이벤트 2개를 빠르게 생성하고, 같은 고정 스트림 키가 연결되어 있으니까 OBS 쪽은 건드릴 필요 없이 바로 송출하면 돼.



## Prompt:
2026. 3. 12. 오후 3:22:00

이렇게 해도 유튜브 정책 위반이나 패널티 먹는건 아니지?



## Response:
2026. 3. 12. 오후 3:22:07

아니, 전혀 문제 없어. YouTube가 공식적으로 가로+세로 동시 송출을 지원하는 방향으로 가고 있고, 2025년 Made on YouTube 이벤트에서 가로와 세로 포맷을 동시에 방송하는 기능을 공식 발표했어. 네가 하는 건 그걸 수동으로 스트림 키 2개로 구현한 것뿐이라 정책적으로 아무 문제 없어.

오히려 Dual Stream 토글이 있는 크리에이터도 커스텀 세로 레이아웃을 원하면 두 스트림 키 방식을 쓰라고 권장하는 가이드도 있을 정도야.





---
Powered by [Claude Exporter](https://www.ai-chat-exporter.net)

---

## 관련 노트

- [[018-YouTube/쇼츠 이미지 생성 프롬프트|쇼츠 이미지 생성 프롬프트]] — YouTube Shorts 콘텐츠 제작
- [[997 PC, Hardware/Insights Capture V3 녹화본+메타데이터 옮기기|Insights Capture V3 녹화본 이전]] — 게임 녹화 및 클립 관리