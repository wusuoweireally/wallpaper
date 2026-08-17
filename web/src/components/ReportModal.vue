<template>
  <dialog ref="reportModal" class="wb-dialog">
    <div class="wb-dialog-box max-w-lg">
      <h3 class="mb-4 text-lg font-bold">举报内容</h3>

      <form @submit.prevent="handleSubmit">
        <!-- 举报原因 -->
        <div class="mb-4">
          <label class="mb-1 block">
            <span class="text-sm font-medium text-muted"
              >举报原因 <span class="text-error">*</span></span
            >
          </label>
          <select
            v-model="formData.reason"
            class="wb-input"
            :class="{ 'select-error': errors.reason }"
            @change="validateReason"
            required
          >
            <option value="">请选择举报原因</option>
            <option v-for="reason in reportReasons" :key="reason.value" :value="reason.value">
              {{ reason.label }} - {{ reason.description }}
            </option>
          </select>
          <label class="mb-1 block" v-if="errors.reason">
            <span class="text-xs text-error text-faint">{{ errors.reason }}</span>
          </label>
        </div>

        <!-- 举报描述 -->
        <div class="mb-6">
          <label class="mb-1 block">
            <span class="text-sm font-medium text-muted"
              >详细说明 <span class="text-xs text-faint">(可选)</span></span
            >
          </label>
          <textarea
            v-model="formData.description"
            placeholder="请详细描述您举报的原因，有助于我们更好地处理"
            class="wb-input h-24"
            maxlength="500"
          ></textarea>
          <div class="mb-1 block">
            <span class="text-xs text-faint">{{ formData.description.length }}/500</span>
          </div>
        </div>

        <!-- 举报说明 -->
        <div class="wb-alert mb-6">
          <i class="i-[mdi--information]"></i>
          <div>
            <p class="font-semibold">举报说明</p>
            <ul class="mt-1 space-y-1 text-sm">
              <li>• 请确保举报内容真实有效</li>
              <li>• 恶意举报可能会影响您的账户信誉</li>
              <li>• 我们会在24小时内处理您的举报</li>
              <li>• 处理结果将通过通知告知您</li>
            </ul>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="wb-btn-ghost" @click="closeModal" :disabled="submitting">
            取消
          </button>
          <button type="submit" class="wb-btn-primary" :disabled="submitting || !isFormValid">
            <span class="wb-spinner" v-if="submitting"></span>
            {{ submitting ? "提交中…" : "提交举报" }}
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from "vue"
import { reportService, type CreateReportDto } from "@/services/report"
import { useUserStore } from "@/stores/user"
import { useGlobalToast } from "@/composables/useToast"
import { confirmAction } from "@/composables/useConfirm"

// Props
interface Props {
  targetType: "post" | "comment"
  targetId: number
}

const props = defineProps<Props>()

// Emits
import type { ReportReason } from "@/services/report"

const emit = defineEmits<{
  success: []
}>()

// 组件引用
const reportModal = ref<HTMLDialogElement>()
const userStore = useUserStore()
const toast = useGlobalToast()

// 响应式数据
const submitting = ref(false)
const reportReasons = ref<ReportReason[]>([])

// 表单数据
const formData = reactive<CreateReportDto>({
  targetType: props.targetType,
  targetId: props.targetId,
  reason: "",
  description: "",
})

// 表单错误
const errors = reactive({
  reason: "",
})

// 计算属性
const isFormValid = computed(() => {
  return formData.reason && !errors.reason
})

// 方法
const validateReason = () => {
  if (!formData.reason) {
    errors.reason = "请选择举报原因"
  } else {
    errors.reason = ""
  }
}

const loadReportReasons = async () => {
  try {
    const reasons = await reportService.getReportReasons()
    reportReasons.value = reasons
  } catch (error) {
    console.error("加载举报原因失败:", error)
  }
}

const handleSubmit = async () => {
  // 验证表单
  validateReason()

  if (!isFormValid.value) {
    return
  }

  if (!userStore.isLoggedIn) {
    toast.error("请先登录后再进行举报")
    return
  }

  const ok = await confirmAction({
    title: "提交举报",
    message: "确定要提交举报吗？",
    confirmText: "提交",
  })
  if (!ok) return

  try {
    submitting.value = true

    await reportService.createReport(formData)

    toast.success("举报已提交，我们会尽快处理")
    emit("success")
    closeModal()
  } catch (error: unknown) {
    console.error("提交举报失败:", error)
    toast.error((error as Error).message || "举报提交失败，请稍后重试")
  } finally {
    submitting.value = false
  }
}

const openModal = () => {
  reportModal.value?.showModal()
}

const closeModal = () => {
  reportModal.value?.close()
  resetForm()
}

const resetForm = () => {
  formData.reason = ""
  formData.description = ""
  errors.reason = ""
}

watch(
  () => [props.targetType, props.targetId],
  ([targetType, targetId]) => {
    formData.targetType = targetType
    formData.targetId = targetId
  },
)

// 暴露方法给父组件
defineExpose({
  openModal,
  closeModal,
})

// 生命周期
onMounted(() => {
  loadReportReasons()
})
</script>
