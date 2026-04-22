# AI VST와 x264 slow 인코딩 CPU 최적화

**Created:** 3/13/2026 8:39:45  
**Updated:** 3/13/2026 11:22:36  
**Exported:** 3/13/2026 11:22:49  
**Link:** [https://claude.ai/chat/810f96dc-d9ac-477a-8f54-2728e29fdbfe](https://claude.ai/chat/810f96dc-d9ac-477a-8f54-2728e29fdbfe)  

## Prompt:
2026. 3. 13. 오전 8:39:46

송출컴에 오인페 연결하고 supertone clear 같은 ai기반 vst을 사용하는 스트리머들 중 x264 slow이상 사용하는 스트리머들 vst 체인이랑 x264 인코딩이 cpu 부하로 인한 사운드 문제나 인코딩 프레임 스킵 문제 없이 어떻게 사용하는지 검색해봐



## Response:
2026. 3. 13. 오전 8:40:03

좋은 질문이야, 승우. 듀얼 PC 셋업에서 AI VST + x264 slow 조합의 CPU 부하 문제는 꽤 구체적인 주제라 바로 리서치 들어갈게.

몇 가지만 확인하고 싶은 게 있어:

1. **관심 있는 CPU 범위**: 9950X3D/7900 같은 본인 셋업 기준으로만 볼지, 아니면 i9-14900K나 7950X 등 다른 고성능 CPU 사례도 포함할지?
2. **Supertone Clear 외 다른 AI VST도 포함?**: 예를 들어 NVIDIA Broadcast, RTX Voice, Clarity Vx 같은 것들도 같이 조사할지, 아니면 Supertone Clear 위주로?
3. **"사운드 문제"의 범위**: 오디오 크래클/팝 같은 버퍼 언더런 문제만 볼지, 아니면 레이턴시 증가나 VST 체인 순서에 따른 음질 저하까지 넓게 볼지?

````plaintext
Tool: Generating ask_user_input_v0...
````





## Prompt:
2026. 3. 13. 오전 8:40:12

질문: CPU 범위
답: 본인 셋업 (9950X3D/7900) 위주

질문: AI VST 범위
답: Supertone Clear 위주

질문: 사운드 문제 범위
답: 크래클/팝/버퍼 언더런 위주



## Response:
2026. 3. 13. 오전 8:48:02

알겠어! 범위가 명확하니 바로 리서치 시작할게. 송출 PC (7900급) + 오디오 인터페이스 + Supertone Clear + x264 slow 이상 조합에서 크래클/버퍼 언더런 없이 운용하는 방법 위주로 깊게 파볼게.

````plaintext
Tool: launch_extended_search_task
````



Your dedicated streaming PC configuration report is ready. It covers running Supertone Clear alongside x264 slow encoding on a 16-core Ryzen 9950X3D, including CPU partitioning strategies with Process Lasso, x264 thread limiting and parameter tuning, VST hosting options (Reaper, LightHost, or OBS native), buffer and sample rate configuration, troubleshooting for common failure modes like audio crackling and encoding frame skips, and a complete synthesized configuration with expected CPU utilization estimates.

**Running AI VSTs Alongside x264 Slow on a Dedicated Streaming PC: CPU Partitioning and Configuration Guide**

````markdown
# Running AI VSTs alongside x264 slow on a dedicated streaming PC

**A 16-core Ryzen 9950X3D-class CPU can comfortably run Supertone Clear alongside x264 slow encoding at 1080p60 — but only with deliberate CPU partitioning, proper VST hosting, and careful buffer configuration.** Real-world OBS forum data shows x264 slow consumes just 20–30% of a 16C/32T Ryzen 5950X at 1080p60, and the 9950X3D delivers roughly 20% more multi-threaded throughput. Supertone Clear's Eco Mode runs at moderate CPU load across multiple cores. Combined, these workloads should occupy 25–40% of a 9950X3D, leaving substantial headroom. The challenge isn't raw CPU capacity — it's preventing momentary thread contention from causing audio glitches during x264's periodic encoding spikes.

No community threads document this exact combination of Supertone Clear + x264 slow on Ryzen 7900/9950X3D hardware. The recommendations below are synthesized from component-level evidence across OBS forums, Korean streaming communities (DCInside 마이크 마이너 갤러리, 서버포럼), Supertone's official documentation, and audio engineering forums.

## Supertone Clear's multi-threaded design creates a unique coexistence challenge

Unlike Waves Clarity Vx, which is single-threaded, **Supertone Clear distributes its neural network inference across all available CPU cores**. A detailed Korean benchmark on DCInside's microphone gallery tested 20 stereo instances of Clear and found it saturated CPU evenly across all cores to 100% total usage — while Clarity Vx stuck at ~40% on a single core and produced dropouts. This multi-threaded architecture means Clear will directly compete with x264 for the same cores unless you intervene with affinity masks.

Supertone's official support confirms the plugin "requires more CPU resources than typical plug-ins" due to its neural network model and recommends a buffer size of **1024 or 2048 samples** to prevent audio dropouts. The official release reduced CPU consumption dramatically from the GOYO beta (which exceeded 100% on many systems) to approximately **30% of system resources** in normal mode. **Eco Mode** uses a lighter neural network model that reviewers describe as producing "almost the same results, but with way less strain" — the trade-off is slightly softer high/mid frequencies and marginally less separation quality.

At 48 kHz with a 1024-sample buffer, Clear introduces roughly **36 ms of total audio latency** (21 ms buffer + ~15 ms internal neural network inference). For live streaming where viewers already experience 2–10 seconds of broadcast delay, this is imperceptible. The Korean VTuber community on DCInside reports typical latency of **20–30 ms** in practice.

## The CPU partitioning strategy that works

The core technique is **hard CPU affinity separation** using Process Lasso, combined with priority stratification. On a 16-core/32-thread CPU like the 9950X3D:

**Pin OBS (x264 encoding) to one set of cores and the audio/VST host to another.** For example, assign OBS to cores 4–15 (24 threads) and your VST host to cores 0–3 (8 threads). This prevents x264's periodic encoding spikes — which occur at every keyframe (every 2 seconds at Twitch's standard keyframe interval), during scene changes, and at B-frame decision points — from momentarily starving the audio thread of CPU time.

Process Lasso is the community-standard tool for this. It offers **persistent CPU affinities** that survive reboots and a "Forced Mode" that continuously reapplies rules if another process overrides them. Set these priorities:

- **VST host (Reaper/LightHost)**: High priority — real-time audio is the most latency-sensitive workload; underruns cause audible artifacts that cannot be recovered
- **OBS**: Above Normal priority — important but can tolerate occasional frame drops far better than audio can tolerate buffer underruns
- **audiodg.exe** (Windows audio service): High priority if using WASAPI
- Everything else: Normal

A critical Windows 11 finding from OBS forums: **the default "Normal" priority for OBS causes Windows to deprioritize it**, leading to skipped encoding frames even at low CPU usage. One user reported that simply changing OBS's built-in Process Priority setting (Settings → Advanced) from Normal to Above Normal eliminated all encoding frame skips. This setting alone resolves a large percentage of reported encoding lag issues.

## x264 thread limiting is the key encoding-side optimization

The x264 encoder defaults to `logical_cores × 1.5` threads — on a 32-thread CPU, that's 48 threads, meaning x264 will happily consume every available core. **Limiting the thread count is essential** when sharing the CPU with real-time audio processing. In OBS, add `threads=N` to the x264 Options field (Settings → Output → Advanced mode → Encoder Settings).

For a 16C/32T dedicated streaming PC running Supertone Clear, a good starting configuration is:

```
threads=20 rc-lookahead=60 bframes=3 b-adapt=1
```

This reserves roughly 40% of available threads for audio processing and system overhead. The `rc-lookahead=60` provides good rate control quality without the CPU spikes that values above 120 can produce. Setting `b-adapt=1` (fast B-frame decision) instead of `b-adapt=2` (optimal) with `bframes=3` dramatically smooths CPU usage patterns — b-adapt=2 with high B-frame counts is one of the most spike-prone x264 configurations.

