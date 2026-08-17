<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-fg">用户管理</h1>
        <p class="mt-1 text-sm text-muted">管理系统用户</p>
      </div>
      <button type="button" class="wb-btn-primary" @click="openCreateModal">创建用户</button>
    </div>

    <!-- 数据概览 -->
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="wb-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted">用户总数</p>
            <p class="mt-2 text-3xl font-bold tabular-nums text-fg">
              {{ totalUsers.toLocaleString() }}
            </p>
            <p class="mt-1 text-xs text-faint">所有分页统计</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-control bg-subtle">
            <i class="i-[mdi--account-group-outline] text-2xl text-primary" aria-hidden="true"></i>
          </div>
        </div>
      </div>

      <div class="wb-card p-5">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted">当前页活跃用户</p>
              <p class="mt-2 text-3xl font-bold tabular-nums text-fg">{{ activeUsers }}</p>
            </div>
            <div class="flex h-14 w-14 items-center justify-center rounded-control bg-subtle">
              <i class="i-[mdi--shield-check] text-2xl text-success" aria-hidden="true"></i>
            </div>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-inset">
            <div
              class="h-full rounded-full bg-success transition-all"
              :style="{ width: activeRate + '%' }"
            ></div>
          </div>
          <p class="text-xs text-faint">活跃占比：{{ activeRate }}%</p>
        </div>
      </div>

      <div class="wb-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted">当前页管理员</p>
            <p class="mt-2 text-3xl font-bold tabular-nums text-fg">{{ adminUsers }}</p>
            <p class="mt-1 text-xs text-faint">角色包含 admin</p>
          </div>
          <div class="flex h-14 w-14 items-center justify-center rounded-control bg-subtle">
            <i class="i-[mdi--crown-circle] text-2xl text-warning" aria-hidden="true"></i>
          </div>
        </div>
      </div>

      <div class="wb-card p-5">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-control bg-subtle">
            <i class="i-[mdi--calendar-range] text-2xl text-primary" aria-hidden="true"></i>
          </div>
          <div>
            <p class="text-sm text-muted">最新注册</p>
            <p class="mt-2 text-2xl font-semibold text-fg">{{ latestSignup }}</p>
            <p class="mt-1 text-xs text-faint">来自当前页数据</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="toast" class="wb-alert" :class="toast.type === 'error' ? 'wb-alert-danger' : ''">
      <i
        class="text-2xl"
        :class="[
          toast.type === 'success' ? 'i-[mdi--check-circle]' : 'i-[mdi--alert-circle]',
          toast.type === 'success' ? 'text-success' : 'text-error',
        ]"
        aria-hidden="true"
      ></i>
      <span class="text-sm">{{ toast.text }}</span>
    </div>

    <!-- 筛选器 -->
    <div class="wb-card p-6">
      <div class="space-y-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">
                状态
              </label>
              <select v-model="filters.status" class="wb-input" @change="refreshList">
                <option value="">全部</option>
                <option value="1">活跃</option>
                <option value="0">禁用</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">
                角色
              </label>
              <select v-model="filters.role" class="wb-input" @change="refreshList">
                <option value="">全部</option>
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
                <option value="super_admin">超级管理员</option>
              </select>
            </div>
            <div class="md:col-span-2 xl:col-span-1">
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-faint">
                搜索
              </label>
              <div class="relative">
                <input
                  v-model="filters.keyword"
                  type="text"
                  placeholder="用户名 / 邮箱 / ID"
                  class="wb-input w-full pl-10 pr-10"
                  @keyup.enter="refreshList"
                />
                <i
                  class="i-[mdi--magnify] absolute left-3 top-1/2 -translate-y-1/2 text-lg text-faint"
                  aria-hidden="true"
                ></i>
                <button
                  v-if="filters.keyword"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-fg"
                  @click="clearKeyword"
                >
                  <i class="i-[mdi--close-circle] text-lg" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <button class="wb-btn gap-2" @click="resetFilters">重置</button>
            <button class="wb-btn-primary gap-2" @click="refreshList">
              <i class="i-[mdi--magnify] text-lg" aria-hidden="true"></i>
              搜索
            </button>
          </div>
        </div>
        <div
          class="flex flex-wrap items-center gap-3 rounded-control border border-line bg-inset px-4 py-3 text-xs"
        >
          <span class="text-faint">快捷筛选</span>
          <button
            class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            :class="
              filters.status === '1'
                ? 'border border-primary/40 bg-primary/10 text-primary'
                : 'border border-line text-muted hover:border-primary/40 hover:text-primary'
            "
            @click="applyQuickFilter('active')"
          >
            活跃用户
          </button>
          <button
            class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            :class="
              filters.status === '0'
                ? 'border border-primary/40 bg-primary/10 text-primary'
                : 'border border-line text-muted hover:border-primary/40 hover:text-primary'
            "
            @click="applyQuickFilter('inactive')"
          >
            已禁用
          </button>
          <button
            class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            :class="
              filters.role === 'admin'
                ? 'border border-primary/40 bg-primary/10 text-primary'
                : 'border border-line text-muted hover:border-primary/40 hover:text-primary'
            "
            @click="applyQuickFilter('admin')"
          >
            管理员
          </button>
          <button
            class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            :class="
              filters.role === 'super_admin'
                ? 'border border-primary/40 bg-primary/10 text-primary'
                : 'border border-line text-muted hover:border-primary/40 hover:text-primary'
            "
            @click="applyQuickFilter('super_admin')"
          >
            超级管理员
          </button>
          <button
            class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            :class="
              filters.role === 'user'
                ? 'border border-primary/40 bg-primary/10 text-primary'
                : 'border border-line text-muted hover:border-primary/40 hover:text-primary'
            "
            @click="applyQuickFilter('user')"
          >
            普通用户
          </button>
          <button
            class="rounded-full px-3 py-1 text-xs font-semibold text-faint transition-colors hover:text-fg"
            @click="resetFilters"
          >
            清除快捷筛选
          </button>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="wb-card overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <span class="wb-spinner wb-spinner-lg"></span>
      </div>

      <div v-else-if="users.length === 0" class="py-20 text-center">
        <div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-subtle">
          <i class="i-[mdi--account-off] text-4xl text-faint" aria-hidden="true"></i>
        </div>
        <p class="text-lg font-semibold text-muted">暂无用户数据</p>
        <p class="mt-2 text-sm text-faint">开始创建你的第一个用户吧</p>
      </div>

      <div v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full table-auto text-left align-middle">
            <thead class="text-xs uppercase tracking-wide text-faint">
              <tr class="border-b border-line">
                <th class="whitespace-nowrap px-6 py-5 font-semibold">ID</th>
                <th class="whitespace-nowrap px-6 py-5 font-semibold">头像</th>
                <th class="whitespace-nowrap px-6 py-5 font-semibold">用户名</th>
                <th class="whitespace-nowrap px-6 py-5 font-semibold">邮箱</th>
                <th class="whitespace-nowrap px-6 py-5 font-semibold">角色</th>
                <th class="whitespace-nowrap px-6 py-5 font-semibold">状态</th>
                <th class="whitespace-nowrap px-6 py-5 font-semibold">注册时间</th>
                <th class="whitespace-nowrap px-6 py-5 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/60">
              <tr
                v-for="user in users"
                :key="user.id"
                class="transition-colors duration-200 hover:bg-subtle"
              >
                <td class="whitespace-nowrap px-6 py-5">
                  <span class="font-mono text-sm text-faint">#{{ user.id }}</span>
                </td>
                <td class="whitespace-nowrap px-6 py-5">
                  <div class="h-12 w-12 overflow-hidden rounded-control ring-1 ring-line">
                    <img
                      v-if="user.avatarUrl && user.avatarUrl !== 'defaultAvatar.png'"
                      :src="getAvatarUrl(user.avatarUrl)"
                      :alt="user.username"
                      class="h-full w-full object-cover"
                      @error="handleImageError"
                    />
                    <div v-else class="flex h-full w-full items-center justify-center bg-subtle">
                      <i class="i-[mdi--account] text-xl text-faint" aria-hidden="true"></i>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <div class="max-w-[200px] truncate font-semibold text-fg" :title="user.username">
                    {{ user.username }}
                  </div>
                </td>
                <td class="px-6 py-5 align-middle">
                  <div
                    class="flex items-center gap-2 truncate text-sm text-muted"
                    :title="user.email || '未填写邮箱'"
                  >
                    <i class="i-[mdi--email-outline] text-base text-faint" aria-hidden="true"></i>
                    <span class="truncate">{{ user.email || "未填写邮箱" }}</span>
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-5">
                  <div
                    v-if="user.role === 'admin'"
                    class="wb-badge-primary inline-flex items-center gap-1"
                  >
                    <i class="i-[mdi--shield-crown] text-sm" aria-hidden="true"></i>
                    管理员
                  </div>
                  <div
                    v-else-if="user.role === 'super_admin'"
                    class="wb-badge-warning inline-flex items-center gap-1"
                  >
                    <i class="i-[mdi--shield-star] text-sm" aria-hidden="true"></i>
                    超级管理员
                  </div>
                  <div v-else class="wb-badge inline-flex items-center gap-1">
                    <i class="i-[mdi--account] text-sm" aria-hidden="true"></i>
                    普通用户
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-5">
                  <div
                    v-if="user.status === 1"
                    class="wb-badge-success inline-flex items-center gap-1"
                  >
                    <i class="i-[mdi--check-circle] text-sm" aria-hidden="true"></i>
                    活跃
                  </div>
                  <div v-else class="wb-badge-danger inline-flex items-center gap-1">
                    <i class="i-[mdi--close-circle] text-sm" aria-hidden="true"></i>
                    禁用
                  </div>
                </td>
                <td class="whitespace-nowrap px-6 py-5">
                  <div class="text-sm text-muted">{{ formatDate(user.createdAt) }}</div>
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="wb-drop wb-drop-end">
                    <div tabindex="0" role="button" class="wb-btn-ghost wb-btn-sm">
                      <i class="i-[mdi--dots-vertical] text-muted" aria-hidden="true"></i>
                    </div>
                    <ul tabindex="0" class="wb-drop-panel w-52 p-2">
                      <li>
                        <span class="px-3 py-1 text-xs font-semibold text-faint">操作菜单</span>
                      </li>
                      <li>
                        <a @click.prevent="viewUser(user)">
                          <i class="i-[mdi--eye]" aria-hidden="true"></i>
                          查看详情
                        </a>
                      </li>
                      <li>
                        <a @click.prevent="editUser(user)">
                          <i class="i-[mdi--pencil]" aria-hidden="true"></i>
                          编辑用户
                        </a>
                      </li>
                      <li>
                        <a class="text-warning" @click.prevent="changePassword(user)">
                          <i class="i-[mdi--pencil-lock]" aria-hidden="true"></i>
                          修改密码
                        </a>
                      </li>
                      <div class="my-2 border-t border-line"></div>
                      <li>
                        <a class="text-error" @click.prevent="deleteUser(user)">
                          <i class="i-[mdi--delete]" aria-hidden="true"></i>
                          删除用户
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="shouldShowPagination"
        class="flex flex-col gap-4 border-t border-line px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="text-sm text-muted">
          当前显示
          <span class="font-semibold text-fg">{{ pageRange.start }}-{{ pageRange.end }}</span>
          ，共
          <span class="font-semibold text-fg">{{ pagination.total }}</span>
          名用户
        </div>
        <Pagination
          :current-page="pagination.page"
          :total-pages="pagination.pages"
          @change="changePage"
        />
      </div>
    </div>

    <!-- 创建用户弹窗 -->
    <dialog ref="createModalRef" class="wb-dialog">
      <div class="wb-dialog-box max-w-4xl">
        <button
          class="wb-btn-ghost wb-btn-sm absolute right-4 top-4"
          @click="closeCreateModal"
          :disabled="createLoading"
        >
          ✕
        </button>
        <div class="space-y-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-primary">User Center</p>
            <h3 class="mt-2 text-2xl font-semibold text-fg">创建新用户</h3>
            <p class="mt-1 text-sm text-muted">分配一个唯一的用户ID并为其设置初始密码与角色</p>
          </div>

          <form class="grid gap-5 md:grid-cols-2" @submit.prevent="submitCreateUser">
            <div>
              <label class="mb-1 block text-sm text-muted">用户ID</label>
              <input
                v-model="createUserForm.id"
                type="number"
                min="1"
                placeholder="例如 10001"
                class="wb-input"
                :disabled="createLoading"
              />
              <span v-if="createErrors.id" class="mt-1 text-xs text-error">{{
                createErrors.id
              }}</span>
            </div>

            <div>
              <label class="mb-1 block text-sm text-muted">用户名</label>
              <input
                v-model="createUserForm.username"
                type="text"
                placeholder="输入用户名"
                class="wb-input"
                :disabled="createLoading"
              />
              <span v-if="createErrors.username" class="mt-1 text-xs text-error">{{
                createErrors.username
              }}</span>
            </div>

            <div>
              <label class="mb-1 block text-sm text-muted">邮箱（可选）</label>
              <input
                v-model="createUserForm.email"
                type="email"
                placeholder="user@example.com"
                class="wb-input"
                :disabled="createLoading"
              />
              <span v-if="createErrors.email" class="mt-1 text-xs text-error">{{
                createErrors.email
              }}</span>
            </div>

            <div>
              <label class="mb-1 block text-sm text-muted">角色</label>
              <select v-model="createUserForm.role" class="wb-input" :disabled="createLoading">
                <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                  {{ role.label }}
                </option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="mb-1 block text-sm text-muted">初始密码</label>
              <input
                v-model="createUserForm.password"
                type="password"
                placeholder="至少6位字符，建议包含字母与数字"
                class="wb-input"
                :disabled="createLoading"
              />
              <span v-if="createErrors.password" class="mt-1 text-xs text-error">{{
                createErrors.password
              }}</span>
            </div>

            <div class="md:col-span-2">
              <label class="mb-1 block text-sm text-muted">个人简介（可选）</label>
              <textarea
                v-model="createUserForm.bio"
                rows="3"
                maxlength="500"
                placeholder="为该用户添加简短介绍，方便识别身份"
                class="wb-input"
                :disabled="createLoading"
              ></textarea>
            </div>

            <div
              class="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-end"
            >
              <p class="flex-1 text-xs text-faint">创建后可随时在用户列表中修改资料或调整权限。</p>
              <div class="flex gap-3">
                <button
                  type="button"
                  class="wb-btn-ghost"
                  @click="closeCreateModal"
                  :disabled="createLoading"
                >
                  取消
                </button>
                <button type="submit" class="wb-btn-primary" :disabled="createLoading">
                  确认创建
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed, onBeforeUnmount } from "vue"
import adminService, { type AdminUser, type AdminUserQuery } from "@/services/admin"
import { UserRole } from "@/services/user"
import { confirmAction } from "@/composables/useConfirm"
import Pagination from "@/components/Pagination.vue"

interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

const loading = ref(true)
const users = ref<AdminUser[]>([])
const pagination = ref<PaginationMeta>({
  page: 1,
  limit: 12,
  total: 0,
  pages: 0,
})

const filters = reactive({
  status: "",
  role: "",
  keyword: "",
})

const createModalRef = ref<HTMLDialogElement | null>(null)
const createLoading = ref(false)
const createUserForm = reactive({
  id: "",
  username: "",
  email: "",
  password: "",
  role: UserRole.USER as UserRole,
  bio: "",
})
const createErrors = reactive({
  id: "",
  username: "",
  email: "",
  password: "",
})
const roleOptions = [
  { label: "普通用户", value: UserRole.USER },
  { label: "管理员", value: UserRole.ADMIN },
]
const toast = ref<{ text: string; type: "success" | "error" } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null
const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

const getAvatarUrl = (avatarUrl: string) => {
  // COS 完整 URL 或绝对路径直返；旧式相对文件名视为默认头像
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("/")) return avatarUrl
  return "/defaultAvatar.png"
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const totalUsers = computed(() => pagination.value.total || 0)
const activeUsers = computed(() => users.value.filter((user) => user.status === 1).length)
const adminUsers = computed(
  () => users.value.filter((user) => user.role === "admin" || user.role === "super_admin").length,
)
const activeRate = computed(() => {
  const total = users.value.length
  if (!total) return 0
  return Math.round((activeUsers.value / total) * 100)
})
const latestSignup = computed(() => {
  if (!users.value.length) return "暂无数据"
  const sorted = [...users.value].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return formatDate(sorted[0].createdAt)
})
const pageRange = computed(() => {
  if (!pagination.value.total) {
    return { start: 0, end: 0 }
  }
  const start = (pagination.value.page - 1) * pagination.value.limit + 1
  const end = Math.min(pagination.value.page * pagination.value.limit, pagination.value.total)
  return { start, end }
})
const shouldShowPagination = computed(() => pagination.value.pages > 1)

