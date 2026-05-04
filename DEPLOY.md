# 部署指南

## 环境说明

| 环境 | 数据库 | 前端 | 后端 | 用途 |
|------|--------|------|------|------|
| 开发环境 | 本地 MySQL | Vite Dev Server (1234) | NestJS Dev (3000) | 本地开发调试 |
| 生产环境 | Docker MySQL | Nginx (80/443) | Docker Node (3000) | 线上部署 |

---

## 开发环境

### 前置条件

- Node.js >= 18
- pnpm >= 8
- MySQL 8.0+ (通过 Homebrew 安装)

### 启动步骤

```bash
# 1. 确保本地 MySQL 已启动
brew services start mysql

# 2. 安装依赖
pnpm install

# 3. 启动前后端开发服务器
pnpm dev
```

### 访问地址

- 前端: http://localhost:1234
- 后端 API: http://localhost:3000
- 数据库: localhost:3306

### 配置文件

- `server/.env.development` - 后端环境变量

---

## 生产环境 (Docker 部署)

### 前置条件

- Docker & Docker Compose
- 域名（可选，配置 HTTPS）

### 部署步骤

```bash
# 1. 修改生产环境配置
# 编辑 server/.env.production，修改以下关键配置：
# - DB_PASSWORD: 数据库强密码
# - JWT_SECRET: 随机密钥（用命令生成）
# - ADMIN_USER_PASSWORD: 管理员密码
# - GITHUB_CLIENT_SECRET: GitHub OAuth 密钥

# 2. 生成 JWT 密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. 构建并启动容器
pnpm docker:prod

# 4. 查看日志
pnpm docker:prod:logs
```

### 访问地址

- 前端: http://your-server-ip (80 端口)
- 后端 API: http://your-server-ip/api/

### 配置文件

| 文件 | 说明 |
|------|------|
| `server/.env.production` | 后端环境变量 |
| `docker-compose.prod.yml` | Docker 服务编排 |
| `docker/nginx/conf.d/prod.conf` | Nginx 配置 |

### 常用命令

```bash
# 启动服务
pnpm docker:prod

# 停止服务
pnpm docker:prod:down

# 查看日志
pnpm docker:prod:logs

# 重新构建并启动
pnpm docker:prod

# 进入容器调试
docker exec -it wallpaper-system-server-1 sh
docker exec -it wallpaper-system-mysql-1 mysql -uroot -p

# 数据库备份
docker exec wallpaper-system-mysql-1 mysqldump -uroot -p wallpaper_site > backup.sql

# 数据库恢复
docker exec -i wallpaper-system-mysql-1 mysql -uroot -p wallpaper_site < backup.sql
```

---

## 配置 HTTPS（推荐）

### 方式一：Let's Encrypt 免费证书

```bash
# 1. 安装 certbot
brew install certbot  # macOS
apt install certbot   # Ubuntu

# 2. 获取证书
certbot certonly --standalone -d rain-gem.top

# 3. 证书位置
# /etc/letsencrypt/live/rain-gem.top/fullchain.pem
# /etc/letsencrypt/live/rain-gem.top/privkey.pem

# 4. 修改 nginx 配置，取消 SSL 相关注释
# 5. 重启服务
pnpm docker:prod
```

### 方式二：云服务商 SSL 证书

1. 在云服务商（阿里云/腾讯云）申请免费 SSL 证书
2. 下载证书文件放到 `nginx/ssl/` 目录
3. 修改 `docker/nginx/conf.d/prod.conf` 中的证书路径
4. 重启服务

---

## 环境变量说明

### 必须修改的配置

| 变量 | 说明 | 示例 |
|------|------|------|
| `DB_PASSWORD` | 数据库密码 | `YourStr0ngP@ss!` |
| `JWT_SECRET` | JWT 签名密钥 | 64位随机字符串 |
| `ADMIN_USER_PASSWORD` | 管理员密码 | `AdminP@ss123` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | 从 GitHub 获取 |

### 可选配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `JWT_EXPIRES_IN` | Token 过期时间 | `180d` |
| `COOKIE_SECURE` | Cookie HTTPS 限制 | `true` (生产) |
| `ENABLE_DEMO_SEED` | 启用演示数据 | `false` (生产) |

---

## 目录结构

```
wallpaper/
├── server/
│   ├── .env.development    # 开发环境配置
│   ├── .env.production     # 生产环境配置
│   └── Dockerfile          # 后端镜像构建
├── web/
│   └── Dockerfile          # 前端镜像构建
├── docker/
│   └── nginx/
│       └── conf.d/
│           ├── default.conf  # 默认 Nginx 配置
│           └── prod.conf     # 生产环境 Nginx 配置
├── docker-compose.yml        # 原始配置（参考用）
├── docker-compose.dev.yml    # 开发环境 Docker
└── docker-compose.prod.yml   # 生产环境 Docker
```

---

## 常见问题

### 端口被占用

```bash
# 查看占用端口的进程
lsof -i :80
lsof -i :3306

# 杀掉进程
kill -9 <PID>
```

### 数据库连接失败

```bash
# 检查 MySQL 容器状态
docker ps | grep mysql

# 查看 MySQL 日志
docker logs wallpaper-system-mysql-1

# 测试连接
docker exec -it wallpaper-system-mysql-1 mysql -uroot -p
```

### 文件上传失败

```bash
# 检查上传目录权限
ls -la server/uploads/

# 修复权限
chmod 755 server/uploads/
```

### 容器无法启动

```bash
# 查看详细日志
docker compose -f docker-compose.prod.yml logs

# 检查镜像构建
docker images | grep wallpaper
```
