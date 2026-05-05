<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <div class="mx-auto max-w-5xl px-4 py-10">
      <!-- 主要内容卡片 -->
      <div
        class="space-y-8 rounded-3xl border-2 border-slate-200/70 bg-white/95 p-8 shadow-xl shadow-slate-200/60 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-black/30"
      >
        <!-- 上传状态提示 -->
        <div
          v-if="uploadStatus"
          class="alert rounded-2xl shadow-md transition-all duration-300"
          :class="{
            'bg-success/10 ring-success/20 alert-success text-success ring-1':
              uploadStatus.type === 'success',
            'bg-error/10 ring-error/20 alert-error text-error ring-1':
              uploadStatus.type === 'error',
            'bg-info/10 ring-info/20 alert-info text-info ring-1': uploadStatus.type === 'info',
          }"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full"
              :class="{
                'bg-success/20': uploadStatus.type === 'success',
                'bg-error/20': uploadStatus.type === 'error',
                'bg-info/20': uploadStatus.type === 'info',
              }"
            >
              <svg
                v-if="uploadStatus.type === 'success'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
                <path fill="none" d="M0 0h24v24H0z" />
              </svg>
              <svg
                v-else-if="uploadStatus.type === 'error'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                />
              </svg>
            </div>
            <div class="flex-1">
              <p class="font-medium">{{ uploadStatus.message }}</p>
            </div>
            <button
              v-if="uploadStatus.type === 'success'"
              class="hover:bg-primary/10 btn btn-ghost btn-sm rounded-full text-primary"
              @click="resetForm"
            >
              继续上传
            </button>
          </div>
        </div>

        <!-- 上传区域 -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-primary ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  />
                </svg>
              </div>
              <label class="text-base font-semibold">选择壁纸</label>
            </div>
            <!-- 简洁的提示信息 -->
            <div
              class="hidden items-center gap-4 text-xs text-slate-500 dark:text-slate-400 sm:flex"
            >
              <span class="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  />
                </svg>
                推荐 1920×1080 或更高
              </span>
              <span class="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M20.59,13.41L12,22L8,18L18.24,7.76C18.46,7.37 18.61,6.92 18.67,6.46L15.11,9.99L13.11,7.99L16.54,4.56C16.92,4.19 17.37,4.02 17.83,3.96L17.95,3.5L13.37,4.08L9.83,0.54C9.47,0.18 8.99,0 8.5,0C8,0 7.52,0.18 7.16,0.54L3.5,4.2C3.37,4.36 3.26,4.53 3.17,4.71L0.81,8.24L4.29,11.71L1.2,14.8C0.84,15.16 0.66,15.64 0.66,16.13C0.66,16.62 0.84,17.1 1.2,17.46L4.83,21.09C5.19,21.45 5.67,21.63 6.16,21.63C6.65,21.63 7.13,21.45 7.49,21.09L11.17,17.41C11.36,17.32 11.53,17.21 11.69,17.08L15.17,20.56L18.59,17.13L14.95,13.5C15.03,13.35 15.09,13.18 15.13,13L19.54,8.59L20.59,9.64C20.95,10 21.13,10.48 21.13,10.97C21.13,11.46 20.95,11.94 20.59,12.3L20.59,13.41ZM12,4C12.55,4 13,4.45 13,5C13,5.55 12.55,6 12,6C11.45,6 11,5.55 11,5C11,4.45 11.45,4 12,4Z"
                  />
                </svg>
                添加准确标签
              </span>
              <span class="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.4 14.8,17.4H9.2C8.6,17.4 8,16.8 8,16.2V12.7C8,12.1 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.9 10.5,10V11.5H13.5V10C13.5,8.9 12.8,8.2 12,8.2Z"
                  />
                </svg>
                内容健康合规
              </span>
            </div>
          </div>

          <div
            class="hover:border-primary/50 hover:bg-primary/5 group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-white p-12 text-center transition-all duration-300 hover:shadow-xl dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
            :class="{
              'bg-primary/10 shadow-primary/20 dark:bg-primary/20 scale-[1.02] border-primary shadow-2xl':
                isDragging,
              'bg-error/5 dark:border-error/600 dark:bg-error/10 border-error': errors.image,
            }"
            @click="fileInput?.click()"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              class="hidden"
              @change="handleFileSelect"
            />

            <!-- 空状态 -->
            <div v-if="!previewImage" class="flex flex-col items-center gap-6">
              <div class="relative">
                <div
                  class="from-primary/10 to-secondary/10 flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-slate-200 bg-slate-50 bg-gradient-to-br text-primary shadow-lg transition-transform group-hover:scale-110 group-hover:shadow-2xl dark:border-slate-600 dark:bg-slate-800/50"
                  :class="{ 'animate-pulse': isDragging }"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-10 w-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
                    />
                  </svg>
                </div>
                <div
                  v-if="isDragging"
                  class="bg-primary/20 absolute -inset-4 animate-ping rounded-full"
                ></div>
              </div>
              <div class="space-y-2">
                <p class="text-xl font-bold">
                  {{ isDragging ? "释放以上传壁纸" : "拖拽或点击上传" }}
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  支持 JPG / PNG / WEBP，最大 50MB
                </p>
              </div>
              <div class="flex gap-2">
                <div
                  class="badge badge-lg gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-4 py-3 text-sky-700 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    />
                  </svg>
                  <span class="font-medium">推荐高清</span>
                </div>
                <div
                  class="badge badge-lg gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.4 14.8,17.4H9.2C8.6,17.4 8,16.8 8,16.2V12.7C8,12.1 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.9 10.5,10V11.5H13.5V10C13.5,8.9 12.8,8.2 12,8.2Z"
                    />
                  </svg>
                  <span class="font-medium">安全可靠</span>
                </div>
              </div>
            </div>

            <!-- 预览状态 -->
            <div v-else class="relative">
              <div
                class="overflow-hidden rounded-3xl shadow-lg ring-4 ring-white dark:ring-slate-700"
              >
                <img
                  :src="previewImage"
                  alt="预览图"
                  class="h-96 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <!-- 操作按钮 -->
              <div class="absolute right-6 top-6 flex gap-2">
                <button
                  class="btn btn-error btn-sm btn-circle shadow-xl transition-all hover:rotate-90 hover:scale-110"
                  @click.stop="removeImage"
                  title="删除图片"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
                <button
                  class="btn btn-primary btn-sm btn-circle shadow-xl transition-all hover:scale-110"
                  @click.stop="fileInput?.click()"
                  title="重新选择"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                    />
                  </svg>
                </button>
              </div>

              <!-- 图片信息叠加 -->
              <div
                class="absolute bottom-6 left-6 right-6 overflow-hidden rounded-2xl bg-black/70 p-4 text-white ring-1 ring-white/10 backdrop-blur-md dark:bg-black/80 dark:ring-white/20"
              >
                <div class="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p class="text-xs text-white/70">尺寸</p>
                    <p class="font-medium" v-if="imageInfo">
                      {{ imageInfo.width }} × {{ imageInfo.height }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-white/70">大小</p>
                    <p class="font-medium" v-if="imageInfo">{{ imageInfo.size }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-white/70">格式</p>
                    <p class="font-medium" v-if="imageInfo">{{ imageInfo.type }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p v-if="errors.image" class="animate-shake flex items-center gap-1 text-sm text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              />
            </svg>
            {{ errors.image }}
          </p>
        </div>

        <!-- 图片信息卡片 -->
        <div
          v-if="imageInfo"
          class="from-primary/5 to-secondary/50 rounded-2xl border border-slate-200 bg-slate-50 bg-gradient-to-br p-1 dark:border-slate-700 dark:bg-slate-900/50"
        >
          <div class="mb-3 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11 7h2v2h-2zm0 4h2v6h-2z" />
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              />
            </svg>
            <h3 class="text-sm font-semibold text-primary">图片信息</h3>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl bg-white/60 p-3 dark:bg-slate-700/50">
              <p class="mb-1 text-xs text-slate-500 dark:text-slate-400">文件名</p>
              <p class="truncate font-medium" :title="imageInfo.name">{{ imageInfo.name }}</p>
            </div>
            <div class="rounded-xl bg-white/60 p-3 dark:bg-slate-700/50">
              <p class="mb-1 text-xs text-slate-500 dark:text-slate-400">文件大小</p>
              <p class="font-medium">{{ imageInfo.size }}</p>
            </div>
            <div class="rounded-xl bg-white/60 p-3 dark:bg-slate-700/50">
              <p class="mb-1 text-xs text-slate-500 dark:text-slate-400">分辨率</p>
              <p class="font-medium">{{ imageInfo.width }} × {{ imageInfo.height }}</p>
            </div>
            <div class="rounded-xl bg-white/60 p-3 dark:bg-slate-700/50">
              <p class="mb-1 text-xs text-slate-500 dark:text-slate-400">格式</p>
              <p class="font-medium">{{ imageInfo.type }}</p>
            </div>
          </div>
        </div>

        <!-- 标题和描述 -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <div
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-emerald-600 ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4v3h5.5v12h3V7H19V4z"/>
              </svg>
            </div>
            <label class="text-base font-semibold">标题与描述</label>
            <span class="text-xs text-slate-400">（可选）</span>
          </div>
          <div class="space-y-3">
            <input
              v-model="formData.title"
              type="text"
              placeholder="为你的壁纸起个名字..."
              maxlength="200"
              class="input h-12 w-full rounded-2xl border-2 border-slate-300 bg-white pl-4 pr-4 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 focus:border-primary focus:ring-4 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus:border-primary"
            />
            <div class="text-right text-xs text-slate-400">{{ formData.title.length }}/200</div>
            <textarea
              v-model="formData.description"
              placeholder="描述一下这张壁纸的灵感来源、拍摄地点或创作故事..."
              rows="3"
              maxlength="2000"
              class="textarea w-full rounded-2xl border-2 border-slate-300 bg-white pl-4 pr-4 pt-3 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 focus:border-primary focus:ring-4 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus:border-primary"
            ></textarea>
            <div class="text-right text-xs text-slate-400">{{ (formData.description || '').length }}/2000</div>
          </div>
        </div>

        <!-- 标签区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-secondary ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M20.59,13.41L12,22L8,18L18.24,7.76C18.46,7.37 18.61,6.92 18.67,6.46L15.11,9.99L13.11,7.99L16.54,4.56C16.92,4.19 17.37,4.02 17.83,3.96L17.95,3.5L13.37,4.08L9.83,0.54C9.47,0.18 8.99,0 8.5,0C8,0 7.52,0.18 7.16,0.54L3.5,4.2C3.37,4.36 3.26,4.53 3.17,4.71L0.81,8.24L4.29,11.71L1.2,14.8C0.84,15.16 0.66,15.64 0.66,16.13C0.66,16.62 0.84,17.1 1.2,17.46L4.83,21.09C5.19,21.45 5.67,21.63 6.16,21.63C6.65,21.63 7.13,21.45 7.49,21.09L11.17,17.41C11.36,17.32 11.53,17.21 11.69,17.08L15.17,20.56L18.59,17.13L14.95,13.5C15.03,13.35 15.09,13.18 15.13,13L19.54,8.59L20.59,9.64C20.95,10 21.13,10.48 21.13,10.97C21.13,11.46 20.95,11.94 20.59,12.3L20.59,13.41ZM12,4C12.55,4 13,4.45 13,5C13,5.55 12.55,6 12,6C11.45,6 11,5.55 11,5C11,4.45 11.45,4 12,4Z"
                  />
                </svg>
              </div>
              <label class="text-base font-semibold">标签分类</label>
              <div class="badge badge-primary gap-1 rounded-full px-3 py-2 text-xs font-medium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M20.59,13.41L12,22L8,18L18.24,7.76C18.46,7.37 18.61,6.92 18.67,6.46L15.11,9.99L13.11,7.99L16.54,4.56C16.92,4.19 17.37,4.02 17.83,3.96L17.95,3.5L13.37,4.08L9.83,0.54C9.47,0.18 8.99,0 8.5,0C8,0 7.52,0.18 7.16,0.54L3.5,4.2C3.37,4.36 3.26,4.53 3.17,4.71L0.81,8.24L4.29,11.71L1.2,14.8C0.84,15.16 0.66,15.64 0.66,16.13C0.66,16.62 0.84,17.1 1.2,17.46L4.83,21.09C5.19,21.45 5.67,21.63 6.16,21.63C6.65,21.63 7.13,21.45 7.49,21.09L11.17,17.41C11.36,17.32 11.53,17.21 11.69,17.08L15.17,20.56L18.59,17.13L14.95,13.5C15.03,13.35 15.09,13.18 15.13,13L19.54,8.59L20.59,9.64C20.95,10 21.13,10.48 21.13,10.97C21.13,11.46 20.95,11.94 20.59,12.3L20.59,13.41ZM12,4C12.55,4 13,4.45 13,5C13,5.55 12.55,6 12,6C11.45,6 11,5.55 11,5C11,4.45 11.45,4 12,4Z"
                  />
                </svg>
                {{ selectedTags.length }}/{{ MAX_TAGS }}
              </div>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">帮助大家快速找到你的壁纸</p>
          </div>

          <!-- 已选标签展示 -->
          <div
            class="flex min-h-[3.5rem] flex-wrap gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
          >
            <div
              v-for="tag in selectedTags"
              :key="tag"
              class="border-primary/30 group badge badge-lg gap-1.5 rounded-full border-2 bg-gradient-to-r from-primary to-secondary px-3 text-primary-content shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M20.59,13.41L12,22L8,18L18.24,7.76C18.46,7.37 18.61,6.92 18.67,6.46L15.11,9.99L13.11,7.99L16.54,4.56C16.92,4.19 17.37,4.02 17.83,3.96L17.95,3.5L13.37,4.08L9.83,0.54C9.47,0.18 8.99,0 8.5,0C8,0 7.52,0.18 7.16,0.54L3.5,4.2C3.37,4.36 3.26,4.53 3.17,4.71L0.81,8.24L4.29,11.71L1.2,14.8C0.84,15.16 0.66,15.64 0.66,16.13C0.66,16.62 0.84,17.1 1.2,17.46L4.83,21.09C5.19,21.45 5.67,21.63 6.16,21.63C6.65,21.63 7.13,21.45 7.49,21.09L11.17,17.41C11.36,17.32 11.53,17.21 11.69,17.08L15.17,20.56L18.59,17.13L14.95,13.5C15.03,13.35 15.09,13.18 15.13,13L19.54,8.59L20.59,9.64C20.95,10 21.13,10.48 21.13,10.97C21.13,11.46 20.95,11.94 20.59,12.3L20.59,13.41Z"
                />
              </svg>
              {{ tag }}
              <button
                class="hover:bg-error/20 focus:ring-error/50 btn btn-ghost btn-xs btn-circle !p-0 opacity-80 transition-opacity hover:text-error focus:outline-none focus:ring-2 group-hover:opacity-100"
                @click.stop="removeTag(tag)"
                title="删除标签"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </button>
            </div>
            <span
              v-if="selectedTags.length === 0"
              class="text-sm italic text-slate-400 dark:text-slate-500"
            >
              请选择或输入标签
            </span>
          </div>

          <!-- 标签输入区 -->
          <div class="space-y-3">
            <div class="flex flex-col gap-3 sm:flex-row">
              <div class="relative flex-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M20.59,13.41L12,22L8,18L18.24,7.76C18.46,7.37 18.61,6.92 18.67,6.46L15.11,9.99L13.11,7.99L16.54,4.56C16.92,4.19 17.37,4.02 17.83,3.96L17.95,3.5L13.37,4.08L9.83,0.54C9.47,0.18 8.99,0 8.5,0C8,0 7.52,0.18 7.16,0.54L3.5,4.2C3.37,4.36 3.26,4.53 3.17,4.71L0.81,8.24L4.29,11.71L1.2,14.8C0.84,15.16 0.66,15.64 0.66,16.13C0.66,16.62 0.84,17.1 1.2,17.46L4.83,21.09C5.19,21.45 5.67,21.63 6.16,21.63C6.65,21.63 7.13,21.45 7.49,21.09L11.17,17.41C11.36,17.32 11.53,17.21 11.69,17.08L15.17,20.56L18.59,17.13L14.95,13.5C15.03,13.35 15.09,13.18 15.13,13L19.54,8.59L20.59,9.64C20.95,10 21.13,10.48 21.13,10.97C21.13,11.46 20.95,11.94 20.59,12.3L20.59,13.41Z"
                  />
                </svg>
                <input
                  v-model="tagSearch"
                  type="text"
                  placeholder="输入标签后回车或点击添加..."
                  class="focus:ring-primary/20 input h-12 w-full rounded-2xl border-2 border-slate-300 bg-white pl-12 pr-4 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 focus:border-primary focus:ring-4 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus:border-primary"
                  @keyup.enter.prevent="addCustomTag"
                />
              </div>
              <button
                class="btn btn-primary h-12 rounded-2xl px-8 shadow-md transition-all hover:scale-105 hover:shadow-lg"
                @click="addCustomTag"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="mr-1 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                添加标签
              </button>
            </div>
          </div>

          <!-- 智能推荐标签 -->
          <div
            v-if="tagSuggestions.length > 0"
            class="rounded-2xl border-2 border-sky-200 bg-sky-50 p-1 dark:border-sky-800 dark:bg-sky-900/40"
          >
            <div class="mb-2 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 text-warning"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"
                />
              </svg>
              <p class="text-xs font-semibold text-primary">实时建议</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in tagSuggestions"
                :key="tag.id"
                type="button"
                class="hover:bg-primary/10 badge badge-outline cursor-pointer rounded-full px-3 py-1.5 text-sm transition-all hover:scale-105 hover:border-primary hover:text-primary hover:shadow-md"
                @click="addTag(tag.name)"
              >
                {{ tag.name }}
              </button>
            </div>
          </div>

          <!-- 热门标签 -->
          <div class="space-y-3">
            <div
              class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
            >
              <span class="font-medium">常用标签</span>
              <button
                class="btn btn-ghost btn-xs gap-1.5 rounded-full border border-slate-300 px-3 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                type="button"
                :class="{ loading: tagsLoading }"
                :disabled="tagsLoading"
                @click="loadRecommendedTags"
                title="刷新后台最新标签"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  v-if="!tagsLoading"
                >
                  <path
                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                  />
                </svg>
                <span v-else></span>
                刷新
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in recommendedTags"
                :key="tag"
                type="button"
                class="badge badge-lg cursor-pointer gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all hover:scale-105 hover:shadow-md"
                :class="
                  selectedTags.includes(tag)
                    ? 'border-primary bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg'
                    : 'hover:border-primary/40 hover:bg-primary/5 border-slate-300 bg-white text-slate-600 hover:text-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                "
                @click="toggleTag(tag)"
              >
                <svg
                  v-if="selectedTags.includes(tag)"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                {{ tag }}
              </button>
            </div>
          </div>

          <p v-if="errors.tags" class="flex items-center gap-1 text-sm text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              />
            </svg>
            {{ errors.tags }}
          </p>
        </div>

        <!-- 分类选择 -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <div
              class="from-accent/20 to-accent/5 ring-accent/10 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-accent shadow-sm ring-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
                />
              </svg>
            </div>
            <label class="text-base font-semibold text-slate-700 dark:text-slate-300"
              >所属分类</label
            >
          </div>
          <div
            class="grid grid-cols-3 gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
          >
            <button
              v-for="category in categories"
              :key="category.value"
              type="button"
              class="group flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              :class="
                formData.category === category.value
                  ? 'from-primary/10 to-secondary/10 ring-primary/30 dark:from-primary/20 dark:to-secondary/20 border-primary bg-gradient-to-br shadow-lg ring-1'
                  : 'hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800'
              "
              @click="formData.category = category.value"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all"
                :class="
                  formData.category === category.value
                    ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-md'
                    : 'bg-slate-100 text-slate-500 group-hover:text-primary dark:bg-slate-700 dark:text-slate-400'
                "
              >
                <svg
                  v-if="category.value === 'general'"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
                <svg
                  v-else-if="category.value === 'anime'"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  />
                </svg>
              </div>
              <span
                class="text-sm font-semibold transition-colors"
                :class="
                  formData.category === category.value
                    ? 'text-primary'
                    : 'text-slate-600 group-hover:text-primary dark:text-slate-400'
                "
              >
                {{ category.label }}
              </span>
            </button>
          </div>
          <p v-if="errors.category" class="flex items-center gap-1 text-sm text-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              />
            </svg>
            {{ errors.category }}
          </p>
        </div>

        <!-- 上传进度 -->
        <div
          v-if="isUploading"
          class="from-primary/10 to-secondary/10 ring-primary/20 dark:from-primary/15 dark:to-secondary/15 dark:ring-primary/30 space-y-4 rounded-2xl bg-gradient-to-r p-5 ring-1"
        >
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <div
                class="shadow-primary/50 h-2.5 w-2.5 animate-pulse rounded-full bg-primary shadow-lg"
              ></div>
              <span class="font-semibold text-primary">正在上传...</span>
            </div>
            <span class="text-base font-bold text-primary">{{ uploadProgress }}%</span>
          </div>
          <div
            class="relative h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
          >
            <div
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-500"
              :style="{ width: uploadProgress + '%' }"
            >
              <div class="absolute inset-0 animate-pulse bg-white/20"></div>
            </div>
          </div>
          <div class="flex justify-end">
            <button
              class="hover:bg-error/10 btn btn-ghost btn-sm gap-1.5 rounded-full text-error transition-all"
              @click="cancelUpload"
              :disabled="!currentRequestId"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </svg>
              取消上传
            </button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col gap-3 pt-6 sm:flex-row">
          <button
            class="btn btn-primary h-14 flex-1 rounded-2xl text-base font-semibold shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
            :class="{
              loading: loading,
              'btn-disabled cursor-not-allowed opacity-60': loading || !formData.imageFile,
            }"
            :disabled="loading || !formData.imageFile"
            @click="handleSubmit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              v-if="!loading"
            >
              <path
                d="M19.35,10.04C18.67,6.59 15.64,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,12.6 20.95,12.22 20.88,11.85L18.27,9.24C18.5,7.6 18.11,5.96 17.19,4.73C16.27,3.5 14.94,2.76 13.5,2.73C11.55,2.69 9.74,3.57 8.63,4.97L6.05,2.39C7.46,0.68 9.59,0 12,0C17.52,0 22,4.48 22,10C22,15.52 17.52,20 12,20C7.69,20 4.17,17.34 3.06,13.62L0.64,11.2C-0.25,9.16 0.02,6.87 1.28,5.15C2.54,3.43 4.6,2.64 6.66,2.64L9,2.64C10.24,2.64 11.41,3.19 12.21,4.11C13,5.03 13.42,6.17 13.42,7.36V9.06C13.42,10.25 13,11.39 12.21,12.31C11.41,13.23 10.24,13.78 9,13.78L7.31,13.78"
              />
            </svg>
            <span class="text-base">
              {{ loading ? "上传中..." : "立即上传" }}
            </span>
          </button>
          <button
            class="btn h-14 rounded-2xl text-base font-medium shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            @click="$router.back()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            返回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from "vue"
import axios from "axios"
import { wallpaperService } from "@/services/wallpaper"
import tagService, { type Tag } from "@/services/tag"
import { useUserStore } from "@/stores/user"
import { cancelRequest } from "@/config/api"

const userStore = useUserStore()
const fileInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const isDragging = ref(false)
const previewImage = ref<string>("")
const uploadProgress = ref<number>(0)
const isUploading = ref<boolean>(false)
const currentRequestId = ref<string>("")
const uploadStatus = ref<{ type: string; message: string } | null>(null)

// 当前用户ID
const currentUserId = computed(() => userStore.user?.id || 0)

// 表单数据
const formData = reactive({
  imageFile: null as File | null,
  category: "general",
  tags: [] as string[],
  title: "",
  description: "",
})

// 图片信息
const imageInfo = ref<{
  name: string
  size: string
  width: number
  height: number
  type: string
} | null>(null)

// 错误信息
const errors = reactive({
  image: "",
  category: "",
  tags: "",
})

// 可用标签
const defaultTagSeeds = [
  "4K",
  "8K",
  "高清",
  "超清",
  "风景",
  "星空",
  "海洋",
  "森林",
  "城市",
  "动漫",
  "游戏",
  "电影",
  "艺术",
  "暗色",
  "亮色",
  "渐变",
  "抽象",
  "自然",
  "动物",
  "植物",
  "建筑",
]

const recommendedTags = ref<string[]>([...defaultTagSeeds])
const tagSuggestions = ref<Tag[]>([])
const tagSearch = ref("")
const MAX_TAG_LENGTH = 30
const MAX_TAGS = 5
const tagsLoading = ref(false)

// 可用分类
const categories = [
  { value: "general", label: "全部" },
  { value: "anime", label: "动漫" },
  { value: "people", label: "人物" },
]

// 选中的标签
const selectedTags = ref<string[]>([])

const normalizeTag = (tag: string) => tag.replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH)

const addTag = (tag: string) => {
  const normalized = normalizeTag(tag)
  if (!normalized) {
    return
  }

  if (selectedTags.value.includes(normalized)) {
    errors.tags = ""
    return
  }

  if (selectedTags.value.length >= MAX_TAGS) {
    errors.tags = `最多选择 ${MAX_TAGS} 个标签`
    return
  }

  selectedTags.value.push(normalized)
  formData.tags = [...selectedTags.value]
  errors.tags = ""
}

const removeTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index !== -1) {
    selectedTags.value.splice(index, 1)
    formData.tags = [...selectedTags.value]
  }
}

