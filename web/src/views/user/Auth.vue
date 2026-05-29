<template>
  <div class="auth-shell">
    <div class="auth-frame">
      <div class="auth-card grid md:grid-cols-2">
        <div class="auth-hero">
          <div class="hero-noise"></div>
          <div class="hero-radial hero-radial--top"></div>
          <div class="hero-radial hero-radial--bottom"></div>
          <div class="relative z-10 flex flex-col gap-10">
            <div class="flex items-center gap-4">
              <div class="brand-mark">
                <svg class="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12c0 .64.1 1.26.27 1.85l6.73-6.73L12 2zM21 12c0-.64-.1-1.26-.27-1.85l-6.73 6.73 6.73 6.73c.17-.59.27-1.21.27-1.85zM8.88 2.46L2.15 9.19c.59-.17 1.21-.27 1.85-.27 4.41 0 8 3.59 8 8 0 .64-.1 1.26-.27 1.85l6.73-6.73L8.88 2.46z"
                  />
                  <circle cx="7" cy="17" r="2.5" fill="#FDE68A" />
                  <circle cx="17" cy="7" r="2.5" fill="#7DD3FC" />
                  <circle cx="17" cy="17" r="2.5" fill="#FDBA74" />
                  <circle cx="7" cy="7" r="2.5" fill="#C7D2FE" />
                </svg>
              </div>
              <div>
                <p class="hero-kicker">WALLPAPER ATLAS</p>
                <h1 class="hero-title">随心壁纸</h1>
              </div>
            </div>

            <div class="space-y-4">
              <p class="hero-lead">发现属于你的视觉盛宴</p>
              <p class="hero-sub">
                把灵感、色彩与质感收藏进你的桌面。从今日氛围到创作灵感，一键开启。
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <span class="hero-chip">精选主题</span>
              <span class="hero-chip">每日推荐</span>
              <span class="hero-chip">高清原图</span>
              <span class="hero-chip">自由收藏</span>
            </div>

            <div class="hero-stat">
              <div>
                <p class="hero-stat__label">当前灵感</p>
                <p class="hero-stat__value">81,204</p>
              </div>
              <div class="hero-stat__line"></div>
              <div>
                <p class="hero-stat__label">用户共创</p>
                <p class="hero-stat__value">9,310</p>
              </div>
            </div>
          </div>
        </div>

        <div class="auth-panel">
          <div class="panel-ornament"></div>
          <div class="panel-grain"></div>

          <div class="relative space-y-8 p-6 sm:p-10 md:p-12">
            <div class="flex flex-col gap-2 text-center md:text-left">
              <p class="panel-kicker">WELCOME BACK</p>
              <h2 class="panel-title">{{ formTitle }}</h2>
            </div>

            <div class="tab-shell">
              <span :class="['tab-pill', { 'tab-pill--register': !isLogin }]"></span>
              <button
                type="button"
                class="tab-btn"
                :class="{ 'tab-btn--active': isLogin }"
                :aria-pressed="isLogin"
                @click="switchForm('login')"
              >
                登录
              </button>
              <button
                type="button"
                class="tab-btn"
                :class="{ 'tab-btn--active': !isLogin }"
                :aria-pressed="!isLogin"
                @click="switchForm('register')"
              >
                注册
              </button>
            </div>

            <Transition name="fade-slide" mode="out-in">
              <form v-if="isLogin" key="login" @submit.prevent="handleLogin" class="space-y-5">
                <div class="space-y-3">
                  <label class="text-sm font-semibold text-slate-600">账号</label>
                  <div class="relative">
                    <span class="field-icon">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      v-model="loginForm.id"
                      placeholder="请输入数字账号"
                      class="enhanced-input"
                      :class="{ 'enhanced-input--error': loginError }"
                      required
                    />
                  </div>
                </div>

                <div class="space-y-3">
                  <label class="text-sm font-semibold text-slate-600">密码</label>
                  <div class="relative">
                    <span class="field-icon">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                        />
                      </svg>
                    </span>
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      v-model="loginForm.password"
                      placeholder="请输入密码"
                      class="enhanced-input pr-14"
                      :class="{ 'enhanced-input--error': loginError }"
                      required
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-emerald-600"
                      aria-label="切换密码显示"
                    >
                      <svg
                        v-if="showPassword"
                        class="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zm-2 4.82c.36-.57.6-1.22.6-1.82 0-1.39-1.16-2.58-2.6-2.78l2.01 4.6zm3.6 5.76l-1.07-1.07-7.49 7.49C5.61 20.38 3 17.5 3 14c0-4.28 6.06-8.52 13.47-9.09L21 9.5C16.64 10.06 13 12.88 13 17c0 .91.13 1.79.33 2.63l1.27 1.27z"
                        />
                      </svg>
                      <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M12 5c-7.633 0-11 7-11 7s3.367 7 11 7 11-7 11-7-3.367-7-11-7zm0 12c-3.459 0-6-2.382-6-5.26 0-2.879 2.541-5.26 6-5.26 3.458 0 6 2.381 6 5.26 0 2.878-2.542 5.26-6 5.26z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3">
                  <label class="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                    <input type="checkbox" v-model="rememberMe" class="peer sr-only" />
                    <span class="checkmark">
                      <svg
                        v-if="rememberMe"
                        class="h-3.5 w-3.5 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </span>
                    记住我
                  </label>
                  <a href="#" class="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >忘记密码？</a
                  >
                </div>

                <button
                  type="submit"
                  :class="[
                    'primary-btn',
                    { 'cursor-not-allowed opacity-70 saturate-50': loginLoading },
                  ]"
                  :disabled="loginLoading"
                >
                  <span v-if="!loginLoading" class="flex items-center gap-3">
                    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 2l2.09 6.26L20 9l-5.91 1.74L12 16l-2.09-5.26L4 9l5.91-1.74L12 2z"
                      />
                      <path d="M19 10l-2 6-2-6 2-2 2 2zM7 8l2 6-2-6-2 6-2-6 2-2 2 2z" />
                    </svg>
                    立即登录
                  </span>
                  <span v-else class="flex items-center gap-2">
                    <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
                    登录中...
                  </span>
                </button>

                <!-- 分隔线 -->
                <div class="my-6 flex items-center gap-4">
                  <div class="h-px flex-1 bg-slate-300"></div>
                  <span class="text-sm text-slate-600">或</span>
                  <div class="h-px flex-1 bg-slate-300"></div>
                </div>

                <!-- GitHub 登录按钮 -->
                <GitHubLoginButton v-if="!user" />

                <div class="text-center text-sm text-slate-600">
                  还没有账号？
                  <button
                    type="button"
                    class="font-semibold text-emerald-700 hover:text-emerald-800"
                    @click="switchForm('register')"
                  >
                    立即注册
                  </button>
                </div>

                <div v-if="loginError" class="glass-error" role="alert">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
                    />
                  </svg>
                  <span>{{ loginError }}</span>
                </div>
              </form>

              <form v-else key="register" @submit.prevent="handleRegister" class="space-y-4">
                <div class="space-y-3">
                  <label class="text-sm font-semibold text-slate-600">账号</label>
                  <div class="relative">
                    <span class="field-icon">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      v-model="registerForm.id"
                      @input="registerErrors.id = ''"
                      placeholder="请输入数字账号 (6位以上)"
                      class="enhanced-input"
                      :class="{ 'enhanced-input--error': registerErrors.id }"
                      required
                    />
                  </div>
                  <p v-if="registerErrors.id" class="text-sm text-rose-500">
                    {{ registerErrors.id }}
                  </p>
                </div>

                <div class="space-y-3">
                  <label class="text-sm font-semibold text-slate-600">用户名</label>
                  <div class="relative">
                    <span class="field-icon">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M12 12c2.7 0 4.93-2.2 4.93-4.9 0-2.7-2.22-4.88-4.93-4.88S7.07 4.4 7.07 7.1C7.07 9.8 9.3 12 12 12zm0 2c-3.42 0-10.2 1.72-10.2 5.15V22h20.4v-2.85C22.2 15.72 15.42 14 12 14z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      v-model="registerForm.username"
                      @input="registerErrors.username = ''"
                      placeholder="请输入用户名"
                      class="enhanced-input"
                      :class="{ 'enhanced-input--error': registerErrors.username }"
                      required
                    />
                  </div>
                  <p v-if="registerErrors.username" class="text-sm text-rose-500">
                    {{ registerErrors.username }}
                  </p>
                </div>

                <div class="space-y-3">
                  <label class="text-sm font-semibold text-slate-600">设置密码</label>
                  <div class="relative">
                    <span class="field-icon">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                        />
                      </svg>
                    </span>
                    <input
                      type="password"
                      v-model="registerForm.password"
                      @input="registerErrors.password = ''"
                      placeholder="输入6-20位密码"
                      class="enhanced-input"
                      :class="{ 'enhanced-input--error': registerErrors.password }"
                      required
                    />
                  </div>
                  <p v-if="registerErrors.password" class="text-sm text-rose-500">
                    {{ registerErrors.password }}
                  </p>
                </div>

                <div class="space-y-3">
                  <label class="text-sm font-semibold text-slate-600">确认密码</label>
                  <div class="relative">
                    <span class="field-icon">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                        />
                      </svg>
                    </span>
                    <input
                      type="password"
                      v-model="registerForm.confirmPassword"
                      @input="registerErrors.confirmPassword = ''"
                      placeholder="再次确认密码"
                      class="enhanced-input"
                      :class="{ 'enhanced-input--error': registerErrors.confirmPassword }"
                      required
                    />
                  </div>
                  <p v-if="registerErrors.confirmPassword" class="text-sm text-rose-500">
                    {{ registerErrors.confirmPassword }}
                  </p>
                  <p
                    v-else-if="
                      registerForm.confirmPassword &&
                      registerForm.password === registerForm.confirmPassword
                    "
                    class="text-sm text-emerald-600"
                  >
                    密码匹配成功
                  </p>
                </div>

                <div class="policy-card">
                  <input type="checkbox" class="checkbox checkbox-primary mt-1" required />
                  <p>
                    我已阅读并同意
                    <a href="#" class="font-semibold text-emerald-700 hover:text-emerald-800"
                      >《用户协议》</a
                    >
                    和
                    <a href="#" class="font-semibold text-emerald-700 hover:text-emerald-800"
                      >《隐私政策》</a
                    >
                  </p>
                </div>

                <button
                  type="submit"
                  :class="[
                    'primary-btn',
                    { 'cursor-not-allowed opacity-70 saturate-50': registerLoading },
                  ]"
                  :disabled="registerLoading"
                >
                  <span v-if="!registerLoading" class="flex items-center gap-3">
                    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M5 13l1.5-3L10 8l-1.5-3L13 8l3.5 2 1.5 3L13 16l-1.5 3-3.5-2-3.5 2-1.5-3 4.5-2L5 13z"
                      />
                    </svg>
                    立即注册
                  </span>
                  <span v-else class="flex items-center gap-2">
                    <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
                    注册中...
                  </span>
                </button>

                <div class="text-center text-sm text-slate-600">
                  已有账号？
                  <button
                    type="button"
                    class="font-semibold text-emerald-700 hover:text-emerald-800"
                    @click="switchForm('login')"
                  >
                    立即登录
                  </button>
                </div>

                <div v-if="registerError" class="glass-error" role="alert">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
                    />
                  </svg>
                  <span>{{ registerError }}</span>
                </div>
              </form>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore, type RegisterDto } from "@/stores/user"
