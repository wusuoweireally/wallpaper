import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { useUserStore } from "./stores/index";
import { createPinia } from "pinia";

// Import icon collections
import "@iconify/tailwind";

import "./style.css";

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);

  const userStore = useUserStore();

  // 在注册路由前初始化用户状态，确保鉴权状态准确
  await userStore.initializeAuth();

  // 统一处理登录过期事件（由 axios 拦截器触发）
  let handlingAuthExpired = false;
  window.addEventListener("auth-expired", async () => {
    if (handlingAuthExpired) return;
    handlingAuthExpired = true;

    // 清理本地状态并跳转到登录页，携带回跳路径
    await userStore.logout();
    await router.replace({
      name: "Login",
      query: { redirect: router.currentRoute.value.fullPath },
    });

    handlingAuthExpired = false;
  });

  app.use(router);
  app.mount("#app");
}

bootstrap();
