<template>
  <div class="statistics">
    <h1 class="page-title">统计分析</h1>
    <p class="page-description">查看你的饮水习惯和趋势</p>

    <!-- 时间范围选择 -->
    <div class="time-range stat-card">
      <el-radio-group v-model="timeRange" @change="updateChart">
        <el-radio-button label="week">最近7天</el-radio-button>
        <el-radio-button label="month">最近30天</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="chart-card stat-card">
          <h3>饮水趋势</h3>
          <v-chart :option="lineChartOption" autoresize style="height: 350px" />
        </div>
      </el-col>

      <el-col :span="8">
        <div class="chart-card stat-card">
          <h3>完成率分布</h3>
          <v-chart :option="pieChartOption" autoresize style="height: 350px" />
        </div>
      </el-col>
    </el-row>

    <!-- 统计汇总 -->
    <div class="summary-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="summary-card stat-card">
            <div class="summary-icon" style="background: #409eff;">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ avgCups.toFixed(1) }}</div>
              <div class="summary-label">日均饮水 (杯)</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="summary-card stat-card">
            <div class="summary-icon" style="background: #67c23a;">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ totalCups }}</div>
              <div class="summary-label">累计饮水 (杯)</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="summary-card stat-card">
            <div class="summary-icon" style="background: #e6a23c;">
              <el-icon><Medal /></el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ completedDays }}</div>
              <div class="summary-label">达标天数</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="summary-card stat-card">
            <div class="summary-icon" style="background: #f56c6c;">
              <el-icon><Aim /></el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ avgCompletionRate.toFixed(0) }}%</div>
              <div class="summary-label">平均完成率</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 每日详情表格 -->
    <div class="daily-table stat-card">
      <h3>每日详情</h3>
      <el-table :data="statsData" stripe style="width: 100%">
        <el-table-column prop="date" label="日期" width="150" />
        <el-table-column prop="totalCups" label="饮水杯数" width="120">
          <template #default="{ row }">
            {{ row.totalCups }} 杯
          </template>
        </el-table-column>
        <el-table-column prop="totalVolume" label="饮水量" width="120">
          <template #default="{ row }">
            {{ row.totalVolume }} ml
          </template>
        </el-table-column>
        <el-table-column prop="completionRate" label="完成率" width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="row.completionRate"
              :color="getProgressColor(row.completionRate)"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.completionRate >= 100 ? 'success' : 'warning'">
              {{ row.completionRate >= 100 ? '达标' : '未达标' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { DataAnalysis, TrendCharts, Medal, Aim } from '@element-plus/icons-vue'
import { useWaterStore } from '@/stores/water'
import type { DailyStats } from '@/types'

// 注册ECharts组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const waterStore = useWaterStore()
const timeRange = ref<'week' | 'month'>('week')

// 统计数据
const statsData = ref<DailyStats[]>([])

// 更新图表数据
const updateChart = () => {
  const days = timeRange.value === 'week' ? 7 : 30
  statsData.value = waterStore.getRecentStats(days)
}

// 日均饮水杯数
const avgCups = computed(() => {
  if (statsData.value.length === 0) return 0
  const total = statsData.value.reduce((sum, s) => sum + s.totalCups, 0)
  return total / statsData.value.length
})

// 累计饮水杯数
const totalCups = computed(() => {
  return statsData.value.reduce((sum, s) => sum + s.totalCups, 0)
})

// 达标天数
const completedDays = computed(() => {
  return statsData.value.filter(s => s.completionRate >= 100).length
})

// 平均完成率
const avgCompletionRate = computed(() => {
  if (statsData.value.length === 0) return 0
  const total = statsData.value.reduce((sum, s) => sum + s.completionRate, 0)
  return total / statsData.value.length
})

// 折线图配置
const lineChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['实际饮水', '目标']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: statsData.value.map(s => s.date.slice(5)) // 只显示月-日
  },
  yAxis: {
    type: 'value',
    name: '杯数'
  },
  series: [
    {
      name: '实际饮水',
      type: 'line',
      smooth: true,
      areaStyle: {
        opacity: 0.3
      },
      data: statsData.value.map(s => s.totalCups),
      itemStyle: {
        color: '#409eff'
      }
    },
    {
      name: '目标',
      type: 'line',
      smooth: true,
      lineStyle: {
        type: 'dashed'
      },
      data: statsData.value.map(s => s.targetCups),
      itemStyle: {
        color: '#67c23a'
      }
    }
  ]
}))

// 饼图配置
const pieChartOption = computed(() => {
  const completed = statsData.value.filter(s => s.completionRate >= 100).length
  const partial = statsData.value.filter(s => s.completionRate >= 50 && s.completionRate < 100).length
  const low = statsData.value.filter(s => s.completionRate < 50).length

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} 天 ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [
      {
        name: '完成情况',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: completed, name: '达标', itemStyle: { color: '#67c23a' } },
          { value: partial, name: '部分完成', itemStyle: { color: '#e6a23c' } },
          { value: low, name: '未完成', itemStyle: { color: '#f56c6c' } }
        ]
      }
    ]
  }
})

// 获取进度条颜色
const getProgressColor = (rate: number): string => {
  if (rate < 30) return '#f56c6c'
  if (rate < 60) return '#e6a23c'
  if (rate < 100) return '#409eff'
  return '#67c23a'
}

onMounted(async () => {
  await waterStore.loadRecords()
  updateChart()
})
</script>

<style scoped>
.statistics {
  padding: 10px;
}

.time-range {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.summary-cards {
  margin-bottom: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #fff;
  font-size: 24px;
}

.summary-content {
  flex: 1;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.daily-table {
  margin-bottom: 20px;
}

.daily-table h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}
</style>
