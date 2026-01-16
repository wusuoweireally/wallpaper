# Repository Guidelines

# 用中文回答我的问题

## 目录结构与职责

- Monorepo：根目录管理 `server/`（NestJS + TypeORM）与 `web/`（Vue 3 + Vite）。
- Backend：`server/src/controllers/` 控制器层，`server/src/services/` 业务层，`server/src/modules/` 模块组装，`server/src/entities/` 实体，`server/src/dto/` 请求/响应 DTO。
- Frontend：`web/src/components/` 组件，`web/src/views/` 页面，`web/src/stores/` Pinia，`web/src/services/` API 封装，`web/src/router/` 路由。
- 静态与上传：`server/public/` 静态资源，`server/uploads/` 上传文件。

## 环境与依赖

- Node.js >= 18，pnpm >= 8。
- 后端数据库默认 MySQL（参见 `server/src/app.module.ts`）。
- 前端代理：Vite 开发时将 `/api` 与 `/uploads` 代理到 `http://localhost:3000`。

## 开发与构建命令

- 安装依赖：`pnpm install`（根目录，workspace 全部安装）。
- 开发服务：`pnpm dev`（同时启动 server 与 web）。
- 单独启动后端：`pnpm dev:server` 或 `pnpm -C server dev`。
- 单独启动前端：`pnpm dev:web` 或 `pnpm -C web dev`。
- 全量构建：`pnpm build`。
- 后端构建：`pnpm build:server` 或 `pnpm -C server build`。
- 前端构建：`pnpm build:web` 或 `pnpm -C web build`。
- 前端预览：`pnpm preview` 或 `pnpm -C web preview`。

## Lint / Format / 类型检查

- 全量 lint：`pnpm lint`。
- 后端 lint：`pnpm -C server lint`（eslint）。
- 前端 lint：`pnpm -C web lint`（eslint + vue）。
- 全量格式化：`pnpm format`。
- 后端格式化：`pnpm -C server format`（prettier）。
- 前端格式化：`pnpm -C web format`（prettier + tailwind plugin）。
- 类型检查：`pnpm type-check`（前后端）或分别运行 `pnpm -C server type-check` / `pnpm -C web type-check`。

## 测试命令

- 后端测试：`pnpm -C server test`（Jest）。
- 后端单测（单文件/模式）：`pnpm -C server test -- <pattern>`。
  - 示例：`pnpm -C server test -- wallpaper.service.spec.ts`
  - 示例：`pnpm -C server test -- wallpaper`
- E2E 测试：`pnpm -C server test:e2e`（如配置）。
- 前端当前无测试脚本（如新增可使用 Vitest）。

## Import 与模块组织

- TypeScript 优先：避免 `any`，尽量用明确类型与接口。
- 后端：模块化依赖注入，Controller 只负责参数处理与返回结构，业务逻辑下沉到 Service。
- 前端：API 封装在 `web/src/services/`，组件只做展示与交互，状态集中到 `stores/`。
- Import 约定：
  - 业务模块导入先于工具/第三方导入。
  - 使用路径别名：前端优先 `@/`；后端使用相对路径。
  - Type-only import 使用 `import type { ... }`。

## 格式化与代码风格

- 统一 2 空格缩进。
- 后端 prettier 规则：双引号、尾随逗号；保持与现有风格一致。
- 前端 prettier 规则：双引号、无分号、100 字符行宽、Tailwind 类自动排序。
- 避免一行过长，必要时换行对齐。
- Vue SFC 标签顺序：`template` -> `script` -> `style`（由 ESLint 强制）。

## 命名规范

- 后端：
  - 类名 PascalCase：`WallpaperService`。
  - 文件名：`*.service.ts` / `*.controller.ts` / `*.module.ts`。
  - DTO：`CreateXxxDto` / `UpdateXxxDto`。
  - Entity：单数 PascalCase（例如 `Wallpaper`）。
- 前端：
  - 组件名 PascalCase，文件 `.vue`。
  - composable：`useXxx.ts`。
  - store：`xxx.ts`（pinia）。
  - service：`xxx.ts`（API 调用）。

## 类型与数据建模

- DTO 必须使用 `class-validator` 装饰器做输入校验。
- 后端实体字段类型清晰（string/number/enum），避免 `any`。
- 前端接口统一在 `services/` 或 `stores/` 内定义，避免重复类型。

## 错误处理规范

- 后端：
  - 控制器层用 `BadRequestException` / `NotFoundException` 等 Nest 异常。
  - 捕获异常后使用统一错误消息（中文），不要直接泄漏内部错误栈。
  - 事务失败时回滚并清理副作用（如上传文件）。
- 前端：
  - API 调用用 `try/catch`，输出 console.error 并给用户提示。
  - UI 状态回滚：如乐观更新失败时还原状态。
  - 统一 Toast 处理（`useGlobalToast`）。

## 性能与最佳实践

- 避免重复请求，优先使用缓存/分页（见 `web/src/stores/index.ts`）。
- Promise 并行调用使用 `Promise.all`。
- 查询参数做好边界处理（如 page/limit 最小值）。
- 长列表避免一次性加载过多数据。

## 安全与配置

- 不提交 `.env` 或私密配置。
- 上传文件存储在 `server/uploads/`；公开访问路径通过 `/uploads`。
- 后端 `ValidationPipe` 启用 `whitelist` / `forbidNonWhitelisted`。

## 提交与 PR

- 使用 Conventional Commits：`type(scope): summary`，scope 常用 `server` / `web`。
- PR 描述包含：变更摘要、关联任务、UI 截图（如有）、数据库变更说明、测试清单。

## Cursor / Copilot 规则

- 未发现 `.cursor/rules/`、`.cursorrules` 或 `.github/copilot-instructions.md`。
