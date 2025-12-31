# Repository Guidelines

# 用中文回答我的问题

## Project Structure & Module Organization

- Backend lives in `server/` (NestJS + TypeORM). Core folders: `src/controllers/` for HTTP endpoints, `src/services/` for orchestration, `src/modules/` for wiring, `src/entities/` and `src/dto/` for persistence and payloads. Shared infra sits in `src/config/`, `src/decorators/`, and `src/modules/`. Static and uploads are served from `server/public/` and `server/uploads/`.
- Frontend lives in `web/` (Vue 3 + Vite). Key areas: `src/components/`, `src/views/`, `src/stores/` (Pinia), `src/services/` for API wrappers, `src/router/` for navigation, and Tailwind styles in `src/style.css` plus `src/assets/`.

## Build, Test, and Development Commands

- Backend: `cd server && pnpm install` to set up; `pnpm start:dev` for live reload; `pnpm build` then `pnpm start:prod` for compiled run; `pnpm test` for Jest suite; migrations via `pnpm typeorm:generate -- src/migrations/Name` then `pnpm typeorm:run`.
- Frontend: `cd web && pnpm dev` for HMR; `pnpm build` for production bundle; `pnpm preview` to serve the build locally.

## Coding Style & Naming Conventions

- TypeScript-first, 2-space indent, avoid `any`, prefer `const`.
- Nest patterns: files end with `.module.ts`, `.controller.ts`, `.service.ts`; entities are singular PascalCase.
- Vue: components in PascalCase `.vue`; composables/stores use `useThing` or `thing.store.ts`.
- Formatting: run `pnpm exec eslint "src/**/*.ts"` in `server/` and `pnpm exec prettier --check "src/**/*.{ts,vue}"` in `web/` (Tailwind classes auto-sorted).

## Testing Guidelines

- Backend tests use Jest/ts-jest; place specs as `*.spec.ts` near the unit or in `server/test/`.
- Aim for ≥80% coverage (see `coverage/`). Mock external services; add Supertest e2e specs for new controllers.
- Frontend currently lacks an automated suite; if adding, follow Vite/Vitest defaults with `__tests__/` near the view.

## Commit & Pull Request Guidelines

- Use Conventional Commits with scope: `type(scope): summary` (e.g., `feat(server): add wallpaper moderation`). Scopes commonly `server`, `web`, or shared config.
- PRs: concise summary, linked issue/task IDs, screenshots/GIFs for UI changes, database/migration notes when entities change, and a checklist of tests run (`pnpm test`, `pnpm build`, manual API calls).

## Environment & Configuration Tips

- Backend config via `.env` and `@nestjs/config`; mirror `server/src/config/database.config.ts` for local overrides. Keep `NODE_ENV=development` for `synchronize: true`; disable and run migrations in production.
- Frontend API origins come from `web/src/config` and Vite env files (`.env.local`); do not commit secrets. Uploaded assets persist under `server/uploads/`.
