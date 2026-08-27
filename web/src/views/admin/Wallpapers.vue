<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-fg">壁纸管理</h1>
        <p class="mt-1 text-sm text-muted">管理站点壁纸</p>
      </div>
      <button class="wb-btn-primary gap-2" @click="openUploadModal">
        <i class="i-[mdi--plus] text-xl" aria-hidden="true"></i>
        上传壁纸
      </button>
    </div>

    <!-- 批量操作 -->
    <div
      v-if="hasSelection"
      class="flex flex-wrap items-center gap-3 rounded-control border border-line bg-inset px-4 py-3"
    >
      <span class="text-sm text-muted">已选 {{ selectedIds.size }} 项</span>
      <div class="h-4 w-px bg-line"></div>
      <button
        class="wb-btn wb-btn-sm gap-1"
        :disabled="batchLoading"
        @click="batchSetFeatured(true)"
      >
        <i class="i-[mdi--star]" aria-hidden="true"></i>
        批量推荐
      </button>
      <button
        class="wb-btn wb-btn-sm gap-1"
        :disabled="batchLoading"
        @click="batchSetFeatured(false)"
      >
        <i class="i-[mdi--star-off]" aria-hidden="true"></i>
        取消推荐
      </button>
      <button
        class="wb-btn-danger wb-btn-sm gap-1"
        :disabled="batchLoading"
        @click="batchDeleteSelected"
      >
        <i class="i-[mdi--delete]" aria-hidden="true"></i>
        批量删除
      </button>
      <button class="wb-btn-ghost wb-btn-sm" @click="selectedIds.clear()">取消选择</button>
    </div>

    <div
      v-if="notification"
      class="wb-alert"
      :class="notification.type === 'error' ? 'wb-alert-danger' : ''"
    >
      <i
        class="text-2xl"
        :class="[
          notification.type === 'success' ? 'i-[mdi--check-circle]' : 'i-[mdi--alert-circle]',
          notification.type === 'success' ? 'text-success' : 'text-error',
        ]"
        aria-hidden="true"
      ></i>
      <span class="text-sm">{{ notification.text }}</span>
    </div>

    <!-- 筛选器 -->
    <div class="wb-card p-6">
      <div class="grid gap-4 lg:grid-cols-12">
        <div class="min-w-[150px] lg:col-span-3">
          <label class="mb-1 block text-sm font-semibold text-fg">分类</label>
          <select v-model="filters.category" class="wb-input" @change="refreshList">
            <option value="">全部</option>
            <option value="general">通用</option>
            <option value="anime">动漫</option>
            <option value="people">真人</option>
          </select>
        </div>

        <div class="min-w-[150px] lg:col-span-3">
          <label class="mb-1 block text-sm font-semibold text-fg">状态</label>
          <select v-model="filters.status" class="wb-input" @change="refreshList">
            <option value="">全部</option>
            <option value="1">已发布</option>
            <option value="0">未发布</option>
          </select>
        </div>

        <div class="min-w-[250px] flex-1 lg:col-span-4">
          <label class="mb-1 block text-sm font-semibold text-fg">搜索</label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="搜索壁纸标题…"
              class="wb-input w-full pl-10 pr-10"
              @keyup.enter="refreshList"
            />
            <i
              class="i-[mdi--magnify] absolute left-3 top-1/2 -translate-y-1/2 text-lg text-faint"
              aria-hidden="true"
            ></i>
            <button
              v-if="filters.search"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-faint transition-colors hover:text-fg"
              @click="clearSearch"
            >
              <i class="i-[mdi--close-circle] text-lg" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div class="flex items-end gap-3 lg:col-span-2">
          <button class="wb-btn-primary flex-1 gap-2" @click="refreshList">
            <i class="i-[mdi--magnify] text-lg" aria-hidden="true"></i>
            搜索
          </button>
          <button class="wb-btn" @click="resetFilters">重置</button>
        </div>
      </div>
    </div>

    <!-- 壁纸网格 -->
    <div class="wb-card">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <span class="wb-spinner wb-spinner-lg"></span>
      </div>

      <div v-else-if="wallpapers.length === 0" class="py-20 text-center">
        <div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-subtle">
          <i class="i-[mdi--image-off] text-4xl text-faint" aria-hidden="true"></i>
        </div>
        <p class="text-lg font-semibold text-muted">暂无壁纸数据</p>
        <p class="mt-2 text-sm text-faint">开始上传你的第一个作品吧</p>
      </div>

      <div v-else class="p-6">
        <!-- 全选 -->
        <div class="mb-4 flex items-center gap-3">
          <button
            class="flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all"
            :class="
              isAllSelected
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-surface text-transparent hover:border-primary/50'
            "
            @click="toggleSelectAll"
          >
            <i v-if="isAllSelected" class="i-[mdi--check] text-sm" aria-hidden="true"></i>
          </button>
          <span class="text-sm text-muted">全选当前页</span>
        </div>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="wallpaper in wallpapers"
            :key="wallpaper.id"
            class="relative flex h-full flex-col rounded-card border border-line bg-inset p-4"
            :class="{ 'ring-2 ring-primary/60': isSelected(wallpaper.id) }"
          >
            <!-- 选择复选框 -->
            <button
              class="absolute left-4 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all"
              :class="
                isSelected(wallpaper.id)
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-surface text-transparent hover:border-primary/50'
              "
              @click.stop="toggleSelect(wallpaper.id)"
            >
              <i
                v-if="isSelected(wallpaper.id)"
                class="i-[mdi--check] text-sm"
                aria-hidden="true"
              ></i>
            </button>
            <div class="relative overflow-hidden rounded-control">
              <img
                :src="getWallpaperImage(wallpaper.thumbnailUrl || wallpaper.fileUrl)"
                :alt="`壁纸 #${wallpaper.id}`"
                class="h-64 w-full object-cover"
                @error="handleImageError"
              />
              <button
                class="wb-btn wb-btn-sm absolute left-3 top-3 border-none bg-black/60 text-white hover:bg-black/80"
                @click.stop="openPreview(wallpaper)"
              >
                <i class="i-[mdi--eye]" aria-hidden="true"></i>
                预览
              </button>
            </div>
            <div class="flex flex-1 flex-col gap-3 p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs uppercase tracking-wide text-faint">
                    {{ getCategoryLabel(wallpaper.category) }}
                  </p>
                  <h3 class="mt-1 line-clamp-1 text-lg font-semibold text-fg">
                    壁纸 #{{ wallpaper.id }}
                  </h3>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <div
                    class="wb-badge-success inline-flex items-center gap-1"
                    :class="{ 'wb-badge-danger': wallpaper.status !== 1 }"
                  >
                    <i
                      class="text-sm"
                      :class="
                        wallpaper.status === 1 ? 'i-[mdi--check-circle]' : 'i-[mdi--alert-circle]'
                      "
                      aria-hidden="true"
                    ></i>
                    {{ formatStatus(wallpaper.status) }}
                  </div>
                  <span
                    v-if="wallpaper.isFeatured"
                    class="wb-badge-warning inline-flex items-center gap-1"
                  >
                    <i class="i-[mdi--star] text-xs" aria-hidden="true"></i>
                    推荐
                  </span>
                </div>
              </div>
              <div class="flex flex-wrap gap-3 text-xs text-faint">
                <span class="inline-flex items-center gap-1"
                  ><i class="i-[mdi--crop] text-base" aria-hidden="true"></i>{{ wallpaper.width }} ×
                  {{ wallpaper.height }}</span
                >
                <span class="inline-flex items-center gap-1"
                  ><i class="i-[mdi--weight] text-base" aria-hidden="true"></i
                  >{{ formatFileSize(wallpaper.fileSize) }}</span
                >
                <span class="inline-flex items-center gap-1"
                  ><i class="i-[mdi--calendar] text-base" aria-hidden="true"></i
                  >{{ formatDateTime(wallpaper.createdAt) }}</span
                >
              </div>
              <div class="flex flex-wrap gap-2" v-if="wallpaper.tags?.length">
                <span
                  v-for="(tag, index) in wallpaper.tags"
                  :key="getTagKey(tag, index)"
                  class="wb-chip"
                >
                  #{{ getTagLabel(tag) }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-sm text-muted">
                <span class="inline-flex items-center gap-1"
                  ><i class="i-[mdi--eye-outline]" aria-hidden="true"></i
                  >{{ wallpaper.viewCount || 0 }}</span
                >
                <span class="inline-flex items-center gap-1"
                  ><i class="i-[mdi--star-outline]" aria-hidden="true"></i
                  >{{ wallpaper.favoriteCount || 0 }}</span
                >
              </div>
              <div class="mt-auto flex flex-wrap gap-3">
                <button class="wb-btn-primary flex-1 gap-2" @click.stop="openPreview(wallpaper)">
                  <i class="i-[mdi--eye]" aria-hidden="true"></i>
                  查看详情
                </button>
                <div class="wb-drop wb-drop-end">
                  <div tabindex="0" role="button" class="wb-icon-btn">
                    <i class="i-[mdi--dots-horizontal]" aria-hidden="true"></i>
                  </div>
                  <ul tabindex="0" class="wb-drop-panel w-56 p-2">
                    <li>
                      <button @click="openInNewTab(wallpaper)">
                        <i class="i-[mdi--arrow-top-right-bold-box]" aria-hidden="true"></i>
                        在新标签中打开
                      </button>
                    </li>
                    <li>
                      <button @click="copyWallpaperUrl(wallpaper)">
                        <i class="i-[mdi--link-variant]" aria-hidden="true"></i>
                        复制图片链接
                      </button>
                    </li>
                    <li>
                      <button @click="copyWallpaperId(wallpaper)">
                        <i class="i-[mdi--identifier]" aria-hidden="true"></i>
                        复制壁纸ID
                      </button>
                    </li>
                    <div class="my-1 border-t border-line"></div>
                    <li>
                      <button
                        :disabled="actionLoadingId === wallpaper.id"
                        @click="toggleFeatured(wallpaper)"
                      >
                        <i
                          :class="wallpaper.isFeatured ? 'i-[mdi--star-off]' : 'i-[mdi--star]'"
                          aria-hidden="true"
                        ></i>
                        {{ wallpaper.isFeatured ? "取消推荐" : "设为推荐" }}
                      </button>
                    </li>
                    <li>
                      <button
                        :class="{ 'text-error': wallpaper.status === 1 }"
                        :disabled="actionLoadingId === wallpaper.id"
                        @click="toggleWallpaperStatus(wallpaper)"
                      >
                        <i
                          :class="
                            wallpaper.status === 1 ? 'i-[mdi--eye-off]' : 'i-[mdi--eye-check]'
                          "
                          aria-hidden="true"
                        ></i>
                        {{ wallpaper.status === 1 ? "下架" : "重新上架" }}
                      </button>
                    </li>
                    <li>
                      <button @click="openEditModal(wallpaper)">
                        <i class="i-[mdi--pencil]" aria-hidden="true"></i>
                        编辑信息
                      </button>
                    </li>
                    <li>
                      <button
                        class="text-error"
                        :disabled="actionLoadingId === wallpaper.id"
                        @click="confirmDelete(wallpaper)"
                      >
                        <i
                          :class="[
                            actionLoadingId === wallpaper.id
                              ? 'i-[mdi--loading]'
                              : 'i-[mdi--delete]',
                            { 'animate-spin': actionLoadingId === wallpaper.id },
                          ]"
                          aria-hidden="true"
                        ></i>
                        删除壁纸
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="shouldShowPagination"
        class="flex flex-col gap-4 border-t border-line px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="text-sm text-muted">
          当前显示
          <span class="font-semibold text-fg">{{ pageRange.start }}-{{ pageRange.end }}</span>
          ，总计
          <span class="font-semibold text-fg">{{ pagination.total }}</span>
          张壁纸
        </div>
        <Pagination
          :current-page="pagination.page"
          :total-pages="pagination.pages"
          @change="changePage"
        />
      </div>
    </div>

    <!-- 上传壁纸弹窗 -->
    <dialog ref="uploadModalRef" class="wb-dialog">
      <div class="wb-dialog-box max-w-5xl">
        <button
          class="wb-btn-ghost wb-btn-sm absolute right-4 top-4"
          @click="closeUploadModal"
          :disabled="uploadLoading"
        >
          ✕
        </button>
        <div class="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-6">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-primary">
                Wallpaper Upload
              </p>
              <h3 class="mt-2 text-2xl font-semibold text-fg">上传新壁纸</h3>
              <p class="mt-1 text-sm text-muted">选择图片、设置分类与标签，支持批量标签输入</p>
            </div>

            <div class="space-y-3">
              <label class="text-sm text-muted">壁纸图片</label>
              <div
                v-if="uploadForm.previewUrl"
                class="relative overflow-hidden rounded-control border border-line bg-inset"
              >
                <img :src="uploadForm.previewUrl" alt="预览" class="h-64 w-full object-cover" />
                <button
                  type="button"
                  class="wb-btn-danger wb-btn-xs absolute right-3 top-3"
                  @click="removeUploadFile"
                  :disabled="uploadLoading"
                >
                  移除
                </button>
              </div>
              <label
                v-else
                class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-control border border-dashed border-line bg-subtle p-6 text-muted transition hover:border-primary/60 hover:text-fg"
                :class="
                  uploadDragOver ? 'border-primary bg-[color:var(--wb-accent-subtle)] text-fg' : ''
                "
                @dragover.prevent="uploadDragOver = true"
                @dragleave.prevent="uploadDragOver = false"
                @drop.prevent="onUploadDrop"
              >
                <i class="i-[mdi--cloud-upload] text-3xl text-faint" aria-hidden="true"></i>
                <div class="text-center text-sm">
                  <p>点击或拖拽图片到此处</p>
                  <p class="mt-1 text-xs text-faint">支持 JPG / PNG / WEBP，建议 4K+ 清晰度</p>
                </div>
                <input
                  ref="uploadFileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleUploadFileChange"
                />
              </label>
              <p v-if="uploadErrors.file" class="text-xs text-error">{{ uploadErrors.file }}</p>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-muted">标签（最多 {{ uploadMaxTags }} 个）</label>
              <div class="flex gap-2">
                <input
                  v-model="uploadForm.tagsInput"
                  type="text"
                  placeholder="输入标签后按回车或逗号"
                  class="wb-input flex-1"
                  :disabled="uploadLoading"
                  @keydown.enter.prevent="addUploadTagFromInput"
                />
                <button
                  type="button"
                  class="wb-btn"
                  @click="addUploadTagFromInput"
                  :disabled="uploadLoading"
                >
                  添加
                </button>
              </div>
              <div class="flex min-h-[34px] flex-wrap gap-2">
                <span v-for="tag in uploadTags" :key="tag" class="wb-chip gap-1">
                  #{{ tag }}
                  <button
                    type="button"
                    class="wb-btn-ghost wb-btn-xs text-muted"
                    @click="removeUploadTag(tag)"
                    :disabled="uploadLoading"
                  >
                    ×
                  </button>
                </span>
                <span v-if="uploadTags.length === 0" class="text-xs text-faint"
                  >例如：4K, 星空, 极简</span
                >
              </div>
              <p v-if="uploadErrors.tags" class="text-xs text-error">{{ uploadErrors.tags }}</p>
            </div>
          </div>

          <div class="space-y-5">
            <div>
              <label class="mb-1 block text-sm text-muted">分类</label>
              <select v-model="uploadForm.category" class="wb-input" :disabled="uploadLoading">
                <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <p v-if="uploadErrors.category" class="mt-1 text-xs text-error">
                {{ uploadErrors.category }}
              </p>
            </div>

            <div v-if="uploadLoading" class="space-y-2">
              <div class="flex justify-between text-xs text-muted">
                <span>上传进度</span>
                <span>{{ uploadProgress }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-inset">
                <div
                  class="h-full rounded-full bg-primary transition-all duration-300"
                  :style="{ width: uploadProgress + '%' }"
                ></div>
              </div>
            </div>

            <div class="flex flex-col gap-3 md:flex-row md:justify-end">
              <button
                type="button"
                class="wb-btn-ghost"
                @click="closeUploadModal"
                :disabled="uploadLoading"
              >
                取消
              </button>
              <button
                type="button"
                class="wb-btn-primary"
                :disabled="uploadLoading"
                @click="submitWallpaperUpload"
              >
                开始上传
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>

    <!-- 编辑壁纸弹窗 -->
    <dialog ref="editModalRef" class="wb-dialog">
      <div class="wb-dialog-box max-w-lg">
        <button
          class="wb-btn-ghost wb-btn-sm absolute right-4 top-4"
          @click="closeEditModal"
          :disabled="editLoading"
        >
          ✕
        </button>
        <div v-if="editWallpaper" class="space-y-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-primary">Edit Wallpaper</p>
            <h3 class="mt-2 text-xl font-semibold text-fg">编辑壁纸 #{{ editWallpaper.id }}</h3>
          </div>

          <!-- 预览 -->
          <div class="overflow-hidden rounded-control border border-line bg-inset">
            <img
              :src="getWallpaperImage(editWallpaper.thumbnailUrl || editWallpaper.fileUrl)"
              :alt="`壁纸 #${editWallpaper.id}`"
              class="h-48 w-full object-cover"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm text-muted">标签（逗号分隔）</label>
            <input
              v-model="editForm.tagsInput"
              type="text"
              placeholder="例如：4K, 星空, 极简"
              class="wb-input w-full"
              :disabled="editLoading"
            />
          </div>

          <div class="flex justify-end gap-3">
            <button class="wb-btn-ghost" @click="closeEditModal" :disabled="editLoading">
              取消
            </button>
            <button class="wb-btn-primary" :disabled="editLoading" @click="submitEdit">
              保存修改
            </button>
          </div>
        </div>
      </div>
    </dialog>

    <!-- 壁纸预览弹窗 -->
    <dialog ref="previewModalRef" class="wb-dialog">
      <div class="wb-dialog-box max-w-5xl">
        <button class="wb-btn-ghost wb-btn-sm absolute right-4 top-4" @click="closePreview">
          ✕
        </button>
        <div v-if="previewWallpaper" class="grid gap-6 md:grid-cols-2">
          <div class="overflow-hidden rounded-control border border-line bg-inset">
            <img
              :src="getWallpaperImage(previewWallpaper.fileUrl)"
              :alt="`壁纸 #${previewWallpaper.id}`"
              class="h-full w-full object-cover"
              @error="handleImageError"
            />
          </div>
          <div class="space-y-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-faint">Wallpaper Detail</p>
              <h3 class="mt-2 text-2xl font-semibold text-fg">壁纸 #{{ previewWallpaper.id }}</h3>
              <p class="mt-1 text-sm text-muted">
                {{ formatStatus(previewWallpaper.status) }} ·
                {{ formatDateTime(previewWallpaper.createdAt) }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="wb-chip">{{ getCategoryLabel(previewWallpaper.category) }}</span>
              <span class="wb-chip"
                >{{ previewWallpaper.width }} × {{ previewWallpaper.height }}</span
              >
              <span class="wb-chip">{{ formatFileSize(previewWallpaper.fileSize) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center text-sm text-muted">
              <div class="rounded-control border border-line bg-inset p-3">
                <p class="text-xs text-faint">浏览</p>
                <p class="text-lg font-semibold text-fg">{{ previewWallpaper.viewCount || 0 }}</p>
              </div>
              <div class="rounded-control border border-line bg-inset p-3">
                <p class="text-xs text-faint">收藏</p>
                <p class="text-lg font-semibold text-fg">
                  {{ previewWallpaper.favoriteCount || 0 }}
                </p>
              </div>
            </div>
            <div v-if="previewWallpaper.tags?.length" class="space-y-2">
              <p class="text-xs uppercase tracking-wide text-faint">Tags</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(tag, index) in previewWallpaper.tags"
                  :key="getTagKey(tag, index)"
                  class="wb-chip"
                >
                  #{{ getTagLabel(tag) }}
                </span>
              </div>
            </div>
            <div v-else class="text-xs text-faint">暂无标签</div>
            <div
              v-if="previewWallpaper.uploader"
              class="flex items-center gap-3 rounded-control border border-line bg-inset p-3"
            >
              <div class="h-10 w-10 overflow-hidden rounded-full ring-1 ring-line">
                <img
                  :src="getUploaderAvatar(previewWallpaper.uploader.avatarUrl)"
                  :alt="previewWallpaper.uploader.username"
                  class="h-full w-full object-cover"
                  @error="handleAvatarError"
                />
              </div>
              <div>
                <p class="text-sm font-semibold text-fg">
                  {{ previewWallpaper.uploader.username }}
                </p>
                <p class="text-xs text-faint">上传者</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-3">
              <button
                class="wb-btn-primary flex-1"
                @click="previewWallpaper && openInNewTab(previewWallpaper)"
              >
                <i class="i-[mdi--arrow-top-right-bold-box]" aria-hidden="true"></i>
                打开原图
              </button>
              <button
                class="wb-btn flex-1"
                @click="previewWallpaper && copyWallpaperUrl(previewWallpaper)"
              >
                <i class="i-[mdi--link-variant]" aria-hidden="true"></i>
                复制链接
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from "vue"
import adminService, {
  type AdminWallpaper,
  type AdminWallpaperQuery,
  type AdminWallpaperTag,
} from "@/services/admin"
import wallpaperService from "@/services/wallpaper"
import { confirmAction } from "@/composables/useConfirm"
import type { ApiResponse } from "@/config/api"
import Pagination from "@/components/Pagination.vue"
import { formatFileSize, formatDateTime } from "@/utils/format"

interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

const loading = ref(true)
const wallpapers = ref<AdminWallpaper[]>([])
const previewWallpaper = ref<AdminWallpaper | null>(null)
const editWallpaper = ref<AdminWallpaper | null>(null)
const editForm = reactive({ tagsInput: "" })
const editLoading = ref(false)
const actionLoadingId = ref<number | null>(null)
const selectedIds = ref<Set<number>>(new Set())
const batchLoading = ref(false)
const notification = ref<{ type: "success" | "error"; text: string } | null>(null)
const uploadModalRef = ref<HTMLDialogElement | null>(null)
const editModalRef = ref<HTMLDialogElement | null>(null)
const previewModalRef = ref<HTMLDialogElement | null>(null)
const uploadLoading = ref(false)
const uploadProgress = ref(0)

const pagination = ref<PaginationMeta>({
  page: 1,
  limit: 12,
  total: 0,
  pages: 0,
})

const filters = reactive({
  category: "",
  status: "",
  search: "",
})

const uploadForm = reactive({
  file: null as File | null,
  previewUrl: "",
  category: "general" as AdminWallpaper["category"],
  tagsInput: "",
})
const uploadTags = ref<string[]>([])
const uploadErrors = reactive({
  file: "",
  category: "",
  tags: "",
})
const uploadMaxTags = 8
const uploadFileInput = ref<HTMLInputElement | null>(null)
const categoryOptions = [
  { value: "general", label: "通用" },
  { value: "anime", label: "动漫" },
  { value: "people", label: "真人" },
]

type WallpaperTagLike = string | AdminWallpaperTag

// 占位图走本地静态资源，避免外链不可达/CSP 不合规
const DEFAULT_WALLPAPER_PLACEHOLDER = "/defaultWallpaper.svg"
const DEFAULT_AVATAR_PLACEHOLDER = "/defaultAvatar.png"

let notificationTimer: ReturnType<typeof setTimeout> | null = null

const showNotification = (text: string, type: "success" | "error" = "success") => {
  notification.value = { text, type }
  if (notificationTimer) {
    clearTimeout(notificationTimer)
  }
  notificationTimer = setTimeout(() => {
    notification.value = null
    notificationTimer = null
  }, 2600)
}

const getWallpaperImage = (url?: string | null) => {
  if (!url) return DEFAULT_WALLPAPER_PLACEHOLDER
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url
  if (url.startsWith("/")) return url
  return `/api/uploads/wallpapers/${url}`
}

const getUploaderAvatar = (url?: string | null) => {
  // COS 完整 URL 或绝对路径直返；其余（旧式文件名等）视为默认头像
  if (!url || !/^(https?:)?\//.test(url)) return DEFAULT_AVATAR_PLACEHOLDER
  return url
}

const formatStatus = (status?: number) => {
  if (status === 1) return "已发布"
  return "未发布"
}

const getCategoryLabel = (category: AdminWallpaper["category"]) => {
  switch (category) {
    case "anime":
      return "动漫"
    case "people":
      return "真人"
    default:
      return "通用"
  }
}

const getTagLabel = (tag: WallpaperTagLike) => {
  if (!tag) return ""
  if (typeof tag === "string") return tag
  return tag.name || tag.slug || (tag.id ? `ID-${tag.id}` : "标签")
}

const getTagKey = (tag: WallpaperTagLike, index?: number) => {
  if (typeof tag === "string") return `tag-${tag}`
  return `tag-${tag.id ?? tag.slug ?? tag.name ?? index ?? Math.random().toString(36).slice(2)}`
}

const normalizePagination = (payload?: Partial<PaginationMeta>): PaginationMeta => {
  const limit = payload?.limit ?? pagination.value.limit ?? 12
  const total = payload?.total ?? 0
  return {
    page: payload?.page ?? 1,
    limit,
    total,
    pages: payload?.pages ?? (limit > 0 ? Math.ceil(total / limit) : 0),
  }
}

const loadWallpapers = async () => {
  try {
    loading.value = true
    const query: AdminWallpaperQuery = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: filters.search || undefined,
      category: (filters.category || undefined) as AdminWallpaperQuery["category"],
      status: filters.status ? Number(filters.status) : undefined,
    }

    const response = await adminService.adminGetWallpapers(query)
    wallpapers.value = response.data ?? []
    pagination.value = normalizePagination(response.pagination)
  } catch (error) {
    console.error("加载壁纸列表失败:", error)
    wallpapers.value = []
    pagination.value = normalizePagination()
  } finally {
    loading.value = false
  }
}

const refreshList = () => {
  pagination.value.page = 1
  selectedIds.value.clear()
  loadWallpapers()
}

const changePage = (page: number) => {
  if (page < 1 || (pagination.value.pages && page > pagination.value.pages)) return
  pagination.value.page = page
  selectedIds.value.clear()
  loadWallpapers()
}

const clearSearch = () => {
  if (!filters.search) return
  filters.search = ""
  refreshList()
}

const resetFilters = () => {
  filters.category = ""
  filters.status = ""
  filters.search = ""
  refreshList()
}

const openPreview = (wallpaper: AdminWallpaper) => {
  previewWallpaper.value = wallpaper
  previewModalRef.value?.showModal()
}

const closePreview = () => {
  previewWallpaper.value = null
  previewModalRef.value?.close()
}

const openInNewTab = (wallpaper: AdminWallpaper) => {
  const targetUrl = getWallpaperImage(wallpaper.fileUrl)
  window.open(targetUrl, "_blank", "noopener")
}

const copyToClipboard = async (text: string, message = "已复制到剪贴板") => {
  if (!navigator?.clipboard) {
    console.warn("当前环境不支持剪贴板 API")
    showNotification("当前环境不支持自动复制", "error")
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    showNotification(message, "success")
  } catch (error) {
    console.error("复制失败:", error)
    showNotification("复制失败，请手动复制", "error")
  }
}

const copyWallpaperUrl = (wallpaper: AdminWallpaper) => {
  copyToClipboard(getWallpaperImage(wallpaper.fileUrl), "图片链接已复制")
}

const copyWallpaperId = (wallpaper: AdminWallpaper) => {
  copyToClipboard(String(wallpaper.id), "壁纸ID已复制")
}

const confirmDelete = async (wallpaper: AdminWallpaper) => {
  const confirmed = await confirmAction({
    title: "删除壁纸",
    message: `确认删除壁纸 #${wallpaper.id} ? 删除后不可恢复。`,
    confirmText: "删除",
    danger: true,
  })
  if (!confirmed) return

  try {
    actionLoadingId.value = wallpaper.id
    await adminService.adminDeleteWallpaper(wallpaper.id)
    showNotification("壁纸已删除")
    if (previewWallpaper.value?.id === wallpaper.id) {
      closePreview()
    }
    await loadWallpapers()
  } catch (error) {
    console.error("删除壁纸失败:", error)
    showNotification("删除壁纸失败，请稍后重试", "error")
  } finally {
    actionLoadingId.value = null
  }
}

const shouldShowPagination = computed(() => pagination.value.pages > 1)

const pageRange = computed(() => {
  if (!pagination.value.total) return { start: 0, end: 0 }
  const start = (pagination.value.page - 1) * pagination.value.limit + 1
  const end = Math.min(pagination.value.page * pagination.value.limit, pagination.value.total)
  return { start, end }
})

const openUploadModal = () => {
  resetUploadForm()
  uploadModalRef.value?.showModal()
}

const closeUploadModal = () => {
  uploadModalRef.value?.close()
  resetUploadForm()
}

const resetUploadForm = () => {
  if (uploadForm.previewUrl) {
    URL.revokeObjectURL(uploadForm.previewUrl)
  }
  uploadForm.file = null
  uploadForm.previewUrl = ""
  uploadForm.category = "general"
  uploadForm.tagsInput = ""
  uploadTags.value = []
  uploadErrors.file = ""
  uploadErrors.category = ""
  uploadErrors.tags = ""
  uploadProgress.value = 0
  if (uploadFileInput.value) {
    uploadFileInput.value.value = ""
  }
}

const uploadDragOver = ref(false)

const applyUploadFile = (file?: File) => {
  if (!file) {
    uploadErrors.file = "请选择要上传的图片"
    return
  }
  if (!file.type.startsWith("image/")) {
    uploadErrors.file = "仅支持图片文件"
    return
  }
  if (uploadForm.previewUrl) {
    URL.revokeObjectURL(uploadForm.previewUrl)
  }
  uploadForm.file = file
  uploadForm.previewUrl = URL.createObjectURL(file)
  uploadErrors.file = ""
}

const handleUploadFileChange = (event: Event) => {
  applyUploadFile((event.target as HTMLInputElement).files?.[0])
}

const onUploadDrop = (e: DragEvent) => {
  uploadDragOver.value = false
  applyUploadFile(e.dataTransfer?.files?.[0])
}

const removeUploadFile = () => {
  if (uploadForm.previewUrl) {
    URL.revokeObjectURL(uploadForm.previewUrl)
  }
  uploadForm.file = null
  uploadForm.previewUrl = ""
  uploadErrors.file = ""
  if (uploadFileInput.value) {
    uploadFileInput.value.value = ""
  }
}

const addUploadTagFromInput = () => {
  if (!uploadForm.tagsInput) return

  const candidates = uploadForm.tagsInput
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)

  uploadForm.tagsInput = ""

  for (const tag of candidates) {
    if (uploadTags.value.includes(tag)) continue
    if (uploadTags.value.length >= uploadMaxTags) {
      uploadErrors.tags = `最多添加 ${uploadMaxTags} 个标签`
      break
    }
    uploadTags.value.push(tag)
    uploadErrors.tags = ""
  }
}

const removeUploadTag = (tag: string) => {
  uploadTags.value = uploadTags.value.filter((item) => item !== tag)
  if (uploadTags.value.length < uploadMaxTags) {
    uploadErrors.tags = ""
  }
}

const validateUploadForm = () => {
  let valid = true
  uploadErrors.file = ""
  uploadErrors.category = ""
  uploadErrors.tags = ""

  if (!uploadForm.file) {
    uploadErrors.file = "请选择要上传的图片"
    valid = false
  }

  if (!uploadForm.category) {
    uploadErrors.category = "请选择分类"
    valid = false
  }

  if (uploadTags.value.length > uploadMaxTags) {
    uploadErrors.tags = `最多添加 ${uploadMaxTags} 个标签`
    valid = false
  }

  return valid
}

const submitWallpaperUpload = async () => {
  if (uploadForm.tagsInput.trim()) {
    addUploadTagFromInput()
  }

  if (!validateUploadForm() || !uploadForm.file) return

  try {
    uploadLoading.value = true
    uploadProgress.value = 0

    const { response } = await wallpaperService.uploadWallpaper(
      {
        file: uploadForm.file,
        category: uploadForm.category,
        tags: uploadTags.value,
      },
      (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      },
    )

    const uploadResponse = response as ApiResponse<AdminWallpaper>
    if (uploadResponse.success && uploadResponse.data) {
      // 分类已随上传 FormData 提交，无需再补偿 PATCH
      showNotification("壁纸上传成功")
      closeUploadModal()
      await loadWallpapers()
    } else {
      throw new Error(uploadResponse.message || "上传失败")
    }
  } catch (error) {
    console.error("上传壁纸失败:", error)
    const message = error instanceof Error ? error.message : "上传失败，请稍后重试"
    showNotification(message, "error")
  } finally {
    uploadLoading.value = false
    uploadProgress.value = 0
  }
}

const handleImageError = (event: Event) => {
  // 本地占位图兜底且只回退一次，避免坏地址反复触发 error
  const img = event.target as HTMLImageElement
  if (img.dataset.imageFallback === "1") return
  img.dataset.imageFallback = "1"
  img.src = DEFAULT_WALLPAPER_PLACEHOLDER
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.dataset.avatarFallback === "1") return
  img.dataset.avatarFallback = "1"
  img.src = DEFAULT_AVATAR_PLACEHOLDER
}

// 批量选择
const toggleSelect = (id: number) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 只反选当前页可见项，不误伤其他页保留的勾选
    wallpapers.value.forEach((w) => selectedIds.value.delete(w.id))
  } else {
    wallpapers.value.forEach((w) => selectedIds.value.add(w.id))
  }
}

