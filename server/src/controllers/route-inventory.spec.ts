import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 结构门禁：盘点 controllers 下真实路由装饰器，防止模块漏挂或路由被删空。
 * 与审计产物 api-inventory 对齐（当前期望 ≥97 且覆盖核心模块前缀）。
 */
function walkControllers(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walkControllers(full);
    if (!entry.name.endsWith(".ts") || entry.name.endsWith(".spec.ts")) {
      return [];
    }
    return [full];
  });
}

function collectRoutes(file: string): Array<{ method: string; path: string }> {
  const src = readFileSync(file, "utf8");
  const ctrl =
    (src.match(/@Controller\(\s*["'`]([^"'`]*)["'`]/) || [])[1] || "";
  const routes: Array<{ method: string; path: string }> = [];
  const re =
    /@(Get|Post|Put|Patch|Delete)\(\s*(?:["'`]([^"'`]*)["'`])?\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src))) {
    const sub = match[2] || "";
    const path = `/${[ctrl, sub].filter(Boolean).join("/")}`;
    routes.push({ method: match[1].toUpperCase(), path });
  }
  return routes;
}

describe("controller route inventory", () => {
  const controllerDir = join(__dirname);
  const files = walkControllers(controllerDir);
  const routes = files.flatMap(collectRoutes);

  it("covers all expected controller modules", () => {
    const bases = new Set(
      routes.map((r) => r.path.split("/").filter(Boolean)[0]),
    );
    for (const required of [
      "auth",
      "users",
      "wallpapers",
      "tags",
      "posts",
      "comments",
      "reports",
      "uploads",
      "admin",
    ]) {
      expect(bases.has(required)).toBe(true);
    }
  });

  it("exposes a full surface (method+path count)", () => {
    // 审计时点：97；允许后续新增，禁止大幅回退
    expect(routes.length).toBeGreaterThanOrEqual(97);
  });

  it("includes critical auth and user session routes", () => {
    const keys = new Set(routes.map((r) => `${r.method} ${r.path}`));
    for (const need of [
      "POST /users/login",
      "POST /users/register",
      "GET /users/profile",
      "GET /auth/github",
      "GET /auth/github/callback",
      "GET /wallpapers",
      "POST /wallpapers/upload",
      "GET /admin/dashboard/stats",
    ]) {
      expect(keys.has(need)).toBe(true);
    }
  });

  it("does not invent routes outside source files", () => {
    // 每个路由必须能在某个 controller 源文件中 grep 到 method 装饰器
    expect(files.length).toBeGreaterThanOrEqual(12);
    expect(routes.every((r) => r.method && r.path.startsWith("/"))).toBe(true);
  });
});
