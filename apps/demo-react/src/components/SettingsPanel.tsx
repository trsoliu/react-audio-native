import { RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'
import type { RepeatMode } from 'react-audio-native'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type DemoFormat = 'fallback' | 'wav' | 'broken'
export type DemoSize = 'small' | 'default' | 'large'

interface SettingsPanelProps {
  exclusive: boolean
  format: DemoFormat
  glow: number
  locale: 'zh' | 'en'
  mediaSession: boolean
  nativeControls: boolean
  onExclusiveChange: (value: boolean) => void
  onFormatChange: (value: DemoFormat) => void
  onGlowChange: (value: number) => void
  onMediaSessionChange: (value: boolean) => void
  onNativeControlsChange: (value: boolean) => void
  onRepeatModeChange: (value: RepeatMode) => void
  onReset: () => void
  onSizeChange: (value: DemoSize) => void
  repeatMode: RepeatMode
  size: DemoSize
}

export function SettingsPanel({
  exclusive,
  format,
  glow,
  locale,
  mediaSession,
  nativeControls,
  onExclusiveChange,
  onFormatChange,
  onGlowChange,
  onMediaSessionChange,
  onNativeControlsChange,
  onRepeatModeChange,
  onReset,
  onSizeChange,
  repeatMode,
  size,
}: SettingsPanelProps) {
  const zh = locale === 'zh'

  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="flex items-start gap-3 rounded-xl border bg-muted/35 p-3">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          {zh
            ? '设置只作用于当前演示，不会改变 npm 包的默认行为。'
            : 'Settings affect this demo only and never change package defaults.'}
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="demo-format">
            {zh ? '音频来源' : 'Audio source'}
          </FieldLabel>
          <Select
            value={format}
            onValueChange={(value) => onFormatChange(value as DemoFormat)}
          >
            <SelectTrigger id="demo-format" className="w-full">
              <SelectValue placeholder={zh ? '选择来源' : 'Select source'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fallback">Multi-format fallback</SelectItem>
              <SelectItem value="wav">Generated WAV</SelectItem>
              <SelectItem value="broken">Broken source</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>
            {zh
              ? '回退模式先声明不支持的格式，再选择本地生成的 WAV。'
              : 'Fallback declares an unsupported format before the generated WAV.'}
          </FieldDescription>
        </Field>

        <Separator />

        <Field orientation="horizontal">
          <div className="flex-1">
            <FieldTitle>Media Session</FieldTitle>
            <FieldDescription>
              {zh
                ? '锁屏元数据和系统媒体按键'
                : 'Lock-screen metadata and media keys'}
            </FieldDescription>
          </div>
          <Switch
            checked={mediaSession}
            onCheckedChange={onMediaSessionChange}
            aria-label="Toggle Media Session"
          />
        </Field>

        <Field orientation="horizontal">
          <div className="flex-1">
            <FieldTitle>{zh ? '同组互斥' : 'Exclusive group'}</FieldTitle>
            <FieldDescription>
              {zh
                ? '新实例播放时暂停同组实例'
                : 'Pause peers when another instance starts'}
            </FieldDescription>
          </div>
          <Switch
            checked={exclusive}
            onCheckedChange={onExclusiveChange}
            aria-label="Toggle exclusive playback"
          />
        </Field>

        <Field orientation="horizontal">
          <div className="flex-1">
            <FieldTitle>{zh ? '原生控件' : 'Native controls'}</FieldTitle>
            <FieldDescription>
              {zh
                ? '检查 WebView 原生降级路径'
                : 'Inspect the WebView fallback path'}
            </FieldDescription>
          </div>
          <Switch
            checked={nativeControls}
            onCheckedChange={onNativeControlsChange}
            aria-label="Toggle native controls"
          />
        </Field>

        <Separator />

        <Field>
          <FieldLabel>{zh ? '循环模式' : 'Repeat mode'}</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            className="justify-start"
            value={repeatMode}
            onValueChange={(value) => {
              if (value) onRepeatModeChange(value as RepeatMode)
            }}
          >
            <ToggleGroupItem value="off" aria-label="Repeat off">
              Off
            </ToggleGroupItem>
            <ToggleGroupItem value="one" aria-label="Repeat one">
              One
            </ToggleGroupItem>
            <ToggleGroupItem value="all" aria-label="Repeat all">
              All
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field>
          <FieldLabel>{zh ? '播放器尺寸' : 'Player size'}</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            className="justify-start"
            value={size}
            onValueChange={(value) => {
              if (value) onSizeChange(value as DemoSize)
            }}
          >
            <ToggleGroupItem value="small" aria-label="Small player">
              S
            </ToggleGroupItem>
            <ToggleGroupItem value="default" aria-label="Default player">
              M
            </ToggleGroupItem>
            <ToggleGroupItem value="large" aria-label="Large player">
              L
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <FieldLabel>{zh ? '环境光强度' : 'Studio glow'}</FieldLabel>
          </div>
          <Slider
            value={[glow]}
            max={100}
            step={5}
            aria-label="Studio glow intensity"
            onValueChange={(value) => onGlowChange(value[0] ?? glow)}
          />
        </Field>
      </FieldGroup>

      <Button variant="outline" className="w-full" onClick={onReset}>
        <RotateCcw data-icon="inline-start" aria-hidden="true" />
        {zh ? '恢复演示设置' : 'Reset demo settings'}
      </Button>
    </div>
  )
}
