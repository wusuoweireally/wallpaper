<template>
  <div class="wb-card">
    <div class="p-6">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-fg">修改密码</h3>
        <p class="mt-1 text-sm text-muted">定期更换密码，保护账号安全</p>
      </div>

      <!-- 密码输入区域 -->
      <div class="mb-8 grid gap-6 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <label class="block text-sm font-medium text-fg">当前密码</label>
          <div class="relative">
            <input
              :type="showCurrentPassword ? 'text' : 'password'"
              v-model="passwordForm.currentPassword"
              placeholder="请输入当前密码"
              autocomplete="current-password"
              class="wb-input pr-10"
            />
            <button
              type="button"
              @click="showCurrentPassword = !showCurrentPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 transform text-faint hover:text-muted"
            >
              <i :class="showCurrentPassword ? 'i-[mdi--eye-off]' : 'i-[mdi--eye]'"></i>
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-fg"> 新密码 </label>
          <div class="relative">
            <input
              :type="showNewPassword ? 'text' : 'password'"
              v-model="passwordForm.newPassword"
              placeholder="请输入新密码"
              autocomplete="new-password"
              class="wb-input pr-10"
            />
            <button
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 transform text-faint hover:text-muted"
            >
              <i :class="showNewPassword ? 'i-[mdi--eye-off]' : 'i-[mdi--eye]'"></i>
            </button>
          </div>
          <!-- 密码强度指示器 -->
          <div class="mt-3" v-if="passwordForm.newPassword">
            <div class="h-2 overflow-hidden rounded-full bg-inset">
              <div
                class="h-full transition-all duration-300 ease-out"
                :class="passwordStrengthClass"
                :style="{ width: passwordStrengthPercent + '%' }"
              ></div>
            </div>
            <p class="mt-2 text-xs text-faint">
              密码强度：<span :class="passwordStrengthTextClass">{{ passwordStrengthLabel }}</span>
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-fg"> 确认新密码 </label>
          <div class="relative">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="passwordForm.confirmPassword"
              placeholder="请再次输入新密码"
              class="wb-input pr-10"
              :class="{
                'has-error':
                  passwordForm.confirmPassword &&
                  passwordForm.newPassword !== passwordForm.confirmPassword,
              }"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 transform text-faint hover:text-muted"
            >
              <i :class="showConfirmPassword ? 'i-[mdi--eye-off]' : 'i-[mdi--eye]'"></i>
            </button>
          </div>
          <p class="mt-1 text-xs text-faint">
            <span
              v-if="
                passwordForm.confirmPassword &&
                passwordForm.newPassword === passwordForm.confirmPassword
              "
              class="text-success"
            >
              <i class="i-[mdi--check] mr-1"></i>密码匹配
            </span>
            <span
              v-else-if="
                passwordForm.confirmPassword &&
                passwordForm.newPassword !== passwordForm.confirmPassword
              "
              class="text-error"
            >
              <i class="i-[mdi--close] mr-1"></i>密码不匹配
            </span>
          </p>
        </div>
      </div>

      <!-- 密码要求说明 -->
      <div class="mb-8 rounded-xl border border-line bg-subtle p-6">
        <h4 class="mb-4 flex items-center gap-2 font-medium text-fg">
          <i class="i-[mdi--information] text-lg"></i>
          密码要求
        </h4>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="flex items-center gap-2 text-sm text-muted">
            <i
              :class="
                passwordChecks.length
                  ? 'i-[mdi--check-circle] text-success'
                  : 'i-[mdi--circle-outline] text-faint'
              "
            ></i>
            <span>至少 8 个字符</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted">
            <i
              :class="
                passwordChecks.uppercase
                  ? 'i-[mdi--check-circle] text-success'
                  : 'i-[mdi--circle-outline] text-faint'
              "
            ></i>
            <span>包含大写字母</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted">
            <i
              :class="
                passwordChecks.lowercase
                  ? 'i-[mdi--check-circle] text-success'
                  : 'i-[mdi--circle-outline] text-faint'
              "
            ></i>
            <span>包含小写字母</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted">
            <i
              :class="
                passwordChecks.number
                  ? 'i-[mdi--check-circle] text-success'
                  : 'i-[mdi--circle-outline] text-faint'
              "
            ></i>
            <span>包含数字</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted">
            <i
              :class="
                passwordChecks.special
                  ? 'i-[mdi--check-circle] text-success'
                  : 'i-[mdi--circle-outline] text-faint'
              "
            ></i>
            <span>包含特殊字符</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-muted">
            <i
              :class="
                passwordChecks.match
                  ? 'i-[mdi--check-circle] text-success'
                  : 'i-[mdi--circle-outline] text-faint'
              "
            ></i>
            <span>两次输入一致</span>
          </div>
        </div>
      </div>

      <!-- 安全建议 -->
      <div class="mb-8 rounded-xl border border-primary/30 bg-primary/10 p-4">
        <p class="text-sm text-primary">
          <i class="i-[mdi--lightbulb] mr-2 text-primary"></i>
          <strong>安全建议：</strong
          >避免使用生日、姓名等容易被猜到的信息，不要在不同网站重复使用同一密码。
        </p>
      </div>

      <!-- 提示信息 -->
      <div
        v-if="error"
        class="mb-6 flex items-center gap-3 rounded-control border border-error/30 bg-[color:var(--wb-danger-subtle)] p-4"
      >
        <i class="i-[mdi--alert-circle] text-xl text-error"></i>
        <span class="text-error">{{ error }}</span>
      </div>

      <div
        v-if="success"
        class="mb-6 flex items-center gap-3 rounded-control border border-success/30 bg-[color:var(--wb-success-subtle)] p-4"
      >
        <i class="i-[mdi--check-circle] text-xl text-success"></i>
        <span class="text-[color:var(--wb-success)]">{{ success }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end">
        <button
          @click="updatePassword"
          :disabled="loading || !canSubmit"
          class="wb-btn-primary px-6 py-3"
        >
          <i v-if="loading" class="i-[mdi--loading] animate-spin"></i>
          {{ loading ? "保存中…" : "修改密码" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import {
  buildChangePasswordPayload,
  isPasswordLengthValid,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from "@/utils/authPayload"

const userStore = useUserStore()
const router = useRouter()

// 组件是否已经挂载
const isMounted = ref(false)

// 组件挂载时标记
onMounted(() => {
  isMounted.value = true
})

// 组件卸载时清理资源
onUnmounted(() => {
  isMounted.value = false
  loading.value = false
  error.value = ""
  success.value = ""
})

// 密码表单
const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
})

// 密码显示状态
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 状态管理
const loading = ref(false)
const error = ref("")
const success = ref("")

// 密码强度计算
const passwordStrength = computed(() => {
  const value = passwordForm.newPassword
  if (!value) return 0

  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  return score
})

const passwordStrengthPercent = computed(() => (passwordStrength.value / 5) * 100)

const passwordStrengthLabel = computed(() => {
  const score = passwordStrength.value
  if (score <= 2) return "弱"
  if (score === 3) return "中"
  if (score === 4) return "强"
  return "非常强"
})

const passwordStrengthClass = computed(() => {
  const score = passwordStrength.value
  if (score <= 2) return "bg-error"
  if (score === 3) return "bg-warning"
  if (score === 4) return "bg-success"
  return "bg-success"
})

const passwordStrengthTextClass = computed(() => {
  const score = passwordStrength.value
  if (score <= 2) return "text-error"
  if (score === 3) return "text-warning"
  if (score === 4) return "text-success"
  return "text-success"
})

// 密码验证检查项
const passwordChecks = computed(() => {
  const password = passwordForm.newPassword
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === passwordForm.confirmPassword,
  }
})

// 是否可以提交
const canSubmit = computed(() => {
  const checks = passwordChecks.value
  return (
    !!passwordForm.currentPassword &&
    checks.length &&
    checks.uppercase &&
    checks.lowercase &&
    checks.number &&
    checks.match
  )
})

// 验证密码表单
const validatePasswordForm = (): boolean => {
  if (!passwordForm.currentPassword) {
    error.value = "请输入当前密码"
    return false
  }

  if (!passwordForm.newPassword) {
    error.value = "请输入新密码"
    return false
  }

  if (!isPasswordLengthValid(passwordForm.newPassword)) {
    error.value = `新密码长度须为 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位`
    return false
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = "两次输入的密码不一致"
    return false
  }

  return true
}

// 更新密码（对齐 PATCH /users/password）
const updatePassword = async () => {
  if (!isMounted.value) {
    return
  }

  loading.value = true
  error.value = ""
  success.value = ""

  try {
    if (!validatePasswordForm()) {
      if (isMounted.value) {
        loading.value = false
      }
      return
    }

    const payload = buildChangePasswordPayload(
      passwordForm.currentPassword,
      passwordForm.newPassword,
    )
    await userStore.changePassword(payload.currentPassword, payload.newPassword)

    // 改密使所有已签发会话失效（tokenVersion+1）：主动登出引导重登，
    // 避免用户看到"修改成功"后下一个请求被 401 踢到登录页
    userStore.clearUser()
    router.replace({ name: "Login" })
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    if (isMounted.value) {
      error.value = errObj.message || "密码修改失败"
    }
  } finally {
    if (isMounted.value) {
      loading.value = false
    }
  }
}
</script>

<style scoped>
/* 样式已通过 Tailwind CSS 类实现 */
</style>
