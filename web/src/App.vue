<template>
  <div class="flex min-h-screen flex-col bg-canvas text-fg">
    <NavBar v-if="shouldShowNavBar" />

    <main class="flex-1" :class="{ 'min-h-screen': !shouldShowNavBar }">
      <RouterView />
    </main>

    <SiteFooter v-if="shouldShowFooter" />
    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import NavBar from "@/components/NavBar.vue"
import SiteFooter from "@/components/SiteFooter.vue"
import ToastContainer from "@/components/ToastContainer.vue"
import ConfirmDialog from "@/components/ConfirmDialog.vue"

const route = useRoute()

const shouldShowNavBar = computed(() => route.meta.showNavBar !== false)

const shouldShowFooter = computed(() => {
  if (route.meta.hideFooter === true) return false
  if (route.meta.showNavBar === false) return false
  return true
})
</script>
