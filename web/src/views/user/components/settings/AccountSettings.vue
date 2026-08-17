<template>
  <div class="wb-card">
    <div class="p-6">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-fg">注销账号</h3>
        <p class="mt-1 text-sm text-muted">此操作不可撤销，请谨慎操作</p>
      </div>

      <div class="mb-4 rounded-card border border-line bg-subtle p-4">
        <p class="text-sm text-muted">
          注销后所有上传壁纸、收藏、评论与个人资料将被永久删除且无法恢复。
          如有疑问，请联系管理员协助处理。
        </p>
      </div>

      <div class="flex items-center justify-between gap-3">
        <p class="text-xs text-faint">功能暂未开放，如有需要请联系管理员</p>
        <button type="button" class="wb-btn" disabled>
          <i class="i-[mdi--trash-can] mr-2" aria-hidden="true"></i>
          注销账号
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 后端暂无注销接口：保留入口但禁用，避免用户走完确认流程才发现无法注销
</script>
