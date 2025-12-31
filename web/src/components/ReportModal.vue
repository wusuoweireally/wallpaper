<template>
  <dialog ref="reportModal" class="modal">
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-4">举报内容</h3>

      <form @submit.prevent="handleSubmit">
        <!-- 举报原因 -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text font-medium">举报原因 <span class="text-error">*</span></span>
          </label>
          <select
            v-model="formData.reason"
            class="select select-bordered"
            :class="{ 'select-error': errors.reason }"
            @change="validateReason"
            required
          >
            <option value="">请选择举报原因</option>
            <option
              v-for="reason in reportReasons"
              :key="reason.value"
              :value="reason.value"
            >
              {{ reason.label }} - {{ reason.description }}
            </option>
          </select>
          <label class="label" v-if="errors.reason">
            <span class="label-text-alt text-error">{{ errors.reason }}</span>
          </label>
        </div>

        <!-- 举报描述 -->
        <div class="form-control mb-6">
          <label class="label">
            <span class="label-text font-medium">详细说明 <span class="text-xs text-gray-500">(可选)</span></span>
          </label>
          <textarea
            v-model="formData.description"
            placeholder="请详细描述您举报的原因，有助于我们更好地处理"
            class="textarea textarea-bordered h-24"
            maxlength="500"
          ></textarea>
          <div class="label">
            <span class="label-text-alt">{{ formData.description.length }}/500</span>
          </div>
        </div>

        <!-- 举报说明 -->
        <div class="alert alert-info mb-6">
          <i class="i-mdi-information"></i>
          <div>
            <p class="font-semibold">举报说明</p>
            <ul class="text-sm mt-1 space-y-1">
              <li>• 请确保举报内容真实有效</li>
              <li>• 恶意举报可能会影响您的账户信誉</li>
              <li>• 我们会在24小时内处理您的举报</li>
              <li>• 处理结果将通过通知告知您</li>
            </ul>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            @click="closeModal"
            :disabled="submitting"
          >
            取消
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting || !isFormValid"
          >
            <span class="loading loading-spinner loading-sm" v-if="submitting"></span>
            {{ submitting ? '提交中...' : '提交举报' }}
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { reportService, type CreateReportDto } from '@/services/report';
import { useUserStore } from '@/stores';

// Props
interface Props {
  targetType: 'post' | 'comment';
  targetId: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  success: [];
}>();

// 组件引用
const reportModal = ref<HTMLDialogElement>();
const userStore = useUserStore();

// 响应式数据
const submitting = ref(false);
const reportReasons = ref<any[]>([]);

// 表单数据
const formData = reactive<CreateReportDto>({
  targetType: props.targetType,
  targetId: props.targetId,
  reason: '',
  description: '',
});

// 表单错误
const errors = reactive({
  reason: '',
});

// 计算属性
const isFormValid = computed(() => {
  return formData.reason && !errors.reason;
});

// 方法
const validateReason = () => {
  if (!formData.reason) {
    errors.reason = '请选择举报原因';
  } else {
    errors.reason = '';
  }
};

const loadReportReasons = async () => {
  try {
    const reasons = await reportService.getReportReasons();
    reportReasons.value = reasons;
  } catch (error) {
    console.error('加载举报原因失败:', error);
  }
};

const handleSubmit = async () => {
  // 验证表单
  validateReason();

  if (!isFormValid.value) {
    return;
  }

  if (!userStore.isLoggedIn) {
    alert('请先登录后再进行举报');
    return;
  }

  if (!confirm('确定要提交举报吗？')) {
    return;
  }

  try {
    submitting.value = true;

    await reportService.createReport(formData);

    alert('举报提交成功，我们会尽快处理');
    emit('success');
    closeModal();

  } catch (error: any) {
    console.error('提交举报失败:', error);
    alert(error.message || '举报提交失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

const openModal = () => {
  reportModal.value?.showModal();
};

const closeModal = () => {
  reportModal.value?.close();
  resetForm();
};

const resetForm = () => {
  formData.reason = '';
  formData.description = '';
  errors.reason = '';
};

watch(
  () => [props.targetType, props.targetId],
  ([targetType, targetId]) => {
    formData.targetType = targetType;
    formData.targetId = targetId;
  },
);

// 暴露方法给父组件
defineExpose({
  openModal,
  closeModal,
});

// 生命周期
onMounted(() => {
  loadReportReasons();
});
</script>

<style scoped>
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