import GitHubLoginButton from "@/components/GitHubLoginButton.vue"

type AuthMode = "login" | "register"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const user = computed(() => userStore.user)

const isLogin = ref(router.currentRoute.value.name === "Login")

const formTitle = computed(() => (isLogin.value ? "欢迎回来" : "你好，新朋友"))

const switchForm = (mode: AuthMode) => {
  const targetName = mode === "login" ? "Login" : "Register"
  if (router.currentRoute.value.name !== targetName) {
    router.push({ name: targetName })
  }
  isLogin.value = mode === "login"
}

// 使用 watch 替代 router.afterEach：自动在组件卸载时清理，无需手动管理
const stopRouteWatch = watch(
  () => route.name,
  (name) => {
    if (name === "Login" || name === "Register") {
      isLogin.value = name === "Login"
      loginError.value = ""
      registerError.value = ""
    }
  },
)
onBeforeUnmount(() => {
  stopRouteWatch()
})

const loginForm = reactive({
  id: "",
  password: "",
})
const loginLoading = ref(false)
const loginError = ref("")
const rememberMe = ref(false)
const showPassword = ref(false)

const registerForm = reactive({
  id: undefined as number | undefined,
  username: "",
  password: "",
  confirmPassword: "",
})
const registerErrors = reactive({
  id: "",
  username: "",
  password: "",
  confirmPassword: "",
})
const registerLoading = ref(false)
const registerError = ref("")

