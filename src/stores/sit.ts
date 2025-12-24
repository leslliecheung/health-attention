import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LazyStore } from '@tauri-apps/plugin-store'
import type { SitRecord, SitDailyStats } from '@/types'
import { useSettingsStore } from './settings'

const RECORDS_KEY = 'sit_records'

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

export const useSitStore = defineStore('sit', () => {
  const records = ref<SitRecord[]>([])
  const isLoading = ref(false)
  let store: LazyStore | null = null

  // 初始化store
  const initStore = (): LazyStore => {
    if (!store) {
      store = new LazyStore('sit.json')
    }
    return store
  }

  // 今日记录
  const todayRecords = computed((): SitRecord[] => {
    const today = getTodayStr()
    return records.value.filter(r => r.date === today)
  })

  // 今日总久坐时长
  const todaySitTime = computed((): number => {
    return todayRecords.value.reduce((sum, r) => sum + r.sitDuration, 0)
  })

  // 今日休息次数
  const todayRestCount = computed((): number => {
    return todayRecords.value.filter(r => r.restCompleted).length
  })

  // 今日平均久坐时长
  const todayAvgSitDuration = computed((): number => {
    const count = todayRecords.value.length
    return count > 0 ? Math.round(todaySitTime.value / count) : 0
  })

  // 加载记录
  const loadRecords = async (): Promise<void> => {
    isLoading.value = true
    try {
      const s = initStore()
      const saved = await s.get<SitRecord[]>(RECORDS_KEY)
      if (saved) {
        records.value = saved
      }
    } catch (error) {
      console.error('加载久坐记录失败:', error)
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
      console.error('保存久坐记录失败:', error)
    }
  }

  // 添加自动记录（久坐提醒触发时）
  const addAutoRecord = async (): Promise<void> => {
    const settingsStore = useSettingsStore()
    const record: SitRecord = {
      id: generateId(),
      date: getTodayStr(),
      time: getCurrentTimeStr(),
      sitDuration: settingsStore.settings.sitIntervalMinutes,
      restCompleted: false, // 默认未完成休息
      isAutoRecord: true
    }
    records.value.push(record)
    await saveRecords()
    return Promise.resolve()
  }

  // 添加手动记录
  const addManualRecord = async (sitDuration: number, restCompleted: boolean): Promise<void> => {
    const record: SitRecord = {
      id: generateId(),
      date: getTodayStr(),
      time: getCurrentTimeStr(),
      sitDuration,
      restCompleted,
      isAutoRecord: false
    }
    records.value.push(record)
    await saveRecords()
  }

  // 标记休息完成
  const markRestCompleted = async (id: string): Promise<void> => {
    const record = records.value.find(r => r.id === id)
    if (record) {
      record.restCompleted = true
      await saveRecords()
    }
  }

  // 删除记录
  const deleteRecord = async (id: string): Promise<void> => {
    const index = records.value.findIndex(r => r.id === id)
    if (index > -1) {
      records.value.splice(index, 1)
      await saveRecords()
    }
  }

  // 获取指定日期的统计
  const getDailyStats = (date: string): SitDailyStats => {
    const dayRecords = records.value.filter(r => r.date === date)
    const totalSitTime = dayRecords.reduce((sum, r) => sum + r.sitDuration, 0)
    const restCount = dayRecords.filter(r => r.restCompleted).length
    const avgSitDuration = dayRecords.length > 0 ? Math.round(totalSitTime / dayRecords.length) : 0

    return {
      date,
      totalSitTime,
      restCount,
      avgSitDuration
    }
  }

  // 获取最近N天的统计
  const getRecentStats = (days: number = 7): SitDailyStats[] => {
    const stats: SitDailyStats[] = []
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
  const getWeeklyStats = (): SitDailyStats[] => {
    return getRecentStats(7)
  }

  // 获取本月统计
  const getMonthlyStats = (): SitDailyStats[] => {
    return getRecentStats(30)
  }

  return {
    records,
    isLoading,
    todayRecords,
    todaySitTime,
    todayRestCount,
    todayAvgSitDuration,
    loadRecords,
    saveRecords,
    addAutoRecord,
    addManualRecord,
    markRestCompleted,
    deleteRecord,
    getDailyStats,
    getRecentStats,
    getWeeklyStats,
    getMonthlyStats
  }
})
