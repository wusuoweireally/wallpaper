# API 对接一致性审计

审计日期：2026-05-30  
仓库位置：`/Users/tuzhitao/code/Person_like/wallpaper`  
当前提交：`5e08621`  

## 结论摘要

当前项目的基础接口形态完整，`server` 和 `web` 都能通过类型检查与生产构建，但管理员页面和壁纸上传/互动链路存在多个已确认的前后端不一致与逻辑漏洞。

## 修复状态更新（2026-05-30）

本轮已按下方审计结果完成修复，并用干净 Docker 数据卷做了回归验证。以下历史问题现在已修复：

1. Docker 空库启动失败：已补齐基础 schema 迁移，并让 Docker 后端容器启用迁移执行。
2. 管理员上传返回契约不一致：`POST /wallpapers/upload` 成功后已返回新建壁纸 `data`。
3. 取消点赞路由缺失：已新增 `DELETE /wallpapers/:id/like`。
4. 匿名下载计数失败：下载接口已允许匿名访问，并保留不存在壁纸的 404 判断。
5. 管理员删除/批量删除遗留文件：管理员删除现在会清理原图和缩略图。
6. 举报统计字段不一致：后端同时返回前端使用的 `pendingReports` 等字段与旧字段。
7. 举报不存在目标：创建举报前会校验帖子/评论是否存在。
8. 批量推荐成功数错误：不存在的 ID 不再计入成功数。
9. 普通上传标签静默丢失：前端普通上传改为只能选择后台已有标签。
10. 管理员用户页菜单未接线与分页模板错误：编辑、改密、删除已接通，分页访问已修正。
11. 管理员壁纸页缺少批量删除/标签编辑：已补齐批量删除按钮和编辑弹窗标签更新。

回归结果：

| 检查项 | 结果 |
| --- | --- |
| `docker compose --env-file server/.env.production up -d --build mysql server web` | 通过，空数据卷可直接启动 |
| `GET http://127.0.0.1:3001/` | 200 |
| `GET http://127.0.0.1:3001/api/tags` | 200 |
| 匿名 `POST /wallpapers/:id/download` | 201 |
| 登录后 `POST` / `DELETE /wallpapers/:id/like` | 201 / 200 |
| `GET /admin/reports/stats/overview` | 200，含新旧统计字段 |
| `POST /reports` 举报不存在目标 | 404 |
| `POST /admin/wallpapers/batch-featured` 传不存在 ID | `updatedCount: 0`，返回 `failedIds` |
| 管理员上传 | 201，返回 `data.id` |
| 管理员删除上传壁纸后访问原图/缩略图 | 404 / 404 |
| 普通用户上传不存在标签 | 400，且未产生壁纸记录 |

下方“最需要优先处理的是”和运行时实测表为修复前的审计记录，保留用于追溯问题来源。

最需要优先处理的是：

1. 管理员壁纸上传一定会被前端判定失败：后端 `POST /wallpapers/upload` 不返回 `data`，但管理员上传弹窗依赖 `data.id`。
2. 壁纸取消点赞接口不一致：前端调用 `DELETE /wallpapers/:id/like`，后端没有这个路由。
3. 管理员删除壁纸只删数据库，不删原图和缩略图文件，批量删除同样会留下孤儿文件。
4. 管理员举报角标统计字段不一致：后端返回 `pending`，前端读取 `pendingReports`。
5. 管理员用户页分页模板写成 `pagination.value.*`，构建产物会变成 `n.value.value.*`，一旦分页出现就会运行时报错。
6. 管理员用户页“编辑/修改密码/删除”只是无点击逻辑的菜单项，后端接口和前端 service 有，但页面未接上。
7. 普通用户上传强制选择标签，但后端普通用户不能创建新标签；如果所选标签不存在，上传成功后实际没有任何标签。
8. 举报接口不校验目标是否真实存在，可以举报不存在的帖子/评论。

## 验证命令

