<template>
  <div class="rounded-2xl border border-red-100 bg-white shadow-sm">
    <div class="p-8">
      <!-- 头部区域 -->
      <div class="mb-8 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50"
          >
            <i class="i-mdi-alert-circle text-xl text-red-500"></i>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-900">注销账号</h3>
            <p class="mt-1 text-sm text-gray-500">此操作不可撤销，请谨慎操作</p>
          </div>
        </div>
      </div>

      <!-- 警告信息 -->
      <div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-6">
        <h4 class="mb-4 flex items-center gap-2 font-medium text-red-900">
          <i class="i-mdi-warning text-lg"></i>
          注销账号将永久删除以下内容：
        </h4>
        <ul class="space-y-3 text-sm text-red-800">
          <li class="flex items-start gap-2">
            <i class="i-mdi-close-circle mt-0.5 text-red-500"></i>
            <span>所有上传的壁纸文件和相关数据</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="i-mdi-close-circle mt-0.5 text-red-500"></i>
            <span>收藏、点赞、下载历史记录</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="i-mdi-close-circle mt-0.5 text-red-500"></i>
            <span>个人资料、评论和通知信息</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="i-mdi-close-circle mt-0.5 text-red-500"></i>
            <span>账号积分和所有相关权益</span>
          </li>
        </ul>
      </div>

      <!-- 注意事项 -->
      <div class="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h4 class="mb-3 flex items-center gap-2 font-medium text-gray-900">
          <i class="i-mdi-information text-lg"></i>
          操作前请确认
        </h4>
        <ul class="space-y-2 text-sm text-gray-600">
          <li class="flex items-start gap-2">
            <i class="i-mdi-check mt-0.5 text-green-500"></i>
            <span>已备份重要的个人数据和壁纸文件</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="i-mdi-check mt-0.5 text-green-500"></i>
            <span>了解所有数据将被永久删除且无法恢复</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="i-mdi-check mt-0.5 text-green-500"></i>
            <span>确认注销后需要重新注册新账号</span>
          </li>
        </ul>
      </div>

      <!-- 替代方案提示 -->
      <div class="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p class="text-sm text-blue-800">
          <i class="i-mdi-lightbulb mr-2 text-blue-500"></i>
          <strong>温馨提示：</strong
          >如果只是遇到账号安全问题，建议先修改密码或联系管理员协助处理，无需注销账号。
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">如有疑问，请联系客服或管理员</p>
        <button
          @click="showDeleteConfirm = true"
          class="rounded-lg bg-red-600 px-6 py-3 font-medium text-white shadow-sm transition-colors duration-200 hover:bg-red-700 hover:shadow-md"
        >
          <i class="i-mdi-trash-can mr-2"></i>
          确认注销账号
        </button>
      </div>
    </div>
  </div>

  <!-- 注销确认模态框 -->
  <teleport to="body" :disabled="!isMounted">
    <transition name="modal" appear>
      <div
        v-if="showDeleteConfirm && isMounted"
        class="bg-opacity-50 fixed inset-0 z-[9999] flex items-center justify-center bg-black p-4"
      >
        <div
          class="w-full max-w-lg transform rounded-2xl bg-white p-6 shadow-xl transition-all"
        >
          <div class="mb-6 flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
            >
              <i class="i-mdi-alert text-2xl text-red-600"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">最终确认</h3>
              <p class="text-sm text-gray-500">此操作无法撤销</p>
            </div>
          </div>

          <div class="mb-6 space-y-4">
            <p class="text-gray-700">您确定要注销账号吗？删除后：</p>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-start gap-2">
                <i class="i-mdi-arrow-right mt-0.5 text-gray-400"></i>
                <span>所有数据将立即永久删除</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="i-mdi-arrow-right mt-0.5 text-gray-400"></i>
                <span>账号将无法恢复</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="i-mdi-arrow-right mt-0.5 text-gray-400"></i>
                <span>需要重新注册才能使用服务</span>
              </li>
            </ul>
          </div>

          <div class="flex gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              @click="deleteAccount"
              class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-red-700"
            >
              确认注销
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

// 注销确认弹窗显示状态
const showDeleteConfirm = ref(false);

// 组件是否已经挂载
const isMounted = ref(false);

// 组件挂载时标记
onMounted(() => {
  isMounted.value = true;
});

// 注销账号
const deleteAccount = async () => {
  try {
    // 防御性检查，确保组件仍然挂载
    if (!isMounted.value) {
      return;
    }

    // 这里需要调用后端的账号删除接口
    // 由于后端目前没有账号删除接口，暂时提示用户
    alert("账号注销功能暂未开放，请联系管理员");

    // 在关闭模态框前检查组件状态
    if (isMounted.value) {
      showDeleteConfirm.value = false;
    }
  } catch (error) {
    console.error("注销账号失败:", error);

    // 确保组件仍然存在时才显示错误
    if (isMounted.value) {
      alert("注销账号失败，请重试");
    }
  }
};

// 组件卸载时清理资源
onUnmounted(() => {
  // 标记组件已卸载
  isMounted.value = false;

  // 强制关闭模态框
  showDeleteConfirm.value = false;

  // 清理 body 上的可能的 overflow 样式
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }

  // 清理任何可能的 Teleport 残留元素
  const teleportElements = document.querySelectorAll('[data-teleport]');
  teleportElements.forEach(el => el.remove());
});
</script>

<style scoped>
/* 样式已通过 Tailwind CSS 类实现 */

/* 模态框过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .transform,
.modal-leave-active .transform {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.modal-enter-from .transform,
.modal-leave-to .transform {
  transform: scale(0.9);
  opacity: 0;
}
</style>
