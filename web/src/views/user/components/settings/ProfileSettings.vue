<template>
  <div class="wb-card">
    <div class="p-6">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-fg">个人信息</h3>
        <p class="mt-1 text-sm text-muted">头像与简介会展示在公开主页</p>
      </div>

      <div class="grid gap-8 lg:grid-cols-3">
        <!-- 头像上传区域 -->
        <div class="lg:col-span-1">
          <div class="flex flex-col items-center">
            <div class="group relative">
              <div class="h-28 w-28 overflow-hidden rounded-full ring-1 ring-line">
                <img
                  v-if="userStore.user || avatarPreview"
                  :src="avatarPreview || userStore.userAvatar"
                  :alt="userStore.user?.username || '用户头像'"
                  class="h-full w-full object-cover"
                  @error="handleImageError"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-gradient-to-br from-subtle to-inset"
                >
                  <i class="i-[mdi--account] text-4xl text-faint"></i>
                </div>
              </div>
              <!-- 头像上传按钮 -->
              <label
                class="absolute inset-0 flex h-28 w-28 cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100"
              >
                <i class="i-[mdi--camera] text-3xl text-white"></i>
                <input type="file" accept="image/*" @change="handleAvatarChange" class="hidden" />
              </label>
            </div>

            <div class="mt-5 text-center">
              <h4 class="text-sm font-medium text-fg">个人头像</h4>
              <p class="mt-1 text-xs text-muted">JPG / PNG / WebP，建议 256×256</p>
            </div>

            <label class="wb-btn mt-4">
              <i class="i-[mdi--upload] mr-2"></i>
              选择图片
              <input type="file" accept="image/*" @change="handleAvatarChange" class="hidden" />
            </label>
          </div>
        </div>

        <!-- 信息编辑区域 -->
        <div class="space-y-6 lg:col-span-2">
          <!-- 用户名 -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-fg">用户名</label>
            <input
              type="text"
              v-model="profileForm.username"
              placeholder="请输入用户名"
              class="wb-input"
            />
            <p class="text-xs text-faint">展示在个人主页</p>
          </div>

          <!-- 邮箱 -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-fg">邮箱地址</label>
            <input
              type="email"
              v-model="profileForm.email"
              placeholder="请输入邮箱地址（可选）"
              class="wb-input"
            />
            <p class="text-xs text-faint">用于接收安全通知</p>
          </div>

          <!-- 个人简介 -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-fg">个人简介</label>
            <div class="relative">
              <textarea
                v-model="profileForm.bio"
                placeholder="简单介绍一下自己"
                class="wb-input resize-none"
                rows="4"
                maxlength="500"
              ></textarea>
              <div class="absolute bottom-2 right-2 text-xs text-faint">
                {{ profileForm.bio?.length || 0 }}/500
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 上传状态提示 -->
      <div
        v-if="loading && avatarFile"
        class="mt-6 flex items-center gap-3 rounded-card border border-primary/20 bg-[color:var(--wb-accent-subtle)] p-3"
      >
        <div class="relative">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary/30"></div>
          <div
            class="absolute left-0 top-0 h-5 w-5 animate-spin rounded-full border-2 border-b-transparent border-l-transparent border-r-transparent border-t-primary"
          ></div>
        </div>
        <span class="text-sm text-primary">正在上传头像…</span>
      </div>

      <!-- 错误提示 -->
      <div
        v-if="error"
        class="wb-alert mt-6 flex items-center gap-3 p-3"
      >
        <span class="text-sm text-[color:var(--wb-danger)]">{{ error }}</span>
      </div>

      <!-- 成功提示 -->
      <div
        v-if="success"
        class="border-[color:var(--wb-success)]/30 mt-6 flex items-center gap-3 rounded-card border bg-[color:var(--wb-success-subtle)] p-3"
      >
        <span class="text-sm text-[color:var(--wb-success)]">{{ success }}</span>
      </div>

      <!-- 操作区域 -->
      <div class="mt-6 flex items-center justify-end border-t border-line pt-4">
        <button @click="updateProfile" :disabled="loading || !hasChanges" class="wb-btn-primary">
          <i v-if="loading" class="i-[mdi--loading] animate-spin"></i>
          {{ loading ? "保存中…" : "保存修改" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from "vue"
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()

// 个人信息表单
const profileForm = reactive({
  username: "",
  email: "",
  bio: "",
})

// 头像相关状态
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)

// 状态管理
const loading = ref(false)
const error = ref("")
const success = ref("")

// 组件是否已经挂载
const isMounted = ref(false)

// 初始化表单数据
onMounted(async () => {
  // 等待下一个tick确保组件完全挂载
  await nextTick()

  // 标记组件已挂载
  isMounted.value = true

  if (userStore.user) {
    profileForm.username = userStore.user.username || ""
    profileForm.email = userStore.user.email || ""
    profileForm.bio = userStore.user.bio || ""
  } else {
    // 如果用户不存在，尝试从存储中恢复
    const restoredUser = userStore.restoreFromStorage()
    // 恢复后再次检查
    if (restoredUser) {
      profileForm.username = restoredUser.username || ""
      profileForm.email = restoredUser.email || ""
      profileForm.bio = restoredUser.bio || ""
    }
  }
})

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement

  // 防御性检查，确保 img 元素仍然存在
  if (!img || !img.parentNode) {
    return
  }

  // 设置默认头像
  img.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCAzMkM1MS44IDMyIDQyIDQxLjggNDIgNTRDNDIgNjIuMiA1MS44IDcyIDY0IDcyQzc2LjIgNzIgODYgNjIuMiA4NiA1MEM4NiA0MS44IDc2LjIgMzIgNjQgMzJaIiBmaWxsPSIjRDdEQURBIi8+CjxwYXRoIGQ9Ik0yNCA5NkMyNCA4NC42IDM0LjYgNzQgNDggNzRIMzJDMzUuOCA3NCAzOS44IDc1LjYgNDMgNzguNEMzMy4yIDg0LjYgMjQgOTAuMiAyNCA5OFoiIGZpbGw9IiNEODlERUIiLz4KPC9zdmc+"
}

