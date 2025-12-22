import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 防止vite清屏，保持tauri输出可见
  clearScreen: false,
  // Tauri开发服务器配置
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },
  // 构建配置
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false
  }
})
