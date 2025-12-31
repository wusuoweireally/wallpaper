<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="relative">
      <div
        class="absolute -inset-x-4 -inset-y-2 -z-10 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-2xl"
      ></div>
      <div class="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30"
            >
              <iconify-icon icon="mdi:account-group" class="text-2xl text-white"></iconify-icon>
            </div>
            <div>
              <h1
                class="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-4xl font-bold text-transparent"
              >
                用户管理
              </h1>
              <p class="mt-1 text-white/70">User Management</p>
            </div>
          </div>
          <button
            class="btn gap-2 border-none bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30 hover:from-blue-600 hover:to-purple-600"
            @click="openCreateModal"
          >
            <iconify-icon icon="mdi:plus" class="text-xl"></iconify-icon>
            创建用户
          </button>
        </div>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        class="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-purple-600/40 via-blue-600/40 to-purple-600/20 p-5 shadow-2xl"
      >
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_50%)]"
        ></div>
        <div class="relative flex items-center justify-between">
          <div>
            <p class="text-sm tracking-wide text-white/70">用户总数</p>
            <p class="mt-2 text-3xl font-bold text-white">{{ totalUsers.toLocaleString() }}</p>
            <p class="mt-1 text-xs text-white/60">所有分页统计</p>
          </div>
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur"
          >
            <iconify-icon
              icon="mdi:account-group-outline"
              class="text-2xl text-white"
            ></iconify-icon>
          </div>
        </div>
      </div>

      <div
        class="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-5 shadow-2xl"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/10"></div>
        <div class="relative flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm tracking-wide text-white/70">当前页活跃用户</p>
              <p class="mt-2 text-3xl font-bold text-white">{{ activeUsers }}</p>
            </div>
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200"
            >
              <iconify-icon icon="mdi:shield-check" class="text-2xl"></iconify-icon>
            </div>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all"
              :style="{ width: activeRate + '%' }"
            ></div>
          </div>
          <p class="text-xs text-white/60">活跃占比：{{ activeRate }}%</p>
        </div>
      </div>

      <div
        class="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-5 shadow-2xl"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-rose-500/10"></div>
        <div class="relative flex items-center justify-between">
          <div>
            <p class="text-sm tracking-wide text-white/70">当前页管理员</p>
            <p class="mt-2 text-3xl font-bold text-white">{{ adminUsers }}</p>
            <p class="mt-1 text-xs text-white/60">角色包含 admin</p>
          </div>
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-200"
          >
            <iconify-icon icon="mdi:crown-circle" class="text-2xl"></iconify-icon>
          </div>
        </div>
      </div>

      <div
        class="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-5 shadow-2xl"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
        <div class="relative flex items-center gap-4">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-200"
          >
            <iconify-icon icon="mdi:calendar-range" class="text-2xl"></iconify-icon>
          </div>
          <div>
            <p class="text-sm tracking-wide text-white/70">最新注册</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ latestSignup }}</p>
            <p class="mt-1 text-xs text-white/60">来自当前页数据</p>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="toast"
      class="alert rounded-2xl border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-md"
    >
      <iconify-icon
        :icon="toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'"
        class="text-2xl"
        :class="toast.type === 'success' ? 'text-emerald-300' : 'text-red-300'"
      ></iconify-icon>
      <span class="text-sm">{{ toast.text }}</span>
    </div>

    <!-- 筛选器 -->
    <div class="group relative">
      <div
        class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30 opacity-75 blur transition duration-1000 group-hover:opacity-100"
      ></div>
      <div
        class="relative rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
      >
        <div class="space-y-5 p-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div class="form-control">
                <label class="label text-xs uppercase tracking-[0.3em] text-white/50">状态</label>
                <select
                  v-model="filters.status"
                  class="select rounded-xl border-white/15 bg-white/5 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
                  @change="refreshList"
                >
                  <option value="" class="bg-slate-900">全部</option>
                  <option value="1" class="bg-slate-900">活跃</option>
                  <option value="0" class="bg-slate-900">禁用</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label text-xs uppercase tracking-[0.3em] text-white/50">角色</label>
                <select
                  v-model="filters.role"
                  class="select rounded-xl border-white/15 bg-white/5 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
                  @change="refreshList"
                >
                  <option value="" class="bg-slate-900">全部</option>
                  <option value="user" class="bg-slate-900">普通用户</option>
                  <option value="admin" class="bg-slate-900">管理员</option>
                </select>
              </div>
              <div class="md:col-span-2 xl:col-span-1">
                <label class="label text-xs uppercase tracking-[0.3em] text-white/50">搜索</label>
                <div class="relative">
                  <input
                    v-model="filters.keyword"
                    type="text"
                    placeholder="用户名 / 邮箱 / ID"
                    class="input w-full rounded-xl border-white/10 bg-white/5 pl-12 pr-12 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
                    @keyup.enter="refreshList"
                  />
                  <iconify-icon
                    icon="mdi:magnify"
                    class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                  ></iconify-icon>
                  <button
                    v-if="filters.keyword"
                    type="button"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    @click="clearKeyword"
                  >
                    <iconify-icon icon="mdi:close-circle" class="text-lg"></iconify-icon>
                  </button>
                </div>
              </div>
            </div>
            <div class="flex gap-3">
              <button
                class="btn gap-2 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20"
                @click="resetFilters"
              >
                重置
              </button>
              <button
                class="btn gap-2 rounded-xl border-none bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:from-purple-600 hover:to-blue-600"
                @click="refreshList"
              >
                <iconify-icon icon="mdi:magnify" class="text-lg"></iconify-icon>
                搜索
              </button>
            </div>
          </div>
          <div
            class="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60"
          >
            <span class="tracking-[0.35em] text-white/40">快捷筛选</span>
            <button
              class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              :class="
                filters.status === '1'
                  ? 'bg-white/30 text-white'
                  : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
              "
              @click="applyQuickFilter('active')"
            >
              活跃用户
            </button>
            <button
              class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              :class="
                filters.status === '0'
                  ? 'bg-white/30 text-white'
                  : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
              "
              @click="applyQuickFilter('inactive')"
            >
              已禁用
            </button>
            <button
              class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              :class="
                filters.role === 'admin'
                  ? 'bg-white/30 text-white'
                  : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
              "
              @click="applyQuickFilter('admin')"
            >
              管理员
            </button>
            <button
              class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              :class="
                filters.role === 'user'
                  ? 'bg-white/30 text-white'
                  : 'border border-white/20 text-white/70 hover:border-white/40 hover:text-white'
              "
              @click="applyQuickFilter('user')"
            >
              普通用户
            </button>
            <button
              class="rounded-full px-3 py-1 text-xs font-semibold text-white/60 transition-colors hover:text-white"
              @click="resetFilters"
            >
              清除快捷筛选
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="group relative">
      <div
        class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 opacity-75 blur transition duration-1000 group-hover:opacity-100"
      ></div>
      <div
        class="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
      >
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="relative">
            <div
              class="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500"
            ></div>
          </div>
        </div>

        <div v-else-if="users.length === 0" class="py-20 text-center">
          <div
            class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-white/10"
          >
            <iconify-icon icon="mdi:account-off" class="text-4xl text-white/30"></iconify-icon>
          </div>
          <p class="text-lg font-semibold text-white/60">暂无用户数据</p>
          <p class="mt-2 text-sm text-white/40">开始创建你的第一个用户吧</p>
        </div>

        <div v-else class="border-t border-white/5">
          <div class="overflow-x-auto">
            <table class="min-w-full table-auto text-left align-middle">
              <thead class="bg-white/5 text-xs uppercase tracking-wider text-white/60">
                <tr>
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
              <tbody class="divide-y divide-white/5">
                <tr
                  v-for="user in users"
                  :key="user.id"
                  class="transition-colors duration-200 hover:bg-white/10"
                >
                  <td class="whitespace-nowrap px-6 py-5">
                    <span class="font-mono text-sm text-white/70">#{{ user.id }}</span>
                  </td>
                  <td class="whitespace-nowrap px-6 py-5">
                    <div class="avatar">
                      <div class="h-12 w-12 overflow-hidden rounded-2xl ring-2 ring-white/20">
                        <img
                          v-if="user.avatarUrl && user.avatarUrl !== 'defaultAvatar.png'"
                          :src="getAvatarUrl(user.avatarUrl)"
                          :alt="user.username"
                          class="h-full w-full object-cover"
                          @error="handleImageError"
                        />
                        <div
                          v-else
                          class="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20"
                        >
                          <iconify-icon
                            icon="mdi:account"
                            class="text-xl text-white/60"
                          ></iconify-icon>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div
                      class="max-w-[200px] truncate font-semibold text-white"
                      :title="user.username"
                    >
                      {{ user.username }}
                    </div>
                  </td>
                  <td class="px-6 py-5 align-middle">
                    <div
                      class="flex items-center gap-2 truncate text-sm text-white/85"
                      :title="user.email || '未填写邮箱'"
                    >
                      <iconify-icon
                        icon="mdi:email-outline"
                        class="text-base text-white/40"
                      ></iconify-icon>
                      <span class="truncate">{{ user.email || '未填写邮箱' }}</span>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-6 py-5">
                    <div
                      v-if="user.role === 'admin'"
                      class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500/80 to-blue-500/80 px-3 py-1 text-xs font-semibold text-white shadow"
                    >
                      <iconify-icon icon="mdi:shield-crown" class="text-sm"></iconify-icon>
                      管理员
                    </div>
                    <div
                      v-else
                      class="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80"
                    >
                      <iconify-icon icon="mdi:account" class="text-sm"></iconify-icon>
                      普通用户
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-6 py-5">
                    <div
                      v-if="user.status === 1"
                      class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-xs font-semibold text-white"
                    >
                      <iconify-icon icon="mdi:check-circle" class="text-sm"></iconify-icon>
                      活跃
                    </div>
                    <div
                      v-else
                      class="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white"
                    >
                      <iconify-icon icon="mdi:close-circle" class="text-sm"></iconify-icon>
                      禁用
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-6 py-5">
                    <div class="text-sm text-white/70">{{ formatDate(user.createdAt) }}</div>
                  </td>
                  <td class="px-6 py-5 text-right">
                    <div class="dropdown dropdown-end">
                      <div
                        tabindex="0"
                        role="button"
                        class="btn btn-ghost btn-sm btn-circle transition-colors hover:bg-white/10"
                      >
                        <iconify-icon icon="mdi:dots-vertical" class="text-white/70"></iconify-icon>
                      </div>
                      <ul
                        tabindex="0"
                        class="dropdown-content menu w-52 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl"
                      >
                        <li class="menu-title">
                          <span class="text-white/60">操作菜单</span>
                        </li>
                        <li>
                          <a
                            class="rounded-xl text-white/90 transition-colors hover:bg-blue-500/20 hover:text-white"
                          >
                            <iconify-icon icon="mdi:eye"></iconify-icon>
                            查看详情
                          </a>
                        </li>
                        <li>
                          <a
                            class="rounded-xl text-white/90 transition-colors hover:bg-purple-500/20 hover:text-white"
                          >
                            <iconify-icon icon="mdi:pencil"></iconify-icon>
                            编辑用户
                          </a>
                        </li>
                        <li>
                          <a
                            class="rounded-xl text-orange-400 transition-colors hover:bg-orange-500/20 hover:text-orange-200"
                          >
                            <iconify-icon icon="mdi:pencil-lock"></iconify-icon>
                            修改密码
                          </a>
                        </li>
                        <div class="divider my-2 border-white/10"></div>
                        <li>
                          <a
                            class="rounded-xl text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-200"
                          >
                            <iconify-icon icon="mdi:delete"></iconify-icon>
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
          class="flex flex-col gap-4 border-t border-white/10 bg-white/5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="text-sm text-white/70">
            当前显示
            <span class="font-semibold text-white">{{ pageRange.start }}-{{ pageRange.end }}</span>
            ，共
            <span class="font-semibold text-white">{{ pagination.value.total }}</span>
            名用户
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              class="btn btn-sm rounded-xl border-white/30 text-white/80 hover:bg-white/10 hover:text-white"
              :disabled="pagination.value.page === 1"
              @click="changePage(pagination.value.page - 1)"
            >
              上一页
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              class="btn btn-sm rounded-xl"
              :class="
                page === pagination.value.page
                  ? 'border-white bg-white text-slate-900'
                  : 'border-white/30 bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
              "
              @click="changePage(page)"
            >
              {{ page }}
            </button>
            <button
              class="btn btn-sm rounded-xl border-white/30 text-white/80 hover:bg-white/10 hover:text-white"
              :disabled="pagination.value.page === pagination.value.pages"
              @click="changePage(pagination.value.page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      >
        <div
          class="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-800/90 text-white shadow-2xl"
          style="font-family: 'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif;"
        >
          <button
            class="btn btn-sm btn-circle absolute right-4 top-4 border-white/15 bg-white/10 text-white hover:bg-white/20"
            @click="closeCreateModal"
            :disabled="createLoading"
          >
            ✕
          </button>
          <div class="space-y-6 p-6">
            <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">User Center</p>
              <h3 class="mt-2 text-2xl font-semibold">创建新用户</h3>
              <p class="mt-1 text-sm text-white/60">分配一个唯一的用户ID并为其设置初始密码与角色</p>
            </div>

            <form class="grid gap-5 md:grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-5" @submit.prevent="submitCreateUser">
              <div class="form-control">
                <label class="label text-sm text-white/60">用户ID</label>
                <input
                  v-model="createUserForm.id"
                  type="number"
                  min="1"
                  placeholder="例如 10001"
                  class="input border-white/10 bg-slate-900/60 text-white placeholder:text-white/30 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40"
                  :disabled="createLoading"
                />
                <span v-if="createErrors.id" class="mt-1 text-xs text-red-300">{{
                  createErrors.id
                }}</span>
              </div>

              <div class="form-control">
                <label class="label text-sm text-white/60">用户名</label>
                <input
                  v-model="createUserForm.username"
                  type="text"
                  placeholder="输入用户名"
                  class="input border-white/10 bg-slate-900/60 text-white placeholder:text-white/30 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40"
                  :disabled="createLoading"
                />
                <span v-if="createErrors.username" class="mt-1 text-xs text-red-300">{{
                  createErrors.username
                }}</span>
              </div>

              <div class="form-control">
                <label class="label text-sm text-white/60">邮箱（可选）</label>
                <input
                  v-model="createUserForm.email"
                  type="email"
                  placeholder="user@example.com"
                  class="input border-white/10 bg-slate-900/60 text-white placeholder:text-white/30 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40"
                  :disabled="createLoading"
                />
                <span v-if="createErrors.email" class="mt-1 text-xs text-red-300">{{
                  createErrors.email
                }}</span>
              </div>

              <div class="form-control">
                <label class="label text-sm text-white/60">角色</label>
                <select
                  v-model="createUserForm.role"
                  class="select border-white/10 bg-slate-900/60 text-white focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40"
                  :disabled="createLoading"
                >
                  <option
                    v-for="role in roleOptions"
                    :key="role.value"
                    :value="role.value"
                    class="bg-slate-900"
                  >
                    {{ role.label }}
                  </option>
                </select>
              </div>

              <div class="form-control md:col-span-2">
                <label class="label text-sm text-white/60">初始密码</label>
                <input
                  v-model="createUserForm.password"
                  type="password"
                  placeholder="至少6位字符，建议包含字母与数字"
                  class="input border-white/10 bg-slate-900/60 text-white placeholder:text-white/30 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40"
                  :disabled="createLoading"
                />
                <span v-if="createErrors.password" class="mt-1 text-xs text-red-300">{{
                  createErrors.password
                }}</span>
              </div>

              <div class="form-control md:col-span-2">
                <label class="label text-sm text-white/60">个人简介（可选）</label>
                <textarea
                  v-model="createUserForm.bio"
                  rows="3"
                  maxlength="500"
                  placeholder="为该用户添加简短介绍，方便识别身份"
                  class="textarea border-white/10 bg-slate-900/60 text-white placeholder:text-white/30 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40"
                  :disabled="createLoading"
                ></textarea>
              </div>

              <div
                class="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-end"
              >
                <p class="flex-1 text-xs text-white/50">
                  创建后可随时在用户列表中修改资料或调整权限。
                </p>
                <div class="flex gap-3">
                  <button
                    type="button"
                    class="btn btn-ghost border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                    @click="closeCreateModal"
                    :disabled="createLoading"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    class="btn border-none bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400 text-slate-900 hover:from-cyan-300 hover:via-sky-300 hover:to-teal-300"
                    :class="{ loading: createLoading }"
                    :disabled="createLoading"
                  >
                    确认创建
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed, onBeforeUnmount } from 'vue'
import adminService, { type AdminUser, type AdminUserQuery } from '@/services/admin'
import { UserRole } from '@/services/user'

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
  status: '',
  role: '',
  keyword: '',
})

