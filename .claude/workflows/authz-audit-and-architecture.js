export const meta = {
  name: 'authz-audit-and-architecture',
  description: '壁纸系统全量认证授权审计(逐控制器 + 对抗验证) + 框架设计/接口管理分析',
  phases: [
    { title: 'Audit', detail: '逐控制器审计鉴权与越权风险' },
    { title: 'Verify', detail: '对抗式验证每条发现,剔除误报' },
    { title: 'Architecture', detail: '并行分析框架分层/接口管理/认证体系' },
  ],
}

const SRV = '/Users/tuzhitao/code/Person_like/wallpaper/server/src'
const WEB = '/Users/tuzhitao/code/Person_like/wallpaper/web/src'

const SHARED = `共享鉴权基础设施(已由主审阅,作为你的判断依据):
- JwtAuthGuard(auth/jwt-auth.guard.ts): 标准 passport jwt 守卫,从 cookie(名 Authentication) 或 Authorization Bearer 提取 token,ignoreExpiration:false。
- OptionalJwtAuthGuard(auth/optional-jwt-auth.guard.ts): token 有效则附加 request.user,无效/缺失则 user=null 且【不拦截请求】。
- RolesGuard(guards/roles.guard.ts): 读取 @Roles() 元数据;若 handler/class 无 @Roles 则直接放行(return true);否则校验 request.user.role 是否在所需角色内,不满足抛 ForbiddenException。【关键】RolesGuard 自身不触发 JWT 校验,依赖 request.user 已被前置守卫填充,因此必须与 JwtAuthGuard 联用且顺序为 @UseGuards(JwtAuthGuard, RolesGuard)。若只写 @UseGuards(RolesGuard) 而 @Roles 存在,则 request.user 为空会抛 Forbidden(可用但语义错);若 @UseGuards(JwtAuthGuard) 但漏了 RolesGuard,则 @Roles 形同虚设。
- @Roles(UserRole.ADMIN) (decorators/roles.decorator.ts) 标记所需角色。
- @CurrentUser() (decorators/current-user.decorator.ts) 提取 request.user={userId,username,role},会校验 userId>0。
- UserRole 枚举见 entities/user.entity.ts。
【已知系统性风险,审计时据此判断关联问题】: 登录签发的 JWT 内嵌 role 字段,RolesGuard 直接信任 token 里的 role 而非实时查库;JWT_EXPIRES_IN=180d。意味着用户被降级/封禁后,旧 token 在 180 天内仍可通过 RolesGuard。`

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['controller', 'endpoints', 'findings'],
  properties: {
    controller: { type: 'string' },
    endpoints: {
      type: 'array',
      description: '该控制器每个 HTTP 端点的鉴权清单',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['method', 'path', 'handler', 'guards', 'requiresAuth', 'isMutation', 'ownershipEnforced'],
        properties: {
          method: { type: 'string' },
          path: { type: 'string' },
          handler: { type: 'string' },
          guards: { type: 'array', items: { type: 'string' } },
          requiresAuth: { type: 'boolean' },
          isMutation: { type: 'boolean', description: '是否为写操作(POST/PUT/PATCH/DELETE 或有副作用)' },
          ownershipEnforced: { type: 'string', enum: ['yes', 'no', 'n/a', 'unknown'], description: '操作他人可拥有的资源时,service 层是否校验归属(userId 匹配或管理员)' },
          notes: { type: 'string' },
        },
      },
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'severity', 'category', 'title', 'location', 'description', 'exploit', 'fix'],
        properties: {
          id: { type: 'string', description: '稳定 id,格式 <controllerKey>-<序号>' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          category: { type: 'string', enum: ['missing-auth', 'missing-role', 'idor-broken-object-level', 'broken-function-level', 'optional-guard-misuse', 'mass-assignment', 'input-validation', 'info-leak', 'other'] },
          title: { type: 'string' },
          location: { type: 'string', description: 'file:line' },
          description: { type: 'string' },
          exploit: { type: 'string', description: '具体越权/绕过利用场景' },
          fix: { type: 'string', description: '具体修复方案,尽量给代码级建议' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'isReal', 'confidence', 'correctedSeverity', 'reasoning'],
  properties: {
    id: { type: 'string' },
    isReal: { type: 'boolean', description: '复核真实代码后,该漏洞是否确实存在(非误报)' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    correctedSeverity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'not-a-bug'] },
    reasoning: { type: 'string', description: '基于真实代码行的复核理由;若误报说明为何' },
    fixValidated: { type: 'string', description: '对修复方案的修正或确认' },
  },
}

const ARCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'rating', 'strengths', 'weaknesses', 'recommendations'],
  properties: {
    dimension: { type: 'string' },
    rating: { type: 'string', enum: ['优秀', '良好', '一般', '需改进'] },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['priority', 'title', 'detail'],
        properties: {
          priority: { type: 'string', enum: ['高', '中', '低'] },
          title: { type: 'string' },
          detail: { type: 'string' },
        },
      },
    },
    evidence: { type: 'array', items: { type: 'string' }, description: 'file:line 形式的关键佐证' },
  },
}

// ---- 审计目标:逐控制器 + 一个全局配置/认证核心目标 ----
const TARGETS = [
  { key: 'global', label: '全局配置&认证核心', files: ['main.ts', 'app.module.ts', 'services/auth.service.ts', 'services/github-auth.service.ts', 'auth/github.strategy.ts', 'controllers/auth.controller.ts'],
    focus: '检查: CORS 配置(credentials/origin 白名单)、cookie 标志(httpOnly/secure/sameSite)、全局 ValidationPipe(whitelist/forbidNonWhitelisted/transform)、JWT 签发(密钥、role 写入、过期)、密码哈希强度、登录/注册/GitHub OAuth 流程的鉴权与 CSRF、退出登录、是否有全局 guard。' },
  { key: 'user', label: 'user.controller', files: ['controllers/user.controller.ts', 'services/user.service.ts'],
    focus: '检查: 个人资料读写、头像上传、改密码、获取他人信息是否泄露敏感字段(password/email)、修改/删除是否校验 userId 归属、是否能通过参数指定他人 id 越权、role 是否可被自我提升(mass assignment)。' },
  { key: 'wallpaper', label: 'wallpaper.controller', files: ['controllers/wallpaper.controller.ts', 'services/wallpaper.service.ts'],
    focus: '检查: 上传/编辑/删除壁纸是否校验归属、点赞/收藏/下载、OptionalJwtAuthGuard 用在哪些端点是否合理、按 id 操作是否 IDOR、审核状态字段是否可被普通用户篡改。' },
  { key: 'comment', label: 'comment.controller', files: ['controllers/comment.controller.ts', 'services/comment.service.ts'],
    focus: '检查: 评论增删改是否校验作者归属、嵌套回复、点赞、能否删除/编辑他人评论、能否冒充他人 userId。' },
  { key: 'post', label: 'post.controller', files: ['controllers/post.controller.ts', 'services/post.service.ts'],
    focus: '检查: 帖子增删改是否校验作者归属、点赞、置顶/锁定等管理操作是否需要管理员、IDOR。' },
  { key: 'report', label: 'report.controller', files: ['controllers/report.controller.ts', 'services/report.service.ts'],
    focus: '检查: 举报创建是否需要登录、能否查看/篡改他人举报、举报状态变更是否仅管理员。' },
  { key: 'tag', label: 'tag.controller', files: ['controllers/tag.controller.ts', 'services/tag.service.ts'],
    focus: '检查: 标签创建/删除/编辑是否需要权限、热门标签查询、能否被普通用户滥用创建。' },
  { key: 'admin-user', label: 'admin-user.controller', files: ['controllers/admin/admin-user.controller.ts', 'services/user.service.ts'],
    focus: '检查: 是否每个端点都有 @UseGuards(JwtAuthGuard, RolesGuard)+@Roles(ADMIN)、封禁/改角色/删除用户、能否提升自己或他人到 admin、能否删除超管。' },
  { key: 'admin-wallpaper', label: 'admin-wallpaper.controller', files: ['controllers/admin/admin-wallpaper.controller.ts', 'services/wallpaper.service.ts'],
    focus: '检查: 是否每端点都有 admin 守卫、审核/批量删除/状态变更、守卫顺序是否正确。' },
  { key: 'admin-report', label: 'admin-report.controller', files: ['controllers/admin/admin-report.controller.ts', 'services/report.service.ts'],
    focus: '检查: 是否每端点都有 admin 守卫、审核处理举报、守卫顺序。' },
  { key: 'admin-dashboard', label: 'admin-dashboard.controller', files: ['controllers/admin/admin-dashboard.controller.ts', 'services/admin-dashboard.service.ts'],
    focus: '检查: 仪表盘统计端点是否有 admin 守卫、是否泄露全站敏感统计给普通用户。' },
]