已运行：

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `pnpm -C server type-check` | 通过 | 后端 TS 类型检查通过 |
| `pnpm -C web type-check` | 通过 | 前端 TS/Vue 类型检查通过 |
| `pnpm -C server build` | 通过 | 后端 Nest 构建通过 |
| `pnpm -C web build` | 通过 | 前端 Vite 构建通过，仅 browserslist/baseline 数据过旧提示 |
| `pnpm -C server lint` | 失败 | 50 errors/6 warnings，主要是 prettier、`any`、`no-floating-promises` |
| `pnpm -C web lint` | 失败 | 3 errors/26 warnings，包含未使用变量与 `v-html` 警告 |
| `pnpm -C server test -- --runInBand` | 失败 | 当前没有任何 `*.spec.ts`，Jest 报 `No tests found` |

当前工作树已有一个与本次审计无关的暂存修改：`server/src/app.module.ts`。本审计未覆盖/回滚该改动。

## Docker 运行时验证补充

2026-05-30 重新安装 Docker 后已做 HTTP 级接口复测。

启动过程结论：

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| `docker ps` | 通过 | Docker daemon 可用 |
| `docker compose version` | 通过 | Compose 可用 |
| 直接按 Compose 启动 MySQL | 需规避 | 本机已有 `mysqld` 占用 `127.0.0.1:3306`，测试时用临时 override 去掉 MySQL 宿主端口映射 |
| 空库启动后端 | 失败 | 后端反复重启，日志为 `Table 'wallpaper_site.users' doesn't exist` |
| 测试库同步 schema 后启动 | 通过 | 在新 Docker 测试库中用实体同步出 13 张表后，后端健康检查通过 |
| `GET /tags` | 200 | 后端服务可访问，DemoSeed 初始化了标签和演示壁纸 |
| `GET http://127.0.0.1:3001/` | 200 | 前端 Docker 容器已启动 |
| `GET http://127.0.0.1:3001/api/tags` | 200 | 前端 Nginx `/api` 代理到后端可用 |

这说明当前项目缺少“从空数据库可靠启动”的完整迁移链。`app.module.ts` 已强制关闭 `synchronize`，但仓库只有增量迁移，没有覆盖基础表结构；生产/新环境直接启动会在 `AdminSeedService` 查询 `users` 表时崩溃。

HTTP 实测结果：

| 接口/场景 | 运行结果 | 结论 |
| --- | --- | --- |
| `POST /users/login` 管理员登录 | 200，角色 `super_admin`，返回 token | 登录接口可用 |
| `GET /wallpapers` | 200，返回 6 条演示壁纸分页 | 壁纸列表接口可用 |
| `GET /tags` | 200，返回 4 个标签 | 标签列表接口可用 |
| `GET /wallpapers/popular` | 200 | 热门接口可用 |
| `GET /wallpapers/trending` | 200 | 趋势接口可用 |
| 匿名 `POST /wallpapers/:id/download` | 401 | 匿名下载不会被计数，和前端公开下载行为不一致 |
| 登录后 `POST /wallpapers/:id/download` | 201 | 登录用户下载计数可用 |
| 登录后 `POST /wallpapers/:id/like` | 201 | 点赞接口可用 |
| 登录后 `DELETE /wallpapers/:id/like` | 404，`Cannot DELETE /wallpapers/6/like` | 前端取消点赞接口确实不存在 |
| `POST /wallpapers/:id/favorite` / `DELETE /wallpapers/:id/favorite` | 201 / 200 | 收藏/取消收藏接口可用 |
| `GET /admin/users` | 200 | 管理员用户列表 API 可用；页面菜单未接线仍是前端问题 |
| `GET /admin/reports/stats/overview` | 200，字段为 `total/pending/reviewing/resolved/dismissed` | 后端字段与前端 `pendingReports` 等类型不一致 |
| `POST /reports` 举报不存在的 `post:999999999` | 201，举报创建成功 | 举报目标存在性校验缺失 |
| `POST /admin/wallpapers/batch-featured` 传不存在 ID | 201，`updatedCount: 1`，`failedIds: []` | 批量推荐成功数统计错误 |
| 管理员 `POST /wallpapers/upload` | 201，`{ success, message }`，没有 `data` | 管理员上传弹窗依赖 `data.id`，实测会误判失败 |
| 管理员上传后 `GET /admin/wallpapers?search=...` | 200，能查到刚上传壁纸 | 上传 DB 写入成功 |
| 管理员删除刚上传壁纸后访问原图/缩略图 URL | 删除前 200，删除后仍 200 | 管理员删除确实留下孤儿文件 |
| 普通用户上传不存在标签 | 上传 201，随后 `GET /wallpapers/:id/tags` 返回空数组 | 前端必选标签与后端普通用户不能创建标签的规则冲突已复现 |

