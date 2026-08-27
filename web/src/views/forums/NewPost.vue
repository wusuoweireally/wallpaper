<template>
  <div class="wb-page">
    <div class="wb-container py-5">
      <!-- Header -->
      <div class="wb-page-head mb-5 flex items-center justify-between">
        <div>
          <h1 class="wb-page-title">发布新帖子</h1>
          <p class="mt-0.5 text-xs text-muted">
            把灵感、案例或技巧写下来，让更多壁纸爱好者看到你的创意
          </p>
        </div>
        <div class="flex gap-3">
          <button class="wb-btn-ghost" @click="router.back()">取消</button>
          <button
            class="wb-btn-primary"
            @click="publishPost"
            :disabled="isSubmitting || !isFormValid"
          >
            {{ isSubmitting ? "发布中…" : "发布帖子" }}
          </button>
        </div>
      </div>

      <!-- 草稿恢复提示 -->
      <div
        v-if="hasRestoredDraft"
        class="mb-6 flex items-center justify-between rounded-control border border-warning/30 bg-[color:var(--wb-warning-subtle)] p-4"
      >
        <div class="flex items-center gap-2">
          <i class="i-[mdi--file-restore] text-[color:var(--wb-warning)]"></i>
          <span class="text-sm font-medium text-[color:var(--wb-warning)]">
            已恢复上次未发布的草稿
          </span>
        </div>
        <button class="wb-btn-ghost wb-btn-xs text-[color:var(--wb-warning)]" @click="clearDraft">
          清除草稿
        </button>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main Content -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Title -->
          <div class="wb-card p-6">
            <label class="mb-2 block text-sm font-semibold text-fg">
              标题 <span class="text-error">*</span>
            </label>
            <input
              v-model="formData.title"
              type="text"
              placeholder="请输入帖子标题，建议不超过50字"
              class="wb-input w-full"
              maxlength="100"
              @input="validateTitle"
            />
            <div class="mt-2 flex justify-between text-xs text-faint">
              <span v-if="errors.title" class="text-error">{{ errors.title }}</span>
              <span class="ml-auto">{{ formData.title.length }}/100</span>
            </div>
          </div>

          <!-- Category -->
          <div class="wb-card p-6">
            <label class="mb-2 block text-sm font-semibold text-fg">
              分类 <span class="text-error">*</span>
            </label>
            <select v-model="formData.category" class="wb-input w-full" @change="validateCategory">
              <option value="">请选择分类</option>
              <option value="tech_discussion">技术讨论</option>
              <option value="experience_sharing">经验分享</option>
              <option value="q_a">问答求助</option>
              <option value="resource_sharing">资源分享</option>
            </select>
            <div class="mt-2 text-xs text-error" v-if="errors.category">
              {{ errors.category }}
            </div>
          </div>

          <!-- Content -->
          <div class="wb-card p-6">
            <label class="mb-2 block text-sm font-semibold text-fg">
              内容 <span class="text-error">*</span>
            </label>
            <RichTextEditor
              v-model="formData.content"
              placeholder="请输入帖子内容，空行分段会更易读…"
              :maxlength="10000"
              height="400px"
              @change="validateContent"
            />
            <div class="mt-2 text-xs text-error" v-if="errors.content">{{ errors.content }}</div>
          </div>

          <!-- Tags -->
          <div class="wb-card p-6">
            <label class="mb-2 block text-sm font-semibold text-fg">标签</label>
            <input
              v-model="formData.tags"
              type="text"
              placeholder="用逗号分隔，最多 5 个，如：风景, 4K, 摄影后期"
              class="wb-input w-full"
            />
            <p class="mt-2 text-xs text-faint">合适的标签能帮帖子被更多人发现</p>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Publishing Guide -->
          <div class="wb-card p-5">
            <div class="mb-4 flex items-center gap-2">
              <i class="i-[mdi--lightbulb-on-outline] text-lg text-warning"></i>
              <h3 class="font-semibold text-fg">发布指南</h3>
            </div>
            <ul class="space-y-3 text-sm text-muted">
              <li class="flex items-start gap-2">
                <i class="i-[mdi--check] text-success" aria-hidden="true"></i>
                <span>标题突出主题，便于检索</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="i-[mdi--check] text-success" aria-hidden="true"></i>
                <span>内容可包含创作思路、配色方案或技术要点</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="i-[mdi--check] text-success" aria-hidden="true"></i>
                <span>标签最多 5 个，帮助系统推荐给合适的人</span>
              </li>
              <li class="flex items-start gap-2">
                <i class="i-[mdi--check] text-success" aria-hidden="true"></i>
                <span>随时预览或保存草稿，稍后继续编辑</span>
              </li>
            </ul>
            <div class="mt-5 flex flex-col gap-2">
              <button class="wb-btn wb-btn-sm" @click="previewPost" :disabled="!hasContent">
                预览帖子
              </button>
              <button
                class="wb-btn wb-btn-sm"
                @click="saveDraft"
                :disabled="isSubmitting || !hasContent"
              >
                存为草稿
              </button>
              <button class="wb-btn-ghost wb-btn-sm" @click="router.back()">返回上一页</button>
            </div>
          </div>

          <!-- Live Preview -->
          <div class="wb-card p-5">
            <h3 class="mb-4 flex items-center gap-2 font-semibold text-fg">
              <i class="i-[mdi--eye-outline]"></i>
              实时预览
            </h3>
            <div class="rounded-control border border-line bg-subtle p-4">
              <h4 class="text-lg font-bold text-fg">
                {{ formData.title || "请输入标题" }}
              </h4>
              <div class="mt-2 text-sm text-muted">
                <span class="wb-chip">
                  {{ postCategoryLabel(formData.category) }}
                </span>
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                class="mt-3 line-clamp-3 text-sm text-muted"
                v-if="formData.content"
                v-html="sanitizeHtml(formData.content)"
              ></div>
              <div class="mt-3 text-xs text-faint" v-else>预览内容将在这里显示</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <dialog ref="previewModal" class="wb-dialog">
      <div class="wb-dialog-box max-w-4xl">
        <h3 class="mb-4 text-lg font-bold">帖子预览</h3>
        <div class="custom-prose max-w-none">
          <h2 class="text-xl font-semibold">{{ formData.title || "无标题" }}</h2>
          <div class="wb-chip mt-2">{{ postCategoryLabel(formData.category) }}</div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="mt-4" v-html="sanitizeHtml(formData.content) || '<p>无内容</p>'"></div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="wb-btn-ghost" @click="closePreview">关闭</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from "vue"
