<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-fg">举报管理</h1>
        <p class="mt-1 text-sm text-muted">待处理 {{ pendingCount }} · 共 {{ pagination.total }}</p>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="wb-card p-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-[150px]">
          <label class="mb-1 block text-sm font-semibold text-fg">状态</label>
          <select v-model="filters.status" class="wb-input" @change="loadReports">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="reviewing">审核中</option>
            <option value="resolved">已解决</option>
            <option value="dismissed">已驳回</option>
          </select>
        </div>

        <div class="min-w-[150px]">
          <label class="mb-1 block text-sm font-semibold text-fg">举报类型</label>
          <select v-model="filters.reason" class="wb-input" @change="loadReports">
            <option value="">全部</option>
            <option value="spam">垃圾信息</option>
            <option value="inappropriate">不当内容</option>
            <option value="harassment">骚扰/霸凌</option>
            <option value="violence">暴力或危险行为</option>
            <option value="copyright">版权问题</option>
            <option value="misinformation">虚假信息</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div class="min-w-[250px] flex-1">
          <label class="mb-1 block text-sm font-semibold text-fg">搜索</label>
          <div class="relative">
            <input
              v-model="filters.keyword"
              type="text"
              placeholder="搜索举报内容…"
              class="wb-input w-full pl-10"
              @keyup.enter="loadReports"
            />
            <i
              class="i-[mdi--magnify] absolute left-3 top-1/2 -translate-y-1/2 text-lg text-faint"
              aria-hidden="true"
            ></i>
          </div>
        </div>

        <button class="wb-btn-primary gap-2" @click="loadReports">
          <i class="i-[mdi--magnify] text-lg" aria-hidden="true"></i>
          搜索
        </button>
      </div>
    </div>

    <!-- 举报列表 -->
    <div class="wb-card overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <span class="wb-spinner wb-spinner-lg"></span>
      </div>

      <div v-else-if="reports.length === 0" class="py-20 text-center">
        <div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-subtle">
          <i class="i-[mdi--shield-off] text-4xl text-faint" aria-hidden="true"></i>
        </div>
        <p class="text-lg font-semibold text-muted">暂无举报记录</p>
        <p class="mt-2 text-sm text-faint">所有内容都很干净呢</p>
      </div>

      <div v-else class="p-6">
        <!-- 桌面端表格 -->
        <div class="hidden overflow-x-auto lg:block">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-line text-xs uppercase tracking-wide text-faint">
                <th class="px-6 py-4 font-semibold">ID</th>
                <th class="px-6 py-4 font-semibold">举报类型</th>
                <th class="px-6 py-4 font-semibold">状态</th>
                <th class="px-6 py-4 font-semibold">举报人</th>
                <th class="px-6 py-4 font-semibold">举报内容</th>
                <th class="px-6 py-4 font-semibold">创建时间</th>
                <th class="px-6 py-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="report in reports"
                :key="report.id"
                class="border-b border-line/60 transition-colors hover:bg-subtle"
              >
                <td class="px-6 py-4">
                  <span class="font-mono text-sm text-faint">#{{ report.id }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="wb-chip">{{ getReasonText(report.reason) }}</div>
                </td>
                <td class="px-6 py-4">
                  <div :class="getStatusBadgeClass(report.status)">
                    {{ getStatusText(report.status) }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-fg">{{ report.user?.username || "未知用户" }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="max-w-xs truncate text-muted">{{ report.description }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-muted">{{ formatDate(report.createdAt) }}</div>
                </td>
                <td class="px-6 py-4">
                  <button class="wb-btn-ghost wb-btn-sm" @click="viewReport(report.id)">
                    <i class="i-[mdi--eye]" aria-hidden="true"></i>
                    查看
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 移动端卡片 -->
        <div class="lg:hidden">
          <div v-for="report in reports" :key="report.id" class="border-b border-line/60 p-6">
            <div class="mb-3 flex items-start justify-between">
              <div class="wb-chip">{{ getReasonText(report.reason) }}</div>
              <div :class="getStatusBadgeClass(report.status)">
                {{ getStatusText(report.status) }}
              </div>
            </div>
            <p class="mb-3 text-sm text-muted">{{ report.description }}</p>
            <div class="mb-3 flex items-center justify-between text-xs text-faint">
              <span>举报人: {{ report.user?.username || "未知用户" }}</span>
              <span>{{ formatDate(report.createdAt) }}</span>
            </div>
            <button class="wb-btn-ghost wb-btn-sm w-full" @click="viewReport(report.id)">
              <i class="i-[mdi--eye]" aria-hidden="true"></i>
              查看详情
            </button>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.pages > 1" class="border-t border-line p-6">
          <Pagination
            :current-page="pagination.page"
            :total-pages="pagination.pages"
            @change="changePage"
          />
        </div>
      </div>
    </div>

    <!-- 举报详情模态框 -->
    <dialog ref="reportModal" class="wb-dialog">
      <div class="wb-dialog-box max-w-3xl overflow-hidden p-0">
        <div class="border-b border-line p-6">
          <h3 class="flex items-center gap-3 text-2xl font-bold text-fg">
            <i class="i-[mdi--shield-search] text-3xl" aria-hidden="true"></i>
            举报详情 #{{ selectedReport?.id }}
          </h3>
        </div>

        <div v-if="selectedReport" class="space-y-6 p-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-control border border-line bg-inset p-4">
              <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
                <i class="i-[mdi--tag]" aria-hidden="true"></i>
                举报类型
              </p>
              <div class="wb-chip">{{ getReasonText(selectedReport.reason) }}</div>
            </div>
            <div class="rounded-control border border-line bg-inset p-4">
              <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
                <i class="i-[mdi--check-circle]" aria-hidden="true"></i>
                状态
              </p>
              <div :class="getStatusBadgeClass(selectedReport.status)">
                {{ getStatusText(selectedReport.status) }}
              </div>
            </div>
          </div>

          <div class="rounded-control border border-line bg-inset p-4">
            <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
              <i class="i-[mdi--account]" aria-hidden="true"></i>
              举报人
            </p>
            <p class="text-fg">{{ selectedReport.user?.username || "未知用户" }}</p>
          </div>

          <div class="rounded-control border border-line bg-inset p-4">
            <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
              <i class="i-[mdi--text]" aria-hidden="true"></i>
              举报描述
            </p>
            <p class="text-muted">{{ selectedReport.description || "无" }}</p>
          </div>

          <div
            v-if="selectedReport.targetType && selectedReport.targetId"
            class="rounded-control border border-line bg-inset p-4"
          >
            <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
              <i class="i-[mdi--target]" aria-hidden="true"></i>
              被举报对象
            </p>
            <p class="text-muted">
              {{ getTargetText(selectedReport.targetType) }} #{{ selectedReport.targetId }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-control border border-line bg-inset p-4">
              <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
                <i class="i-[mdi--clock-outline]" aria-hidden="true"></i>
                创建时间
              </p>
              <p class="text-muted">{{ formatDate(selectedReport.createdAt) }}</p>
            </div>
            <div
              v-if="selectedReport.updatedAt"
              class="rounded-control border border-line bg-inset p-4"
            >
              <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
                <i class="i-[mdi--clock-check]" aria-hidden="true"></i>
                最后更新
              </p>
              <p class="text-muted">{{ formatDate(selectedReport.updatedAt) }}</p>
            </div>
          </div>

          <div class="rounded-control border border-line bg-inset p-4">
            <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
              <i class="i-[mdi--clipboard-text]" aria-hidden="true"></i>
              处理结果
            </p>
            <p class="text-muted">{{ selectedReport.reviewNote || "无" }}</p>
          </div>

          <!-- 状态操作 -->
          <div
            v-if="selectedReport.status === 'pending' || selectedReport.status === 'reviewing'"
            class="rounded-control border border-error/30 bg-[color:var(--wb-danger-subtle)] p-6"
          >
            <h4 class="mb-4 flex items-center gap-2 font-bold text-fg">
              <i class="i-[mdi--hammer]" aria-hidden="true"></i>
              处理举报
            </h4>

            <div class="space-y-4">
              <textarea
                v-model="updateForm.reviewNote"
                class="wb-input w-full"
                rows="3"
                placeholder="处理结果说明…"
              ></textarea>
              <div class="flex gap-2">
                <button class="wb-btn-primary flex-1 gap-2" @click="updateStatus('resolved')">
                  <i class="i-[mdi--check]" aria-hidden="true"></i>
                  标记为已解决
                </button>
                <button class="wb-btn-danger flex-1 gap-2" @click="updateStatus('dismissed')">
                  <i class="i-[mdi--close]" aria-hidden="true"></i>
                  标记为已驳回
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-line bg-inset p-6">
          <button class="wb-btn gap-2" @click="closeReportModal">
            <i class="i-[mdi--close]" aria-hidden="true"></i>
            关闭
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue"
import adminService, {
  type Report,
  type ReportStatusValue,
  type ReportReasonValue,
} from "@/services/admin"
import Pagination from "@/components/Pagination.vue"
const loading = ref(true)
const reports = ref<Report[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })
const reportModal = ref<HTMLDialogElement | null>(null)
const selectedReport = ref<Report | null>(null)

