# 一键导入 Markdown 笔记 — 设计文档

日期：2026-06-09
状态：已批准，待实现

## 背景与目标

博客管理后台「文章管理 → 新建文章」需要一个**一键导入 Markdown 笔记**的按钮。导入的笔记
（如 TikTok 跨境电商课程笔记）包含大量 **LaTeX 数学公式**、标题、嵌套列表、加粗、引用块、
分隔线、锚点链接等格式，要求导入后能在博客文章中**完全保真显示**。

## 核心约束（为什么不能简单塞进 Quill）

- 文章详情页 `src/pages/PostDetail.js` 通过 `dangerouslySetInnerHTML` 渲染 `post.content`。
- 现有内容来自 **Quill 富文本编辑器**（`react-quill-new`），存储为 HTML。
- **Quill 只保留它支持的格式**，会丢弃数学公式、表格等未知 HTML。
- 项目**未安装任何数学渲染库**。

结论：要让 `$$...$$`、`\[...\]` 这类公式真正渲染，必须把导入的笔记作为**独立的 Markdown 内容
类型**处理，绕开 Quill，显示时用 marked + KaTeX 渲染。

## 架构：内容格式标记

给文章增加 `contentFormat: 'html' | 'markdown'`，默认 `'html'`：

- **html**（默认，老文章 + 手写新文章）：内容是 Quill 产出的 HTML，渲染/编辑方式不变。
- **markdown**（导入的笔记）：`content` 字段存**原始 markdown 文本**；显示时实时渲染；
  编辑时用 markdown 源码框 + 实时预览（而非 Quill）。

两条路径互不干扰，老文章零影响。

## 组件与数据流

### 1. 后端（最小改动）
- `backend/models/Post.js`：新增 `contentFormat: { type: String, default: 'html', enum: ['html','markdown'] }`。
- `backend/routes/posts.js`：`POST /` 和 `PUT /:id` 从 body 读取并保存 `contentFormat`。

### 2. 共享渲染器（新建 `src/utils/markdownRenderer.js`）
纯函数，可单元测试：

- `parseFrontmatter(text) -> { data, content }`
  识别开头 `---\n ... \n---` 的 YAML 块，用 `js-yaml` 解析为 `data`，其余为正文 `content`；
  无 frontmatter 时 `data = {}`，`content = text`。

- `renderMarkdown(md) -> string`（安全 HTML）
  1. **保护代码**：先挖出 ``` 围栏代码块与行内 `code`，占位，避免其中的 `$` 被当公式。
  2. **抽取公式**：按分隔符提取数学，先于 marked 处理（否则 `\[` 会被 markdown 转义）：
     - 块级（displayMode）：`$$...$$`、`\[...\]`
     - 行内：`$...$`、`\(...\)`
     用 `katex.renderToString(tex, { displayMode, throwOnError: false, output: 'html' })` 渲染，
     占位。`output: 'html'` 只产生带 class 的 `<span>`，对 DOMPurify 友好。
  3. **marked**：处理其余 markdown（开启 GFM）。
  4. **回填**：把代码块、公式 HTML 放回占位符。
  5. **DOMPurify** 消毒输出（配置保留 KaTeX 的 span/class/style）。

- `importMarkdownFile(text, filename) -> { title, content, tags, category, summary, coverImage }`
  组合 `parseFrontmatter`：
  - 标题：`data.title` →（无则）正文第一个 `# H1`（取作标题并从正文删去该行）→（无则）文件名去扩展名。
  - 标签：`data.tags`（数组或字符串）→ 归一化为「逗号分隔字符串」。
  - 分类：`data.category` / `data.categories`（数组取首个）。
  - 摘要：`data.summary` / `data.description` / `data.excerpt`。
  - 封面：`data.cover` / `data.coverImage` / `data.banner`。
  - `content`：抽掉 frontmatter（与被采用为标题的 H1）后的**原始 markdown**。

### 3. 管理后台 `src/admin/AdminPanel.js`（PostEditor）
- 顶部操作区加 **📥 导入 Markdown** 按钮 + 隐藏 `<input type="file" accept=".md,.markdown,.txt">`。
- 选择文件 → `FileReader` 读文本 → `importMarkdownFile` → 若当前已有内容先 `confirm` 覆盖 →
  `setForm` 填充各字段，并设 `contentFormat='markdown'` → toast 汇报导入了哪些字段。
- 当 `form.contentFormat === 'markdown'`：内容区渲染 **markdown 源码 `<textarea>`**；
  「预览」按钮用 `renderMarkdown(form.content)` 实时预览。`contentFormat === 'html'` 时仍用 Quill。
- 保存时 body 带上 `contentFormat`。
- 分类下拉：导入的分类若不在现有列表，临时补一个 `<option>` 以显示并保留。

### 4. 文章详情页 `src/pages/PostDetail.js`
- `post.contentFormat === 'markdown'` 时，`html = renderMarkdown(post.content)`，再 `dangerouslySetInnerHTML`；
  否则维持现状。图片放大灯箱逻辑（查询 `img`）继续生效。

### 5. 依赖与样式
- `package.json` 补声明 `marked`、`dompurify`、`js-yaml`（已在 node_modules），新增 `katex`。
- 全局引入 KaTeX CSS（`src/index.js`）。
- 为 `.post-detail-content` 下的 markdown 元素（标题/列表/引用/分隔线/代码/表格）补充必要样式，
  与现有 Quill 内容观感一致。

## 错误处理
- 文件读取失败 / 非文本：toast 报错，不改表单。
- 单条公式语法错误：`throwOnError: false`，KaTeX 输出红色错误占位，不中断整篇渲染。
- frontmatter YAML 解析失败：回退为「无 frontmatter」，整篇当正文。

## 测试策略
- 对 `src/utils/markdownRenderer.js` 写单元测试（react-scripts 自带 jest）。
- **直接用用户提供的两个真实笔记作为 fixture**（含 `$$...$$` 与 `\[...\]` 两种公式语法）：
  - `parseFrontmatter`：有/无 frontmatter；tags 数组与字符串；多个别名键。
  - `importMarkdownFile`：从 `> 来源链接` 引用 + 首个 `# H1` 正确取标题并剥离。
  - `renderMarkdown`：
    - `$$111 - 65 = 46$$` 与 `\[ \frac{...}{...} \approx 111 \]` 都产出 `class="katex"`。
    - 标题→`<h1/h2/h3>`、`-` 列表→`<ul><li>`、`**x**`→`<strong>`、`>`→`<blockquote>`、`---`→`<hr>`。
    - 代码围栏内的 `$` 不被当公式。
- 手动验证：`npm run build` 通过；导入两个文件后预览与详情页公式正确显示。

## 交付
- `npm run build` 重新构建 `build/`（部署服务的是已提交的 build 目录）。
- 提交全部改动并推送到 GitHub `main`。

## 取舍说明
- 导入的笔记编辑时为 markdown 源码框（非 Quill 富文本）——对笔记而言更优，保留原始 markdown 与公式。
- 手写新文章不受影响，照旧 Quill。
- 不引入语法高亮（highlight.js）：笔记基本无代码块，YAGNI。
- 公式 KaTeX 采用 `output: 'html'`（不输出 MathML），简化 DOMPurify 配置。
