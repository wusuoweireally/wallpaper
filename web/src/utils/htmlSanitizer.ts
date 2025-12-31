/**
 * HTML 清理工具
 * 用于清理用户输入的 HTML，防止 XSS 攻击
 *
 * 使用 DOMPurify 进行专业的 XSS 防护
 * @see https://github.com/cure53/DOMPurify
 */

import * as DOMPurify from 'dompurify';

/**
 * 允许的 HTML 标签白名单
 * 仅保留基本的富文本格式化标签
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre', 'div', 'span',
  'hr', 'sub', 'sup', 'del', 'ins'
];

/**
 * 允许的 HTML 属性白名单
 */
const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel', 'class'
];

/**
 * DOMPurify 配置
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  // 允许数据 URI（用于图片）
  ALLOW_DATA_ATTR: false,
  // 允许 svg 标签
  USE_PROFILES: { html: true },
  // 添加安全属性到链接
  ADD_ATTR: ['target'],
  // 链接自动添加 rel="noopener noreferrer"
  FORBID_TAGS: ['script', 'style', 'iframe', 'embed', 'object', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
};

/**
 * 清理 HTML 字符串，移除不安全的标签和属性
 * @param html - 原始 HTML 字符串
 * @returns 清理后的安全 HTML 字符串
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // 使用 DOMPurify 清理 HTML
  const cleaned = DOMPurify.sanitize(html, SANITIZE_CONFIG);

  // 确保所有外部链接都有安全属性
  return addLinkSecurityAttributes(cleaned);
}

/**
 * 为所有链接添加安全属性
 * @param html - HTML 字符串
 * @returns 处理后的 HTML
 */
function addLinkSecurityAttributes(html: string): string {
  return html.replace(
    /<a\s+(?:([^>]*?)href=["']([^"']+)["'][^>]*)>/gi,
    (_match, beforeHref, href) => {
      let attrs = beforeHref || '';

      // 添加 target="_blank" 如果没有
      if (!attrs.includes('target=')) {
        attrs += ' target="_blank"';
      }

      // 添加 rel="noopener noreferrer" 如果没有
      if (!attrs.includes('rel=')) {
        attrs += ' rel="noopener noreferrer"';
      }

      return `<a ${attrs}href="${href}">`;
    }
  );
}

/**
 * 移除所有 HTML 标签，只保留纯文本
 * @param html - 原始 HTML 字符串
 * @returns 纯文本字符串
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // 移除 HTML 标签
  const text = html.replace(/<[^>]*>/g, '');

  // 解码 HTML 实体
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * 截断 HTML 内容，保留指定长度的纯文本
 * @param html - 原始 HTML 字符串
 * @param maxLength - 最大长度
 * @returns 截断后的 HTML 字符串
 */
export function truncateHtml(html: string, maxLength: number = 200): string {
  const text = stripHtml(html);
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
