<template>
  <div class="space-y-8">
    <header>
      <h1 class="text-xl font-semibold tracking-tight text-fg">账号设置</h1>
      <p class="mt-1 text-sm text-muted">管理资料、安全信息以及账号状态</p>
    </header>

    <section class="space-y-6">
      <ProfileSettings />
      <PasswordSettings />
      <AccountSettings />
    </section>
  </div>
</template>

<script lang="ts" setup>
import ProfileSettings from "./settings/ProfileSettings.vue"
import PasswordSettings from "./settings/PasswordSettings.vue"
import AccountSettings from "./settings/AccountSettings.vue"
</script>
