import yaml from 'js-yaml';
import { marked } from 'marked';
import katex from 'katex';
import DOMPurify from 'dompurify';

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

// 占位 token：用普通文字，marked 不会改动；回填用 split/join 避免 $ 替换陷阱
const mathPh = (i) => `xMATHPLACEHOLDERx${i}x`;
const codePh = (i) => `xCODEPLACEHOLDERx${i}x`;

function renderKatex(tex, displayMode) {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
      output: 'html',
    });
  } catch {
    return `<span class="katex-error">${tex}</span>`;
  }
}

/**
 * 把 markdown（含 LaTeX 公式）渲染为安全 HTML。
 * 顺序：保护代码 → 抽取公式占位 → marked → DOMPurify 消毒 → 回填 KaTeX（受信任）。
 */
export function renderMarkdown(md) {
  if (!md) return '';
  let src = String(md);

  // 1. 保护代码（围栏 + 行内），其中的 $ \[ 不应被当公式
  const codes = [];
  src = src.replace(/```[\s\S]*?```/g, (m) => { codes.push(m); return codePh(codes.length - 1); });
  src = src.replace(/`[^`\n]*`/g, (m) => { codes.push(m); return codePh(codes.length - 1); });

  // 2. 抽取公式（块级先于行内，$$ 先于 $）
  const maths = [];
  const pushMath = (tex, display) => { maths.push(renderKatex(tex, display)); return mathPh(maths.length - 1); };
  src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => pushMath(t, true));
  src = src.replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => pushMath(t, true));
  src = src.replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => pushMath(t, false));
  src = src.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_, t) => pushMath(t, false));

  // 3. 还原代码占位，交给 marked 正常解析代码块
  src = src.replace(/xCODEPLACEHOLDERx(\d+)x/g, (_, i) => codes[Number(i)]);

  // 4. marked → HTML（GFM 默认开启）
  let html = marked.parse(src, { breaks: true });

  // 5. DOMPurify 消毒（此时公式仍是纯文本占位，安全）
  html = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });

  // 6. 回填 KaTeX（受信任，置于消毒之后）。display 公式所在 <p> 解包，避免无效的 p>div 嵌套
  maths.forEach((mhtml, i) => {
    html = html.split(`<p>${mathPh(i)}</p>`).join(mhtml);
    html = html.split(mathPh(i)).join(mhtml);
  });
  return html;
}
