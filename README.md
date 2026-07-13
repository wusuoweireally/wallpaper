# 随心壁纸

前后端分离的壁纸分享社区：浏览、筛选、上传、点赞、收藏、标签、论坛与管理后台。

## 技术栈

- `server/`：NestJS 11、TypeORM、MySQL、Jest
- `web/`：Vue 3、Vite、Pinia、Tailwind CSS
- 根目录：pnpm workspace、Docker Compose

## 环境要求

- Node.js 20.19+，推荐 `.nvmrc` 中的 Node.js 22
- pnpm 10+
- MySQL 8（推荐用 Docker 只跑数据库；前后端本机开发）

## 根目录常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 同时启动后端 + 前端（开发） |
| `pnpm build` | 全量构建 |
| `pnpm lint` | 全量 lint |
| `pnpm type-check` | 全量类型检查 |
| `pnpm test` | 跑测试（主要为 server） |
| `pnpm docker:prod` | 生产：构建并后台启动 compose |
| `pnpm docker:prod:logs` | 生产：跟踪日志 |
| `pnpm docker:prod:down` | 生产：停止栈 |

单独起某一端、格式化等请用子包命令，例如：

```bash
pnpm -C server dev
pnpm -C web dev
pnpm -C server build
pnpm -C web build
pnpm -C server format
pnpm -C web format
pnpm -C server lint:fix
pnpm -C web lint:fix
pnpm -C web preview
pnpm -C server start:prod
pnpm -C server typeorm:run
```

仅使用根目录 `pnpm-lock.yaml`，不要在 `server/`、`web/` 下再生成锁文件。

---

## 本地开发（前后端本机 + Docker MySQL）

### 1. 依赖与环境文件

```bash
pnpm install --frozen-lockfile
cp server/.env.development.example server/.env.development
# 填写 JWT_SECRET（≥16 位）、DB_PASSWORD、MYSQL_ROOT_PASSWORD 等
```

### 2. 启动数据库

```bash
# 使用 development env 里的密码等变量；MySQL 映射到 127.0.0.1:3306（默认）
docker compose --env-file server/.env.development up -d mysql
```

- 宿主机：`127.0.0.1:3306` → 容器内 `3306`
- 本机 Nest：`DB_HOST=127.0.0.1`、`DB_PORT=3306`（见 `.env.development`）
- 若 3306 已被占用：启动时设 `DB_HOST_PORT=3307`，并把 `DB_PORT` 改成 `3307`

### 3. 迁移与启动应用

```bash
pnpm -C server typeorm:run   # 或依赖 TYPEORM_MIGRATIONS_RUN=true 在启动时执行
pnpm dev
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:1234 |
| 后端 | http://localhost:3000 |
| 代理 | Vite 将 `/api`、`/uploads` 转到后端 |

数据库结构只通过 `server/src/migrations/` 管理，禁止 `synchronize: true`。

---

## 生产部署（Docker 全栈）

```bash
cp server/.env.production.example server/.env.production
# 填写 DB 密码、MYSQL_ROOT_PASSWORD、JWT_SECRET(≥32)、管理员、HTTPS 域名、OAuth 等
pnpm docker:prod
```

| 服务 | 宿主机端口（默认） |
|------|-------------------|
| mysql | `127.0.0.1:3306`（可用 `DB_HOST_PORT` 覆盖） |
| server | `127.0.0.1:3000` |
| web (nginx) | `127.0.0.1:3001` |

生产注意：

- 容器内 server 连库：`DB_HOST=mysql`、`DB_PORT=3306`
- `FRONTEND_URL` 使用 HTTPS；`COOKIE_SECURE=true`
- SSL 由**宿主机 Nginx** 终结，再反代到 `3001`
- 上传与库数据在 Docker 命名卷中；`down -v` 会删卷，慎用
- 迁移：`TYPEORM_MIGRATIONS_RUN=true` 时 server 启动执行

```bash
pnpm docker:prod:logs
pnpm docker:prod:down
```

---

## 数据目录

- 运行时原图：`server/uploads/wallpapers/`（本地；生产为卷）
- 缩略图：`server/uploads/thumbnails/`
- 头像：`server/uploads/profile-pictures/`
- Demo 源图：`server/uploads/壁纸/`（可选 seed，不是运行时上传目录）

运行时上传文件默认不进 git；保留 `defaultAvatar` 与 seed 源图约定见 `.gitignore`。

## API 与权限

接口以 `server/src/controllers/` 为准。全局 `ValidationPipe` 校验；认证为 HttpOnly Cookie。

- `user`：浏览、互动、上传、论坛
- `admin`：内容与普通用户管理
- `super_admin`：最高权限

提交前建议：

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
git diff --check
```

编码约定与 Agent 约束见 **`AGENTS.md`**（`CLAUDE.md` 仅为入口指针）。
