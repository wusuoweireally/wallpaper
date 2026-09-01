<template>
  <div class="wb-page">
    <div class="wb-container space-y-6 py-5">
      <!-- 头部：标题 + 操作按钮 -->
      <div class="wb-page-head">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-1">
            <h1 class="wb-page-title">编辑帖子</h1>
            <p class="max-w-xl text-xs text-muted">
              修正、补充或更新内容，保存后会记录最新编辑时间。
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button class="wb-btn-ghost" @click="handleCancel">
              <i class="i-[mdi--close] text-lg"></i>
              取消
            </button>
            <button class="wb-btn" @click="resetToOriginal" :disabled="!hasChanges">
              <i class="i-[mdi--restore] text-lg"></i>
              恢复原始
            </button>
            <button class="wb-btn" @click="previewPost" :disabled="!hasContent">
              <i class="i-[mdi--eye] text-lg"></i>
              预览
            </button>
            <button
              class="wb-btn-primary"
              @click="submitUpdate"
              :disabled="isSubmitting || !isFormValid"
            >
              <i class="i-[mdi--content-save] text-lg" v-if="!isSubmitting"></i>
              <span class="wb-spinner" v-else></span>
              <span class="font-medium">{{ isSubmitting ? "更新中…" : "保存修改" }}</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex min-h-[40vh] items-center justify-center">
        <div class="flex flex-col items-center gap-3 text-muted">
          <span class="wb-spinner wb-spinner-lg"></span>
          <p class="text-sm">正在加载帖子…</p>
        </div>
      </div>

      <div v-else-if="error" class="wb-alert-danger">
        <i class="i-[mdi--alert-circle] text-2xl"></i>
        <span>{{ error }}</span>
        <button class="wb-btn-ghost wb-btn-sm" @click="router.back()">返回</button>
      </div>

      <div v-else-if="originalPost" class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <!-- 表单 -->
        <div class="wb-card space-y-7 p-6">
          <div class="grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-fg">
                标题 <span class="text-error">*</span>
              </label>
              <input
                v-model="formData.title"
                type="text"
                placeholder="请输入帖子标题，建议不超过50字"
                class="wb-input w-full"
                :class="{ 'has-error': errors.title }"
                @input="validateTitle"
                maxlength="100"
              />
              <div class="mt-1 flex justify-between text-xs">
                <span class="text-error" v-if="errors.title">{{ errors.title }}</span>
                <span class="ml-auto text-faint">{{ (formData.title || "").length }}/100</span>
              </div>
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-fg">
                分类 <span class="text-error">*</span>
              </label>
              <select
                v-model="formData.category"
                class="wb-input w-full cursor-pointer"
                :class="{ 'has-error': errors.category }"
                @change="validateCategory"
              >
                <option value="" disabled>请选择分类</option>
                <option value="tech_discussion">技术讨论</option>
                <option value="experience_sharing">经验分享</option>
                <option value="q_a">问答求助</option>
                <option value="resource_sharing">资源分享</option>
              </select>
              <div class="mt-1 text-xs text-error" v-if="errors.category">
                {{ errors.category }}
              </div>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-fg">
              内容 <span class="text-error">*</span>
            </label>
            <div
              class="overflow-hidden rounded-control border border-line transition-colors focus-within:border-primary"
            >
              <RichTextEditor
                v-model="formData.content"
                placeholder="请输入帖子内容，空行分段会更易读…"
                :maxlength="10000"
                height="400px"
                @change="validateContent"
              />
            </div>
            <div class="mt-1 text-xs text-error" v-if="errors.content">
              {{ errors.content }}
            </div>
          </div>

          <div class="grid gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-fg">
                摘要 <span class="text-xs font-normal text-faint">(可选)</span>
              </label>
              <textarea
                v-model="formData.summary"
                placeholder="请输入帖子摘要，有助于其他用户快速了解内容"
                class="wb-input h-28 w-full resize-none"
                maxlength="200"
              ></textarea>
              <div class="mt-1 text-xs text-faint">{{ (formData.summary || "").length }}/200</div>
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-fg">
                标签 <span class="text-xs font-normal text-faint">(可选)</span>
              </label>
              <div class="mb-3 flex flex-wrap gap-2">
                <span v-for="(tag, index) in tagList" :key="index" class="wb-chip gap-2">
                  #{{ tag }}
                  <button
                    @click="removeTag(index)"
                    class="wb-btn-ghost wb-btn-xs h-4 w-4 p-0 hover:text-error"
                  >
                    <i class="i-[mdi--close] text-xs"></i>
                  </button>
                </span>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="newTag"
                  type="text"
                  placeholder="添加标签（按回车确认）"
                  class="wb-input flex-1"
                  @keydown.enter.prevent="addTag"
                  maxlength="20"
                />
                <button @click="addTag" class="wb-btn-primary wb-btn-sm" :disabled="!newTag.trim()">
                  <i class="i-[mdi--plus]"></i>
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧栏 -->
        <div class="space-y-5">
          <div class="wb-card p-5">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-base font-semibold text-fg">编辑说明</h3>
              <span
                class="wb-chip font-medium"
                :class="hasChanges ? 'border-warning/40 bg-warning/10 text-warning' : 'text-muted'"
              >
                {{ hasChanges ? "有未保存更改" : "已保存" }}
              </span>
            </div>
            <ul class="space-y-2.5 text-sm text-muted">
              <li>· 帖子最后编辑时间将同步更新</li>
              <li>· 修改范围较大时，可在开头写一段 "更新日志"</li>
              <li>· 保持格式整洁，去除外部水印或广告</li>
            </ul>
            <div class="mt-5 flex flex-col gap-2">
              <button class="wb-btn wb-btn-sm" @click="previewPost" :disabled="!hasContent">
                <i class="i-[mdi--eye] text-base"></i>
                预览效果
              </button>
              <button class="wb-btn-ghost wb-btn-sm" @click="handleCancel">
                <i class="i-[mdi--arrow-left] text-base"></i>
                返回详情页
              </button>
            </div>
          </div>

          <div class="wb-card p-5">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="flex items-center gap-2 text-base font-semibold text-fg">
                <i class="i-[mdi--eye-outline] text-faint"></i>
                实时预览
              </h3>
              <span class="wb-chip">{{ postCategoryLabel(formData.category) }}</span>
            </div>
            <div class="space-y-3">
              <div class="rounded-control border border-line bg-surface p-4">
                <p class="line-clamp-2 min-h-[3.5rem] text-lg font-bold text-fg">
                  {{ formData.title || "请输入标题" }}
                </p>
                <!-- eslint-disable vue/no-v-html -->
                <p
                  class="mt-2 line-clamp-3 min-h-[3.75rem] text-sm text-muted"
                  v-if="formData.summary || formData.content"
                  v-html="sanitizeHtml(formData.summary || formData.content)"
                ></p>
                <!-- eslint-enable vue/no-v-html -->
                <div class="mt-3 flex flex-wrap gap-1.5">
                  <span v-for="tag in tagList" :key="tag" class="wb-chip text-xs">
                    #{{ tag }}
                  </span>
                  <span v-if="tagList.length === 0" class="text-xs text-faint"
                    >添加标签帮助推荐</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <dialog ref="previewModal" class="wb-dialog">
      <div class="wb-dialog-box max-w-4xl">
        <h3 class="text-lg font-bold">帖子预览</h3>
        <div class="custom-prose mt-4">
          <h2 class="text-xl font-bold">
            {{ formData.title || "无标题" }}
          </h2>
          <div class="wb-chip mb-4">
            {{ postCategoryLabel(formData.category) }}
          </div>
          <!-- eslint-disable vue/no-v-html -->
          <div
            class="prose mb-4 max-w-none"
            v-html="sanitizeHtml(formData.content) || '<p>无内容</p>'"
          ></div>
          <!-- eslint-enable vue/no-v-html -->
          <p v-if="formData.summary" class="italic text-faint">
            {{ formData.summary }}
          </p>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button class="wb-btn-ghost" @click="closePreview">关闭</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { forumService, type UpdatePostDto } from "@/services/forum"