运行时原因重分析：

1. “管理员上传失败”不是上传接口本身失败，而是返回契约错位：后端成功写入文件和数据库，但只返回 `success/message`；管理员页按 `response.data.id` 判断，因此成功结果会被页面当成异常。
2. “取消点赞失败”是路由缺失，不是鉴权或参数问题：后端路由表只有 `POST /wallpapers/:id/like`，实测 `DELETE` 返回 404。
3. “管理员删除后文件还在”是删除路径不一致：普通删除控制器会清文件，管理员删除只走 `wallpaperService.delete` 删除数据库关系和记录；静态资源仍可 200 访问。
4. “管理员举报角标不准”是字段命名不一致：运行时返回 `pending`，前端读取 `pendingReports`。
5. “普通上传标签不生效”是产品规则冲突：前端要求至少一个标签，后端普通用户只关联已存在标签并静默忽略新标签，所以用户看到上传成功，结果壁纸无标签。
6. “批量推荐成功数不可信”是 Service 没检查 `update().affected`：不存在的 ID 也被计入成功。
7. “新环境跑不起来”是迁移链缺失：关闭 `synchronize` 后没有基础 schema 迁移，空库启动直接失败。

## 接口总览与对接状态

### 认证接口

| 后端接口 | 前端入口 | 状态 | 备注 |
| --- | --- | --- | --- |
| `GET /auth/github` | `GitHubLoginButton.vue` | 基本一致 | 发起 GitHub OAuth |
| `GET /auth/github/callback` | GitHub 回调 | 基本一致 | 后端设置 cookie 并重定向前端 |
| `GET /auth/github/success` | `GitHubCallback.vue` | 基本一致 | 前端页面处理登录成功 |
| `GET /auth/github/failure` | `GitHubCallback.vue` | 基本一致 | 前端页面处理登录失败 |

### 用户接口

| 后端接口 | 前端调用 | 状态 | 备注 |
| --- | --- | --- | --- |
| `POST /users/register` | `userService.register` | 一致 | JSON 注册 |
| `POST /users/login` | `userService.login` | 一致 | 后端同时返回 token 并写 HttpOnly cookie |
| `POST /users/logout` | `userService.logout` | 一致 | 清理 cookie |
| `GET /users/profile` | `userService.getProfile` | 一致 | 当前用户信息 |
| `GET /users` | 无直接页面使用 | 可用但重复 | 老管理员用户列表接口，当前后台用 `/admin/users` |
| `PATCH /users/:id` | `userService.updateUser` | 一致 | 本人或管理员可修改 |
| `DELETE /users/:id` | 无直接页面使用 | 可用但重复 | 当前后台删除入口未接线 |
| `PATCH /users/:id/toggle-status` | 无直接页面使用 | 可用但重复 | 当前后台用 `/admin/users/:id/status` |
| `POST /users/:id/avatar` | `userService.uploadAvatar`、`ProfileSettings.vue` 直接 `fetch` | 基本一致 | 两套前端调用并存，建议收敛到 service |
| `GET /users/likes` | `userService.getUserLikes` | 运行时一致，类型不准 | 后端返回顶层 `data/pagination`，前端类型写成嵌套 `PaginatedResponse` |
| `GET /users/favorites` | `userService.getUserFavorites` | 运行时一致，类型不准 | 同上 |
| `GET /users/view-history` | `userService.getUserViewHistory` | 一致 | 当前用户浏览记录 |
| `GET /users/wallpapers` | `userService.getUserWallpapers` | 运行时一致，类型不准 | 同上 |
| `GET /users/:id` | `userService.getUserById` | 一致 | 后端对非本人/非管理员会隐藏隐私字段 |

### 壁纸接口

