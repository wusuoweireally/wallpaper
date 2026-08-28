<template>
  <div class="flex min-h-screen flex-col bg-canvas text-fg">
    <NavBar v-if="shouldShowNavBar" />

    <main class="flex-1" :class="{ 'min-h-screen': !shouldShowNavBar }">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <Suspense>
            <component :is="Component" />
            <template #fallback>
              <div
                class="mx-auto flex min-h-[50vh] w-full max-w-5xl flex-col gap-4 px-4 py-8"
                aria-busy="true"
                aria-label="页面加载中"
              >
                <div class="wb-skeleton h-8 w-48 rounded-md"></div>
                <div class="wb-skeleton h-64 w-full rounded-tile"></div>
              </div>
            </template>
          </Suspense>
        </Transition>
      </RouterView>
    </main>

    <SiteFooter v-if="shouldShowFooter" />
    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import NavBar from "@/components/NavBar.vue"
import SiteFooter from "@/components/SiteFooter.vue"
import ToastContainer from "@/components/ToastContainer.vue"
import ConfirmDialog from "@/components/ConfirmDialog.vue"

const route = useRoute()
const router = useRouter()
const pendingPath = ref(route.path)

router.beforeEach((to) => {
  pendingPath.value = to.path
})

const isAdminShell = computed(
  () => pendingPath.value.startsWith("/admin") || route.path.startsWith("/admin"),
)

const shouldShowNavBar = computed(
  () => !isAdminShell.value && route.meta.showNavBar !== false,
)

const shouldShowFooter = computed(() => {
  if (isAdminShell.value) return false
  if (route.meta.hideFooter === true) return false
  if (route.meta.showNavBar === false) return false
  return true
})
</script>

<style scoped>
/* 页面路由切换淡入淡出（内部灯箱等已有自己的过渡，不冲突） */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
