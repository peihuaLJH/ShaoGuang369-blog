import fs from 'fs';
import path from 'path';
import { parseFrontmatter, renderMarkdown, importMarkdownFile } from './markdownRenderer';

const readFixture = (f) => fs.readFileSync(path.join(__dirname, '__tests__', 'fixtures', f), 'utf8');

describe('parseFrontmatter', () => {
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
});

describe('renderMarkdown', () => {
  test('块级公式 $$..$$ 渲染为 katex', () => {
    const html = renderMarkdown('$$111 - 65 = 46$$');
    expect(html).toContain('katex');
    expect(html).not.toContain('$$');
  });

  test('块级公式 \\[..\\] 渲染为 katex（含换行）', () => {
    const html = renderMarkdown('\\[\n\\frac{a}{b} \\approx 1\n\\]');
    expect(html).toContain('katex');
    expect(html).not.toContain('\\[');
    expect(html).not.toContain('\\frac');
  });

  test('行内公式 $..$ 渲染', () => {
    const html = renderMarkdown('成本约 $x=65$ 泰铢');
    expect(html).toContain('katex');
  });

  test('行内公式 \\(..\\) 渲染', () => {
    const html = renderMarkdown('设 \\(y = 2x\\) 成立');
    expect(html).toContain('katex');
    expect(html).not.toContain('\\(');
  });

  test('常规 markdown 元素', () => {
    const html = renderMarkdown('# H1\n\n## H2\n\n- a\n- b\n\n**粗**\n\n> 引用\n\n---');
    expect(html).toMatch(/<h1[^>]*>H1<\/h1>/);
    expect(html).toMatch(/<h2/);
    expect(html).toMatch(/<li>a<\/li>/);
    expect(html).toContain('<strong>粗</strong>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<hr');
  });

  test('代码块内的 $ 不被当公式', () => {
    const html = renderMarkdown('```\nprice = $5 and $6\n```');
    expect(html).toContain('price = $5 and $6');
    expect(html).not.toContain('class="katex"');
  });

  test('消毒：剥离 script', () => {
    const html = renderMarkdown('正常\n\n<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
  });

  test('空输入返回空串', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown(null)).toBe('');
  });
});

describe('importMarkdownFile', () => {
  test('frontmatter 优先取标题与各字段', () => {
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

  test('category 为数组时取首个；别名键 description 作摘要', () => {
    const r = importMarkdownFile(`---\ncategories: [前端, 笔记]\ndescription: 简介\n---\nx`, 'f.md');
    expect(r.category).toBe('前端');
    expect(r.summary).toBe('简介');
  });
});

describe('真实笔记结构集成测试', () => {
  test('笔记A($$)：标题提取 + 公式与格式渲染', () => {
    const r = importMarkdownFile(readFixture('note-dollar.md'), 'note-dollar.md');
    expect(r.title).toContain('TikTok');        // 来自首个 # 标题
    const html = renderMarkdown(r.content);
    expect(html).toContain('katex');            // 公式已渲染
    expect(html).not.toContain('$$');           // 无残留分隔符
    expect(html).toMatch(/<h2/);                // 二级标题
    expect(html).toContain('<blockquote>');     // 引用块
    expect(html).toContain('<strong>');         // 加粗
    expect(html).toContain('<hr');              // 分隔线
  });

  test('笔记B(\\[)：公式渲染', () => {
    const r = importMarkdownFile(readFixture('note-bracket.md'), 'note-bracket.md');
    const html = renderMarkdown(r.content);
    expect(html).toContain('katex');
    expect(html).not.toContain('\\[');
    expect(html).not.toContain('\\frac');       // frac 已被 katex 消化
    expect(html).toMatch(/<li>/);               // 列表
  });
});
