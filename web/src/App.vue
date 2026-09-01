<template>
  <div class="flex min-h-screen flex-col bg-canvas text-fg">
    <NavBar v-if="shouldShowNavBar" />

    <main class="flex-1" :class="{ 'min-h-screen': !shouldShowNavBar }">
      <!-- 不用 out-in：快速导航会丢 afterLeave，main 被掏空。组件未就绪时骨架占位 -->
      <RouterView v-slot="{ Component }">
        <component :is="Component" v-if="Component" />
        <div
          v-else
          class="wb-container-gallery flex min-h-[50vh] flex-col gap-4 py-8"
          aria-busy="true"
          aria-label="页面加载中"
        >
          <div class="wb-skeleton h-8 w-48 rounded-md"></div>
          <div class="wb-skeleton h-64 w-full rounded-tile"></div>
        </div>
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
