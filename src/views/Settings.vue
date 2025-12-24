<template>
  <div class="settings">
    <h1 class="page-title">设置</h1>
    <p class="page-description">自定义你的健康提醒偏好</p>

    <el-form label-width="140px" class="settings-form">
      <!-- 饮水提醒设置 -->
      <div class="settings-section stat-card">
        <h3>💧 饮水提醒</h3>
        <el-form-item label="开启提醒">
          <el-switch
            v-model="settings.waterReminderEnabled"
            @change="(val) => updateSetting('waterReminderEnabled', val)"
          />
        </el-form-item>
        <el-form-item label="提醒间隔">
          <el-input-number
            v-model="settings.waterIntervalMinutes"
            :min="15"
            :max="120"
            :step="5"
            :disabled="!settings.waterReminderEnabled"
            @change="(val) => updateSetting('waterIntervalMinutes', val)"
          />
          <span class="unit">分钟</span>
        </el-form-item>
        <el-form-item label="每杯容量">
          <el-input-number
            v-model="settings.cupVolume"
            :min="100"
            :max="500"
            :step="50"
            @change="(val) => updateSetting('cupVolume', val)"
          />
          <span class="unit">毫升</span>
        </el-form-item>
        <el-form-item label="每日目标">
          <el-input-number
            v-model="settings.dailyTargetCups"
            :min="1"
            :max="20"
            @change="(val) => updateSetting('dailyTargetCups', val)"
          />
          <span class="unit">杯 ({{ settings.dailyTargetCups * settings.cupVolume }}ml)</span>
        </el-form-item>
      </div>

      <!-- 久坐提醒设置 -->
      <div class="settings-section stat-card">
        <h3>🪑 久坐提醒</h3>
        <el-form-item label="开启提醒">
          <el-switch
            v-model="settings.sitReminderEnabled"
            @change="(val) => updateSetting('sitReminderEnabled', val)"
          />
        </el-form-item>
        <el-form-item label="提醒间隔">
          <el-input-number
            v-model="settings.sitIntervalMinutes"
            :min="30"
            :max="180"
            :step="10"
            :disabled="!settings.sitReminderEnabled"
            @change="(val) => updateSetting('sitIntervalMinutes', val)"
          />
          <span class="unit">分钟</span>
        </el-form-item>
      </div>

      <!-- 眼睛休息提醒设置 -->
      <div class="settings-section stat-card">
        <h3>👁️ 眼睛休息提醒 (20-20-20法则)</h3>
        <el-form-item label="开启提醒">
          <el-switch
            v-model="settings.eyeReminderEnabled"
            @change="(val) => updateSetting('eyeReminderEnabled', val)"
          />
        </el-form-item>
        <el-form-item label="提醒间隔">
          <el-input-number
            v-model="settings.eyeIntervalMinutes"
            :min="10"
            :max="60"
            :step="5"
            :disabled="!settings.eyeReminderEnabled"
            @change="(val) => updateSetting('eyeIntervalMinutes', val)"
          />
          <span class="unit">分钟</span>
        </el-form-item>
        <el-form-item label="休息时长">
          <el-input-number
            v-model="settings.eyeRestDurationSeconds"
            :min="10"
            :max="60"
            :step="5"
            :disabled="!settings.eyeReminderEnabled"
            @change="(val) => updateSetting('eyeRestDurationSeconds', val)"
          />
          <span class="unit">秒（建议20秒）</span>
        </el-form-item>
        <el-alert
          v-if="settings.eyeReminderEnabled"
          title="20-20-20 法则"
          type="info"
          :closable="false"
          show-icon
        >
          每隔 {{ settings.eyeIntervalMinutes }} 分钟，看向 6 米（20 英尺）外的物体至少 {{ settings.eyeRestDurationSeconds }} 秒，可有效缓解眼疲劳。
        </el-alert>
      </div>

      <!-- 工作时间设置 -->
      <div class="settings-section stat-card">
        <h3>🕐 工作时间</h3>
        <el-form-item label="仅工作时间提醒">
          <el-switch
            v-model="settings.workTimeEnabled"
            @change="(val) => updateSetting('workTimeEnabled', val)"
          />
        </el-form-item>
        <el-form-item label="工作时间">
          <el-time-picker
            v-model="workStartTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="开始时间"
            :disabled="!settings.workTimeEnabled"
            @change="updateWorkStartTime"
          />
          <span class="time-separator">至</span>
          <el-time-picker
            v-model="workEndTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="结束时间"
            :disabled="!settings.workTimeEnabled"
            @change="updateWorkEndTime"
          />
        </el-form-item>
        <el-form-item label="工作日">
          <el-checkbox-group
            v-model="settings.workDays"
            :disabled="!settings.workTimeEnabled"
            @change="(val) => updateSetting('workDays', val)"
          >
            <el-checkbox :value="1">周一</el-checkbox>
            <el-checkbox :value="2">周二</el-checkbox>
            <el-checkbox :value="3">周三</el-checkbox>
            <el-checkbox :value="4">周四</el-checkbox>
            <el-checkbox :value="5">周五</el-checkbox>
            <el-checkbox :value="6">周六</el-checkbox>
            <el-checkbox :value="0">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </div>

      <!-- 勿扰模式 -->
      <div class="settings-section stat-card">
        <h3>🔇 勿扰模式</h3>
        <el-form-item label="开启勿扰">
          <el-switch
            v-model="settings.dndEnabled"
            @change="(val) => updateSetting('dndEnabled', val)"
          />
        </el-form-item>
        <el-form-item label="勿扰时间">
          <el-time-picker
            v-model="dndStartTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="开始时间"
            :disabled="!settings.dndEnabled"
            @change="updateDndStartTime"
          />
          <span class="time-separator">至</span>
          <el-time-picker
            v-model="dndEndTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="结束时间"
            :disabled="!settings.dndEnabled"
            @change="updateDndEndTime"
          />
        </el-form-item>
      </div>

      <!-- 外观设置 -->
      <div class="settings-section stat-card">
        <h3>🎨 外观设置</h3>
        <el-form-item label="主题模式">
          <el-radio-group
            v-model="settings.themeMode"
            @change="(val) => updateSetting('themeMode', val)"
          >
            <el-radio value="light">浅色</el-radio>
            <el-radio value="dark">深色</el-radio>
            <el-radio value="auto">跟随系统</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <!-- 系统设置 -->
      <div class="settings-section stat-card">
        <h3>⚙️ 系统设置</h3>
        <el-form-item label="开机自启动">
          <el-switch
            v-model="settings.autoStart"
            @change="(val) => updateSetting('autoStart', val)"
          />
        </el-form-item>
        <el-form-item label="关闭时最小化到托盘">
          <el-switch
            v-model="settings.minimizeToTray"
            @change="(val) => updateSetting('minimizeToTray', val)"
          />
        </el-form-item>
        <el-form-item label="提醒声音">
          <el-switch
            v-model="settings.soundEnabled"
            @change="(val) => updateSetting('soundEnabled', val)"
          />
        </el-form-item>
        <el-form-item v-if="settings.soundEnabled" label="音效类型">
          <el-select
            v-model="settings.soundType"
            placeholder="选择音效"
            @change="(val) => updateSetting('soundType', val)"
          >
            <el-option label="默认双音" value="default" />
            <el-option label="柔和音" value="gentle" />
            <el-option label="钟声" value="chime" />
            <el-option label="铃声" value="bell" />
            <el-option label="水滴声" value="water" />
            <el-option label="无声" value="none" />
          </el-select>
          <el-button
            type="primary"
            link
            style="margin-left: 12px;"
            @click="previewCurrentSound"
          >
            试听
          </el-button>
        </el-form-item>
        <el-form-item v-if="settings.soundEnabled && settings.soundType !== 'none'" label="音量">
          <el-slider
            v-model="settings.soundVolume"
            :min="0"
            :max="100"
            :step="10"
            show-stops
            style="width: 200px;"
            @change="(val) => updateSetting('soundVolume', val)"
          />
          <span class="unit">{{ settings.soundVolume }}%</span>
        </el-form-item>
      </div>

      <!-- 操作按钮 -->
      <div class="settings-actions">
        <el-button type="primary" @click="restartReminders">
          <el-icon><Refresh /></el-icon>
          重启提醒
        </el-button>
        <el-button type="warning" @click="showResetConfirm">
          <el-icon><RefreshLeft /></el-icon>
          恢复默认
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, RefreshLeft } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings'
import { useReminderStore } from '@/stores/reminder'
import type { Settings } from '@/types'

