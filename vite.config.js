import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true, // 외부 접속 허용 (0.0.0.0으로 바인딩)
    port: 5173,
  }
})
