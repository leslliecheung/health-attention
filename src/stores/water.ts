import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LazyStore } from '@tauri-apps/plugin-store'
import type { WaterRecord, DailyStats } from '@/types'
import { useSettingsStore } from './settings'

const RECORDS_KEY = 'water_records'

// 生成简单的UUID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取今天的日期字符串
const getTodayStr = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 获取当前时间字符串
const getCurrentTimeStr = (): string => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export const useWaterStore = defineStore('water', () => {
  const records = ref<WaterRecord[]>([])
  const isLoading = ref(false)
  let store: LazyStore | null = null

  // 初始化store
  const initStore = (): LazyStore => {
    if (!store) {
      store = new LazyStore('water.json')
    }
    return store
  }

  // 今日记录
  const todayRecords = computed((): WaterRecord[] => {
    const today = getTodayStr()
    return records.value.filter(r => r.date === today)
  })

  // 今日饮水杯数
  const todayCups = computed((): number => {
    return todayRecords.value.reduce((sum, r) => sum + r.cups, 0)
  })

  // 今日饮水量（毫升）
  const todayVolume = computed((): number => {
    return todayRecords.value.reduce((sum, r) => sum + r.volume, 0)
  })

  // 今日完成率
  const todayCompletionRate = computed((): number => {
    const settingsStore = useSettingsStore()
    const target = settingsStore.settings.dailyTargetCups
    if (target === 0) return 0
    return Math.min((todayCups.value / target) * 100, 100)
  })

  // 加载记录
  const loadRecords = async (): Promise<void> => {
    isLoading.value = true
    try {
      const s = initStore()
      const saved = await s.get<WaterRecord[]>(RECORDS_KEY)
      if (saved) {
        records.value = saved
      }
    } catch (error) {
      console.error('加载饮水记录失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 保存记录
  const saveRecords = async (): Promise<void> => {
    try {
      const s = initStore()
      await s.set(RECORDS_KEY, records.value)
      await s.save()
    } catch (error) {
      console.error('保存饮水记录失败:', error)
    }
  }

  // 添加饮水记录
  const addRecord = async (cups: number = 1): Promise<void> => {
    const settingsStore = useSettingsStore()
    const record: WaterRecord = {
      id: generateId(),
      date: getTodayStr(),
      time: getCurrentTimeStr(),
      cups,
      volume: cups * settingsStore.settings.cupVolume
    }
    records.value.push(record)
    await saveRecords()
  }

  // 删除饮水记录
  const deleteRecord = async (id: string): Promise<void> => {
    const index = records.value.findIndex(r => r.id === id)
    if (index > -1) {
      records.value.splice(index, 1)
      await saveRecords()
    }
  }

  // 获取指定日期的统计
  const getDailyStats = (date: string): DailyStats => {
    const settingsStore = useSettingsStore()
    const dayRecords = records.value.filter(r => r.date === date)
    const totalCups = dayRecords.reduce((sum, r) => sum + r.cups, 0)
    const totalVolume = dayRecords.reduce((sum, r) => sum + r.volume, 0)
    const targetCups = settingsStore.settings.dailyTargetCups
    const targetVolume = targetCups * settingsStore.settings.cupVolume

    return {
      date,
      totalCups,
      totalVolume,
      targetCups,
      targetVolume,
      completionRate: targetCups > 0 ? Math.min((totalCups / targetCups) * 100, 100) : 0
    }
  }

  // 获取最近N天的统计
  const getRecentStats = (days: number = 7): DailyStats[] => {
    const stats: DailyStats[] = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      stats.push(getDailyStats(dateStr))
    }

    return stats
  }

  // 获取本周统计
  const getWeeklyStats = (): DailyStats[] => {
    return getRecentStats(7)
  }

  // 获取本月统计
  const getMonthlyStats = (): DailyStats[] => {
    return getRecentStats(30)
  }

  return {
    records,
    isLoading,
    todayRecords,
    todayCups,
    todayVolume,
    todayCompletionRate,
    loadRecords,
    saveRecords,
    addRecord,
    deleteRecord,
    getDailyStats,
    getRecentStats,
    getWeeklyStats,
    getMonthlyStats
  }
})
