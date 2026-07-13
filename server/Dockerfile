FROM node:22-bookworm-slim AS build

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# 所有 workspace 统一使用根 lockfile，保证本地与镜像依赖完全一致。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json
RUN pnpm install --frozen-lockfile

COPY server/ ./server/
RUN mkdir -p server/public && pnpm --filter server build
RUN pnpm --filter server deploy --legacy --prod --frozen-lockfile /app/server-runtime

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Install curl for healthcheck
RUN apt-get update -qq && apt-get install -y -qq curl ca-certificates --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/server-runtime/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/public ./public
COPY --from=build /app/server/package.json ./package.json

# 拷贝默认上传资源（uploads/壁纸 源图、defaultAvatar 等）到镜像中。
# 当挂载的命名卷为空（如执行 down -v 后）时，Docker 会用镜像里的内容初始化该卷，
# 从而保证演示数据 seed 能找到默认壁纸源图。已有卷不受影响。
COPY --from=build /app/server/uploads ./uploads
# 确保运行时所需的上传子目录存在（demo-seed 会向 wallpapers/ 写入文件，缺目录会报错）
RUN mkdir -p uploads/wallpapers uploads/thumbnails uploads/profile-pictures

EXPOSE 3000
CMD ["node", "dist/main"]
