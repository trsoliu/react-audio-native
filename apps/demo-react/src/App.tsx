import {
  AudioLines,
  Check,
  Clipboard,
  GitFork,
  Languages,
  Laptop,
  Menu,
  Moon,
  Radio,
  Settings2,
  Smartphone,
  Sun,
  Waves,
  Webhook,
  X,
  Zap,
} from 'lucide-react'
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import {
  AudioPlayer,
  type AudioPlayerError,
  type AudioPlayerHandle,
  type AudioSnapshot,
  type AudioTrack,
  type RepeatMode,
} from 'react-audio-native'

import { HeadlessPlayer } from '@/components/HeadlessPlayer'
import {
  type DemoFormat,
  type DemoSize,
  SettingsPanel,
} from '@/components/SettingsPanel'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type Locale = 'zh' | 'en'
type PreviewMode = 'desktop' | 'phone' | 'webview'

interface EventEntry {
  detail: string
  id: number
  name: string
  time: string
}

const peaks = Array.from({ length: 180 }, (_, index) => {
  const base = Math.sin(index * 0.31) * 0.28 + Math.sin(index * 0.071) * 0.34
  return Math.min(1, Math.max(0.1, Math.abs(base) + (index % 11) / 24))
})

const snippets = {
  bridge: `const bridge = {
  emit(event) {
    window.ReactAudioHost?.postMessage(event)
  },
}`,
  headless: `const { audioRef, snapshot, controls } = useAudioPlayer({
  src: '/audio/example.wav',
  exclusive: true,
  group: 'studio',
})`,
  migration: `<AudioPlayer
  src="/audio/example.wav"
  onStateChange={setSnapshot}
/>

// Vue 3 keeps the same core state contract.`,
  modern: `<AudioPlayer
  tracks={playlist}
  repeatMode="all"
  mediaSession
  onStateChange={onStateChange}
/>`,
}

