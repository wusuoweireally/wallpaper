<template>
  <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
    <div class="p-8">
      <!-- 头部区域 -->
      <div class="mb-8 flex items-center gap-4">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30"
        >
          <i class="icon-[mdi--account] text-2xl text-white"></i>
        </div>
        <div>
          <h3 class="text-2xl font-bold text-slate-900">个人信息</h3>
          <p class="mt-1 text-sm text-slate-500">完善个人资料，让其他用户更好地了解你</p>
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-3">
        <!-- 头像上传区域 -->
        <div class="lg:col-span-1">
          <div class="flex flex-col items-center">
            <div class="group relative">
              <div
                class="h-36 w-36 overflow-hidden rounded-full border-4 border-white shadow-xl shadow-purple-500/20"
              >
                <img
                  v-if="userStore.user || avatarPreview"
                  :src="avatarPreview || userStore.userAvatar"
                  :alt="userStore.user?.username || '用户头像'"
                  class="h-full w-full object-cover"
                  @error="handleImageError"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200"
                >
                  <i class="icon-[mdi--account] text-4xl text-slate-400"></i>
                </div>
              </div>
              <!-- 头像上传按钮 -->
              <label
                class="absolute inset-0 flex h-36 w-36 cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100"
              >
                <i class="icon-[mdi--camera] text-3xl text-white"></i>
                <input type="file" accept="image/*" @change="handleAvatarChange" class="hidden" />
              </label>
            </div>

            <div class="mt-5 text-center">
              <h4 class="text-lg font-semibold text-slate-900">个人头像</h4>
              <p class="mt-2 text-sm text-slate-500">JPG, PNG, WebP 格式</p>
              <p class="text-xs text-slate-400">建议 256×256 像素</p>
            </div>

            <label
              class="mt-5 cursor-pointer rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-purple-300 hover:bg-purple-50"
            >
              <i class="icon-[mdi--upload] mr-2"></i>
              选择图片
              <input type="file" accept="image/*" @change="handleAvatarChange" class="hidden" />
            </label>
          </div>
        </div>

        <!-- 信息编辑区域 -->
        <div class="space-y-6 lg:col-span-2">
          <!-- 用户名 -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-slate-700"> 用户名 </label>
            <input
              type="text"
              v-model="profileForm.username"
              placeholder="请输入用户名"
              class="w-full rounded-xl border-2 border-slate-200 px-4 py-3 transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
            />
            <p class="text-xs text-slate-500">用于展示在个人主页中，建议使用独特易记的名称</p>
          </div>

          <!-- 邮箱 -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-slate-700"> 邮箱地址 </label>
            <input
              type="email"
              v-model="profileForm.email"
              placeholder="请输入邮箱地址（可选）"
              class="w-full rounded-xl border-2 border-slate-200 px-4 py-3 transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
            />
            <p class="text-xs text-slate-500">用于接收安全通知，若不填写将无法找回密码</p>
          </div>

          <!-- 个人简介 -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-slate-700"> 个人简介 </label>
            <div class="relative">
              <textarea
                v-model="profileForm.bio"
                placeholder="简单介绍一下自己，分享你的创作灵感和兴趣..."
                class="w-full resize-none rounded-xl border-2 border-slate-200 px-4 py-3 transition-all focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                rows="4"
                maxlength="500"
              ></textarea>
              <div class="absolute bottom-3 right-3 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">
                {{ profileForm.bio?.length || 0 }}/500
              </div>
            </div>
            <p class="text-xs text-slate-500">展示在公共主页，支持 Markdown 基础语法</p>
          </div>
        </div>
      </div>

      <!-- 上传状态提示 -->
      <div
        v-if="loading && avatarFile"
        class="mt-6 flex items-center gap-3 rounded-2xl border-2 border-sky-200 bg-sky-50 p-4"
      >
        <div class="relative">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-sky-300"></div>
          <div
            class="absolute left-0 top-0 h-5 w-5 animate-spin rounded-full border-2 border-t-sky-500 border-r-transparent border-b-transparent border-l-transparent"
          ></div>
        </div>
        <span class="font-medium text-sky-900">正在上传头像，请稍候...</span>
      </div>

      <!-- 错误提示 -->
      <div
        v-if="error"
        class="mt-6 flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4"
      >
        <i class="icon-[mdi--alert-circle] text-2xl text-red-500"></i>
        <span class="font-medium text-red-900">{{ error }}</span>
      </div>

      <!-- 成功提示 -->
      <div
        v-if="success"
        class="mt-6 flex items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4"
      >
        <i class="icon-[mdi--check-circle] text-2xl text-emerald-500"></i>
        <span class="font-medium text-emerald-900">{{ success }}</span>
      </div>

      <!-- 操作区域 -->
      <div class="mt-8 flex items-center justify-between border-t-2 border-slate-100 pt-6">
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <i class="icon-[mdi--information] text-lg text-purple-500"></i>
          <span>所有修改将实时同步，保存后立即生效</span>
        </div>
        <button
          @click="updateProfile"
          :disabled="loading || !hasChanges"
          class="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none"
        >
          <i v-if="loading" class="icon-[mdi--loading] animate-spin"></i>
          {{ loading ? "保存中..." : "保存修改" }}
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

// 单独的头像上传方法
const uploadAvatar = async (file: File) => {
  loading.value = true
  error.value = ""
  success.value = ""

  try {
    const formData = new FormData()
    formData.append("avatar", file)

    const currentUser = userStore.user
    if (!currentUser) {
      throw new Error("用户未登录")
    }

    const response = await fetch(`/api/users/${currentUser.id}/avatar`, {
      method: "POST",
      body: formData,
      credentials: "include",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "头像上传失败")
    }

    const result = await response.json()

    // 更新本地用户信息中的头像URL
    if (userStore.user && result.data?.avatarUrl) {
      userStore.user.avatarUrl = result.data.avatarUrl
    }

    success.value = "头像更新成功"

    // 3秒后清除成功提示
    setTimeout(() => {
      success.value = ""
    }, 3000)

    // 清除预览和文件引用
    avatarFile.value = null
    avatarPreview.value = null

    return result
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    error.value = errObj.message || "头像上传失败"
    throw new Error(errObj.message || "头像上传失败")
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
