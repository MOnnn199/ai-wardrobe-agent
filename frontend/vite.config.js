// uni-app (Vue3 + Vite) 配置
// H5 开发服务器将 /api 代理到后端 http://localhost:8000。
// 说明：uni-app H5 的 dev server 默认把 /api 代理到 localhost:8000，
// 这里保留该配置（实际代理目标由 uni 内部默认行为决定）。
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
