# 一键导入 Markdown 笔记 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在博客后台「新建文章」加「导入 Markdown」按钮，把含 LaTeX 公式的 markdown 笔记完整导入并在博客中保真渲染。

**Architecture:** 给文章加 `contentFormat: 'html'|'markdown'` 标记。导入的笔记原文存 markdown，显示/预览用 `marked`+`KaTeX` 渲染，编辑用源码框；手写文章仍走 Quill（html），互不影响。

**Tech Stack:** React (CRA 5 / react-scripts 5.0.1, jest+jsdom)、Express + Mongoose、marked@17、katex、dompurify、js-yaml。

---

## File Structure

- **新建** `src/utils/markdownRenderer.js` — 纯函数：`parseFrontmatter`、`renderMarkdown`、`importMarkdownFile`。单一职责：markdown→安全HTML & 笔记字段解析。
- **新建** `src/utils/markdownRenderer.test.js` — 单元/集成测试。
- **新建** `src/utils/__tests__/fixtures/note-dollar.md`、`note-bracket.md` — 用户两个真实笔记（含 `$$` 与 `\[` 两种公式语法）作为 fixture。
- **修改** `package.json` — 补依赖声明 + jest.transformIgnorePatterns。
- **修改** `backend/models/Post.js` — 加 `contentFormat`。
- **修改** `backend/routes/posts.js` — 创建/更新读写 `contentFormat`。
- **修改** `src/admin/AdminPanel.js` — PostEditor 加导入按钮 + markdown 源码编辑/预览 + 保存带 contentFormat。
- **修改** `src/pages/PostDetail.js` — markdown 文章用 renderMarkdown 渲染。
- **修改** `src/index.js` — 引入 KaTeX CSS。
- **修改** `src/index.css` 或 `src/App.css` — markdown 内容元素样式。

---

## Task 1: 依赖与 jest 配置

**Files:**
- Modify: `package.json`
- Install: `katex`

- [ ] **Step 1: 安装 katex**

Run: `npm install katex`
Expected: katex 写入 dependencies，node_modules/katex 出现。

- [ ] **Step 2: 在 package.json dependencies 补声明已存在于 node_modules 的库**

确保 `dependencies` 含（marked/dompurify/js-yaml 当前在 node_modules 但未声明）：
```json
"dompurify": "^3.2.7",
"js-yaml": "^4.1.1",
"katex": "^0.16.11",
"marked": "^17.0.6",
```
（版本以实际安装为准；用 `npm ls marked dompurify js-yaml katex` 核对后填真实版本号。）

- [ ] **Step 3: 加 jest 配置让 marked(ESM) 被转译**

在 package.json 顶层加（与 "eslintConfig" 平级）：
```json
"jest": {
  "transformIgnorePatterns": [
    "[/\\\\]node_modules[/\\\\](?!marked[/\\\\]).+\\.(js|jsx|mjs|cjs|ts|tsx)$",
    "^.+\\.module\\.(css|sass|scss)$"
  ]
}
```

- [ ] **Step 4: 冒烟验证 import 不报错**

临时建 `src/utils/_smoke.test.js`：
```js
test('marked & katex import', () => {
  const { marked } = require('marked');
  const katex = require('katex');
  expect(typeof marked.parse).toBe('function');
  expect(katex.renderToString('a+b', { throwOnError: false })).toContain('katex');
});
```
Run: `npx react-scripts test --watchAll=false src/utils/_smoke.test.js`
Expected: PASS。然后删除该文件。

- [ ] **Step 5: Commit**
```bash
git add package.json package-lock.json
git commit -m "build: 引入 katex 并声明 markdown 相关依赖、配置 jest 转译 marked"
```

---

## Task 2: parseFrontmatter

**Files:**
- Create: `src/utils/markdownRenderer.js`
- Test: `src/utils/markdownRenderer.test.js`

