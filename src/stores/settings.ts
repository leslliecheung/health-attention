import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LazyStore } from '@tauri-apps/plugin-store'
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart'
import { invoke } from '@tauri-apps/api/core'
import type { Settings, ThemeMode } from '@/types'
import { defaultSettings } from '@/types'

const SETTINGS_KEY = 'settings'

// 系统主题变化监听器
let systemThemeMediaQuery: MediaQueryList | null = null

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({ ...defaultSettings })
  const isLoading = ref(false)
  const isDarkMode = ref(false) // 当前是否深色模式
  let store: LazyStore | null = null

  // 初始化store
  const initStore = (): LazyStore => {
    if (!store) {
      store = new LazyStore('settings.json')
    }
    return store
  }

  // 应用主题
  const applyTheme = (mode: ThemeMode): void => {
    let shouldBeDark = false

    if (mode === 'dark') {
      shouldBeDark = true
    } else if (mode === 'auto') {
      // 检测系统主题
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    // mode === 'light' 时 shouldBeDark 保持 false

    isDarkMode.value = shouldBeDark

    // 应用到 HTML 元素
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // 监听系统主题变化
  const setupSystemThemeListener = (): void => {
    if (systemThemeMediaQuery) {
      systemThemeMediaQuery.removeEventListener('change', handleSystemThemeChange)
    }

    systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange)
  }

  // 系统主题变化处理
  const handleSystemThemeChange = (): void => {
    if (settings.value.themeMode === 'auto') {
      applyTheme('auto')
    }
  }

  // 同步 minimizeToTray 设置到后端
  const syncMinimizeToTray = async (): Promise<void> => {
    try {
      await invoke('set_minimize_to_tray', { enabled: settings.value.minimizeToTray })
    } catch (error) {
      console.error('同步 minimizeToTray 设置失败:', error)
    }
  }

  // 加载设置
  const loadSettings = async (): Promise<void> => {
    isLoading.value = true
    try {
      const s = initStore()
      const saved = await s.get<Settings>(SETTINGS_KEY)
      if (saved) {
        settings.value = { ...defaultSettings, ...saved }
      }

      // 同步开机自启动状态
      try {
        const autoStartEnabled = await isEnabled()
        settings.value.autoStart = autoStartEnabled
      } catch (e) {
        console.warn('获取自启动状态失败:', e)
      }

      // 同步 minimizeToTray 到后端
      await syncMinimizeToTray()

      // 应用主题并设置监听器
      applyTheme(settings.value.themeMode)
      setupSystemThemeListener()
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 保存设置
  const saveSettings = async (): Promise<void> => {
    try {
      const s = initStore()
      await s.set(SETTINGS_KEY, settings.value)
      await s.save()
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  // 更新单个设置项
  const updateSetting = async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ): Promise<void> => {
    settings.value[key] = value
    await saveSettings()

    // 特殊处理：开机自启动
    if (key === 'autoStart') {
      try {
        if (value) {
          await enable()
        } else {
          await disable()
        }
      } catch (error) {
        console.error('设置开机自启动失败:', error)
      }
    }

    // 特殊处理：最小化到托盘
    if (key === 'minimizeToTray') {
      await syncMinimizeToTray()
    }

    // 特殊处理：主题模式
    if (key === 'themeMode') {
      applyTheme(value as ThemeMode)
    }
  }

  // 批量更新设置
  const updateSettings = async (newSettings: Partial<Settings>): Promise<void> => {
    settings.value = { ...settings.value, ...newSettings }
    await saveSettings()

    // 如果更新了 minimizeToTray，同步到后端
    if ('minimizeToTray' in newSettings) {
      await syncMinimizeToTray()
    }

    // 如果更新了 themeMode，应用主题
    if ('themeMode' in newSettings && newSettings.themeMode) {
      applyTheme(newSettings.themeMode)
    }
  }

  // 重置为默认设置
  const resetSettings = async (): Promise<void> => {
    settings.value = { ...defaultSettings }
    await saveSettings()
    await syncMinimizeToTray()
    applyTheme(defaultSettings.themeMode)
  }

  return {
    settings,
    isLoading,
    isDarkMode,
    loadSettings,
    saveSettings,
    updateSetting,
    updateSettings,
    resetSettings,
    applyTheme
  }
})