const filters = reactive({
  status: "",
  reason: "",
  keyword: "",
})

const updateForm = reactive({
  reviewNote: "",
})

const pendingCount = computed(() => {
  return reports.value.filter((r) => r.status === "pending").length
})

const loadReports = async () => {
  try {
    loading.value = true
    const response = await adminService.getReports({
      page: pagination.value.page,
      limit: pagination.value.limit,
      status: filters.status || undefined,
      reason: filters.reason || undefined,
      keyword: filters.keyword || undefined,
    })
    reports.value = response.data
    pagination.value = response.pagination
  } catch (error) {
    console.error("加载举报列表失败:", error)
  } finally {
    loading.value = false
  }
}

const viewReport = async (id: number) => {
  try {
    const response = await adminService.getReportById(id)
    selectedReport.value = response.data
    updateForm.reviewNote = response.data.reviewNote || ""
    reportModal.value?.showModal()
  } catch (error) {
    console.error("获取举报详情失败:", error)
  }
}

const closeReportModal = () => {
  reportModal.value?.close()
  selectedReport.value = null
  updateForm.reviewNote = ""
}

const updateStatus = async (status: ReportStatusValue) => {
  if (!selectedReport.value) return

  try {
    await adminService.updateReportStatus(selectedReport.value.id, {
      status,
      reviewNote: updateForm.reviewNote,
    })
    await loadReports()
    closeReportModal()
  } catch (error) {
    console.error("更新举报状态失败:", error)
  }
}