- [ ] **Step 1: 写失败测试**
```js
import { parseFrontmatter } from './markdownRenderer';

test('无 frontmatter 时原样返回', () => {
  const { data, content } = parseFrontmatter('# 标题\n正文');
  expect(data).toEqual({});
  expect(content).toBe('# 标题\n正文');
});

test('解析 YAML frontmatter', () => {
  const md = `---\ntitle: 我的笔记\ntags: [a, b]\n---\n正文内容`;
  const { data, content } = parseFrontmatter(md);
  expect(data.title).toBe('我的笔记');
  expect(data.tags).toEqual(['a', 'b']);
  expect(content).toBe('正文内容');
});

test('YAML 解析失败时回退为无 frontmatter', () => {
  const md = `---\n: : bad yaml :\n---\nx`;
  const { data, content } = parseFrontmatter(md);
  expect(data).toEqual({});
  expect(content).toBe(md);
});
```

- [ ] **Step 2: 运行确认失败**
Run: `npx react-scripts test --watchAll=false src/utils/markdownRenderer.test.js`
Expected: FAIL（parseFrontmatter is not a function）。

- [ ] **Step 3: 实现**
```js
import yaml from 'js-yaml';

const FRONTMATTER_RE = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(text) {
  const m = text.match(FRONTMATTER_RE);
  if (!m) return { data: {}, content: text };
  try {
    const data = yaml.load(m[1]);
    if (!data || typeof data !== 'object') return { data: {}, content: text };
    return { data, content: text.slice(m[0].length) };
  } catch {
    return { data: {}, content: text };
  }
}
```

- [ ] **Step 4: 运行确认通过**
Run: `npx react-scripts test --watchAll=false src/utils/markdownRenderer.test.js`
Expected: PASS。

- [ ] **Step 5: Commit**
```bash
git add src/utils/markdownRenderer.js src/utils/markdownRenderer.test.js
git commit -m "feat: parseFrontmatter 解析 markdown YAML 元信息"
```

---

## Task 3: renderMarkdown（核心：公式 + markdown → 安全 HTML）

**Files:**
- Modify: `src/utils/markdownRenderer.js`
- Test: `src/utils/markdownRenderer.test.js`

- [ ] **Step 1: 写失败测试**
```js
import { renderMarkdown } from './markdownRenderer';

test('块级公式 $$..$$ 渲染为 katex', () => {
  const html = renderMarkdown('$$111 - 65 = 46$$');
  expect(html).toContain('katex');
  expect(html).not.toContain('$$');
});

test('块级公式 \\[..\\] 渲染为 katex（含换行）', () => {
  const html = renderMarkdown('\\[\n\\frac{a}{b} \\approx 1\n\\]');
  expect(html).toContain('katex');
  expect(html).not.toContain('\\[');
});

test('行内公式 $..$ 渲染', () => {
  const html = renderMarkdown('成本约 $x=65$ 泰铢');
  expect(html).toContain('katex');
});

test('常规 markdown 元素', () => {
  const html = renderMarkdown('# H1\n\n## H2\n\n- a\n- b\n\n**粗**\n\n> 引用\n\n---');
  expect(html).toMatch(/<h1[^>]*>H1<\/h1>/);
  expect(html).toMatch(/<h2/);
  expect(html).toMatch(/<ul>[\s\S]*<li>a<\/li>/);
  expect(html).toContain('<strong>粗</strong>');
  expect(html).toContain('<blockquote>');
  expect(html).toContain('<hr');
});

test('代码块内的 $ 不被当公式', () => {
  const html = renderMarkdown('```\nprice = $5\n```');
  expect(html).toContain('price = $5');
  expect(html).not.toContain('katex');
});

test('消毒：剥离 script', () => {
  const html = renderMarkdown('正常<script>alert(1)</script>');
  expect(html).not.toContain('<script>');
});
```

- [ ] **Step 2: 运行确认失败**
Run: `npx react-scripts test --watchAll=false src/utils/markdownRenderer.test.js`
Expected: FAIL（renderMarkdown is not a function）。

