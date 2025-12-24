<template>
  <div class="statistics">
    <h1 class="page-title">统计分析</h1>
    <p class="page-description">查看你的健康习惯和趋势</p>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="stats-tabs">
      <el-tab-pane label="💧 饮水统计" name="water">
        <!-- 时间范围选择 -->
        <div class="time-range stat-card">
          <el-radio-group v-model="waterTimeRange" @change="updateWaterChart">
            <el-radio-button label="week">最近7天</el-radio-button>
            <el-radio-button label="month">最近30天</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 图表区域 -->
        <el-row :gutter="20">
          <el-col :span="16">
            <div class="chart-card stat-card">
              <h3>饮水趋势</h3>
              <v-chart :option="waterLineChartOption" autoresize style="height: 350px" />
            </div>
          </el-col>

          <el-col :span="8">
            <div class="chart-card stat-card">
              <h3>完成率分布</h3>
              <v-chart :option="waterPieChartOption" autoresize style="height: 350px" />
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
                  <div class="summary-value">{{ waterAvgCups.toFixed(1) }}</div>
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
                  <div class="summary-value">{{ waterTotalCups }}</div>
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
                  <div class="summary-value">{{ waterCompletedDays }}</div>
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
                  <div class="summary-value">{{ waterAvgCompletionRate.toFixed(0) }}%</div>
                  <div class="summary-label">平均完成率</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 每日详情表格 -->
        <div class="daily-table stat-card">
          <h3>每日详情</h3>
          <el-table :data="waterStatsData" stripe style="width: 100%">
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
      </el-tab-pane>

      <el-tab-pane label="🚶 活动统计" name="activity">
        <!-- 时间范围选择 -->
        <div class="time-range stat-card">
          <el-radio-group v-model="activityTimeRange" @change="updateActivityChart">
            <el-radio-button label="week">最近7天</el-radio-button>
            <el-radio-button label="month">最近30天</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 图表区域 -->
        <el-row :gutter="20">
          <el-col :span="16">
            <div class="chart-card stat-card">
              <h3>久坐时长趋势</h3>
              <v-chart :option="activityLineChartOption" autoresize style="height: 350px" />
            </div>
          </el-col>

          <el-col :span="8">
            <div class="chart-card stat-card">
              <h3>休息完成情况</h3>
              <v-chart :option="activityPieChartOption" autoresize style="height: 350px" />
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
                  <div class="summary-value">{{ activityAvgSitTime.toFixed(0) }}</div>
                  <div class="summary-label">日均久坐 (分钟)</div>
                </div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="summary-card stat-card">
                <div class="summary-icon" style="background: #67c23a;">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ activityTotalRestCount }}</div>
                  <div class="summary-label">累计休息 (次)</div>
                </div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="summary-card stat-card">
                <div class="summary-icon" style="background: #e6a23c;">
                  <el-icon><Medal /></el-icon>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ activityAvgRestPerDay.toFixed(1) }}</div>
                  <div class="summary-label">日均休息次数</div>
                </div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="summary-card stat-card">
                <div class="summary-icon" style="background: #f56c6c;">
                  <el-icon><Aim /></el-icon>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ activityAvgDuration.toFixed(0) }}</div>
                  <div class="summary-label">平均久坐时长 (分钟)</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 每日详情表格 -->
        <div class="daily-table stat-card">
          <h3>每日详情</h3>
          <el-table :data="activityStatsData" stripe style="width: 100%">
            <el-table-column prop="date" label="日期" width="150" />
            <el-table-column prop="totalSitTime" label="总久坐时长" width="150">
              <template #default="{ row }">
                {{ row.totalSitTime }} 分钟
              </template>
            </el-table-column>
            <el-table-column prop="restCount" label="休息次数" width="120">
              <template #default="{ row }">
                <el-tag type="success">{{ row.restCount }} 次</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="avgSitDuration" label="平均久坐时长" width="150">
              <template #default="{ row }">
                {{ row.avgSitDuration }} 分钟
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
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
import { useSitStore } from '@/stores/sit'
import type { DailyStats, SitDailyStats } from '@/types'

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
const sitStore = useSitStore()

// Tab 状态
const activeTab = ref<'water' | 'activity'>('water')

// 时间范围
const waterTimeRange = ref<'week' | 'month'>('week')
const activityTimeRange = ref<'week' | 'month'>('week')

// 统计数据
const waterStatsData = ref<DailyStats[]>([])
const activityStatsData = ref<SitDailyStats[]>([])

// ===== 饮水统计 =====

