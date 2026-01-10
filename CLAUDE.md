# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

现代化的壁纸管理系统，采用前后端分离的 **pnpm workspace** 架构，包含完整的用户认证、壁纸管理、论坛交互和内容审核功能：

- **后端服务** (server/): NestJS v11 + TypeScript + MySQL + TypeORM
- **前端应用** (web/): Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS + DaisyUI

### 关键架构决策

1. **ConfigService 优先**: 所有环境变量必须通过 `ConfigService.get()` 访问，不直接使用 `process.env`
2. **异步数据库配置**: TypeORM 使用 `forRootAsync` 确保 ConfigModule 先初始化
3. **认证安全**: JWT Token 存储在 HttpOnly Cookie 中，前端不处理 token，防止 XSS 攻击
4. **自动请求去重**: Axios 拦截器自动取消重复请求，避免网络浪费
5. **响应拦截器优化**: 直接返回 `response.data`，调用 API 时无需额外解包

## 快速开始

### 使用 pnpm (推荐)

```bash
# 安装依赖
pnpm install

# 同时启动前后端开发服务器
pnpm run dev

# 或分别启动
pnpm run dev:server  # 后端 (端口 3000)
pnpm run dev:web     # 前端 (端口 1234)

# 构建所有项目
pnpm run build
```

### 后端服务 (server/)

```bash
cd server

# 开发模式 (端口 3000)
pnpm run start:dev  # NestJS 内置热重载
pnpm run dev        # Nodemon 启动

# 生产构建和运行
pnpm run build      # 构建项目 (输出到 dist/)
npm run start:prod # 启动生产服务 (需要先构建)

# 测试
pnpm run test                    # 运行所有测试
pnpm run test -- test/file.spec.ts  # 运行单个测试文件
pnpm run test:e2e               # 运行端到端测试

# 数据库迁移 (TypeORM)
pnpm run typeorm:generate src/migrations/MigrationName  # 生成迁移文件
pnpm run typeorm:run                                 # 执行迁移
pnpm run typeorm:revert                              # 回滚迁移
pnpm run typeorm:show                                # 查看迁移状态

# 代码质量检查
npx eslint src/    # ESLint 检查
npx tsc --noEmit   # TypeScript 类型检查
```

### 前端应用 (web/)

```bash
cd web

# 开发模式 (端口 1234)
pnpm run dev        # Vite 开发服务器

# 生产构建
pnpm run build      # 构建生产版本
pnpm run preview    # 预览构建结果

# 代码质量检查
pnpm run lint                 # ESLint 检查
pnpm run lint:fix             # ESLint 自动修复
pnpm run type-check           # TypeScript 类型检查
pnpm run format               # Prettier 格式化
```

## 核心架构

### 环境变量管理 (重要)

**⚠️ 必须使用 ConfigService**: 所有环境变量必须通过 `ConfigService.get()` 访问,严禁直接使用 `process.env`

```typescript
// ✅ 正确 - 在 app.module.ts 中
TypeOrmModule.forRootAsync({
	imports: [ConfigModule],
	inject: [ConfigService],
	useFactory: (configService: ConfigService) => ({
		password: configService.get<string>("DB_PASSWORD"), // ConfigService 先加载
	}),
});

// ❌ 错误 - 直接使用 process.env
password: process.env.DB_PASSWORD; // 可能未定义,读取时机错误
```

**为什么这样设计?**

1. **加载顺序**: `ConfigModule.forRoot()` 必须在其他模块之前执行
2. **类型安全**: `configService.get<T>()` 提供类型推断
3. **验证支持**: 可以添加环境变量验证逻辑
4. **测试友好**: Mock ConfigService 比 Mock process.env 更容易

**关键文件:**

- `server/src/app.module.ts` - ConfigModule 和 TypeORM 异步配置
- `server/.env` - 所有环境变量定义
- `server/src/auth/jwt.strategy.ts` - JWT 密钥强制验证示例

### 技术栈

- **后端**: NestJS v11 + TypeORM + MySQL + JWT + Sharp + Multer
- **前端**: Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS + DaisyUI
- **认证**: JWT Token 存储在 HttpOnly Cookie 中

### 架构特点

- **模块化设计**: NestJS 模块化架构，每个功能领域独立成模块
- **前端组件化**: Vue 3 组合式 API + 组件化设计
- **数据库关系型**: 完整的实体关系设计，支持用户交互和内容审核
- **认证安全**: JWT + HttpOnly Cookie + Passport 认证策略

