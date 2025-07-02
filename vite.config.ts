import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path'

const pathResolve = (dir: string): any => {
  return resolve(__dirname, ".", dir)
}

const alias: Record<string, string> = {
  '@': pathResolve("src")
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // 自动更新
      manifest: {
        name: 'WBU',
        short_name: 'WBU',
        theme_color: '#01040e',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/desktopLogo192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/desktopLogo512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        skipWaiting: true, // 跳过等待，立即激活新 Service Worker
        clientsClaim: true, // 控制所有客户端
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MiB
      },
    }),
  ],
  css: {
    // CSS 预处理器
    preprocessorOptions: {
      // 定义全局 SCSS 变量
      scss: {
        javascriptEnabled: true,
        additionalData: "@use '/src/styles/variables.scss' as *;",
      },
    },
  },
  resolve: {
    alias
  }
})
