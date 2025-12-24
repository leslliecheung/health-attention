<template>
  <div class="activity-record">
    <h1 class="page-title">活动记录</h1>
    <p class="page-description">管理和查看你的久坐休息记录</p>

    <!-- 快捷记录 -->
    <div class="quick-record stat-card">
      <h3>快速记录</h3>
      <div class="quick-buttons">
        <el-button
          type="success"
          size="large"
          @click="addQuickRest"
        >
          ✅ 已休息
        </el-button>
        <el-button
          type="primary"
          size="large"
          plain
          @click="showManualDialog = true"
        >
          📝 手动补录
        </el-button>
      </div>
      <p class="tip">💡 久坐提醒会自动记录，你也可以手动补录遗漏的休息</p>
    </div>

    <!-- 日期选择 -->
    <div class="date-filter stat-card">
      <h3>查看记录</h3>
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :disabled-date="disabledDate"
      />
      <span class="date-summary">
        共 {{ filteredRecords.length }} 条记录，总久坐 {{ totalSitTime }} 分钟，休息 {{ restCount }} 次
      </span>
    </div>

    <!-- 记录列表 -->
    <div class="records-list stat-card">
      <h3>记录详情</h3>
      <el-table :data="filteredRecords" stripe style="width: 100%">
        <el-table-column prop="time" label="时间" width="120" sortable />
        <el-table-column prop="sitDuration" label="久坐时长" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.sitDuration }} 分钟</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="restCompleted" label="完成休息" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.restCompleted" type="success">已完成</el-tag>
            <el-tag v-else type="warning">未完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isAutoRecord" label="记录方式" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.isAutoRecord" type="info">自动</el-tag>
            <el-tag v-else type="primary">手动</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              v-if="!row.restCompleted"
              type="success"
              size="small"
              @click="markCompleted(row.id)"
            >
              完成休息
            </el-button>
            <el-popconfirm
              title="确定要删除这条记录吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="deleteRecord(row.id)"
            >
              <template #reference>
                <el-button type="danger" size="small" :icon="Delete" circle />
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="filteredRecords.length === 0" description="暂无活动记录" />
    </div>

    <!-- 手动补录对话框 -->
    <el-dialog v-model="showManualDialog" title="手动补录休息记录" width="450px">
      <el-form label-width="100px">
        <el-form-item label="久坐时长">
          <el-input-number v-model="manualDuration" :min="10" :max="180" :step="10" />
          <span style="margin-left: 8px; color: #909399;">分钟</span>
        </el-form-item>
        <el-form-item label="已完成休息">
          <el-switch v-model="manualCompleted" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showManualDialog = false">取消</el-button>
        <el-button type="primary" @click="addManualRecord">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useSitStore } from '@/stores/sit'
import { useSettingsStore } from '@/stores/settings'

const sitStore = useSitStore()
const settingsStore = useSettingsStore()

// 获取今天日期
const getTodayStr = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const selectedDate = ref(getTodayStr())
const showManualDialog = ref(false)
const manualDuration = ref(60)
const manualCompleted = ref(true)

// 筛选后的记录
const filteredRecords = computed(() => {
  return sitStore.records.filter(r => r.date === selectedDate.value)
})

// 总久坐时长
const totalSitTime = computed(() => {
  return filteredRecords.value.reduce((sum, r) => sum + r.sitDuration, 0)
})

// 休息次数
const restCount = computed(() => {
  return filteredRecords.value.filter(r => r.restCompleted).length
})

// 禁用未来日期
const disabledDate = (time: Date): boolean => {
  return time.getTime() > Date.now()
}

// 快速添加已休息记录（使用设置中的久坐间隔）
const addQuickRest = async () => {
  const duration = settingsStore.settings.sitIntervalMinutes
  await sitStore.addManualRecord(duration, true)
  ElMessage.success(`成功记录休息！久坐时长 ${duration} 分钟`)
}

// 添加手动记录
const addManualRecord = async () => {
  await sitStore.addManualRecord(manualDuration.value, manualCompleted.value)
  ElMessage.success('记录已添加')
  showManualDialog.value = false
  manualDuration.value = 60
  manualCompleted.value = true
}

// 标记休息完成
const markCompleted = async (id: string) => {
  await sitStore.markRestCompleted(id)
  ElMessage.success('已标记为完成休息')
}

// 删除记录
const deleteRecord = async (id: string) => {
  await sitStore.deleteRecord(id)
  ElMessage.success('记录已删除')
}

onMounted(async () => {
  await sitStore.loadRecords()
})
</script>

<style scoped>
.activity-record {
  padding: 10px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.quick-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.tip {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 20px;
}

.date-summary {
  color: var(--text-muted);
  font-size: 14px;
}

.records-list {
  min-height: 300px;
}
</style>
