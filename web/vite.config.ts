import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { fileURLToPath, URL } from "node:url"

// 生产构建才把带哈希的 js/css/字体写成 CDN 绝对地址。
// 留空或 /：地址仍是 /assets/...，由 Nginx 提供，本地 dev 走这条。
// 例：https://cdn.example.com/web/ → index.html 里变成
// https://cdn.example.com/web/assets/index-xxx.js
// 必须以 / 结尾。index.html 本身仍由 Nginx 发，/api 才能同源。
// Vite 会把 index.html 里以 / 开头的地址也加上 base，public 文件要改回站点根路径。
function resolveAssetBase(): string {
  const raw = (process.env.VITE_ASSET_BASE || "/").trim()
  if (raw === "" || raw === "/") return "/"
  // 判定必须与 upload-assets.mjs 一致：非 http(s) 直接构建失败，避免资源指向不存在的相对路径又不上传
  if (!/^https?:\/\//.test(raw)) {
    throw new Error(`VITE_ASSET_BASE 必须是 http(s):// 开头的完整地址，当前值：${raw}`)
  }
  return raw.endsWith("/") ? raw : `${raw}/`
}

const assetBase = resolveAssetBase()

// base 会把 /icon.svg 写成桶地址，但上传只覆盖 dist/assets。
// 非 assets 的地址改回 /，继续由 Nginx 提供。
function keepPublicOnSite() {
  return {
    name: "keep-public-on-site",
    transformIndexHtml: {
      order: "post" as const,
      handler(html: string) {
        if (!assetBase.startsWith("http")) return html
        return html.replaceAll(assetBase, (match, offset) => {
          const rest = html.slice(offset + match.length)
          return rest.startsWith("assets/") ? match : "/"
        })
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: assetBase,
  plugins: [
    keepPublicOnSite(),
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
