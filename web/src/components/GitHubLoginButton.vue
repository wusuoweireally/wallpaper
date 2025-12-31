<template>
  <button
    type="button"
    @click="handleGitHubLogin"
    :disabled="loading"
    class="github-btn group relative w-full overflow-hidden rounded-[1.4rem] border-2 border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition-all duration-300 hover:border-slate-800 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale"
  >
    <!-- 背景装饰 -->
    <span
      class="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
    ></span>

    <!-- 内容 -->
    <span class="relative flex items-center justify-center gap-3">
      <!-- GitHub Logo -->
      <svg
        class="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
        />
      </svg>

      <span class="text-base">{{ loading ? "登录中..." : "使用 GitHub 登录" }}</span>
    </span>

    <!-- 加载动画 -->
    <span
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <svg
        class="h-6 w-6 animate-spin text-slate-800"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </span>
  </button>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()
const loading = ref(false)

/**
 * 处理 GitHub 登录
 * 跳转到后端 OAuth 端点发起 GitHub 授权
 */
const handleGitHubLogin = () => {
  try {
    loading.value = true

    // 保存当前路由，用于登录后重定向
    const currentPath = router.currentRoute.value.fullPath
    if (currentPath !== "/login" && currentPath !== "/register") {
      sessionStorage.setItem("github_login_redirect", currentPath)
    }

    // 跳转到后端 GitHub OAuth 端点
    // 后端会重定向到 GitHub 授权页面
    // 开发环境优先走 /api 代理，生产环境可用绝对地址
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
    const isAbsoluteUrl = Boolean(apiBaseUrl && apiBaseUrl.startsWith("http"))
    const normalizedBaseUrl = apiBaseUrl ? apiBaseUrl.trim().replace(/\/$/, "") : ""
    const resolvedBaseUrl = isAbsoluteUrl
      ? normalizedBaseUrl.replace(/\/api$/, "")
      : normalizedBaseUrl
    const authUrl = resolvedBaseUrl ? `${resolvedBaseUrl}/auth/github` : "/api/auth/github"

    // 验证 URL 有效性
    if (isAbsoluteUrl && resolvedBaseUrl) {
      new URL(resolvedBaseUrl) // 如果无效会抛出异常
    }

    // 执行跳转
    window.location.href = authUrl
  } catch (error) {
    console.error("GitHub 登录 URL 构建失败:", error)
    loading.value = false
    alert("登录服务配置错误，请联系管理员")
  }
}
</script>

<style scoped>
/* 可选：添加额外的过渡效果 */
.github-btn {
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.github-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.github-btn:active {
  transform: translateY(0);
}

/* 移动端优化 */
@media (max-width: 640px) {
  .github-btn {
    padding: 0.875rem 1rem;
  }
}
</style>
