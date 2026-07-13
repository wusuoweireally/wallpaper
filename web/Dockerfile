FROM node:22-bookworm-slim AS build

WORKDIR /app

# 关闭 corepack 下载确认提示（非交互式构建必需）；pnpm 版本由 package.json 的 packageManager 字段锁定为 10.x
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# 与 server 镜像一致：统一使用根 lockfile / workspace，禁止依赖已删除的 web/pnpm-lock.yaml
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json ./web/package.json
COPY server/package.json ./server/package.json
RUN pnpm install --frozen-lockfile

COPY web/ ./web/
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/web/dist /usr/share/nginx/html
COPY docker/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
