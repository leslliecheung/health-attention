import { defineStore } from 'pinia'
import { ref } from 'vue'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'
import { invoke } from '@tauri-apps/api/core'
import { useSettingsStore } from './settings'
import { useSitStore } from './sit'
import type { SoundType } from '@/types'

// 音效预设参数
const SOUND_PRESETS: Record<Exclude<SoundType, 'none'>, { freq1: number; freq2: number; duration: number; type: OscillatorType }> = {
  default: { freq1: 800, freq2: 1000, duration: 0.5, type: 'sine' },      // 默认双音
  gentle:  { freq1: 440, freq2: 550, duration: 0.8, type: 'sine' },       // 柔和音
  chime:   { freq1: 1200, freq2: 1500, duration: 0.3, type: 'triangle' }, // 钟声
  bell:    { freq1: 600, freq2: 900, duration: 0.6, type: 'sine' },       // 铃声
  water:   { freq1: 300, freq2: 400, duration: 1.0, type: 'sine' },       // 水滴声
}

export const useReminderStore = defineStore('reminder', () => {
  // 定时器ID
  const waterTimerId = ref<number | null>(null)
  const sitTimerId = ref<number | null>(null)
  const eyeTimerId = ref<number | null>(null)
  const tooltipTimerId = ref<number | null>(null)

  // 上次提醒时间
  const lastWaterReminder = ref<Date>(new Date())
  const lastSitReminder = ref<Date>(new Date())
  const lastEyeReminder = ref<Date>(new Date())

  // 倒计时剩余秒数
  const waterCountdown = ref(0)
  const sitCountdown = ref(0)
  const eyeCountdown = ref(0)

  // 是否已初始化
  const isInitialized = ref(false)

  // 暂停状态
  const isPaused = ref(false)
  const pausedAt = ref<Date | null>(null)
  const pausedWaterRemaining = ref(0)
  const pausedSitRemaining = ref(0)
  const pausedEyeRemaining = ref(0)

  // 检查是否在工作时间内
  const isInWorkTime = (): boolean => {
    const settingsStore = useSettingsStore()
    const settings = settingsStore.settings

    if (!settings.workTimeEnabled) return true

    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    // 检查是否是工作日
    if (!settings.workDays.includes(currentDay)) return false

    // 解析工作时间
    const [startHour, startMin] = settings.workStartTime.split(':').map(Number)
    const [endHour, endMin] = settings.workEndTime.split(':').map(Number)
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    return currentTime >= startTime && currentTime <= endTime
  }

  // 检查是否在勿扰时间内
  const isInDndTime = (): boolean => {
    const settingsStore = useSettingsStore()
    const settings = settingsStore.settings

    if (!settings.dndEnabled) return false

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const [startHour, startMin] = settings.dndStartTime.split(':').map(Number)
    const [endHour, endMin] = settings.dndEndTime.split(':').map(Number)
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    // 处理跨午夜的情况
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime
    }
    return currentTime >= startTime && currentTime <= endTime
  }

  // 检查是否可以发送提醒
  const canSendReminder = (): boolean => {
    return isInWorkTime() && !isInDndTime() && !isPaused.value
  }

  // 格式化倒计时
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 更新托盘 tooltip
  const updateTrayTooltip = async (): Promise<void> => {
    const settingsStore = useSettingsStore()
    const settings = settingsStore.settings

    let tooltip = '健康提醒助手\n'

    if (isPaused.value) {
      tooltip += '⏸️ 已暂停\n'
    }

    if (settings.waterReminderEnabled && waterCountdown.value > 0) {
      tooltip += `💧 喝水: ${formatCountdown(waterCountdown.value)}\n`
    }

    if (settings.sitReminderEnabled && sitCountdown.value > 0) {
      tooltip += `🚶 久坐: ${formatCountdown(sitCountdown.value)}\n`
    }

    if (settings.eyeReminderEnabled && eyeCountdown.value > 0) {
      tooltip += `👁️ 护眼: ${formatCountdown(eyeCountdown.value)}`
    }

    try {
      await invoke('update_tray_tooltip', { tooltip: tooltip.trim() })
    } catch (error) {
      console.error('更新托盘提示失败:', error)
    }
  }

  // 计算剩余倒计时
  const calculateCountdowns = (): void => {
    // 如果暂停了，显示暂停时的剩余时间
    if (isPaused.value) {
      waterCountdown.value = pausedWaterRemaining.value
      sitCountdown.value = pausedSitRemaining.value
      eyeCountdown.value = pausedEyeRemaining.value
      return
    }

    const settingsStore = useSettingsStore()
    const settings = settingsStore.settings
    const now = new Date()

    // 计算喝水倒计时
    if (settings.waterReminderEnabled && lastWaterReminder.value) {
      const elapsed = Math.floor((now.getTime() - lastWaterReminder.value.getTime()) / 1000)
      const interval = settings.waterIntervalMinutes * 60
      waterCountdown.value = Math.max(0, interval - elapsed)
    } else {
      waterCountdown.value = 0
    }

    // 计算久坐倒计时
    if (settings.sitReminderEnabled && lastSitReminder.value) {
      const elapsed = Math.floor((now.getTime() - lastSitReminder.value.getTime()) / 1000)
      const interval = settings.sitIntervalMinutes * 60
      sitCountdown.value = Math.max(0, interval - elapsed)
    } else {
      sitCountdown.value = 0
    }

    // 计算眼睛休息倒计时
    if (settings.eyeReminderEnabled && lastEyeReminder.value) {
      const elapsed = Math.floor((now.getTime() - lastEyeReminder.value.getTime()) / 1000)
      const interval = settings.eyeIntervalMinutes * 60
      eyeCountdown.value = Math.max(0, interval - elapsed)
    } else {
      eyeCountdown.value = 0
    }
  }

  // 启动 tooltip 更新定时器
  const startTooltipTimer = (): void => {
    if (tooltipTimerId.value) {
      clearInterval(tooltipTimerId.value)
    }

    // 每秒更新一次
    tooltipTimerId.value = window.setInterval(() => {
      calculateCountdowns()
      updateTrayTooltip()
    }, 1000)

    // 立即执行一次
    calculateCountdowns()
    updateTrayTooltip()
  }

  // 播放提醒声音
  const playReminderSound = async (soundType?: SoundType, volume?: number): Promise<void> => {
    const settingsStore = useSettingsStore()
    const settings = settingsStore.settings

    // 使用传入的参数或设置中的值
    const type = soundType ?? settings.soundType
    const vol = volume ?? settings.soundVolume

    // 如果声音未启用或类型为 none，不播放
    if (!settings.soundEnabled || type === 'none') return

    const preset = SOUND_PRESETS[type]
    if (!preset) return

    // 将音量从 0-100 转换为 0-1
    const normalizedVolume = Math.min(100, Math.max(0, vol)) / 100 * 0.5 // 最大 0.5 防止太响

    try {
      // 使用 Web Audio API 播放提示音
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // 第一声
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(preset.freq1, audioContext.currentTime)
      oscillator.type = preset.type
      gainNode.gain.setValueAtTime(normalizedVolume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + preset.duration)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + preset.duration)

      // 第二声（延迟播放）
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.setValueAtTime(preset.freq2, audioContext.currentTime)
        osc2.type = preset.type
        gain2.gain.setValueAtTime(normalizedVolume, audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + preset.duration)
        osc2.start(audioContext.currentTime)
        osc2.stop(audioContext.currentTime + preset.duration)
      }, 200)
    } catch (error) {
      console.error('播放提醒声音失败:', error)
    }
  }

  // 预览音效（用于设置页面）
  const previewSound = async (soundType: SoundType, volume: number): Promise<void> => {
    if (soundType === 'none') return
    await playReminderSound(soundType, volume)
  }

  // 发送系统通知
  const sendSystemNotification = async (title: string, body: string): Promise<void> => {
    try {
      let permissionGranted = await isPermissionGranted()

      if (!permissionGranted) {
        const permission = await requestPermission()
        permissionGranted = permission === 'granted'
      }

      if (permissionGranted) {
        await sendNotification({ title, body })
        // 播放提醒声音
        await playReminderSound()
      }
    } catch (error) {
      console.error('发送通知失败:', error)
    }
  }

  // 发送喝水提醒
  const sendWaterReminder = async (): Promise<void> => {
    if (!canSendReminder()) return

    await sendSystemNotification(
      '💧 该喝水啦！',
      '适时补充水分，保持身体健康。已经过去一段时间了，喝杯水休息一下吧！'
    )
    lastWaterReminder.value = new Date()
  }

  // 发送久坐提醒
  const sendSitReminder = async (): Promise<void> => {
    if (!canSendReminder()) return

    // 自动记录久坐
    const sitStore = useSitStore()
    await sitStore.addAutoRecord()

    await sendSystemNotification(
      '🚶 该起来活动啦！',
      '久坐有害健康,站起来伸展一下身体，活动活动筋骨吧！'
    )
    lastSitReminder.value = new Date()
  }

  // 发送眼睛休息提醒
  const sendEyeReminder = async (): Promise<void> => {
    if (!canSendReminder()) return

    const settingsStore = useSettingsStore()
    const duration = settingsStore.settings.eyeRestDurationSeconds

    await sendSystemNotification(
      '👁️ 该让眼睛休息啦！',
      `20-20-20 法则提醒：请看向 6 米（20 英尺）外的物体至少 ${duration} 秒，让眼睛得到放松。`
    )
    lastEyeReminder.value = new Date()
  }

  // 启动喝水提醒定时器
  const startWaterTimer = (): void => {
    const settingsStore = useSettingsStore()
    const intervalMs = settingsStore.settings.waterIntervalMinutes * 60 * 1000

    if (waterTimerId.value) {
      clearInterval(waterTimerId.value)
    }

    // 重置上次提醒时间
    lastWaterReminder.value = new Date()

    waterTimerId.value = window.setInterval(() => {
      if (settingsStore.settings.waterReminderEnabled && !isPaused.value) {
        sendWaterReminder()
      }
    }, intervalMs)

    console.log(`喝水提醒已启动，间隔 ${settingsStore.settings.waterIntervalMinutes} 分钟`)
  }

  // 启动久坐提醒定时器
  const startSitTimer = (): void => {
    const settingsStore = useSettingsStore()
    const intervalMs = settingsStore.settings.sitIntervalMinutes * 60 * 1000

    if (sitTimerId.value) {
      clearInterval(sitTimerId.value)
    }

    // 重置上次提醒时间
    lastSitReminder.value = new Date()

    sitTimerId.value = window.setInterval(() => {
      if (settingsStore.settings.sitReminderEnabled && !isPaused.value) {
        sendSitReminder()
      }
    }, intervalMs)

    console.log(`久坐提醒已启动，间隔 ${settingsStore.settings.sitIntervalMinutes} 分钟`)
  }

  // 启动眼睛休息提醒定时器
  const startEyeTimer = (): void => {
    const settingsStore = useSettingsStore()
    const intervalMs = settingsStore.settings.eyeIntervalMinutes * 60 * 1000

    if (eyeTimerId.value) {
      clearInterval(eyeTimerId.value)
    }

    // 重置上次提醒时间
    lastEyeReminder.value = new Date()

    eyeTimerId.value = window.setInterval(() => {
      if (settingsStore.settings.eyeReminderEnabled && !isPaused.value) {
        sendEyeReminder()
      }
    }, intervalMs)

    console.log(`眼睛休息提醒已启动，间隔 ${settingsStore.settings.eyeIntervalMinutes} 分钟`)
  }

  // 停止所有定时器
  const clearAllTimers = (): void => {
    if (waterTimerId.value) {
      clearInterval(waterTimerId.value)
      waterTimerId.value = null
    }
    if (sitTimerId.value) {
      clearInterval(sitTimerId.value)
      sitTimerId.value = null
    }
    if (eyeTimerId.value) {
      clearInterval(eyeTimerId.value)
      eyeTimerId.value = null
    }
    if (tooltipTimerId.value) {
      clearInterval(tooltipTimerId.value)
      tooltipTimerId.value = null
    }
  }

  // 暂停提醒
  const pauseReminders = (): void => {
    if (isPaused.value) return

    isPaused.value = true
    pausedAt.value = new Date()
    pausedWaterRemaining.value = waterCountdown.value
    pausedSitRemaining.value = sitCountdown.value
    pausedEyeRemaining.value = eyeCountdown.value

    console.log('提醒已暂停')
    updateTrayTooltip()
  }

  // 恢复提醒
  const resumeReminders = (): void => {
    if (!isPaused.value) return

    const now = new Date()

    // 根据暂停时的剩余时间调整上次提醒时间
    if (pausedWaterRemaining.value > 0) {
      const settingsStore = useSettingsStore()
      const interval = settingsStore.settings.waterIntervalMinutes * 60
      const elapsed = interval - pausedWaterRemaining.value
      lastWaterReminder.value = new Date(now.getTime() - elapsed * 1000)
    }

    if (pausedSitRemaining.value > 0) {
      const settingsStore = useSettingsStore()
      const interval = settingsStore.settings.sitIntervalMinutes * 60
      const elapsed = interval - pausedSitRemaining.value
      lastSitReminder.value = new Date(now.getTime() - elapsed * 1000)
    }

    if (pausedEyeRemaining.value > 0) {
      const settingsStore = useSettingsStore()
      const interval = settingsStore.settings.eyeIntervalMinutes * 60
      const elapsed = interval - pausedEyeRemaining.value
      lastEyeReminder.value = new Date(now.getTime() - elapsed * 1000)
    }

    isPaused.value = false
    pausedAt.value = null
    pausedWaterRemaining.value = 0
    pausedSitRemaining.value = 0
    pausedEyeRemaining.value = 0

    console.log('提醒已恢复')
    updateTrayTooltip()
  }

  // 切换暂停状态
  const togglePause = (): void => {
    if (isPaused.value) {
      resumeReminders()
    } else {
      pauseReminders()
    }
  }

  // 重启所有提醒
  const restartReminders = (): void => {
    const settingsStore = useSettingsStore()

    clearAllTimers()
    isPaused.value = false

    if (settingsStore.settings.waterReminderEnabled) {
      startWaterTimer()
    }

    if (settingsStore.settings.sitReminderEnabled) {
      startSitTimer()
    }

    if (settingsStore.settings.eyeReminderEnabled) {
      startEyeTimer()
    }

    // 启动 tooltip 更新
    startTooltipTimer()
  }

  // 初始化提醒系统
  const initReminders = async (): Promise<void> => {
    if (isInitialized.value) return

    const settingsStore = useSettingsStore()
    await settingsStore.loadSettings()

    restartReminders()
    isInitialized.value = true

    console.log('提醒系统已初始化')
  }

  return {
    waterTimerId,
    sitTimerId,
    eyeTimerId,
    lastWaterReminder,
    lastSitReminder,
    lastEyeReminder,
    waterCountdown,
    sitCountdown,
    eyeCountdown,
    isInitialized,
    isPaused,
    isInWorkTime,
    isInDndTime,
    canSendReminder,
    playReminderSound,
    previewSound,
    sendSystemNotification,
    sendWaterReminder,
    sendSitReminder,
    sendEyeReminder,
    startWaterTimer,
    startSitTimer,
    startEyeTimer,
    clearAllTimers,
    pauseReminders,
    resumeReminders,
    togglePause,
    restartReminders,
    initReminders
  }
})