const handleLogin = async () => {
  loginError.value = ""
  loginLoading.value = true

  try {
    await userStore.login({
      ...loginForm,
      id: Number(loginForm.id),
    })
    const redirectParam = route.query.redirect
    const redirectPath =
      typeof redirectParam === "string" && redirectParam.startsWith("/") ? redirectParam : "/"
    router.replace(redirectPath)
  } catch (error: unknown) {
    const err = error as Error & { message?: string }
    console.error("登录失败:", err)
    loginError.value = err.message || "登录失败，请重试"
  } finally {
    loginLoading.value = false
  }
}

const validateRegister = (): boolean => {
  let isValid = true

  registerErrors.id = ""
  registerErrors.username = ""
  registerErrors.password = ""
  registerErrors.confirmPassword = ""

  if (!registerForm.id) {
    registerErrors.id = "请输入账号"
    isValid = false
  } else if (registerForm.id.toString().length < 6) {
    registerErrors.id = "账号长度至少6位"
    isValid = false
  }

  if (!registerForm.username.trim()) {
    registerErrors.username = "请输入用户名"
    isValid = false
  } else if (registerForm.username.trim().length < 2) {
    registerErrors.username = "用户名至少2个字符"
    isValid = false
  } else if (registerForm.username.trim().length > 20) {
    registerErrors.username = "用户名不能超过20个字符"
    isValid = false
  } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-]+$/.test(registerForm.username.trim())) {
    registerErrors.username = "用户名只能包含中文、英文、数字、下划线和减号"
    isValid = false
  }

  if (!registerForm.password) {
    registerErrors.password = "请输入密码"
    isValid = false
  } else if (registerForm.password.length < 6) {
    registerErrors.password = "密码至少6位"
    isValid = false
  } else if (registerForm.password.length > 20) {
    registerErrors.password = "密码不能超过20位"
    isValid = false
  }

  if (!registerForm.confirmPassword) {
    registerErrors.confirmPassword = "请确认密码"
    isValid = false
  } else if (registerForm.password !== registerForm.confirmPassword) {
    registerErrors.confirmPassword = "两次输入的密码不一致"
    isValid = false
  }

  return isValid
}