### 模块结构

```
server/src/
├── app.module.ts          # 根模块 - ConfigModule 和 TypeORM 异步配置
├── main.ts                # 应用入口文件
├── modules/               # 功能模块
│   ├── user.module.ts     # 用户管理、认证、头像上传
│   ├── wallpaper.module.ts # 壁纸核心功能（上传、搜索、管理）
│   ├── tag.module.ts      # 标签管理功能
│   ├── forum.module.ts    # 论坛系统（帖子、评论）
│   └── admin.module.ts    # 管理员功能（用户管理、审核、仪表盘）
├── controllers/           # RESTful API 控制器
│   ├── user.controller.ts
│   ├── wallpaper.controller.ts
│   ├── tag.controller.ts
│   ├── post.controller.ts      # 论坛帖子
│   ├── comment.controller.ts   # 评论系统
│   ├── report.controller.ts    # 举报审核
│   └── admin/             # 管理员控制器
│       ├── admin-user.controller.ts
│       ├── admin-wallpaper.controller.ts
│       ├── admin-report.controller.ts
│       └── admin-dashboard.controller.ts
├── services/              # 业务逻辑层
├── entities/              # 数据库实体
├── dto/                   # 数据传输对象 (DTO)
├── auth/                  # JWT 认证守卫、策略
├── decorators/            # 自定义装饰器 (如 @CurrentUser)
└── uploads/               # 上传文件目录

web/src/
├── main.ts                # 应用入口
├── App.vue                # 根组件
├── views/                 # 页面组件
│   ├── wallpaper/         # 壁纸相关页面
│   ├── user/              # 用户相关页面 (登录、注册、个人中心)
│   └── forums/            # 论坛功能
├── components/            # 可复用组件
├── stores/                # Pinia 状态管理
│   ├── auth.ts            # 用户认证状态
│   └── wallpaper.ts       # 壁纸相关状态
├── services/              # API 服务层
│   ├── admin.ts
│   ├── forum.ts
│   ├── report.ts
│   ├── tag.ts
│   ├── user.ts
│   └── wallpaper.ts
├── config/                # 配置文件
│   └── api/               # Axios 配置 (拦截器、请求去重)
├── router/                # 路由配置和守卫
├── utils/                 # 工具函数
└── composables/          # 组合式函数
    └── useToast.ts        # Toast 通知系统
```

### 数据库设计 (MySQL)

完整的关系型数据库设计，包含以下核心实体：

- **User**: 用户信息（密码哈希存储），支持头像上传和个人资料管理
- **Wallpaper**: 壁纸元数据和文件信息，包含下载次数、点赞数等统计数据
- **Tag**: 标签系统，支持使用次数统计和热门标签查询
- **WallpaperTag**: 壁纸标签多对多关联表
- **Post**: 论坛帖子系统，支持富文本内容
- **Comment**: 评论系统，支持嵌套回复
- **UserLike**: 用户点赞记录（支持壁纸和帖子点赞）
- **UserFavorite**: 用户收藏记录
- **ViewHistory**: 用户浏览历史记录
- **Report**: 举报审核系统，用于内容管理
- **CommentLike/PostLike**: 评论和帖子的点赞记录

**实体位置**: `server/src/entities/`

### 数据流和架构

- **Repository 模式**: 使用 TypeORM Repository 进行数据访问
- **服务层**: 业务逻辑封装在 services/ 目录
- **控制器层**: 处理 HTTP 请求和响应
- **DTO 验证**: 使用 class-validator 进行输入验证和转换

### API 设计规范

- **RESTful 风格**: 遵循 REST 设计原则
- **统一响应格式**: `{ success: boolean, message?: string, data?: any }`
- **认证机制**:
  - JWT Token 存储在 HttpOnly Cookie 中
  - 所有敏感接口使用 `JwtAuthGuard` 保护
  - 使用 `@CurrentUser()` 装饰器获取认证用户信息
- **查询支持**:
  - 分页查询 (`?page=1&limit=20`)
  - 多条件筛选 (`?tag=xxx&sort=createdAt&order=desc`)
  - 搜索功能 (`?search=keyword`)
- **数据验证**: DTO + class-validator 进行输入验证和转换
- **错误处理**: 统一的异常过滤器和错误响应格式

### API 端点概览

主要路由前缀：

