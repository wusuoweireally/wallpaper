FROM node:22-bookworm-slim AS build

WORKDIR /app

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

# Copy runtime artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

# Ensure uploads directory exists for runtime volume mount
RUN mkdir -p /app/uploads

EXPOSE 3000
CMD ["node", "dist/main"]
