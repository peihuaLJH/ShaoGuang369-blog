import { parseFrontmatter } from './markdownRenderer';

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
