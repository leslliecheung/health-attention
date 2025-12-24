<template>
  <div class="sidebar">
    <div class="logo">
      <el-icon class="logo-icon"><Sunny /></el-icon>
      <span class="logo-text">健康助手</span>
    </div>

    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      :router="true"
      background-color="transparent"
      text-color="#fff"
      active-text-color="#fff"
    >
      <el-menu-item index="/">
        <el-icon><Odometer /></el-icon>
        <span>仪表盘</span>
      </el-menu-item>

      <el-menu-item index="/water">
        <el-icon><Coffee /></el-icon>
        <span>饮水记录</span>
      </el-menu-item>

      <el-menu-item index="/activity">
        <el-icon><Promotion /></el-icon>
        <span>活动记录</span>
      </el-menu-item>

      <el-menu-item index="/statistics">
        <el-icon><DataAnalysis /></el-icon>
        <span>统计分析</span>
      </el-menu-item>

      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <span>设置</span>
      </el-menu-item>
    </el-menu>

    <div class="sidebar-footer">
      <div class="version">v0.2.0</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Sunny, Odometer, Coffee, Promotion, DataAnalysis, Setting } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => route.path)
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  margin-bottom: 20px;
}

.logo-icon {
  font-size: 32px;
  color: #fff;
  margin-right: 10px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.sidebar-menu {
  flex: 1;
  border: none;
}

.sidebar-menu .el-menu-item {
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.sidebar-menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: rgba(255, 255, 255, 0.25) !important;
  font-weight: 600;
}

.sidebar-menu .el-menu-item .el-icon {
  margin-right: 8px;
}

.sidebar-footer {
  padding: 16px;
  text-align: center;
}

.version {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
