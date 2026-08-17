<template>
  <Teleport to="body">
    <!-- 分辨率选择 -->
    <div
      v-if="open && step === 'pick'"
      class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      @click.self="close"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="裁剪缩放下载"
        class="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-panel border border-line bg-surface shadow-xl"
      >
        <div class="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <h3 class="text-base font-semibold text-fg">裁剪缩放下载</h3>
            <p class="mt-0.5 text-xs text-faint">
              原图 {{ sourceWidth }} × {{ sourceHeight }} · 居中裁剪填充目标分辨率
            </p>
          </div>
          <button
            type="button"
            class="rounded-control px-2 py-1 text-faint hover:bg-subtle hover:text-fg"
            aria-label="关闭"
            @click="close"
          >
            <i class="i-[mdi--close]" aria-hidden="true"></i>
          </button>
        </div>

        <div class="max-h-[min(70vh,32rem)] overflow-y-auto px-5 py-4">
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="group in resolutionGroups" :key="group.label">
              <p class="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
                {{ group.label }}
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="item in group.items"
                  :key="`${item.w}x${item.h}`"
                  type="button"
                  class="rounded-md border px-2.5 py-1 text-xs font-medium tabular-nums transition"
                  :class="
                    isExactSource(item)
                      ? 'border-success/50 bg-success/10 text-success'
                      : 'border-line bg-subtle text-muted hover:border-primary/50 hover:bg-primary/10 hover:text-primary'
                  "
                  @click="selectResolution(item.w, item.h)"
                >
                  {{ item.w }}×{{ item.h }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3"
        >
          <button
            type="button"
            class="text-xs text-muted underline-offset-2 hover:text-primary hover:underline"
            @click="selectResolution(sourceWidth, sourceHeight, true)"
          >
            按原图尺寸 {{ sourceWidth }}×{{ sourceHeight }}
          </button>
          <button type="button" class="wb-btn-ghost wb-btn-sm" @click="close">取消</button>
        </div>
      </div>
    </div>

    <!-- 确认 -->
    <div
      v-if="open && step === 'confirm' && pending"
      class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/55 p-4"
      @click.self="step = 'pick'"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="确认下载"
        class="w-full max-w-sm rounded-panel border border-line bg-surface p-5 shadow-xl"
      >
        <h3 class="text-base font-semibold text-fg">确认下载？</h3>
        <p class="mt-3 text-sm text-muted">
          将按
          <span class="font-semibold tabular-nums text-fg">{{ pending.w }} × {{ pending.h }}</span>
          居中裁剪后下载。
        </p>
        <p class="mt-1 text-xs text-faint">
          原图分辨率：{{ sourceWidth }} × {{ sourceHeight }}
          <span v-if="pending.w * pending.h > sourceWidth * sourceHeight">
            · 目标大于原图将放缩</span
          >
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="wb-btn-ghost wb-btn-sm"
            :disabled="busy"
            @click="step = 'pick'"
          >
            返回
          </button>
          <button
            type="button"
            class="wb-btn-primary wb-btn-sm"
            :disabled="busy"
            @click="confirmDownload"
          >
            {{ busy ? "处理中…" : "下载" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from "vue"
import { useGlobalToast } from "@/composables/useToast"

const props = defineProps<{
  open: boolean
  wallpaperId: number
  sourceWidth: number
  sourceHeight: number
  fileUrl: string
  format?: string
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
}>()

const toast = useGlobalToast()
const step = ref<"pick" | "confirm">("pick")
const pending = ref<{ w: number; h: number; original?: boolean } | null>(null)
const busy = ref(false)

watch(
  () => props.open,
  (v) => {
    if (v) {
      step.value = "pick"
      pending.value = null
      busy.value = false
    }
  },
)

const resolutionGroups: Array<{ label: string; items: Array<{ w: number; h: number }> }> = [
  {
    label: "UHD",
    items: [
      { w: 7680, h: 4320 },
      { w: 5120, h: 2880 },
      { w: 3840, h: 2160 },
      { w: 3200, h: 1800 },
    ],
  },
  {
    label: "Dual",
    items: [
      { w: 5120, h: 1440 },
      { w: 3840, h: 1080 },
      { w: 3360, h: 1050 },
      { w: 2880, h: 900 },
    ],
  },
  {
    label: "Ultrawide",
    items: [
      { w: 3440, h: 1440 },
      { w: 2560, h: 1080 },
    ],
  },
  {
    label: "16:9",
    items: [
      { w: 2560, h: 1440 },
      { w: 1920, h: 1080 },
      { w: 1600, h: 900 },
      { w: 1280, h: 720 },
    ],
  },
  {
    label: "16:10",
    items: [
      { w: 2560, h: 1600 },
      { w: 1920, h: 1200 },
      { w: 1680, h: 1050 },
      { w: 1440, h: 900 },
    ],
  },
  {
    label: "4:3",
    items: [
      { w: 1600, h: 1200 },
      { w: 1400, h: 1050 },
      { w: 1280, h: 960 },
      { w: 1024, h: 768 },
    ],
  },
  {
    label: "5:4",
    items: [
      { w: 1280, h: 1024 },
      { w: 1280, h: 960 },
    ],
  },
  {
    label: "32:9",
    items: [
      { w: 5120, h: 1440 },
      { w: 3840, h: 1080 },
    ],
  },
  {
    label: "21:9",
    items: [
      { w: 3440, h: 1440 },
      { w: 2560, h: 1080 },
    ],
  },
  {
    label: "9:16",
    items: [
      { w: 1440, h: 2560 },
      { w: 1080, h: 1920 },
    ],
  },
  {
    label: "9:18",
    items: [
      { w: 1440, h: 2880 },
      { w: 1080, h: 2160 },
    ],
  },
  {
    label: "9:19.5",
    items: [
      { w: 1242, h: 2688 },
      { w: 1125, h: 2436 },
    ],
  },
  {
    label: "9:20",
    items: [
      { w: 1440, h: 3200 },
      { w: 1080, h: 2400 },
    ],
  },
  {
    label: "9:21",
    items: [
      { w: 1440, h: 3360 },
      { w: 1080, h: 2520 },
    ],
  },
]

const isExactSource = (item: { w: number; h: number }) =>
  item.w === props.sourceWidth && item.h === props.sourceHeight

const close = () => {
  if (busy.value) return
  emit("update:open", false)
}

/** Esc：确认步返回选择步，选择步直接关闭 */
const onKeydown = (e: KeyboardEvent) => {
  if (!props.open || e.key !== "Escape") return
  if (step.value === "confirm") step.value = "pick"
  else if (!busy.value) emit("update:open", false)
}

onMounted(() => window.addEventListener("keydown", onKeydown))
onUnmounted(() => window.removeEventListener("keydown", onKeydown))

const selectResolution = (w: number, h: number, original = false) => {
  pending.value = { w, h, original }
  step.value = "confirm"
}

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const confirmDownload = async () => {
  if (!pending.value || busy.value) return
  const { w, h, original } = pending.value
  busy.value = true
  try {
    // 原图尺寸：直接下原文件，避免二次 JPEG 有损（直链已带 attachment 头）
    // 非 http 的本地上传老壁纸无 CI 处理能力，也回落到直接下原图
    if (
      original ||
      !props.fileUrl.startsWith("http") ||
      (w === props.sourceWidth && h === props.sourceHeight)
    ) {
      const fileUrl = props.fileUrl
      if (!fileUrl) throw new Error("下载地址无效")
      const ext = props.format?.toLowerCase() || fileUrl.split(".").pop() || "jpg"
      const a = document.createElement("a")
      a.href = fileUrl
      a.download = `wallpaper-${props.wallpaperId}-original.${ext}`
      a.rel = "noopener"
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success("开始下载")
      emit("update:open", false)
      return
    }

    // 数据万象直链裁剪：!WxHr = 忽略比例居中裁剪到精确 W×H（COS 现场处理，服务端零转发）
    // 注意：fetch 跨域下载需在 COS 桶配置 CORS（允许站点 Origin 的 GET）
    const sep = props.fileUrl.includes("?") ? "&" : "?"
    const ciUrl = `${props.fileUrl}${sep}imageMogr2/thumbnail/!${w}x${h}r/quality/92/format/jpg`
    const res = await fetch(ciUrl, { signal: AbortSignal.timeout(120_000) })
    if (!res.ok) {
      // 处理失败时 COS/CI 返回 XML/JSON 错误体，尽量带出可读信息
      let msg = `裁剪下载失败 (HTTP ${res.status})`
      try {
        const text = await res.text()
        msg = JSON.parse(text)?.message || text.match(/<Message>([^<]+)<\/Message>/)?.[1] || msg
      } catch {
        /* 错误体解析失败就用状态码文案 */
      }
      throw new Error(msg)
    }
    const blob = await res.blob()
    if (!blob || blob.size === 0) {
      throw new Error("空文件")
    }
    triggerBlobDownload(blob, `wallpaper-${props.wallpaperId}-${w}x${h}.jpg`)
    toast.success("开始下载")
    emit("update:open", false)
  } catch (e: unknown) {
    toast.error((e as Error).message || "下载失败，请稍后重试")
  } finally {
    busy.value = false
  }
}
</script>
