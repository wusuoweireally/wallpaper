<template>
  <div class="space-y-8">
    <!-- 头部区域 -->
    <header class="rounded-[2rem] bg-gradient-to-br from-white/95 via-white/90 to-white/80 p-8 shadow-2xl ring-1 ring-black/5">
      <div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <p
            class="mb-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wider text-slate-600"
          >
            ACCOUNT
          </p>
          <h1 class="text-3xl font-bold text-slate-900">账号设置</h1>
          <p class="mt-2 text-slate-600">管理资料、安全信息以及账号使用状态。</p>
        </div>
        <div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <div class="flex items-center gap-3 rounded-2xl bg-slate-50 px-5 py-3">
            <i class="icon-[mdi--account] text-2xl text-slate-500"></i>
            <div>
              <p class="text-xs text-slate-500">用户名</p>
              <p class="font-semibold text-slate-900">{{ userStore.user?.username || "未填写" }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-2xl bg-slate-50 px-5 py-3">
            <i class="icon-[mdi--email-outline] text-2xl text-slate-500"></i>
            <div>
              <p class="text-xs text-slate-500">邮箱</p>
              <p class="font-semibold text-slate-900">{{ userStore.user?.email || "未绑定" }}</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 概览卡片 -->
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        class="group overflow-hidden rounded-2xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30 transition-transform group-hover:scale-110"
          >
            <i class="icon-[mdi--account] text-2xl"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-slate-500">基础资料</p>
            <p class="mt-1 text-lg font-semibold text-slate-900">
              {{ userStore.user?.username || "未设置" }}
            </p>
          </div>
        </div>
        <p class="mt-4 text-xs text-slate-500">头像与简介将展示在公开主页中。</p>
      </div>

      <div
        class="group overflow-hidden rounded-2xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/10"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/30 transition-transform group-hover:scale-110"
          >
            <i class="icon-[mdi--email-outline] text-2xl"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-slate-500">联系邮箱</p>
            <p class="mt-1 truncate text-lg font-semibold text-slate-900">
              {{ userStore.user?.email || "暂无" }}
            </p>
          </div>
        </div>
        <p class="mt-4 text-xs text-slate-500">建议绑定常用邮箱保障账号安全。</p>
      </div>

      <div
        class="group overflow-hidden rounded-2xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-110"
          >
            <i class="icon-[mdi--shield-check] text-2xl"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-slate-500">安全状态</p>
            <p class="mt-1 text-lg font-semibold text-slate-900">密码可更新</p>
          </div>
        </div>
        <p class="mt-4 text-xs text-slate-500">定期修改密码可减少安全风险。</p>
      </div>
    </section>

    <!-- 设置区域 -->
    <section class="space-y-8">
      <!-- 第一行: 个人信息和修改密码 -->
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="w-full">
          <ProfileSettings />
        </div>
        <div class="w-full">
          <PasswordSettings />
        </div>
      </div>

      <!-- 第二行: 账号设置 -->
      <div class="mx-auto w-full max-w-3xl">
        <AccountSettings />
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/stores/user"
import { onUnmounted } from "vue"
import ProfileSettings from "./settings/ProfileSettings.vue"
import PasswordSettings from "./settings/PasswordSettings.vue"
import AccountSettings from "./settings/AccountSettings.vue"

const userStore = useUserStore()

onUnmounted(() => {
  // 清理任何可能的 Teleport 残留元素
  if (typeof document !== "undefined") {
    const teleportElements = document.querySelectorAll("[data-teleport]")
    teleportElements.forEach((el) => el.remove())

    // 清理任何可能的模态框背景
    const modals = document.querySelectorAll("[data-modal-backdrop]")
    modals.forEach((el) => el.remove())

    // 恢复 body 样式
    document.body.style.overflow = ""
    document.body.classList.remove("modal-open")
  }
})
</script>
