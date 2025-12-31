# 壁纸管理系统 API 文档

## 📋 目录

- [认证系统](#认证系统)
- [用户管理](#用户管理)
- [壁纸管理](#壁纸管理)
- [标签系统](#标签系统)
- [论坛系统](#论坛系统)
- [评论系统](#评论系统)
- [举报审核](#举报审核)
- [管理员功能](#管理员功能)
- [GitHub OAuth 认证](#github-oauth-认证)

---

## 📐 通用说明

### 基础 URL
```
开发环境: http://localhost:3000
生产环境: {SERVER_URL}
```

### 认证方式
- **JWT Token** 存储在 **HttpOnly Cookie** 中
- Cookie 名称: `Authentication`
- Cookie 有效期: 60 天
- 需要认证的接口会自动验证 Cookie 中的 Token

### 统一响应格式
```typescript
// 成功响应
{
  success: true,
  message?: string,
  data?: any,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}

// 失败响应
{
  success: false,
  message: string,
  error?: any
}
```

### 守卫 (Guards)
- `JwtAuthGuard` - 需要登录
- `OptionalJwtAuthGuard` - 可选登录
- `RolesGuard` - 需要特定角色权限

---

## 🔐 认证系统

### 1. 用户注册

**接口地址:** `POST /api/users/register`

**认证要求:** ❌ 无需认证

**请求参数:**
```json
{
  "id": 123456,                    // [必填] 用户ID (数字)
  "username": "张三",              // [可选] 用户名 (1-50字符)
  "email": "user@example.com",     // [可选] 邮箱
  "password": "password123",       // [必填] 密码 (6-20字符)
  "bio": "这是我的个人简介"        // [可选] 个人简介 (0-500字符)
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": 123456,
    "username": "张三",
    "email": "user@example.com",
    "bio": "这是我的个人简介",
    "avatarUrl": null,
    "role": "user",
    "status": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 用户登录

**接口地址:** `POST /api/users/login`

**认证要求:** ❌ 无需认证

**请求参数:**
```json
{
  "id": 123456,                   // [必填] 用户ID
  "password": "password123"       // [必填] 密码
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 123456,
      "username": "张三",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookie 设置:**
- 名称: `Authentication`
- 值: JWT Token
- 有效期: 60 天
- HttpOnly: true
- Secure: 生产环境为 true

---

### 3. 用户退出

**接口地址:** `POST /api/users/logout`

**认证要求:** ✅ 需要登录 (OptionalJwtAuthGuard)

**请求参数:** 无

**返回数据:**
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

---

### 4. GitHub OAuth 登录

**接口地址:** `GET /api/auth/github`

**认证要求:** ❌ 无需认证

**说明:** 发起 GitHub OAuth 授权,重定向到 GitHub 授权页面

---

### 5. GitHub OAuth 回调

**接口地址:** `GET /api/auth/github/callback`

**认证要求:** ❌ 无需认证 (由 GitHub 回调)

**说明:** GitHub 授权成功后的回调端点,自动创建用户并设置 Cookie

**重定向目标:**
- 成功: `/auth/github/success`
- 失败: `/auth/github/failure?error=xxx`

---

### 6. GitHub 登录成功

**接口地址:** `GET /api/auth/github/success`

**认证要求:** ❌ 无需认证

**返回数据:**
```json
{
  "success": true,
  "message": "GitHub 登录成功"
}
```

---

### 7. GitHub 登录失败

**接口地址:** `GET /api/auth/github/failure`

**认证要求:** ❌ 无需认证

**查询参数:**
- `error` - 错误信息

**返回数据:**
```json
{
  "success": false,
  "message": "GitHub 登录失败",
  "error": "错误详情"
}
```

---

## 👥 用户管理

### 1. 获取当前用户信息

**接口地址:** `GET /api/users/profile`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**请求参数:** 无 (从 Token 中获取用户ID)

**返回数据:**
```json
{
  "success": true,
  "data": {
    "id": 123456,
    "username": "张三",
    "email": "user@example.com",
    "bio": "这是我的个人简介",
    "avatarUrl": "user_123456_1234567890.jpg",
    "role": "user",
    "status": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 获取用户列表 (管理员)

**接口地址:** `GET /api/users`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**查询参数:**
```
page?: number      // 页码,默认 1
limit?: number     // 每页数量,默认 10
username?: string  // 搜索用户名
```

**返回数据:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 123456,
        "username": "张三",
        "email": "user@example.com",
        "role": "user",
        "status": 1
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

### 3. 获取指定用户信息

**接口地址:** `GET /api/users/:id`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 用户ID (数字)

**返回数据:**
```json
{
  "success": true,
  "data": {
    "id": 123456,
    "username": "张三",
    "email": "user@example.com",
    "bio": "这是我的个人简介",
    "avatarUrl": "user_123456_1234567890.jpg",
    "role": "user",
    "status": 1
  }
}
```

---

### 4. 更新用户信息

**接口地址:** `PATCH /api/users/:id`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)
**权限:** 仅限本人或管理员

**路径参数:**
- `id` - 用户ID (数字)

**请求参数:**
```json
{
  "username": "新用户名",              // [可选] 1-50字符
  "email": "newemail@example.com",     // [可选]
  "password": "newpassword123",        // [可选] 6-20字符
  "avatarUrl": "new_avatar.jpg",       // [可选]
  "bio": "新的个人简介"                // [可选] 0-500字符
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": 123456,
    "username": "新用户名",
    "email": "newemail@example.com",
    "bio": "新的个人简介",
    "avatarUrl": "new_avatar.jpg"
  }
}
```

---

### 5. 删除用户

**接口地址:** `DELETE /api/users/:id`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)
**权限:** 仅限本人或管理员

**路径参数:**
- `id` - 用户ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

### 6. 禁用/启用用户 (管理员)

**接口地址:** `PATCH /api/users/:id/toggle-status`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 用户ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "用户已启用",
  "data": {
    "id": 123456,
    "status": 1
  }
}
```

---

### 7. 上传用户头像

**接口地址:** `POST /api/users/:id/avatar`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)
**权限:** 仅限本人或管理员

**路径参数:**
- `id` - 用户ID (数字)

**请求参数:**
- `Content-Type: multipart/form-data`
- `avatar` - 图片文件

**文件限制:**
- 支持格式: JPG, JPEG, PNG, GIF, WEBP
- 最大文件大小: 20MB

**返回数据:**
```json
{
  "success": true,
  "message": "头像上传成功",
  "data": {
    "avatarUrl": "user_123456_1234567890.jpg",
    "user": {
      "id": 123456,
      "avatarUrl": "user_123456_1234567890.jpg"
    }
  }
}
```

---

### 8. 获取用户点赞的壁纸

**接口地址:** `GET /api/users/likes`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**查询参数:**
```
page?: number   // 页码,默认 1
limit?: number  // 每页数量,默认 20
```

**返回数据:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "精美壁纸",
      "fileUrl": "wallpaper_uuid.jpg",
      "thumbnailUrl": "thumbnail_200_wallpaper_uuid.jpg",
      "likeCount": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### 9. 获取用户收藏的壁纸

**接口地址:** `GET /api/users/favorites`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**查询参数:**
```
page?: number   // 页码,默认 1
limit?: number  // 每页数量,默认 20
```

**返回数据:** 同"获取用户点赞的壁纸"

---

### 10. 获取用户浏览历史

**接口地址:** `GET /api/users/view-history`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**查询参数:**
```
page?: number   // 页码,默认 1
limit?: number  // 每页数量,默认 20
```

**返回数据:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "wallpaper": {
        "id": 1,
        "title": "精美壁纸",
        "thumbnailUrl": "thumbnail_200_wallpaper_uuid.jpg"
      },
      "viewedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### 11. 获取用户上传的壁纸

**接口地址:** `GET /api/users/wallpapers`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**查询参数:**
```
page?: number   // 页码,默认 1
limit?: number  // 每页数量,默认 20
```

**返回数据:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "我的壁纸",
      "fileUrl": "wallpaper_uuid.jpg",
      "thumbnailUrl": "thumbnail_200_wallpaper_uuid.jpg",
      "status": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

## 🖼️ 壁纸管理

### 1. 上传壁纸

**接口地址:** `POST /api/wallpapers/upload`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**请求参数:**
- `Content-Type: multipart/form-data`

**Form Data:**
```
file: File                        // [必填] 图片文件
title: string                     // [可选] 标题 (1-100字符)
description: string               // [可选] 描述 (0-500字符)
category: 'general' | 'anime' | 'people'  // [可选] 分类
tags: string[]                    // [可选] 标签数组
```

**文件限制:**
- 支持格式: JPG, JPEG, PNG, WEBP, GIF
- 最大文件大小: 20MB
- 自动生成缩略图 (200px, 500px)

**返回数据:**
```json
{
  "success": true,
  "message": "壁纸上传成功",
  "data": {
    "id": 1,
    "title": "精美壁纸",
    "description": "壁纸描述",
    "fileUrl": "wallpaper_uuid.jpg",
    "thumbnailUrl": "thumbnail_500_wallpaper_uuid.jpg",
    "width": 1920,
    "height": 1080,
    "fileSize": 2048576,
    "format": "jpg",
    "aspectRatio": 1.78,
    "category": "general",
    "uploaderId": 123456,
    "viewCount": 0,
    "likeCount": 0,
    "favoriteCount": 0,
    "downloadCount": 0,
    "status": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 获取壁纸列表

**接口地址:** `GET /api/wallpapers`

**认证要求:** ❌ 无需认证

**查询参数:**
```
page?: string              // 页码,默认 '1'
limit?: string             // 每页数量,默认 '20'
search?: string            // 搜索关键词
sortBy?: string            // 排序字段,默认 'createdAt'
sortOrder?: 'ASC'|'DESC'   // 排序方向,默认 'DESC'
tags?: string[]            // 标签筛选
tagKeyword?: string        // 标签关键词搜索
category?: string          // 分类筛选 (general|anime|people)
minWidth?: string          // 最小宽度
maxWidth?: string          // 最大宽度
minHeight?: string         // 最小高度
maxHeight?: string         // 最大高度
aspectRatio?: string       // 宽高比
format?: string            // 文件格式
minFileSize?: string       // 最小文件大小
maxFileSize?: string       // 最大文件大小
```

**返回数据:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "精美壁纸",
      "description": "壁纸描述",
      "fileUrl": "wallpaper_uuid.jpg",
      "thumbnailUrl": "thumbnail_500_wallpaper_uuid.jpg",
      "width": 1920,
      "height": 1080,
      "category": "general",
      "likeCount": 100,
      "viewCount": 1000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "pages": 50
  }
}
```

---

### 3. 获取热门壁纸

**接口地址:** `GET /api/wallpapers/popular`

**认证要求:** ❌ 无需认证

**查询参数:**
```
limit?: string  // 返回数量,默认 '10'
```

**返回数据:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "热门壁纸",
      "likeCount": 500,
      "viewCount": 5000
    }
  ]
}
```

---

### 4. 获取指定上传者的壁纸

**接口地址:** `GET /api/wallpapers/uploader/:uploaderId`

**认证要求:** ❌ 无需认证

**路径参数:**
- `uploaderId` - 上传者ID (数字)

**查询参数:**
```
page?: string   // 页码,默认 '1'
limit?: string  // 每页数量,默认 '20'
```

**返回数据:** 同"获取壁纸列表"

---

### 5. 获取壁纸详情

**接口地址:** `GET /api/wallpapers/:id`

**认证要求:** ✅ 可选登录 (OptionalJwtAuthGuard)

**路径参数:**
- `id` - 壁纸ID (数字)

**返回数据:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "精美壁纸",
    "description": "壁纸描述",
    "fileUrl": "wallpaper_uuid.jpg",
    "thumbnailUrl": "thumbnail_500_wallpaper_uuid.jpg",
    "width": 1920,
    "height": 1080,
    "fileSize": 2048576,
    "format": "jpg",
    "aspectRatio": 1.78,
    "category": "general",
    "uploaderId": 123456,
    "viewCount": 1000,
    "likeCount": 100,
    "favoriteCount": 50,
    "downloadCount": 200,
    "status": 1,
    "isLiked": false,          // 已登录用户返回点赞状态
    "isFavorited": false,      // 已登录用户返回收藏状态
    "uploaderName": "张三",
    "uploader": {
      "id": 123456,
      "username": "张三",
      "avatarUrl": "/uploads/profile-pictures/user_123456_1234567890.jpg"
    },
    "tags": [
      {
        "id": 1,
        "name": "风景"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**注意:**
- 每次访问自动增加 `viewCount`
- 已登录用户会记录浏览历史
- 已登录用户返回点赞和收藏状态

---

### 6. 获取壁纸标签

**接口地址:** `GET /api/wallpapers/:id/tags`

**认证要求:** ❌ 无需认证

**路径参数:**
- `id` - 壁纸ID (数字)

**返回数据:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "风景",
      "useCount": 50
    },
    {
      "id": 2,
      "name": "自然",
      "useCount": 30
    }
  ]
}
```

---

### 7. 更新壁纸信息

**接口地址:** `PUT /api/wallpapers/:id`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)
**权限:** 仅限上传者本人

**路径参数:**
- `id` - 壁纸ID (数字)

**请求参数:**
```json
{
  "title": "新标题",                    // [可选] 1-100字符
  "description": "新的描述",            // [可选] 0-500字符
  "category": "general" | "anime" | "people"  // [可选]
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "壁纸更新成功",
  "data": {
    "id": 1,
    "title": "新标题",
    "description": "新的描述",
    "category": "general"
  }
}
```

---

### 8. 删除壁纸

**接口地址:** `DELETE /api/wallpapers/:id`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)
**权限:** 仅限上传者本人

**路径参数:**
- `id` - 壁纸ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "壁纸删除成功"
}
```

**注意:**
- 删除壁纸会同时删除所有关联文件
- 包括原图、缩略图等

---

### 9. 点赞壁纸

**接口地址:** `POST /api/wallpapers/:id/like`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 壁纸ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "点赞成功"
}
```

---

### 10. 取消点赞壁纸

**接口地址:** `POST /api/wallpapers/:id/unlike`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 壁纸ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "取消点赞成功"
}
```

---

### 11. 收藏壁纸

**接口地址:** `POST /api/wallpapers/:id/favorite`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 壁纸ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "收藏成功"
}
```

---

### 12. 取消收藏壁纸

**接口地址:** `POST /api/wallpapers/:id/unfavorite`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 壁纸ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "取消收藏成功"
}
```

---

## 🏷️ 标签系统

### 1. 获取标签列表

**接口地址:** `GET /api/tags`

**认证要求:** ❌ 无需认证

**查询参数:**
```
page?: number            // 页码,默认 1
limit?: number           // 每页数量,默认 20
keyword?: string         // 搜索关键词
sortBy?: string          // 排序字段
sortOrder?: 'ASC'|'DESC' // 排序方向
```

**返回数据:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "风景",
      "useCount": 50,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "动漫",
      "useCount": 30
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### 2. 获取标签详情

**接口地址:** `GET /api/tags/:id`

**认证要求:** ❌ 无需认证

**路径参数:**
- `id` - 标签ID (数字)

**返回数据:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "风景",
    "useCount": 50,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. 创建标签 (管理员)

**接口地址:** `POST /api/tags`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**请求参数:**
```json
{
  "name": "新标签"  // [必填] 标签名称 (1-50字符)
}
```

**返回数据:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "新标签",
    "useCount": 0
  }
}
```

