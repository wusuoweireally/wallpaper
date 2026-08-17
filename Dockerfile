# 单文件多阶段构建：server / web 两个 target，compose 用 build.target 指定。
# 所有 workspace 统一使用根 lockfile，保证本地与镜像依赖完全一致。

# 构建与运行时统一 Node 24（与本地开发机对齐）；如需回退改此版本号即可
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-bookworm-slim AS deps

WORKDIR /app

# 关闭 corepack 下载确认提示（非交互式构建必需）；pnpm 版本由根 package.json 的 packageManager 字段锁定
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json
RUN pnpm install --frozen-lockfile

# ---------- server ----------

FROM deps AS server-build

COPY server/ ./server/
RUN mkdir -p server/public && pnpm --filter server build
RUN pnpm --filter server deploy --legacy --prod --frozen-lockfile /app/server-runtime

FROM node:${NODE_VERSION}-bookworm-slim AS server

WORKDIR /app
ENV NODE_ENV=production

COPY --from=server-build /app/server-runtime/node_modules ./node_modules
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/public ./public
COPY --from=server-build /app/server/package.json ./package.json

# 拷贝默认上传资源（uploads/壁纸 源图、defaultAvatar 等）到镜像中。
# 当挂载的命名卷为空（如执行 down -v 后）时，Docker 会用镜像里的内容初始化该卷，
# 从而保证演示数据 seed 能找到默认壁纸源图。已有卷不受影响。
COPY --from=server-build /app/server/uploads ./uploads
# 确保运行时所需的上传子目录存在（demo-seed 会向 wallpapers/ 写入文件，缺目录会报错）
RUN mkdir -p uploads/wallpapers uploads/thumbnails uploads/profile-pictures

EXPOSE 3000
CMD ["node", "dist/main"]

# ---------- web ----------

FROM deps AS web-build

COPY web/ ./web/
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS web

COPY --from=web-build /app/web/dist /usr/share/nginx/html
COPY web/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
