<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="wb-page-title">我的合集</h2>
      <form class="flex gap-2" @submit.prevent="create">
        <input
          v-model="newName"
          type="text"
          maxlength="80"
          placeholder="新合集名称"
          class="wb-input w-48"
        />
        <button
          type="submit"
          class="wb-btn-primary wb-btn-sm"
          :disabled="!newName.trim() || creating"
        >
          创建
        </button>
      </form>
    </div>

    <p v-if="error" class="text-sm text-error">{{ error }}</p>
    <div v-if="loading" class="flex justify-center py-12">
      <span class="wb-spinner"></span>
    </div>
    <ul v-else-if="collections.length" class="grid gap-3 sm:grid-cols-2">
      <li v-for="c in collections" :key="c.id" class="wb-card p-4">
        <div class="flex items-start justify-between gap-2">
          <button type="button" class="text-left" @click="select(c)">
            <p class="font-semibold text-fg">{{ c.name }}</p>
            <p class="text-xs text-muted">{{ c.itemCount ?? 0 }} 张壁纸</p>
          </button>
          <button type="button" class="wb-btn-ghost wb-btn-xs text-error" @click="remove(c)">
            删除
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="py-12 text-center text-muted">
      还没有合集。创建后可在壁纸详情页点「加入合集」。
    </p>

    <div v-if="active" class="space-y-3 border-t border-line pt-6">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">{{ active.name }}</h3>
        <button type="button" class="wb-btn-ghost wb-btn-xs" @click="active = null">关闭</button>
      </div>

      <div v-if="loadingItems" class="flex justify-center py-10">
        <span class="wb-spinner"></span>
      </div>
      <p v-else-if="!items.length" class="py-8 text-center text-sm text-muted">
        合集为空。在
        <router-link to="/wallpapers" class="text-primary underline">壁纸详情</router-link>
        使用「加入合集」添加。
      </p>
      <MasonryWall v-else :items="items" :item-height="cardWeight">
        <template #default="{ items: cols }">
          <article
            v-for="wp in cols"
            :key="wp.id"
            class="group relative overflow-hidden rounded-tile bg-inset"
          >
            <button
              type="button"
              class="relative block w-full text-left"
              :style="{ aspectRatio: `${wp.width}/${wp.height}` }"
              @click="$router.push(`/wallpaper/${wp.id}`)"
            >
              <img
                :src="wp.thumbnailUrl || wp.fileUrl"
                :alt="`壁纸 ${wp.id}`"
                class="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div class="wb-card-overlay">
                <span class="text-xs tabular-nums text-white/90"
                  >{{ wp.width }}×{{ wp.height }}</span
                >
                <span class="inline-flex items-center gap-1 text-xs text-white/90">
                  <i class="i-[mdi--heart] text-xs" aria-hidden="true"></i>
                  {{ wp.favoriteCount || 0 }}
                </span>
              </div>
            </button>
            <button
              type="button"
              class="absolute right-2 top-2 z-10 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white hover:bg-error"
              :disabled="removingId === wp.id"
              @click="removeWallpaper(wp)"
            >
              {{ removingId === wp.id ? "移除中…" : "移出" }}
            </button>
          </article>
        </template>
      </MasonryWall>
      <!-- 合集超过一页时翻页（超 40 张不再静默截断） -->
      <Pagination
        v-if="!loadingItems && items.length"
        :current-page="activePage"
        :total-pages="activeTotalPages"
        @change="fetchCollectionItems"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import { wallpaperService, type Collection, type Wallpaper } from "@/services/wallpaper"
import { useGlobalToast } from "@/composables/useToast"
import { confirmAction } from "@/composables/useConfirm"
import MasonryWall from "@/components/MasonryWall.vue"
import Pagination from "@/components/Pagination.vue"
import { masonryItemWeight } from "@/utils/wallpaperLayout"

const toast = useGlobalToast()
const cardWeight = (w: Wallpaper) => masonryItemWeight(w.width, w.height)
const collections = ref<Collection[]>([])
const loading = ref(false)
const error = ref("")
const newName = ref("")
const creating = ref(false)
const active = ref<Collection | null>(null)
const items = ref<Wallpaper[]>([])
const loadingItems = ref(false)
const removingId = ref<number | null>(null)
const activePage = ref(1)
const activeTotalPages = ref(1)
const COLLECTION_PAGE_SIZE = 40

const load = async () => {
  loading.value = true
  error.value = ""
  try {
    const res = await wallpaperService.listCollections()
    collections.value = res.data || []
  } catch (e: unknown) {
    error.value = (e as Error).message || "加载失败"
  } finally {
    loading.value = false
  }
}

const create = async () => {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    await wallpaperService.createCollection(newName.value.trim())
    newName.value = ""
    toast.success("合集已创建")
    await load()
  } catch (e: unknown) {
    toast.error((e as Error).message || "创建失败")
  } finally {
    creating.value = false
  }
}

const remove = async (c: Collection) => {
  const ok = await confirmAction({
    title: "删除合集",
    message: `删除合集「${c.name}」？`,
    confirmText: "删除",
    danger: true,
  })
  if (!ok) return
  try {
    await wallpaperService.deleteCollection(c.id)
    if (active.value?.id === c.id) {
      active.value = null
      items.value = []
    }
    toast.success("已删除")
    await load()
  } catch (e: unknown) {
    toast.error((e as Error).message || "删除失败")
  }
}

const select = async (c: Collection) => {
  active.value = c
  activePage.value = 1
  await fetchCollectionItems(1)
}

/** 拉当前合集某一页（Pagination @change 与 select 复用） */
const fetchCollectionItems = async (page: number) => {
  if (!active.value) return
  loadingItems.value = true
  try {
    const res = await wallpaperService.listCollectionWallpapers(
      active.value.id,
      page,
      COLLECTION_PAGE_SIZE,
    )
    items.value = res.data || []
    activePage.value = res.pagination?.page || page
    activeTotalPages.value = res.pagination?.pages || 1
  } catch {
    items.value = []
    activeTotalPages.value = 1
  } finally {
    loadingItems.value = false
  }
}

/** 从当前合集移除壁纸（调用 removeFromCollection） */
const removeWallpaper = async (wp: Wallpaper) => {
  if (!active.value) return
  removingId.value = wp.id
  try {
    await wallpaperService.removeFromCollection(active.value.id, wp.id)
    toast.success("已移出合集")
    const c = collections.value.find((x) => x.id === active.value?.id)
    if (c && typeof c.itemCount === "number") {
      c.itemCount = Math.max(0, c.itemCount - 1)
    }
    // 整页移空且后面还有内容时回退一页，避免停在看不见东西的空页
    const pageAfterRemove =
      items.value.length === 1 && activePage.value > 1
        ? activePage.value - 1
        : activePage.value
    await fetchCollectionItems(pageAfterRemove)
  } catch (e: unknown) {
    toast.error((e as Error).message || "移除失败")
  } finally {
    removingId.value = null
  }
}

onMounted(load)
</script>
