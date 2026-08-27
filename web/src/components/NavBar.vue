<template>
  <nav class="wb-chrome sticky top-0 z-50 border-b border-line bg-canvas/90 backdrop-blur-lg">
    <div class="wb-container-gallery">
      <div class="flex h-16 items-center gap-2">
        <router-link to="/" class="flex shrink-0 items-center gap-2" aria-label="Wallbay 首页">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg border-[1.5px] border-fg/85 bg-gradient-to-br from-primary-fill to-[#9B8CFF] text-primary-content shadow-[0_2px_0_rgb(46_42_79_/_0.9)]"
          >
            <i class="i-[mdi--view-grid] text-base" aria-hidden="true"></i>
          </span>
          <span class="font-display text-lg font-semibold tracking-tight text-fg">Wallbay</span>
        </router-link>

        <div class="hidden items-stretch self-stretch gap-5 md:flex">
          <router-link
            v-for="item in navItems"
            :key="item.name"
            :to="item.to"
            class="nav-item"
            :class="{ 'nav-item--on': isNavItemActive(item) }"
          >
            {{ item.name }}
          </router-link>
        </div>

        <div class="ml-auto flex items-center gap-1.5">
          <!-- 搜索：默认仅图标，点击展开（桌面下拉面板 / 移动端下方整行） -->
          <div ref="searchAreaRef" class="relative">
            <button
              ref="searchBtnRef"
              type="button"
              class="wb-icon-btn h-8 w-8 text-muted hover:text-fg"
              aria-label="搜索壁纸"
              :aria-expanded="searchOpen"
              aria-controls="nav-search-panel"
              @click="toggleSearch"
            >
              <i class="i-[mdi--magnify] text-lg" aria-hidden="true"></i>
            </button>

            <Transition name="wb-search">
              <div
                v-if="searchOpen"
                id="nav-search-panel"
                class="search-pop absolute right-0 top-10 hidden w-80 md:block"
              >
                <form class="search-pop__field" role="search" @submit.prevent="submitSearch">
                  <i class="i-[mdi--magnify] search-pop__icon" aria-hidden="true"></i>
                  <input
                    ref="desktopSearchInput"
                    v-model="searchInput"
                    type="search"
                    placeholder="搜索标签、风格、画质…"
                    aria-label="搜索壁纸"
                    class="search-pop__input"
                  />
                  <kbd class="search-pop__kbd">Enter</kbd>
                </form>
              </div>
            </Transition>
          </div>

          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-fg md:hidden"
            aria-label="导航菜单"
            :aria-expanded="showMobileMenu"
            @click="showMobileMenu = !showMobileMenu"
          >
            <svg
              v-if="!showMobileMenu"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <ThemeToggle />

          <template v-if="!isLoggedIn">
            <router-link to="/auth/login" class="wb-btn hidden h-8 sm:inline-flex"> 登录 </router-link>
            <router-link to="/auth/register" class="wb-btn-primary h-8 px-3"> 注册 </router-link>
          </template>

          <template v-else>
            <router-link to="/upload" class="wb-btn-primary hidden h-8 px-3 sm:inline-flex">
              <i class="i-[mdi--cloud-upload-outline] text-sm" aria-hidden="true"></i>
              上传
            </router-link>

            <div ref="userMenuRef" class="relative">
              <button
                type="button"
                class="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-subtle"
                aria-haspopup="menu"
                :aria-expanded="showDropdown"
                @click="toggleDropdown"
              >
                <img
                  :src="userAvatar"
                  :alt="user?.username || '用户'"
                  class="h-7 w-7 rounded-full object-cover ring-1 ring-line"
                  @error="handleAvatarError"
                />
                <svg
                  class="h-3.5 w-3.5 text-faint transition-transform"
                  :class="{ 'rotate-180': showDropdown }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <Transition name="wb-user-menu">
                <div
                  v-if="showDropdown"
                  class="user-menu absolute right-0 top-11 w-max min-w-[11rem] max-w-64 rounded-card border border-line bg-surface py-1.5"
                  role="menu"
                >
                  <!-- 指向头像的小箭头 -->
                  <div
                    class="pointer-events-none absolute -top-1.5 right-8 h-3 w-3 rotate-45 rounded-[2px] border-l border-t border-line bg-surface"
                    aria-hidden="true"
                  ></div>

                  <!-- 身份头部 -->
                  <div class="flex items-center gap-2.5 px-2.5 pb-2.5 pt-1">
                    <img
                      :src="userAvatar"
                      :alt="user?.username || '用户'"
                      class="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-line"
                      @error="handleAvatarError"
                    />
                    <div class="min-w-0">
                      <p
                        class="truncate text-sm font-semibold leading-tight tracking-tight text-fg"
                      >
                        {{ user?.username || "用户" }}
                      </p>
                      <p class="mt-0.5 truncate text-xs leading-tight text-faint">
                        {{ user?.email || "Wallbay 用户" }}
                      </p>
                    </div>
                  </div>

                  <div class="mx-2.5 h-px bg-line"></div>

                  <!-- 导航项 -->
                  <div class="mt-1.5 space-y-0.5 px-1.5">
                    <router-link
                      to="/user"
                      class="menu-item"
                      role="menuitem"
                      @click="showDropdown = false"
                    >
                      <span class="menu-ico" aria-hidden="true">
                        <i class="i-[mdi--account-circle-outline] text-[15px]"></i>
                      </span>
                      个人中心
                    </router-link>
                    <router-link
                      to="/user/settings"
                      class="menu-item"
                      role="menuitem"
                      @click="showDropdown = false"
                    >
                      <span class="menu-ico" aria-hidden="true">
                        <i class="i-[mdi--cog-outline] text-[15px]"></i>
                      </span>
                      账号设置
                    </router-link>
                    <router-link
                      to="/upload"
                      class="menu-item"
                      role="menuitem"
                      @click="showDropdown = false"
                    >
                      <span class="menu-ico menu-ico--primary" aria-hidden="true">
                        <i class="i-[mdi--cloud-upload-outline] text-[15px]"></i>
                      </span>
                      上传壁纸
                    </router-link>
                    <router-link
                      v-if="user?.role === 'admin' || user?.role === 'super_admin'"
                      to="/admin/dashboard"
                      class="menu-item"
                      role="menuitem"
                      @click="showDropdown = false"
                    >
                      <span class="menu-ico menu-ico--warning" aria-hidden="true">
                        <i class="i-[mdi--shield-outline] text-[15px]"></i>
                      </span>
                      管理后台
                    </router-link>
                  </div>

                  <div class="mx-2.5 mt-1.5 h-px bg-line"></div>

                  <!-- 危险区：退出登录 -->
                  <div class="mt-1 px-1.5">
                    <button
                      type="button"
                      class="menu-item menu-item--danger"
                      role="menuitem"
                      @click="handleLogout"
                    >
                      <span class="menu-ico menu-ico--danger" aria-hidden="true">
                        <i class="i-[mdi--logout] text-[15px]"></i>
                      </span>
                      退出登录
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </template>
        </div>
      </div>

      <form
        v-if="searchOpen"
        ref="searchBoxRef"
        class="wb-nav-search mb-2 md:hidden"
        role="search"
        @submit.prevent="submitSearch"
      >
        <i class="i-[mdi--magnify] shrink-0 text-base text-faint" aria-hidden="true"></i>
        <input
          ref="mobileSearchInput"
          v-model="searchInput"
          type="search"
          placeholder="搜索标签、风格、画质…"
          aria-label="搜索壁纸"
          class="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
        />
      </form>

      <Transition name="wb-menu">
        <div v-if="showMobileMenu" class="py-2 md:hidden">
          <router-link
            v-for="item in navItems"
            :key="item.name"
            :to="item.to"
            class="block rounded-control px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-fg"
            :class="{ 'font-medium text-primary': isNavItemActive(item) }"
            @click="showMobileMenu = false"
          >
            {{ item.name }}
          </router-link>

          <div class="mt-2 space-y-2 border-t border-line px-3 pt-3">
            <router-link
              :to="isLoggedIn ? '/upload' : { path: '/auth/login', query: { redirect: '/upload' } }"
              class="wb-btn-primary flex w-full"
              @click="showMobileMenu = false"
            >
              <i class="i-[mdi--cloud-upload-outline] text-sm" aria-hidden="true"></i>
              上传壁纸
            </router-link>
            <div v-if="!isLoggedIn" class="flex gap-2">
              <router-link to="/auth/login" class="wb-btn flex-1" @click="showMobileMenu = false">
                登录
              </router-link>
              <router-link
                to="/auth/register"
                class="wb-btn-primary flex-1"
                @click="showMobileMenu = false"
              >
                注册
              </router-link>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { storeToRefs } from "pinia"
import { useUserStore } from "@/stores/user"
import { handleAvatarError } from "@/utils/avatar"
import { confirmAction } from "@/composables/useConfirm"
import ThemeToggle from "@/components/ThemeToggle.vue"

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const showDropdown = ref(false)
const showMobileMenu = ref(false)
const searchOpen = ref(false)
const searchInput = ref("")
const userMenuRef = ref<HTMLElement>()
const searchAreaRef = ref<HTMLElement>()
const searchBoxRef = ref<HTMLElement>()
const searchBtnRef = ref<HTMLButtonElement | null>(null)
const desktopSearchInput = ref<HTMLInputElement | null>(null)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

const { isLoggedIn, user, userAvatar } = storeToRefs(userStore)

const navItems = [
  { name: "壁纸", to: "/wallpapers" },
  { name: "标签", to: "/tags" },
  { name: "论坛", to: "/forums" },
]

const isNavItemActive = (item: (typeof navItems)[number]) => {
  if (item.to === "/wallpapers") {
    return route.path === "/wallpapers" || route.path.startsWith("/wallpaper/")
  }
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

/** 展开搜索后聚焦输入框（桌面面板 / 移动端整行各取其一） */
const focusSearchInput = () => {
  void nextTick(() => {
    if (window.innerWidth < 768) {
      mobileSearchInput.value?.focus()
    } else {
      desktopSearchInput.value?.focus()
    }
  })
}

const toggleSearch = () => {
  searchOpen.value = !searchOpen.value
  showMobileMenu.value = false
  if (searchOpen.value) {
    focusSearchInput()
  }
}

/** 顶栏搜索：跳浏览页，走已有 search 关键词筛选 */
const submitSearch = () => {
  const q = searchInput.value.trim()
  searchOpen.value = false
  if (!q) {
    void router.push("/wallpapers")
    return
  }
  void router.push({ path: "/wallpapers", query: { search: q } })
}

watch(
  () => route.query.search,
  (s) => {
    searchInput.value = typeof s === "string" ? s : ""
  },
  { immediate: true },
)

/** 路由切换时收起搜索与菜单 */
watch(
  () => route.path,
  () => {
    searchOpen.value = false
    showMobileMenu.value = false
  },
)

const closeDropdown = (event: MouseEvent) => {
  const target = event.target as Node
  if (!userMenuRef.value?.contains(target)) {
    showDropdown.value = false
  }
  if (
    searchOpen.value &&
    !searchAreaRef.value?.contains(target) &&
    !searchBoxRef.value?.contains(target)
  ) {
    searchOpen.value = false
  }
}

/** 「/」展开并聚焦搜索；Esc 收起并把焦点还给图标按钮 */
const onGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    if (showDropdown.value) {
      showDropdown.value = false
    } else if (searchOpen.value) {
      searchOpen.value = false
      searchBtnRef.value?.focus()
    }
    return
  }
  if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return
  const target = e.target as HTMLElement | null
  if (
    target &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
  ) {
    return
  }
  e.preventDefault()
  searchOpen.value = true
  showMobileMenu.value = false
  focusSearchInput()
}