import type { Post } from "@/stores/forum"
import { postCategoryLabel } from "@/stores/forum"
import RichTextEditor from "@/components/RichTextEditor.vue"
import { sanitizeHtml, stripHtml } from "@/utils/htmlSanitizer"
import { useGlobalToast } from "@/composables/useToast"

const router = useRouter()
const route = useRoute()
const toast = useGlobalToast()

const loading = ref(true)
const error = ref<string | null>(null)
const originalPost = ref<Post | null>(null)
const isSubmitting = ref(false)
const newTag = ref("")
const tagList = ref<string[]>([])
const previewModal = ref<HTMLDialogElement>()

type EditablePostForm = {
  title: string
  content: string
  category: UpdatePostDto["category"] | ""
  summary: string
  tags: string
}

const formData = reactive<EditablePostForm>({
  title: "",
  content: "",
  category: "",
  summary: "",
  tags: "",
})

const errors = reactive({
  title: "",
  category: "",
  content: "",
})

const hasContent = computed(() => formData.title.trim() || formData.content.trim())
const hasChanges = computed(() => {
  if (!originalPost.value) return false
  return (
    formData.title !== originalPost.value.title ||
    formData.content !== originalPost.value.content ||
    formData.category !== originalPost.value.category ||
    (formData.summary || "") !== (originalPost.value.summary || "") ||
    tagList.value.join(",") !== (originalPost.value.tags || "")
  )
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
  } else if (formData.title.trim().length > 100) {
    errors.title = "标题不能超过100个字符"
  } else {
    errors.title = ""
  }
}

