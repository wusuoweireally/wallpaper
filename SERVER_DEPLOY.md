# 服务器部署完整指南

## 前置条件

- Linux 服务器（推荐 Ubuntu 22.04 / Debian 12 / CentOS 9）
- 域名已解析到服务器 IP（rain-gem.top → 服务器 IP）
- SSH 登录服务器

---

## 第一步：安装基础环境

### Ubuntu / Debian

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl git

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 将当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER

# 重新登录使生效，或执行：
newgrp docker

# 验证安装
docker --version
docker compose version
```

### CentOS / Rocky Linux

```bash
# 更新系统
sudo dnf update -y

# 安装必要工具
sudo dnf install -y curl git

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户加入 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker --version
docker compose version
```

---

## 第二步：克隆项目

```bash
# 进入你想放项目的目录
cd /opt

# 克隆仓库
sudo git clone https://github.com/wusuoweireally/wallpaper.git

# 修改目录权限
sudo chown -R $USER:$USER /opt/wallpaper

# 进入项目目录
cd wallpaper
```

---

## 第三步：配置环境变量

### 3.1 创建生产环境配置

```bash
# 从模板创建配置文件
cp server/.env.production.example server/.env.production
cp .env.prod.example .env.prod
```

### 3.2 编辑配置文件

```bash
# 编辑后端配置
nano server/.env.production
```

**必须修改的配置：**

```bash
# 数据库密码（改成你的强密码）
DB_PASSWORD=YourStr0ngP@ss!2024

# JWT 密钥（用下面的命令生成）
JWT_SECRET=（粘贴生成的密钥）

# 管理员密码
ADMIN_USER_PASSWORD=YourAdminP@ss

# GitHub OAuth（从 GitHub 获取）
GITHUB_CLIENT_ID=你的ClientID
GITHUB_CLIENT_SECRET=你的ClientSecret
GITHUB_CALLBACK_URL=https://rain-gem.top/api/auth/github/callback
FRONTEND_URL=https://rain-gem.top
```

**生成 JWT 密钥：**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.3 编辑 Docker 环境变量

```bash
nano .env.prod
```

**修改为和 DB_PASSWORD 一致：**

```bash
MYSQL_ROOT_PASSWORD=YourStr0ngP@ss!2024
```

---

## 第四步：构建并启动服务

```bash
# 构建镜像并启动（首次需要构建，耗时较长）
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

# 查看启动状态
docker compose -f docker-compose.prod.yml ps

# 查看日志（等待所有服务启动完成）
docker compose -f docker-compose.prod.yml logs -f
```

**等待看到以下日志表示启动成功：**
- mysql: `ready for connections`
- server: `应用启动成功！`
- web: `nginx: [notice]`

按 `Ctrl+C` 退出日志查看。

---

## 第五步：验证服务

```bash
# 检查容器状态（应该都是 running）
docker ps

# 测试后端 API
curl http://localhost:3000/tags

# 测试前端
curl -I http://localhost:80
```

---

## 第六步：配置域名和 HTTPS（推荐）

### 6.1 安装 Nginx（宿主机）

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS
sudo dnf install -y nginx
```

### 6.2 安装 Certbot（免费 SSL 证书）

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS
sudo dnf install -y certbot python3-certbot-nginx
```

### 6.3 申请 SSL 证书

```bash
# 先确保 80 端口没有被占用
sudo systemctl stop nginx

# 申请证书
sudo certbot certonly --standalone -d rain-gem.top -d www.rain-gem.top
```

### 6.4 配置 Nginx 反向代理

```bash
sudo nano /etc/nginx/sites-available/wallpaper
```

**写入以下配置：**

```nginx
# HTTP -> HTTPS 重定向
server {
    listen 80;
    server_name rain-gem.top www.rain-gem.top;
    return 301 https://$host$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl;
    server_name rain-gem.top www.rain-gem.top;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/rain-gem.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rain-gem.top/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 上传大小限制
    client_max_body_size 50m;

    # 代理到 Docker 容器
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.5 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/wallpaper /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6.6 自动续期证书

```bash
# 测试续期
sudo certbot renew --dry-run

# 添加定时任务
sudo crontab -e
# 添加这行：
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

---

## 第七步：防火墙配置

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 常用运维命令

### 服务管理

```bash
# 查看容器状态
docker ps

# 查看日志
docker compose -f docker-compose.prod.yml logs -f

# 重启服务
docker compose -f docker-compose.prod.yml restart

# 停止服务
docker compose -f docker-compose.prod.yml down

# 启动服务
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d

# 重新构建并启动（代码更新后）
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

### 代码更新

```bash
cd /opt/wallpaper

# 拉取最新代码
git pull origin main

# 重新构建并重启
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

### 数据库备份

```bash
# 备份
docker exec wallpaper-mysql-1 mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" wallpaper_site > backup_$(date +%Y%m%d).sql

# 恢复
docker exec -i wallpaper-mysql-1 mysql -uroot -p"$MYSQL_ROOT_PASSWORD" wallpaper_site < backup.sql
```

### 查看容器资源占用

```bash
docker stats
```

---

## GitHub OAuth 配置

1. 访问 https://github.com/settings/developers
2. 点击 **New OAuth App**
3. 填写：
   - **Application name**: 随心壁纸
   - **Homepage URL**: `https://rain-gem.top`
   - **Authorization callback URL**: `https://rain-gem.top/api/auth/github/callback`
4. 点击 **Register application**
5. 复制 **Client ID**
6. 点击 **Generate a new client secret**，复制密钥
7. 填入 `server/.env.production` 对应位置

---

## 常见问题

### 端口被占用

```bash
# 查看占用端口的进程
sudo lsof -i :80
sudo lsof -i :3306

# 杀掉进程
sudo kill -9 <PID>
```

### 容器启动失败

```bash
# 查看详细日志
docker compose -f docker-compose.prod.yml logs server
docker compose -f docker-compose.prod.yml logs mysql
```

### 数据库连接失败

```bash
# 进入 MySQL 容器测试
docker exec -it wallpaper-mysql-1 mysql -uroot -p

# 检查密码是否一致
cat server/.env.production | grep DB_PASSWORD
cat .env.prod | grep MYSQL_ROOT_PASSWORD
```

### GitHub 登录失败

1. 检查 GitHub OAuth App 的 Callback URL 是否正确
2. 检查 `server/.env.production` 中的 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`
3. 查看日志：`docker compose -f docker-compose.prod.yml logs server | grep github`
