<template>
  <div class="wb-page flex min-h-screen items-center justify-center px-4">
    <div class="wb-card w-full max-w-sm p-8 text-center">
      <div v-if="status === 'loading'">
        <span class="wb-spinner wb-spinner-lg text-primary"></span>
        <h1 class="mt-4 text-lg font-semibold text-fg">正在完成 GitHub 登录</h1>
        <p class="mt-2 text-sm text-muted">请稍候，正在验证身份</p>
      </div>

      <div v-else-if="status === 'success'">
        <h1 class="text-lg font-semibold text-fg">登录成功</h1>
        <p class="mt-2 text-sm text-muted">欢迎回来，{{ user?.username }}</p>
        <p class="mt-1 text-sm text-faint">{{ countdown }} 秒后自动跳转</p>
        <button type="button" class="wb-btn-primary mt-5" @click="handleNavigate">立即跳转</button>
      </div>

      <div v-else>
        <h1 class="text-lg font-semibold text-fg">登录失败</h1>
        <p class="mt-2 text-sm text-muted">{{ errorMessage || "GitHub 登录过程中出现错误" }}</p>
        <button type="button" class="wb-btn mt-5" @click="handleRetry">返回登录页</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import { sanitizeStoredRedirect } from "@/utils/safeRedirect"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

type CallbackStatus = "loading" | "success" | "error"
const status = ref<CallbackStatus>("loading")
const errorMessage = ref("")
const countdown = ref(3)
let countdownTimer: number | null = null

const user = computed(() => userStore.user)

const handleNavigate = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }

  const redirectPath = sanitizeStoredRedirect(
    sessionStorage.getItem("github_login_redirect") || sessionStorage.getItem("redirect"),
  )

  sessionStorage.removeItem("github_login_redirect")
  sessionStorage.removeItem("redirect")
  router.replace(redirectPath)
}

const handleRetry = () => {
  router.replace({ name: "Login" })
}

const initializeAuth = async () => {
  try {
    await userStore.fetchCurrentUser()

    if (user.value) {
      status.value = "success"
      countdownTimer = window.setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          handleNavigate()
        }
      }, 1000)
    } else {
      status.value = "error"
      errorMessage.value = "未能获取登录信息，请重试"
    }
  } catch (error: unknown) {
    const err = error as Error & { message?: string }
    console.error("GitHub 登录验证失败:", err)
    status.value = "error"
    errorMessage.value = err.message || "登录验证失败"
  }
}

onMounted(async () => {
  const error = route.query.error as string | undefined
  if (error) {
    status.value = "error"
    errorMessage.value = decodeURIComponent(error)
    return
  }
  await initializeAuth()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>
