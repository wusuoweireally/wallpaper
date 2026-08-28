<template>
  <div class="wb-page flex min-h-screen flex-col">
    <header
      class="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-6 sm:px-0 sm:pt-10"
    >
      <router-link
        to="/"
        class="text-base font-semibold tracking-tight text-fg transition hover:text-muted"
      >
        Wallbay
      </router-link>
      <div class="flex items-center gap-2">
        <ThemeToggle />
        <router-link to="/wallpapers" class="text-sm text-muted transition hover:text-fg">
          去逛逛
        </router-link>
      </div>
    </header>

    <main class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10 sm:px-0">
      <div class="mb-8">
        <h1 class="text-2xl font-semibold tracking-tight text-fg">
          {{ formTitle }}
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-muted">
          {{ formSubtitle }}
        </p>
      </div>

      <div class="mb-6 flex border-b border-line" role="tablist" aria-label="登录或注册">
        <button
          type="button"
          role="tab"
          :aria-selected="isLogin"
          class="auth-tab"
          :class="{ 'auth-tab--active': isLogin }"
          @click="switchForm('login')"
        >
          登录
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="!isLogin"
          class="auth-tab"
          :class="{ 'auth-tab--active': !isLogin }"
          @click="switchForm('register')"
        >
          注册
        </button>
      </div>

      <Transition name="auth-fade" mode="out-in">
        <form v-if="isLogin" key="login" class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-1.5">
            <label for="login-account" class="auth-label">账号</label>
            <input
              id="login-account"
              v-model="loginForm.account"
              type="text"
              class="auth-input"
              :class="{ 'auth-input--error': loginError }"
              placeholder="用户名或邮箱"
              autocomplete="username"
              required
            />
          </div>

          <div class="space-y-1.5">
            <label for="login-password" class="auth-label">密码</label>
            <div class="relative">
              <input
                id="login-password"
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                class="auth-input pr-11"
                :class="{ 'auth-input--error': loginError }"
                placeholder="请输入密码"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center px-3 text-faint hover:text-fg"
                aria-label="切换密码显示"
                @click="showPassword = !showPassword"
              >
                <svg
                  v-if="showPassword"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
                <svg
                  v-else
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div
            v-if="loginError"
            class="wb-alert px-3 py-2.5 text-sm"
            role="alert"
          >
            {{ loginError }}
          </div>

          <button type="submit" class="auth-submit" :disabled="loginLoading">
            <span
              v-if="loginLoading"
              class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            />
            {{ loginLoading ? "登录中…" : "登录" }}
          </button>

          <div class="relative py-2">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-line" />
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-canvas px-3 text-faint">或</span>
            </div>
          </div>

          <GitHubLoginButton v-if="!user" />
        </form>

        <form v-else key="register" class="space-y-4" @submit.prevent="handleRegister">
          <div class="space-y-1.5">
            <label for="register-username" class="auth-label">用户名</label>
            <input
              id="register-username"
              v-model="registerForm.username"
              type="text"
              class="auth-input"
              :class="{ 'auth-input--error': registerErrors.username }"
              placeholder="2–50 个字符"
              autocomplete="username"
              required
              @input="registerErrors.username = ''"
            />
            <p v-if="registerErrors.username" class="text-xs text-error">
              {{ registerErrors.username }}
            </p>
          </div>

          <div class="space-y-1.5">
            <label for="register-email" class="auth-label">
              邮箱
              <span class="font-normal text-faint">（可选）</span>
            </label>
            <input
              id="register-email"
              v-model="registerForm.email"
              type="email"
              class="auth-input"
              :class="{ 'auth-input--error': registerErrors.email }"
              placeholder="用于找回账号"
              autocomplete="email"
              @input="registerErrors.email = ''"
            />
            <p v-if="registerErrors.email" class="text-xs text-error">
              {{ registerErrors.email }}
            </p>
          </div>

          <div class="space-y-1.5">
            <label for="register-password" class="auth-label">密码</label>
            <input
              id="register-password"
              v-model="registerForm.password"
              type="password"
              class="auth-input"
              :class="{ 'auth-input--error': registerErrors.password }"
              :placeholder="`${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} 位`"
              autocomplete="new-password"
              required
              @input="registerErrors.password = ''"
            />
            <p v-if="registerErrors.password" class="text-xs text-error">
              {{ registerErrors.password }}
            </p>
          </div>

          <div class="space-y-1.5">
            <label for="register-confirm" class="auth-label">确认密码</label>
            <input
              id="register-confirm"
              v-model="registerForm.confirmPassword"
              type="password"
              class="auth-input"
              :class="{ 'auth-input--error': registerErrors.confirmPassword }"
              placeholder="再输入一次"
              autocomplete="new-password"
              required
              @input="registerErrors.confirmPassword = ''"
            />
            <p v-if="registerErrors.confirmPassword" class="text-xs text-error">
              {{ registerErrors.confirmPassword }}
            </p>
          </div>

          <label class="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-muted">
            <input
              type="checkbox"
              required
              class="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-line bg-surface text-primary focus:ring-primary/30"
            />
            <span> 已阅读并同意用户协议与隐私政策 </span>
          </label>

          <div
            v-if="registerError"
            class="wb-alert px-3 py-2.5 text-sm"
            role="alert"
          >
            {{ registerError }}
          </div>

          <button type="submit" class="auth-submit" :disabled="registerLoading">
            <span
              v-if="registerLoading"
              class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            />
            {{ registerLoading ? "注册中…" : "创建账号" }}
          </button>
        </form>
      </Transition>
    </main>

    <footer class="mx-auto w-full max-w-md px-5 pb-8 text-center text-xs text-faint sm:px-0">
      © {{ year }} Wallbay
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import GitHubLoginButton from "@/components/GitHubLoginButton.vue"
import ThemeToggle from "@/components/ThemeToggle.vue"
import {
  buildLoginPayload,
  buildRegisterPayload,
  isPasswordLengthValid,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@/utils/authPayload"
import { resolvePostLoginRedirect } from "@/utils/safeRedirect"
import { useGlobalToast } from "@/composables/useToast"

type AuthMode = "login" | "register"

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useGlobalToast()

const user = computed(() => userStore.user)
const year = new Date().getFullYear()

const isLogin = ref(router.currentRoute.value.name === "Login")

const formTitle = computed(() => (isLogin.value ? "登录" : "注册"))
const formSubtitle = computed(() =>
  isLogin.value ? "使用账号密码或 GitHub 继续" : "创建账号后即可收藏与上传壁纸",
)

const switchForm = (mode: AuthMode) => {
  const targetName = mode === "login" ? "Login" : "Register"
  if (router.currentRoute.value.name !== targetName) {
    router.push({ name: targetName })
  }
  isLogin.value = mode === "login"
}

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
  account: "",
  password: "",
})
const loginLoading = ref(false)
const loginError = ref("")
const showPassword = ref(false)

