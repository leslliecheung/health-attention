import { defineStore } from 'pinia'
import { ref } from 'vue'
import { LazyStore } from '@tauri-apps/plugin-store'
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart'
import { invoke } from '@tauri-apps/api/core'
import type { Settings } from '@/types'
import { defaultSettings } from '@/types'

const SETTINGS_KEY = 'settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({ ...defaultSettings })
  const isLoading = ref(false)
  let store: LazyStore | null = null

  // 初始化store
  const initStore = (): LazyStore => {
    if (!store) {
      store = new LazyStore('settings.json')
    }
    return store
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
  }

  // 批量更新设置
  const updateSettings = async (newSettings: Partial<Settings>): Promise<void> => {
    settings.value = { ...settings.value, ...newSettings }
    await saveSettings()

    // 如果更新了 minimizeToTray，同步到后端
    if ('minimizeToTray' in newSettings) {
      await syncMinimizeToTray()
    }
  }

  // 重置为默认设置
  const resetSettings = async (): Promise<void> => {
    settings.value = { ...defaultSettings }
    await saveSettings()
    await syncMinimizeToTray()
  }

  return {
    settings,
    isLoading,
    loadSettings,
    saveSettings,
    updateSetting,
    updateSettings,
    resetSettings
  }
})
