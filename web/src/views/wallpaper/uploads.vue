<template>
  <div class="from-primary/10 to-secondary/10 min-h-screen bg-gradient-to-br via-base-100">
    <div class="max-w-8xl mx-auto px-4 py-8">
      <div class="grid gap-6 lg:grid-cols-12">
        <!-- 右侧信息栏 -->
        <div class="space-y-1 lg:col-span-3">
          <!-- 上传指南 -->
          <div class="bg-base-100/90 ring-base-200/70 card shadow-xl ring-1 backdrop-blur-sm">
            <div class="card-body p-6">
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-warning to-orange-500 text-white shadow-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-lg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"
                    />
                  </svg>
                </div>
                <h3 class="card-title text-lg font-bold">上传指南</h3>
              </div>

              <div class="space-y-4">
                <div class="flex gap-3">
                  <div
                    class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl text-primary"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-lg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                      />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-base-content/90 text-sm font-semibold">高质量图片</p>
                    <p class="text-base-content/60 mt-1 text-xs">
                      推荐分辨率 1920×1080 或更高，画质清晰
                    </p>
                  </div>
                </div>

                <div class="flex gap-3">
                  <div
                    class="bg-secondary/10 flex h-10 w-10 items-center justify-center rounded-xl text-secondary"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-lg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M20.59,13.41L12,22L8,18L18.24,7.76C18.46,7.37 18.61,6.92 18.67,6.46L15.11,9.99L13.11,7.99L16.54,4.56C16.92,4.19 17.37,4.02 17.83,3.96L17.95,3.5L13.37,4.08L9.83,0.54C9.47,0.18 8.99,0 8.5,0C8,0 7.52,0.18 7.16,0.54L3.5,4.2C3.37,4.36 3.26,4.53 3.17,4.71L0.81,8.24L4.29,11.71L1.2,14.8C0.84,15.16 0.66,15.64 0.66,16.13C0.66,16.62 0.84,17.1 1.2,17.46L4.83,21.09C5.19,21.45 5.67,21.63 6.16,21.63C6.65,21.63 7.13,21.45 7.49,21.09L11.17,17.41C11.36,17.32 11.53,17.21 11.69,17.08L15.17,20.56L18.59,17.13L14.95,13.5C15.03,13.35 15.09,13.18 15.13,13L19.54,8.59L20.59,9.64C20.95,10 21.13,10.48 21.13,10.97C21.13,11.46 20.95,11.94 20.59,12.3L20.59,13.41Z"
                      />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-base-content/90 text-sm font-semibold">准确标签</p>
                    <p class="text-base-content/60 mt-1 text-xs">
                      添加相关标签，便于用户搜索和发现
                    </p>
                  </div>
                </div>

                <div class="flex gap-3">
                  <div
                    class="bg-accent/10 flex h-10 w-10 items-center justify-center rounded-xl text-accent"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-lg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.4 14.8,17.4H9.2C8.6,17.4 8,16.8 8,16.2V12.7C8,12.1 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.9 10.5,10V11.5H13.5V10C13.5,8.9 12.8,8.2 12,8.2Z"
                      />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-base-content/90 text-sm font-semibold">内容规范</p>
                    <p class="text-base-content/60 mt-1 text-xs">上传原创、健康、合规的内容</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 主内容区 -->
        <div class="lg:col-span-8">
          <!-- 主要内容卡片 -->
          <div
            class="bg-base-100/90 ring-base-200/70 space-y-6 rounded-3xl p-8 shadow-xl ring-1 backdrop-blur-sm"
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

            <!-- 美化的上传区域 -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div
                  class="bg-primary/20 flex h-6 w-6 items-center justify-center rounded-lg text-primary"
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
                <label class="text-base-content/80 text-sm font-semibold">选择壁纸</label>
              </div>

              <div
                class="border-base-300/70 to-base-200/50 hover:border-primary/60 hover:bg-primary/5 group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-br from-base-100 p-10 text-center transition-all duration-300"
                :class="{
                  'bg-primary/10 shadow-primary/10 scale-[1.02] border-primary shadow-lg':
                    isDragging,
                  'bg-error/5 ring-error/20 border-error ring-2': errors.image,
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
                <div v-if="!previewImage" class="flex flex-col items-center gap-4">
                  <div class="relative">
                    <div
                      class="from-primary/20 to-secondary/20 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br text-primary transition-transform group-hover:scale-110"
                      :class="{ 'animate-pulse': isDragging }"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-8 w-8"
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
                      class="bg-primary/20 absolute -inset-2 animate-ping rounded-2xl"
                    ></div>
                  </div>
                  <div class="space-y-1">
                    <p class="text-base-content/90 text-lg font-semibold">
                      {{ isDragging ? '释放以上传壁纸' : '拖拽或点击上传' }}
                    </p>
                    <p class="text-base-content/60 text-sm">支持 JPG / PNG / WEBP，最大 50MB</p>
                  </div>
                  <div class="flex gap-2">
                    <div class="badge badge-outline badge-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="mr-1 h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        />
                      </svg>
                      推荐高清
                    </div>
                    <div class="badge badge-outline badge-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="mr-1 h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.1 16,12.7V16.2C16,16.8 15.4,17.4 14.8,17.4H9.2C8.6,17.4 8,16.8 8,16.2V12.7C8,12.1 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.9 10.5,10V11.5H13.5V10C13.5,8.9 12.8,8.2 12,8.2Z"
                        />
                      </svg>
                      安全可靠
                    </div>
                  </div>
                </div>

                <!-- 预览状态 -->
                <div v-else class="relative">
                  <div class="overflow-hidden rounded-2xl">
                    <img
                      :src="previewImage"
                      alt="预览图"
                      class="h-80 w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>

                  <!-- 操作按钮 -->
                  <div class="absolute right-4 top-4 flex gap-2">
                    <button
                      class="btn btn-error btn-sm btn-circle shadow-lg transition-all hover:rotate-90 hover:scale-110"
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
                      class="btn btn-primary btn-sm btn-circle shadow-lg transition-all hover:scale-110"
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
                    class="absolute bottom-4 left-4 right-4 rounded-xl bg-black/60 p-3 text-white backdrop-blur-sm"
                  >
                    <div class="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p class="text-xs text-white/60">尺寸</p>
                        <p class="font-medium" v-if="imageInfo">
                          {{ imageInfo.width }} × {{ imageInfo.height }}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-white/60">大小</p>
                        <p class="font-medium" v-if="imageInfo">{{ imageInfo.size }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-white/60">格式</p>
                        <p class="font-medium" v-if="imageInfo">{{ imageInfo.type }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p
                v-if="errors.image"
                class="animate-shake flex items-center gap-1 text-sm text-error"
              >
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
              class="from-primary/5 to-secondary/5 ring-primary/10 rounded-2xl bg-gradient-to-br p-4 ring-1"
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
                <div class="bg-base-100/60 rounded-xl p-3">
                  <p class="text-base-content/60 mb-1 text-xs">文件名</p>
                  <p class="truncate font-medium" :title="imageInfo.name">{{ imageInfo.name }}</p>
                </div>
                <div class="bg-base-100/60 rounded-xl p-3">
                  <p class="text-base-content/60 mb-1 text-xs">文件大小</p>
                  <p class="font-medium">{{ imageInfo.size }}</p>
                </div>
                <div class="bg-base-100/60 rounded-xl p-3">
                  <p class="text-base-content/60 mb-1 text-xs">分辨率</p>
                  <p class="font-medium">{{ imageInfo.width }} × {{ imageInfo.height }}</p>
                </div>
                <div class="bg-base-100/60 rounded-xl p-3">
                  <p class="text-base-content/60 mb-1 text-xs">格式</p>
                  <p class="font-medium">{{ imageInfo.type }}</p>
                </div>
              </div>
            </div>

            <!-- 标题与描述 -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="bg-primary/20 flex h-6 w-6 items-center justify-center rounded-lg text-primary"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M3 5h18v2H3V5zm0 6h12v2H3v-2zm0 6h18v2H3v-2z"
                      />
                    </svg>
                  </div>
                  <label class="text-base-content/80 text-sm font-semibold">作品标题</label>
                  <span class="badge badge-outline badge-xs">必填</span>
                </div>
                <span class="text-base-content/50 text-xs">
                  {{ formData.title.length }}/{{ MAX_TITLE_LENGTH }}
                </span>
              </div>
              <input
                v-model="formData.title"
                type="text"
                :maxlength="MAX_TITLE_LENGTH"
                placeholder="给壁纸取一个好记的名字"
                class="border-base-content/30 bg-base-100/90 focus:ring-primary/30 input h-12 w-full rounded-2xl border-2 px-4 shadow-sm transition-all hover:bg-base-100 focus:border-primary focus:ring-4"
              />
              <p v-if="errors.title" class="flex items-center gap-1 text-sm text-error">
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
                {{ errors.title }}
              </p>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="bg-secondary/20 flex h-6 w-6 items-center justify-center rounded-lg text-secondary"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"
                      />
                    </svg>
                  </div>
                  <label class="text-base-content/80 text-sm font-semibold">作品描述</label>
                </div>
                <span class="text-base-content/50 text-xs">
                  {{ formData.description.length }}/{{ MAX_DESCRIPTION_LENGTH }}
                </span>
              </div>
              <textarea
                v-model="formData.description"
                :maxlength="MAX_DESCRIPTION_LENGTH"
                rows="3"
                placeholder="补充风格、拍摄灵感或适用场景..."
                class="border-base-content/30 bg-base-100/90 focus:ring-secondary/30 textarea w-full rounded-2xl border-2 p-4 shadow-sm transition-all hover:bg-base-100 focus:border-secondary focus:ring-4"
              ></textarea>
              <p
                v-if="errors.description"
                class="flex items-center gap-1 text-sm text-error"
              >
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
                {{ errors.description }}
              </p>
            </div>

            <!-- 美化的标签区域 -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="bg-secondary/20 flex h-6 w-6 items-center justify-center rounded-lg text-secondary"
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
                  <label class="text-base-content/80 text-sm font-semibold">标签分类</label>
                  <span class="badge badge-primary badge-sm"
                    >{{ selectedTags.length }}/{{ MAX_TAGS }}</span
                  >
                </div>
                <p class="text-base-content/50 text-xs">帮助大家快速找到你的壁纸</p>
              </div>

              <!-- 已选标签展示 -->
              <div
                class="bg-base-200/40 ring-base-300/30 flex min-h-[3rem] flex-wrap gap-2 rounded-2xl p-2 ring-1"
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
                <span v-if="selectedTags.length === 0" class="text-base-content/50 text-sm italic">
                  请选择或输入标签
                </span>
              </div>

              <!-- 标签输入区 -->
              <div class="space-y-3">
                <div class="flex flex-col gap-3 sm:flex-row">
                  <div class="relative flex-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="text-base-content/40 pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
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
                      class="border-base-content/30 bg-base-100/90 focus:ring-primary/30 input h-12 w-full rounded-2xl border-2 pl-12 pr-4 shadow-sm transition-all hover:bg-base-100 focus:border-primary focus:ring-4"
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
                class="border-primary/20 bg-primary/5 rounded-2xl border p-4"
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
              <div class="space-y-2">
                <div class="text-base-content/60 flex items-center justify-between text-xs">
                  <span>常用标签</span>
                  <button
                    class="border-base-300/60 btn btn-ghost btn-xs gap-1 rounded-full border"
                    type="button"
                    :class="{ loading: tagsLoading }"
                    :disabled="tagsLoading"
                    @click="loadRecommendedTags"
                    title="刷新后台最新标签"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5 text-sm"
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
                    class="badge badge-lg cursor-pointer rounded-full px-3 py-1.5 text-sm transition-all hover:shadow-md"
                    :class="
                      selectedTags.includes(tag)
                        ? 'border-primary/30 border-2 bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg'
                        : 'hover:bg-primary/10 badge-outline hover:scale-105 hover:border-primary hover:text-primary'
                    "
                    @click="toggleTag(tag)"
                  >
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
                  class="bg-accent/20 flex h-6 w-6 items-center justify-center rounded-lg text-accent"
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
                <label class="text-base-content/80 text-sm font-semibold">所属分类</label>
              </div>
              <div
                class="bg-base-200/40 ring-base-300/30 flex flex-wrap gap-2 rounded-2xl p-4 ring-1"
              >
                <button
                  v-for="category in categories"
                  :key="category.value"
                  type="button"
                  class="badge badge-lg cursor-pointer rounded-full px-4 py-2 text-sm transition-all hover:shadow-md"
                  :class="
                    formData.category === category.value
                      ? 'border-primary/30 border-2 bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg'
                      : 'hover:bg-primary/10 badge-outline hover:scale-105 hover:border-primary hover:text-primary'
                  "
                  @click="formData.category = category.value"
                >
                  {{ category.label }}
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
              class="from-primary/10 to-secondary/10 ring-primary/20 space-y-3 rounded-2xl bg-gradient-to-r p-4 ring-1"
            >
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                  <span class="font-medium text-primary">正在上传...</span>
                </div>
                <span class="font-bold text-primary">{{ uploadProgress }}%</span>
              </div>
              <div class="bg-base-300/60 relative h-2.5 w-full overflow-hidden rounded-full">
                <div
                  class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-500"
                  :style="{ width: uploadProgress + '%' }"
                >
                  <div class="absolute inset-0 animate-pulse bg-white/20"></div>
                </div>
              </div>
              <div class="flex justify-end">
                <button
                  class="hover:bg-error/10 btn btn-ghost btn-xs text-error transition-all"
                  @click="cancelUpload"
                  :disabled="!currentRequestId"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="mr-1 h-3.5 w-3.5"
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
            <div class="flex flex-col gap-3 pt-4 sm:flex-row">
              <button
                class="btn btn-primary h-14 flex-1 rounded-2xl text-base font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
                :class="{
                  loading: loading,
                  'btn-disabled cursor-not-allowed opacity-60': loading || !formData.imageFile,
                }"
                :disabled="loading || !formData.imageFile"
                @click="handleSubmit"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-xl"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  v-if="!loading"
                >
                  <path
                    d="M19.35,10.04C18.67,6.59 15.64,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,12.6 20.95,12.22 20.88,11.85L18.27,9.24C18.5,7.6 18.11,5.96 17.19,4.73C16.27,3.5 14.94,2.76 13.5,2.73C11.55,2.69 9.74,3.57 8.63,4.97L6.05,2.39C7.46,0.68 9.59,0 12,0C17.52,0 22,4.48 22,10C22,15.52 17.52,20 12,20C7.69,20 4.17,17.34 3.06,13.62L0.64,11.2C-0.25,9.16 0.02,6.87 1.28,5.15C2.54,3.43 4.6,2.64 6.66,2.64L9,2.64C10.24,2.64 11.41,3.19 12.21,4.11C13,5.03 13.42,6.17 13.42,7.36V9.06C13.42,10.25 13,11.39 12.21,12.31C11.41,13.23 10.24,13.78 9,13.78L7.31,13.78"
                  />
                </svg>
                <span class="text-base">
                  {{ loading ? '上传中...' : '立即上传' }}
                </span>
              </button>
              <button
                class="btn-neutral/90 btn h-14 rounded-2xl text-base font-medium shadow-md transition-all hover:btn-neutral hover:scale-105 hover:shadow-lg"
                @click="$router.back()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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
    </div>

    <!-- 浮动操作按钮 -->
    <div class="fixed bottom-6 right-6 z-40">
      <button
        class="hover:from-primary/90 hover:to-secondary/90 group btn btn-lg btn-circle transform border-0 bg-gradient-to-r from-primary to-secondary shadow-2xl transition-all hover:scale-110"
        @click="$router.push('/user/uploads')"
        title="我的上传"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-12"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11.5-6L7.5 13l-3 3v-4H4v-2h4V5h2v4h3l-3 3z"
          />
        </svg>
      </button>
      <div
        class="absolute inset-0 -z-10 animate-pulse rounded-full bg-gradient-to-r from-primary to-secondary opacity-50 blur-xl group-hover:opacity-70"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { wallpaperService } from '@/services/wallpaper'
import tagService, { type Tag } from '@/services/tag'
import { useUserStore } from '@/stores/index'
import { cancelRequest } from '@/config/api'

const userStore = useUserStore()
const fileInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const isDragging = ref(false)
const previewImage = ref<string>('')
const uploadProgress = ref<number>(0)
const isUploading = ref<boolean>(false)
const currentRequestId = ref<string>('')
const uploadStatus = ref<{ type: string; message: string } | null>(null)

// 当前用户ID
const currentUserId = computed(() => userStore.user?.id || 0)

// 表单数据
const formData = reactive({
  imageFile: null as File | null,
  title: '',
  description: '',
  category: 'general',
  tags: [] as string[],
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
  image: '',
  title: '',
  description: '',
  category: '',
  tags: '',
})

// 可用标签
const defaultTagSeeds = [
  '4K',
  '8K',
  '高清',
  '超清',
  '风景',
  '星空',
  '海洋',
  '森林',
  '城市',
  '动漫',
  '游戏',
  '电影',
  '艺术',
  '暗色',
  '亮色',
  '渐变',
  '抽象',
  '自然',
  '动物',
  '植物',
  '建筑',
]

const recommendedTags = ref<string[]>([...defaultTagSeeds])
const tagSuggestions = ref<Tag[]>([])
const tagSearch = ref('')
const MAX_TITLE_LENGTH = 60
const MAX_DESCRIPTION_LENGTH = 200
const MAX_TAGS = 5
const tagsLoading = ref(false)

// 可用分类
const categories = [
  { value: 'general', label: '全部' },
  { value: 'anime', label: '动漫' },
  { value: 'people', label: '人物' },
]

// 选中的标签
const selectedTags = ref<string[]>([])

const normalizeTag = (tag: string) => tag.replace(/\s+/g, ' ').trim().slice(0, 30)

const addTag = (tag: string) => {
  const normalized = normalizeTag(tag)
  if (!normalized) {
    return
  }

  if (selectedTags.value.includes(normalized)) {
    errors.tags = ''
    return
  }

  if (selectedTags.value.length >= MAX_TAGS) {
    errors.tags = `最多选择 ${MAX_TAGS} 个标签`
    return
  }

  selectedTags.value.push(normalized)
  formData.tags = [...selectedTags.value]
  errors.tags = ''
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
  tagSearch.value = ''
  tagSuggestions.value = []
}

const loadRecommendedTags = async () => {
  tagsLoading.value = true
  try {
    const response = await tagService.getTags({
      sortBy: 'createdAt',
      sortOrder: 'DESC',
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
    console.error('加载推荐标签失败:', error)
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
    console.error('获取标签建议失败:', error)
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
  if (!file.type.startsWith('image/')) {
    errors.image = '请选择图片文件'
    return
  }

  if (file.size > 50 * 1024 * 1024) {
    errors.image = '图片大小不能超过 50MB'
    return
  }

  formData.imageFile = file
  errors.image = ''

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
        type: file.type.split('/')[1].toUpperCase(),
      }
    }
    img.src = previewImage.value
  }
  reader.readAsDataURL(file)
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 移除图片
const removeImage = () => {
  formData.imageFile = null
  previewImage.value = ''
  imageInfo.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 验证表单
const validateForm = (): boolean => {
  let isValid = true

  Object.keys(errors).forEach((key) => {
    errors[key as keyof typeof errors] = ''
  })

  if (!formData.imageFile) {
    errors.image = '请选择要上传的图片'
    isValid = false
  }

  const titleValue = formData.title.trim()
  if (!titleValue) {
    errors.title = '请输入壁纸标题'
    isValid = false
  } else if (titleValue.length > MAX_TITLE_LENGTH) {
    errors.title = `标题不能超过 ${MAX_TITLE_LENGTH} 个字符`
    isValid = false
  }

  const descriptionValue = formData.description.trim()
  if (descriptionValue.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `描述不能超过 ${MAX_DESCRIPTION_LENGTH} 个字符`
    isValid = false
  }

  if (selectedTags.value.length === 0) {
    errors.tags = '请至少选择一个标签'
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
      throw new Error('请选择要上传的图片')
    }

    if (!currentUserId.value) {
      throw new Error('请先登录')
    }

    const { response, requestId } = await wallpaperService.uploadWallpaper(
      {
        file: formData.imageFile,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        tags: formData.tags,
      },
      (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          uploadProgress.value = progress
        }
      },
    )

    currentRequestId.value = requestId

    if ((response as any).success) {
      uploadStatus.value = { type: 'success', message: '壁纸上传成功！' }
      clearInputForm()
    } else {
      throw new Error((response as any).message || '上传失败')
    }
  } catch (error: any) {
    if (axios.isCancel(error)) {
      uploadStatus.value = { type: 'info', message: '上传已取消' }
    } else {
      console.error('上传失败:', error)
      uploadStatus.value = {
        type: 'error',
        message: error.message || '上传失败，请重试',
      }
    }
  } finally {
    loading.value = false
    isUploading.value = false
    currentRequestId.value = ''
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
  formData.title = ''
  formData.description = ''
  formData.category = 'general'
  formData.tags = []

  if (fileInput.value) {
    fileInput.value.value = ''
  }

  errors.image = ''
  errors.title = ''
  errors.description = ''
  errors.tags = ''
  errors.category = ''

  selectedTags.value = []
  tagSearch.value = ''
  tagSuggestions.value = []
  previewImage.value = ''
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
