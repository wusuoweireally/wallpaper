<template>
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm">
    <div class="p-8">
      <!-- 头部区域 -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
            <i class="i-mdi-lock text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-900">修改密码</h3>
            <p class="text-sm text-gray-500 mt-1">定期更换密码，保护账号安全</p>
          </div>
        </div>
        <div class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
          <i class="i-mdi-shield-check mr-1"></i>
          安全保护
        </div>
      </div>

      <!-- 密码输入区域 -->
      <div class="grid gap-6 md:grid-cols-2 mb-8">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            新密码
          </label>
          <div class="relative">
            <input
              :type="showNewPassword ? 'text' : 'password'"
              v-model="passwordForm.newPassword"
              placeholder="请输入新密码"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i :class="showNewPassword ? 'i-mdi-eye-off' : 'i-mdi-eye'"></i>
            </button>
          </div>
          <!-- 密码强度指示器 -->
          <div class="mt-3" v-if="passwordForm.newPassword">
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full transition-all duration-300 ease-out"
                :class="passwordStrengthClass"
                :style="{ width: passwordStrengthPercent + '%' }"
              ></div>
            </div>
            <p class="mt-2 text-xs text-gray-500">
              密码强度：<span :class="passwordStrengthTextClass">{{ passwordStrengthLabel }}</span>
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            确认新密码
          </label>
          <div class="relative">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="passwordForm.confirmPassword"
              placeholder="请再次输入新密码"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              :class="{ 'border-red-500': passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword }"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i :class="showConfirmPassword ? 'i-mdi-eye-off' : 'i-mdi-eye'"></i>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            <span v-if="passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword" class="text-green-600">
              <i class="i-mdi-check mr-1"></i>密码匹配
            </span>
            <span v-else-if="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="text-red-600">
              <i class="i-mdi-close mr-1"></i>密码不匹配
            </span>
          </p>
        </div>
      </div>

      <!-- 密码要求说明 -->
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <h4 class="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <i class="i-mdi-information text-lg"></i>
          密码要求
        </h4>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i :class="passwordChecks.length ? 'i-mdi-check-circle text-green-500' : 'i-mdi-circle-outline text-gray-400'"></i>
            <span>至少 8 个字符</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i :class="passwordChecks.uppercase ? 'i-mdi-check-circle text-green-500' : 'i-mdi-circle-outline text-gray-400'"></i>
            <span>包含大写字母</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i :class="passwordChecks.lowercase ? 'i-mdi-check-circle text-green-500' : 'i-mdi-circle-outline text-gray-400'"></i>
            <span>包含小写字母</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i :class="passwordChecks.number ? 'i-mdi-check-circle text-green-500' : 'i-mdi-circle-outline text-gray-400'"></i>
            <span>包含数字</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i :class="passwordChecks.special ? 'i-mdi-check-circle text-green-500' : 'i-mdi-circle-outline text-gray-400'"></i>
            <span>包含特殊字符</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <i :class="passwordChecks.match ? 'i-mdi-check-circle text-green-500' : 'i-mdi-circle-outline text-gray-400'"></i>
            <span>两次输入一致</span>
          </div>
        </div>
      </div>

      <!-- 安全建议 -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <p class="text-sm text-blue-800">
          <i class="i-mdi-lightbulb text-blue-500 mr-2"></i>
          <strong>安全建议：</strong>避免使用生日、姓名等容易被猜到的信息，不要在不同网站重复使用同一密码。
        </p>
      </div>

      <!-- 提示信息 -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
        <i class="i-mdi-alert-circle text-red-500 text-xl"></i>
        <span class="text-red-800">{{ error }}</span>
      </div>

      <div v-if="success" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
        <i class="i-mdi-check-circle text-green-500 text-xl"></i>
        <span class="text-green-800">{{ success }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end">
        <button
          @click="updatePassword"
          :disabled="loading || !canSubmit"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <i v-if="loading" class="i-mdi-loading animate-spin"></i>
          {{ loading ? "保存中..." : "修改密码" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores'

const userStore = useUserStore()

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
  error.value = ''
  success.value = ''

  // 清理任何可能的 DOM 残留元素
  if (typeof document !== 'undefined') {
    const teleportElements = document.querySelectorAll('[data-teleport]');
    teleportElements.forEach(el => el.remove());

    const modals = document.querySelectorAll('[data-modal-backdrop]');
    modals.forEach(el => el.remove());

    document.body.style.overflow = ''
    document.body.classList.remove('modal-open')
  }
})

// 密码表单
const passwordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

// 密码显示状态
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 状态管理
const loading = ref(false)
const error = ref('')
const success = ref('')

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
  if (score <= 2) return '弱'
  if (score === 3) return '中'
  if (score === 4) return '强'
  return '非常强'
})

const passwordStrengthClass = computed(() => {
  const score = passwordStrength.value
  if (score <= 2) return 'bg-red-500'
  if (score === 3) return 'bg-yellow-500'
  if (score === 4) return 'bg-green-500'
  return 'bg-green-600'
})

const passwordStrengthTextClass = computed(() => {
  const score = passwordStrength.value
  if (score <= 2) return 'text-red-600'
  if (score === 3) return 'text-yellow-600'
  if (score === 4) return 'text-green-600'
  return 'text-green-700'
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
    match: password.length > 0 && password === passwordForm.confirmPassword
  }
})

// 是否可以提交
const canSubmit = computed(() => {
  const checks = passwordChecks.value
  return checks.length && checks.uppercase && checks.lowercase && checks.number && checks.match
})

// 验证密码表单
const validatePasswordForm = (): boolean => {
  // 验证新密码
  if (!passwordForm.newPassword) {
    error.value = '请输入新密码'
    return false
  }

  if (passwordForm.newPassword.length < 8) {
    error.value = '新密码长度至少8位'
    return false
  }

  // 验证确认密码
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return false
  }

  return true
}

// 更新密码
const updatePassword = async () => {
  // 防御性检查，确保组件仍然挂载
  if (!isMounted.value) {
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    // 表单验证
    if (!validatePasswordForm()) {
      if (isMounted.value) {
        loading.value = false
      }
      return
    }

    // 这里需要调用后端的密码更新接口
    // 由于后端目前没有专门的密码更新接口，暂时使用通用的更新接口
    await userStore.updateUserInfo({
      password: passwordForm.newPassword
    })

    if (isMounted.value) {
      success.value = '密码修改成功'

      // 清空密码表单
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''

      // 3秒后清除成功提示
      setTimeout(() => {
        if (isMounted.value) {
          success.value = ''
        }
      }, 3000)
    }
  } catch (err: any) {
    if (isMounted.value) {
      error.value = err.message || '密码修改失败'
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