| 后端接口 | 前端调用 | 状态 | 备注 |
| --- | --- | --- | --- |
| `POST /wallpapers/upload` | `wallpaperService.uploadWallpaper` | 部分一致 | 普通上传页只看 `success`，管理员上传页要求 `data.id`，因此管理员上传误判失败 |
| `GET /wallpapers` | `wallpaperService.getWallpapers` | 一致 | 支持筛选/排序/分页 |
| `GET /wallpapers/popular` | `wallpaperService.getPopularWallpapers` | 一致 | 静态路由在 `:id` 前面，顺序正确 |
| `GET /wallpapers/trending` | `wallpaperService.getTrendingWallpapers` | 一致 | 最近 N 天热门 |
| `GET /wallpapers/:id/related` | `wallpaperService.getRelatedWallpapers` | 一致 | 相关推荐 |
| `GET /wallpapers/uploader/:uploaderId` | `wallpaperService.getWallpapersByUploader` | 一致 | 指定上传者 |
| `GET /wallpapers/:id` | `wallpaperService.getWallpaperDetail` | 一致 | 可选登录态返回点赞/收藏状态 |
| `GET /wallpapers/:id/tags` | `wallpaperService.getWallpaperTags` | 一致 | 获取标签 |
| `PUT /wallpapers/:id` | `wallpaperService.updateWallpaper` | 一致 | 上传者本人可改 |
| `DELETE /wallpapers/:id` | `wallpaperService.deleteWallpaper` | 一致 | 上传者本人可删，控制器会删除文件 |
| `POST /wallpapers/:id/download` | `wallpaperService.recordDownload` | 权限语义不一致 | UI 允许匿名下载，但后端要求登录；匿名下载不计数 |
| `POST /wallpapers/:id/like` | `wallpaperService.likeWallpaper` | 部分一致 | 后端实际是 toggle，前端“点赞”时可用 |
| `DELETE /wallpapers/:id/like` | `wallpaperService.unlikeWallpaper` | 不一致 | 后端无此路由，详情页/卡片取消点赞会失败 |
| `POST /wallpapers/:id/favorite` | `wallpaperService.favoriteWallpaper` | 一致 | 后端 toggle，前端收藏时可用 |
| `DELETE /wallpapers/:id/favorite` | `wallpaperService.unfavoriteWallpaper` | 一致 | 后端有幂等取消收藏 |

### 管理员接口

| 后端接口 | 前端调用 | 状态 | 备注 |
| --- | --- | --- | --- |
| `GET /admin/dashboard/stats` | `adminService.getDashboardStats` | 一致 | 仪表盘主统计 |
| `GET /admin/dashboard/activity` | `adminService.getRecentActivity` | 一致 | 最新活动 |
| `GET /admin/users` | `adminService.adminGetUsers` | 一致 | 用户列表 |
| `GET /admin/users/:id` | `adminService.adminGetUserById` | service 有，页面未接 | 用户详情按钮未实际调用 |
| `POST /admin/users` | `adminService.adminCreateUser` | 一致 | 创建用户已接线 |
| `PATCH /admin/users/:id` | `adminService.adminUpdateUser` | service 有，页面未接 | 页面有“编辑用户”文案但无 `@click` |
| `PATCH /admin/users/:id/status` | `adminService.adminUpdateUserStatus` | service 有，页面未接 | 无启用/禁用操作按钮 |
| `DELETE /admin/users/:id` | `adminService.adminDeleteUser` | service 有，页面未接 | 页面有“删除用户”文案但无 `@click` |
| `GET /admin/wallpapers` | `adminService.adminGetWallpapers` | 一致 | 管理员壁纸列表 |
| `GET /admin/wallpapers/:id` | `adminService.adminGetWallpaperDetail` | service 有，页面未接 | 当前详情使用列表对象预览 |
| `PATCH /admin/wallpapers/:id` | `adminService.adminUpdateWallpaper` | 部分接线 | 仅标题/描述编辑和上传后补分类；状态编辑 UI 不完整 |
| `PATCH /admin/wallpapers/:id/tags` | `adminService.adminUpdateWallpaperTags` | service 有，页面未接 | 无编辑已有壁纸标签入口 |
| `DELETE /admin/wallpapers/:id` | `adminService.adminDeleteWallpaper` | 接口可调但逻辑不完整 | 只删 DB，不删物理文件 |
| `POST /admin/wallpapers/batch-delete` | `adminService.adminBatchDeleteWallpapers` | service 有，页面未接 | 页面没有批量删除按钮 |
| `POST /admin/wallpapers/batch-featured` | `adminService.adminBatchSetFeatured` | 已接线但计数不严谨 | 后端未检查 `affected`，不存在 ID 也可能被算作成功 |
| `GET /admin/reports` | `adminService.getReports` | 一致 | 举报列表 |
| `GET /admin/reports/stats/overview` | `adminService.getReportStats` | 字段不一致 | 后端返回 `pending`，前端读取 `pendingReports` |
| `GET /admin/reports/:id` | `adminService.getReportById` | 一致 | 举报详情 |
| `PUT /admin/reports/:id/status` | `adminService.updateReportStatus` | 一致 | 更新举报状态 |

