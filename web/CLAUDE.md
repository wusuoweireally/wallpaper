# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 接口文档在 /Users/tuzhitao/code/Person_like/wallpaper/server/src/controllers

## 开发命令

- `npm run dev` - 启动开发服务器 (端口 1234)
- `npm run build` - 构建生产版本 (包含类型检查)
- `npm run preview` - 预览生产构建

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **样式**: Tailwind CSS + DaisyUI
- **构建工具**: Vite
- **HTTP 客户端**: Axios

## 项目结构

- `src/views/` - 页面组件
- `src/components/` - 可复用组件
- `src/stores/` - Pinia 状态管理
- `src/router/` - 路由配置
- `src/config/api/` - API 配置
- `src/services/` - 服务层

## API 配置

- 后端接口通过 `/api` 代理到 `http://localhost:3000`
- API 响应格式: `{ success: boolean, message?: string, data?: any }`
- 使用 HttpOnly cookie 进行认证，无需手动处理 token

## 路由系统

- 支持路由守卫和权限控制
- 页面标题自动设置
- 包含登录状态检查和重定向逻辑

## 状态管理

- 用户状态存储在 Pinia store 中
- 支持 localStorage 持久化
- 包含登录、注册、登出等完整用户操作
- 配置了响应请求拦截器,直接返回的数据是response.data因此调用接口时不需要通过response.data获取后端的返回的数据