import { useRouter } from "vue-router"
import { forumService, type CreatePostDto } from "@/services/forum"
import { useUserStore } from "@/stores/user"
import { postCategoryLabel } from "@/stores/forum"
import RichTextEditor from "@/components/RichTextEditor.vue"
import { sanitizeHtml, stripHtml } from "@/utils/htmlSanitizer"
import { useGlobalToast } from "@/composables/useToast"

const router = useRouter()
const userStore = useUserStore()
const toast = useGlobalToast()

const isSubmitting = ref(false)
const hasRestoredDraft = ref(false)
const previewModal = ref<HTMLDialogElement>()

const formData = reactive<
  Omit<CreatePostDto, "category"> & {
    category: CreatePostDto["category"] | ""
  }
>({
  title: "",
  content: "",
  tags: "",
  category: "" as CreatePostDto["category"] | "",
})

const errors = reactive({
  title: "",
  category: "",
  content: "",
})

const hasContent = computed(() => {
  return formData.title.trim() || formData.content.trim()
})

const isFormValid = computed(() => {
  return (
    formData.title.trim() &&
    formData.content.trim() &&
    formData.category &&
    !errors.title &&
    !errors.category &&
    !errors.content
  )
})

const validateTitle = () => {
  if (!formData.title.trim()) {
    errors.title = "标题不能为空"
  } else if (formData.title.trim().length < 5) {
    errors.title = "标题至少需要5个字符"
  } else {
    errors.title = ""
  }
}

const validateCategory = () => {
  errors.category = formData.category ? "" : "请选择帖子分类"
}

const validateContent = () => {
  if (!formData.content.trim()) {
    errors.content = "内容不能为空"
  } else if (stripHtml(formData.content).length < 10) {
    errors.content = "内容至少需要10个字符"
  } else {
    errors.content = ""
  }
}

const saveDraft = () => {
  localStorage.setItem("forum_post_draft", JSON.stringify(formData))
  toast.success("草稿已保存")
}

const previewPost = () => {
  previewModal.value?.showModal()
}

const closePreview = () => {
  previewModal.value?.close()
}

const publishPost = async () => {
  validateTitle()
  validateCategory()
  validateContent()

  if (!isFormValid.value) {
    toast.warning("请填写所有必填字段")
    return
  }

  if (!userStore.isLoggedIn) {
    toast.error("请先登录后再发布帖子")
    router.push("/auth/login")
    return
  }

  try {
    isSubmitting.value = true

    const postData: CreatePostDto = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      category: formData.category as CreatePostDto["category"],
      // 逗号分隔，最多取 5 个（与后端/列表筛选约定一致）
      tags: formData.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5)
        .join(","),
    }

    const newPost = await forumService.createPost(postData)

    localStorage.removeItem("forum_post_draft")

    toast.success("帖子发布成功")
    router.push(`/forums/post/${newPost.id}`)
  } catch (error: unknown) {
    const err = error as Error & { message?: string }
    console.error("发布帖子失败:", err)
    toast.error(err.message || "发布帖子失败，请稍后重试")
  } finally {
    isSubmitting.value = false
  }
}

// 页面加载时恢复草稿
const restoreDraft = () => {
  try {
    const saved = localStorage.getItem("forum_post_draft")
    if (saved) {
      const draft = JSON.parse(saved)
      if (draft.title || draft.content) {
        formData.title = draft.title || ""
        formData.content = draft.content || ""
        formData.category = draft.category || ""
        formData.tags = draft.tags || ""
        hasRestoredDraft.value = true
      }
    }
  } catch {
    // 忽略解析错误
  }
}

const clearDraft = () => {
  localStorage.removeItem("forum_post_draft")
  formData.title = ""
  formData.content = ""
  formData.category = ""
  formData.tags = ""
  hasRestoredDraft.value = false
}

onMounted(() => {
  restoreDraft()
})

// Save draft before page unload (only if has content)
const saveDraftHandler = () => {
  if (hasContent.value) {
    localStorage.setItem("forum_post_draft", JSON.stringify(formData))
  }
}
window.addEventListener("beforeunload", saveDraftHandler)
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", saveDraftHandler)
})
</script>