### 标签接口

| 后端接口 | 前端调用 | 状态 | 备注 |
| --- | --- | --- | --- |
| `GET /tags` | `tagService.getTags` | 一致 | 列表/搜索/分页 |
| `POST /tags` | `tagService.createTag` | 一致 | 管理员创建 |
| `GET /tags/:id` | `tagService.getTagById` | 一致 | 标签详情 |
| `PATCH /tags/:id` | `tagService.updateTag` | 一致 | 管理员更新 |
| `DELETE /tags/:id` | `tagService.deleteTag` | 一致 | 管理员删除 |

### 论坛/评论接口

| 后端接口 | 前端调用 | 状态 | 备注 |
| --- | --- | --- | --- |
| `POST /posts` | `forumService.createPost` | 一致 | 发帖 |
| `GET /posts` | `forumService.getPosts` | 一致 | 列表 |
| `GET /posts/:id` | `forumService.getPost` | 一致 | 详情 |
| `PUT /posts/:id` | `forumService.updatePost` | 一致 | 编辑 |
| `DELETE /posts/:id` | `forumService.deletePost` | 一致 | 删除 |
| `POST /posts/:id/like` | `forumService.likePost` | 一致 | 点赞 toggle |
| `DELETE /posts/:id/like` | `forumService.unlikePost` | 一致 | 取消点赞 |
| `GET /posts/:id/like` | `forumService.checkLikeStatus` | 一致 | 点赞状态 |
| `POST /posts/:id/share` | `forumService.sharePost` | 一致 | 分享计数 |
| `POST /posts/:id/bookmark` | `forumService.bookmarkPost` | 一致 | 收藏 |
| `DELETE /posts/:id/bookmark` | `forumService.unbookmarkPost` | 一致 | 取消收藏 |
| `GET /posts/:id/bookmark` | `forumService.checkBookmarkStatus` | 一致 | 收藏状态 |
| `GET /posts/user/bookmarks` | `forumService.getMyBookmarks` | 一致 | 我的收藏 |
| `GET /posts/popular/list` | `forumService.getPopularPosts` | 一致 | 热门 |
| `GET /posts/latest/list` | `forumService.getLatestPosts` | 一致 | 最新 |
| `GET /posts/user/my` | `forumService.getMyPosts` | 一致 | 我的帖子 |
| `POST /comments` | `forumService.createComment` | 一致 | 创建评论 |
| `GET /comments/:id` | `forumService.getComment` | 一致 | 评论详情 |
| `GET /comments/post/:postId` | `forumService.getPostComments` | 一致 | 帖子评论 |
| `GET /comments/:parentCommentId/replies` | `forumService.getCommentReplies` | 一致 | 回复列表 |
| `PUT /comments/:id` | `forumService.updateComment` | 一致 | 更新评论 |
| `DELETE /comments/:id` | `forumService.deleteComment` | 一致 | 删除评论 |
| `GET /comments/stats/:postId` | `forumService.getCommentStats` | 一致 | 评论统计 |
| `GET /comments/user/my` | `forumService.getMyComments` | 一致 | 我的评论 |
| `GET /comments/latest/list` | `forumService.getLatestComments` | 一致 | 最新评论 |
| `POST /comments/:id/like` | `forumService.toggleCommentLike` | 一致 | 评论点赞 toggle |
| `GET /comments/:id/like-status` | `forumService.getCommentLikeStatus` | 一致 | 评论点赞状态 |
| `GET /comments/user/liked` | `forumService.getMyLikedComments` | 一致 | 我点赞的评论 |

