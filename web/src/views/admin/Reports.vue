<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="relative">
      <div class="absolute -inset-x-4 -inset-y-2 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 blur-2xl -z-10 rounded-3xl"></div>
      <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <iconify-icon icon="mdi:shield-alert" class="text-white text-2xl"></iconify-icon>
            </div>
            <div>
              <h1 class="text-4xl font-bold bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">举报管理</h1>
              <p class="text-white/70 mt-1">Report Center</p>
            </div>
          </div>
          <div class="stats shadow-lg bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
            <div class="stat px-6 py-4">
              <div class="stat-figure text-red-400">
                <iconify-icon icon="mdi:alert-octagon" class="text-3xl"></iconify-icon>
              </div>
              <div class="stat-title text-white/80">总举报数</div>
              <div class="stat-value text-red-400 text-2xl">{{ pagination.total }}</div>
              <div class="stat-desc text-white/60">待处理: {{ pendingCount }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
      <div class="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
        <div class="p-6">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="form-control min-w-[150px]">
              <label class="label">
                <span class="label-text text-white/80 font-semibold">状态</span>
              </label>
              <select v-model="filters.status" class="select bg-white/10 backdrop-blur-sm border-white/20 text-white focus:border-red-400 focus:ring-2 focus:ring-red-400/50 rounded-xl" @change="loadReports">
                <option value="" class="bg-slate-900">全部</option>
                <option value="pending" class="bg-slate-900">待处理</option>
                <option value="reviewing" class="bg-slate-900">审核中</option>
                <option value="resolved" class="bg-slate-900">已解决</option>
                <option value="dismissed" class="bg-slate-900">已驳回</option>
              </select>
            </div>

            <div class="form-control min-w-[150px]">
              <label class="label">
                <span class="label-text text-white/80 font-semibold">举报类型</span>
              </label>
              <select v-model="filters.reason" class="select bg-white/10 backdrop-blur-sm border-white/20 text-white focus:border-red-400 focus:ring-2 focus:ring-red-400/50 rounded-xl" @change="loadReports">
                <option value="" class="bg-slate-900">全部</option>
                <option value="spam" class="bg-slate-900">垃圾信息</option>
                <option value="inappropriate" class="bg-slate-900">不当内容</option>
                <option value="harassment" class="bg-slate-900">骚扰/霸凌</option>
                <option value="violence" class="bg-slate-900">暴力或危险行为</option>
                <option value="copyright" class="bg-slate-900">版权问题</option>
                <option value="misinformation" class="bg-slate-900">虚假信息</option>
                <option value="other" class="bg-slate-900">其他</option>
              </select>
            </div>

            <div class="form-control flex-1 min-w-[250px]">
              <label class="label">
                <span class="label-text text-white/80 font-semibold">搜索</span>
              </label>
              <div class="relative">
                <input
                  v-model="filters.keyword"
                  type="text"
                  placeholder="搜索举报内容..."
                  class="input bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 focus:border-red-400 focus:ring-2 focus:ring-red-400/50 w-full rounded-xl pl-12"
                  @keyup.enter="loadReports"
                />
                <iconify-icon icon="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl"></iconify-icon>
              </div>
            </div>

            <button class="btn bg-gradient-to-r from-red-500 to-orange-500 border-none hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/30 text-white gap-2 rounded-xl" @click="loadReports">
              <iconify-icon icon="mdi:magnify" class="text-lg"></iconify-icon>
              搜索
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 举报列表 -->
    <div class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
      <div class="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div v-if="loading" class="flex justify-center items-center py-20">
          <div class="relative">
            <div class="w-16 h-16 rounded-full border-4 border-red-500/30 border-t-red-500 animate-spin"></div>
          </div>
        </div>

        <div v-else-if="reports.length === 0" class="text-center py-20">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center mx-auto mb-4 border border-white/10">
            <iconify-icon icon="mdi:shield-off" class="text-4xl text-white/30"></iconify-icon>
          </div>
          <p class="text-white/60 font-semibold text-lg">暂无举报记录</p>
          <p class="text-white/40 text-sm mt-2">所有内容都很干净呢</p>
        </div>

        <div v-else class="p-6">
          <!-- 桌面端表格 -->
          <div class="hidden lg:block overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="text-white/80 font-bold px-6 py-4">ID</th>
                  <th class="text-white/80 font-bold px-6 py-4">举报类型</th>
                  <th class="text-white/80 font-bold px-6 py-4">状态</th>
                  <th class="text-white/80 font-bold px-6 py-4">举报人</th>
                  <th class="text-white/80 font-bold px-6 py-4">举报内容</th>
                  <th class="text-white/80 font-bold px-6 py-4">创建时间</th>
                  <th class="text-white/80 font-bold px-6 py-4">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="report in reports" :key="report.id" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="px-6 py-4">
                    <span class="text-white/60 font-mono text-sm">#{{ report.id }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="badge bg-white/20 backdrop-blur-sm text-white text-xs border-none">
                      {{ getReasonText(report.reason) }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div :class="getStatusBadgeClass(report.status)">
                      {{ getStatusText(report.status) }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-white/90">{{ report.user?.username || '未知用户' }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-white/70 max-w-xs truncate">{{ report.description }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-white/70">{{ formatDate(report.createdAt) }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <button class="btn btn-sm btn-ghost bg-gradient-to-r from-red-500/80 to-orange-500/80 hover:from-red-600 hover:to-orange-600 text-white border-none shadow-lg shadow-red-500/30" @click="viewReport(report.id)">
                      <iconify-icon icon="mdi:eye"></iconify-icon>
                      查看
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 移动端卡片 -->
          <div class="lg:hidden">
            <div v-for="report in reports" :key="report.id" class="p-6 border-b border-white/5">
              <div class="flex justify-between items-start mb-3">
                <div class="badge bg-white/20 backdrop-blur-sm text-white text-xs border-none">
                  {{ getReasonText(report.reason) }}
                </div>
                <div :class="getStatusBadgeClass(report.status)">
                  {{ getStatusText(report.status) }}
                </div>
              </div>
              <p class="text-sm text-white/70 mb-3">{{ report.description }}</p>
              <div class="flex justify-between items-center text-xs text-white/50 mb-3">
                <span>举报人: {{ report.user?.username || '未知用户' }}</span>
                <span>{{ formatDate(report.createdAt) }}</span>
              </div>
              <button class="btn btn-sm btn-ghost bg-gradient-to-r from-red-500/80 to-orange-500/80 hover:from-red-600 hover:to-orange-600 text-white border-none shadow-lg shadow-red-500/30 w-full" @click="viewReport(report.id)">
                <iconify-icon icon="mdi:eye"></iconify-icon>
                查看详情
              </button>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="pagination.pages > 1" class="p-6 border-t border-white/10">
            <div class="join flex justify-center">
              <button
                class="join-item btn bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="pagination.page === 1"
                @click="changePage(pagination.page - 1)"
              >
                <iconify-icon icon="mdi:chevron-left"></iconify-icon>
                上一页
              </button>
              <button class="join-item btn bg-gradient-to-r from-red-500/20 to-orange-500/20 border-white/20 text-white" disabled>
                第 {{ pagination.page }} / {{ pagination.pages }} 页
              </button>
              <button
                class="join-item btn bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="pagination.page === pagination.pages"
                @click="changePage(pagination.page + 1)"
              >
                下一页
                <iconify-icon icon="mdi:chevron-right"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 举报详情模态框 -->
    <dialog ref="reportModal" class="modal">
      <div class="modal-box max-w-3xl bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-0 overflow-hidden">
        <div class="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 p-6 border-b border-white/10">
          <h3 class="font-bold text-2xl text-white flex items-center gap-3">
            <iconify-icon icon="mdi:shield-search" class="text-3xl"></iconify-icon>
            举报详情 #{{ selectedReport?.id }}
          </h3>
        </div>

        <div v-if="selectedReport" class="p-6 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p class="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                <iconify-icon icon="mdi:tag"></iconify-icon>
                举报类型
              </p>
              <div class="badge bg-white/20 backdrop-blur-sm text-white border-none">
                {{ getReasonText(selectedReport.reason) }}
              </div>
            </div>
            <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p class="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                <iconify-icon icon="mdi:check-circle"></iconify-icon>
                状态
              </p>
              <div :class="getStatusBadgeClass(selectedReport.status)">
                {{ getStatusText(selectedReport.status) }}
              </div>
            </div>
          </div>

          <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p class="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
              <iconify-icon icon="mdi:account"></iconify-icon>
              举报人
            </p>
            <p class="text-white/90">{{ selectedReport.user?.username || '未知用户' }}</p>
          </div>

          <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p class="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
              <iconify-icon icon="mdi:text"></iconify-icon>
              举报描述
            </p>
            <p class="text-white/70">{{ selectedReport.description || '无' }}</p>
          </div>

          <div v-if="selectedReport.targetType && selectedReport.targetId" class="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p class="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
              <iconify-icon icon="mdi:target"></iconify-icon>
              被举报对象
            </p>
            <p class="text-white/70">
              {{ getTargetText(selectedReport.targetType) }} #{{ selectedReport.targetId }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p class="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                <iconify-icon icon="mdi:clock-outline"></iconify-icon>
                创建时间
              </p>
              <p class="text-white/70">{{ formatDate(selectedReport.createdAt) }}</p>
            </div>
            <div v-if="selectedReport.updatedAt" class="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p class="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                <iconify-icon icon="mdi:clock-check"></iconify-icon>
                最后更新
              </p>
              <p class="text-white/70">{{ formatDate(selectedReport.updatedAt) }}</p>
            </div>
          </div>

          <div class="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p class="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
              <iconify-icon icon="mdi:clipboard-text"></iconify-icon>
              处理结果
            </p>
            <p class="text-white/70">{{ selectedReport.reviewNote || '无' }}</p>
          </div>

          <!-- 状态操作 -->
          <div v-if="selectedReport.status === 'pending' || selectedReport.status === 'reviewing'" class="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-6 border border-red-500/30">
            <h4 class="font-bold text-white mb-4 flex items-center gap-2">
              <iconify-icon icon="mdi:hammer"></iconify-icon>
              处理举报
            </h4>

            <div class="space-y-4">
              <textarea
                v-model="updateForm.reviewNote"
                class="textarea bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 focus:border-red-400 focus:ring-2 focus:ring-red-400/50 w-full rounded-xl"
                rows="3"
                placeholder="处理结果说明..."
              ></textarea>
              <div class="flex gap-2">
                <button class="btn btn-success flex-1 gap-2" @click="updateStatus('resolved')">
                  <iconify-icon icon="mdi:check"></iconify-icon>
                  标记为已解决
                </button>
                <button class="btn btn-error flex-1 gap-2" @click="updateStatus('dismissed')">
                  <iconify-icon icon="mdi:close"></iconify-icon>
                  标记为已驳回
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action p-6 bg-black/20 border-t border-white/10">
          <button class="btn bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-xl gap-2" @click="closeReportModal">
            <iconify-icon icon="mdi:close"></iconify-icon>
            关闭
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import adminService, { type Report, type ReportStatusValue, type ReportReasonValue } from '@/services/admin'
const loading = ref(true)
const reports = ref<Report[]>([])
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })
const reportModal = ref<HTMLDialogElement | null>(null)
const selectedReport = ref<Report | null>(null)

const filters = reactive({
  status: '',
  reason: '',
  keyword: ''
})

const updateForm = reactive({
  reviewNote: ''
})

const pendingCount = computed(() => {
  return reports.value.filter(r => r.status === 'pending').length
})

const loadReports = async () => {
  try {
    loading.value = true
    const response = await adminService.getReports({
      page: pagination.value.page,
      limit: pagination.value.limit,
      status: filters.status || undefined,
      reason: filters.reason || undefined,
      keyword: filters.keyword || undefined
    })
    reports.value = response.data
    pagination.value = response.pagination
  } catch (error) {
    console.error('加载举报列表失败:', error)
  } finally {
    loading.value = false
  }
}

const viewReport = async (id: number) => {
  try {
    const response = await adminService.getReportById(id)
    selectedReport.value = response.data
    updateForm.reviewNote = response.data.reviewNote || ''
    reportModal.value?.showModal()
  } catch (error) {
    console.error('获取举报详情失败:', error)
  }
}

const closeReportModal = () => {
  reportModal.value?.close()
  selectedReport.value = null
  updateForm.reviewNote = ''
}

const updateStatus = async (status: ReportStatusValue) => {
  if (!selectedReport.value) return

  try {
    await adminService.updateReportStatus(selectedReport.value.id, {
      status,
      reviewNote: updateForm.reviewNote
    })
    await loadReports()
    closeReportModal()
  } catch (error) {
    console.error('更新举报状态失败:', error)
  }
}

const changePage = (page: number) => {
  pagination.value.page = page
  loadReports()
}

const getReasonText = (reason: ReportReasonValue) => {
  const map: Record<ReportReasonValue, string> = {
    spam: '垃圾信息',
    inappropriate: '不当内容',
    harassment: '骚扰/霸凌',
    violence: '暴力或危险行为',
    copyright: '版权问题',
    misinformation: '虚假信息',
    other: '其他'
  }
  return map[reason] || reason
}

const getStatusText = (status: ReportStatusValue) => {
  const map: Record<ReportStatusValue, string> = {
    pending: '待处理',
    reviewing: '审核中',
    resolved: '已解决',
    dismissed: '已驳回'
  }
  return map[status] || '未知'
}

const getStatusBadgeClass = (status: ReportStatusValue) => {
  const map: Record<ReportStatusValue, string> = {
    pending: 'badge bg-gradient-to-r from-orange-500 to-yellow-500 border-none text-white gap-1',
    reviewing: 'badge bg-gradient-to-r from-blue-500 to-indigo-500 border-none text-white gap-1',
    resolved: 'badge bg-gradient-to-r from-green-500 to-emerald-500 border-none text-white gap-1',
    dismissed: 'badge bg-gradient-to-r from-gray-600 to-gray-700 border-none text-white gap-1'
  }
  return map[status] || 'badge'
}

const getTargetText = (targetType: string) => {
  const map: Record<string, string> = {
    post: '帖子',
    comment: '评论'
  }
  return map[targetType] || '内容'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadReports()
})
</script>