// 头像选择处理
const handleAvatarChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (file) {
    // 验证文件类型和大小
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      error.value = "请选择有效的图片文件 (JPEG, PNG, GIF, WebP)"
      input.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      error.value = "图片大小不能超过 5MB"
      input.value = ""
      return
    }

    avatarFile.value = file
    error.value = ""

    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // 自动上传头像
    uploadAvatar(file)
  }
}

// 头像上传：走 userStore（axios 实例统一超时/401/错误提示），不再裸 fetch 绕过拦截器
const uploadAvatar = async (file: File) => {
  loading.value = true
  error.value = ""
  success.value = ""

  try {
    await userStore.uploadAvatar(file)

    success.value = "头像更新成功"

    // 3秒后清除成功提示
    setTimeout(() => {
      success.value = ""
    }, 3000)

    // 清除预览和文件引用
    avatarFile.value = null
    avatarPreview.value = null
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    error.value = errObj.message || "头像上传失败"
  } finally {
    loading.value = false
  }
}

// 表单验证
const validateProfileForm = (): boolean => {
  // 验证邮箱格式
  if (profileForm.email && !validateEmail(profileForm.email)) {
    error.value = "请输入有效的邮箱地址"
    return false
  }

  return true
}

// 验证邮箱格式
const validateEmail = (email: string) => {
  if (!email) return true // 邮箱为空时跳过验证
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// 检查是否有需要更新的字段
const hasChanges = computed(() => {
  if (!userStore.user) return false

  return (
    profileForm.username !== userStore.user.username ||
    profileForm.email !== userStore.user.email ||
    profileForm.bio !== userStore.user.bio ||
    !!avatarFile.value
  )
})

// 更新个人信息
const updateProfile = async () => {
  loading.value = true
  error.value = ""
  success.value = ""

  try {
    // 表单验证
    if (!validateProfileForm()) {
      loading.value = false
      return
    }

    // 检查是否有更改
    if (!hasChanges.value) {
      success.value = "没有需要更新的信息"
      loading.value = false
      // 3秒后清除成功提示
      setTimeout(() => {
        success.value = ""
      }, 3000)
      return
    }

    const updateData: Partial<{ username: string; email: string; bio: string }> = {}

    if (profileForm.username !== userStore.user?.username) {
      updateData.username = profileForm.username
    }

    // 邮箱可以为空字符串，允许更新为空
    if (profileForm.email !== userStore.user?.email) {
      updateData.email = profileForm.email // 保留原始值，包括空字符串
    }

    if (profileForm.bio !== userStore.user?.bio) {
      updateData.bio = profileForm.bio
    }

    // 更新用户信息
    await userStore.updateUserInfo(updateData)

    success.value = "个人信息更新成功"

    // 3秒后清除成功提示
    setTimeout(() => {
      success.value = ""
    }, 3000)
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    error.value = errObj.message || "更新失败"
  } finally {
    loading.value = false
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  // 标记组件已卸载
  isMounted.value = false

  // 清理可能的内存泄漏
  avatarFile.value = null
  avatarPreview.value = null
  error.value = ""
  success.value = ""
})
</script>

<style scoped>
/* 样式已通过 Tailwind CSS 类实现 */
</style>