const handleLogout = async () => {
  const confirmed = await confirmAction({
    title: "退出登录",
    message: "确定要退出登录吗？",
    confirmText: "退出",
    danger: true,
  })
  if (!confirmed) return

  try {
    await userStore.logout()
    showDropdown.value = false
  } catch (error) {
    console.error("退出登录失败:", error)
  }
}

onMounted(() => {
  document.addEventListener("click", closeDropdown)
  window.addEventListener("keydown", onGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener("click", closeDropdown)
  window.removeEventListener("keydown", onGlobalKeydown)
})
</script>

<style scoped>
/* 智谱风文字导航：撑满 bar 高度，激活/hover 用底部短线指示 */
.nav-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0 0.15rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--wb-muted);
  transition: color 0.15s;
}
.nav-item::after {
  content: "";
  position: absolute;
  left: 0.15rem;
  right: 0.15rem;
  bottom: 0;
  height: 2px;
  border-radius: 999px;
  background-color: transparent;
  transition: background-color 0.15s;
}
.nav-item:hover {
  color: var(--wb-fg);
}
.nav-item--on {
  color: var(--wb-fg);
  font-weight: 600;
}
.nav-item--on::after {
  background-color: var(--wb-accent);
}

/* 搜索弹层：单层浮起搜索框（不再 box-in-box），浅色/深色都吃 --wb-* token */
.search-pop__field {
  display: flex;
  height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  border: 1.5px solid var(--wb-border);
  border-radius: 0.875rem;
  background: var(--wb-surface);
  padding: 0 0.5rem 0 0.9rem;
  box-shadow:
    0 20px 48px -16px rgb(23 18 46 / 0.45),
    0 3px 10px rgb(23 18 46 / 0.12);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
/* focus：品牌渐变描边（粉→紫）+ 柔光，padding-box 兜住不透明底 */
.search-pop__field:focus-within {
  border-color: transparent;
  background:
    linear-gradient(var(--wb-surface), var(--wb-surface)) padding-box,
    linear-gradient(120deg, var(--wb-accent-fill), #9b8cff) border-box;
  box-shadow:
    0 20px 48px -16px rgb(23 18 46 / 0.5),
    0 0 0 4px color-mix(in oklab, var(--wb-accent-fill) 18%, transparent);
}
.search-pop__icon {
  flex-shrink: 0;
  font-size: 1.05rem;
  color: var(--wb-faint);
  transition: color 0.15s ease;
}
.search-pop__field:focus-within .search-pop__icon {
  color: var(--wb-accent-fill);
}
.search-pop__input {
  height: 100%;
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  font-size: 0.875rem;
  color: var(--wb-fg);
  outline: none;
}
.search-pop__input::placeholder {
  color: var(--wb-faint);
}
.search-pop__kbd {
  pointer-events: none;
  flex-shrink: 0;
  border: 1px solid var(--wb-border);
  border-radius: 0.375rem;
  background: var(--wb-subtle);
  padding: 0.15rem 0.45rem;
  font-size: 10px;
  line-height: 1;
  color: var(--wb-faint);
}

/* 搜索面板：右上角展开 */
.wb-search-enter-active,
.wb-search-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
  transform-origin: top right;
}

.wb-search-enter-from,
.wb-search-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

/* 用户下拉菜单 */
.user-menu {
  box-shadow: 0 12px 32px color-mix(in oklab, var(--wb-fg) 12%, transparent);
}

.menu-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.55rem;
  border-radius: 0.375rem;
  padding: 0.4rem 0.55rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--wb-fg);
  transition: background-color 0.12s ease;
}
.menu-item:hover {
  background-color: var(--wb-subtle);
}