phase('Audit')
log(`开始审计 ${TARGETS.length} 个目标(逐控制器 + 全局配置)`)

// pipeline: 审计 -> 对该目标发现做对抗验证(无 barrier,各目标独立流水)
const perTarget = await pipeline(
  TARGETS,
  (t) => agent(
    `你是 NestJS 安全审计专家。审计目标【${t.label}】的认证与授权(重点 OWASP API1 越权对象级 / API5 越权功能级 / 缺失鉴权)。\n\n` +
    `${SHARED}\n\n` +
    `必读文件(绝对路径,逐个 Read,service 层是判断 ownership 的关键):\n` +
    t.files.map((f) => `- ${SRV}/${f}`).join('\n') + '\n' +
    `如需 UserRole 枚举或实体字段,Read ${SRV}/entities/ 下相关文件;如需确认 DTO 校验,Read ${SRV}/dto/ 下相关文件。\n\n` +
    `审计重点: ${t.focus}\n\n` +
    `对每个端点产出鉴权清单(endpoints),并产出 findings。findings 只报真实问题,每条给出 file:line 定位、可行的利用场景(exploit)、代码级修复(fix)。id 用 "${t.key}-1","${t.key}-2"...。\n` +
    `判定 ownershipEnforced 时务必进入 service 方法体确认是否有 userId 比对或管理员判断,不要只看控制器。没有可越权资源的只读端点填 n/a。`,
    { label: `audit:${t.key}`, phase: 'Audit', schema: FINDINGS_SCHEMA, agentType: 'Explore' }
  ),
  (audit, t) => {
    if (!audit || !audit.findings || audit.findings.length === 0) return { target: t.key, label: t.label, audit, verdicts: [] }
    // 对抗验证:对每条发现独立复核(critical/high/medium 必验,low 也验以求严谨)
    return parallel(audit.findings.map((f) => () =>
      agent(
        `你是怀疑论审计复核者,目标是【证伪】下面这条疑似漏洞。除非真实代码确凿支持,否则判 isReal=false。\n\n` +
        `${SHARED}\n\n` +
        `疑似漏洞:\n- id: ${f.id}\n- 严重度(初判): ${f.severity}\n- 类别: ${f.category}\n- 标题: ${f.title}\n- 定位: ${f.location}\n- 描述: ${f.description}\n- 利用: ${f.exploit}\n- 建议修复: ${f.fix}\n\n` +
        `请实际 Read 定位文件(及其调用的 service 方法)逐行核对。判断: 守卫是否真的缺失/顺序错误? service 层是否真的没有 ownership 校验? 利用场景是否真的可达(无其他前置守卫拦截)? 给出基于真实代码行号的 reasoning。若初判严重度偏高/偏低请在 correctedSeverity 修正;确认误报填 not-a-bug。`,
        { label: `verify:${f.id}`, phase: 'Verify', schema: VERDICT_SCHEMA, agentType: 'Explore' }
      ).then((v) => ({ finding: f, verdict: v })).catch(() => ({ finding: f, verdict: null }))
    )).then((checked) => ({ target: t.key, label: t.label, audit, verdicts: checked }))
  }
)

