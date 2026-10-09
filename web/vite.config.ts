import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { fileURLToPath, URL } from "node:url"

// 生产构建才把带哈希的 js/css/字体写成 CDN 绝对地址。
// 留空或 /：地址仍是 /assets/...，由 Nginx 提供，本地 dev 走这条。
// 例：https://cdn.example.com/web/ → index.html 里变成
// https://cdn.example.com/web/assets/index-xxx.js
// 必须以 / 结尾。index.html 本身仍由 Nginx 发，/api 才能同源。
// /icon.svg 这类 public 文件也会被改成桶地址，和 dist 里其它文件一起上传。
function resolveAssetBase(): string {
  const raw = (process.env.VITE_ASSET_BASE || "/").trim()
  if (raw === "" || raw === "/") return "/"
  // 判定必须与 upload-assets.mjs 一致：非 http(s) 直接构建失败，避免资源指向不存在的相对路径又不上传
  if (!/^https?:\/\//.test(raw)) {
    throw new Error(`VITE_ASSET_BASE 必须是 http(s):// 开头的完整地址，当前值：${raw}`)
  }
  return raw.endsWith("/") ? raw : `${raw}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: resolveAssetBase(),
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "iconify-icon",
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist", // 构建输出目录
    emptyOutDir: true, // 构建前清空输出目录
  },
  server: {
    port: 1234,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
