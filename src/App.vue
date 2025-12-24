<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <el-container>
        <el-aside width="200px">
          <Sidebar />
        </el-aside>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { listen } from '@tauri-apps/api/event'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import Sidebar from '@/components/Sidebar.vue'
import { useReminderStore } from '@/stores/reminder'
import { useSettingsStore } from '@/stores/settings'

const reminderStore = useReminderStore()
const settingsStore = useSettingsStore()
let unlistenPause: (() => void) | null = null

onMounted(async () => {
  // 加载设置（包括主题）
  await settingsStore.loadSettings()

  // 初始化提醒系统
  await reminderStore.initReminders()

  // 监听托盘暂停/恢复事件
  unlistenPause = await listen('toggle-pause', () => {
    reminderStore.togglePause()
  })
})

onUnmounted(() => {
  // 清理定时器
  reminderStore.clearAllTimers()

  // 取消事件监听
  if (unlistenPause) {
    unlistenPause()
  }
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.el-container {
  height: 100%;
}

.el-aside {
  background: var(--bg-sidebar);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: background 0.3s ease;
}

.el-main {
  background-color: var(--bg-primary);
  padding: 20px;
  overflow-y: auto;
  transition: background-color 0.3s ease;
}
</style>
