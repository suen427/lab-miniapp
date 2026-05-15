import { createPinia } from 'pinia'
import { createSSRApp } from 'vue'
import App from './App.vue'
import 'uno.css'

export function createApp() {
  const app = createSSRApp(App)
  // 安装 Pinia 状态管理插件
  const pinia = createPinia()
  app.use(pinia)
  return {
    app,
    pinia,
  }
}