- [ ] **Step 3: 实现**
在文件顶部补 import，追加实现：
```js
import { marked } from 'marked';
import katex from 'katex';
import DOMPurify from 'dompurify';

// 占位 token：用普通文字，marked 不会改动；回填用 split/join 避免 $ 替换陷阱
const ph = (i) => `xMATHPLACEHOLDERx${i}x`;
const codePh = (i) => `xCODEPLACEHOLDERx${i}x`;

function renderKatex(tex, displayMode) {
  try {
    return katex.renderToString(tex.trim(), { displayMode, throwOnError: false, output: 'html' });
  } catch {
    return `<span class="katex-error">${tex}</span>`;
  }
}

export function renderMarkdown(md) {
  if (!md) return '';
  let src = String(md);

  // 1. 先保护代码（围栏 + 行内），其中的 $ \[ 不应被当公式
  const codes = [];
  src = src.replace(/```[\s\S]*?```/g, (m) => { codes.push(m); return codePh(codes.length - 1); });
  src = src.replace(/`[^`\n]*`/g, (m) => { codes.push(m); return codePh(codes.length - 1); });

  // 2. 抽取公式（块级先于行内）
  const maths = [];
  const pushMath = (tex, display) => { maths.push(renderKatex(tex, display)); return ph(maths.length - 1); };
  src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => pushMath(t, true));
  src = src.replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => pushMath(t, true));
  src = src.replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => pushMath(t, false));
  src = src.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_, t) => pushMath(t, false));

  // 3. 还原代码占位再交给 marked（保留代码原文，markdown 正常解析代码块）
  src = src.replace(/xCODEPLACEHOLDERx(\d+)x/g, (_, i) => codes[Number(i)]);

  // 4. marked → HTML（GFM 默认开启）
  let html = marked.parse(src, { breaks: true });

  // 5. DOMPurify 消毒（公式仍是纯文本占位，安全）
  html = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });

  // 6. 回填 KaTeX HTML（受信任，置于消毒之后）。display 公式所在 <p> 解包，避免 p>div 嵌套
  maths.forEach((mhtml, i) => {
    html = html.split(`<p>${ph(i)}</p>`).join(mhtml);
    html = html.split(ph(i)).join(mhtml);
  });
  return html;
}
```

- [ ] **Step 4: 运行确认通过**
Run: `npx react-scripts test --watchAll=false src/utils/markdownRenderer.test.js`
Expected: PASS。若 DOMPurify 剥离了 `.katex` 相关——本设计公式在消毒后回填，不受影响；若某测试因 `breaks:true` 导致额外 `<br>`，调整断言为包含匹配。

- [ ] **Step 5: Commit**
```bash
git add src/utils/markdownRenderer.js src/utils/markdownRenderer.test.js
git commit -m "feat: renderMarkdown 支持 \$\$/\\[ 公式与 markdown 安全渲染"
```

---

## Task 4: importMarkdownFile（字段抽取）

**Files:**
- Modify: `src/utils/markdownRenderer.js`
- Test: `src/utils/markdownRenderer.test.js`

- [ ] **Step 1: 写失败测试**
```js
import { importMarkdownFile } from './markdownRenderer';

test('frontmatter 优先取标题与标签', () => {
  const md = `---\ntitle: A\ntags: [x, y]\ncategory: 技术\nsummary: 摘要\ncover: http://e/c.png\n---\n正文`;
  const r = importMarkdownFile(md, 'file.md');
  expect(r.title).toBe('A');
  expect(r.tags).toBe('x, y');
  expect(r.category).toBe('技术');
  expect(r.summary).toBe('摘要');
  expect(r.coverImage).toBe('http://e/c.png');
  expect(r.content).toBe('正文');
});