- `/api/users` - 用户管理（注册、登录、个人资料、头像上传）
- `/api/wallpapers` - 壁纸管理（上传、搜索、详情、点赞、收藏）
- `/api/tags` - 标签系统（标签列表、热门标签）
- `/api/posts` - 论坛帖子（CRUD、点赞）
- `/api/comments` - 评论系统（CRUD、嵌套回复、点赞）
- `/api/reports` - 举报系统（用户举报、管理员审核）
- `/api/admin/*` - 管理员功能（用户管理、壁纸管理、数据统计）

### 前端架构亮点

- **API 服务层**:
  - 封装完整的 Axios 实例和拦截器
  - 自动处理重复请求取消和统一错误处理
  - 响应拦截器直接返回 `response.data`，调用时无需额外解包
- **状态管理**:
  - Pinia store 管理用户状态和壁纸数据
  - 支持 localStorage 持久化
  - 响应式状态更新
- **路由系统**:
  - Vue Router 4 支持路由守卫和权限控制
  - 自动页面标题设置
  - 登录状态检查和重定向逻辑
- **UI 框架**:
  - Tailwind CSS + DaisyUI 组件库
  - 响应式设计支持
  - 深色模式支持

### 文件上传处理

- **存储路径**:
  - `/uploads/wallpapers/` - 原始壁纸文件
  - `/uploads/thumbnails/` - 自动生成的缩略图
  - `/uploads/profile-pictures/` - 用户头像
- **支持格式**: JPG/PNG/WebP/GIF
- **文件限制**: 最大 20MB
- **自动处理**:
  - Sharp 库生成多尺寸缩略图（200px, 500px）
  - UUID 文件名避免文件名冲突
  - 自动优化图片大小和格式
- **静态文件服务**: Express 静态文件中间件，支持 `/uploads/*` 路径访问

### 开发代理配置

前端通过 Vite 代理访问后端：

- `/api/*` → `http://localhost:3000`
- `/uploads/*` → `http://localhost:3000` (静态文件服务)

### 常用开发工作流程

#### 1. 添加新功能

1. 在 `server/src/modules/` 创建新模块
2. 定义实体 (`entities/`)
3. 创建 DTO (`dto/`)，使用 class-validator 进行验证
4. 实现服务层 (`services/`)，使用 TypeORM Repository
5. 添加控制器 (`controllers/`)，使用 `@CurrentUser()` 装饰器获取认证用户
6. 更新模块注册 (`modules/xxx.module.ts`)
7. 更新前端 API 服务 (`web/src/services/`)

#### 2. 数据库变更

**重要**: 生产环境必须使用迁移，开发环境可使用 `synchronize: true`

1. 生成迁移: `cd server && npm run typeorm:generate src/migrations/Name`
2. 检查迁移文件内容
3. 应用迁移: `npm run typeorm:run`
4. 如需回滚: `npm run typeorm:revert`

#### 3. 代码提交前检查

```bash
# 后端
cd server
npm run lint
npm run type-check
npm test

# 前端
cd web
npm run lint
npm run type-check

# 或在根目录
pnpm run lint
pnpm run type-check
pnpm test
```

#### 4. 调试技巧

- 后端日志: NestJS 默认启用日志，记录请求和错误
- 数据库查询: TypeORM 启用 `logging: true` 查看 SQL
- 前端调试: Vue DevTools 浏览器扩展
- 网络请求: 浏览器开发者工具 Network 面板

### 前端重要提示

1. **API 调用无需解包**: 由于响应拦截器已处理，API 调用直接返回 `data`

   ```typescript
   // ✅ 正确
   const wallpapers = await wallpaperService.getWallpapers();
   // ❌ 错误
   const response = await wallpaperService.getWallpapers();
   const data = response.data;
   ```

2. **认证用户信息**: 使用 `authStore.user` 获取当前登录用户信息
3. **登录过期处理**: 全局监听登录过期事件，自动清除用户信息并跳转登录页

### 后端重要提示

1. **认证保护**: 敏感接口使用 `@UseGuards(JwtAuthGuard)` 保护
2. **获取当前用户**: 使用 `@CurrentUser()` 装饰器，无需手动解析 JWT
3. **权限控制**: 在服务层检查用户权限，确保用户只能操作自己的内容
4. **文件上传**: 使用 Multer + Sharp 自动生成缩略图，UUID 避免文件名冲突

## 重要配置

### 环境变量 (server/.env)

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-password
DB_DATABASE=wallpaper_site

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=180d

