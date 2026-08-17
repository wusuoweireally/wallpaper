# Wallbay

前后端分离的壁纸分享社区：浏览、筛选、上传、收藏、标签、论坛与管理后台。

| 目录 | 技术 |
|------|------|
| `server/` | NestJS、TypeORM、MySQL、Jest |
| `web/` | Vue 3、Vite、Pinia、Tailwind |
| 根目录 | pnpm workspace、Docker Compose |

**环境**：Node 20.19+（推荐 22，见 `.nvmrc`）、pnpm 10+。锁文件只用根目录 `pnpm-lock.yaml`。

---

## 两种跑法

### A. 本地开发（推荐日常）

Docker **只跑 MySQL**，前后端本机：

```bash
pnpm install --frozen-lockfile
cp server/.env.development.example server/.env.development
# 填 DB_PASSWORD、MYSQL_ROOT_PASSWORD、JWT_SECRET(≥16)；上传需 COS_*

pnpm db:up          # 起 MySQL → 127.0.0.1:3306
pnpm -C server typeorm:run   # 首次或迁移变更时
pnpm dev            # 前端 :1234  后端 :3000（Vite 代理 /api、/uploads）
```

| 变量要点 | 本地 |
|----------|------|
| `DB_HOST` | `127.0.0.1` |
| `COOKIE_SECURE` | `false` |
| `FRONTEND_URL` | `http://localhost:1234` |

停库：`pnpm db:down`。端口冲突时设 `DB_HOST_PORT` / `DB_PORT`（如 3307）。

### B. 生产部署（Docker 全栈）

```bash
cp server/.env.production.example server/.env.production
# 必填：DB_PASSWORD、MYSQL_ROOT_PASSWORD、JWT_SECRET(≥32)、COS_*、
# ADMIN_*、FRONTEND_URL(https)、COOKIE_SECURE=true；OAuth 按需

pnpm deploy         # 构建并后台启动 mysql + server + web
pnpm deploy:logs    # 看日志
pnpm deploy:down    # 停止（加 -v 会删数据卷，慎用）
```

| 服务 | 地址 |
|------|------|
| web（对外入口） | `127.0.0.1:3001` |
| server | `127.0.0.1:3000`（一般只给排障） |
| mysql | `127.0.0.1:3306` |

- 容器内数据库主机固定为 `mysql`（compose 已写死，不必在 env 里纠结）
- 迁移：`TYPEORM_MIGRATIONS_RUN=true` 时 server 启动自动跑
- **TLS 在宿主机 Nginx/Caddy** 终结，反代到 `http://127.0.0.1:3001`
- 壁纸/头像存 COS；库数据在 Docker volume，`deploy:down` 默认保留卷

宿主机反代示例：

```nginx
location / {
  proxy_pass http://127.0.0.1:3001;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  client_max_body_size 32m;
}
```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` / `build` / `lint` / `type-check` / `test` | 开发与质量 |
| `pnpm db:up` / `db:down` | 本地 MySQL |
| `pnpm deploy` / `deploy:logs` / `deploy:down` | 生产全栈 |
| `pnpm -C server\|web …` | 单包子命令（format、typeorm 等） |

提交前建议：`pnpm type-check && pnpm lint && pnpm test && pnpm build`

---

## 数据与约定

- 上传走腾讯云 COS（桶私有写公开读，审核通过即公开）
- Demo 源图：`server/uploads/壁纸/`（seed 用）
- 表结构只走 `server/src/migrations/`，禁止 `synchronize: true`
- 认证：HttpOnly Cookie `Authentication`；接口见 `server/src/controllers/`
- 编码与 Agent 约束：`AGENTS.md`
