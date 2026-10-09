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
RUN pnpm --filter server build
RUN pnpm --filter server deploy --legacy --prod --frozen-lockfile /app/server-runtime

FROM node:${NODE_VERSION}-bookworm-slim AS server

WORKDIR /app
ENV NODE_ENV=production

# 应用已是纯 COS 链路：不读写本地 uploads/public，镜像只带运行必需产物
# 以非 root（基础镜像自带的 node, uid/gid 1000）运行：产物只读，无本地写入诉求
COPY --from=server-build --chown=node:node /app/server-runtime/node_modules ./node_modules
COPY --from=server-build --chown=node:node /app/server/dist ./dist
COPY --from=server-build --chown=node:node /app/server/package.json ./package.json

USER node

EXPOSE 3000
CMD ["node", "dist/main"]

# ---------- web ----------

FROM deps AS web-build

COPY web/ ./web/
ARG VITE_API_BASE_URL=/api
# 留空或 / 时资源仍由 Nginx 提供。设成 CDN 地址后，构建结束会把 dist 里除 index.html 外的文件传到 COS。
# 密钥只存在于本构建阶段，最终镜像是 nginx，不带这些变量。
ARG VITE_ASSET_BASE=/
ARG COS_SECRET_ID
ARG COS_SECRET_KEY
ARG COS_BUCKET
ARG COS_REGION=ap-beijing
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ASSET_BASE=$VITE_ASSET_BASE
ENV COS_SECRET_ID=$COS_SECRET_ID
ENV COS_SECRET_KEY=$COS_SECRET_KEY
ENV COS_BUCKET=$COS_BUCKET
ENV COS_REGION=$COS_REGION
RUN pnpm --filter web build && node web/scripts/upload-assets.mjs

FROM nginx:1.27-alpine AS web

COPY --from=web-build /app/web/dist /usr/share/nginx/html
# 官方镜像启动时把模板里的 ${ASSET_CDN_ORIGIN} 换成环境变量，写到 conf.d
COPY web/nginx/default.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