# 服务端口
PORT=3000

# GitHub OAuth 配置
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:1234/auth/github/callback
```

**获取 GitHub OAuth 凭证:**

1. 访问 https://github.com/settings/developers
2. 创建 OAuth App (Homepage: `http://localhost:1234`, Callback: `http://localhost:1234/auth/github/callback`)
3. 复制 Client ID 和 Client Secret 到 `.env` 文件

### 认证系统

- **存储方式**: JWT Token 存储在 HttpOnly Cookie 中（非 localStorage）
- **安全机制**: 前端只保存用户信息，不处理 token
- **权限控制**: 基于 Passport 的认证策略，用户只能操作自己的内容
- **过期处理**: 前端全局监听 401 响应，自动清除用户信息并跳转登录页

### 数据库配置

- **开发环境**: `synchronize: true` 自动同步实体到数据库（仅开发环境）
- **生产环境**: 必须使用迁移文件管理数据库变更
- **配置方式**: 使用 `ConfigService.forRootAsync()` 在 `app.module.ts` 中配置
- **数据库**: MySQL 8.0+
- **迁移文件位置**: `server/src/migrations/`

### 关键文件位置

- **后端认证**: `server/src/auth/` - JWT 守卫、策略、@CurrentUser 装饰器
- **前端 API 服务**: `web/src/services/api.ts` - Axios 实例和拦截器配置
- **前端认证 Store**: `web/src/stores/auth.ts` - 用户认证状态管理
- **路由守卫**: `web/src/router/index.ts` - 登录状态检查和重定向

### 代码质量保障

- **TypeScript**: 严格模式 (`"strict": true`)
- **ESLint**: 统一的代码规范检查
- **Prettier**: 自动代码格式化（web/ 目录）
- **Jest**: 单元测试和端到端测试（server/ 目录）
- **类型检查**: `pnpm run type-check` 同时检查前后端类型

### 工作区命令（根目录）

```bash
pnpm run dev          # 同时启动前后端开发服务器
pnpm run dev:server   # 仅启动后端（端口 3000）
pnpm run dev:web      # 仅启动前端（端口 1234）
pnpm run build        # 构建所有项目
pnpm run lint         # 运行所有 lint 检查
pnpm run type-check   # 运行所有类型检查
pnpm run test         # 运行所有测试
```

### 性能和优化

- **后端优化**:
  - 数据库索引优化（主键、外键、查询字段）
  - 分页查询避免大数据量加载
  - Sharp 图像处理和缓存
  - 请求去重和取消机制
- **前端优化**:
  - Vite 快速热重载
  - 路由懒加载
  - 图片懒加载
  - 响应式图片

## 部署注意事项

### 必需环境变量

```bash
# 后端 (.env)
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=180d
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-password
DB_DATABASE=wallpaper_site
PORT=3000
```

### 部署步骤

1. **后端部署**:

   - 安装依赖: `cd server && pnpm install --prod`
   - 构建项目: `npm run build`
   - 运行迁移: `npm run typeorm:run`
   - 启动服务: `npm run start:prod`

2. **前端部署**:

   - 安装依赖: `cd web && pnpm install`
   - 构建项目: `npm run build`
   - 部署 `dist/` 目录到静态文件服务器（nginx、Apache 等）

3. **数据库**:
   - 创建 MySQL 数据库
   - 配置用户权限
   - 运行迁移脚本

### 生产环境注意事项

1. **安全性**:

   - 更改默认 JWT 密钥
   - 启用 HTTPS
   - 配置 CORS 白名单
   - 设置适当的文件上传限制

2. **文件存储**:

   - `/uploads/` 目录需要持久化存储
   - 考虑使用对象存储（AWS S3、阿里云 OSS）
   - 配置定期清理临时文件

3. **监控和日志**:

   - 配置日志轮转
   - 设置错误监控
   - 数据库性能监控

4. **扩展性**:
   - 考虑水平扩展
   - 配置负载均衡
   - 启用 Redis 缓存（可扩展）

### 常见问题排查

- **端口占用**: `lsof -ti:3000 | xargs kill -9`
- **数据库连接失败**: 检查 `.env` 配置和数据库服务状态
- **文件上传失败**: 检查 `/uploads/` 目录权限
- **CORS 错误**: 检查后端 CORS 配置
- **TypeScript 编译错误**: 运行 `npx tsc --noEmit` 检查类型