const registerForm = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
})
const registerErrors = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
})
const registerLoading = ref(false)
const registerError = ref("")

const handleLogin = async () => {
  loginError.value = ""
  loginLoading.value = true

  try {
    await userStore.login(buildLoginPayload(loginForm.account, loginForm.password))
    router.replace(resolvePostLoginRedirect(route.query.redirect))
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

  registerErrors.username = ""
  registerErrors.email = ""
  registerErrors.password = ""
  registerErrors.confirmPassword = ""

  if (!registerForm.username.trim()) {
    registerErrors.username = "请输入用户名"
    isValid = false
  } else if (registerForm.username.trim().length < 2) {
    registerErrors.username = "用户名至少2个字符"
    isValid = false
  } else if (registerForm.username.trim().length > 50) {
    registerErrors.username = "用户名不能超过50个字符"
    isValid = false
  } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-]+$/.test(registerForm.username.trim())) {
    registerErrors.username = "用户名只能包含中文、英文、数字、下划线和减号"
    isValid = false
  }

  if (registerForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email.trim())) {
    registerErrors.email = "邮箱格式不正确"
    isValid = false
  }

  if (!registerForm.password) {
    registerErrors.password = "请输入密码"
    isValid = false
  } else if (!isPasswordLengthValid(registerForm.password)) {
    registerErrors.password = `密码长度须为 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位`
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
    const registerData = buildRegisterPayload(
      registerForm.username,
      registerForm.password,
      registerForm.email,
    )

    await userStore.register(registerData)

    toast.success("注册成功，请登录")
    switchForm("login")
    Object.assign(registerForm, {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
  } catch (error: unknown) {
    const err = error as Error & { response?: { data?: { message?: string } }; message?: string }
    console.error("注册失败:", err)
    registerError.value = err.response?.data?.message || err.message || "注册失败，请重试"
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
.auth-tab {
  position: relative;
  margin-bottom: -1px;
  flex: 1;
  border-bottom: 2px solid transparent;
  padding: 0.65rem 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--wb-faint);
  transition: color 0.15s ease;
}

.auth-tab:hover {
  color: var(--wb-fg);
}

.auth-tab--active {
  border-bottom-color: var(--wb-accent);
  color: var(--wb-fg);
}

.auth-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--wb-muted);
}

.auth-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid var(--wb-border);
  background: var(--wb-surface);
  padding: 0.625rem 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--wb-fg);
  outline: none;
}

.auth-input::placeholder {
  color: var(--wb-faint);
}

.auth-input:focus {
  border-color: var(--wb-accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--wb-accent) 20%, transparent);
}

.auth-input--error {
  border-color: var(--wb-danger);
}

.auth-submit {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  background: var(--wb-accent-fill);
  padding: 0.7rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--wb-accent-fg);
}

.auth-submit:hover:not(:disabled) {
  background: var(--wb-accent-fill-hover);
}

.auth-submit:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: opacity 0.15s ease;
}

.auth-fade-enter-from,
.auth-fade-leave-to {
  opacity: 0;
}
</style>
