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

const reminderStore = useReminderStore()
let unlistenPause: (() => void) | null = null

onMounted(async () => {
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
  background: linear-gradient(180deg, #409eff 0%, #337ecc 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.el-main {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
