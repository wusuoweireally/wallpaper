import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import { useUserStore } from "./stores/user"
import { createPinia } from "pinia"
import { applyTheme, resolveInitialTheme, watchSystemTheme } from "./utils/theme"
import { installErrorReporting } from "./utils/errorReporting"

import "./style.css"

async function bootstrap() {
  const initialTheme = resolveInitialTheme()
  applyTheme(initialTheme)
  // 未手动选择过主题时跟随系统深浅色变化
  watchSystemTheme()

  const app = createApp(App)
  const pinia = createPinia()

  // 全局错误上报（工具内部仅生产构建生效），尽早安装以覆盖启动期错误
  installErrorReporting(app)

  app.use(pinia)

  const userStore = useUserStore()

  // 同步恢复本地登录态（路由守卫立即可用），服务端校验放后台进行，避免阻塞首屏渲染
  userStore.restoreFromStorage()
  void userStore.initializeAuth()

  // 统一处理登录过期事件（由 axios 拦截器触发）
  let handlingAuthExpired = false
  window.addEventListener("auth-expired", async () => {
    if (handlingAuthExpired) return
    handlingAuthExpired = true

    // 清理本地状态并跳转到登录页，携带回跳路径
    await userStore.logout()
    await router.replace({
      name: "Login",
      query: { redirect: router.currentRoute.value.fullPath },
    })

    handlingAuthExpired = false
  })

  // Esc 关闭 wb-drop 下拉：focus-within 方案靠失焦收起，键盘用户需要手动释放焦点
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return
    const el = document.activeElement as HTMLElement | null
    if (el?.closest(".wb-drop")) el.blur()
  })

  app.use(router)
  app.mount("#app")
}

bootstrap()
