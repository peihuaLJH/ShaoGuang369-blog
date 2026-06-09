import { parseFrontmatter, renderMarkdown } from './markdownRenderer';

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
