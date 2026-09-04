<template>
  <div ref="rootRef" class="relative inline-flex" @keydown="handleKeydown">
    <button
      ref="buttonRef"
      type="button"
      class="dd-trigger"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-activedescendant="open ? highlightedOptionId : undefined"
      @click="toggleMenu"
    >
      <span class="flex-1 whitespace-nowrap">{{ selectedLabel }}</span>
      <i
        class="i-[mdi--chevron-down] shrink-0 text-base text-faint transition-transform"
        :class="open ? 'rotate-180' : ''"
        aria-hidden="true"
      ></i>
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      leave-active-class="transition duration-75 ease-in"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <ul
        v-if="open"
        role="listbox"
        :aria-label="ariaLabel"
        class="absolute left-0 top-full z-20 mt-1.5 w-max min-w-full overflow-hidden rounded-control border border-line bg-surface wb-shadow-pop"
      >
        <li
          v-for="(option, index) in options"
          :id="`${listboxId}-opt-${index}`"
          :key="option.value"
          role="option"
          :aria-selected="option.value === modelValue"
          class="flex cursor-pointer items-center gap-1 whitespace-nowrap px-2.5 py-1.5 text-xs font-medium transition-colors"
          :class="
            option.value === modelValue
              ? 'text-primary'
              : index === highlightIndex
                ? 'bg-subtle text-fg'
                : 'text-muted'
          "
          @mouseenter="highlightIndex = index"
          @click="select(option)"
        >
          <i
            class="i-[mdi--check] shrink-0 text-sm"
            :class="option.value === modelValue ? '' : 'invisible'"
            aria-hidden="true"
          ></i>
          <span>{{ option.label }}</span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

export interface DropdownOption {
  label: string
  value: string
}

interface Props {
  modelValue: string
  options: DropdownOption[]
  ariaLabel?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "change", value: string): void
}>()

let uidSeed = 0
const listboxId = `dd-${++uidSeed}-${Math.random().toString(36).slice(2, 8)}`

const rootRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const highlightIndex = ref(0)

const selectedLabel = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label ?? "",
)
const highlightedOptionId = computed(() => `${listboxId}-opt-${highlightIndex.value}`)

const openMenu = () => {
  open.value = true
  highlightIndex.value = Math.max(
    props.options.findIndex((option) => option.value === props.modelValue),
    0,
  )
}

const closeMenu = () => {
  open.value = false
  buttonRef.value?.focus()
}

const toggleMenu = () => {
  if (open.value) {
    open.value = false
  } else {
    openMenu()
  }
}

const select = (option: DropdownOption | undefined) => {
  if (!option) return
  if (option.value !== props.modelValue) {
    emit("update:modelValue", option.value)
    emit("change", option.value)
  }
  open.value = false
  buttonRef.value?.focus()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!open.value) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      openMenu()
    }
    return
  }
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault()
      highlightIndex.value = Math.min(highlightIndex.value + 1, props.options.length - 1)
      break
    case "ArrowUp":
      event.preventDefault()
      highlightIndex.value = Math.max(highlightIndex.value - 1, 0)
      break
    case "Home":
      event.preventDefault()
      highlightIndex.value = 0
      break
    case "End":
      event.preventDefault()
      highlightIndex.value = props.options.length - 1
      break
    case "Enter":
    case " ":
      event.preventDefault()
      select(props.options[highlightIndex.value])
      break
    case "Escape":
      event.preventDefault()
      closeMenu()
      break
    case "Tab":
      open.value = false
      break
  }
}

const handlePointerDown = (event: PointerEvent) => {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

// modelValue 可能被外部重置（如清除筛选），保持触发器文案同步由 selectedLabel 覆盖，无需额外处理
watch(
  () => props.options.length,
  (length) => {
    if (highlightIndex.value >= length) highlightIndex.value = Math.max(length - 1, 0)
  },
)

onMounted(() => document.addEventListener("pointerdown", handlePointerDown))
onBeforeUnmount(() => document.removeEventListener("pointerdown", handlePointerDown))
</script>

<style scoped>
/* 触发器复刻 wb-input 视觉（wb-input 定义在 utilities 之后，其 w-full 会被类覆盖失败，故独立实现） */
.dd-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.5rem 0 0.75rem;
  font-size: 0.75rem;
  line-height: 1.25rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--wb-border);
  border-radius: 0.375rem;
  background-color: var(--wb-surface);
  color: var(--wb-fg);
}

.dd-trigger:hover {
  border-color: color-mix(in oklab, var(--wb-accent) 40%, var(--wb-border));
}

.dd-trigger:focus-visible {
  outline: none;
  border-color: var(--wb-accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--wb-accent) 20%, transparent);
}
</style>
