<template>
  <div class="water-record">
    <h1 class="page-title">饮水记录</h1>
    <p class="page-description">管理和查看你的饮水历史</p>

    <!-- 快捷记录 -->
    <div class="quick-record stat-card">
      <h3>快速记录</h3>
      <div class="quick-buttons">
        <el-button
          v-for="n in [1, 2, 3, 4, 5]"
          :key="n"
          type="primary"
          :plain="n > 1"
          size="large"
          @click="addRecord(n)"
        >
          +{{ n }} 杯
        </el-button>
        <el-button type="success" size="large" @click="showCustomDialog = true">
          自定义
        </el-button>
      </div>
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
        共 {{ filteredRecords.length }} 条记录，{{ totalCups }} 杯，{{ totalVolume }} ml
      </span>
    </div>

    <!-- 记录列表 -->
    <div class="records-list stat-card">
      <h3>记录详情</h3>
      <el-table :data="filteredRecords" stripe style="width: 100%">
        <el-table-column prop="time" label="时间" width="150" sortable />
        <el-table-column prop="cups" label="杯数" width="100">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.cups }} 杯</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="volume" label="饮水量" width="150">
          <template #default="{ row }">
            {{ row.volume }} ml
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
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
      <el-empty v-if="filteredRecords.length === 0" description="暂无饮水记录" />
    </div>

    <!-- 自定义记录对话框 -->
    <el-dialog v-model="showCustomDialog" title="自定义记录" width="400px">
      <el-form label-width="80px">
        <el-form-item label="杯数">
          <el-input-number v-model="customCups" :min="1" :max="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCustomDialog = false">取消</el-button>
        <el-button type="primary" @click="addCustomRecord">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useWaterStore } from '@/stores/water'

const waterStore = useWaterStore()

// 获取今天日期
const getTodayStr = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const selectedDate = ref(getTodayStr())
const showCustomDialog = ref(false)
const customCups = ref(1)

// 筛选后的记录
const filteredRecords = computed(() => {
  return waterStore.records.filter(r => r.date === selectedDate.value)
})

// 总杯数
const totalCups = computed(() => {
  return filteredRecords.value.reduce((sum, r) => sum + r.cups, 0)
})

// 总饮水量
const totalVolume = computed(() => {
  return filteredRecords.value.reduce((sum, r) => sum + r.volume, 0)
})

// 禁用未来日期
const disabledDate = (time: Date): boolean => {
  return time.getTime() > Date.now()
}

// 添加记录
const addRecord = async (cups: number) => {
  await waterStore.addRecord(cups)
  ElMessage.success(`成功记录 ${cups} 杯水！`)
}

// 添加自定义记录
const addCustomRecord = async () => {
  await waterStore.addRecord(customCups.value)
  ElMessage.success(`成功记录 ${customCups.value} 杯水！`)
  showCustomDialog.value = false
  customCups.value = 1
}

// 删除记录
const deleteRecord = async (id: string) => {
  await waterStore.deleteRecord(id)
  ElMessage.success('记录已删除')
}

onMounted(async () => {
  await waterStore.loadRecords()
})
</script>

<style scoped>
.water-record {
  padding: 10px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.quick-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 20px;
}

.date-summary {
  color: #909399;
  font-size: 14px;
}

.records-list {
  min-height: 300px;
}
</style>
