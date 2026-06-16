import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0', // 或者写 true，效果一样：监听所有网卡，允许局域网 IP 访问
    port: 5173,      // 可选，指定端口
  },
})
