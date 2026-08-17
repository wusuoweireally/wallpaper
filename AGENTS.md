# 仓库协作与编码规范

人读启动方式看 `README.md`；Agent 默认读本文件。用中文回复。

## 目录与职责

- Monorepo：`server/`（NestJS + TypeORM + MySQL + Jest）、`web/`（Vue 3 + Vite + Pinia + Tailwind）。
- 后端分层：`controllers/` 参数与响应 → `services/` 业务 → `modules/` 组装；`entities/`、`dto/`。
- 前端：`components/` / `views/` 展示，`services/` API，`stores/` 状态，`router/` 路由。
- 上传：走腾讯云 COS（桶私有写公开读，审核通过即公开）；Demo seed 写入 `server/src/data/demo-wallpapers.json` 里的 COS 直链（空库且 `ENABLE_DEMO_SEED=true`），不再上传本地源图。

### 代码入口

| 用途 | 路径 |
|------|------|
| 后端配置 | `server/src/app.module.ts`、`server/src/config/` |
| 后端接口 / 业务 | `server/src/controllers/`、`server/src/services/` |
| 前端路由 / 请求 | `web/src/router/`、`web/src/config/api/`、`web/src/services/` |
| 前端页面 | `web/src/views/` |

## 环境与命令

- Node `>=20.19`（推荐 22，见 `.nvmrc`），pnpm `>=10`。
- **TypeScript 7** 为主依赖；eslint / jest / vue-tsc 等需 TS6 API 时走 `scripts/ts6-resolve-hook.cjs` + `@typescript/typescript6`。
- **仅根目录** `pnpm-lock.yaml`，禁止子包再生成锁文件。
- 本地：Docker 只起 MySQL（`pnpm db:up` → `127.0.0.1:3306`），`DB_HOST=127.0.0.1`；生产全栈 `pnpm deploy`，容器内 `DB_HOST=mysql`（compose 写死）。
- 环境模板：`server/.env.*.example`；真实 `.env` 禁止提交。仅 **一份** `docker-compose.yml`，无 prod override。

根脚本：`pnpm install --frozen-lockfile`、`dev`、`build`、`lint`、`type-check`、`test`、`db:up`/`db:down`、`deploy`/`deploy:logs`/`deploy:down`。
子包：`pnpm -C server|web dev|build|format`、`pnpm -C server typeorm:run|typeorm:revert|test -- <pattern>`。
细节与端口见 `README.md`。

提交前建议：

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
git diff --check
```

## 硬约束（改代码时优先遵守）

- TypeORM `synchronize` 始终关闭，结构只走 `server/src/migrations/`。
- JWT 用 HttpOnly Cookie；前端不保存、不手动拼 token。
- Axios GET 去重仅在请求显式 `deduplicate: true` 时启用。
- 壁纸原图/缩略图/预览图与头像均上传 COS、审核通过后公开读，前端直链访问。
- 后端 `ValidationPipe`：`whitelist` + `forbidNonWhitelisted`。
- 不提交密钥、bulk 上传产物；`.githooks/pre-commit` 可拦 `.env`/疑似密钥。

## 配置入口（勿在根目录再塞冲突配置）

| 用途 | 路径 |
|------|------|
| 编辑器缩进/换行 | 根 `.editorconfig` |
| 前端 lint / format | `web/eslint.config.mjs`、`web/.prettierrc` |
| 后端 lint / format | `server/eslint.config.mjs`、`server/.prettierrc` |

- 后端 Prettier：**有分号**、`printWidth` 80；ESLint 含 prettier 插件。
- 前端 Prettier：**无分号**、`printWidth` 100、Tailwind 类排序；lint 与 format 分离。
- 前后端规则不同，**不要合并成一份** Prettier/ESLint 根配置。

## 编码约定

- TS 优先明确类型；`import type`；少用 `any`。
- 后端：Controller 薄、逻辑在 Service；DTO 用 `class-validator`；异常用 Nest 语义异常 + 中文对外文案，不泄栈。
- 前端：组件只做展示与交互；API 在 `services/`；状态在 `stores/`；错误 `try/catch` + Toast（`useGlobalToast`）；乐观更新失败要回滚。
- 命名：后端 `*.service.ts` / `CreateXxxDto` / 实体单数 PascalCase；前端组件 PascalCase、`useXxx`、store/service 小写文件名。
- 前端路径别名 `@/`；后端相对路径。
- Vue SFC 块顺序：`template` → `script` → `style`。
- 未使用变量可用 `_` 前缀。
- 避免重复请求；分页与 `page`/`limit` 边界；长列表勿一次拉全量。

## 提交

- Conventional Commits：`type(scope): summary`，scope 常用 `server` / `web`。
- PR 含变更摘要、库表/迁移说明、测试清单；有 UI 附截图。
