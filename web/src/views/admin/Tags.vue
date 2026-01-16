<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="relative">
      <div
        class="absolute -inset-x-4 -inset-y-2 -z-10 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 blur-2xl"
      ></div>
      <div class="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30"
            >
              <iconify-icon icon="mdi:tag-multiple" class="text-2xl text-white"></iconify-icon>
            </div>
            <div>
              <h1
                class="bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-4xl font-bold text-transparent"
              >
                标签管理
              </h1>
              <p class="mt-1 text-white/70">Tag Management</p>
            </div>
          </div>
          <button
            class="btn gap-2 border-none bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-600"
            @click="openCreateModal"
          >
            <iconify-icon icon="mdi:plus" class="text-xl"></iconify-icon>
            创建标签
          </button>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="group relative">
      <div
        class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-emerald-500/30 opacity-75 blur transition duration-1000 group-hover:opacity-100"
      ></div>
      <div
        class="relative rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
      >
        <div class="p-6">
          <div class="flex flex-wrap items-end gap-4">
            <div class="form-control min-w-[220px] flex-1">
              <label class="label">
                <span class="label-text font-semibold text-white/80">关键字</span>
              </label>
              <div class="relative">
                <input
                  v-model="filters.keyword"
                  type="text"
                  placeholder="搜索标签名称..."
                  class="input w-full rounded-xl border-white/20 bg-white/10 pl-12 text-white backdrop-blur-sm placeholder:text-white/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
                  @keyup.enter="applyFilters"
                />
                <iconify-icon
                  icon="mdi:magnify"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-white/40"
                ></iconify-icon>
              </div>
            </div>

            <div class="form-control min-w-[160px]">
              <label class="label">
                <span class="label-text font-semibold text-white/80">排序字段</span>
              </label>
              <select
                v-model="filters.sortBy"
                class="select rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
                @change="applyFilters"
              >
                <option value="usageCount" class="bg-slate-900">使用次数</option>
                <option value="name" class="bg-slate-900">标签名称</option>
                <option value="createdAt" class="bg-slate-900">创建时间</option>
              </select>
            </div>

            <div class="form-control min-w-[140px]">
              <label class="label">
                <span class="label-text font-semibold text-white/80">排序方向</span>
              </label>
              <select
                v-model="filters.sortOrder"
                class="select rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
                @change="applyFilters"
              >
                <option value="DESC" class="bg-slate-900">降序</option>
                <option value="ASC" class="bg-slate-900">升序</option>
              </select>
            </div>

            <div class="flex gap-2">
              <button
                class="btn gap-2 rounded-xl border-none bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-600"
                @click="applyFilters"
              >
                <iconify-icon icon="mdi:magnify" class="text-lg"></iconify-icon>
                搜索
              </button>
              <button
                class="btn gap-2 rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                @click="resetFilters"
              >
                <iconify-icon icon="mdi:refresh" class="text-lg"></iconify-icon>
                重置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签列表 -->
    <div class="group relative">
      <div
        class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-emerald-500/30 opacity-75 blur transition duration-1000 group-hover:opacity-100"
      ></div>
      <div
        class="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl"
      >
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="relative">
            <div
              class="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-500"
            ></div>
          </div>
        </div>

        <div v-else-if="tags.length === 0" class="py-20 text-center">
          <div
            class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-white/10"
          >
            <iconify-icon icon="mdi:tag-off" class="text-4xl text-white/30"></iconify-icon>
          </div>
          <p class="text-lg font-semibold text-white/60">暂无标签数据</p>
          <p class="mt-2 text-sm text-white/40">开始创建你的第一个标签吧</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr class="border-b border-white/10">
                <th class="px-6 py-4 font-bold text-white/80">标签名称</th>
                <th class="px-6 py-4 font-bold text-white/80">使用次数</th>
                <th class="px-6 py-4 font-bold text-white/80">创建时间</th>
                <th class="px-6 py-4 font-bold text-white/80">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tag in tags"
                :key="tag.id"
                class="border-b border-white/5 transition-colors hover:bg-white/5"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
                    >
                      <iconify-icon icon="mdi:tag" class="text-emerald-400"></iconify-icon>
                    </div>
                    <span class="font-semibold text-white">{{ tag.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div
                    class="badge border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 backdrop-blur-sm"
                  >
                    {{ getUsageCount(tag) }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-white/70">{{ formatDate(tag.createdAt) }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex gap-2">
                    <button
                      class="btn btn-ghost btn-sm gap-2 border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                      @click="openEditModal(tag)"
                    >
                      <iconify-icon icon="mdi:pencil"></iconify-icon>
                      编辑
                    </button>
                    <button
                      class="btn btn-ghost btn-sm gap-2 border border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                      @click="deleteTag(tag)"
                    >
                      <iconify-icon icon="mdi:delete"></iconify-icon>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.pages > 1" class="border-t border-white/10 p-6">
          <div class="flex justify-center join">
            <button
              class="btn border-white/20 bg-white/10 text-white backdrop-blur-sm join-item hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="pagination.page === 1"
              @click="changePage(pagination.page - 1)"
            >
              <iconify-icon icon="mdi:chevron-left"></iconify-icon>
              上一页
            </button>
            <button
              class="btn border-white/20 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white join-item"
              disabled
            >
              第 {{ pagination.page }} / {{ pagination.pages }} 页
            </button>
            <button
              class="btn border-white/20 bg-white/10 text-white backdrop-blur-sm join-item hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="pagination.page === pagination.pages"
              @click="changePage(pagination.page + 1)"
            >
              下一页
              <iconify-icon icon="mdi:chevron-right"></iconify-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建标签 -->
    <dialog ref="createModal" class="modal">
      <div
        class="modal-box max-w-md overflow-hidden rounded-3xl border border-white/20 bg-slate-900/95 p-0 shadow-2xl backdrop-blur-xl"
      >
        <div
          class="border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 p-6"
        >
          <h3 class="flex items-center gap-3 text-2xl font-bold text-white">
            <iconify-icon icon="mdi:tag-plus" class="text-3xl"></iconify-icon>
            新建标签
          </h3>
        </div>
        <div class="p-6">
          <form class="space-y-4" @submit.prevent="createTag">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold text-white/80">标签名称</span>
              </label>
              <input
                v-model="createForm.name"
                type="text"
                class="input w-full rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm placeholder:text-white/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
                placeholder="请输入标签名称"
              />
            </div>
            <div class="flex gap-2 pt-4">
              <button
                type="button"
                class="btn flex-1 gap-2 rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                @click="closeCreateModal"
              >
                <iconify-icon icon="mdi:close"></iconify-icon>
                取消
              </button>
              <button
                type="submit"
                class="btn flex-1 gap-2 border-none bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                :disabled="saving"
              >
                <iconify-icon icon="mdi:plus"></iconify-icon>
                {{ saving ? "创建中..." : "创建" }}
              </button>
            </div>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <!-- 编辑标签 -->
    <dialog ref="editModal" class="modal">
      <div
        class="modal-box max-w-md overflow-hidden rounded-3xl border border-white/20 bg-slate-900/95 p-0 shadow-2xl backdrop-blur-xl"
      >
        <div
          class="border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 p-6"
        >
          <h3 class="flex items-center gap-3 text-2xl font-bold text-white">
            <iconify-icon icon="mdi:tag-edit" class="text-3xl"></iconify-icon>
            编辑标签
          </h3>
        </div>
        <div class="p-6">
          <form class="space-y-4" @submit.prevent="updateTag">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold text-white/80">标签名称</span>
              </label>
              <input
                v-model="editForm.name"
                type="text"
                class="input w-full rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm placeholder:text-white/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
                placeholder="请输入标签名称"
              />
            </div>
            <div class="flex gap-2 pt-4">
              <button
                type="button"
                class="btn flex-1 gap-2 rounded-xl border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                @click="closeEditModal"
              >
                <iconify-icon icon="mdi:close"></iconify-icon>
                取消
              </button>
              <button
                type="submit"
                class="btn flex-1 gap-2 border-none bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                :disabled="saving"
              >
                <iconify-icon icon="mdi:content-save"></iconify-icon>
                {{ saving ? "保存中..." : "保存" }}
              </button>
            </div>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import tagService, { type Tag } from "@/services/tag"

const loading = ref(true)
const saving = ref(false)
const tags = ref<Tag[]>([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
})

const filters = reactive({
  keyword: "",
  sortBy: "usageCount",
  sortOrder: "DESC" as "ASC" | "DESC",
})

const createModal = ref<HTMLDialogElement | null>(null)
const editModal = ref<HTMLDialogElement | null>(null)

const createForm = reactive({
  name: "",
})

const editForm = reactive({
  id: 0,
  name: "",
})

const loadTags = async () => {
  try {
    loading.value = true
    const response = await tagService.getTags({
      keyword: filters.keyword || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: pagination.value.page,
      limit: pagination.value.limit,
    })
    tags.value = response.data
    if (response.pagination) {
      pagination.value = response.pagination
    } else {
      pagination.value.total = response.data.length
      pagination.value.pages = 1
    }
  } catch (error) {
    console.error("加载标签失败:", error)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  pagination.value.page = 1
  loadTags()
}

const resetFilters = () => {
  filters.keyword = ""
  filters.sortBy = "usageCount"
  filters.sortOrder = "DESC"
  applyFilters()
}

const changePage = (page: number) => {
  pagination.value.page = page
  loadTags()
}

const openCreateModal = () => {
  createForm.name = ""
  createModal.value?.showModal()
}

const closeCreateModal = () => {
  createModal.value?.close()
}

const openEditModal = (tag: Tag) => {
  editForm.id = tag.id
  editForm.name = tag.name
  editModal.value?.showModal()
}

const closeEditModal = () => {
  editModal.value?.close()
}

const createTag = async () => {
  if (!createForm.name.trim()) {
    alert("请输入标签名称")
    return
  }

  try {
    saving.value = true
    await tagService.createTag({ name: createForm.name.trim() })
    closeCreateModal()
    await loadTags()
  } catch (error) {
    console.error("创建标签失败:", error)
    alert("创建标签失败，请稍后重试")
  } finally {
    saving.value = false
  }
}

const updateTag = async () => {
  if (!editForm.name.trim()) {
    alert("请输入标签名称")
    return
  }

  try {
    saving.value = true
    await tagService.updateTag(editForm.id, { name: editForm.name.trim() })
    closeEditModal()
    await loadTags()
  } catch (error) {
    console.error("更新标签失败:", error)
    alert("更新标签失败，请稍后重试")
  } finally {
    saving.value = false
  }
}

const deleteTag = async (tag: Tag) => {
  if (!confirm(`确认删除标签「${tag.name}」？`)) {
    return
  }

  try {
    await tagService.deleteTag(tag.id)
    await loadTags()
  } catch (error) {
    console.error("删除标签失败:", error)
    alert("删除标签失败，请稍后重试")
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString("zh-CN")
}

const getUsageCount = (tag: Tag) => tag.usageCount ?? (tag as Tag & { useCount?: number }).useCount ?? 0

onMounted(() => {
  loadTags()
})
</script>
