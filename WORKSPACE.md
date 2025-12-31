# Pnpm 工作区使用指南

## 什么是 Pnpm 工作区？

Pnpm 工作区（Workspaces）是 pnpm 提供的一个功能，允许你在一个代码库中管理多个包或项目。这对于像我们的壁纸系统这样采用前后端分离架构的项目非常有用。

## 工作区结构

```
wallpaper/
├── pnpm-workspace.yaml       # 定义工作区包含的包
├── package.json              # 根包配置
├── server/                   # 后端服务 (NestJS)
└── web/                      # 前端应用 (Vue 3)
```

## 优势

### 1. 统一依赖管理
- 共享依赖：在根级别安装依赖，子包可以复用，避免重复下载
- 统一的版本控制：确保所有包使用相同版本的依赖
- 更好的磁盘利用：pnpm 使用链接机制，节省磁盘空间

### 2. 简化的命令
- 一键安装：在根目录运行 `pnpm install` 会安装所有包的依赖
- 跨包脚本：可以同时运行所有包的脚本
- 统一构建：一键构建整个项目

### 3. 更清晰的架构
- 项目结构一目了然
- 易于维护和扩展
- 便于团队协作

## 常用命令

### 安装依赖
```bash
# 安装所有包的依赖
pnpm install

# 仅在根目录安装依赖
pnpm add -w <package-name>

# 在特定包中安装依赖
pnpm -C server add <package-name>
pnpm -C web add <package-name>
```

### 运行脚本
```bash
# 运行所有包的 dev 脚本
pnpm dev

# 运行特定包的脚本
pnpm -C server dev
pnpm -C web dev

# 运行特定包的构建
pnpm -C web build
pnpm -C server build

# 同时运行所有包的 lint
pnpm lint
```

### 构建项目
```bash
# 构建所有包
pnpm build

# 分别构建
pnpm build:server
pnpm build:web
```

### 测试
```bash
# 运行所有包的测试
pnpm test

# 运行特定包的测试
pnpm -C server test
```

## 项目脚本说明

在根 `package.json` 中，我们配置了以下脚本：

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 同时启动前后端开发服务器 |
| `pnpm dev:server` | 仅启动后端开发服务器 |
| `pnpm dev:web` | 仅启动前端开发服务器 |
| `pnpm build` | 构建整个项目 |
| `pnpm lint` | 运行所有包的 ESLint 检查 |
| `pnpm type-check` | 运行所有包的类型检查 |

## 最佳实践

1. **安装依赖**
   - 开发依赖建议在根目录安装 (`pnpm add -w -D <package>`)
   - 应用依赖在对应包中安装

2. **脚本组织**
   - 通用脚本放在根目录
   - 特定脚本放在各自包中

3. **版本管理**
   - 使用统一的 Node.js 版本（参考 .nvmrc）
   - 锁定 pnpm 版本以确保一致性

## 注意事项

- 确保所有包都使用相同的 pnpm 版本
- 避免在子包中重复安装已在根目录安装的依赖
- 合理使用工作区隔离，必要时使用 `--filter` 选项

## 参考资料

- [Pnpm Workspaces 官方文档](https://pnpm.io/workspaces)
- [Monorepo 最佳实践](https://pnpm.io/monorepo)