export function App() {
  const [locale, setLocale] = useState<Locale>('zh')
  const [dark, setDark] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [format, setFormat] = useState<DemoFormat>('fallback')
  const [mediaSession, setMediaSession] = useState(false)
  const [exclusive, setExclusive] = useState(true)
  const [nativeControls, setNativeControls] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all')
  const [playerSize, setPlayerSize] = useState<DemoSize>('default')
  const [glow, setGlow] = useState(72)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [playerState, setPlayerState] = useState<AudioSnapshot['state']>('idle')
  const [activeTrack, setActiveTrack] = useState(0)
  const [lastError, setLastError] = useState<AudioPlayerError | null>(null)
  const [eventLog, setEventLog] = useState<EventEntry[]>([])
  const eventId = useRef(0)
  const lastLoggedSecond = useRef(-1)
  const initialized = useRef(false)
  const mainPlayer = useRef<AudioPlayerHandle>(null)

  const copy =
    locale === 'zh'
      ? {
          architecture: '同一内核，四种接入视角',
          compatibility: '跨端兼容策略',
          events: '实时事件',
          eyebrow: 'React 18/19 · TypeScript · Web Audio UI',
          intro:
            '一个事件驱动、可主题化、面向移动浏览器与 WebView 的音频播放器。无轮询、SSR 安全、框架共享同一状态契约。',
          multi: '多实例互斥播放',
          playground: '交互实验台',
          settings: '演示设置',
          title: '让每一个浏览器，都拥有同一套声音体验。',
        }
      : {
          architecture: 'One core, four integration views',
          compatibility: 'Cross-platform strategy',
          events: 'Live events',
          eyebrow: 'React 18/19 · TypeScript · Web Audio UI',
          intro:
            'An event-driven, themeable audio player for mobile browsers and WebViews. No polling, SSR safe, and one state contract across frameworks.',
          multi: 'Exclusive multi-instance playback',
          playground: 'Interactive lab',
          settings: 'Demo settings',
          title: 'One consistent listening experience, in every browser.',
        }

  const audioSources = useMemo(() => {
    if (format === 'broken') {
      return { src: '/audio/missing-file.mp3', type: 'audio/mpeg' }
    }
    if (format === 'wav') {
      return { src: '/audio/neon-room.wav', type: 'audio/wav' }
    }
    return [
      {
        src: '/audio/not-requested.demo',
        type: 'audio/x-audio-native-demo',
      },
      { src: '/audio/neon-room.wav', type: 'audio/wav' },
    ] as const
  }, [format])

  const tracks = useMemo<readonly AudioTrack[]>(
    () => [
      {
        album: 'Audio Native Sessions',
        artist: locale === 'zh' ? '浏览器合成器' : 'Browser Synthesizer',
        artwork: [
          { sizes: '800x800', src: '/cover.svg', type: 'image/svg+xml' },
        ],
        downloadName: 'audio-native-neon-room.wav',
        id: 'neon-room',
        peaks,
        sources: audioSources,
        title: locale === 'zh' ? '霓虹录音室' : 'Neon Room',
      },
      {
        album: 'Audio Native Sessions',
        artist: locale === 'zh' ? '浏览器合成器' : 'Browser Synthesizer',
        artwork: [
          { sizes: '800x800', src: '/cover.svg', type: 'image/svg+xml' },
        ],
        id: 'after-hours',
        peaks: [...peaks].reverse(),
        sources: audioSources,
        title: locale === 'zh' ? '深夜回放' : 'After Hours',
      },
    ],
    [audioSources, locale],
  )

  const record = useCallback((name: string, detail: string): void => {
    eventId.current += 1
    const entry = {
      detail,
      id: eventId.current,
      name,
      time: new Date().toLocaleTimeString([], {
        hour12: false,
        minute: '2-digit',
        second: '2-digit',
      }),
    }
    setEventLog((current) => [entry, ...current].slice(0, 48))
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [dark, locale, reducedMotion])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    record('ready', 'React Audio Native demo')
  }, [record])

  useEffect(() => {
    if (!drawerOpen) return
    const frame = requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-demo-drawer-close]')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [drawerOpen])

  const onStateChange = useCallback(
    (snapshot: AudioSnapshot): void => {
      setPlayerState(snapshot.state)
      record('statechange', snapshot.state)
    },
    [record],
  )

  const onTrackChange = useCallback(
    (track: AudioTrack | null, index: number): void => {
      setActiveTrack(index)
      lastLoggedSecond.current = -1
      record('trackchange', `${index} · ${track?.title ?? 'none'}`)
    },
    [record],
  )

  const onTimeUpdate = useCallback(
    (currentTime: number): void => {
      const second = Math.floor(currentTime)
      if (second === lastLoggedSecond.current) return
      lastLoggedSecond.current = second
      record('timeupdate', `${currentTime.toFixed(2)}s`)
    },
    [record],
  )

  const onError = useCallback(
    (error: AudioPlayerError): void => {
      setLastError(error)
      record('error', error.code)
    },
    [record],
  )

  async function copySnippet(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(locale === 'zh' ? '代码已复制' : 'Code copied')
    } catch {
      toast.error(
        locale === 'zh'
          ? '复制失败，请手动选择代码'
          : 'Copy failed. Select the code manually.',
      )
    }
  }

  function changeFormat(value: DemoFormat): void {
    setFormat(value)
    setLastError(null)
    record('source', value)
  }

  function resetSettings(): void {
    setFormat('fallback')
    setMediaSession(false)
    setExclusive(true)
    setNativeControls(false)
    setRepeatMode('all')
    setPlayerSize('default')
    setGlow(72)
    toast(locale === 'zh' ? '演示设置已恢复' : 'Demo settings reset')
  }

  function notifyDownload(event: ReactMouseEvent<HTMLDivElement>): void {
    if (!(event.target instanceof Element)) return
    if (!event.target.closest('a[download]')) return
    toast.success(
      locale === 'zh' ? '开始下载测试音频' : 'Fixture download started',
    )
  }

  const settings = (
    <SettingsPanel
      exclusive={exclusive}
      format={format}
      glow={glow}
      locale={locale}
      mediaSession={mediaSession}
      nativeControls={nativeControls}
      onExclusiveChange={setExclusive}
      onFormatChange={changeFormat}
      onGlowChange={setGlow}
      onMediaSessionChange={setMediaSession}
      onNativeControlsChange={setNativeControls}
      onRepeatModeChange={setRepeatMode}
      onReset={resetSettings}
      onSizeChange={setPlayerSize}
      repeatMode={repeatMode}
      size={playerSize}
    />
  )

  const previewWidth =
    previewMode === 'phone'
      ? 'max-w-[430px]'
      : previewMode === 'webview'
        ? 'max-w-[760px]'
        : 'max-w-none'

  return (
    <TooltipProvider delayDuration={250}>
      <div
        className="min-h-screen bg-background text-foreground"
        style={
          {
            '--studio-glow-opacity': String(glow / 100),
          } as React.CSSProperties
        }
      >
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-3 px-4 md:px-8">
            <a
              href="#top"
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Waves className="size-4" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap">Audio Native</span>
              <Badge className="hidden sm:inline-flex" variant="outline">
                React
              </Badge>
            </a>

            <nav
              className="ml-auto hidden items-center gap-1 md:flex"
              aria-label="Demo navigation"
            >
              <Button variant="ghost" size="sm" asChild>
                <a href="#playground">{copy.playground}</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#api">API</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#compatibility">
                  {locale === 'zh' ? '兼容性' : 'Compatibility'}
                </a>
              </Button>
            </nav>

            <Separator orientation="vertical" className="hidden h-6 md:block" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={locale === 'zh' ? '切换语言' : 'Switch language'}
                  onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                >
                  <Languages data-icon="icon-only" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {locale === 'zh' ? 'English' : '中文'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={dark ? 'Use light theme' : 'Use dark theme'}
                  onClick={() => setDark((value) => !value)}
                >
                  {dark ? (
                    <Sun data-icon="icon-only" aria-hidden="true" />
                  ) : (
                    <Moon data-icon="icon-only" aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{dark ? 'Light' : 'Dark'}</TooltipContent>
            </Tooltip>

            <Button size="icon" variant="ghost" asChild>
              <a
                href="https://github.com/trsoliu/react-audio-native"
                target="_blank"
                rel="noreferrer"
                aria-label="Open GitHub repository"
              >
                <GitFork data-icon="icon-only" aria-hidden="true" />
              </a>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button className="hidden md:inline-flex" variant="outline">
                  <Settings2 data-icon="inline-start" aria-hidden="true" />
                  {copy.settings}
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{copy.settings}</SheetTitle>
                  <SheetDescription>
                    {locale === 'zh'
                      ? '实时改变播放器能力与呈现方式。'
                      : 'Change player capabilities and presentation live.'}
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-6">{settings}</div>
              </SheetContent>
            </Sheet>

            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <Button
                  className="md:hidden"
                  size="icon"
                  variant="outline"
                  aria-label="Open demo settings"
                >
                  <Menu data-icon="icon-only" aria-hidden="true" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerClose asChild>
                  <Button
                    data-demo-drawer-close
                    className="absolute right-4 top-4 z-10"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Close demo settings"
                  >
                    <X data-icon="icon-only" aria-hidden="true" />
                  </Button>
                </DrawerClose>
                <DrawerHeader>
                  <DrawerTitle>{copy.settings}</DrawerTitle>
                  <DrawerDescription>
                    {locale === 'zh'
                      ? '检查移动端和 WebView 降级。'
                      : 'Inspect mobile and WebView fallbacks.'}
                  </DrawerDescription>
                </DrawerHeader>
                <ScrollArea className="h-[70vh]">
                  <div className="px-4 pb-8">{settings}</div>
                </ScrollArea>
              </DrawerContent>
            </Drawer>
          </div>
        </header>

        <main
          id="top"
          className="mx-auto flex max-w-[1480px] flex-col gap-24 px-4 py-10 md:px-8 md:py-16"
        >
          <section className="studio-grid relative overflow-hidden rounded-[2rem] border px-5 py-8 md:px-10 md:py-12">
            <div className="studio-glow" aria-hidden="true" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex min-w-0 flex-col gap-8">
                <div className="max-w-4xl">
                  <Badge className="mb-5" variant="secondary">
                    <Radio data-icon="inline-start" aria-hidden="true" />
                    {copy.eyebrow}
                  </Badge>
                  <h1 className="max-w-4xl text-balance text-4xl leading-[0.98] font-semibold tracking-[-0.045em] md:text-6xl xl:text-7xl">
                    {copy.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
                    {copy.intro}
                  </p>
                </div>

                <div id="playground" className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        playerState === 'error' ? 'destructive' : 'outline'
                      }
                    >
                      {playerState}
                    </Badge>
                    <Badge variant="outline">
                      track {activeTrack + 1}/{tracks.length}
                    </Badge>
                    <Badge variant="outline">{format}</Badge>
                    {exclusive ? (
                      <Badge variant="outline">exclusive / studio</Badge>
                    ) : null}
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {playbackRate}×
                      </span>
                      <input
                        className="w-24 accent-primary"
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.25"
                        value={playbackRate}
                        aria-label="Playback rate"
                        onChange={(event) =>
                          setPlaybackRate(Number(event.currentTarget.value))
                        }
                      />
                    </div>
                  </div>

                  <div
                    className={`mx-auto w-full transition-[max-width] duration-300 ${previewWidth}`}
                    data-preview-mode={previewMode}
                  >
                    {playerState === 'loading' ? (
                      <Skeleton className="mb-2 h-1 w-full" />
                    ) : null}
                    <div
                      className="flex flex-col gap-2"
                      data-testid="main-player"
                      onClickCapture={notifyDownload}
                    >
                      <AudioPlayer
                        ref={mainPlayer}
                        tracks={tracks}
                        size={playerSize}
                        nativeControls={nativeControls}
                        repeatMode={repeatMode}
                        playbackRate={playbackRate}
                        mediaSession={mediaSession}
                        exclusive={exclusive}
                        group="studio"
                        onStateChange={onStateChange}
                        onTrackChange={onTrackChange}
                        onTimeUpdate={onTimeUpdate}
                        onError={onError}
                        artwork={(track) => (
                          <img
                            className="size-20 shrink-0 rounded-2xl border object-cover shadow-xl md:size-28"
                            src={track.artwork?.[0]?.src}
                            alt={`${track.title ?? 'Audio'} artwork`}
                          />
                        )}
                        beforeControls={
                          <p className="text-xs tracking-[0.18em] text-primary uppercase">
                            Live studio master
                          </p>
                        }
                      />
                      <div
                        className="flex flex-wrap gap-1 rounded-xl border bg-muted/25 p-1"
                        aria-label="Playlist"
                      >
                        {tracks.map((track, index) => (
                          <Button
                            key={track.id}
                            type="button"
                            size="sm"
                            variant={
                              activeTrack === index ? 'secondary' : 'ghost'
                            }
                            aria-current={
                              activeTrack === index ? 'true' : undefined
                            }
                            onClick={() =>
                              void mainPlayer.current?.selectTrack(index)
                            }
                          >
                            <span className="text-muted-foreground">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            {track.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {lastError ? (
                    <Alert variant="destructive">
                      <Zap aria-hidden="true" />
                      <AlertTitle>{lastError.code}</AlertTitle>
                      <AlertDescription>{lastError.message}</AlertDescription>
                    </Alert>
                  ) : previewMode === 'webview' ? (
                    <Alert>
                      <Webhook aria-hidden="true" />
                      <AlertTitle>WebView capability mode</AlertTitle>
                      <AlertDescription>
                        {locale === 'zh'
                          ? '自动播放、下载和 Media Session 由宿主能力决定；播放器会返回结构化降级信息。'
                          : 'Autoplay, download, and Media Session depend on host capabilities; structured fallbacks remain available.'}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={previewMode}
                      onValueChange={(value) => {
                        if (value) setPreviewMode(value as PreviewMode)
                      }}
                    >
                      <ToggleGroupItem
                        value="desktop"
                        aria-label="Desktop preview"
                      >
                        <Laptop aria-hidden="true" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="phone" aria-label="Phone preview">
                        <Smartphone aria-hidden="true" />
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="webview"
                        aria-label="WebView preview"
                      >
                        <Webhook aria-hidden="true" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={reducedMotion}
                        onChange={(event) =>
                          setReducedMotion(event.currentTarget.checked)
                        }
                      />
                      {locale === 'zh' ? '减少动画' : 'Reduce motion'}
                    </label>
                  </div>
                </div>
              </div>

              <aside className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border bg-card/70">
                <div className="flex items-center gap-2 border-b px-4 py-3">
                  <span
                    className="size-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <h2 className="text-sm font-medium">{copy.events}</h2>
                  <Badge className="ml-auto" variant="outline">
                    {eventLog.length}
                  </Badge>
                </div>
                <ScrollArea className="h-[320px] flex-1 lg:h-auto">
                  <ol
                    className="flex flex-col gap-0 p-2 font-mono text-xs"
                    aria-live="polite"
                    data-testid="event-log"
                  >
                    {eventLog.map((entry) => (
                      <li
                        key={entry.id}
                        className="grid grid-cols-[58px_92px_1fr] gap-2 rounded-lg px-2 py-2 hover:bg-muted/45"
                      >
                        <time className="text-muted-foreground">
                          {entry.time}
                        </time>
                        <span
                          className={
                            entry.name === 'error'
                              ? 'text-destructive'
                              : 'text-primary'
                          }
                        >
                          {entry.name}
                        </span>
                        <span className="truncate text-muted-foreground">
                          {entry.detail}
                        </span>
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </aside>
            </div>
          </section>

          <section id="api" className="flex flex-col gap-7">
            <div className="max-w-3xl">
              <p className="mb-2 text-sm font-medium text-primary">
                API SURFACES
              </p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {copy.architecture}
              </h2>
            </div>

            <Tabs defaultValue="modern" className="w-full">
              <div className="max-w-full overflow-x-auto">
                <TabsList variant="line" className="min-w-max justify-start">
                  <TabsTrigger value="modern">Recommended API</TabsTrigger>
                  <TabsTrigger value="migration">Vue → React</TabsTrigger>
                  <TabsTrigger value="headless">Headless API</TabsTrigger>
                  <TabsTrigger value="platform">Cross-platform</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="modern" className="mt-5">
                <CodePanel
                  label="Copy React API example"
                  value={snippets.modern}
                  onCopy={copySnippet}
                />
              </TabsContent>

              <TabsContent value="migration" className="mt-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <CodePanel
                    label="Copy migration example"
                    value={snippets.migration}
                    onCopy={copySnippet}
                  />
                  <Alert>
                    <Check aria-hidden="true" />
                    <AlertTitle>
                      Framework adapters, one state contract
                    </AlertTitle>
                    <AlertDescription>
                      Vue and React expose the same track, snapshot, error,
                      repeat, playlist, Media Session and WebView bridge
                      semantics.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="headless" className="mt-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <HeadlessPlayer src="/audio/neon-room.wav" />
                  <CodePanel
                    label="Copy headless API example"
                    value={snippets.headless}
                    onCopy={copySnippet}
                  />
                </div>
              </TabsContent>

              <TabsContent value="platform" className="mt-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <Alert>
                    <Check aria-hidden="true" />
                    <AlertTitle>Capability detection first</AlertTitle>
                    <AlertDescription>
                      Chromium 96+, Firefox 115+, Safari / WKWebView 15.6+,
                      Android 8+, HarmonyOS WebView and ArkWeb. Engines below
                      the baseline fall back to native controls.
                    </AlertDescription>
                  </Alert>
                  <CodePanel
                    label="Copy WebView bridge example"
                    value={snippets.bridge}
                    onCopy={copySnippet}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </section>

          <section className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="lg:sticky lg:top-24">
              <Badge variant="outline" className="mb-4">
                <AudioLines data-icon="inline-start" aria-hidden="true" />
                GROUP COORDINATION
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {copy.multi}
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
                {locale === 'zh'
                  ? '两个播放器共享 studio 分组。开启 exclusive 后，任意一个开始播放都会暂停另一个；不同分组仍保持完全独立。'
                  : 'Both players share the studio group. With exclusive enabled, starting one pauses the other while unrelated groups remain independent.'}
              </p>
            </div>
            <div
              className="flex flex-col gap-4 rounded-[2rem] border bg-muted/20 p-4 md:p-6"
              data-testid="exclusive-players"
            >
              <AudioPlayer
                src="/audio/neon-room.wav"
                size="small"
                exclusive={exclusive}
                group="studio"
                showDownload={false}
              />
              <AudioPlayer
                src="/audio/neon-room.wav"
                size="small"
                exclusive={exclusive}
                group="studio"
                showDownload={false}
              />
            </div>
          </section>

          <section
            id="compatibility"
            className="grid gap-8 border-t pt-16 lg:grid-cols-[0.8fr_1.2fr]"
          >
            <div>
              <p className="mb-2 text-sm font-medium text-primary">
                RUNTIME MATRIX
              </p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {copy.compatibility}
              </h2>
            </div>
            <Accordion type="single" collapsible defaultValue="mobile">
              <AccordionItem value="mobile">
                <AccordionTrigger>iOS · Android · HarmonyOS</AccordionTrigger>
                <AccordionContent>
                  Touch and Pointer inputs share native range semantics.
                  Autoplay rejection is returned as `AUTOPLAY_BLOCKED`; ArkWeb
                  and embedded WebViews use capability detection.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="desktop">
                <AccordionTrigger>
                  Chrome · Edge · Firefox · Safari
                </AccordionTrigger>
                <AccordionContent>
                  Keyboard-operable controls, multi-source selection, structured
                  MediaError mapping, reduced-motion support, and optional Media
                  Session integration.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ssr">
                <AccordionTrigger>Vite · Next.js · SSR</AccordionTrigger>
                <AccordionContent>
                  Importing the package never creates a media element.
                  Controllers attach only after a real `HTMLAudioElement` is
                  available and release all listeners when disposed.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </main>

        <footer className="mt-20 border-t">
          <div className="mx-auto flex max-w-[1480px] flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:px-8">
            <span>React Audio Native 1.0 · MIT</span>
            <span className="md:ml-auto">
              Generated audio fixture · No third-party media
            </span>
          </div>
        </footer>
      </div>
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  )
}

function CodePanel({
  label,
  onCopy,
  value,
}: {
  label: string
  onCopy: (value: string) => Promise<void>
  value: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-5 md:p-7">
      <Button
        className="absolute right-4 top-4"
        size="icon"
        variant="ghost"
        aria-label={label}
        onClick={() => void onCopy(value)}
      >
        <Clipboard data-icon="icon-only" aria-hidden="true" />
      </Button>
      <pre className="overflow-x-auto pr-12 text-sm">
        <code>{value}</code>
      </pre>
    </div>
  )
}