const settingsStore = useSettingsStore()
const reminderStore = useReminderStore()

// 直接引用store中的settings
const settings = computed(() => settingsStore.settings)

// 时间选择器的值
const workStartTime = ref('')
const workEndTime = ref('')
const dndStartTime = ref('')
const dndEndTime = ref('')

// 初始化时间值
const initTimeValues = () => {
  workStartTime.value = settings.value.workStartTime
  workEndTime.value = settings.value.workEndTime
  dndStartTime.value = settings.value.dndStartTime
  dndEndTime.value = settings.value.dndEndTime
}

// 更新设置
const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
  await settingsStore.updateSetting(key, value)
  // 如果修改了提醒相关设置，重启提醒
  if (['waterReminderEnabled', 'waterIntervalMinutes',
       'sitReminderEnabled', 'sitIntervalMinutes',
       'eyeReminderEnabled', 'eyeIntervalMinutes', 'eyeRestDurationSeconds'].includes(key)) {
    reminderStore.restartReminders()
  }
  ElMessage.success('设置已保存')
}

// 更新工作时间
const updateWorkStartTime = async (val: string) => {
  await settingsStore.updateSetting('workStartTime', val || '09:00')
  ElMessage.success('设置已保存')
}

const updateWorkEndTime = async (val: string) => {
  await settingsStore.updateSetting('workEndTime', val || '18:00')
  ElMessage.success('设置已保存')
}