const toggleTag = (tag: string) => {
  const normalized = normalizeTag(tag)
  const index = selectedTags.value.indexOf(normalized)
  if (index === -1) {
    addTag(normalized)
  } else {
    removeTag(normalized)
  }
}

const addCustomTag = () => {
  addTag(tagSearch.value)
  tagSearch.value = ""
  tagSuggestions.value = []
}

const loadRecommendedTags = async () => {
  tagsLoading.value = true
  try {
    const response = await tagService.getTags({
      sortBy: "createdAt",
      sortOrder: "DESC",
      limit: 60,
    })
    const serverTags = response.data || []
    if (Array.isArray(serverTags) && serverTags.length > 0) {
      const uniqueNames = Array.from(new Set(serverTags.map((tag) => tag.name)))
      recommendedTags.value = uniqueNames
    } else {
      recommendedTags.value = [...defaultTagSeeds]
    }
  } catch (error) {
    console.error("加载推荐标签失败:", error)
    recommendedTags.value = [...defaultTagSeeds]
  } finally {
    tagsLoading.value = false
  }
}

const fetchTagSuggestions = async (keyword: string) => {
  const value = keyword.trim()
  if (!value) {
    tagSuggestions.value = []
    return
  }

  try {
    const response = await tagService.getTags({
      keyword: value,
      limit: 6,
    })
    tagSuggestions.value =
      response.data?.filter((tag) => !selectedTags.value.includes(tag.name)) || []
  } catch (error) {
    console.error("获取标签建议失败:", error)
  }
}