const changePage = (page: number) => {
  pagination.value.page = page
  loadReports()
}

const getReasonText = (reason: ReportReasonValue) => {
  const map: Record<ReportReasonValue, string> = {
    spam: "垃圾信息",
    inappropriate: "不当内容",
    harassment: "骚扰/霸凌",
    violence: "暴力或危险行为",
    copyright: "版权问题",
    misinformation: "虚假信息",
    other: "其他",
  }
  return map[reason] || reason
}

const getStatusText = (status: ReportStatusValue) => {
  const map: Record<ReportStatusValue, string> = {
    pending: "待处理",
    reviewing: "审核中",
    resolved: "已解决",
    dismissed: "已驳回",
  }
  return map[status] || "未知"
}

const getStatusBadgeClass = (status: ReportStatusValue) => {
  const map: Record<ReportStatusValue, string> = {
    pending: "wb-badge-warning gap-1",
    reviewing: "wb-badge-primary gap-1",
    resolved: "wb-badge-success gap-1",
    dismissed: "wb-badge gap-1",
  }
  return map[status] || "wb-badge"
}

const getTargetText = (targetType: string) => {
  const map: Record<string, string> = {
    post: "帖子",
    comment: "评论",
  }
  return map[targetType] || "内容"
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("zh-CN")
}

onMounted(() => {
  loadReports()
})
</script>