const validateCategory = () => {
  if (!formData.category) {
    errors.category = "请选择帖子分类"
  } else {
    errors.category = ""
  }
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

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !tagList.value.includes(tag) && tagList.value.length < 5) {
    tagList.value.push(tag)
    newTag.value = ""
  }
}

const removeTag = (index: number) => {
  tagList.value.splice(index, 1)
}

const loadPost = async () => {
  try {
    const id = Number(route.params.id)
    const post = await forumService.getPost(id)
    originalPost.value = post
    formData.title = post.title
    formData.content = post.content
    formData.category = post.category
    formData.summary = post.summary || ""
    formData.tags = post.tags || ""
    tagList.value = (post.tags || "").split(",").filter((tag: string) => tag.trim())
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    error.value = errObj.message || "加载帖子失败"
  } finally {
    loading.value = false
  }
}

const resetToOriginal = () => {
  if (!originalPost.value) return
  formData.title = originalPost.value.title
  formData.content = originalPost.value.content
  formData.category = originalPost.value.category
  formData.summary = originalPost.value.summary || ""
  tagList.value = (originalPost.value.tags || "").split(",").filter((tag: string) => tag.trim())
  errors.title = ""
  errors.category = ""
  errors.content = ""
}

const previewPost = () => {
  previewModal.value?.showModal()
}

const closePreview = () => {
  previewModal.value?.close()
}

const handleCancel = () => {
  router.back()
}

const submitUpdate = async () => {
  validateTitle()
  validateCategory()
  validateContent()
  if (!isFormValid.value) {
    toast.warning("请填写所有必填字段")
    return
  }
  try {
    isSubmitting.value = true
    const id = Number(route.params.id)
    const updateData: UpdatePostDto = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      category: formData.category as UpdatePostDto["category"],
      summary: formData.summary?.trim(),
      tags: tagList.value.join(","),
    }
    const updatedPost = await forumService.updatePost(id, updateData)
    toast.success("帖子更新成功")
    router.push(`/forums/post/${updatedPost.id}`)
  } catch (err: unknown) {
    const errObj = err as Error & { message?: string }
    console.error("更新帖子失败:", errObj)
    toast.error(errObj.message || "更新失败，请稍后重试")
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadPost()
})
</script>

<style>
.custom-prose img {
  max-width: 100%;
  border-radius: 8px;
}
</style>
