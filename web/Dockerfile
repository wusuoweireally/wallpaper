FROM node:22-bookworm-slim AS build

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Install dependencies first (better layer caching)
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# Build the Vue app
COPY web/ ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm build

FROM nginx:1.27-alpine AS runtime

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config for SPA + API proxy
COPY docker/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
