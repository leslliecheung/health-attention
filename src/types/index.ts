// 饮水记录
export interface WaterRecord {
  id: string
  date: string  // YYYY-MM-DD
  time: string  // HH:mm
  cups: number  // 杯数
  volume: number // 毫升
}

// 每日统计
export interface DailyStats {
  date: string
  totalCups: number
  totalVolume: number
  targetCups: number
  targetVolume: number
  completionRate: number
}

// 设置配置
export interface Settings {
  // 饮水提醒
  waterReminderEnabled: boolean
  waterIntervalMinutes: number  // 提醒间隔（分钟）
  cupVolume: number  // 每杯容量（毫升）
  dailyTargetCups: number  // 每日目标杯数

  // 久坐提醒
  sitReminderEnabled: boolean
  sitIntervalMinutes: number  // 久坐提醒间隔（分钟）

  // 工作时间
  workTimeEnabled: boolean
  workStartTime: string  // HH:mm
  workEndTime: string    // HH:mm
  workDays: number[]     // 0-6, 0=周日

  // 勿扰模式
  dndEnabled: boolean
  dndStartTime: string   // HH:mm
  dndEndTime: string     // HH:mm

  // 系统设置
  autoStart: boolean      // 开机自启动
  minimizeToTray: boolean // 最小化到托盘
  soundEnabled: boolean   // 提醒声音
}

// 默认设置
export const defaultSettings: Settings = {
  waterReminderEnabled: true,
  waterIntervalMinutes: 45,
  cupVolume: 250,
  dailyTargetCups: 8,

  sitReminderEnabled: true,
  sitIntervalMinutes: 60,

  workTimeEnabled: true,
  workStartTime: '09:00',
  workEndTime: '18:00',
  workDays: [1, 2, 3, 4, 5], // 周一到周五

  dndEnabled: false,
  dndStartTime: '22:00',
  dndEndTime: '08:00',

  autoStart: false,
  minimizeToTray: true,
  soundEnabled: true
}
