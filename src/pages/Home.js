import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StarBackground from '../components/StarBackground';

const API = 'http://localhost:5000/api';

const Home = ({ settings }) => {
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [latestEssays, setLatestEssays] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetch(`${API}/posts?type=blog&limit=3`).then(r => r.json()).then(d => setLatestBlogs(d.posts || [])).catch(() => {});
    fetch(`${API}/posts?type=essay&limit=3`).then(r => r.json()).then(d => setLatestEssays(d.posts || [])).catch(() => {});
    fetch(`${API}/visitors/stats`).then(r => r.json()).then(d => setStats(d)).catch(() => {});
    // 记录访客
    fetch(`${API}/visitors/track`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ page: '/' }) }).catch(() => {});
  }, []);

  const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxMDAiIGZpbGw9IiM4YjVjZjYiLz48dGV4dCB4PSIxMDAiIHk9IjExMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iNTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7phbY8L3RleHQ+PC9zdmc+';
  const avatarUrl = settings?.avatar ? `http://localhost:5000${settings.avatar}` : defaultAvatar;
  const quote = settings?.quote || '允许自己走慢点，但别停下';

  return (
    <div>
      {/* Hero区域 */}
      <section className="hero-section">
        <StarBackground />
        {/* === 太阳系 (Day Mode) === */}
        <div className="solar-system">
          <div className="orbit orbit-1"><div className="planet planet-1"/></div>
          <div className="orbit orbit-2"><div className="planet planet-2"/></div>
          <div className="orbit orbit-3"><div className="planet planet-3"/></div>
          <div className="orbit orbit-4"><div className="planet planet-4"/></div>
        </div>
        <div className="hero-content">
          <div className="hero-avatar-wrap">
            <img src={avatarUrl} alt="韶光" className="hero-avatar" />
            <div className="hero-avatar-ring" />
          </div>
          <h1 className="hero-title">韶光的个人博客</h1>
          <p className="hero-subtitle">分享跨境电商学习日常 · 记录生活中的美好</p>
          <p className="hero-quote">{quote}</p>
          <div className="scroll-hint">
            <span>向下滑动</span>
            <div className="scroll-hint-line" />
          </div>
        </div>
      </section>

      {/* 最新文章 */}
      <section className="home-section container">
        <div className="section-header">
          <h2 className="section-title">最新文章</h2>
          <p className="section-subtitle">跨境电商学习心得与技术分享</p>
          <div className="section-divider" />
        </div>
        {latestBlogs.length > 0 ? (
          <div className="posts-grid">
            {latestBlogs.map(post => (
              <Link to={`/post/${post._id}`} key={post._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="post-card">
                  {post.coverImage ? (
                    <img src={post.coverImage.startsWith('http') ? post.coverImage : `http://localhost:5000${post.coverImage}`} alt={post.title} className="post-card-image" />
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
                    <p className="post-card-summary">{post.summary || (post.content || '').replace(/<[^>]+>/g, '').substring(0, 100)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-data">暂无文章，敬请期待</div>
        )}
        <div style={{ textAlign: 'center' }}>
          <Link to="/blog"><button className="view-more-btn">查看更多 →</button></Link>
        </div>
      </section>

      {/* 随笔分享 */}
      <section className="home-section container">
        <div className="section-header">
          <h2 className="section-title">随笔分享</h2>
          <p className="section-subtitle">生活趣事与感悟随笔</p>
          <div className="section-divider" />
        </div>
        {latestEssays.length > 0 ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {latestEssays.map(essay => (
              <Link to={`/post/${essay._id}`} key={essay._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="essay-card">
                  <h3 className="essay-card-title">{essay.title}</h3>
                  <p className="essay-card-summary">{essay.summary || (essay.content || '').replace(/<[^>]+>/g, '').substring(0, 120)}</p>
                  <div className="essay-card-meta">
                    <span>📅 {new Date(essay.createdAt).toLocaleDateString()}</span>
                    <span>👁 {essay.viewCount}</span>
                    <span>👍 {essay.likeCount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-data">暂无随笔，敬请期待</div>
        )}
        <div style={{ textAlign: 'center' }}>
          <Link to="/essays"><button className="view-more-btn">查看更多 →</button></Link>
        </div>
      </section>

      {/* 关于我 */}
      <section className="home-section container">
        <div className="section-header">
          <h2 className="section-title">关于我</h2>
          <div className="section-divider" />
        </div>
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <img src={avatarUrl} alt="韶光" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)', marginBottom: 16 }} />
          <p className="hero-quote" style={{ fontSize: '1rem', marginBottom: 20 }}>{quote}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 30 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>{stats.blogCount || 0}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>博客文章</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--gold)' }}>{stats.essayCount || 0}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>随笔数量</div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <Link to="/about"><button className="view-more-btn">了解更多 →</button></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