const showToast = (text: string, type: "success" | "error" = "success") => {
  toast.value = { text, type }
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastTimer = setTimeout(() => {
    toast.value = null
    toastTimer = null
  }, 2600)
}

const resetCreateForm = () => {
  createUserForm.id = ""
  createUserForm.username = ""
  createUserForm.email = ""
  createUserForm.password = ""
  createUserForm.role = UserRole.USER
  createUserForm.bio = ""
  createErrors.id = ""
  createErrors.username = ""
  createErrors.email = ""
  createErrors.password = ""
}

const openCreateModal = () => {
  resetCreateForm()
  createModalRef.value?.showModal()
}

const closeCreateModal = () => {
  createModalRef.value?.close()
  resetCreateForm()
}

const validateCreateForm = () => {
  let valid = true
  createErrors.id = ""
  createErrors.username = ""
  createErrors.email = ""
  createErrors.password = ""

  const idValue = Number(createUserForm.id)
  if (!idValue || Number.isNaN(idValue) || idValue <= 0) {
    createErrors.id = "请输入大于0的用户ID"
    valid = false
  }

  if (!createUserForm.username || !createUserForm.username.trim()) {
    createErrors.username = "用户名不能为空"
    valid = false
  }

  if (createUserForm.email && !emailPattern.test(createUserForm.email)) {
    createErrors.email = "请输入有效的邮箱地址"
    valid = false
  }

  if (!createUserForm.password || createUserForm.password.length < 6) {
    createErrors.password = "密码至少6位"
    valid = false
  }

  return valid
}

