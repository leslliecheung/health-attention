// 饮水记录
export interface WaterRecord {
  id: string
  date: string  // YYYY-MM-DD
  time: string  // HH:mm
  cups: number  // 杯数
  volume: number // 毫升
}

// 饮水每日统计
export interface DailyStats {
  date: string
  totalCups: number
  totalVolume: number
  targetCups: number
  targetVolume: number
  completionRate: number
}

// 久坐/活动记录
export interface SitRecord {
  id: string
  date: string           // YYYY-MM-DD
  time: string           // HH:mm
  sitDuration: number    // 久坐时长（分钟）
  restCompleted: boolean // 是否完成休息
  isAutoRecord: boolean  // 是否自动记录
}

// 久坐每日统计
export interface SitDailyStats {
  date: string
  totalSitTime: number      // 总久坐时长（分钟）
  restCount: number         // 休息次数
  avgSitDuration: number    // 平均每次久坐时长
}

// 音效类型
export type SoundType = 'default' | 'gentle' | 'chime' | 'bell' | 'water' | 'none'

// 主题模式
export type ThemeMode = 'light' | 'dark' | 'auto'

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

  // 眼睛休息提醒 (20-20-20法则)
  eyeReminderEnabled: boolean
  eyeIntervalMinutes: number      // 间隔（默认20分钟）
  eyeRestDurationSeconds: number  // 休息时长（默认20秒）

  // 工作时间
  workTimeEnabled: boolean
  workStartTime: string  // HH:mm
  workEndTime: string    // HH:mm
  workDays: number[]     // 0-6, 0=周日

  // 勿扰模式
  dndEnabled: boolean
  dndStartTime: string   // HH:mm
  dndEndTime: string     // HH:mm

  // 外观设置
  themeMode: ThemeMode   // 主题模式

  // 音效设置
  soundEnabled: boolean   // 提醒声音
  soundType: SoundType    // 音效类型
  soundVolume: number     // 音量 (0-100)

  // 系统设置
  autoStart: boolean      // 开机自启动
  minimizeToTray: boolean // 最小化到托盘
}

// 默认设置
export const defaultSettings: Settings = {
  // 饮水提醒
  waterReminderEnabled: true,
  waterIntervalMinutes: 45,
  cupVolume: 250,
  dailyTargetCups: 8,

  // 久坐提醒
  sitReminderEnabled: true,
  sitIntervalMinutes: 60,

  // 眼睛休息提醒 (20-20-20法则)
  eyeReminderEnabled: true,
  eyeIntervalMinutes: 20,
  eyeRestDurationSeconds: 20,

  // 工作时间
  workTimeEnabled: true,
  workStartTime: '09:00',
  workEndTime: '18:00',
  workDays: [1, 2, 3, 4, 5], // 周一到周五

  // 勿扰模式
  dndEnabled: false,
  dndStartTime: '22:00',
  dndEndTime: '08:00',

  // 外观设置
  themeMode: 'auto',

  // 音效设置
  soundEnabled: true,
  soundType: 'default',
  soundVolume: 70,

  // 系统设置
  autoStart: false,
  minimizeToTray: true
}
