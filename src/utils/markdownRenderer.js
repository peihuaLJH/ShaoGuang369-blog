import yaml from 'js-yaml';

// 匹配文件开头的 YAML frontmatter：--- 换行 ... 换行 ---
const FRONTMATTER_RE = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * 解析 markdown 开头的 YAML frontmatter。
 * @returns {{ data: object, content: string }}
 */
export function parseFrontmatter(text) {
  const src = String(text == null ? '' : text);
  const m = src.match(FRONTMATTER_RE);
  if (!m) return { data: {}, content: src };
  try {
    const data = yaml.load(m[1]);
    if (!data || typeof data !== 'object') return { data: {}, content: src };
    return { data, content: src.slice(m[0].length) };
  } catch {
    return { data: {}, content: src };
  }
}
