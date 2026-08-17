import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** 读已上线卡片源码：overlay 默认隐藏、hover/聚焦才显示；不渲染作者名；收藏在 overlay 行内 */
const cardPath = join(dirname(fileURLToPath(import.meta.url)), "../components/WallpaperCard.vue")
const src = readFileSync(cardPath, "utf8")

const overlayBlock = src.slice(src.indexOf("wb-card-overlay"), src.indexOf("</article>"))
assert.ok(
  !overlayBlock.includes('data-overlay="uploader"'),
  "uploader must not render on card overlay",
)
assert.ok(overlayBlock.includes('data-overlay="views"'), "views on overlay")
assert.ok(overlayBlock.includes('data-overlay="favorite"'), "favorite on overlay")
assert.ok(src.includes('data-overlay="quality"'), "quality badge present")
assert.ok(src.includes("group-hover:opacity-100"), "overlay/quality revealed on hover")
assert.ok(
  !/favorite-action\s*\{[^}]*position:\s*absolute/.test(src),
  "favorite must sit in the overlay row, not absolute-stack on views",
)
console.log("wallpaperCard.overlay.test.ts: all passed")