// 更新勿扰时间
const updateDndStartTime = async (val: string) => {
  await settingsStore.updateSetting('dndStartTime', val || '22:00')
  ElMessage.success('设置已保存')
}

const updateDndEndTime = async (val: string) => {
  await settingsStore.updateSetting('dndEndTime', val || '08:00')
  ElMessage.success('设置已保存')
}

// 重启提醒
const restartReminders = () => {
  reminderStore.restartReminders()
  ElMessage.success('提醒已重启')
}

// 预览当前音效
const previewCurrentSound = async () => {
  await reminderStore.previewSound(settings.value.soundType, settings.value.soundVolume)
}

// 恢复默认设置
const showResetConfirm = () => {
  ElMessageBox.confirm(
    '确定要恢复所有设置为默认值吗？此操作不可撤销。',
    '恢复默认设置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await settingsStore.resetSettings()
    initTimeValues()
    reminderStore.restartReminders()
    ElMessage.success('设置已恢复为默认值')
  }).catch(() => {
    // 取消操作
  })
}

// 监听settings变化，更新时间值
watch(() => settings.value, () => {
  initTimeValues()
}, { deep: true })

onMounted(async () => {
  await settingsStore.loadSettings()
  initTimeValues()
})
</script>

<style scoped>
.settings {
  padding: 10px;
  max-width: 800px;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.settings-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.unit {
  margin-left: 8px;
  color: var(--text-muted);
  font-size: 14px;
}

.time-separator {
  margin: 0 12px;
  color: var(--text-muted);
}

.settings-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-radio-group) {
  display: flex;
  gap: 16px;
}
</style>