const submitCreateUser = async () => {
  if (!validateCreateForm()) return

  try {
    createLoading.value = true
    const payload = {
      id: Number(createUserForm.id),
      username: createUserForm.username.trim(),
      password: createUserForm.password,
      email: createUserForm.email.trim() || undefined,
      role: createUserForm.role,
      bio: createUserForm.bio.trim() || undefined,
    }
    await adminService.adminCreateUser(payload)
    showToast("创建用户成功")
    closeCreateModal()
    refreshList()
  } catch (error) {
    console.error("创建用户失败:", error)
    showToast("创建用户失败，请稍后重试", "error")
  } finally {
    createLoading.value = false
  }
}

const normalizePagination = (payload?: Partial<PaginationMeta>): PaginationMeta => {
  const limit = payload?.limit ?? pagination.value.limit ?? 12
  const total = payload?.total ?? 0
  return {
    page: payload?.page ?? 1,
    limit,
    total,
    pages: payload?.pages ?? (limit > 0 ? Math.ceil(total / limit) : 0),
  }
}

const loadUsers = async () => {
  try {
    loading.value = true
    const query: AdminUserQuery = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      status: filters.status ? Number(filters.status) : undefined,
      role: (filters.role || undefined) as UserRole | undefined,
      keyword: filters.keyword || undefined,
    }

    const response = await adminService.adminGetUsers(query)
    users.value = response.data ?? []
    pagination.value = normalizePagination(response.pagination)
  } catch (error) {
    console.error("加载用户列表失败:", error)
    users.value = []
    pagination.value = normalizePagination()
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  pagination.value.page = page
  loadUsers()
}