const isSelected = (id: number) => selectedIds.value.has(id)

const hasSelection = computed(() => selectedIds.value.size > 0)
// 全选判定只看当前页可见项是否都在集合内
const isAllSelected = computed(
  () => wallpapers.value.length > 0 && wallpapers.value.every((w) => selectedIds.value.has(w.id)),
)

// 单卡推荐切换：复用批量接口传单个 id
const toggleFeatured = async (wallpaper: AdminWallpaper) => {
  if (actionLoadingId.value === wallpaper.id) return
  actionLoadingId.value = wallpaper.id
  try {
    await adminService.adminBatchSetFeatured([wallpaper.id], !wallpaper.isFeatured)
    wallpaper.isFeatured = !wallpaper.isFeatured
    showNotification(wallpaper.isFeatured ? "已设为推荐" : "已取消推荐")
  } catch (error) {
    console.error("切换推荐失败:", error)
    showNotification("切换推荐失败", "error")
  } finally {
    actionLoadingId.value = null
  }
}

// 下架/重新上架：走管理端通用 PATCH（服务端内部走公开状态切换的标签门槛与 COS 记账）
const toggleWallpaperStatus = async (wallpaper: AdminWallpaper) => {
  const hide = wallpaper.status === 1
  const confirmed = await confirmAction({
    title: hide ? "下架壁纸" : "重新上架",
    message: hide
      ? `确认下架壁纸 #${wallpaper.id}？下架后前台不再展示，可随时恢复。`
      : `确认将壁纸 #${wallpaper.id} 重新上架？`,
    confirmText: hide ? "下架" : "上架",
    danger: hide,
  })
  if (!confirmed) return
  if (actionLoadingId.value === wallpaper.id) return
  actionLoadingId.value = wallpaper.id
  try {
    await adminService.adminUpdateWallpaper(wallpaper.id, { status: hide ? 0 : 1 })
    // 本地即时翻转保观感，最终以 loadWallpapers 回源为准
    wallpaper.status = hide ? 0 : 1
    showNotification(hide ? "已下架" : "已重新上架")
    await loadWallpapers()
  } catch (error) {
    console.error("切换上下架失败:", error)
    showNotification("操作失败，请稍后重试", "error")
  } finally {
    actionLoadingId.value = null
  }
}

