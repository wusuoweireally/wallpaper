<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-fg">标签管理</h1>
        <p class="mt-1 text-sm text-muted">维护标签库</p>
      </div>
      <button type="button" class="wb-btn-primary" @click="openCreateModal">创建标签</button>
    </div>

    <!-- 筛选器 -->
    <div class="wb-card p-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-[220px] flex-1">
          <label class="mb-1 block text-sm font-semibold text-fg">关键字</label>
          <div class="relative">
            <input
              v-model="filters.keyword"
              type="text"
              placeholder="搜索标签名称…"
              class="wb-input w-full pl-10"
              @keyup.enter="applyFilters"
            />
            <i
              class="i-[mdi--magnify] absolute left-3 top-1/2 -translate-y-1/2 text-lg text-faint"
              aria-hidden="true"
            ></i>
          </div>
        </div>

        <div class="min-w-[160px]">
          <label class="mb-1 block text-sm font-semibold text-fg">排序字段</label>
          <select v-model="filters.sortBy" class="wb-input" @change="applyFilters">
            <option value="usageCount">使用次数</option>
            <option value="name">标签名称</option>
            <option value="createdAt">创建时间</option>
          </select>
        </div>

        <div class="min-w-[140px]">
          <label class="mb-1 block text-sm font-semibold text-fg">排序方向</label>
          <select v-model="filters.sortOrder" class="wb-input" @change="applyFilters">
            <option value="DESC">降序</option>
            <option value="ASC">升序</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button class="wb-btn-primary gap-2" @click="applyFilters">
            <i class="i-[mdi--magnify] text-lg" aria-hidden="true"></i>
            搜索
          </button>
          <button class="wb-btn gap-2" @click="resetFilters">
            <i class="i-[mdi--refresh] text-lg" aria-hidden="true"></i>
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- 标签列表 -->
    <div class="wb-card overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <span class="wb-spinner wb-spinner-lg"></span>
      </div>

      <div v-else-if="tags.length === 0" class="wb-empty">
        <i class="i-[mdi--tag-off] text-4xl text-faint" aria-hidden="true"></i>
        <p class="mt-4 text-base font-medium text-fg">暂无标签数据</p>
        <p class="mt-1 text-sm text-muted">开始创建你的第一个标签吧</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-line text-xs uppercase tracking-wide text-faint">
              <th class="px-6 py-4 font-semibold">标签名称</th>
              <th class="px-6 py-4 font-semibold">使用次数</th>
              <th class="px-6 py-4 font-semibold">创建时间</th>
              <th class="px-6 py-4 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tag in tags"
              :key="tag.id"
              class="border-b border-line/60 transition-colors hover:bg-subtle"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-control bg-subtle">
                    <i class="i-[mdi--tag] text-primary" aria-hidden="true"></i>
                  </div>
                  <span class="font-semibold text-fg">{{ tag.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="wb-chip">{{ getUsageCount(tag) }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-muted">{{ formatDate(tag.createdAt) }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button class="wb-btn-ghost wb-btn-sm gap-2" @click="openEditModal(tag)">
                    <i class="i-[mdi--pencil]" aria-hidden="true"></i>
                    编辑
                  </button>
                  <button class="wb-btn-ghost wb-btn-sm gap-2 text-error" @click="deleteTag(tag)">
                    <i class="i-[mdi--delete]" aria-hidden="true"></i>
                    删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.pages > 1" class="border-t border-line p-6">
        <Pagination
          :current-page="pagination.page"
          :total-pages="pagination.pages"
          @change="changePage"
        />
      </div>
    </div>

    <!-- 创建标签 -->
    <dialog ref="createModal" class="wb-dialog">
      <div class="wb-dialog-box max-w-md">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-fg">
          <i class="i-[mdi--tag-plus] text-xl" aria-hidden="true"></i>
          新建标签
        </h3>
        <form class="space-y-4" @submit.prevent="createTag">
          <div>
            <label class="mb-1 block text-sm font-semibold text-fg">标签名称</label>
            <input
              v-model="createForm.name"
              type="text"
              class="wb-input w-full"
              placeholder="请输入标签名称"
            />
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" class="wb-btn flex-1 gap-2" @click="closeCreateModal">
              <i class="i-[mdi--close]" aria-hidden="true"></i>
              取消
            </button>
            <button type="submit" class="wb-btn-primary flex-1 gap-2" :disabled="saving">
              <i class="i-[mdi--plus]" aria-hidden="true"></i>
              {{ saving ? "创建中…" : "创建" }}
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- 编辑标签 -->
    <dialog ref="editModal" class="wb-dialog">
      <div class="wb-dialog-box max-w-md">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-fg">
          <i class="i-[mdi--tag-edit] text-xl" aria-hidden="true"></i>
          编辑标签
        </h3>
        <form class="space-y-4" @submit.prevent="updateTag">
          <div>
            <label class="mb-1 block text-sm font-semibold text-fg">标签名称</label>
            <input
              v-model="editForm.name"
              type="text"
              class="wb-input w-full"
              placeholder="请输入标签名称"
            />
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" class="wb-btn flex-1 gap-2" @click="closeEditModal">
              <i class="i-[mdi--close]" aria-hidden="true"></i>
              取消
            </button>
            <button type="submit" class="wb-btn-primary flex-1 gap-2" :disabled="saving">
              <i class="i-[mdi--content-save]" aria-hidden="true"></i>
              {{ saving ? "保存中…" : "保存" }}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import tagService, { type Tag } from "@/services/tag"
import { useGlobalToast } from "@/composables/useToast"
import { confirmAction } from "@/composables/useConfirm"
import Pagination from "@/components/Pagination.vue"

const toast = useGlobalToast()
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
    toast.warning("请输入标签名称")
    return
  }

  try {
    saving.value = true
    await tagService.createTag({ name: createForm.name.trim() })
    closeCreateModal()
    await loadTags()
  } catch (error) {
    console.error("创建标签失败:", error)
    toast.error("创建标签失败，请稍后重试")
  } finally {
    saving.value = false
  }
}

const updateTag = async () => {
  if (!editForm.name.trim()) {
    toast.warning("请输入标签名称")
    return
  }

  try {
    saving.value = true
    await tagService.updateTag(editForm.id, { name: editForm.name.trim() })
    closeEditModal()
    await loadTags()
  } catch (error) {
    console.error("更新标签失败:", error)
    toast.error("更新标签失败，请稍后重试")
  } finally {
    saving.value = false
  }
}

const deleteTag = async (tag: Tag) => {
  const ok = await confirmAction({
    title: "删除标签",
    message: `确认删除标签「${tag.name}」？`,
    confirmText: "删除",
    danger: true,
  })
  if (!ok) return

  try {
    await tagService.deleteTag(tag.id)
    await loadTags()
  } catch (error) {
    console.error("删除标签失败:", error)
    toast.error("删除标签失败，请稍后重试")
  }
}

const formatDate = (value: string) => {
  return new Date(value).toLocaleString("zh-CN")
}

const getUsageCount = (tag: Tag) =>
  tag.usageCount ?? (tag as Tag & { useCount?: number }).useCount ?? 0

onMounted(() => {
  loadTags()
})
</script>