### 举报接口

| 后端接口 | 前端调用 | 状态 | 备注 |
| --- | --- | --- | --- |
| `GET /reports/reasons/options` | `reportService.getReportReasons` | 一致 | 举报原因 |
| `POST /reports` | `reportService.createReport` | 可调用但逻辑不完整 | 不校验目标是否存在 |
| `GET /reports/user/my` | `reportService.getUserReports` | 一致 | 用户举报历史 |
| `GET /reports/check/:targetType/:targetId` | `reportService.checkCanReport` | 可调用但逻辑不完整 | 只查是否重复，不校验目标存在 |

## 高优先级问题详解

### P1. 管理员壁纸上传前后端契约不一致

证据：

- 后端上传成功只返回 `success/message`：`server/src/controllers/wallpaper.controller.ts:120-123`
- 管理员上传页把响应强转成 `ApiResponse<AdminWallpaper>`，并要求 `uploadResponse.data` 存在：`web/src/views/admin/Wallpapers.vue:1259-1271`

影响：

- 文件和数据库可能已经创建成功，但管理员页面会进入 `上传失败` 分支。
- 用户反复重试会产生重复上传。
- 上传成功后的分类补丁逻辑依赖 `uploadedWallpaper.id`，当前永远执行不到。

建议：

- 让后端上传接口返回创建后的壁纸对象：`{ success, message, data: wallpaper }`。
- 或者调整管理员上传页只根据 `success` 判断成功，并去掉上传后补丁。
- 更推荐后端返回 `data`，因为上传后刷新、跳转、二次编辑都需要新资源 ID。

### P1. 壁纸取消点赞接口缺失

证据：

- 前端服务定义 `DELETE /wallpapers/:id/like`：`web/src/services/wallpaper.ts:153-155`
- 卡片和详情页取消点赞都会调用该方法：`web/src/components/WallpaperCard.vue:301-304`、`web/src/views/wallpaper/wallpaperDetail.vue:573-577`
- 后端只有 `POST /wallpapers/:id/like` toggle：`server/src/controllers/wallpaper.controller.ts:434-446`
- 后端 service 里有 `removeLike`，但 controller 未暴露：`server/src/services/wallpaper.service.ts:388-395`

影响：

- 用户已点赞时再次点击会请求不存在的接口，取消点赞失败。
- 前端会回滚 optimistic UI，用户会看到“点赞失败”。

建议：

- 后端新增 `DELETE /wallpapers/:id/like` 调用 `removeLike`。
- 或前端取消点赞也调用 `POST /wallpapers/:id/like`，但 toggle 接口对并发/重复点击语义不如显式 DELETE 稳定。

### P1. 管理员删除壁纸不会清理文件

证据：

- 普通删除会在 controller 层调用 `uploadService.deleteUploadedFiles`：`server/src/controllers/wallpaper.controller.ts:405-409`
- 管理员删除只调用 `wallpaperService.delete(id)`：`server/src/controllers/admin/admin-wallpaper.controller.ts:97-103`
- `wallpaperService.delete` 只删点赞/收藏/标签/壁纸记录，没有文件删除：`server/src/services/wallpaper.service.ts:279-303`
- 批量删除复用 `wallpaperService.delete`：`server/src/services/wallpaper.service.ts:310-333`

影响：

- 管理员页面删除或批量删除后，`server/uploads/wallpapers` 和 `server/uploads/thumbnails` 会留下孤儿文件。
- 长期运行会导致磁盘膨胀，也会产生“数据库无记录但静态 URL 仍可能访问”的一致性问题。

建议：

- 管理员删除前先读取壁纸文件路径，DB 删除成功后清理文件。
- 批量删除需要逐条收集并清理文件；失败项要返回明确的 `failedIds`。

