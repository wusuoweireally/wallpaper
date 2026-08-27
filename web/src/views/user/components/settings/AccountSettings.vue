<template>
  <div class="wb-card">
    <div class="p-6">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-fg">注销账号</h3>
        <p class="mt-1 text-sm text-muted">此操作不可撤销，请谨慎操作</p>
      </div>

      <div class="mb-4 rounded-card border border-line bg-subtle p-4">
        <p class="text-sm text-muted">
          注销后你的个人资料将被匿名化，登录态立即失效且无法恢复；已发布的壁纸与评论会保留但不再关联到你。
          如有疑问，请联系管理员协助处理。
        </p>
      </div>

      <div class="flex items-center justify-between gap-3">
        <p class="text-xs text-faint">注销即表示你已了解上述后果</p>
        <button type="button" class="wb-btn" :disabled="deleting" @click="onDeleteAccount">
          <i class="i-[mdi--trash-can] mr-2" aria-hidden="true"></i>
          {{ deleting ? "注销中…" : "注销账号" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"
import { confirmAction } from "@/composables/useConfirm"
import { useGlobalToast } from "@/composables/useToast"
import userService from "@/services/user"

// 后端 DELETE /users/:id 已支持本人注销（资料匿名化 + 清登录态），此处接通入口
const router = useRouter()
const userStore = useUserStore()
const toast = useGlobalToast()
const deleting = ref(false)

const onDeleteAccount = async () => {
  const currentUser = userStore.user
  if (!currentUser || deleting.value) return

  const ok = await confirmAction({
    title: "注销账号",
    message: `确定要永久注销「${currentUser.username}」吗？此操作不可撤销。`,
    confirmText: "确认注销",
    danger: true,
  })
  if (!ok) return

  deleting.value = true
  try {
    await userService.deleteAccount(currentUser.id)
    // 后端已清 Cookie；本地状态兜底清理后回首页
    userStore.clearUser()
    toast.success("账号已注销，感谢使用")
    void router.push("/")
  } catch (e: unknown) {
    toast.error((e as Error).message || "注销失败，请稍后重试")
  } finally {
    deleting.value = false
  }
}
</script>
