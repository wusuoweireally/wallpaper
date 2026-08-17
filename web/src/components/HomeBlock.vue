<template>
  <section class="wb-homeblock" :data-homeblock="title">
    <header class="wb-homeblock-head">
      <div class="min-w-0">
        <h2 class="wb-homeblock-title">{{ title }}</h2>
        <p v-if="subtitle" class="wb-homeblock-sub">{{ subtitle }}</p>
      </div>
      <router-link v-if="to" :to="to" class="wb-homeblock-more group/more">
        {{ actionLabel }}
        <i
          class="i-[mdi--arrow-right] text-sm transition-transform group-hover/more:translate-x-0.5"
          aria-hidden="true"
        ></i>
      </router-link>
    </header>
    <slot />
  </section>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    to?: string
    actionLabel?: string
  }>(),
  { actionLabel: "浏览全部" },
)
</script>