### P1. 管理员举报角标字段不一致

证据：

- 后端 `GET /admin/reports/stats/overview` 返回 `total/pending/reviewing/resolved/dismissed`：`server/src/services/report.service.ts:201-246`
- 前端类型声明期望 `totalReports/pendingReports/processingReports/resolvedReports/rejectedReports`：`web/src/services/admin.ts:147-153`
- 管理后台侧栏读取 `response.data?.pendingReports`：`web/src/views/admin/AdminLayout.vue:350-354`

影响：

- 举报管理菜单的待处理角标始终为 0。
- 管理员无法从侧栏感知待处理举报。

建议：

- 统一字段命名。可以让后端返回前端现有字段，也可以改前端读取 `pending`。
- 注意 `reviewing/dismissed` 与 `processing/rejected` 也要同步。

### P1. 管理员用户页分页运行时错误

证据：

- 模板中写了 `pagination.value.total/page/pages`：`web/src/views/admin/Users.vue:483-510`
- 生产构建产物中实际出现 `n.value.value.total`、`n.value.value.page`。

影响：

- 当 `pagination.pages > 1` 显示分页区时会访问 `undefined.total/page/pages`，页面运行时报错。
- `vue-tsc` 和 `vite build` 没有拦住这个问题，需要靠源码审查或运行时验证发现。

建议：

- 模板内改成 `pagination.total`、`pagination.page`、`pagination.pages`。

### P1. 管理员用户管理操作未接线

证据：

- `adminService` 已提供更新、状态、删除接口：`web/src/services/admin.ts:191-200`
- `Users.vue` 菜单项“编辑用户 / 修改密码 / 删除用户”没有 `@click`：`web/src/views/admin/Users.vue:442-464`

影响：

- 管理员用户页实际只能筛选、查看列表、创建用户。
- 用户编辑、禁用启用、删除这些核心管理功能不可用。

建议：

- 给菜单项补齐 detail/edit/status/delete 交互。
- 对应后端已有权限护栏，可以直接复用 `/admin/users/:id`、`/admin/users/:id/status`、`DELETE /admin/users/:id`。

### P2. 普通上传页标签规则前后端冲突

证据：

- 前端上传页要求至少选择一个标签：`web/src/views/wallpaper/uploads.vue:1093-1095`
- 后端普通用户上传时只允许关联已有标签，不允许创建新标签：`server/src/controllers/wallpaper.controller.ts:111-117`
- `TagService` 对普通用户遇到不存在标签会直接忽略：`server/src/services/tag.service.ts:187-188`、`server/src/services/tag.service.ts:213-215`

影响：

- 用户可以选择/输入标签并看到上传成功，但如果标签库没有这些标签，最终壁纸会没有标签。
- 前端“必须选标签”的校验和后端真实行为不一致。

建议：

- 普通上传页只允许选择后端已存在标签，并在 UI 上禁止自定义新标签。
- 或者允许普通用户提交待审核新标签，后端保存为待审核状态。
- 后端也应在普通用户提交全是不存在标签时返回明确错误，而不是静默上传无标签壁纸。

### P2. 文件上传先落盘再校验图片真实性

证据：

- `UploadService` 先校验 `file.mimetype`，再写原图文件：`server/src/services/upload.service.ts:27-62`
- Sharp 读取 metadata 在写文件之后：`server/src/services/upload.service.ts:64-66`
- 非 `BadRequestException` 只返回“文件处理失败”，没有清理已经写入的原图：`server/src/services/upload.service.ts:92-97`

影响：

- 伪造 MIME 的坏文件可能被写入 `uploads/wallpapers`，随后 Sharp 失败但文件残留。
- MIME 依赖客户端/请求头，不应作为唯一文件类型判断。

建议：

- 先用 Sharp 校验 buffer 与 metadata，再写入文件。
- 或在 catch 中清理已经写入的原图。
- 文件扩展名应根据实际 metadata format 生成，而不是完全信任原始文件名。

### P2. 管理员壁纸批量推荐成功计数不准确

证据：