// 更新饮水图表数据
const updateWaterChart = () => {
  const days = waterTimeRange.value === 'week' ? 7 : 30
  waterStatsData.value = waterStore.getRecentStats(days)
}

// 日均饮水杯数
const waterAvgCups = computed(() => {
  if (waterStatsData.value.length === 0) return 0
  const total = waterStatsData.value.reduce((sum, s) => sum + s.totalCups, 0)
  return total / waterStatsData.value.length
})

// 累计饮水杯数
const waterTotalCups = computed(() => {
  return waterStatsData.value.reduce((sum, s) => sum + s.totalCups, 0)
})

// 达标天数
const waterCompletedDays = computed(() => {
  return waterStatsData.value.filter(s => s.completionRate >= 100).length
})

// 平均完成率
const waterAvgCompletionRate = computed(() => {
  if (waterStatsData.value.length === 0) return 0
  const total = waterStatsData.value.reduce((sum, s) => sum + s.completionRate, 0)
  return total / waterStatsData.value.length
})

// 饮水折线图配置
const waterLineChartOption = computed(() => ({
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
    data: waterStatsData.value.map(s => s.date.slice(5))
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
      data: waterStatsData.value.map(s => s.totalCups),
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
      data: waterStatsData.value.map(s => s.targetCups),
      itemStyle: {
        color: '#67c23a'
      }
    }
  ]
}))

// 饮水饼图配置
const waterPieChartOption = computed(() => {
  const completed = waterStatsData.value.filter(s => s.completionRate >= 100).length
  const partial = waterStatsData.value.filter(s => s.completionRate >= 50 && s.completionRate < 100).length
  const low = waterStatsData.value.filter(s => s.completionRate < 50).length

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

// ===== 活动统计 =====

// 更新活动图表数据
const updateActivityChart = () => {
  const days = activityTimeRange.value === 'week' ? 7 : 30
  activityStatsData.value = sitStore.getRecentStats(days)
}

// 日均久坐时长
const activityAvgSitTime = computed(() => {
  if (activityStatsData.value.length === 0) return 0
  const total = activityStatsData.value.reduce((sum, s) => sum + s.totalSitTime, 0)
  return total / activityStatsData.value.length
})

// 累计休息次数
const activityTotalRestCount = computed(() => {
  return activityStatsData.value.reduce((sum, s) => sum + s.restCount, 0)
})

// 日均休息次数
const activityAvgRestPerDay = computed(() => {
  if (activityStatsData.value.length === 0) return 0
  return activityTotalRestCount.value / activityStatsData.value.length
})

// 平均久坐时长
const activityAvgDuration = computed(() => {
  if (activityStatsData.value.length === 0) return 0
  const total = activityStatsData.value.reduce((sum, s) => sum + s.avgSitDuration, 0)
  return total / activityStatsData.value.length
})

// 活动折线图配置
const activityLineChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['久坐时长', '休息次数']
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
    data: activityStatsData.value.map(s => s.date.slice(5))
  },
  yAxis: [
    {
      type: 'value',
      name: '时长(分钟)',
      position: 'left'
    },
    {
      type: 'value',
      name: '次数',
      position: 'right'
    }
  ],
  series: [
    {
      name: '久坐时长',
      type: 'line',
      smooth: true,
      yAxisIndex: 0,
      areaStyle: {
        opacity: 0.3
      },
      data: activityStatsData.value.map(s => s.totalSitTime),
      itemStyle: {
        color: '#409eff'
      }
    },
    {
      name: '休息次数',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: activityStatsData.value.map(s => s.restCount),
      itemStyle: {
        color: '#67c23a'
      }
    }
  ]
}))

// 活动饼图配置
const activityPieChartOption = computed(() => {
  // 统计休息完成情况
  const totalDays = activityStatsData.value.length
  const withRest = activityStatsData.value.filter(s => s.restCount > 0).length
  const noRest = totalDays - withRest

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
        name: '休息情况',
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
          { value: withRest, name: '有休息', itemStyle: { color: '#67c23a' } },
          { value: noRest, name: '无休息', itemStyle: { color: '#f56c6c' } }
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
  await sitStore.loadRecords()
  updateWaterChart()
  updateActivityChart()
})
</script>

<style scoped>
.statistics {
  padding: 10px;
}

.stats-tabs {
  margin-bottom: 20px;
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
  color: var(--text-primary);
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
  color: var(--text-primary);
}

.summary-label {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
}

.daily-table {
  margin-bottom: 20px;
}

.daily-table h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}
</style>