// 批量设置推荐
const batchSetFeatured = async (isFeatured: boolean) => {
  if (!selectedIds.value.size) return
  const action = isFeatured ? "设为推荐" : "取消推荐"
  const confirmed = await confirmAction({
    title: "批量操作",
    message: `确认将 ${selectedIds.value.size} 个壁纸${action}？`,
    confirmText: "确认",
  })
  if (!confirmed) return

  try {
    batchLoading.value = true
    const ids = Array.from(selectedIds.value)
    await adminService.adminBatchSetFeatured(ids, isFeatured)
    showNotification(`已${action} ${ids.length} 个壁纸`)
    selectedIds.value.clear()
    await loadWallpapers()
  } catch (error) {
    console.error(`批量${action}失败:`, error)
    showNotification(`批量${action}失败`, "error")
  } finally {
    batchLoading.value = false
  }
}

const batchDeleteSelected = async () => {
  if (!selectedIds.value.size) return
  const confirmed = await confirmAction({
    title: "批量删除",
    message: `确认删除 ${selectedIds.value.size} 个壁纸？删除后不可恢复。`,
    confirmText: "删除",
    danger: true,
  })
  if (!confirmed) return

  try {
    batchLoading.value = true
    const ids = Array.from(selectedIds.value)
    await adminService.adminBatchDeleteWallpapers(ids)
    showNotification(`已删除 ${ids.length} 个壁纸`)
    selectedIds.value.clear()
    await loadWallpapers()
  } catch (error) {
    console.error("批量删除壁纸失败:", error)
    showNotification("批量删除失败", "error")
  } finally {
    batchLoading.value = false
  }
}

// 编辑壁纸标签
const openEditModal = (wallpaper: AdminWallpaper) => {
  editWallpaper.value = wallpaper
  editForm.tagsInput = (wallpaper.tags || [])
    .map((tag) => getTagLabel(tag))
    .filter(Boolean)
    .join(", ")
  editModalRef.value?.showModal()
}

const closeEditModal = () => {
  editWallpaper.value = null
  editForm.tagsInput = ""
  editModalRef.value?.close()
}

const submitEdit = async () => {
  if (!editWallpaper.value) return
  try {
    editLoading.value = true
    const tags = editForm.tagsInput
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
    await adminService.adminUpdateWallpaperTags(editWallpaper.value.id, { tags })
    showNotification("壁纸信息已更新")
    closeEditModal()
    await loadWallpapers()
  } catch (error) {
    console.error("更新壁纸信息失败:", error)
    showNotification("更新失败，请稍后重试", "error")
  } finally {
    editLoading.value = false
  }
}

onMounted(() => {
  loadWallpapers()
})
</script>