---

### 4. 更新标签 (管理员)

**接口地址:** `PATCH /api/tags/:id`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 标签ID (数字)

**请求参数:**
```json
{
  "name": "更新后的标签名"  // [必填] 标签名称 (1-50字符)
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "标签已更新",
  "data": {
    "id": 1,
    "name": "更新后的标签名"
  }
}
```

---

### 5. 删除标签 (管理员)

**接口地址:** `DELETE /api/tags/:id`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 标签ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "标签已删除"
}
```

---

## 💬 论坛系统

### 1. 创建帖子

**接口地址:** `POST /api/posts`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**请求参数:**
```json
{
  "title": "帖子标题",             // [必填] 标题 (1-255字符)
  "content": "帖子内容...",       // [必填] 内容
  "category": "discussion",       // [必填] 分类 (discussion|share|question)
  "summary": "摘要",              // [可选] 摘要 (0-500字符)
  "thumbnailUrl": "https://...",  // [可选] 缩略图URL (0-500字符)
  "tags": ["标签1", "标签2"]      // [可选] 标签数组
}
```

**分类枚举:**
- `discussion` - 讨论
- `share` - 分享
- `question` - 提问

**返回数据:**
```json
{
  "success": true,
  "message": "帖子创建成功",
  "data": {
    "id": 1,
    "title": "帖子标题",
    "content": "帖子内容...",
    "category": "discussion",
    "summary": "摘要",
    "thumbnailUrl": "https://...",
    "authorId": 123456,
    "viewCount": 0,
    "likeCount": 0,
    "commentCount": 0,
    "tags": ["标签1", "标签2"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "author": {
      "id": 123456,
      "username": "张三"
    }
  }
}
```

---

### 2. 获取帖子列表

**接口地址:** `GET /api/posts`

**认证要求:** ❌ 无需认证

**查询参数:**
```
page?: number              // 页码,默认 1
limit?: number             // 每页数量,默认 20
sortBy?: string            // 排序字段 (createdAt|updatedAt|viewCount|likeCount|commentCount|popular)
sortOrder?: 'ASC'|'DESC'   // 排序方向,默认 'DESC'
category?: string          // 分类筛选 (discussion|share|question)
search?: string            // 搜索关键词 (0-200字符)
authorId?: number          // 作者ID
tags?: string[]            // 标签筛选
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取帖子列表成功",
  "data": [
    {
      "id": 1,
      "title": "帖子标题",
      "summary": "摘要",
      "category": "discussion",
      "authorId": 123456,
      "viewCount": 100,
      "likeCount": 10,
      "commentCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": 123456,
        "username": "张三"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### 3. 获取帖子详情

**接口地址:** `GET /api/posts/:id`

**认证要求:** ❌ 无需认证

**路径参数:**
- `id` - 帖子ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "获取帖子成功",
  "data": {
    "id": 1,
    "title": "帖子标题",
    "content": "帖子内容...",
    "category": "discussion",
    "summary": "摘要",
    "thumbnailUrl": "https://...",
    "authorId": 123456,
    "viewCount": 100,
    "likeCount": 10,
    "commentCount": 5,
    "tags": ["标签1", "标签2"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "author": {
      "id": 123456,
      "username": "张三",
      "avatarUrl": "/uploads/profile-pictures/user_123456_1234567890.jpg"
    }
  }
}
```

---

### 4. 更新帖子

**接口地址:** `PUT /api/posts/:id`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)
**权限:** 仅限作者本人

**路径参数:**
- `id` - 帖子ID (数字)

**请求参数:**
```json
{
  "title": "新标题",             // [可选]
  "content": "新内容",           // [可选]
  "category": "discussion",      // [可选]
  "summary": "新摘要",           // [可选]
  "thumbnailUrl": "https://...", // [可选]
  "tags": ["新标签"]             // [可选]
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "帖子更新成功",
  "data": {
    "id": 1,
    "title": "新标题",
    "content": "新内容",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 5. 删除帖子

**接口地址:** `DELETE /api/posts/:id`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)
**权限:** 仅限作者本人

**路径参数:**
- `id` - 帖子ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "帖子删除成功"
}
```

---

### 6. 点赞帖子

**接口地址:** `POST /api/posts/:id/like`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 帖子ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "点赞成功"
}
```

---

### 7. 取消点赞帖子

**接口地址:** `DELETE /api/posts/:id/like`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 帖子ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "取消点赞成功"
}
```

---

### 8. 检查帖子点赞状态

**接口地址:** `GET /api/posts/:id/like`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 帖子ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "获取点赞状态成功",
  "data": {
    "hasLiked": true
  }
}
```

---

### 9. 获取热门帖子

**接口地址:** `GET /api/posts/popular/list`

**认证要求:** ❌ 无需认证

**查询参数:**
```
limit?: number  // 返回数量,默认 10,最大 100
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取热门帖子成功",
  "data": [
    {
      "id": 1,
      "title": "热门帖子",
      "likeCount": 100,
      "viewCount": 1000
    }
  ]
}
```

---

### 10. 获取最新帖子

**接口地址:** `GET /api/posts/latest/list`

**认证要求:** ❌ 无需认证

**查询参数:**
```
limit?: number  // 返回数量,默认 10,最大 100
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取最新帖子成功",
  "data": [
    {
      "id": 1,
      "title": "最新帖子",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 11. 获取我的帖子

**接口地址:** `GET /api/posts/user/my`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**查询参数:**
```
page?: number   // 页码,默认 1
limit?: number  // 每页数量,默认 20,最大 100
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取用户帖子成功",
  "data": [
    {
      "id": 1,
      "title": "我的帖子",
      "category": "discussion",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

## 💭 评论系统

### 1. 创建评论

**接口地址:** `POST /api/comments`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**请求参数:**
```json
{
  "content": "评论内容",    // [必填] 评论内容
  "postId": 1,             // [必填] 帖子ID (数字, >= 1)
  "parentId": 2            // [可选] 父评论ID (数字, >= 1),用于回复评论
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "评论创建成功",
  "data": {
    "id": 1,
    "content": "评论内容",
    "postId": 1,
    "authorId": 123456,
    "parentId": null,
    "likeCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "author": {
      "id": 123456,
      "username": "张三",
      "avatarUrl": "/uploads/profile-pictures/user_123456_1234567890.jpg"
    }
  }
}
```

---

### 2. 获取评论详情

**接口地址:** `GET /api/comments/:id`

**认证要求:** ❌ 无需认证

**路径参数:**
- `id` - 评论ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "获取评论成功",
  "data": {
    "id": 1,
    "content": "评论内容",
    "postId": 1,
    "authorId": 123456,
    "parentId": null,
    "likeCount": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "author": {
      "id": 123456,
      "username": "张三",
      "avatarUrl": "/uploads/profile-pictures/user_123456_1234567890.jpg"
    }
  }
}
```

---

### 3. 获取帖子的评论列表

**接口地址:** `GET /api/comments/post/:postId`

**认证要求:** ❌ 无需认证

**路径参数:**
- `postId` - 帖子ID (数字)

**查询参数:**
```
page?: number              // 页码,默认 1
limit?: number             // 每页数量,默认 20,最大 100
sortBy?: string            // 排序字段 (createdAt|updatedAt|likeCount)
sortOrder?: 'ASC'|'DESC'   // 排序方向,默认 'ASC'
parentId?: number          // 父评论ID (筛选子评论)
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取评论列表成功",
  "data": [
    {
      "id": 1,
      "content": "评论内容",
      "postId": 1,
      "authorId": 123456,
      "parentId": null,
      "likeCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": 123456,
        "username": "张三",
        "avatarUrl": "/uploads/profile-pictures/user_123456_1234567890.jpg"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### 4. 获取评论的子评论 (回复)

**接口地址:** `GET /api/comments/:parentCommentId/replies`

**认证要求:** ❌ 无需认证

**路径参数:**
- `parentCommentId` - 父评论ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "获取回复列表成功",
  "data": [
    {
      "id": 2,
      "content": "回复内容",
      "postId": 1,
      "parentId": 1,
      "authorId": 123456,
      "likeCount": 2,
      "createdAt": "2024-01-01T00:01:00.000Z",
      "author": {
        "id": 123456,
        "username": "李四"
      }
    }
  ]
}
```

---

### 5. 更新评论

**接口地址:** `PUT /api/comments/:id`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)
**权限:** 仅限评论作者本人

**路径参数:**
- `id` - 评论ID (数字)

**请求参数:**
```json
{
  "content": "更新后的评论内容"  // [必填] 评论内容 (最大2000字符)
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "评论更新成功",
  "data": {
    "id": 1,
    "content": "更新后的评论内容",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 6. 删除评论

**接口地址:** `DELETE /api/comments/:id`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)
**权限:** 仅限评论作者本人

**路径参数:**
- `id` - 评论ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "评论删除成功"
}
```

---

### 7. 获取帖子评论统计

**接口地址:** `GET /api/comments/stats/:postId`

**认证要求:** ❌ 无需认证

**路径参数:**
- `postId` - 帖子ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "获取评论统计成功",
  "data": {
    "totalComments": 100,
    "rootComments": 50,
    "replyComments": 50
  }
}
```

---

### 8. 获取我的评论

**接口地址:** `GET /api/comments/user/my`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**查询参数:**
```
page?: number   // 页码,默认 1
limit?: number  // 每页数量,默认 20,最大 100
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取用户评论成功",
  "data": [
    {
      "id": 1,
      "content": "我的评论",
      "postId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "post": {
        "id": 1,
        "title": "帖子标题"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### 9. 获取最新评论

**接口地址:** `GET /api/comments/latest/list`

**认证要求:** ❌ 无需认证

**查询参数:**
```
limit?: number  // 返回数量,默认 10,最大 100
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取最新评论成功",
  "data": [
    {
      "id": 1,
      "content": "最新评论",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": 123456,
        "username": "张三"
      }
    }
  ]
}
```

---

### 10. 点赞/取消点赞评论

**接口地址:** `POST /api/comments/:id/like`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 评论ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "评论点赞成功",
  "data": {
    "isLiked": true,
    "likeCount": 10
  }
}
```

**注意:** 此接口为切换式操作,已点赞则取消点赞,未点赞则点赞

---

### 11. 检查评论点赞状态

**接口地址:** `GET /api/comments/:id/like-status`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `id` - 评论ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "获取点赞状态成功",
  "data": {
    "isLiked": true,
    "likeCount": 10
  }
}
```

---

### 12. 获取我点赞的评论

**接口地址:** `GET /api/comments/user/liked`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**查询参数:**
```
page?: number   // 页码,默认 1
limit?: number  // 每页数量,默认 20,最大 100
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取用户点赞评论成功",
  "data": [
    {
      "id": 1,
      "content": "我点赞的评论",
      "postId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "pages": 2
  }
}
```

---

## 🚨 举报审核

### 1. 获取举报原因选项

**接口地址:** `GET /api/reports/reasons/options`

**认证要求:** ❌ 无需认证

**返回数据:**
```json
{
  "success": true,
  "message": "获取举报原因选项成功",
  "data": [
    {
      "value": "inappropriate",
      "label": "不当内容",
      "description": "包含色情、暴力、歧视等不当内容"
    },
    {
      "value": "spam",
      "label": "垃圾信息",
      "description": "广告、刷屏等垃圾信息"
    },
    {
      "value": "copyright",
      "label": "版权问题",
      "description": "侵犯他人版权"
    },
    {
      "value": "other",
      "label": "其他",
      "description": "其他原因"
    }
  ]
}
```

---

### 2. 创建举报

**接口地址:** `POST /api/reports`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**请求参数:**
```json
{
  "targetType": "wallpaper",     // [必填] 目标类型 (wallpaper|post|comment)
  "targetId": 1,                 // [必填] 目标ID (数字)
  "reason": "inappropriate",     // [必填] 举报原因 (inappropriate|spam|copyright|other)
  "description": "详细描述..."   // [可选] 举报描述 (最大500字符)
}
```

**目标类型枚举:**
- `wallpaper` - 壁纸
- `post` - 帖子
- `comment` - 评论

**举报原因枚举:**
- `inappropriate` - 不当内容
- `spam` - 垃圾信息
- `copyright` - 版权问题
- `other` - 其他

**返回数据:**
```json
{
  "success": true,
  "message": "举报提交成功,我们会尽快处理",
  "data": {
    "id": 1,
    "targetType": "wallpaper",
    "targetId": 1,
    "reason": "inappropriate",
    "description": "详细描述...",
    "status": "pending",
    "reporterId": 123456,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. 获取我的举报历史

**接口地址:** `GET /api/reports/user/my`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**查询参数:**
```
page?: string   // 页码,默认 '1'
limit?: string  // 每页数量,默认 '20'
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取用户举报历史成功",
  "data": [
    {
      "id": 1,
      "targetType": "wallpaper",
      "targetId": 1,
      "reason": "inappropriate",
      "status": "approved",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "reviewedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

---

### 4. 检查是否可以举报

**接口地址:** `GET /api/reports/check/:targetType/:targetId`

**认证要求:** ✅ 需要登录 (JwtAuthGuard)

**路径参数:**
- `targetType` - 目标类型 (wallpaper|post|comment)
- `targetId` - 目标ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "检查完成",
  "data": {
    "canReport": true,
    "reason": null
  }
}
```

**可能的不可举报原因:**
- 已经举报过该内容
- 举报次数已达限制
- 内容已经被删除

---

## 👨‍💼 管理员功能

### 用户管理

#### 1. 获取用户列表 (管理员)

**接口地址:** `GET /api/admin/users`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**查询参数:**
```
page?: number      // 页码,默认 1
limit?: number     // 每页数量,默认 20
keyword?: string   // 搜索关键词 (用户名/邮箱)
status?: number    // 状态筛选 (0=禁用, 1=启用)
role?: string      // 角色筛选 (user|admin)
```

**返回数据:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123456,
      "username": "张三",
      "email": "user@example.com",
      "role": "user",
      "status": 1,
      "bio": "个人简介",
      "avatarUrl": "user_123456_1234567890.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

#### 2. 获取用户详情 (管理员)

**接口地址:** `GET /api/admin/users/:id`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 用户ID (数字)

**返回数据:**
```json
{
  "success": true,
  "data": {
    "id": 123456,
    "username": "张三",
    "email": "user@example.com",
    "role": "user",
    "status": 1,
    "bio": "个人简介",
    "avatarUrl": "user_123456_1234567890.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 3. 创建用户 (管理员)

**接口地址:** `POST /api/admin/users`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**请求参数:**
```json
{
  "id": 123456,                  // [必填] 用户ID
  "username": "新用户",           // [可选] 用户名 (1-50字符)
  "email": "user@example.com",   // [可选] 邮箱
  "password": "password123",     // [必填] 密码 (6-20字符)
  "bio": "个人简介",             // [可选] 个人简介 (0-500字符)
  "role": "user"                 // [可选] 角色 (user|admin)
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "创建用户成功",
  "data": {
    "id": 123456,
    "username": "新用户",
    "email": "user@example.com",
    "role": "user",
    "status": 1
  }
}
```

---

#### 4. 更新用户信息 (管理员)

**接口地址:** `PATCH /api/admin/users/:id`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 用户ID (数字)

**请求参数:**
```json
{
  "username": "更新后的用户名",    // [可选] 1-50字符
  "email": "new@example.com",     // [可选]
  "password": "newpassword123",   // [可选] 6-20字符
  "avatarUrl": "new_avatar.jpg",  // [可选]
  "bio": "新的个人简介",          // [可选] 0-500字符
  "role": "admin",                // [可选] 角色 (user|admin)
  "status": 0                     // [可选] 状态 (0=禁用, 1=启用)
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "更新用户信息成功",
  "data": {
    "id": 123456,
    "username": "更新后的用户名",
    "role": "admin",
    "status": 0
  }
}
```

---

#### 5. 更新用户状态 (管理员)

**接口地址:** `PATCH /api/admin/users/:id/status`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 用户ID (数字)

**请求参数:**
```json
{
  "status": 1  // [必填] 状态 (0=禁用, 1=启用)
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "用户已启用",
  "data": {
    "id": 123456,
    "status": 1
  }
}
```

---

#### 6. 删除用户 (管理员)

**接口地址:** `DELETE /api/admin/users/:id`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 用户ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "用户已删除"
}
```

---

### 壁纸管理

#### 1. 获取壁纸列表 (管理员)

**接口地址:** `GET /api/admin/wallpapers`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**查询参数:**
```
page?: string      // 页码,默认 '1'
limit?: string     // 每页数量,默认 '20'
search?: string    // 搜索关键词
category?: string  // 分类筛选 (general|anime|people)
status?: string    // 状态筛选 (0=禁用, 1=启用)
uploaderId?: string // 上传者ID
```

**返回数据:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "壁纸标题",
      "description": "描述",
      "fileUrl": "wallpaper_uuid.jpg",
      "thumbnailUrl": "thumbnail_500_wallpaper_uuid.jpg",
      "width": 1920,
      "height": 1080,
      "category": "general",
      "status": 1,
      "isFeatured": false,
      "uploaderId": 123456,
      "viewCount": 1000,
      "likeCount": 100,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "pages": 50
  }
}
```

---

#### 2. 获取壁纸详情 (管理员)

**接口地址:** `GET /api/admin/wallpapers/:id`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 壁纸ID (数字)

**返回数据:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "壁纸标题",
    "description": "描述",
    "status": 1,
    "isFeatured": false,
    "uploader": {
      "id": 123456,
      "username": "张三"
    },
    "tags": [
      {
        "id": 1,
        "name": "风景"
      }
    ]
  }
}
```

---

#### 3. 更新壁纸信息 (管理员)

**接口地址:** `PATCH /api/admin/wallpapers/:id`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 壁纸ID (数字)

**请求参数:**
```json
{
  "title": "新标题",                    // [可选] 1-100字符
  "description": "新的描述",            // [可选] 0-500字符
  "category": "general",               // [可选] 分类
  "status": 0,                         // [可选] 状态 (0=禁用, 1=启用)
  "isFeatured": true                   // [可选] 是否精选
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "壁纸信息已更新",
  "data": {
    "id": 1,
    "title": "新标题",
    "status": 0,
    "isFeatured": true
  }
}
```

---

#### 4. 更新壁纸标签 (管理员)

**接口地址:** `PATCH /api/admin/wallpapers/:id/tags`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 壁纸ID (数字)

**请求参数:**
```json
{
  "tags": ["风景", "自然", "户外"]  // [可选] 标签数组 (最多20个)
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "标签已更新",
  "data": [
    {
      "id": 1,
      "name": "风景"
    },
    {
      "id": 2,
      "name": "自然"
    }
  ]
}
```

---

#### 5. 删除壁纸 (管理员)

**接口地址:** `DELETE /api/admin/wallpapers/:id`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 壁纸ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "壁纸已删除"
}
```

---

### 举报管理

#### 1. 获取举报列表 (管理员)

**接口地址:** `GET /api/admin/reports`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**查询参数:**
```
page?: number          // 页码,默认 1
limit?: number         // 每页数量,默认 20
targetType?: string    // 目标类型 (wallpaper|post|comment)
reason?: string        // 举报原因 (inappropriate|spam|copyright|other)
status?: string        // 状态筛选 (pending|approved|rejected)
userId?: number        // 举报者ID
keyword?: string       // 搜索关键词
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取举报列表成功",
  "data": [
    {
      "id": 1,
      "targetType": "wallpaper",
      "targetId": 1,
      "reason": "inappropriate",
      "description": "详细描述...",
      "status": "pending",
      "reporterId": 123456,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "reporter": {
        "id": 123456,
        "username": "张三"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

#### 2. 获取举报统计 (管理员)

**接口地址:** `GET /api/admin/reports/stats/overview`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**返回数据:**
```json
{
  "success": true,
  "message": "获取举报统计成功",
  "data": {
    "total": 1000,
    "pending": 100,
    "approved": 800,
    "rejected": 100,
    "byReason": {
      "inappropriate": 500,
      "spam": 300,
      "copyright": 150,
      "other": 50
    },
    "byTargetType": {
      "wallpaper": 600,
      "post": 300,
      "comment": 100
    }
  }
}
```

---

#### 3. 获取举报详情 (管理员)

**接口地址:** `GET /api/admin/reports/:id`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 举报ID (数字)

**返回数据:**
```json
{
  "success": true,
  "message": "获取举报成功",
  "data": {
    "id": 1,
    "targetType": "wallpaper",
    "targetId": 1,
    "reason": "inappropriate",
    "description": "详细描述...",
    "status": "pending",
    "reporterId": 123456,
    "reviewNote": null,
    "reviewedAt": null,
    "reviewedBy": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "reporter": {
      "id": 123456,
      "username": "张三"
    }
  }
}
```

---

#### 4. 更新举报状态 (管理员)

**接口地址:** `PUT /api/admin/reports/:id/status`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**路径参数:**
- `id` - 举报ID (数字)

**请求参数:**
```json
{
  "status": "approved",              // [可选] 状态 (pending|approved|rejected)
  "reviewNote": "审核通过,已处理"     // [可选] 处理说明 (最大500字符)
}
```

**返回数据:**
```json
{
  "success": true,
  "message": "更新举报状态成功",
  "data": {
    "id": 1,
    "status": "approved",
    "reviewNote": "审核通过,已处理",
    "reviewedAt": "2024-01-02T00:00:00.000Z",
    "reviewedBy": {
      "id": 789,
      "username": "管理员"
    }
  }
}
```

---

### 数据仪表盘

#### 1. 获取仪表盘统计数据 (管理员)

**接口地址:** `GET /api/admin/dashboard/stats`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**返回数据:**
```json
{
  "success": true,
  "message": "获取仪表盘统计成功",
  "data": {
    "users": {
      "total": 10000,
      "active": 8000,
      "newThisMonth": 500
    },
    "wallpapers": {
      "total": 50000,
      "active": 45000,
      "newThisMonth": 2000
    },
    "posts": {
      "total": 5000,
      "active": 4800,
      "newThisMonth": 300
    },
    "comments": {
      "total": 20000,
      "newThisMonth": 1000
    },
    "reports": {
      "pending": 100,
      "resolved": 900,
      "newThisMonth": 50
    }
  }
}
```

---

#### 2. 获取最新活动 (管理员)

**接口地址:** `GET /api/admin/dashboard/activity`

**认证要求:** ✅ 需要登录 + 管理员权限 (JwtAuthGuard + RolesGuard)

**查询参数:**
```
limit?: string  // 返回数量,默认 '8',范围 1-20
```

**返回数据:**
```json
{
  "success": true,
  "message": "获取最新活动成功",
  "data": [
    {
      "type": "user_register",
      "message": "新用户 张三 注册",
      "userId": 123456,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "type": "wallpaper_upload",
      "message": "用户 李四 上传了新壁纸",
      "userId": 123457,
      "wallpaperId": 1,
      "createdAt": "2024-01-01T00:01:00.000Z"
    },
    {
      "type": "report_created",
      "message": "收到新的壁纸举报",
      "reportId": 1,
      "createdAt": "2024-01-01T00:02:00.000Z"
    }
  ]
}
```

**活动类型枚举:**
- `user_register` - 用户注册
- `wallpaper_upload` - 壁纸上传
- `post_created` - 帖子创建
- `comment_created` - 评论创建
- `report_created` - 举报创建
- `report_resolved` - 举报处理

---

## 📚 附录

### 错误代码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 / Token 无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 用户角色枚举

| 角色 | 说明 |
|------|------|
| `user` | 普通用户 |
| `admin` | 管理员 |

### 壁纸分类枚举

| 分类 | 说明 |
|------|------|
| `general` | 通用 |
| `anime` | 动漫 |
| `people` | 人物 |

### 帖子分类枚举

| 分类 | 说明 |
|------|------|
| `discussion` | 讨论 |
| `share` | 分享 |
| `question` | 提问 |

### 举报状态枚举

| 状态 | 说明 |
|------|------|
| `pending` | 待处理 |
| `approved` | 已通过 |
| `rejected` | 已拒绝 |

### 举报原因枚举

| 原因 | 说明 |
|------|------|
| `inappropriate` | 不当内容 |
| `spam` | 垃圾信息 |
| `copyright` | 版权问题 |
| `other` | 其他 |

---

## 🔒 安全说明

### Token 管理
- Token 存储在 HttpOnly Cookie 中
- 前端无法直接访问 Cookie,防止 XSS 攻击
- Token 有效期: 60 天

### 权限控制
- 所有敏感接口都需要 JWT 认证
- 管理员接口需要额外验证角色权限
- 用户只能操作自己的内容(管理员除外)

### 数据验证
- 所有接口都使用 DTO 进行数据验证
- 使用 class-validator 进行参数验证
- 自动类型转换和错误提示

---

## 📝 版本历史

- **v1.0.0** - 初始版本,包含完整的用户、壁纸、标签、论坛、评论、举报和管理员功能

---

**文档最后更新时间:** 2024-01-01
**API 版本:** v1.0.0