const refreshList = () => {
  pagination.value.page = 1
  loadUsers()
}

const resetFilters = () => {
  filters.status = ""
  filters.role = ""
  filters.keyword = ""
  refreshList()
}

const applyQuickFilter = (type: "active" | "inactive" | "admin" | "super_admin" | "user") => {
  if (type === "active") {
    filters.status = "1"
  } else if (type === "inactive") {
    filters.status = "0"
  } else if (type === "admin") {
    filters.role = UserRole.ADMIN
  } else if (type === "super_admin") {
    filters.role = UserRole.SUPER_ADMIN
  } else if (type === "user") {
    filters.role = UserRole.USER
  }
  refreshList()
}

const clearKeyword = () => {
  if (!filters.keyword) return
  filters.keyword = ""
  refreshList()
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as {
    message?: string
    userMessage?: string
    response?: { data?: { message?: string } }
  }
  return err.response?.data?.message || err.userMessage || err.message || fallback
}

const viewUser = async (user: AdminUser) => {
  try {
    const response = await adminService.adminGetUserById(user.id)
    const detail = response.data || user
    window.alert(
      [
        `用户ID：${detail.id}`,
        `用户名：${detail.username}`,
        `邮箱：${detail.email || "未设置"}`,
        `角色：${detail.role}`,
        `状态：${detail.status === 1 ? "启用" : "禁用"}`,
        `创建时间：${formatDate(detail.createdAt)}`,
        `简介：${detail.bio || "无"}`,
      ].join("\n"),
    )
  } catch (error) {
    console.error("获取用户详情失败:", error)
    showToast(getErrorMessage(error, "获取用户详情失败"), "error")
  }
}

