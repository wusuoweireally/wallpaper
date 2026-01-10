<template>
  <div class="relative min-h-screen bg-[#f5f6fa] dark:bg-slate-900">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute -left-24 top-6 h-72 w-72 rounded-full bg-[#dceafe] opacity-60 blur-3xl dark:bg-blue-900/20"
      ></div>
      <div
        class="absolute right-[-80px] top-16 h-80 w-80 rounded-full bg-[#fde2c5] opacity-70 blur-3xl dark:bg-orange-900/20"
      ></div>
      <div
        class="absolute left-1/3 top-52 h-56 w-56 rounded-full bg-[#e8e7ff] opacity-60 blur-3xl dark:bg-purple-900/20"
      ></div>
    </div>
    <div class="relative mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div
        class="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50"
      >
        <div
          class="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-3xl dark:from-emerald-900/20 dark:to-teal-900/20"
        ></div>
        <div class="relative">
          <div
            class="h-2 w-full bg-gradient-to-r from-slate-900 via-indigo-600 to-emerald-500"
          ></div>
          <div
            class="flex flex-col gap-5 p-7 lg:flex-row lg:items-center lg:justify-between lg:p-10"
          >
            <div class="space-y-3">
              <div
                class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-1.5 dark:border-emerald-700/50 dark:from-emerald-500/20 dark:to-teal-500/20"
              >
                <i class="i-mdi-pencil-circle text-emerald-600 dark:text-emerald-400"></i>
                <p class="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700 dark:text-emerald-300">
                  Update
                </p>
              </div>
              <h1
                class="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-4xl font-bold text-transparent dark:from-slate-100 dark:to-slate-400"
              >
                编辑帖子
              </h1>
              <p class="max-w-xl text-base text-slate-600 dark:text-slate-400">
                修正、补充或更新内容，保存后会记录最新编辑时间。
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <button
                class="btn btn-ghost shadow-sm transition-all hover:bg-slate-100 hover:shadow-md dark:hover:bg-slate-700"
                @click="handleCancel"
              >
                <i class="i-mdi-close text-lg"></i>
                取消
              </button>
              <button
                class="group btn btn-outline border-amber-300 shadow-sm transition-all hover:border-amber-400 hover:bg-amber-50 hover:shadow-md dark:border-amber-700/50 dark:hover:bg-amber-900/20"
                @click="resetToOriginal"
                :disabled="!hasChanges"
              >
                <i
                  class="i-mdi-restore text-lg transition-transform duration-500 group-hover:rotate-180"
                ></i>
                恢复原始
              </button>
              <button
                class="group btn btn-outline border-slate-300 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:hover:bg-slate-700"
                @click="previewPost"
                :disabled="!hasContent"
              >
                <i class="i-mdi-eye text-lg transition-transform group-hover:scale-110"></i>
                预览
              </button>
              <button
                class="group btn btn-primary relative overflow-hidden shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40"
                @click="submitUpdate"
                :disabled="isSubmitting || !isFormValid"
              >
                <span
                  class="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-full dark:from-white/0 dark:via-white/10 dark:to-white/0"
                ></span>
                <i
                  class="i-mdi-content-save relative z-10 text-lg transition-transform group-hover:-translate-y-0.5"
                  v-if="!isSubmitting"
                ></i>
                <span class="loading loading-spinner loading-sm relative z-10" v-else></span>
                <span class="relative z-10 font-medium">{{
                  isSubmitting ? "更新中..." : "保存修改"
                }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="loading"
        class="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200/70 bg-white/90 shadow dark:border-slate-700/70 dark:bg-slate-800/90"
      >
        <div class="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-sm">正在加载帖子...</p>
        </div>
      </div>

      <div
        v-else-if="error"
        class="border-error/30 bg-error/5 rounded-2xl border p-6 text-error shadow dark:bg-error/10"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <i class="i-mdi-alert-circle text-2xl"></i>
            <span>{{ error }}</span>
          </div>
          <button class="btn btn-sm" @click="router.back()">返回</button>
        </div>
      </div>

      <div v-else-if="originalPost" class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div
          class="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-200/50 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800 dark:shadow-slate-900/50"
        >
          <div
            class="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-100/40 to-teal-100/40 blur-3xl dark:from-emerald-900/20 dark:to-teal-900/20"
          ></div>
          <div class="relative space-y-7">
            <div class="grid gap-5 md:grid-cols-2">
              <div class="form-control group">
                <label class="label mb-2">
                  <span class="label-text flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <i class="i-mdi-format-title text-blue-600 dark:text-blue-400"></i>
                    标题 <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  v-model="formData.title"
                  type="text"
                  placeholder="请输入帖子标题，建议不超过50字"
                  class="input-bordered input w-full transition-all hover:border-slate-400 focus:border-slate-900 dark:hover:border-slate-600 dark:focus:border-slate-400"
                  :class="{ 'input-error': errors.title }"
                  @input="validateTitle"
                  maxlength="100"
                />
                <label class="label mt-1">
                  <span class="label-text-alt text-error" v-if="errors.title">{{
                    errors.title
                  }}</span>
                  <span class="label-text-alt ml-auto text-slate-500 dark:text-slate-400"
                    >{{ (formData.title || "").length }}/100</span
                  >
                </label>
              </div>

              <div class="form-control group">
                <label class="label mb-2">
                  <span class="label-text flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <i class="i-mdi-shape-outline text-indigo-600 dark:text-indigo-400"></i>
                    分类 <span class="text-error">*</span>
                  </span>
                </label>
                <select
                  v-model="formData.category"
                  class="select-bordered select w-full cursor-pointer transition-all hover:border-slate-400 focus:border-slate-900 dark:hover:border-slate-600 dark:focus:border-slate-400"
                  :class="{ 'select-error': errors.category }"
                  @change="validateCategory"
                >
                  <option value="" disabled>请选择分类</option>
                  <option value="tech_discussion">💡 技术讨论</option>
                  <option value="experience_sharing">✨ 经验分享</option>
                  <option value="q_a">❓ 问答求助</option>
                  <option value="resource_sharing">🎁 资源分享</option>
                </select>
                <label class="label mt-1">
                  <span class="label-text-alt text-error" v-if="errors.category">{{
                    errors.category
                  }}</span>
                </label>
              </div>
            </div>

            <div class="form-control group">
              <label class="label mb-2">
                <span class="label-text flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <i class="i-mdi-text text-emerald-600 dark:text-emerald-400"></i>
                  内容 <span class="text-error">*</span>
                </span>
              </label>
              <div
                class="overflow-hidden rounded-2xl border border-slate-200 transition-colors focus-within:border-slate-900 dark:border-slate-600 dark:focus-within:border-slate-400"
              >
                <RichTextEditor
                  v-model="formData.content"
                  placeholder="请输入帖子内容，支持富文本格式..."
                  :maxlength="10000"
                  height="400px"
                  @change="validateContent"
                />
              </div>
              <label class="label mt-1">
                <span class="label-text-alt text-error" v-if="errors.content">{{
                  errors.content
                }}</span>
              </label>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
              <div class="form-control group">
                <label class="label mb-2">
                  <span class="label-text flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <i class="i-mdi-text-short text-amber-600 dark:text-amber-400"></i>
                    摘要 <span class="text-xs text-slate-500 dark:text-slate-400">(可选)</span>
                  </span>
                </label>
                <textarea
                  v-model="formData.summary"
                  placeholder="请输入帖子摘要，有助于其他用户快速了解内容"
                  class="textarea-bordered textarea h-28 w-full resize-none transition-all hover:border-slate-400 focus:border-slate-900 dark:hover:border-slate-600 dark:focus:border-slate-400"
                  maxlength="200"
                ></textarea>
                <label class="label mt-1">
                  <span class="label-text-alt text-slate-500 dark:text-slate-400"
                    >{{ (formData.summary || "").length }}/200</span
                  >
                </label>
              </div>

              <div class="form-control group">
                <label class="label mb-2">
                  <span class="label-text flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <i class="i-mdi-tag-outline text-purple-600 dark:text-purple-400"></i>
                    标签 <span class="text-xs text-slate-500 dark:text-slate-400">(可选)</span>
                  </span>
                </label>
                <div class="mb-3 flex flex-wrap gap-2">
                  <div
                    v-for="(tag, index) in tagList"
                    :key="index"
                    class="group badge gap-2 border border-slate-300 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    #{{ tag }}
                    <button
                      @click="removeTag(index)"
                      class="btn btn-ghost btn-xs h-4 w-4 p-0 opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100"
                    >
                      <i class="i-mdi-close text-xs"></i>
                    </button>
                  </div>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newTag"
                    type="text"
                    placeholder="添加标签（按回车确认）"
                    class="input-bordered input input-sm flex-1 transition-all hover:border-slate-400 focus:border-slate-900 dark:hover:border-slate-600 dark:focus:border-slate-400"
                    @keydown.enter.prevent="addTag"
                    maxlength="20"
                  />
                  <button
                    @click="addTag"
                    class="btn btn-primary btn-sm shadow-md transition-all hover:scale-105 hover:shadow-lg disabled:hover:scale-100"
                    :disabled="!newTag.trim()"
                  >
                    <i class="i-mdi-plus"></i>
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div
            class="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-200/30 transition-all duration-300 hover:shadow-xl dark:border-slate-700/80 dark:bg-slate-800 dark:shadow-slate-900/30"
          >
            <div
              class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-amber-200/30 to-orange-200/30 blur-2xl transition-transform duration-500 group-hover:scale-150 dark:from-amber-900/20 dark:to-orange-900/20"
            ></div>
            <div class="relative">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2 shadow-md shadow-amber-500/30"
                  >
                    <i class="i-mdi-information text-lg text-white"></i>
                  </div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">编辑说明</h3>
                </div>
                <span
                  class="badge badge-sm font-medium"
                  :class="
                    hasChanges
                      ? 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  "
                >
                  {{ hasChanges ? "⚠️ 有未保存更改" : "✓ 已保存" }}
                </span>
              </div>
              <ul class="space-y-2.5 text-sm">
                <li
                  class="flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/50"
                >
                  <span class="text-emerald-600 dark:text-emerald-400">✓</span>
                  <span class="text-slate-700 dark:text-slate-300">帖子最后编辑时间将同步更新</span>
                </li>
                <li
                  class="flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/50"
                >
                  <span class="text-blue-600 dark:text-blue-400">✓</span>
                  <span class="text-slate-700 dark:text-slate-300">修改范围较大时，可在开头写一段 "更新日志"</span>
                </li>
                <li
                  class="flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-white/60 dark:hover:bg-slate-700/50"
                >
                  <span class="text-indigo-600 dark:text-indigo-400">✓</span>
                  <span class="text-slate-700 dark:text-slate-300">保持格式整洁，去除外部水印或广告</span>
                </li>
              </ul>
              <div class="mt-5 flex flex-col gap-2">
                <button
                  class="btn btn-outline btn-sm shadow-md transition-all hover:scale-105 hover:shadow-lg"
                  @click="previewPost"
                  :disabled="!hasContent"
                >
                  <i class="i-mdi-eye text-base"></i>
                  预览效果
                </button>
                <button
                  class="btn btn-ghost btn-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  @click="handleCancel"
                >
                  <i class="i-mdi-arrow-left text-base"></i>
                  返回详情页
                </button>
              </div>
            </div>
          </div>

          <div
            class="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-5 shadow-lg shadow-slate-200/30 transition-all duration-300 hover:shadow-xl dark:border-slate-700/80 dark:from-slate-800 dark:to-slate-900/80 dark:shadow-slate-900/30"
          >
            <div
              class="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-2xl transition-transform duration-500 group-hover:scale-150 dark:from-emerald-900/20 dark:to-teal-900/20"
            ></div>
            <div class="relative">
              <div class="mb-4 flex items-center justify-between">
                <h3 class="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                  <i class="i-mdi-eye-outline text-emerald-600 dark:text-emerald-400"></i>
                  实时预览
                </h3>
                <span class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">{{
                  getCategoryName(formData.category)
                }}</span>
              </div>
              <div class="space-y-3">
                <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800/50">
                  <p class="line-clamp-2 min-h-[3.5rem] text-lg font-bold text-slate-900 dark:text-slate-100">
                    {{ formData.title || "请输入标题" }}
                  </p>
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <p
                    class="mt-2 line-clamp-3 min-h-[3.75rem] text-sm text-slate-600 dark:text-slate-400"
                    v-if="formData.summary || formData.content"
                    v-html="sanitizeHtml(formData.summary || formData.content)"
                  ></p>
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    <span
                      v-for="tag in tagList"
                      :key="tag"
                      class="badge badge-ghost badge-xs text-xs"
                    >
                      #{{ tag }}
                    </span>
                    <span v-if="tagList.length === 0" class="text-xs text-slate-400 dark:text-slate-500"
                      >添加标签帮助推荐</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <dialog ref="previewModal" class="modal">
      <div class="modal-box max-w-4xl">
        <h3 class="text-lg font-bold">帖子预览</h3>
        <div class="custom-prose mt-4">
          <h2 class="text-xl font-bold">
            {{ formData.title || "无标题" }}
          </h2>
          <div class="badge badge-outline mb-4">
            {{ getCategoryName(formData.category) }}
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            class="prose-sm prose mb-4 max-w-none"
            v-html="sanitizeHtml(formData.content) || '<p>无内容</p>'"
          ></div>
          <p v-if="formData.summary" class="italic text-gray-600">
            {{ formData.summary }}
          </p>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="closePreview">关闭</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { forumService, type UpdatePostDto } from "@/services/forum"
import RichTextEditor from "@/components/RichTextEditor.vue"
import { sanitizeHtml } from "@/utils/htmlSanitizer"

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref<string | null>(null)
const originalPost = ref<any>(null)
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

const stripHtml = (html: string): string => {
  const temp = document.createElement("div")
  temp.innerHTML = html
  return temp.textContent || temp.innerText || ""
}

const getCategoryName = (category: string | "" | undefined): string => {
  if (!category) {
    return "未分类"
  }
  const categoryMap: Record<string, string> = {
    tech_discussion: "技术讨论",
    experience_sharing: "经验分享",
    q_a: "问答求助",
    resource_sharing: "资源分享",
  }
  return categoryMap[category] || "未分类"
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
  } catch (err: any) {
    error.value = err.message || "加载帖子失败"
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
    alert("请填写所有必填字段")
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
    alert("帖子更新成功")
    router.push(`/forums/post/${updatedPost.id}`)
  } catch (err: any) {
    console.error("更新帖子失败:", err)
    alert(err.message || "更新失败，请稍后重试")
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
