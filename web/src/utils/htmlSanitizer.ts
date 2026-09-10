/**
 * HTML 清理工具
 * 用于清理用户输入的 HTML，防止 XSS 攻击
 *
 * 使用 DOMPurify 进行专业的 XSS 防护
 * @see https://github.com/cure53/DOMPurify
 */

import DOMPurify from "dompurify"

/**
 * 允许的 HTML 标签白名单
 * 仅保留基本的富文本格式化标签
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "code",
  "pre",
  "div",
  "span",
  "hr",
  "sub",
  "sup",
  "del",
  "ins",
]

/**
 * 允许的 HTML 属性白名单
 */
const ALLOWED_ATTR = ["href", "title", "target", "rel", "class"]

/**
 * DOMPurify 配置
 */
const SANITIZE_CONFIG = {
  // 白名单外的标签/属性一律剔除（注意：不可加 USE_PROFILES，否则 DOMPurify 会忽略白名单）
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  // 链接自动添加 rel="noopener noreferrer"
  ADD_ATTR: ["target"],
}

/**
 * 清理 HTML 字符串，移除不安全的标签和属性
 * @param html - 原始 HTML 字符串
 * @returns 清理后的安全 HTML 字符串
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  // 使用 DOMPurify 清理 HTML
  const cleaned = DOMPurify.sanitize(html, SANITIZE_CONFIG)

  // 确保所有外部链接都有安全属性
  return addLinkSecurityAttributes(cleaned)
}

/**
 * 为所有链接补上 target / rel 安全属性。
 * 走 DOMParser 而非正则重建 `<a>` 标签：正则只捕获 href 之前的属性，
 * 重建时会把 href 之后的属性（如 title/class）整段丢掉。
 * 入参已过 DOMPurify，此处只加属性、其余原样保留。
 */
function addLinkSecurityAttributes(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")

  for (const anchor of doc.querySelectorAll("a[href]")) {
    if (!anchor.hasAttribute("target")) {
      anchor.setAttribute("target", "_blank")
    }
    if (!anchor.hasAttribute("rel")) {
      anchor.setAttribute("rel", "noopener noreferrer")
    }
  }

  return doc.body.innerHTML
}

/**
 * 移除所有 HTML 标签，只保留纯文本
 * @param html - 原始 HTML 字符串
 * @returns 纯文本字符串
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  // 移除 HTML 标签
  const text = html.replace(/<[^>]*>/g, "")

  // 解码 HTML 实体
  const textarea = document.createElement("textarea")
  textarea.innerHTML = text
  return textarea.value
}

/**
 * 截断 HTML 内容，保留指定长度的纯文本
 * @param html - 原始 HTML 字符串
 * @param maxLength - 最大长度
 * @returns 截断后的 HTML 字符串
 */
export function truncateHtml(html: string, maxLength: number = 200): string {
  const text = stripHtml(html)
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}