An experienced OBS forum user ("Yubran Of Death") documented extensively that **subme=9 and ref=16 are the two parameters that "really kill your system"** when attempting the Slower preset. Their hybrid approach — using Slow as the base with selective Slower-level options (subme=8, ref=8 instead of Slower's subme=9, ref=16) — achieved 60–80% CPU on a 5950X. On a 9950X3D, this leaves meaningful headroom for Clear. The OBS community consensus, however, is that visual quality differences from Slow → Slower have severely diminishing returns, and most viewers cannot perceive the difference at Twitch bitrates.

## Host Clear in Reaper or LightHost, not inside OBS

The VST hosting approach significantly impacts stability under heavy CPU load. Three main options exist, ranked by stability:

**Reaper + ReaRoute (most stable):** Reaper is a full DAW with proper ASIO buffer management, plugin delay compensation, and independent process priority control. ReaRoute provides 16 channels of ASIO I/O between Reaper and OBS (via the obs-asio plugin). Audio processing runs in a completely separate process from encoding, with its own thread scheduler priority. The Korean streaming community on 서버포럼 documents this workflow: mic → Reaper (with Clear on the track) → ReaRoute output → OBS ASIO Input Capture. The downside is complexity and occasional reliability issues — some users report ReaRoute stopping mid-stream, requiring a restart.

**LightHost or Element LT (lightweight alternative):** The Korean VTuber community recommends developing your VST chain settings in Reaper, then deploying in **LightHost** (by Rolando Islas) for production streaming. LightHost is a minimal VST host that consumes far fewer resources than a full DAW. Element LT is praised for "adding like no latency at all." Both can be routed through VoiceMeeter's virtual ASIO insert or a virtual audio cable to OBS.

**OBS built-in VST support (simplest but riskiest):** OBS supports only VST2 plugins — no VST3 — and runs audio processing in its main process, sharing CPU time with encoding. Supertone Clear does ship as VST2, so it works in OBS directly. However, OBS's own documentation warns that "some VST plugins may cause crashes," and multiple users report heavy AI VSTs causing **100–200 ms lag** or complete audio cutouts in OBS. Under heavy x264 load, this is the most fragile approach because there is no process-level isolation between encoding and audio work.

## Buffer sizes and sample rates that prevent crackling

For a dedicated streaming PC running both Clear and x264 slow, **512 samples at 48 kHz is the practical minimum buffer size; 1024 samples is the safe recommendation**. At 48 kHz, 512 samples delivers 10.7 ms of buffer latency — enough to absorb most x264 CPU spikes without underrunning. The 1024-sample setting (21.3 ms) provides a wider safety margin and matches Supertone's official recommendation.

The single most common cause of audio crackling documented across English and Korean communities is **sample rate mismatch**. Every component in the audio chain must run at identical sample rates:

- Windows Sound Settings: 48000 Hz
- Audio interface / ASIO driver: 48000 Hz  
- VoiceMeeter (if used): 48000 Hz
- Reaper / VST host: 48000 Hz
- OBS audio settings: 48000 Hz

**48 kHz is the correct choice for streaming** — it matches the video container standard and avoids resampling overhead. Running at 96 kHz doubles the CPU load for every audio plugin and provides zero benefit for streaming output.

**Use your audio interface's native ASIO driver**, not ASIO4ALL or WASAPI. Native ASIO operates in kernel mode with near-real-time priority scheduling, bypassing the Windows audio engine entirely. This makes audio processing significantly more resistant to CPU scheduling irregularities caused by x264's encoding spikes. WASAPI Shared mode, by contrast, shares resources with other applications and is prone to glitches under heavy CPU load.

## Documented solutions for specific failure modes

**Audio crackling at random intervals:** Almost always caused by sample rate mismatch or OBS's Application Audio Capture (BETA), which has a known bug causing periodic crackling 17–22 minutes into a stream. The fix for the latter is routing through VoiceMeeter Banana instead. For the former, audit every audio device and application for matching 48 kHz settings.

**Encoding frame skips at seemingly low CPU usage:** Set OBS Process Priority to Above Normal (Settings → Advanced). On Windows 11, the OS aggressively deprioritizes applications it considers non-essential, including OBS at Normal priority. This single change resolves the issue for the majority of affected users.

**Supertone Clear causing audio cutout in OBS:** Reported by Korean users on DCInside when using Clear as a VST2 filter with certain audio interface + dynamic mic combinations. The workaround is activating Clear's license inside OBS first (not through EqualizerAPO), then hosting it externally. Alternatively, switching to Eco Mode reduces the CPU spike profile that triggers OBS audio thread timeouts.

**x264 encoder overload at Slower preset:** The specific culprits are subme=9 and ref=16. Use subme=7 or 8 and ref=3–8 instead. Also avoid `me=tesa` (exhaustive motion search) and `me=umh` during fast-action content — the OBS forum user who tested extensively found `me=umh` caused brief encoder overloads during intense gaming combat.

**DPC latency causing glitches independent of CPU load:** Monitor with LatencyMon. GPU drivers, network adapters, and USB controllers can introduce high DPC (Deferred Procedure Call) latency that disrupts audio regardless of CPU headroom. Disable Wi-Fi adapters, update GPU drivers, and use Microsoft's Interrupt Affinity Policy Tool to move USB/audio controller IRQs off cores used by x264.

## Practical configuration for a 9950X3D dedicated streaming PC

Based on all gathered evidence, here is the synthesized recommended configuration:

**OBS Settings:**
Encoder x264, Preset Slow, Profile High, Tune (None), Bitrate 6000–8000 kbps CBR, Keyframe interval 2, x264 Options: `threads=20 rc-lookahead=60 bframes=3 b-adapt=1 ref=4`, Process Priority Above Normal, Audio sample rate 48 kHz.

**Audio chain:**
Microphone → Audio interface (native ASIO, 48 kHz, 512 or 1024 sample buffer) → Reaper or LightHost (Supertone Clear in Eco Mode → EQ → Compressor) → ReaRoute or Virtual Audio Cable → OBS Audio Input.

**Process Lasso rules:**
OBS pinned to cores 4–15, Above Normal priority. Reaper/LightHost pinned to cores 0–3, High priority. audiodg.exe set to High priority.

**System-level:**
Windows Power Plan set to High Performance. USB selective suspend disabled. Game Mode and Game Bar disabled. All audio devices and software confirmed at 48 kHz. LatencyMon verified clean (no high-DPC drivers).

**Expected CPU utilization:** x264 slow at 1080p60 should consume **15–25%** of the 9950X3D. Supertone Clear in Eco Mode should add **5–10%**. Total system load of **25–35%** leaves comfortable headroom for Windows overhead, capture card processing, and occasional spikes.

## Conclusion

The viability of this setup hinges on three non-negotiable practices: **hard CPU affinity separation** between encoding and audio processes, **ASIO-based audio with 512+ sample buffers at matched 48 kHz**, and **hosting Clear outside OBS in a separate process with higher priority**. The 9950X3D's 16 cores provide roughly 3× the CPU budget needed for x264 slow at 1080p60, making this entirely feasible even without Eco Mode — though Eco Mode provides a valuable safety margin with negligible quality loss. The biggest risk isn't average CPU load but momentary thread contention during x264 keyframe encoding spikes, which affinity pinning and adequate audio buffers eliminate. This configuration sits at the frontier of documented community practice — no public threads cover this exact combination — but the component-level evidence strongly supports its feasibility with the architecture described above.
````



## Prompt:
2026. 3. 13. 오전 9:07:16

sample rate mismatch가 오디오 인터페이스 usb 연결까지도 해제시킬 수 있음?



## Response:
2026. 3. 13. 오전 9:07:45

좋은 질문이야. 정확히 짚어볼게 — sample rate mismatch가 USB 오디오 인터페이스의 연결 자체를 끊을 수 있는지.

````plaintext
Web Search: USB audio interface disconnect sample rate mismatch
````

> **SOLVED: Sample rate conflict between my audio interface and windows10 - Q&A - Cakewalk Discuss | The Official Cakewalk by BandLab Forum** [cakewalk.com](https://discuss.cakewalk.com/topic/70641-solved-sample-rate-conflict-between-my-audio-interface-and-windows10/)
>
> **H9000r Sample Rate Mismatch - Eventide Audio** [eventideaudio.com](https://www.eventideaudio.com/forums/topic/h9000r-sample-rate-mismatch/)
>
> **Blackmagic Forum • View topic - Resolve forcing audio interface to 44.1kHz** [blackmagicdesign.com](https://forum.blackmagicdesign.com/viewtopic.php?f=21&t=94482)
>
> **USB Audio with Logic Pro Sample Rate Mismatch - Issues - Get help solving your problem - Kemper Profiler Forum** [kemper-amps.com](https://forum.kemper-amps.com/forum/thread/60877-usb-audio-with-logic-pro-sample-rate-mismatch/)
>
> **any way for the h9000 to not say my system is running the wrong sample rate and muting itself? - Eventide Audio** [eventideaudio.com](https://www.eventideaudio.com/forums/topic/any-way-for-the-h9000-to-not-say-my-system-is-running-the-wrong-sample-rate-and-muting-itself/)
>
> **How to remedy a sample rate mismatch? - Cubase - Steinberg Forums** [steinberg.net](https://forums.steinberg.net/t/how-to-remedy-a-sample-rate-mismatch/131296)
>
> **Sample rate defaults back to 44.1KHz afte… - Apple Community** [apple.com](https://discussions.apple.com/thread/252225094)
>
> **Sample Rate mismatch** [yamahasynth.com](https://yamahasynth.com/community/modx-series-synthesizers/sample-rate-mismatch/)
>
> **Do the DAW and Audio interface need the same sampling rate? - Quora** [quora.com](https://www.quora.com/Do-the-DAW-and-Audio-interface-need-the-same-sampling-rate)
>
> **Are there issues with mismatched Sampling rates ? | HomeRecording.com** [homerecording.com](https://homerecording.com/bbs/threads/are-there-issues-with-mismatched-sampling-rates.403988/)
>
````plaintext
Web Search: USB audio interface disconnects drops out ASIO DAW sample rate conflict Windows
````

> **SOLVED: Sample rate conflict between my audio interface and windows10 - Q&A - Cakewalk Discuss | The Official Cakewalk by BandLab Forum** [cakewalk.com](https://discuss.cakewalk.com/topic/70641-solved-sample-rate-conflict-between-my-audio-interface-and-windows10/)
>
> **'ASIO sample rate not supported by USB interface' | Forum** [image-line.com](https://forum.image-line.com/viewtopic.php?t=53752)
>
> **ASIO Sample Rate is not supported by one or more USB interfaces - Avid Pro Audio Community** [avid.com](https://duc.avid.com/showthread.php?t=361308)
>
> **Windows 11 Audio glitches - multiple interfaces | Windows Forum** [windowsforum.com](https://windowsforum.com/threads/windows-11-audio-glitches-multiple-interfaces.350067/)
>
> **Why Does My Audio Interface Keeps Disconnecting?** [integraudio.com](https://integraudio.com/audio-interface-disconnecting/)
>
> **ASIO sample rate not supported M-Audio -Sound Forge - PC - MAGIX Community Forums Archive** [magix.info](https://forum-archive.magix.info/showmessage.asp?messageid=781967)
>
> **ASIO sample rate not supported by one of the USB interfaces! | Forum** [image-line.com](https://forum.image-line.com/viewtopic.php?t=75829)
>
> **USB audio skipping with ADI-2 DAC on Windows 10 (Page 1) — ADI-2 & 2/4 Pro series, ADI-2 DAC series — RME User Forum** [rme-audio.de](https://www.forum.rme-audio.de/viewtopic.php?id=27060)
>
> **Can't use ASIO Software and Windows Audio simultaneously | VI-CONTROL** [vi-control.net](https://vi-control.net/community/threads/cant-use-asio-software-and-windows-audio-simultaneously.124793/)
>
> **ASIO Issues | Forum** [image-line.com](https://forum.image-line.com/viewtopic.php?t=290307)
>
결론부터 말하면, **sample rate mismatch 자체가 USB 물리적 연결을 끊지는 않아**. 하지만 연결이 "죽은 것처럼" 보이게 만들 수 있어서 혼동이 생길 수 있어.

실제로 일어나는 현상은 단계가 나뉘어:

**1단계: 오디오 뮤트/락 해제** — 비동기 USB 오디오를 사용하는 장비들은 sample rate mismatch가 감지되면 USB 오디오 스트림 자체를 뮤트시켜버린다. 이건 USB 포트 연결 해제가 아니라, 펌웨어 레벨에서 오디오 데이터 전송만 차단하는 거야. USB 디바이스 자체는 여전히 Windows Device Manager에 잡혀 있어.

**2단계: 드라이버 혼란** — DAW가 인터페이스의 sample rate를 강제로 바꿔버릴 때 FireWire/USB 락(lock) 표시등이 꺼지고 1초마다 깜빡이면서 클릭 소리가 나는 현상이 발생한다. 이건 클럭 동기화 실패 때문인데, 겉으로 보면 인터페이스가 "연결 해제"된 것처럼 보여.

**3단계: 사용 불능 상태** — DAW를 닫은 후에도 인터페이스에서 소리가 안 나와서, 결국 USB를 물리적으로 뽑았다 꽂아야 복구되는 상황이 발생한다. 이것도 USB 연결이 끊긴 게 아니라 ASIO 드라이버가 sample rate 상태를 잘못 캐싱해서 Windows 오디오 엔진이 디바이스를 놓치는 거야.

그러니까 네 셋업에서 실제로 걱정해야 할 시나리오는 이거야: Reaper가 ASIO 48kHz로 오인페를 잡고 있는 상태에서, OBS나 다른 앱이 Windows 사운드 설정의 다른 sample rate로 같은 디바이스에 접근하려 할 때 — **인터페이스가 갑자기 소리를 안 내거나 DAW가 오디오 디바이스를 잃어버리는 현상**이 생길 수 있어. 물리적 USB disconnect는 아니지만, 방송 중에 소리가 갑자기 죽는 건 결과적으로 똑같이 치명적이지.

해결은 앞서 정리한 대로 — 모든 오디오 경로를 48kHz로 통일하면 이 문제 자체가 발생할 여지가 없어.



## Prompt:
2026. 3. 13. 오전 9:10:03

오인페가 갑자기 해제되고, 기본 line out으로 연결된 스피커로 잠시 소리가 나가고, reaper에 There was an error opening the audio hardware:  Error initializing ASIO driver라는 에러가 떴다가 다시 오인페가 연결되면서 소리가 오인페 헤드폰으로 돌아오고 하는 증상이 발생했었어

그러다 아예 usb 장치 인식 실패가 나타났고 usb 포트를 변경해도 마찬가지. 재부팅 해도 마찬가지였고 topping e2x2 otg 드라이버를 재설치한 뒤에야 제대로 인식됨.



## Response:
2026. 3. 13. 오전 9:10:45

그 증상 패턴이 꽤 구체적이네. 단순 sample rate mismatch보다는 더 깊은 문제일 가능성이 높아. 순서대로 정리하면:

**네가 겪은 증상 체인:**
오인페 ASIO 해제 → Windows 기본 출력 폴백 → Reaper ASIO 에러 → 오인페 재연결 → 반복 → 최종적으로 USB 디바이스 인식 실패 → 포트 변경/재부팅 무효 → **드라이버 재설치로만 복구**

이건 세 가지 층위가 겹친 문제야.

````plaintext
Web Search: Topping E2x2 USB disconnect ASIO driver error
````

> **ASIO is not set up using Topping Audio Interface. - Cakewalk by BandLab - Cakewalk Discuss | The Official Cakewalk by BandLab Forum** [cakewalk.com](https://discuss.cakewalk.com/topic/83581-asio-is-not-set-up-using-topping-audio-interface/)
>
> **TOPPING E2X2 USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping/e2x2-usb-audio-interface-manual)
>
> **TOPPING E2x2 OTG User Manual** [manuals.plus](https://manuals.plus/m/f336c4d004c8869c2e9c3fea64834a7e28748bc573f124d8544793e684970ef1)
>
> **TOPPING Professional TPP50E Professional E2X2 OTG USB Audio Interface User Manual** [device.report](https://device.report/manual/17411194)
>
> **Topping D90 | Page 66 | Headphone Reviews and Discussion - Head-Fi.org** [head-fi.org](https://www.head-fi.org/threads/topping-d90.926531/page-66)
>
> **TOPPING E2X2 USB Audio Interface User Manual** [device.report](https://device.report/manual/13141074)
>
> **TOPPING Professional Control Center (Driver included) for Windows (Supports E1x2 OTG, E2x2, E2x2 OTG , E4x4 Pre and E8x8 Pre)** [topping.pro](https://topping.pro/download/N8yynYw)
>
> **Equalizer APO/Topping drivers/ASIO drivers not working together - Troubleshooting Help - The HEADPHONE Community** [headphones.com](https://forum.headphones.com/t/equalizer-apo-topping-drivers-asio-drivers-not-working-together/9925)
>
> **ASIO Problem [Solved]** [jriver.com](https://yabb.jriver.com/interact/index.php?topic=124896.0)
>
> **CLOSED Topping ASIO driver - Buffer size exceeded - virtins.com** [virtins.com](https://www.virtins.com/forum/viewtopic.php?f=7&t=2429&start=0)
>
````plaintext
Web Search: Topping E2x2 OTG automatic standby USB signal detection disconnect
````

> **TOPPING E2x2 OTG User Manual** [manuals.plus](https://manuals.plus/m/f336c4d004c8869c2e9c3fea64834a7e28748bc573f124d8544793e684970ef1)
>
> **TOPPING E2x2 OTG USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping/e2x2-otg-usb-audio-interface-manual)
>
> **TOPPING Professional TPP50E Professional E2X2 OTG USB Audio Interface User Manual** [device.report](https://device.report/manual/17411194)
>
> **TOPPING E2x2 OTG USB Audio Interface User Manual** [device.report](https://device.report/manual/18440289)
>
> **TOPPING E2X2 OTG USB Audio Interface** [topping.store](https://www.topping.store/products/topping-e2x2-otg-usb-audio-interface)
>
> **TOPPING Professional TPP50E Professional E2X2 OTG USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping-professional/tpp50e-professional-e2x2-otg-usb-audio-interface-manual)
>
> **Topping Professional E2x2 OTG USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/asin/B0DFPHN79W)
>
> **TOPPING E2X2 USB Audio Interface User Manual** [device.report](https://device.report/manual/13141074)
>
> **TOPPING E2X2 USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping/e2x2-usb-audio-interface-manual)
>
> **TOPPING Professional E1x2 OTG Professional SB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping-professional/e1x2-otg-professional-sb-audio-interface-manual)
>
네가 겪은 증상은 여러 원인이 겹칠 수 있는데, Topping E2x2 OTG 특성을 고려하면 몇 가지 의심 가능한 원인이 있어.

**1. ASIO 드라이버 크래시 → Windows 폴백**

네가 본 Reaper 에러 "Error initializing ASIO driver"는 Topping ASIO 드라이버가 내부적으로 크래시하거나 디바이스 핸들을 잃었다는 뜻이야. 이때 Windows는 기본 출력 디바이스(line out 스피커)로 자동 폴백하고, 드라이버가 복구되면 다시 오인페로 돌아오는 거야. 이게 네가 본 "오인페 해제 → 스피커 → 다시 오인페" 사이클이야.

**2. Topping 자동 스탠바이 기능 가능성**

E2x2 OTG는 자동 스탠바이 기능이 있어서, USB 신호가 감지되지 않으면 1분 후 스탠바이 상태로 진입하고, 유효한 USB 신호가 다시 감지되면 자동 복귀한다. 만약 ASIO 드라이버 크래시로 인해 USB 오디오 스트림이 잠깐이라도 끊기면, E2x2가 "USB 신호 없음"으로 판단하고 스탠바이에 진입했다가 복귀하는 루프에 빠질 수 있어. TOPPING Professional Control Center에서 **자동 스탠바이를 꺼두는 게** 우선 확인 사항이야.

**3. USB 전원 부족 가능성**

E2x2 OTG는 USB-C 포트를 통해 전원을 공급받는데, USB 포트의 전원 공급이 부족하면 별도 DC 5V 전원을 연결하라고 권고한다. 송출 PC에 캡처카드, 기타 USB 장치가 꽂혀 있으면 USB 버스 전력이 불안정해질 수 있고, 이게 간헐적 disconnect → reconnect 사이클의 원인이 될 수 있어. 특히 x264 인코딩 부하가 높을 때 시스템 전반의 전력 관리가 흔들리면 USB 포트 전압이 순간적으로 떨어질 수 있거든.

**4. 드라이버 상태 손상이 진짜 문제**

포트를 바꿔도, 재부팅해도 안 되고 **드라이버 재설치로만 복구**됐다는 건 하드웨어가 아니라 **Topping ASIO 드라이버가 내부적으로 꼬인 상태**였다는 거야. ASIO 드라이버가 비정상 종료되면서 레지스트리나 커널 레벨 핸들이 잘못 남아서, Windows가 디바이스를 열거(enumerate)할 수 없는 상태가 된 거지. 이건 sample rate mismatch가 직접 원인이라기보다는, ASIO 드라이버의 에러 핸들링이 부실한 게 근본 원인이야.

**네 셋업에서 방지하려면:**

첫째, TOPPING Professional Control Center에서 자동 스탠바이 비활성화. 둘째, E2x2 OTG에 별도 DC 5V 전원 공급 (USB 전원에만 의존하지 않기). 셋째, Windows 전원 옵션에서 USB 선택적 절전 비활성화. 넷째, 만약 Reaper에서 ASIO 에러가 한 번이라도 뜨면, Reaper를 닫고 TOPPING Professional Control Center에서 드라이버 상태를 리셋한 후 다시 열기 — 반복되면 드라이버가 완전히 꼬이기 전에 잡을 수 있어.

이 문제가 x264 인코딩 중에 발생했어? 아니면 인코딩과 무관하게 Reaper만 켜놓은 상태에서도 났어?



## Prompt:
2026. 3. 13. 오전 9:54:30

x264인코딩은 송출컴에서 하고 있었음(오인페는 게임컴에 연결됨. Reaper도 게임컴에 있음). 그리고 5v1a 어댑터로 보조전원 공급중이었음.



## Response:
2026. 3. 13. 오전 9:54:44

아 그러면 상황이 좀 달라지네. 오인페가 **게임 PC에 연결**돼 있었고, x264 부하는 송출 PC 쪽이니까 x264 CPU 경합은 원인에서 빠지고, 보조전원도 공급 중이었으니 USB 전원 부족도 가능성이 낮아.

그러면 게임 PC 쪽에서 뭔가가 ASIO 드라이버를 건드린 거야. 몇 가지 질문으로 좁혀볼게.

````plaintext
Tool: Generating ask_user_input_v0...
````





## Prompt:
2026. 3. 13. 오전 9:56:11

한번 발생 후 드라이버 재설치로 연결이 끊기는 문제는 해결됐으나 간헐적으로 지직거리는 문제가 잔존.



## Response:
2026. 3. 13. 오전 9:56:20

알겠어. 나머지 두 질문도 답해줄 수 있어? 원인 좁히는 데 중요해서.

````plaintext
Tool: Generating ask_user_input_v0...
````





## Prompt:
2026. 3. 13. 오전 9:56:25

질문: 이 증상이 발생했을 때 게임 PC에서 뭘 하고 있었어? (해당하는 항목을 모두 선택)
답변: Apex Legends 플레이 중, Reaper에서 VST 체인 돌리는 중 (Supertone Clear 등), OBS (게임 PC 쪽)도 켜져 있었음

질문: Reaper 오디오 설정이 어떻게 돼 있었어?
답변: ASIO (Topping 네이티브 드라이버)



## Response:
2026. 3. 13. 오전 9:56:55

좋아, 이제 상황이 꽤 명확해졌어. 정리하면:

**게임 PC (9950X3D)에서 동시에 돌리고 있던 것:**
Apex Legends + Reaper (Topping ASIO, VST 체인 포함) + OBS

이건 게임 PC 쪽에서도 상당한 복합 부하가 걸린 상태야. 특히 핵심은 **ASIO 독점 모드와 다른 앱들 사이의 충돌**이야.

**간헐적 지직거림의 가장 유력한 원인들:**

**DPC 레이턴시 스파이크** — 9950X3D에서 Apex가 GPU를 풀로드로 밀면, NVIDIA 드라이버가 높은 DPC 레이턴시를 유발해. 이게 Topping ASIO 드라이버의 실시간 오디오 처리를 방해하면 지직거림이 나. 특히 Apex처럼 프레임이 불규칙하게 튀는 장면(큰 전투, 링 이동)에서 GPU 드라이버의 DPC가 급증하거든.

**OBS가 같은 오디오 디바이스에 접근** — Reaper가 Topping을 ASIO 독점 모드로 잡고 있는 상태에서, OBS가 같은 Topping 디바이스를 Windows 오디오(WASAPI) 경로로 동시에 건드리면 드라이버 내부에서 충돌이 생길 수 있어. OBS에서 오디오 입력을 Topping 디바이스로 직접 잡고 있었어? 아니면 ReaRoute/가상 오디오 케이블로 Reaper 출력을 OBS에 넘기고 있었어?

**Supertone Clear의 멀티코어 부하 + Apex의 코어 경합** — Clear가 모든 코어에 분산 처리하는 특성상, Apex도 멀티코어를 적극 쓰는 게임이라 코어 레벨에서 스케줄링 충돌이 날 수 있어.

````plaintext
Tool: Generating ask_user_input_v0...
````

이 두 가지를 알면 지직거림의 원인을 거의 특정할 수 있어. 특히 OBS 오디오 라우팅이 핵심 단서야 — ASIO 독점 모드에서 다른 앱이 같은 디바이스에 접근하는 구조면 간헐적 글리치가 거의 확실하거든.



## Prompt:
2026. 3. 13. 오전 9:59:06

질문: 게임 PC OBS에서 오디오 입력은 어떻게 설정돼 있었어?
답변: reaper는 오인페의 analogue input을 input으로 잡아서 vst체인을 거친 후에 topping playback3/4로 내보냄. topping playback3/4는 loopback3/4에 할당돼있고 이 loopback3/4는 mobile out(otg)를 통해 송출컴으로 전달됨. 게임 소리는 obs에서 '응용프로그램 오디오 캡쳐' 기능으로 캡쳐카드에 전달.

질문: 지직거림이 게임 부하와 상관관계 있었어?
답변: 패턴 모르겠음



## Response:
2026. 3. 13. 오전 9:59:32

오 라우팅 구조가 꽤 깔끔하게 짜여있네. 정리하면:

```
마이크 → Topping Analog In → Reaper (ASIO, VST체인) → Playback 3/4
→ Loopback 3/4 → OTG Mobile Out → 송출 PC
게임 소리 → OBS 응용프로그램 오디오 캡쳐 → 캡처카드 → 송출 PC
```

이 구조면 OBS가 Topping 디바이스를 직접 오디오 입력으로 잡는 건 아니니까, ASIO 독점 모드 충돌은 아니야. 그건 다행이고.

다만 이 구조에서 **지직거림의 유력한 원인 후보**가 좁혀져:

**Topping 내부 라우팅 부하** — Reaper가 ASIO로 Analog In을 잡고, VST 체인 처리 후 Playback 3/4로 내보내고, 그게 Loopback 3/4로 할당되고, 다시 OTG로 나가는 건 Topping 드라이버 내부에서 꽤 많은 라우팅이 동시에 돌아가는 상황이야. 여기에 Windows도 Topping의 다른 출력(Playback 1/2 등)을 기본 사운드 디바이스로 쓰고 있을 테니, 드라이버가 동시에 ASIO + WDM(Windows 오디오) 양쪽을 서빙하는 거지.

**핵심 질문 하나만 더:**

````plaintext
Tool: Generating ask_user_input_v0...
````

이 세 가지면 지직거림 원인을 거의 특정할 수 있어. 특히 buffer size가 낮으면서 Supertone Clear를 돌리고 있었다면 그게 직접 원인일 가능성이 높고, sample rate 설정에 따라 드라이버 크래시까지 연결고리가 보일 수 있어.



## Prompt:
2026. 3. 13. 오전 10:00:22

질문: Windows 기본 사운드 출력 장치가 어디로 설정돼 있었어? (게임 소리, 디스코드 등이 나오는 출력)
답변: Topping Playback 1/2 (기본 출력)

질문: Topping Professional Control Center에서 sample rate 설정이 어떻게 돼 있었어?
답변: 48kHz

질문: Reaper ASIO 버퍼 사이즈가 얼마였어?
답변: 1024 이상



## Response:
2026. 3. 13. 오전 10:00:51

좋아, 이제 전체 그림이 보여. 정리하면:

**게임 PC 오디오 상태:**
- Topping ASIO 48kHz, 버퍼 1024+
- Windows 기본 출력 = Topping Playback 1/2 (WDM)
- Reaper = ASIO로 Analog In → VST 체인 → Playback 3/4
- 동시에 Apex + OBS도 구동 중

버퍼 1024면 Supertone Clear 기준으로 충분하고, sample rate도 48kHz로 통일돼 있으니 그쪽도 문제 아닌 것 같아.

그러면 남은 가장 유력한 원인은 **Topping 드라이버가 ASIO와 WDM을 동시에 서빙하는 구조에서의 간헐적 충돌**이야.

지금 네 셋업에서 Topping 드라이버는 이걸 동시에 처리하고 있어:

**ASIO 경로** (Reaper) — Analog In → VST → Playback 3/4 → Loopback → OTG

**WDM 경로** (Windows) — Apex 게임 소리, 디스코드 등 → Playback 1/2 → 헤드폰

이 두 경로가 하나의 USB 오디오 디바이스 안에서 동시에 돌아가는데, Topping의 XMOS 칩과 드라이버가 이 동시 접근을 완벽하게 핸들링하지 못하면 간헐적으로 타이밍 글리치가 생겨. 특히 Apex가 GPU를 풀로드로 밀 때 시스템 전반의 DPC 레이턴시가 튀면, ASIO 콜백이 제시간에 완료되지 못해서 지직거림이 나는 거지.

**이걸 확인하고 해결하는 순서:**

**1단계: DPC 레이턴시 확인** — LatencyMon을 켜고 Apex를 플레이하면서 모니터링해봐. `NVIDIA dxgkrnl`이나 `ndis.sys`(네트워크)가 높은 DPC를 유발하고 있다면, 그게 ASIO 글리치의 직접 원인이야. 특히 RTX 4080이면 NVIDIA 드라이버가 DPC 주범인 경우가 많아.

**2단계: NVIDIA 드라이버 최적화** — NVIDIA 제어판에서 "전원 관리 모드"를 "최대 성능 선호"로, 그리고 최근 드라이버에서 DPC 문제가 있었다면 한두 버전 롤백. Game Ready보다 Studio Driver가 DPC 측면에서 더 안정적인 경우가 있어.

**3단계: Topping WDM + ASIO 동시 사용 분리 테스트** — Windows 기본 출력을 Topping 말고 GPU HDMI나 내장 오디오로 잠깐 바꿔봐. 게임 소리는 어차피 OBS 앱 오디오 캡처로 잡고 있으니까, 헤드폰 모니터링만 좀 불편해지지만 Topping이 **ASIO 전용**으로만 동작하게 돼. 이 상태에서 지직거림이 사라지면 → WDM+ASIO 동시 서빙이 원인 확정.

**4단계: 만약 3단계에서 원인 확정되면** — 장기 해결책은 게임 소리 모니터링용으로 저렴한 USB DAC를 하나 더 쓰거나, Topping의 Playback 1/2를 Windows 기본 출력에서 빼고 가상 오디오(VoiceMeeter 등)를 거쳐서 Topping으로 내보내는 방식으로 WDM 직접 접근을 차단하는 거야.

근데 솔직히 가장 깔끔한 건 **Topping을 Reaper ASIO 전용으로만 쓰고, Windows 기본 출력은 다른 디바이스로 분리**하는 거야. 이러면 드라이버 내부 ASIO/WDM 경합이 원천 차단돼.

한번 LatencyMon부터 돌려보고, 3단계 테스트 해보겠어?



## Prompt:
2026. 3. 13. 오전 10:03:48

현재 topping playback1/2로 windows 출력을 듣는 이유가 playback1/2와 송출컴에서 나는 소리를 mobile in(otg)를 통해 Mix A에 넣어서 output으로 할당해서 게임컴과 송출컴 소리 둘 다 한 이어폰으로 듣기 위해서야. windows 기본 출력을 다른 디바이스로 분리하면 이게 불가능해져



## Response:
2026. 3. 13. 오전 10:04:09

아 그렇구나, OTG 믹싱 기능을 쓰고 있는 거네. 구조를 다시 정리하면:

```
[게임 PC]
  Windows 출력 (게임/디스코드) → Topping Playback 1/2 ─┐
  Reaper VST 체인 출력 → Playback 3/4 → Loopback → OTG Out → 송출 PC
                                                                 │
[송출 PC]                                                        │
  송출 PC 소리 → OTG In (Mobile In) ─────────────────────────────┘
                                                                 │
[Topping 내부 Mix A]                                             │
  Playback 1/2 + Mobile In (송출PC 소리) → Output → 헤드폰      │
```

이러면 Topping이 진짜 풀가동 상태야. ASIO(Reaper), WDM(Windows), OTG(송출PC), 내부 믹서(Mix A) 전부 동시에 돌리는 거니까. 이 상태에서 Windows 출력을 분리하면 송출PC 소리와 게임 소리를 한 헤드폰으로 합쳐 듣는 게 깨지는 거고.

그러면 접근을 바꿔야 해.

````plaintext
Tool: Generating ask_user_input_v0...
````

Topping이 이렇게 많은 경로를 동시에 처리하는 구조에서 간헐적 글리치가 나는 건, 드라이버의 한계일 수도 있고 DPC 같은 시스템 레벨 문제일 수도 있어서 — 어떤 방향으로 파고 싶은지에 따라 다음 단계가 달라져.



## Prompt:
2026. 3. 13. 오전 10:04:27

질문: 어떤 방향으로 해결하고 싶어? (해당하는 항목을 모두 선택)
답변: DPC 레이턴시 확인부터 해보고 싶음



## Response:
2026. 3. 13. 오전 10:04:48

좋아, DPC 레이턴시 확인부터 가자. LatencyMon이 가장 적합해.

**테스트 방법:**

LatencyMon을 켜고 세 단계로 나눠서 각각 5분씩 돌려봐.

**1차: 아이들 상태** — 아무것도 안 켠 상태. 이게 베이스라인이야.

**2차: Reaper만** — Reaper에서 Topping ASIO 잡고 Supertone Clear 체인 돌리는 상태.

**3차: 풀 로드** — Reaper + Apex + OBS 전부 켠 상태. 실제 방송 환경 재현.

각 단계에서 LatencyMon의 **Drivers 탭**을 봐야 해. 거기서 "Highest execution (ms)" 컬럼 기준으로 정렬하면 어떤 드라이버가 DPC를 오래 잡고 있는지 바로 보여. 오디오 글리치가 발생하려면 보통 **1ms 이상** 찍히는 드라이버가 있으면 위험하고, **2ms 이상**이면 거의 확실히 문제야.

**주로 범인이 되는 드라이버들:**

`dxgkrnl.sys` — NVIDIA GPU 드라이버. Apex 풀로드 시 급증하는 경우 많음.
`ndis.sys` / 네트워크 어댑터 드라이버 — 특히 Wi-Fi가 켜져 있으면.
`USBXHCI.sys` — USB 컨트롤러. Topping 자체가 여기 물려있으니 관련성 높음.
`storport.sys` / `stornvme.sys` — NVMe 드라이버. 가끔 범인.

**3차 테스트에서 지직거림이 실제로 발생하면** LatencyMon 메인 화면 상단에 빨간 경고가 뜰 거야. 그때 Drivers 탭 스크린샷을 찍어두면 원인 드라이버를 바로 특정할 수 있어.

LatencyMon은 [resplendence.com](https://www.resplendence.com/latencymon)에서 무료로 받을 수 있고, 테스트 결과 나오면 같이 분석해보자.



## Prompt:
2026. 3. 13. 오전 10:24:55

추가로, 드라이버 재설치 후에 혹시 cpu사용량 치솟을때가 문제인가 싶어 유튜브 영상 틀어놓고 cinebench 23 돌렸는데 소리 정상

3dmark tas돌리면서 유튜브 영상 틀어봤는데 소리 정상이었음



## Response:
2026. 3. 13. 오전 10:25:15

오 그거 중요한 단서야. Cinebench 23은 CPU 올코어 100% 부하, 3DMark Time Spy는 GPU 풀로드 + CPU 혼합 부하인데 둘 다 소리가 정상이었다면:

**CPU 부하 자체는 원인이 아니야.** Cinebench가 32스레드 전부 100%로 밀어도 Topping WDM 출력이 깨지지 않았으니까.

**GPU 부하(DPC) 단독도 원인이 아니야.** 3DMark가 RTX 4080을 풀로드로 밀었는데도 정상이었으니까.

그러면 남는 건 **Reaper ASIO + WDM 동시 사용 상태에서만 발생하는 문제**일 가능성이 높아져. Cinebench/3DMark 테스트 때는 Reaper를 안 켰을 거잖아? 즉 Topping이 WDM 단독으로만 동작하는 상태였을 거고.

이걸 확정하려면 테스트를 하나 더 해볼 수 있어:

````plaintext
Tool: Generating ask_user_input_v0...
````

이 답에 따라 다음 진단 방향이 확 갈려:

만약 Reaper 안 켰었다면 → **Reaper ASIO가 올라간 상태 + 부하** 조합이 트리거라는 가설이 강해지고, 다음 테스트는 "Reaper ASIO 켠 상태에서 Cinebench 돌리기"가 돼.

만약 Reaper도 켰었다면 → ASIO+WDM 동시 사용이 원인이 아닌 거니까, Apex 특유의 뭔가(안티치트 커널 드라이버, 특정 오디오 API 호출 등)로 범위가 좁혀져.



## Prompt:
2026. 3. 13. 오전 10:26:06

질문: Cinebench/3DMark 테스트 때 Reaper(ASIO)도 같이 켜놓았었어?
답변: Reaper도 같이 켜놓았음



## Response:
2026. 3. 13. 오전 10:26:33

오 그러면 상황이 또 반전이네. 정리하면:

**지직거림 안 남:** Reaper(ASIO) + Cinebench 올코어 100% + 유튜브(WDM)
**지직거림 안 남:** Reaper(ASIO) + 3DMark GPU 풀로드 + 유튜브(WDM)
**지직거림 남:** Reaper(ASIO) + Apex + OBS + 실제 방송 환경

CPU 풀로드도 아니고, GPU 풀로드도 아니고, ASIO+WDM 동시 사용 자체도 아니야. 그러면 **Apex + OBS 조합에서만 발생하는 뭔가**가 있는 거야.

Apex Legends 특유의 요소들이 있어:

**EasyAntiCheat (EAC) 커널 드라이버** — 커널 레벨에서 동작하면서 시스템 콜을 후킹하는데, 이게 간헐적으로 높은 DPC 레이턴시를 유발한다는 보고가 오디오 커뮤니티에 꽤 있어. Cinebench/3DMark에는 안티치트가 없잖아.

**OBS 응용프로그램 오디오 캡쳐** — 네가 게임 소리를 이걸로 잡고 있다고 했는데, 이 기능이 베타이고 Windows Audio Session API를 후킹하는 방식이라 특정 게임과 충돌이 알려져 있어. 앞서 리서치에서도 이 기능이 17~22분 후 크래클링을 유발한다는 보고가 있었고.

**Apex의 오디오 엔진** — Apex가 자체적으로 오디오 디바이스에 접근하는 방식이 다른 게임과 다를 수 있어.

````plaintext
Tool: Generating ask_user_input_v0...
````

이 두 가지 답이 나오면, OBS 응용프로그램 오디오 캡쳐의 알려진 버그인지 아니면 EAC 커널 드라이버 문제인지 거의 특정할 수 있어.



## Prompt:
2026. 3. 13. 오전 10:27:31

질문: 지직거림이 언제부터 있었는지 기억나?
답변: 오인페 도입을 어제 했고 오늘 생김

질문: 지직거림이 방송 시작 후 언제쯤 나타나?
답변: 10~20분 후부터



## Response:
2026. 3. 13. 오전 10:27:50

**10~20분 후부터** — 이거 거의 확정적인 단서야.

앞서 리서치에서 정확히 이 패턴이 나왔어. **OBS 응용프로그램 오디오 캡쳐(베타)**가 약 17~22분 후부터 오디오 크래클링을 유발하는 알려진 버그가 있어. 네 타이밍이랑 정확히 일치해.

테스트 하나만 하면 확정할 수 있어:

**OBS 응용프로그램 오디오 캡쳐를 끄고** 게임 소리를 다른 방식으로 잡아봐. 예를 들어 "오디오 출력 캡쳐"로 Windows 기본 출력 전체를 잡거나, 아니면 게임 소리 캡쳐를 아예 빼고 Reaper + Apex만 돌려서 20분 이상 플레이해봐. 지직거림이 사라지면 → OBS 앱 오디오 캡쳐가 범인 확정.

````plaintext
Tool: Generating ask_user_input_v0...
````

만약 OBS 앱 오디오 캡쳐가 범인이면 대안도 있으니까 걱정 안 해도 돼. 네 라우팅 구조에서 게임 소리는 어차피 송출 PC로 넘겨야 하는 거니까, 캡쳐 방식만 바꾸면 되는 문제야.



## Prompt:
2026. 3. 13. 오전 10:28:17

질문: 어떻게 하고 싶어?
답변: 대안 방법으로 게임 소리 캡쳐하는 방법 알려줘



## Response:
2026. 3. 13. 오전 10:28:49

네 라우팅 구조에서 게임 소리를 송출 PC로 넘기는 대안들을 정리해볼게. 현재 구조를 고려하면:

**현재:** Apex 소리 → OBS 응용프로그램 오디오 캡쳐(베타) → 캡처카드 → 송출 PC

이걸 대체할 수 있는 방법들이야:

---

**방법 1: Topping Loopback 활용 (가장 깔끔)**

이미 Topping의 Loopback/OTG 라우팅을 잘 쓰고 있으니까, 같은 원리를 확장하는 거야. Windows 기본 출력이 Playback 1/2로 가고 있잖아. Topping Professional Control Center에서 Playback 1/2도 Loopback에 포함시켜서 OTG Out으로 내보내면, 마이크(Playback 3/4 경유)와 게임 소리(Playback 1/2)가 같이 송출 PC로 넘어가. 이러면 게임 PC 쪽 OBS에서 오디오 캡쳐를 아예 안 해도 돼.

다만 이 경우 마이크와 게임 소리가 OTG에서 합쳐져서 넘어가니까, 송출 PC에서 별도 볼륨 조절이 안 될 수 있어. Topping Control Center에서 Mix 설정으로 어느 정도 밸런스는 잡을 수 있지만.

**방법 2: 게임 PC OBS에서 "오디오 출력 캡쳐"로 교체**

응용프로그램 오디오 캡쳐(베타) 대신, 기존 "오디오 출력 캡쳐" 소스를 쓰는 거야. 이건 특정 앱이 아니라 Windows 오디오 출력 디바이스 전체를 캡쳐하는 방식이라 베타 기능의 후킹 버그가 없어. 단점은 Apex뿐 아니라 디스코드, 유튜브 등 Playback 1/2로 나가는 모든 소리가 같이 잡힌다는 거야. 근데 방송 중에 Playback 1/2로 나가는 소리가 대부분 게임+디스코드라면 실질적으로 문제없을 수 있어.

**방법 3: VB-Audio Virtual Cable로 Apex만 분리**

Windows 사운드 설정에서 Apex의 출력만 VB-Audio Virtual Cable (무료)로 돌리고, 게임 PC OBS에서 그 가상 케이블을 오디오 입력으로 잡는 거야. Windows 10/11의 앱별 출력 디바이스 설정 (설정 → 시스템 → 소리 → 볼륨 믹서)에서 Apex만 가상 케이블로 지정하면 돼. 이러면 앱 오디오 캡쳐 베타를 안 쓰면서도 Apex 소리만 깔끔하게 분리할 수 있어.

다만 이 경우 Apex 소리가 Playback 1/2가 아닌 가상 케이블로 빠지니까, Topping 헤드폰으로 게임 소리를 못 듣게 돼. 이걸 해결하려면 VB-Audio Virtual Cable의 출력을 다시 Topping으로 라우팅하는 추가 설정이 필요해서 좀 복잡해져.

---

네 구조에서 가장 현실적인 건 **방법 1이나 2**인 것 같아. 방법 1이 되면 게임 PC OBS에서 오디오를 아예 안 만져도 되니까 가장 깔끔하고, 안 되면 방법 2가 가장 간단한 대체야.

````plaintext
Tool: Generating ask_user_input_v0...
````

Topping Control Center의 라우팅 설정을 이미 잘 활용하고 있으니까, 방법 1이 되면 구조가 제일 심플해지긴 해.



## Prompt:
2026. 3. 13. 오전 10:29:31

OBS 응용프로그램 오디오 캡쳐는 프라이버시 보호상(내가 별도로 틀어놓은 영상이나 디스코드 소리가 송출컴에 넘어가면 안됨) 필수임



## Response:
2026. 3. 13. 오전 10:29:54

아 맞아, 그러면 방법 2는 바로 탈락이고, 방법 1도 Playback 1/2 전체가 넘어가니까 같은 문제야.

결국 **특정 앱의 소리만 선택적으로 캡쳐**하면서 OBS 응용프로그램 오디오 캡쳐(베타)를 안 쓰는 방법이 필요한 거네.

**방법 3 변형이 답이야.** 근데 아까 말한 "게임 소리를 Topping 헤드폰으로 못 듣는" 문제를 해결해야 하고.

구조를 이렇게 잡으면 돼:

```
[Apex 출력 디바이스] → VB-Audio Virtual Cable
                         │
                         ├→ 게임 PC OBS "오디오 입력 캡쳐" → 캡처카드 → 송출 PC
                         │
                         └→ 다시 Topping으로 돌려보내기 (모니터링용)
```

"다시 Topping으로 돌려보내기"가 핵심인데, 이걸 하는 방법이 두 가지야:

**A. VoiceMeeter Banana 사용** — VB-Cable 출력을 VoiceMeeter에서 받아서 Topping Playback 1/2로 다시 내보내면 돼. 근데 VoiceMeeter를 추가로 띄우는 건 구조가 복잡해지고 추가 레이턴시 + 또 다른 오디오 문제 소지가 있어.

**B. OBS 자체의 오디오 모니터링 기능** — 이게 더 심플해. OBS에서 VB-Cable을 오디오 입력 캡쳐로 잡고, 그 소스의 "고급 오디오 속성"에서 오디오 모니터링을 "모니터와 출력"으로 설정하면, OBS가 그 소리를 Windows 기본 출력(Topping Playback 1/2)으로 다시 내보내줘. 추가 소프트웨어 없이 OBS 안에서 해결되는 거야.

최종 구조:

```
[Windows 앱별 출력 설정]
  Apex → VB-Audio Virtual Cable (게임 소리 분리)
  디스코드/유튜브/기타 → Topping Playback 1/2 (기존 그대로)

[게임 PC OBS]
  오디오 입력 캡쳐: VB-Audio Virtual Cable
  → 고급 오디오 속성: "모니터와 출력"
  → 모니터링 출력: Topping Playback 1/2 (헤드폰으로 들림)
  → 캡처카드로도 송출 PC에 전달

[나머지 전부 기존과 동일]
  Reaper ASIO → Playback 3/4 → Loopback → OTG → 송출 PC
  Topping Mix A (Playback 1/2 + Mobile In) → 헤드폰
```

이러면 Apex 소리만 깔끔하게 분리되고, 디스코드/유튜브는 송출 PC로 안 넘어가고, 헤드폰으로는 전부 들을 수 있어. OBS 응용프로그램 오디오 캡쳐(베타)를 완전히 제거하면서 프라이버시도 유지돼.

유일한 단점은 OBS 모니터링을 거치면서 게임 소리에 약간의 레이턴시가 생기는 건데, Apex 플레이에 체감될 정도는 아닐 거야. 한번 시도해볼래?



## Prompt:
2026. 3. 13. 오전 10:30:07

레이턴시도 총소리가 10ms라도 늦으면 손해라서 감수할 수 없음



## Response:
2026. 3. 13. 오전 10:30:40

맞아, 경쟁 FPS에서 10ms도 크지. 그러면 OBS 모니터링 경유는 탈락이야.

다시 정리하면 조건이:

- Apex 소리만 선택적 캡쳐 (프라이버시)
- 헤드폰 모니터링에 레이턴시 추가 없음
- OBS 응용프로그램 오디오 캡쳐(베타) 사용 안 함

이 세 조건을 동시에 만족하려면, **Apex 소리가 Topping으로 직접 가면서 동시에 캡쳐도 되는 구조**가 필요해.

**Windows 앱별 출력 + Topping 내부 라우팅으로 해결 가능할 수도 있어:**

```
[Windows 앱별 출력 설정]
  Apex → Topping Playback 3/4 (또는 다른 빈 Playback 채널)
  디스코드/유튜브/기타 → Topping Playback 1/2

[Topping Control Center]
  Playback 3/4 → Mix A에 포함 → 헤드폰 (레이턴시 0, 하드웨어 믹싱)
  Playback 3/4 → Loopback 할당 → OTG Out → 송출 PC
```

이러면 Apex 소리가 Topping 내부에서 하드웨어 레벨로 헤드폰에 믹싱되니까 레이턴시 제로이고, 동시에 Loopback→OTG로 송출 PC에도 넘어가. 디스코드/유튜브는 Playback 1/2에만 있으니 송출 PC로 안 가고.

근데 문제는 **현재 Playback 3/4를 Reaper VST 출력으로 이미 쓰고 있다**는 거야.

````plaintext
Tool: Generating ask_user_input_v0...
````

Topping E2x2 OTG의 내부 라우팅 유연성에 따라 이 접근이 가능한지 갈려. Playback 채널이 더 있고 Loopback→OTG를 여러 소스에서 합칠 수 있으면, 게임 PC OBS에서 오디오를 아예 안 만져도 되는 구조가 나와.



## Prompt:
2026. 3. 13. 오전 10:32:37

질문: Topping E2x2 OTG가 Playback 채널을 몇 쌍까지 제공해?
답변: Playback 5/6도 있음

질문: Topping Control Center에서 Loopback→OTG 할당이 얼마나 유연해?
답변: Loopback을 여러 쌍 돉립적으로 OTG로 보낼 수 있음



## Response:
2026. 3. 13. 오전 10:32:51

완벽해, 그러면 이 구조로 가면 돼:

```
[Windows 앱별 출력 설정]
  Apex         → Topping Playback 5/6
  디스코드/유튜브 → Topping Playback 1/2

[Reaper ASIO]
  Analog In → VST 체인 → Playback 3/4

[Topping Control Center 라우팅]
  Playback 1/2 → Mix A (헤드폰 모니터링용)
  Playback 3/4 → Loopback 3/4 → OTG Out (마이크 → 송출 PC)
  Playback 5/6 → Loopback 5/6 → OTG Out (게임 소리 → 송출 PC)
  Playback 5/6 → Mix A에도 포함 (헤드폰으로 게임 소리 모니터링)
  Mobile In    → Mix A (송출 PC 소리 모니터링)

[송출 PC]
  OTG In에서 마이크(3/4) + 게임 소리(5/6) 수신
```

이 구조의 장점:

**OBS 응용프로그램 오디오 캡쳐 완전 제거** — 게임 소리가 Topping 내부 하드웨어 라우팅으로 송출 PC에 넘어가니까, 게임 PC OBS에서 오디오를 아예 안 건드려도 돼. 10~20분 후 크래클링 버그 원천 차단.

**헤드폰 레이턴시 제로** — Playback 5/6 → Mix A가 Topping 내부 하드웨어 믹싱이라 추가 레이턴시 없음.

**프라이버시 보호** — 디스코드/유튜브는 Playback 1/2에만 있고, OTG로 안 나감.

**송출 PC에서 마이크/게임 소리 독립 볼륨 조절** — 3/4와 5/6가 분리된 채널로 들어오니까 송출 PC OBS에서 각각 볼륨 조절 가능.

확인할 것 하나만 — Topping Control Center에서 Playback 5/6을 Mix A에 포함시키면서 동시에 Loopback 5/6으로도 보내는 게 가능한지. 이게 되면 이 구조가 완성이야. 한번 Control Center에서 확인해볼 수 있어?



## Prompt:
2026. 3. 13. 오전 10:36:44

가능한거같아. 그럼 앱마다 윈도우 소리 설정에서 출력 기기를 1/2로 했다가 5/6으로 했다가 하면서 내가 듣는건 동일하게 듣되 송출할지말지를 고를 수 있는거지?

그리고 이 방식이 DPC 레이턴시 문제도 완화할 수 있는거임?



## Response:
2026. 3. 13. 오전 10:36:58

맞아, 정확히 그 원리야.

**앱별 출력 선택으로 송출 제어:**
Windows 설정 → 시스템 → 소리 → 볼륨 믹서에서 앱별로 출력 디바이스를 지정하면 돼. Playback 5/6으로 보내면 헤드폰으로 들리면서 송출 PC로도 가고, Playback 1/2로 보내면 헤드폰으로는 들리지만 송출 PC로는 안 가고. 일종의 "송출 스위치"가 되는 거지.

**DPC 레이턴시 문제 완화 여부:**

직접적으로 DPC 자체를 줄이진 않아. DPC는 GPU 드라이버나 커널 드라이버 레벨 문제니까, 오디오 라우팅을 바꾼다고 DPC 수치가 내려가진 않아.

근데 **실질적으로 문제가 사라질 가능성이 높아.** 이유는:

지직거림의 실제 원인이 DPC가 아니라 **OBS 응용프로그램 오디오 캡쳐(베타)의 17~22분 버그**일 가능성이 높거든. 네 증상 타이밍(10~20분 후 발생)이랑 정확히 맞고, Cinebench/3DMark + Reaper 풀로드에서는 안 났으니까. 이 구조로 바꾸면 그 베타 기능을 완전히 제거하는 거라 원인 자체가 없어져.

다만 바꾼 후에도 지직거림이 남으면, 그때 LatencyMon으로 DPC를 확인하면 돼. 원인을 하나씩 소거하는 순서로 가는 게 가장 효율적이야.



## Prompt:
2026. 3. 13. 오전 10:37:45

그래도 먼저 latencymon으로 시스템 전반의 드라이버 레이턴시 문제를 먼저 잡고 갈래



## Response:
2026. 3. 13. 오전 10:37:58

좋은 접근이야. 기반부터 깨끗하게 만들고 가는 게 맞아.

아까 말한 테스트 순서대로 가되, 네 실제 환경에 맞게 조정하면:

**1차: 아이들** — 아무것도 안 켠 상태, 5분

**2차: Reaper ASIO만** — Topping ASIO + Supertone Clear 체인 가동, 5분

**3차: Reaper + Apex** — 게임 플레이하면서, 5분

**4차: 풀 로드** — Reaper + Apex + OBS(현재 앱 오디오 캡쳐 포함), 20분 이상

4차에서 20분 이상 돌리는 이유는 네 지직거림이 10~20분 후에 나타나니까, 그 시점에 LatencyMon에서 어떤 드라이버가 튀는지 잡기 위해서야.

각 단계에서 봐야 할 것:

LatencyMon **Drivers 탭**에서 "Highest execution (ms)" 기준 정렬. 1ms 넘는 드라이버가 있으면 메모해두고, 단계별로 어떤 드라이버가 새로 등장하거나 수치가 올라가는지 비교하면 돼. 메인 화면 상단에 초록불이 빨간불로 바뀌는 시점도 중요해.

결과 나오면 Drivers 탭 스크린샷 공유해줘, 같이 분석하자.



## Prompt:
2026. 3. 13. 오전 10:58:40

벨킨 4포트 usb 3.0 to usb 3.0 허브가 있는데(무전원) 여기에 오인페 전원과 메인 usb 다 꽂을까



## Response:
2026. 3. 13. 오전 10:58:54

하지 마. 두 가지 이유야.

**전원 문제** — 무전원 USB 허브는 PC의 USB 포트 하나에서 전력을 공급받는데, USB 3.0 포트 하나가 제공하는 전력은 최대 900mA야. 거기에 오인페 전원 + 데이터 두 개를 꽂으면 전력이 분산돼서, 지금 별도 5V 1A 어댑터로 보조전원 넣고 있는 의미가 없어져. 오히려 전원 불안정으로 더 나빠질 수 있어.

**DPC 레이턴시 측면** — USB 허브를 거치면 USB 트랜잭션이 한 단계 더 생기고, 허브 컨트롤러가 추가 인터럽트를 발생시켜. 특히 무전원 허브는 전력 관리 관련 USB 이벤트가 추가로 생길 수 있어서, 지금 DPC 레이턴시 확인하려는 상황에서 변수만 하나 더 늘리는 거야.

Topping 매뉴얼에서도 오인페를 컴퓨터에 허브 없이 직접 연결하라고 권고하고 있어.

지금 구조대로 **오인페 USB-C는 PC에 직접, 보조전원은 5V 어댑터에 별도로** 유지하는 게 가장 안정적이야. LatencyMon 테스트도 이 상태에서 해야 정확한 베이스라인이 나와.



## Prompt:
2026. 3. 13. 오전 10:59:02

c type이어도?



## Response:
2026. 3. 13. 오전 10:59:16

아 맞아, 9950X3D 메인보드 후면에 USB-C 포트가 있는지가 문제지.

````plaintext
Tool: Generating ask_user_input_v0...
````

현재 연결 방식에 따라 허브가 필요한 상황인지 아닌지가 갈려.



## Prompt:
2026. 3. 13. 오전 10:59:32

질문: 게임 PC 메인보드에 USB-C 포트 상황이 어떨?
답: 후면 USB-C 포트 있음

질문: 현재 오인페 연결은 어떻게 하고 있어?
답: USB-C to A 케이블 사용 중



## Response:
2026. 3. 13. 오전 10:59:37

그러면 간단해. **USB-C to C 케이블로 후면 USB-C 포트에 직결**하는 게 가장 좋아.

USB-C to A는 USB 2.0으로 동작하는 케이블이 많고, 변환 과정에서 추가 오버헤드가 생길 수 있어. USB-C to C로 직결하면 네이티브 연결이라 드라이버 레벨에서 가장 깨끗해.

LatencyMon 테스트를 USB-C to C 직결 상태에서 하면 가장 정확한 베이스라인이 나와. Topping 번들 케이블이 USB-C to C였을 텐데, 그거 있어?



## Prompt:
2026. 3. 13. 오전 11:00:28

번들케이블 문제가 많대서

허브 자체도 모든 포트가 c타입인데 안됨? 메임보드 후면 usb 20g 포트에 허브 연결하고



## Response:
2026. 3. 13. 오전 11:00:48

허브 자체가 USB-C 4포트라 해도, 아까 말한 문제는 그대로야.

**무전원**이 핵심 문제야. USB-C든 A든 무전원 허브는 호스트 포트 하나에서 전력을 나눠 쓰는 구조라서, 오인페가 데이터 + 전원을 동시에 요구하는 상황에서 불안정해질 수 있어. 특히 오인페 보조전원(5V 1A)도 같은 허브를 통해 들어가면 허브 내부에서 전력이 경합해.

그리고 LatencyMon 테스트 목적에서도 **변수는 최소화**해야 해. 허브를 끼면 허브 컨트롤러 드라이버가 DPC 결과에 섞여 들어와서, 오인페 자체 문제인지 허브 문제인지 구분이 안 돼.

번들 케이블 문제가 많다는 건 Topping 커뮤니티에서 나온 얘기야?

````plaintext
Tool: Generating ask_user_input_v0...
````

어느 쪽이든, LatencyMon 테스트는 현재 USB-C to A 직결 상태에서 먼저 돌리고, 케이블 문제는 결과 보고 판단해도 늦지 않아.



## Prompt:
2026. 3. 13. 오전 11:00:52

질문: 번들 케이블 문제가 많다는 출처가 어디야?
답: 예, Topping 커뮤니티/리뷰에서 봤음



## Response:
2026. 3. 13. 오전 11:01:13

````plaintext
Web Search: Topping E2x2 OTG bundled USB cable problems issues
````

> **TOPPING E2x2 OTG User Manual** [manuals.plus](https://manuals.plus/m/f336c4d004c8869c2e9c3fea64834a7e28748bc573f124d8544793e684970ef1)
>
> **TOPPING E2x2 OTG USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping/e2x2-otg-usb-audio-interface-manual)
>
> **Topping Professional E2x2 OTG USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/asin/B0DFPHN79W)
>
> **The computer does not recognize this unit** [topping.pro](https://topping.pro/supports/rbjb4dn)
>
> **TOPPING E2x2 OTG USB Audio Interface User Manual** [device.report](https://device.report/manual/18440289)
>
> **TOPPING E2X2 OTG USB Audio Interface** [topping.store](https://www.topping.store/products/topping-e2x2-otg-usb-audio-interface)
>
> **TOPPING E2X2 USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping/e2x2-usb-audio-interface-manual)
>
> **TOPPING Professional TPP50E Professional E2X2 OTG USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping-professional/tpp50e-professional-e2x2-otg-usb-audio-interface-manual)
>
> **topping E2x2** [linuxmusicians.com](https://linuxmusicians.com/viewtopic.php?t=27639)
>
> **Audiophonics - TOPPING PROFESSIONAL E2X2 OTG USB Audio Interface 2 Inputs 2 Outputs 24bit 192kHz Black** [audiophonics.fr](https://www.audiophonics.fr/en/digital-interfaces/topping-professional-e2x2-otg-black-p-19297.html)
>
````plaintext
Web Search: Topping E2x2 번들 케이블 문제 USB
````

> **TOPPING E2X2 USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping/e2x2-usb-audio-interface-manual)
>
> **TOPPING E2x2 OTG 토핑 USB 오디오 인터페이스 - 나인오디오** [nineaudio.co.kr](https://nineaudio.co.kr/product/topping-e2x2-otg-%ED%86%A0%ED%95%91-usb-%EC%98%A4%EB%94%94%EC%98%A4-%EC%9D%B8%ED%84%B0%ED%8E%98%EC%9D%B4%EC%8A%A4/5757/)
>
> **TOPPING Professional TPP202 E2x2 USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping-professional/tpp202-e2x2-usb-audio-interface-manual)
>
> **Amazon.com: TOPPING E2X2 USB Audio Interface - High-Performance Mixer & Recording Interface for PC, Mac, iPhone & Android - Ultra-Linear Preamp, 48V Phantom Power, Low Noise, Real-Time Monitoring (White) : Musical Instruments** [amazon.com](https://www.amazon.com/TOPPING-E2X2-Audio-Interface-High-Performance/dp/B0DBPLTL5V)
>
> **E2x2 OTG | TOPPING Professional** [topping.pro](https://topping.pro/e2x2-otg/)
>
> **TOPPING E2X2 OTG USB Audio Interface** [topping.store](https://www.topping.store/products/topping-e2x2-otg-usb-audio-interface)
>
> **TOPPING E2x2 OTG USB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping/e2x2-otg-usb-audio-interface-manual)
>
> **TOPPING E2X2 USB Audio Interface** [topping.store](https://www.topping.store/products/topping-e2x2-usb-audio-interface)
>
> **TOPPING Professional E1x2 OTG Professional SB Audio Interface User Manual** [manuals.plus](https://manuals.plus/topping-professional/e1x2-otg-professional-sb-audio-interface-manual)
>
> **Amazon.com: TOPPING E2x2 OTG USB Audio Interface - Ultra-Linear Preamp & Powerful Headphone Amp,Optical Output, Dual Mobile Streaming, Zero-Latency, 192kHz/24bit Recording, PC/Mobile Compatible(White) : Musical Instruments** [amazon.com](https://www.amazon.com/TOPPING-E2x2-OTG-Audio-Interface/dp/B0DBPQWPPB)
>
영어/한국어 검색 둘 다에서 Topping E2x2 OTG 번들 케이블에 대한 구체적인 불량 보고는 못 찾겠어. Topping DAC 제품(D90 등)에서 USB 케이블 관련 문제가 있었다는 얘기는 있지만, E2x2 OTG 번들 케이블이 특별히 불량이라는 커뮤니티 합의는 보이지 않아.

어쨌든 현재 상태를 정리하면:

**지금 할 일 우선순위:**

**1. 현재 USB-C to A 케이블 직결 상태에서 LatencyMon 4단계 테스트** — 케이블 변경은 결과 보고 나서 판단해도 돼. 지금 케이블을 바꾸면 변수가 두 개(케이블 + 기존 문제)가 되니까.

**2. LatencyMon 결과에서 문제 드라이버 특정**

**3. OBS 응용프로그램 오디오 캡쳐 → Topping Playback 5/6 라우팅으로 교체**

**4. 그래도 지직거림이 남으면** → 그때 USB-C to C 번들 케이블이나 품질 좋은 C to C 케이블로 교체해서 비교

케이블 교체가 급한 게 아니라, 지금 상태에서 LatencyMon 먼저 돌리는 게 맞아. 결과 나오면 공유해줘.



## Prompt:
2026. 3. 13. 오전 11:22:22

근데 응용프로그램 오디오 캡쳐(베타)의 버그가 원인이라면, 내가 오인페를 도입하기 이전에도 이런 문제가 발생했어야 하지 않아? 근데 오인페 도입 전에도 응용프로그램 오디오 캡쳐(베타)는 그대로 쓰고 있었고 이런 문제 한번도 없었어.



## Response:
2026. 3. 13. 오전 11:22:36

아 좋은 지적이야. 그러면 OBS 앱 오디오 캡쳐 단독 버그는 아닌 거네.

원인이 **OBS 앱 오디오 캡쳐 + Topping ASIO/WDM 동시 구동의 조합**에서 발생하는 거일 수 있어. 오인페 도입 전에는 Windows 기본 오디오만 있었을 테니 ASIO가 없었고, 앱 오디오 캡쳐가 문제없이 돌아간 거지. Topping이 ASIO + WDM + Loopback + OTG를 동시에 서빙하는 상태에서 앱 오디오 캡쳐가 Windows Audio Session API를 후킹하면, Topping WDM 드라이버 쪽에서 간헐적 충돌이 생기는 거일 수 있어.

이걸 확인하려면 LatencyMon 4단계 테스트가 더 중요해졌어. 특히 **3차(Reaper + Apex, OBS 없이)와 4차(풀 로드, OBS 포함)를 비교**하면:

3차에서 깨끗하고 4차에서 문제가 나타나면 → OBS 앱 오디오 캡쳐 + Topping 조합이 원인. Playback 5/6 라우팅으로 교체하면 해결.

3차에서도 문제가 나타나면 → OBS와 무관하게 Reaper ASIO + Apex 조합 자체가 원인. 다른 방향으로 파야 해.

결국 LatencyMon이 이 모든 가설을 검증해주는 열쇠야. 테스트 결과 나오면 같이 보자.





---
Powered by [Claude Exporter](https://www.ai-chat-exporter.net)