const editUser = async (user: AdminUser) => {
  const username = window.prompt("用户名", user.username)
  if (username === null) return

  const email = window.prompt("邮箱（留空表示不设置）", user.email || "")
  if (email === null) return

  const bio = window.prompt("个人简介（留空表示不设置）", user.bio || "")
  if (bio === null) return

  const role = window.prompt("角色：user 或 admin", user.role)
  if (role === null) return
  if (![UserRole.USER, UserRole.ADMIN].includes(role as UserRole)) {
    showToast("角色只能设置为 user 或 admin", "error")
    return
  }

  const status = window.prompt("状态：1 启用，0 禁用", String(user.status))
  if (status === null) return
  if (!["0", "1"].includes(status)) {
    showToast("状态只能是 1 或 0", "error")
    return
  }

  try {
    await adminService.adminUpdateUser(user.id, {
      username: username.trim(),
      email: email.trim() || null,
      bio: bio.trim() || null,
      role: role as UserRole,
      status: Number(status),
    })
    showToast("用户信息已更新")
    refreshList()
  } catch (error) {
    console.error("更新用户失败:", error)
    showToast(getErrorMessage(error, "更新用户失败"), "error")
  }
}

const changePassword = async (user: AdminUser) => {
  const password = window.prompt(`为用户 ${user.username} 设置新密码`)
  if (password === null) return
  if (password.length < 6) {
    showToast("密码至少6位", "error")
    return
  }

  try {
    await adminService.adminUpdateUser(user.id, { password })
    showToast("密码已更新")
  } catch (error) {
    console.error("修改密码失败:", error)
    showToast(getErrorMessage(error, "修改密码失败"), "error")
  }
}

const deleteUser = async (user: AdminUser) => {
  const confirmed = await confirmAction({
    title: "删除用户",
    message: `确认删除用户 ${user.username}（ID: ${user.id}）？`,
    confirmText: "删除",
    danger: true,
  })
  if (!confirmed) return

  try {
    await adminService.adminDeleteUser(user.id)
    showToast("用户已删除")
    refreshList()
  } catch (error) {
    console.error("删除用户失败:", error)
    showToast(getErrorMessage(error, "删除用户失败"), "error")
  }
}

onMounted(() => {
  loadUsers()
})

onBeforeUnmount(() => {
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
})
</script>
