# Compatibility baseline

React Audio Native uses capability detection rather than User-Agent branches. When the mounted media
element lacks the prerequisites for custom controls, `<AudioPlayer />` switches to native
`<audio controls>`.

| Platform                        | Baseline                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| Chrome / Edge                   | Latest two major versions; Chromium 96 minimum                      |
| Firefox                         | Current and ESR; Firefox 115 minimum                                |
| Safari / iOS Safari / WKWebView | 15.6 minimum                                                        |
| Android                         | Android 8+ with Chrome or WebView 96+                               |
| HarmonyOS                       | HarmonyOS 3/4 WebView and NEXT/ArkWeb via capability detection      |
| Embedded WebView                | Same engine baselines; autoplay and download may be host-restricted |

IE11 is not supported. Media Session, native HLS, download naming and autoplay are progressive
enhancements. An autoplay rejection produces `AUTOPLAY_BLOCKED` while keeping the player usable.

`detectAudioCapabilities()` reports custom-control prerequisites, the download attribute, Media
Session, native HLS MIME support, Pointer Events and touch input independently. The configurable
`AudioPlayerBridge` reports state, track and error events without assuming a particular native host
protocol.

Stable publication requires either dated smoke evidence from every required WebView environment or
a version-bound maintainer assessment that records successful automated evaluation and explicitly
accepts the remaining host-specific risk. See the [compatibility decision](./device-smoke/).
