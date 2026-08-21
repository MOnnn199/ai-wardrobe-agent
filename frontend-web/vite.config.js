import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

// ESM 下没有 __dirname，手动锁定为 vite.config.js 所在目录，
// 避免 Bash/Git 环境下 cwd 被解析成 E:\ 导致 root 错误、所有 /src/... 请求找不到文件。
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5175,
    // 同时监听 IPv4(0.0.0.0) + IPv6([::])，localhost / 127.0.0.1 / 局域网 IP 都能访问
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
