import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // 完全移除css配置，或者只保留基本配置
  css: {
    preprocessorOptions: {
      scss: {
        // 如果需要全局变量，先创建文件再取消注释
        // additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  server: {
    port: 5173,
    open: true,
    host: true
  },
  // 支持导入 .py 文件作为原始字符串
  assetsInclude: ['**/*.py']
})