import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    devSourcemap: true
  },
  server: {
    port: 5173,
    strictPort: true,   // 이 포트가 이미 사용 중이면 실패(자동 증가 금지)
    host: true          // 네트워크 접근 필요시
  }
})