const showCreateModal = ref(false)
const createLoading = ref(false)
const createUserForm = reactive({
  id: '',
  username: '',
  email: '',
  password: '',
  role: UserRole.USER as UserRole,
  bio: '',
})
const createErrors = reactive({
  id: '',
  username: '',
  email: '',
  password: '',
})
const roleOptions = [
  { label: '普通用户', value: UserRole.USER },
  { label: '管理员', value: UserRole.ADMIN },
]
const toast = ref<{ text: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null
const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

const getAvatarUrl = (avatarUrl: string) => {
  if (avatarUrl.startsWith('http')) return avatarUrl
  return `/api/uploads/profile-pictures/${avatarUrl}`
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const totalUsers = computed(() => pagination.value.total || 0)
const activeUsers = computed(() => users.value.filter((user) => user.status === 1).length)
const adminUsers = computed(() => users.value.filter((user) => user.role === 'admin').length)
const activeRate = computed(() => {
  const total = users.value.length
  if (!total) return 0
  return Math.round((activeUsers.value / total) * 100)
})
const latestSignup = computed(() => {
  if (!users.value.length) return '暂无数据'
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
const visiblePages = computed(() => {
  const totalPages = pagination.value.pages || 0
  if (totalPages === 0) return [1]
  const current = pagination.value.page
  const windowSize = 5
  let start = Math.max(1, current - 2)
  let end = Math.min(totalPages, current + 2)

  const currentWindow = end - start + 1
  if (currentWindow < windowSize) {
    const remaining = windowSize - currentWindow
    start = Math.max(1, start - remaining)
    end = Math.min(totalPages, end + (windowSize - (end - start + 1)))
  }

  const pages: number[] = []
  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }
  return pages
})

const showToast = (text: string, type: 'success' | 'error' = 'success') => {
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
  createUserForm.id = ''
  createUserForm.username = ''
  createUserForm.email = ''
  createUserForm.password = ''
  createUserForm.role = UserRole.USER
  createUserForm.bio = ''
  createErrors.id = ''
  createErrors.username = ''
  createErrors.email = ''
  createErrors.password = ''
}

const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetCreateForm()
}

const validateCreateForm = () => {
  let valid = true
  createErrors.id = ''
  createErrors.username = ''
  createErrors.email = ''
  createErrors.password = ''

  const idValue = Number(createUserForm.id)
  if (!idValue || Number.isNaN(idValue) || idValue <= 0) {
    createErrors.id = '请输入大于0的用户ID'
    valid = false
  }

  if (!createUserForm.username || !createUserForm.username.trim()) {
    createErrors.username = '用户名不能为空'
    valid = false
  }

  if (createUserForm.email && !emailPattern.test(createUserForm.email)) {
    createErrors.email = '请输入有效的邮箱地址'
    valid = false
  }

  if (!createUserForm.password || createUserForm.password.length < 6) {
    createErrors.password = '密码至少6位'
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
    showToast('创建用户成功')
    closeCreateModal()
    refreshList()
  } catch (error) {
    console.error('创建用户失败:', error)
    showToast('创建用户失败，请稍后重试', 'error')
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
    console.error('加载用户列表失败:', error)
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
  filters.status = ''
  filters.role = ''
  filters.keyword = ''
  refreshList()
}

const applyQuickFilter = (type: 'active' | 'inactive' | 'admin' | 'user') => {
  if (type === 'active') {
    filters.status = '1'
  } else if (type === 'inactive') {
    filters.status = '0'
  } else if (type === 'admin') {
    filters.role = UserRole.ADMIN
  } else if (type === 'user') {
    filters.role = UserRole.USER
  }
  refreshList()
}

const clearKeyword = () => {
  if (!filters.keyword) return
  filters.keyword = ''
  refreshList()
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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