- `batchSetFeatured` 对每个 ID 执行 `repository.update` 后直接 `updatedCount++`：`server/src/services/wallpaper.service.ts:555-558`
- 没有检查 `UpdateResult.affected`。

影响：

- 传入不存在的 ID 也可能显示“更新成功”。
- 管理员批量操作结果不可信。

建议：

- 检查 `result.affected === 1` 才计入成功，否则加入 `failedIds`。

### P2. 举报目标不校验存在性

证据：

- `ReportService.createReport` 只检查重复举报，然后直接保存：`server/src/services/report.service.ts:47-65`
- `checkCanReport` 只判断是否重复：`server/src/services/report.service.ts:271-280`

影响：

- 用户可以举报不存在的帖子/评论 ID。
- 管理员端会看到无法定位真实内容的举报记录。

建议：

- 根据 `targetType` 查询 `Post` / `Comment` 是否存在且未删除。
- `checkCanReport` 也要返回目标不存在的原因。

### P2. 下载计数权限语义不一致

证据：

- 后端 `POST /wallpapers/:id/download` 使用 `JwtAuthGuard`：`server/src/controllers/wallpaper.controller.ts:420-422`
- 卡片/详情页下载按钮不要求登录，只是捕获计数失败并继续下载：`web/src/components/WallpaperCard.vue:357-365`、`web/src/views/wallpaper/wallpaperDetail.vue:701-712`

影响：

- 匿名用户能下载，但不会计入下载次数。
- 热门排序公式包含下载数，匿名下载会被低估。

建议：

- 如果下载本身公开，记录下载接口也应允许匿名。
- 如需登录才能计数，UI 应明确提示或只对登录用户显示计数行为。

### P3. 管理员壁纸功能未完全接线

证据：

- 批量删除 service 存在但页面没有按钮：`web/src/services/admin.ts:226-228`
- 更新壁纸标签 service 存在但页面没有编辑入口：`web/src/services/admin.ts:218-220`
- `Wallpapers.vue` 仅接了批量推荐：`web/src/views/admin/Wallpapers.vue:1320-1339`

影响：

- 后台功能看起来有接口，但页面实际不可用。

建议：

- 增加批量删除按钮和确认弹窗。
- 增加标签编辑弹窗，调用 `PATCH /admin/wallpapers/:id/tags`。

### P3. 上传子分类字段未打通

证据：

- 后端 DTO 和实体支持 `subCategory`：`server/src/dto/wallpaper.dto.ts:30-32`、`server/src/entities/wallpaper.entity.ts:40-47`
- 前端上传参数没有 `subCategory`：`web/src/services/wallpaper.ts:28-34`
- 壁纸列表和首页分类入口已经会按 `subCategory` 筛选：`web/src/views/wallpaper/wallpaperViews.vue:223-227`

影响：

- 用户无法在上传时设置子分类。
- 首页/列表里的子分类筛选很可能查不到新上传内容。

建议：

- 上传页添加子分类选择，并在 `wallpaperService.uploadWallpaper` 中 append `subCategory`。
- 管理员编辑页也应允许补充/修正子分类。

## 后续修复顺序建议

1. 先修接口硬不一致：上传返回 `data`、新增 `DELETE /wallpapers/:id/like`、举报统计字段统一。
2. 再修管理员页面实际不可用：用户编辑/状态/删除接线、用户页分页模板、壁纸批量删除/标签编辑。
3. 再修数据一致性：管理员删除清理文件、上传标签规则、上传失败清理残留文件、批量推荐计数。
4. 最后补测试：至少覆盖上传、点赞/取消点赞、管理员删除、举报统计、管理员用户页关键 service 调用。

## 当前不判定为阻塞的问题

- `web` 的 `v-html` 警告需要继续追踪消毒链路，但论坛新建/编辑/详情已有 `sanitizeHtml` 调用；`CommentItem` 使用 `formatContent`，仍需单独确认。
- `server`/`web` lint 当前失败，但多为格式/未使用变量/显式 any 问题；它们是质量门问题，不等同于当前接口不可用。
- 后端 `synchronize`/迁移配置仍值得单独审计；当前暂存的 `app.module.ts` 已改变此区域，但这不属于本轮接口对接主线。
