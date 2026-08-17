<template>
  <div class="comment-reply-form rounded-lg border border-line bg-surface p-3">
    <div class="">
      <textarea
        v-model="content"
        class="wb-input resize-none"
        :placeholder="placeholder"
        maxlength="1000"
        @keydown.ctrl.enter="handleSubmit"
        @input="handleInput"
        ref="textareaRef"
      ></textarea>
      <div class="mt-2 flex items-center justify-between">
        <div class="text-xs text-faint">{{ content.length }}/1000</div>
        <div class="flex gap-2">
          <button class="wb-btn-ghost wb-btn-xs" @click="handleCancel">取消</button>
          <button
            class="wb-btn-primary wb-btn-xs"
            @click="handleSubmit"
            :disabled="!content.trim() || loading"
          >
            {{ loading ? "发送中…" : "发送 (Ctrl+Enter)" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 表情选择器 -->
    <div class="mt-2 flex items-center gap-2">
      <div class="wb-drop wb-drop-top">
        <label tabindex="0" class="wb-btn-ghost wb-btn-xs"> 😊 </label>
        <div tabindex="0" class="wb-drop-panel w-48 bg-surface p-2 shadow">
          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="emoji in emojis"
              :key="emoji"
              class="wb-btn-ghost wb-btn-xs p-1 text-lg hover:bg-primary/10"
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>

      <!-- 快捷操作提示 -->
      <div class="text-xs text-faint">支持 @用户 提及</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from "vue"

// 组件属性
interface Props {
  parentId?: number // 父评论ID
  placeholder?: string // 输入框占位符
  initialContent?: string // 初始内容
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "写下你的回复…",
  initialContent: "",
})

// 组件事件
const emit = defineEmits<{
  submit: [content: string]
  cancel: []
}>()

// 组件引用
const textareaRef = ref<HTMLTextAreaElement>()

// 响应式数据
const content = ref(props.initialContent)
const loading = ref(false)

// 常用表情符号
const emojis = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤗",
  "🤭",
  "🤫",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "🤥",
  "😔",
  "😪",
  "🤤",
  "😴",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🤧",
  "🥵",
  "🥶",
  "🥴",
  "😵",
  "🤯",
  "🤠",
  "🥳",
  "😎",
  "🤓",
  "🧐",
  "😕",
  "😟",
  "🙁",
  "☹️",
  "😮",
  "😯",
  "😲",
  "😳",
  "🥺",
  "😦",
  "😧",
  "😨",
  "😰",
  "😥",
  "😢",
  "😭",
  "😱",
  "😖",
  "😣",
  "😞",
  "😓",
  "😩",
  "😫",
  "🥱",
  "😤",
  "😡",
  "😠",
  "🤬",
  "😈",
  "👿",
  "💀",
  "☠️",
  "💩",
  "🤡",
  "👹",
  "👺",
  "👻",
  "👽",
  "👾",
  "🤖",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💔",
  "❣️",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",
  "👍",
  "👎",
  "👌",
  "✌️",
  "🤞",
  "🤟",
  "🤘",
  "🤙",
  "👈",
  "👉",
  "👆",
  "👇",
  "☝️",
  "✋",
  "🤚",
  "🖐️",
  "🖖",
  "👋",
  "🤏",
  "✊",
  "👊",
  "🤛",
  "🤜",
  "👏",
  "🙌",
  "👐",
  "🤲",
  "🙏",
  "🤝",
  "💪",
  "✨",
  "🔥",
  "💥",
  "💫",
  "💦",
  "💨",
  "🌟",
  "⭐",
  "🌠",
  "☀️",
  "🌞",
  "🌤️",
  "⛅",
  "🌥️",
]

// 方法
const handleSubmit = async () => {
  if (!content.value.trim() || loading.value) {
    return
  }

  try {
    loading.value = true
    emit("submit", content.value.trim())
  } catch (error) {
    console.error("发送回复失败:", error)
  } finally {
    loading.value = false
  }
}

/** 发送成功后由父组件调用，失败时保留内容供重试 */
const clear = () => {
  content.value = ""
}
defineExpose({ clear })

const handleCancel = () => {
  content.value = ""
  emit("cancel")
}

const handleInput = () => {
  // 自动调整文本框高度
  if (textareaRef.value) {
    textareaRef.value.style.height = "auto"
    textareaRef.value.style.height = textareaRef.value.scrollHeight + "px"
  }
}

const insertEmoji = (emoji: string) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = content.value

  content.value = text.substring(0, start) + emoji + text.substring(end)

  // 重新设置光标位置
  nextTick(() => {
    const newCursorPos = start + emoji.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
  })
}

// 生命周期
onMounted(() => {
  // 自动聚焦到输入框
  if (textareaRef.value) {
    textareaRef.value.focus()
    handleInput()
  }
})
</script>
