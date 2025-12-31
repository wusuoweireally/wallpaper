<template>
  <div class="comment-reply-form bg-base-100 border border-base-200 rounded-lg p-3">
    <div class="form-control">
      <textarea
        v-model="content"
        class="textarea textarea-bordered textarea-sm"
        :placeholder="placeholder"
        maxlength="1000"
        @keydown.ctrl.enter="handleSubmit"
        @input="handleInput"
        ref="textareaRef"
      ></textarea>
      <div class="flex items-center justify-between mt-2">
        <div class="text-xs text-gray-500">
          {{ content.length }}/1000
        </div>
        <div class="flex gap-2">
          <button
            class="btn btn-ghost btn-xs"
            @click="handleCancel"
          >
            取消
          </button>
          <button
            class="btn btn-primary btn-xs"
            @click="handleSubmit"
            :disabled="!content.trim() || loading"
          >
            {{ loading ? '发送中...' : '发送 (Ctrl+Enter)' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 表情选择器 -->
    <div class="flex items-center gap-2 mt-2">
      <div class="dropdown dropdown-top">
        <label
          tabindex="0"
          class="btn btn-ghost btn-xs btn-circle"
        >
          😊
        </label>
        <div
          tabindex="0"
          class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48"
        >
          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="emoji in emojis"
              :key="emoji"
              class="btn btn-ghost btn-xs p-1 text-lg hover:bg-primary/10"
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>

      <!-- 快捷操作提示 -->
      <div class="text-xs text-gray-500">
        支持 @用户 提及
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';

// 组件属性
interface Props {
  parentId?: number; // 父评论ID
  placeholder?: string; // 输入框占位符
  initialContent?: string; // 初始内容
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '写下你的回复...',
  initialContent: '',
});

// 组件事件
const emit = defineEmits<{
  submit: [content: string];
  cancel: [];
}>();

// 组件引用
const textareaRef = ref<HTMLTextAreaElement>();

// 响应式数据
const content = ref(props.initialContent);
const loading = ref(false);

// 常用表情符号
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
  '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝',
  '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑',
  '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪',
  '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
  '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎',
  '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯',
  '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥',
  '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩',
  '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
  '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽',
  '👾', '🤖', '❤️', '🧡', '💛', '💚', '💙', '💜',
  '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓',
  '💗', '💖', '💘', '💝', '👍', '👎', '👌', '✌️',
  '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇',
  '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '✊',
  '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏',
  '🤝', '💪', '✨', '🔥', '💥', '💫', '💦', '💨',
  '🌟', '⭐', '🌠', '☀️', '🌞', '🌤️', '⛅', '🌥️',
];

// 方法
const handleSubmit = async () => {
  if (!content.value.trim() || loading.value) {
    return;
  }

  try {
    loading.value = true;
    emit('submit', content.value.trim());
    content.value = '';
  } catch (error) {
    console.error('发送回复失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  content.value = '';
  emit('cancel');
};

const handleInput = () => {
  // 自动调整文本框高度
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px';
  }
};

const insertEmoji = (emoji: string) => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = content.value;

  content.value = text.substring(0, start) + emoji + text.substring(end);

  // 重新设置光标位置
  nextTick(() => {
    const newCursorPos = start + emoji.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
  });
};

// 生命周期
onMounted(() => {
  // 自动聚焦到输入框
  if (textareaRef.value) {
    textareaRef.value.focus();
    handleInput();
  }
});
</script>

<style scoped>
.textarea {
  resize: none;
  min-height: 60px;
  max-height: 120px;
}
</style>
