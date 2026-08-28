<template>
  <footer class="border-t border-line bg-canvas pt-10 pb-6 text-xs">
    <div class="wb-container-gallery">
      <div class="flex flex-wrap items-start justify-between gap-10">
        <!-- 品牌区 -->
        <div class="min-w-48">
          <div class="flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-lg border-[1.5px] border-fg/85 bg-gradient-to-br from-primary-fill to-[#9B8CFF] text-primary-content"
            >
              <i class="i-[mdi--view-grid] text-sm" aria-hidden="true"></i>
            </span>
            <span class="font-display text-base font-semibold text-fg">Wallbay</span>
          </div>
          <p class="mt-3 text-faint">发现你的下一张心动壁纸 ♡</p>
        </div>

        <!-- 链接三列 -->
        <nav v-for="group in linkGroups" :key="group.title" class="flex flex-col gap-2" aria-label="group.title">
          <p class="mb-1 text-sm font-bold text-fg">{{ group.title }}</p>
          <router-link
            v-for="link in group.links"
            :key="link.label"
            :to="link.to"
            class="text-faint transition-colors hover:text-primary"
          >
            {{ link.label }}
          </router-link>
        </nav>
      </div>

      <div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p class="text-faint">© {{ year }} Wallbay · 用 ♡ 制作</p>
        <div class="flex gap-4">
          <a href="https://github.com/wusuoweireally/wallpaper" target="_blank" rel="noopener" class="font-medium text-muted transition-colors hover:text-fg">
            GitHub
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()

const linkGroups = [
  {
    title: "发现",
    links: [
      { label: "壁纸", to: "/wallpapers" },
      { label: "标签", to: "/tags" },
      { label: "随机", to: "/wallpapers?sort=random" },
    ],
  },
  {
    title: "社区",
    links: [
      { label: "论坛", to: "/forums" },
      { label: "上传", to: "/upload" },
      { label: "收藏", to: "/user/favorites" },
    ],
  },
] as const
</script>
