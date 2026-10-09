import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import COS from "cos-nodejs-sdk-v5"

const CONTENT_TYPE = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".map": "application/json",
}

// 只上传 dist/assets。index.html、robots、public 图片留给 Nginx。
// 对象键 = CDN 地址的路径 + assets 内相对路径。
// https://cdn.example.com/web/ + assets/index-xxx.js
//   → 键 web/assets/index-xxx.js
const base = (process.env.VITE_ASSET_BASE || "/").trim()
if (base === "" || base === "/" || !base.startsWith("http")) {
  console.log("VITE_ASSET_BASE 未指向 CDN，跳过前端资源上传")
  process.exit(0)
}

const required = ["COS_SECRET_ID", "COS_SECRET_KEY", "COS_BUCKET", "COS_REGION"]
const missing = required.filter((key) => !process.env[key])
if (missing.length) {
  console.error(`前端资源要上传，但缺少 ${missing.join(", ")}`)
  process.exit(1)
}

const assetBase = base.endsWith("/") ? base : `${base}/`
const prefix = new URL(assetBase).pathname.replace(/^\/+/, "")
const assetsDir = path.resolve(import.meta.dirname, "../dist/assets")
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
})

const files = await collectFiles(assetsDir)
console.log(`上传 ${files.length} 个哈希资源到 ${process.env.COS_BUCKET}/${prefix}assets/`)
await mapPool(files, 8, (filePath) => putAsset(filePath))
console.log("前端哈希资源上传完成")

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await collectFiles(fullPath)))
    else if (entry.isFile()) files.push(fullPath)
  }
  return files
}

async function putAsset(filePath) {
  const relative = path.relative(assetsDir, filePath).split(path.sep).join("/")
  const key = `${prefix}assets/${relative}`
  const ext = path.extname(filePath)
  const body = await readFile(filePath)
  await new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: process.env.COS_BUCKET,
        Region: process.env.COS_REGION,
        Key: key,
        Body: body,
        ContentType: CONTENT_TYPE[ext] || "application/octet-stream",
        // 文件名带内容哈希，可以长期缓存。桶默认私有，这里直接公开读，CDN 才能回源。
        CacheControl: "public, max-age=31536000, immutable",
        ACL: "public-read",
      },
      (err) => (err ? reject(new Error(`${key} ${err.message || err}`)) : resolve()),
    )
  })
}

async function mapPool(items, limit, worker) {
  let index = 0
  async function run() {
    while (index < items.length) {
      const current = index
      index += 1
      await worker(items[current])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()))
}
