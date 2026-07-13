/**
 * TypeScript 7 兼容钩子：把 require('typescript') 重定向到 TypeScript 6.x。
 *
 * 主依赖 typescript@7 提供原生 tsc。
 * eslint / ts-jest / vue-tsc 需旧版 API → 使用 @typescript/typescript6
 * 依赖树中的真实实现（@typescript/old 或 typescript6-runtime）。
 *
 * 用法：node -r ./scripts/ts6-resolve-hook.cjs <tool> [args...]
 */
const Module = require("module");
const path = require("path");
const fs = require("fs");

function findTs6Root() {
  const bases = [
    path.join(__dirname, "..", "server", "node_modules"),
    path.join(__dirname, "..", "web", "node_modules"),
    path.join(__dirname, "..", "node_modules"),
  ];

  // 1) Prefer real TS6 via @typescript/typescript6 → @typescript/old
  for (const base of bases) {
    const ts6Dir = path.join(base, "@typescript", "typescript6");
    if (!fs.existsSync(path.join(ts6Dir, "package.json"))) continue;
    try {
      const req = Module.createRequire(path.join(ts6Dir, "package.json"));
      return path.dirname(req.resolve("@typescript/old/package.json"));
    } catch {
      // continue
    }
  }

  // 2) Explicit alias package typescript6-runtime@npm:typescript@6
  for (const base of bases) {
    const alias = path.join(base, "typescript6-runtime", "package.json");
    if (fs.existsSync(alias)) {
      return path.dirname(fs.realpathSync(alias));
    }
  }

  // 3) Fallback createRequire from cwd
  try {
    const req = Module.createRequire(path.join(process.cwd(), "package.json"));
    try {
      return path.dirname(req.resolve("@typescript/old/package.json"));
    } catch {
      return path.dirname(req.resolve("typescript6-runtime/package.json"));
    }
  } catch (err) {
    throw new Error(
      "Cannot locate TypeScript 6 for tooling. Install @typescript/typescript6 (and optionally typescript6-runtime@npm:typescript@6).",
      { cause: err },
    );
  }
}

const ts6Root = findTs6Root();

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "typescript" || request.startsWith("typescript/")) {
    const target =
      request === "typescript"
        ? path.join(ts6Root, "lib", "typescript.js")
        : path.join(ts6Root, request.slice("typescript/".length));
    try {
      return originalResolve.call(this, target, parent, isMain, options);
    } catch {
      // fall through
    }
  }
  return originalResolve.call(this, request, parent, isMain, options);
};