const handleRegister = async () => {
  if (!validateRegister()) return

  registerError.value = ""
  registerLoading.value = true

  try {
    const registerData: RegisterDto = {
      id: Number(registerForm.id),
      username: registerForm.username.trim(),
      password: registerForm.password,
    }

    await userStore.register(registerData)

    switchForm("login")
    Object.assign(registerForm, {
      id: undefined,
      username: "",
      password: "",
      confirmPassword: "",
    })
  } catch (error: unknown) {
    const err = error as Error & { response?: { data?: { message?: string } } }
    console.error("注册失败:", err)
    registerError.value = err.response?.data?.message || "注册失败，请重试"
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap");

.auth-shell {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 20%, rgba(251, 191, 36, 0.18), transparent 55%),
    radial-gradient(circle at 88% 80%, rgba(13, 148, 136, 0.2), transparent 60%),
    linear-gradient(135deg, #fdf6ed, #f7f1e8 55%, #f4efe7);
  font-family: "Manrope", "Noto Sans SC", sans-serif;
  color: #0f172a;
}

.auth-shell::before,
.auth-shell::after {
  content: "";
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 42% 58% 62% 38%;
  filter: blur(0px);
  opacity: 0.16;
  z-index: 0;
}

.auth-shell::before {
  top: -110px;
  left: -60px;
  background: linear-gradient(130deg, #fbbf24, #fb7185);
}

.auth-shell::after {
  bottom: -120px;
  right: -80px;
  background: linear-gradient(140deg, #14b8a6, #0ea5e9);
}

.auth-frame {
  width: 100%;
  max-width: 80rem;
  position: relative;
  z-index: 1;
}

.auth-card {
  border-radius: 32px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 40px 80px rgba(15, 23, 42, 0.12),
    0 12px 30px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(28px);
}

.auth-hero {
  position: relative;
  padding: 3.5rem 3rem;
  color: #fff7ed;
  background:
    linear-gradient(140deg, #0f766e, #14b8a6 45%, #f59e0b 100%),
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.2), transparent 40%);
  display: flex;
  align-items: center;
}

.hero-noise {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: 0.22;
  mix-blend-mode: screen;
}

.hero-radial {
  position: absolute;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.7;
}

.hero-radial--top {
  top: -80px;
  right: 30px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.55), transparent 60%);
}

.hero-radial--bottom {
  bottom: -90px;
  left: 40px;
  background: radial-gradient(circle, rgba(253, 230, 138, 0.9), transparent 60%);
}

.brand-mark {
  width: 62px;
  height: 62px;
  border-radius: 20px;
  display: grid;
  place-items: center;
  background: rgba(15, 118, 110, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.3);
}

.hero-kicker {
  font-size: 0.72rem;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.hero-title {
  font-family: "Fraunces", "Noto Serif SC", serif;
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.hero-lead {
  font-family: "Fraunces", "Noto Serif SC", serif;
  font-size: 2.1rem;
  font-weight: 600;
  line-height: 1.2;
}

.hero-sub {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.86);
  max-width: 420px;
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.12);
  font-size: 0.85rem;
  font-weight: 600;
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.1rem 1.4rem;
  border-radius: 20px;
  background: rgba(15, 118, 110, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.hero-stat__label {
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

.hero-stat__value {
  font-size: 1.5rem;
  font-weight: 700;
}

.hero-stat__line {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.4);
}

.auth-panel {
  position: relative;
  background: #fdf6ef;
  color: #0f172a;
}

.panel-ornament {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, rgba(253, 186, 116, 0.25), transparent 35%),
    linear-gradient(220deg, rgba(14, 165, 233, 0.18), transparent 45%);
  opacity: 0.8;
}

.panel-grain {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(15, 23, 42, 0.08) 0.6px, transparent 0.6px);
  background-size: 3px 3px;
  opacity: 0.25;
}

.panel-kicker {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(15, 118, 110, 0.75);
}

.panel-title {
  font-family: "Fraunces", "Noto Serif SC", serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: #0f172a;
}

.tab-shell {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 0.3rem;
}

.tab-pill {
  position: absolute;
  inset: 0.25rem;
  width: calc(50% - 0.25rem);
  height: calc(100% - 0.5rem);
  border-radius: 9999px;
  background: linear-gradient(120deg, #10b981, #f59e0b);
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.2);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-pill--register {
  transform: translateX(100%);
}

.tab-btn {
  flex: 1;
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  padding: 0.8rem 0;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #94a3b8;
  transition: color 0.3s ease;
}

.tab-btn--active {
  color: #0f172a;
}

.field-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.06);
  color: #0f766e;
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
}