test('无 frontmatter 时取首个 # 标题并从正文剥离', () => {
  const md = `> 引用\n\n# 真标题\n\n正文段落`;
  const r = importMarkdownFile(md, 'fallback.md');
  expect(r.title).toBe('真标题');
  expect(r.content).not.toMatch(/#\s*真标题/);
  expect(r.content).toContain('正文段落');
  expect(r.content).toContain('> 引用');
});

test('既无 frontmatter 也无 H1 时用文件名', () => {
  const r = importMarkdownFile('纯正文', '我的笔记.md');
  expect(r.title).toBe('我的笔记');
});

test('tags 为字符串也兼容', () => {
  const r = importMarkdownFile(`---\ntags: a, b\n---\nx`, 'f.md');
  expect(r.tags).toBe('a, b');
});
```

- [ ] **Step 2: 运行确认失败**
Run: `npx react-scripts test --watchAll=false src/utils/markdownRenderer.test.js`
Expected: FAIL。

- [ ] **Step 3: 实现**
```js
function normalizeTags(t) {
  if (Array.isArray(t)) return t.map((x) => String(x).trim()).filter(Boolean).join(', ');
  if (typeof t === 'string') return t.split(/[,，]/).map((x) => x.trim()).filter(Boolean).join(', ');
  return '';
}
function firstOf(data, keys) {
  for (const k of keys) if (data[k] != null && data[k] !== '') return data[k];
  return '';
}

export function importMarkdownFile(text, filename = '') {
  const { data, content } = parseFrontmatter(text);
  let body = content;
  let title = data.title ? String(data.title) : '';

  if (!title) {
    const m = body.match(/^[\s\S]*?^#\s+(.+?)\s*$/m); // 首个 H1
    const h1 = body.match(/^#\s+(.+?)\s*$/m);
    if (h1) {
      title = h1[1].trim();
      body = body.replace(h1[0], '').replace(/^\s*\n/, '');
    }
  }
  if (!title) title = filename.replace(/\.(md|markdown|txt)$/i, '') || '未命名';

  let category = firstOf(data, ['category', 'categories']);
  if (Array.isArray(category)) category = category[0] || '';

  return {
    title,
    content: body.trim(),
    tags: normalizeTags(data.tags),
    category: category ? String(category) : '',
    summary: String(firstOf(data, ['summary', 'description', 'excerpt']) || ''),
    coverImage: String(firstOf(data, ['cover', 'coverImage', 'banner']) || ''),
  };
}
```
（删除测试里没用到的 `firstOf` 的多余变量 `m`——保留 `h1` 即可；实现中去掉 `const m = ...` 那行。）

- [ ] **Step 4: 运行确认通过**
Run: `npx react-scripts test --watchAll=false src/utils/markdownRenderer.test.js`
Expected: PASS。

- [ ] **Step 5: Commit**
```bash
git add src/utils/markdownRenderer.js src/utils/markdownRenderer.test.js
git commit -m "feat: importMarkdownFile 抽取标题/标签/分类/摘要/封面"
```

---

## Task 5: 用两个真实笔记做集成测试

**Files:**
- Create: `src/utils/__tests__/fixtures/note-dollar.md`（复制 p04 文件，含 `$$`）
- Create: `src/utils/__tests__/fixtures/note-bracket.md`（复制 p03 文件，含 `\[`）
- Modify: `src/utils/markdownRenderer.test.js`

- [ ] **Step 1: 复制 fixture**
把用户两个 .md 原文写入上述两个 fixture 路径（保留全部内容）。

- [ ] **Step 2: 写集成测试**
```js
import fs from 'fs';
import path from 'path';
const read = (f) => fs.readFileSync(path.join(__dirname, '__tests__/fixtures', f), 'utf8');

test('真实笔记A($$)：标题提取 + 公式渲染', () => {
  const r = importMarkdownFile(read('note-dollar.md'), 'note-dollar.md');
  expect(r.title).toContain('TikTok');           // 来自首个 # 标题
  const html = renderMarkdown(r.content);
  expect(html).toContain('katex');               // 公式已渲染
  expect(html).not.toContain('$$');              // 无残留分隔符
  expect(html).toMatch(/<h2/);                   // 二级标题
  expect(html).toContain('<blockquote>');        // 引用块
});

test('真实笔记B(\\[)：公式渲染', () => {
  const r = importMarkdownFile(read('note-bracket.md'), 'note-bracket.md');
  const html = renderMarkdown(r.content);
  expect(html).toContain('katex');
  expect(html).not.toContain('\\[');
  expect(html).not.toContain('\\frac');          // frac 已被 katex 消化
});
```

- [ ] **Step 3: 运行**
Run: `npx react-scripts test --watchAll=false src/utils/markdownRenderer.test.js`
Expected: 全部 PASS。失败则按实际输出修正 renderMarkdown（如 `\[` 跨行匹配、`$` 行内边界）。

- [ ] **Step 4: Commit**
```bash
git add src/utils/__tests__/fixtures src/utils/markdownRenderer.test.js
git commit -m "test: 用两个真实笔记验证公式与格式导入"
```

---

## Task 6: 后端 contentFormat 字段

**Files:**
- Modify: `backend/models/Post.js`
- Modify: `backend/routes/posts.js`

- [ ] **Step 1: Post 模型加字段**
在 `status` 字段后加：
```js
contentFormat: { type: String, default: 'html', enum: ['html', 'markdown'] },
```

- [ ] **Step 2: 创建文章读写 contentFormat**
`POST /`：解构与构造都加 `contentFormat`：
```js
const { title, content, summary, coverImage, category, tags, type, status, contentFormat } = req.body;
const post = new Post({
  title, content, summary, coverImage, category,
  tags: tags || [], type: type || 'blog', status: status || 'published',
  contentFormat: contentFormat || 'html',
  author: req.user._id
});
```

- [ ] **Step 3: 更新文章读写 contentFormat**
`PUT /:id`：
```js
const { title, content, summary, coverImage, category, tags, type, status, contentFormat } = req.body;
...
Object.assign(post, { title, content, summary, coverImage, category, tags, type, status, contentFormat });
```
（若 body 未带 contentFormat，保持原值：改为 `if (contentFormat) post.contentFormat = contentFormat;` 放在 Object.assign 后，避免被 undefined 覆盖。）

- [ ] **Step 4: 语法自检**
Run: `node -e "require('./backend/models/Post.js'); console.log('ok')"`（需本地有 mongoose；仅查 require 不报语法错。报连接错无妨，只看是否语法异常）
更稳妥：`node --check backend/routes/posts.js && node --check backend/models/Post.js`
Expected: 无语法错误。

- [ ] **Step 5: Commit**
```bash
git add backend/models/Post.js backend/routes/posts.js
git commit -m "feat(backend): 文章支持 contentFormat 标记 markdown 内容"
```

---

## Task 7: PostEditor 导入按钮 + markdown 编辑/预览

**Files:**
- Modify: `src/admin/AdminPanel.js`（PostEditor 组件，约 346-746 行）

- [ ] **Step 1: 引入渲染器**
文件顶部加：
```js
import { renderMarkdown, importMarkdownFile } from '../utils/markdownRenderer';
```

- [ ] **Step 2: form 初始化加 contentFormat**
`useState` 的 form 里加：`contentFormat: post?.contentFormat || 'html',`

- [ ] **Step 3: 加导入处理函数**（放在 handleSave 附近）
```js
const handleImportMarkdown = (e) => {
  const file = e.target?.files?.[0];
  e.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const r = importMarkdownFile(String(reader.result), file.name);
      if (form.content.trim() && !window.confirm('将用导入内容覆盖当前编辑内容，确定？')) return;
      setForm((f) => ({
        ...f,
        title: r.title || f.title,
        content: r.content,
        contentFormat: 'markdown',
        tags: r.tags || f.tags,
        summary: r.summary || f.summary,
        category: type === 'blog' ? (r.category || f.category) : f.category,
        coverImage: type === 'blog' ? (r.coverImage || f.coverImage) : f.coverImage,
      }));
      const parts = ['标题', r.tags && '标签', r.summary && '摘要', r.category && '分类'].filter(Boolean);
      showToast(`已导入 Markdown（${parts.join('、')}）`);
    } catch (err) {
      showToast('导入失败: ' + err.message, 'error');
    }
  };
  reader.onerror = () => showToast('文件读取失败', 'error');
  reader.readAsText(file);
};
```

- [ ] **Step 4: 顶部操作区加按钮**（在「预览/取消/保存」那一排）
```jsx
<label className="btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} title="选择 .md 文件，自动填入标题/正文/标签等">
  📥 导入 Markdown
  <input type="file" accept=".md,.markdown,.txt,text/markdown" onChange={handleImportMarkdown} style={{ display: 'none' }} />
</label>
```

- [ ] **Step 5: 预览区分 markdown / html**
把预览块的内容渲染改为：
```jsx
<div className="post-detail-content"
  dangerouslySetInnerHTML={{ __html: form.contentFormat === 'markdown' ? renderMarkdown(form.content) : form.content }} />
```

- [ ] **Step 6: 内容编辑区分 markdown / html**
把 `<div className="editor-container">...ReactQuill...</div>` 改为条件渲染：markdown 用 textarea，否则 Quill。
```jsx
{form.contentFormat === 'markdown' ? (
  <>
    <textarea className="form-textarea" style={{ minHeight: 360, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '0.9rem', lineHeight: 1.6 }}
      value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
      placeholder="Markdown 源码（支持 $$公式$$、\\[公式\\]）" />
    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
      📄 当前为 Markdown 模式（导入笔记）。点上方「预览」查看渲染效果（含公式）。
      <button type="button" className="btn-secondary" style={{ marginLeft: 10, padding: '2px 10px', fontSize: '0.75rem' }}
        onClick={() => { if (window.confirm('转为富文本编辑？公式等可能丢失，建议保持 Markdown。')) setForm({ ...form, contentFormat: 'html' }); }}>
        转富文本
      </button>
    </p>
  </>
) : (
  <div className="editor-container"> ...原 ReactQuill 整块... </div>
)}
```
注意：原 `editor-container` 内含 `imageResizer` popover，原样保留在 html 分支里。

- [ ] **Step 7: 保存时带上 contentFormat**
`handleSave` 的 `body` 已是 `{ ...form, tags: ... }`，form 含 contentFormat，自动带上。确认 `body` 未删除该字段即可。

- [ ] **Step 8: 分类下拉兼容导入的未知分类**
在分类 `<select>` 的 options 末尾，若 `form.category` 不在 categories 中则补一个：
```jsx
{form.category && !categories.some(c => c.name === form.category) && (
  <option value={form.category}>{form.category}（导入）</option>
)}
```

- [ ] **Step 9: 构建验证**
Run: `npx react-scripts build`（或后面 Task 10 统一构建）
Expected: 编译通过，无 ESLint 报错（CRA build 把 warning 视情况；如 no-unused-vars 报错需清理）。

- [ ] **Step 10: Commit**
```bash
git add src/admin/AdminPanel.js
git commit -m "feat(admin): 新建文章支持一键导入 Markdown 与源码编辑/预览"
```

---

## Task 8: PostDetail 渲染 markdown 文章

**Files:**
- Modify: `src/pages/PostDetail.js`

- [ ] **Step 1: 引入渲染器**
```js
import { renderMarkdown } from '../utils/markdownRenderer';
```

- [ ] **Step 2: 计算 html 并渲染**
把第 130 行附近的内容渲染改为：
```jsx
<div className="post-detail-content" ref={contentRef}
  dangerouslySetInnerHTML={{ __html: post.contentFormat === 'markdown' ? renderMarkdown(post.content) : post.content }} />
```
（图片灯箱的 useEffect 依赖 `post` 仍生效——markdown 渲染出的 `<img>` 同样被查询绑定。）

- [ ] **Step 3: 构建验证**（并入 Task 10）

- [ ] **Step 4: Commit**
```bash
git add src/pages/PostDetail.js
git commit -m "feat: 文章详情页渲染 Markdown 类型内容（含公式）"
```

---

## Task 9: KaTeX 样式 + markdown 内容样式

**Files:**
- Modify: `src/index.js`
- Modify: `src/index.css`（或 `src/App.css`，取现有放全局内容样式之处）

- [ ] **Step 1: 引入 KaTeX CSS**
`src/index.js` 顶部 `import './index.css';` 后加：
```js
import 'katex/dist/katex.min.css';
```

- [ ] **Step 2: 补 markdown 元素样式**
若 `.post-detail-content` 下标题/列表/引用/分隔线/代码/表格样式不足，在全局 CSS 加（与现有 Quill 内容观感一致）：
```css
.post-detail-content h1,.post-detail-content h2,.post-detail-content h3{margin:1.2em 0 .5em;line-height:1.3}
.post-detail-content ul,.post-detail-content ol{padding-left:1.5em;margin:.6em 0}
.post-detail-content blockquote{border-left:4px solid var(--accent,#7c6af7);padding:.4em 1em;margin:.8em 0;color:var(--text-dim);background:rgba(124,106,247,.06);border-radius:4px}
.post-detail-content pre{background:rgba(0,0,0,.3);padding:12px 16px;border-radius:8px;overflow:auto}
.post-detail-content code{font-family:ui-monospace,Consolas,monospace}
.post-detail-content hr{border:none;border-top:1px solid var(--border,#333);margin:1.4em 0}
.post-detail-content table{border-collapse:collapse;margin:.8em 0}
.post-detail-content th,.post-detail-content td{border:1px solid var(--border,#333);padding:6px 12px}
.post-detail-content .katex-display{overflow-x:auto;overflow-y:hidden;padding:.3em 0}
```

- [ ] **Step 3: Commit**
```bash
git add src/index.js src/index.css
git commit -m "style: 引入 KaTeX 样式并补充 Markdown 内容排版"
```

---

## Task 10: 构建、验证、推送

- [ ] **Step 1: 跑全部前端测试**
Run: `npx react-scripts test --watchAll=false`
Expected: 全 PASS。

- [ ] **Step 2: 生产构建**
Run: `npx react-scripts build`
Expected: `Compiled successfully`，无报错。

- [ ] **Step 3: 提交 build 产物**（仓库把 build 纳入版本控制用于部署）
```bash
git add build
git commit -m "build: 重新构建前端（含 Markdown 导入功能）"
```

- [ ] **Step 4: 推送到 GitHub**
Run: `git push origin main`
Expected: 推送成功。

- [ ] **Step 5: 人工验证清单**（本地 `npm start` 或部署后）
  - 后台「新建文章」点「导入 Markdown」选 p04 文件 → 标题/正文填入，模式切为 Markdown。
  - 点「预览」→ 公式、标题、列表、引用正确显示。
  - 保存 → 前台文章详情页公式正确渲染、图片可放大。
  - 老的 Quill 文章打开/显示一切照旧（contentFormat 缺省为 html）。

---

## Self-Review 记录
- Spec 覆盖：contentFormat（T6）、renderer 三函数（T2-4）、导入 UI（T7）、详情渲染（T8）、KaTeX 样式（T9）、两文件验证（T5）、构建推送（T10）——全部对应。
- 一致性：`renderMarkdown`/`importMarkdownFile`/`parseFrontmatter` 三处签名跨任务一致；`contentFormat` 在前后端、编辑器、详情页命名一致。
- 占位符：无 TBD/TODO；renderer 与 UI 代码均完整给出。
- 风险点：marked ESM(已用 jest 配置解决)；DOMPurify 与 KaTeX 顺序（先消毒后回填，已规避）；CRA build 把未用变量当错误（Task 7 注意清理）。