// ---- 框架设计/接口管理分析(与审计独立,并行) ----
phase('Architecture')
const DIMENSIONS = [
  { key: 'layering', dim: '架构分层与模块化(NestJS module/controller/service/repository 职责边界、依赖注入、循环依赖、模块组织)',
    read: `Read ${SRV}/app.module.ts 与 ${SRV}/modules/ 下所有模块;抽样 Read 2-3 个 service 看分层是否清晰(控制器是否含业务逻辑、service 是否直接操作 res)。` },
  { key: 'api', dim: '接口管理与 RESTful API 设计(路由命名一致性、HTTP 方法语义、统一响应格式、分页/筛选/排序约定、版本化、Swagger 文档、DTO 与 class-validator 校验完整性)',
    read: `抽样 Read 3-4 个 controller(${SRV}/controllers/ 下) 看响应格式是否统一、是否有 {success,message,data} 包装、分页参数是否一致;Read ${SRV}/dto/ 下若干 DTO 看校验装饰器覆盖度;检查是否有全局响应/异常拦截器(grep Interceptor/ExceptionFilter)。` },
  { key: 'authdesign', dim: '认证授权体系设计(JWT-in-HttpOnly-Cookie 方案、守卫组合、role 来源于 token 的设计、刷新/吊销机制、是否区分认证与授权)',
    read: `Read ${SRV}/auth/ 全部、${SRV}/guards/、${SRV}/services/auth.service.ts;评估 role 内嵌 token+180d 过期、无吊销/刷新机制的设计权衡;评估是否应集中用全局 guard 而非逐控制器手写。` },
  { key: 'frontend-api', dim: '前端接口管理(axios 实例/拦截器、请求去重、统一错误处理、service 层封装、类型定义、与后端契约一致性)',
    read: `Read ${WEB}/config/api/ 下文件与 ${WEB}/services/ 下 2-3 个 service;评估拦截器解包、401 处理、请求取消、类型安全。` },
  { key: 'consistency', dim: '工程一致性与可维护性(错误处理统一性、命名规范、TS 类型严格度、配置管理 ConfigService、测试覆盖、可扩展性如缓存/限流缺失)',
    read: `grep 是否存在限流(ThrottlerGuard/rate limit)、全局异常过滤器、日志;Read ${SRV}/main.ts;查看 test/ 目录测试覆盖;评估 synchronize、迁移策略。` },
]
const archResults = await parallel(DIMENSIONS.map((d) => () =>
  agent(
    `你是资深后端架构师,评估壁纸系统(NestJS 后端 + Vue3 前端)的【${d.dim}】这一维度。\n\n` +
    `代码根: 后端 ${SRV} ,前端 ${WEB}。\n阅读指引: ${d.read}\n\n` +
    `客观评估,给出 rating、strengths、weaknesses,以及按优先级排序的 recommendations(每条含具体落地做法)。evidence 用 file:line 佐证关键判断。聚焦"设计是否优秀/接口管理是否规范",避免泛泛而谈。`,
    { label: `arch:${d.key}`, phase: 'Architecture', schema: ARCH_SCHEMA, agentType: 'Explore' }
  )
))

// ---- 汇总 ----
const confirmed = []
const falsePositives = []
for (const r of perTarget.filter(Boolean)) {
  for (const c of (r.verdicts || [])) {
    if (!c || !c.verdict) { confirmed.push({ ...c.finding, target: r.label, verdictNote: '验证 agent 失败,保留原判' }); continue }
    if (c.verdict.isReal && c.verdict.correctedSeverity !== 'not-a-bug') {
      confirmed.push({ ...c.finding, target: r.label, severity: c.verdict.correctedSeverity, confidence: c.verdict.confidence, verdictNote: c.verdict.reasoning, fixValidated: c.verdict.fixValidated })
    } else {
      falsePositives.push({ id: c.finding.id, title: c.finding.title, why: c.verdict.reasoning })
    }
  }
}

const sevRank = { critical: 0, high: 1, medium: 2, low: 3 }
confirmed.sort((a, b) => (sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9))

const endpointMatrix = perTarget.filter(Boolean).map((r) => ({
  target: r.label,
  endpoints: r.audit ? r.audit.endpoints : [],
}))

log(`审计完成: 确认 ${confirmed.length} 条, 误报剔除 ${falsePositives.length} 条`)

return {
  summary: {
    targetsAudited: TARGETS.length,
    confirmedFindings: confirmed.length,
    falsePositives: falsePositives.length,
    bySeverity: {
      critical: confirmed.filter((f) => f.severity === 'critical').length,
      high: confirmed.filter((f) => f.severity === 'high').length,
      medium: confirmed.filter((f) => f.severity === 'medium').length,
      low: confirmed.filter((f) => f.severity === 'low').length,
    },
  },
  confirmedFindings: confirmed,
  falsePositives,
  endpointMatrix,
  architecture: archResults.filter(Boolean),
}
