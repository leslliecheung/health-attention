<template>
  <div class="dashboard">
    <h1 class="page-title">仪表盘</h1>
    <p class="page-description">今日健康数据一览</p>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card gradient-card-blue">
          <div class="stat-icon">
            <el-icon><Coffee /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ waterStore.todayCups }}</div>
            <div class="stat-label">今日饮水 (杯)</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="stat-card gradient-card-green">
          <div class="stat-icon">
            <el-icon><Aim /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ settingsStore.settings.dailyTargetCups }}</div>
            <div class="stat-label">目标杯数</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="stat-card gradient-card-orange">
          <div class="stat-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ waterStore.todayVolume }}</div>
            <div class="stat-label">饮水量 (ml)</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="stat-card gradient-card-purple">
          <div class="stat-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ waterStore.todayCompletionRate.toFixed(0) }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 快捷操作区域 -->
    <el-row :gutter="20" class="action-row">
      <el-col :span="12">
        <div class="action-card">
          <h3 class="card-title">💧 快速记录饮水</h3>
          <div class="water-buttons">
            <el-button
              v-for="n in [1, 2, 3]"
              :key="n"
              type="primary"
              size="large"
              :icon="Coffee"
              @click="addWater(n)"
            >
              +{{ n }} 杯
            </el-button>
          </div>
          <div class="progress-section">
            <div class="progress-label">
              <span>今日进度</span>
              <span>{{ waterStore.todayCups }} / {{ settingsStore.settings.dailyTargetCups }} 杯</span>
            </div>
            <el-progress
              :percentage="waterStore.todayCompletionRate"
              :stroke-width="12"
              :color="progressColor"
            />
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="action-card">
          <h3 class="card-title">⏰ 提醒状态</h3>
          <div class="reminder-status">
            <div class="status-item">
              <div class="status-indicator" :class="{ active: settingsStore.settings.waterReminderEnabled }"></div>
              <span class="status-label">喝水提醒</span>
              <span class="status-value">
                {{ settingsStore.settings.waterReminderEnabled ? `每 ${settingsStore.settings.waterIntervalMinutes} 分钟` : '已关闭' }}
              </span>
            </div>
            <div class="status-item">
              <div class="status-indicator" :class="{ active: settingsStore.settings.sitReminderEnabled }"></div>
              <span class="status-label">久坐提醒</span>
              <span class="status-value">
                {{ settingsStore.settings.sitReminderEnabled ? `每 ${settingsStore.settings.sitIntervalMinutes} 分钟` : '已关闭' }}
              </span>
            </div>
            <div class="status-item">
              <div class="status-indicator" :class="{ active: reminderStore.canSendReminder() }"></div>
              <span class="status-label">当前状态</span>
              <span class="status-value">
                {{ reminderStore.canSendReminder() ? '工作时间内' : '休息时间' }}
              </span>
            </div>
          </div>
          <el-button type="success" class="test-btn" @click="testNotification">
            <el-icon><Bell /></el-icon>
            测试通知
          </el-button>
        </div>
      </el-col>
    </el-row>

    <!-- 今日记录 -->
    <div class="today-records">
      <h3 class="card-title">📝 今日饮水记录</h3>
      <el-table :data="waterStore.todayRecords" stripe style="width: 100%">
        <el-table-column prop="time" label="时间" width="120" />
        <el-table-column prop="cups" label="杯数" width="100">
          <template #default="{ row }">
            {{ row.cups }} 杯
          </template>
        </el-table-column>
        <el-table-column prop="volume" label="饮水量" width="120">
          <template #default="{ row }">
            {{ row.volume }} ml
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" size="small" :icon="Delete" circle @click="deleteRecord(row.id)" />
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="waterStore.todayRecords.length === 0" description="暂无饮水记录" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Coffee, Aim, TrendCharts, CircleCheck, Bell, Delete } from '@element-plus/icons-vue'
import { useWaterStore } from '@/stores/water'
import { useSettingsStore } from '@/stores/settings'
import { useReminderStore } from '@/stores/reminder'

const waterStore = useWaterStore()
const settingsStore = useSettingsStore()
const reminderStore = useReminderStore()

// 进度条颜色
const progressColor = computed(() => {
  const rate = waterStore.todayCompletionRate
  if (rate < 30) return '#f56c6c'
  if (rate < 60) return '#e6a23c'
  if (rate < 100) return '#409eff'
  return '#67c23a'
})

// 添加饮水记录
const addWater = async (cups: number) => {
  await waterStore.addRecord(cups)
  ElMessage.success(`成功记录 ${cups} 杯水！`)
}

// 删除记录
const deleteRecord = async (id: string) => {
  await waterStore.deleteRecord(id)
  ElMessage.success('记录已删除')
}

// 测试通知
const testNotification = async () => {
  await reminderStore.sendSystemNotification('测试通知', '如果你看到这条消息，说明通知功能正常工作！')
  ElMessage.success('通知已发送')
}

onMounted(async () => {
  await waterStore.loadRecords()
})
</script>

<style scoped>
.dashboard {
  padding: 10px;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  min-height: 100px;
}

.stat-icon {
  font-size: 40px;
  margin-right: 16px;
  opacity: 0.9;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.action-row {
  margin-bottom: 20px;
}

.action-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 200px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.water-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.water-buttons .el-button {
  flex: 1;
}

.progress-section {
  margin-top: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.reminder-status {
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.status-item:last-child {
  border-bottom: none;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #909399;
  margin-right: 12px;
}

.status-indicator.active {
  background-color: #67c23a;
}

.status-label {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.status-value {
  font-size: 14px;
  color: #909399;
}

.test-btn {
  width: 100%;
}

.today-records {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>
