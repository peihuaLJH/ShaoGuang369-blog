import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch(`${API}/categories`).then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
    fetch(`${API}/visitors/track`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ page: '/blog' }) }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'blog', page, limit: 9 });
    if (activeCategory) params.set('category', activeCategory);
    if (search) params.set('search', search);
    fetch(`${API}/posts?${params}`)
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, activeCategory, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="page-content container">
      <div className="section-header" style={{ marginBottom: 30 }}>
        <h2 className="section-title">博客文章</h2>
        <p className="section-subtitle">跨境电商学习心得与技术分享</p>
        <div className="section-divider" />
      </div>

      <div className="search-filter-bar">
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex' }}>
          <input type="text" className="search-input" placeholder="搜索文章..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </form>
        <div className="category-filter">
          <button className={`category-btn ${!activeCategory ? 'active' : ''}`}
            onClick={() => { setActiveCategory(''); setPage(1); }}>全部</button>
          {categories.map(c => (
            <button key={c._id} className={`category-btn ${activeCategory === c.name ? 'active' : ''}`}
              onClick={() => { setActiveCategory(c.name); setPage(1); }}>{c.name}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="no-data">暂无文章</div>
      ) : (
        <>
          <div className="posts-grid">
            {posts.map(post => (
              <Link to={`/post/${post._id}`} key={post._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="post-card">
                  {post.coverImage ? (
                    <img src={post.coverImage.startsWith('http') ? post.coverImage : `http://localhost:5000${post.coverImage}`}
                      alt={post.title} className="post-card-image" />
                  ) : (
                    <div className="post-card-image-placeholder">📝</div>
                  )}
                  <div className="post-card-body">
                    <h3 className="post-card-title">{post.title}</h3>
                    <div className="post-card-meta">
                      <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>👁 {post.viewCount}</span>
                      <span>👍 {post.likeCount}</span>
                      <span>💬 {post.commentCount || 0}</span>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="post-card-tags">
                        {post.tags.map((t, i) => <span key={i} className="post-tag">{t}</span>)}
                      </div>
                    )}
                    <p className="post-card-summary">{post.summary || (post.content || '').replace(/<[^>]+>/g, '').substring(0, 100)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}>上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Blog;