/* 图标底座：24px 圆角小底盘；中性=发丝边框灰底，语义项=彩色 tint */
.menu-ico {
  display: flex;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  border: 1px solid var(--wb-border);
  background-color: var(--wb-subtle);
  color: var(--wb-fg);
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease,
    transform 0.12s ease;
}
.menu-item:hover .menu-ico {
  background-color: var(--wb-surface);
  color: var(--wb-fg);
  transform: scale(1.06);
}
.menu-item .menu-ico--primary {
  border-color: transparent;
  background-color: var(--wb-accent-subtle);
  color: var(--wb-accent);
}
.menu-item:hover .menu-ico--primary {
  border-color: transparent;
  background-color: color-mix(in oklab, var(--wb-accent) 22%, transparent);
  color: var(--wb-accent);
}
.menu-item .menu-ico--warning {
  border-color: transparent;
  background-color: var(--wb-warning-subtle);
  color: var(--wb-warning);
}
.menu-item:hover .menu-ico--warning {
  border-color: transparent;
  background-color: color-mix(in oklab, var(--wb-warning) 22%, transparent);
  color: var(--wb-warning);
}
.menu-item .menu-ico--danger {
  border-color: transparent;
  background-color: var(--wb-danger-subtle);
  color: var(--wb-danger);
}
.menu-item:hover .menu-ico--danger {
  border-color: transparent;
  background-color: color-mix(in oklab, var(--wb-danger) 20%, transparent);
  color: var(--wb-danger);
}

.menu-item--danger {
  color: var(--wb-danger);
}
.menu-item--danger:hover {
  background-color: var(--wb-danger-subtle);
}

.wb-menu-enter-active,
.wb-menu-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.wb-menu-enter-from,
.wb-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 用户菜单：从右上角缩放展开 */
.wb-user-menu-enter-active,
.wb-user-menu-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
  transform-origin: top right;
}

.wb-user-menu-enter-from,
.wb-user-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.96);
}
</style>