.enhanced-input {
  width: 100%;
  height: 3.5rem;
  border-radius: 1.4rem;
  border: 2px solid rgba(148, 163, 184, 0.25);
  background: rgba(255, 255, 255, 0.8);
  padding: 0 1.5rem 0 4.5rem;
  color: #0f172a;
  font-weight: 500;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    background 0.3s ease;
}

.enhanced-input:focus {
  border-color: rgba(16, 185, 129, 0.6);
  box-shadow: 0 18px 30px -20px rgba(15, 23, 42, 0.4);
  outline: none;
  background: #fffdf8;
}

.enhanced-input--error {
  border-color: #f87171;
}

.checkmark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.45rem;
  border: 2px solid rgba(148, 163, 184, 0.45);
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.9);
}

.peer:checked + .checkmark {
  border-color: transparent;
  background: linear-gradient(120deg, #10b981, #f59e0b);
}

.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  border-radius: 1.4rem;
  padding: 1rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(120deg, #0f766e, #f59e0b);
  box-shadow: 0 25px 45px rgba(15, 23, 42, 0.22);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 30px 50px rgba(15, 23, 42, 0.28);
}

.policy-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 1rem 1.25rem;
  font-size: 0.9rem;
  color: #475569;
}

.glass-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(248, 113, 113, 0.3);
  background: rgba(254, 226, 226, 0.75);
  padding: 0.75rem 1rem;
  color: #b91c1c;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.35s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 768px) {
  .auth-hero {
    padding: 2.5rem 2rem;
  }

  .hero-title {
    font-size: 2.1rem;
  }

  .hero-lead {
    font-size: 1.6rem;
  }
}
</style>