watch(
  () => tagSearch.value,
  (value) => {
    if (value.trim()) {
      fetchTagSuggestions(value)
    } else {
      tagSuggestions.value = []
    }
  },
)

onMounted(() => {
  loadRecommendedTags()
})

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    processImageFile(input.files[0])
  }
}

// 处理拖拽放置
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processImageFile(event.dataTransfer.files[0])
  }
}

// 处理图片文件
const processImageFile = (file: File) => {
  if (!file.type.startsWith("image/")) {
    errors.image = "请选择图片文件"
    return
  }

  if (file.size > 50 * 1024 * 1024) {
    errors.image = "图片大小不能超过 50MB"
    return
  }

  formData.imageFile = file
  errors.image = ""

  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target?.result as string

    const img = new Image()
    img.onload = () => {
      imageInfo.value = {
        name: file.name,
        size: formatFileSize(file.size),
        width: img.width,
        height: img.height,
        type: file.type.split("/")[1].toUpperCase(),
      }
    }
    img.src = previewImage.value
  }
  reader.readAsDataURL(file)
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// 移除图片
const removeImage = () => {
  formData.imageFile = null
  previewImage.value = ""
  imageInfo.value = null
  if (fileInput.value) {
    fileInput.value.value = ""
  }
}

// 验证表单
const validateForm = (): boolean => {
  let isValid = true

  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = ""
  })

  if (!formData.imageFile) {
    errors.image = "请选择要上传的图片"
    isValid = false
  }

  if (selectedTags.value.length === 0) {
    errors.tags = "请至少选择一个标签"
    isValid = false
  }

  return isValid
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  isUploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = null

  try {
    if (!formData.imageFile) {
      throw new Error("请选择要上传的图片")
    }

    if (!currentUserId.value) {
      throw new Error("请先登录")
    }

    const { response, requestId } = await wallpaperService.uploadWallpaper(
      {
        file: formData.imageFile,
        category: formData.category,
        tags: formData.tags,
        title: formData.title || undefined,
        description: formData.description || undefined,
      },
      (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          uploadProgress.value = progress
        }
      },
    )

    currentRequestId.value = requestId

    if ((response as { success?: boolean }).success) {
      uploadStatus.value = { type: "success", message: "壁纸上传成功！" }
      clearInputForm()
    } else {
      throw new Error((response as { message?: string }).message || "上传失败")
    }
  } catch (error: unknown) {
    if (axios.isCancel(error)) {
      uploadStatus.value = { type: "info", message: "上传已取消" }
    } else {
      const err = error as Error & { message?: string }
      console.error("上传失败:", err)
      uploadStatus.value = {
        type: "error",
        message: err.message || "上传失败，请重试",
      }
    }
  } finally {
    loading.value = false
    isUploading.value = false
    currentRequestId.value = ""
  }
}

// 取消上传
const cancelUpload = () => {
  if (currentRequestId.value) {
    cancelRequest(currentRequestId.value)
  }
}

// 清空输入表单（保留上传成功的信息）
const clearInputForm = () => {
  formData.imageFile = null
  formData.category = "general"
  formData.tags = []
  formData.title = ""
  formData.description = ""

  if (fileInput.value) {
    fileInput.value.value = ""
  }

  errors.image = ""
  errors.tags = ""
  errors.category = ""

  selectedTags.value = []
  tagSearch.value = ""
  tagSuggestions.value = []
  previewImage.value = ""
  imageInfo.value = null
}

// 重置表单（完全重置所有状态）
const resetForm = () => {
  clearInputForm()
  uploadStatus.value = null
}
</script>

<style scoped>
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}
.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
