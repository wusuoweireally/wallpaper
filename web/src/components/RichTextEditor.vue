<template>
  <div class="simple-editor">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxLength"
      :style="{ height: height }"
      class="editor-textarea"
      @input="handleInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
    ></textarea>

    <!-- 状态栏 -->
    <div class="editor-status" v-if="showStatus">
      <span class="text-xs text-gray-500">{{ charCount }} 字符</span>
      <span class="text-xs text-gray-400" v-if="maxLength">/ {{ maxLength }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
  maxLength?: number;
  height?: string;
  showStatus?: boolean;
  autoResize?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  maxLength: 10000,
  height: '400px',
  showStatus: true,
  autoResize: true,
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const textareaRef = ref<HTMLTextAreaElement>();
const isFocused = ref(false);

const charCount = computed(() => {
  return props.modelValue.length;
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  const value = target.value;

  emit('update:modelValue', value);
  emit('change', value);

  // 自动调整高度
  if (props.autoResize && textareaRef.value) {
    nextTick(() => {
      autoResize();
    });
  }
};

const autoResize = () => {
  if (!textareaRef.value) return;

  const textarea = textareaRef.value;
  textarea.style.height = 'auto';

  const scrollHeight = textarea.scrollHeight;
  const minHeight = parseInt(props.height) || 400;

  if (scrollHeight > minHeight) {
    textarea.style.height = scrollHeight + 'px';
  } else {
    textarea.style.height = minHeight + 'px';
  }
};

onMounted(() => {
  if (props.autoResize) {
    nextTick(() => {
      autoResize();
    });
  }
});

watch(() => props.modelValue, () => {
  if (props.autoResize) {
    nextTick(() => {
      autoResize();
    });
  }
});

defineExpose({
  focus: () => textareaRef.value?.focus(),
  blur: () => textareaRef.value?.blur(),
});
</script>

<style scoped>
.simple-editor {
  width: 100%;
}

.editor-textarea {
  width: 100%;
  min-height: 400px;
  padding: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  resize: vertical;
  outline: none;
  transition: all 0.2s;
  background-color: white;
}

.editor-textarea:hover {
  border-color: #9ca3af;
}

.editor-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.editor-textarea:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.editor-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 8px 8px;
}
</style>
