FROM node:22-bookworm-slim AS build

WORKDIR /app

# 关闭 corepack 下载确认提示（非交互式构建必需）；pnpm 版本由 package.json 的 packageManager 字段锁定为 10.x
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Enable pnpm via corepack
RUN corepack enable

# Install dependencies first (better layer caching)
COPY server/package.json server/pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# Build the NestJS app
COPY server/ ./
RUN mkdir -p /app/public
RUN pnpm build
RUN pnpm prune --prod

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Install curl for healthcheck
RUN apt-get update -qq && apt-get install -y -qq curl ca-certificates --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy runtime artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

# 拷贝默认上传资源（uploads/壁纸 源图、defaultAvatar 等）到镜像中。
# 当挂载的命名卷为空（如执行 down -v 后）时，Docker 会用镜像里的内容初始化该卷，
# 从而保证演示数据 seed 能找到默认壁纸源图。已有卷不受影响。
COPY --from=build /app/uploads ./uploads
# 确保运行时所需的上传子目录存在（demo-seed 会向 wallpapers/ 写入文件，缺目录会报错）
RUN mkdir -p uploads/wallpapers uploads/thumbnails uploads/profile-pictures

EXPOSE 3000
CMD ["node", "dist/main"]
