import React, { useState, useEffect } from 'react';
import { postApi, statsApi } from './api/api';
import CommentSection from './components/CommentSection';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';

function App() {
  const [posts, setPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 记录访问统计
  useEffect(() => {
    const recordVisit = async () => {
      try {
        await statsApi.recordVisit({
          isUnique: true,
          isPostView: !!currentPost
        });
      } catch (err) {
        console.error('记录访问失败:', err);
      }
    };

    recordVisit();
  }, [currentPost]);

  // 获取文章列表
  useEffect(() => {
    if (!currentPost) {
      fetchPosts();
    }
  }, [currentPost]);

  // 获取站点统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await statsApi.getTotalStats();
        setSiteStats(stats);
      } catch (err) {
        console.error('获取统计数据失败:', err);
      }
    };
    fetchStats();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postApi.getPosts();
      setPosts(response.posts);
    } catch (err) {
      setError('获取文章失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPost = async (postId) => {
    try {
      setLoading(true);
      const post = await postApi.getPost(postId);
      setCurrentPost(post);
    } catch (err) {
      setError('获取文章详情失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await postApi.likePost(postId);
      if (currentPost && currentPost._id === postId) {
        setCurrentPost({ ...currentPost, likeCount: response.likeCount });
      }
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, likeCount: response.likeCount }
          : post
      ));
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    // 只有ShaoGuang用户可以访问后台
    if (userData.username === 'ShaoGuang') {
      setShowAdmin(true);
    } else {
      setShowAdmin(false);
      // 非ShaoGuang用户登录后返回首页
      setCurrentPost(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowAdmin(false);
  };

  const handleBackToHome = () => {
    setCurrentPost(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReadBlog = () => {
    setCurrentPost(null);
    setTimeout(() => {
      const blogSection = document.querySelector('.search-container');
      if (blogSection) {
        blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // 导航栏滚动效果
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.header');
      if (header) {
        if (window.scrollY > 100) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 移动端菜单状态
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 搜索功能
  const [searchTerm, setSearchTerm] = useState('');
  // 分页功能
  const [currentPage, setCurrentPage] = useState(1);
  // 夜间模式
  const [darkMode, setDarkMode] = useState(false);
  const postsPerPage = 6;

  // 站点统计数据
  const [siteStats, setSiteStats] = useState(null);

  // 过滤文章
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页逻辑
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1 onClick={handleBackToHome} className="logo">韶光的个人博客</h1>
            <nav className={`nav ${mobileMenuOpen ? 'active' : ''}`}>
              <a href="#" onClick={handleBackToHome}>首页</a>
              <a href="#">博客</a>
              <a href="#">随笔</a>
              <a href="#">友链</a>
              <a href="#" onClick={handleBackToHome}>关于</a>
              <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">
                {darkMode ? '白天' : '夜间'}
              </button>
              {user ? (
                user.username === 'ShaoGuang' ? (
                  <button onClick={() => setShowAdmin(!showAdmin)}>
                    {showAdmin ? '返回前台' : '后台管理'}
                  </button>
                ) : (
                  <button onClick={handleLogout}>退出登录</button>
                )
              ) : (
                <button onClick={() => setShowAdmin(true)} className="primary">登录</button>
              )}
            </nav>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              ☰
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {showAdmin ? (
            user ? (
              <AdminPanel onLogout={handleLogout} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          ) : currentPost ? (
            <div className="post-detail">
              <button onClick={handleBackToHome} className="back-btn">返回首页</button>
              <h2>{currentPost.title}</h2>
              <div className="post-meta">
                <span>{new Date(currentPost.createdAt).toLocaleString()}</span>
                <span>浏览: {currentPost.viewCount}</span>
                <span>
                  <button onClick={() => handleLikePost(currentPost._id)}>
                    👍 {currentPost.likeCount}
                  </button>
                </span>
              </div>
              {currentPost.tags && currentPost.tags.length > 0 && (
                <div className="post-tags">
                  {currentPost.tags.map((tag, index) => (
                    <span key={index} className="post-tag">{tag}</span>
                  ))}
                </div>
              )}
              <div className="post-content">
                {currentPost.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <CommentSection postId={currentPost._id} user={user} />
            </div>
          ) : (
            <div>
              {/* 关于我区域 */}
              <div className="about-header">
                <div className="about-avatar">
                  <img src="/images/blog tab .jpg" alt="韶光" />
                </div>
                <h2>Hello, I'm 韶光</h2>
                <div className="about-title">
                  <span>提升 突破 为了美好的明天</span>
                </div>
                <p className="about-subtitle">跨境小白，初出茅庐</p>
                <div className="about-buttons">
                  <button onClick={handleReadBlog} className="primary-btn">阅读博客</button>
                </div>
              </div>

              {/* 关于本站 */}
              <div className="site-info">
                <h3>关于本站</h3>
                <div className="site-info-content">
                  <div className="site-basic">
                    <h4>站内简介</h4>
                    <p>韶光的个人博客，记录学习心得、生活感悟和技术分享。</p>
                  </div>
                  <div className="site-details">
                    <div className="site-item">
                      <span className="site-label">网站名称：</span>
                      <span className="site-value">韶光的个人博客</span>
                    </div>
                    <div className="site-item">
                      <span className="site-label">网站网址：</span>
                      <span className="site-value">https://shaoguang369.com</span>
                    </div>
                  </div>
                  <div className="site-stats">
                    <h4>站点数据</h4>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <div className="stat-value">{siteStats ? siteStats.totalUniqueVisitors : '加载中...'}</div>
                        <div className="stat-label">站点访客</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{posts.length}</div>
                        <div className="stat-label">发布文章</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{siteStats ? siteStats.totalComments : '加载中...'}</div>
                        <div className="stat-label">评论数</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">2026</div>
                        <div className="stat-label">建站年份</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 搜索框 */}
              <form className="search-container" onSubmit={handleSearch}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="搜索文章..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>

              {/* 文章列表 */}
              {loading ? (
                <div className="posts-grid">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-card">
                      <div className="card-image skeleton" style={{ height: '200px' }}></div>
                      <div className="card-content">
                        <div className="skeleton skeleton-title"></div>
                        <div className="skeleton skeleton-text"></div>
                        <div className="skeleton skeleton-text"></div>
                        <div className="skeleton skeleton-text"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : filteredPosts.length === 0 ? (
                <div className="no-data">暂无文章</div>
              ) : (
                <>
                  <div className="posts-grid">
                    {currentPosts.map(post => (
                      <div key={post._id} className="post-card">
                        <div className="card-image">📝</div>
                        <div className="card-content">
                          <h3 onClick={() => fetchPost(post._id)}>{post.title}</h3>
                          <div className="post-meta">
                            <span>{new Date(post.createdAt).toLocaleString()}</span>
                            <span>浏览: {post.viewCount}</span>
                            <span>👍 {post.likeCount}</span>
                          </div>
                          {post.tags && post.tags.length > 0 && (
                            <div className="post-tags">
                              {post.tags.map((tag, index) => (
                                <span key={index} className="post-tag">{tag}</span>
                              ))}
                            </div>
                          )}
                          <p className="post-summary">{post.summary || post.content.substring(0, 100)}...</p>
                          <button onClick={() => fetchPost(post._id)} className="read-more">阅读全文</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 分页 */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                      >
                        上一页
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button 
                          key={page}
                          className={currentPage === page ? 'active' : ''}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      ))}
                      <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">韶光的个人博客</div>
            <div className="footer-links">
              <a href="#" onClick={handleBackToHome}>首页</a>
              <a href="#">文章分类</a>
              <a href="#" onClick={handleBackToHome}>关于我</a>
              <a href="#">联系我们</a>
            </div>
            <div className="footer-copyright">
              &copy; {new Date().getFullYear()} 韶光的个人博客
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        /* 导入字体 */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body, #root {
          min-height: 100%;
          width: 100%;
          background-color: var(--bg-color);
          color: var(--text-primary);
        }

        .app {
          min-height: 100vh;
          width: 100%;
          background-color: var(--bg-color);
          color: var(--text-primary);
        }

        :root {
          /* 主色调 */
          --primary-color: #1a202c;
          --secondary-color: #2d3748;
          --accent-color: #38b2ac;
          --accent-color-alt: #ed8936;
          
          /* 背景色 */
          --bg-color: #f7fafc;
          --card-bg: #ffffff;
          
          /* 文字颜色 */
          --text-primary: #2d3748;
          --text-secondary: #718096;
          --text-light: #a0aec0;
          
          /* 边框颜色 */
          --border-color: #e2e8f0;
          --border-light: #f7fafc;
          
          /* 阴影 */
          --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          
          /* 过渡动画 */
          --transition: all 0.3s ease;
        }

        .dark-mode {
          --primary-color: #0f172a;
          --secondary-color: #1e293b;
          --accent-color: #38bdf8;
          --accent-color-alt: #f97316;
          --bg-color: #020617;
          --card-bg: #0b1120;
          --text-primary: #e2e8f0;
          --text-secondary: #94a3b8;
          --text-light: #cbd5e1;
          --border-color: #334155;
          --border-light: #1f2937;
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
          --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
          --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.65);
        }

        .dark-mode .header,
        .dark-mode .footer,
        .dark-mode .admin-panel,
        .dark-mode .login-container,
        .dark-mode .create-post,
        .dark-mode .edit-post,
        .dark-mode table,
        .dark-mode .site-info-content,
        .dark-mode .about-header,
        .dark-mode .about-content {
          background-color: var(--secondary-color);
          color: var(--text-primary);
          border-color: var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .dark-mode body {
          background-color: var(--bg-color);
          color: var(--text-primary);
        }

        .dark-mode .nav a,
        .dark-mode .nav button,
        .dark-mode .footer-links a,
        .dark-mode .admin-header h1,
        .dark-mode .admin-tabs .tab-btn,
        .dark-mode .tab-btn,
        .dark-mode .filter-btn,
        .dark-mode th,
        .dark-mode td,
        .dark-mode label,
        .dark-mode p,
        .dark-mode .post-meta span,
        .dark-mode .post-tags span,
        .dark-mode .site-item .site-label,
        .dark-mode .site-item .site-value {
          color: var(--text-primary);
        }

        .dark-mode input,
        .dark-mode textarea,
        .dark-mode .search-input,
        .dark-mode .pagination button,
        .dark-mode .logout-btn,
        .dark-mode .form-actions button,
        .dark-mode .tab-btn.active,
        .dark-mode .stats-grid .stat-item,
        .dark-mode .posts-grid .post-card {
          background-color: var(--card-bg);
          color: var(--text-primary);
          border-color: var(--border-color);
        }

        .dark-mode .tab-btn:hover,
        .dark-mode .filter-btn:hover,
        .dark-mode .nav a:hover,
        .dark-mode .nav button:hover,
        .dark-mode .logout-btn:hover,
        .dark-mode .form-actions button[type="submit"] {
          background-color: #1d4ed8;
          color: white;
        }

        .dark-mode .tab-btn.active {
          background-color: #2563eb;
          color: white;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
          line-height: 1.7;
          color: var(--text-primary);
          background-color: var(--bg-color);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* 导航栏 */
        .header {
          background-color: var(--primary-color);
          color: white;
          padding: 1rem 0;
          box-shadow: var(--shadow-md);
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: var(--transition);
        }

        .header.scrolled {
          padding: 0.75rem 0;
          background-color: rgba(26, 32, 44, 0.95);
          backdrop-filter: blur(10px);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          cursor: pointer;
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo:hover {
          color: var(--accent-color);
          transition: var(--transition);
        }

        .nav {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .nav a,
        .nav button {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 6px;
          transition: var(--transition);
          font-weight: 500;
        }

        .nav a:hover,
        .nav button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--accent-color);
        }

        .nav button.primary {
          background-color: var(--accent-color);
          color: white;
        }

        .nav button.primary:hover {
          background-color: #319795;
        }

        /* 移动端菜单 */
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }

        /* 主内容区 */
        .main {
          padding: 3rem 0;
          position: relative;
          z-index: 20;
        }

        /* 文章列表 */
        .posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .post-card {
          background-color: var(--card-bg);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
          display: flex;
          flex-direction: column;
        }

        .post-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
        }

        .post-card .card-image {
          height: 200px;
          background-color: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-light);
          font-size: 3rem;
        }

        .card-content {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .post-card h3 {
          margin-bottom: 1rem;
          color: var(--text-primary);
          cursor: pointer;
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .post-card h3:hover {
          color: var(--accent-color);
          transition: var(--transition);
        }

        .post-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .post-tags {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .post-tag {
          background-color: var(--border-light);
          color: var(--text-secondary);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .post-summary {
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
          flex: 1;
          line-height: 1.6;
        }

        .read-more {
          background-color: var(--accent-color);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition);
          font-weight: 500;
          align-self: flex-start;
        }

        .read-more:hover {
          background-color: #319795;
          transform: translateY(-2px);
        }

        /* 文章详情页 */
        .post-detail {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 2.5rem;
          box-shadow: var(--shadow-sm);
          max-width: 800px;
          margin: 0 auto;
        }

        .back-btn {
          background-color: var(--border-light);
          border: 1px solid var(--border-color);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: var(--transition);
          color: var(--text-primary);
        }

        .back-btn:hover {
          background-color: var(--border-color);
        }

        .post-detail h2 {
          margin-bottom: 1.5rem;
          color: var(--text-primary);
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.3;
        }

        .post-content {
          margin: 2.5rem 0;
          line-height: 1.8;
          color: var(--text-primary);
        }

        .post-content p {
          margin-bottom: 1.5rem;
        }

        .post-content h1,
        .post-content h2,
        .post-content h3,
        .post-content h4,
        .post-content h5,
        .post-content h6 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
          font-weight: 600;
        }

        .post-content h2 {
          font-size: 1.5rem;
        }

        .post-content h3 {
          font-size: 1.25rem;
        }

        /* 代码块高亮 */
        .post-content pre {
          background-color: var(--primary-color);
          color: #e2e8f0;
          padding: 1.5rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5rem 0;
          font-family: 'Fira Code', monospace;
          font-size: 0.875rem;
        }

        .post-content code {
          background-color: var(--border-light);
          color: var(--accent-color-alt);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Fira Code', monospace;
          font-size: 0.875rem;
        }

        .post-content pre code {
          background: none;
          color: inherit;
          padding: 0;
        }

        /* 评论区 */
        .comment-section {
          margin-top: 3rem;
          padding-top: 2.5rem;
          border-top: 1px solid var(--border-color);
        }

        .comment-section h3 {
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .comment-form {
          margin-bottom: 2.5rem;
          padding: 2rem;
          background-color: var(--border-light);
          border-radius: 12px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.75rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .form-group .required {
          color: #e53e3e;
          margin-left: 0.25rem;
        }

        .form-group .email-hint {
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: normal;
          margin-left: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.875rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          transition: var(--transition);
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
        }

        .markdown-editor-wrapper {
          width: 100%;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          background-color: var(--bg-color);
        }

        .markdown-editor-wrapper .vditor {
          min-height: 250px;
          border: none;
          border-radius: 0;
        }

        .char-count {
          text-align: right;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
        }

        .form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .review-hint {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .comment-form .submit-btn {
          background-color: var(--accent-color);
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition);
          font-weight: 500;
        }

        .comment-form .submit-btn:hover {
          background-color: #319795;
          transform: translateY(-2px);
        }

        .comment-form .submit-btn:disabled {
          background-color: var(--text-light);
          cursor: not-allowed;
          transform: none;
        }

        .comments-list {
          margin-top: 2rem;
        }

        .comment-item {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 1.5rem;
          transition: var(--transition);
        }

        .comment-item:hover {
          background-color: var(--border-light);
          border-radius: 8px;
        }

        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .comment-nickname {
          font-weight: 600;
          color: var(--text-primary);
        }

        .comment-time {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .comment-content {
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .comment-footer {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .like-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: var(--transition);
          font-size: 0.875rem;
        }

        .like-btn:hover {
          color: var(--accent-color);
        }

        .reply-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 0.875rem;
          transition: var(--transition);
        }

        .reply-btn:hover {
          color: var(--accent-color);
        }

        /* 登录页面 */
        .login-container {
          max-width: 450px;
          margin: 3rem auto;
          padding: 2.5rem;
          background-color: var(--card-bg);
          border-radius: 12px;
          box-shadow: var(--shadow-md);
        }

        .login-container h2 {
          margin-bottom: 2rem;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          text-align: center;
        }

        .login-form button {
          width: 100%;
          background-color: var(--accent-color);
          color: white;
          border: none;
          padding: 0.875rem;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition);
          font-weight: 500;
          font-size: 1rem;
        }

        .login-form button:hover {
          background-color: #319795;
        }

        .password-strength {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .password-strength.weak {
          color: #e53e3e;
        }

        .password-strength.medium {
          color: #dd6b20;
        }

        .password-strength.strong {
          color: #38a169;
        }

        /* 后台管理 */
        .admin-panel {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 2.5rem;
          box-shadow: var(--shadow-sm);
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .admin-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .logout-btn {
          background-color: #e53e3e;
          color: white;
          border: none;
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition);
        }

        .logout-btn:hover {
          background-color: #c53030;
        }

        .admin-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .tab-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          transition: var(--transition);
          font-weight: 500;
          color: var(--text-secondary);
        }

        .tab-btn:hover {
          color: var(--accent-color);
          background-color: var(--border-light);
        }

        .tab-btn.active {
          background-color: var(--accent-color);
          color: white;
        }

        .create-post,
        .edit-post {
          margin-bottom: 2.5rem;
          padding: 2rem;
          background-color: var(--border-light);
          border-radius: 12px;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .form-actions button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition);
          font-weight: 500;
        }

        .form-actions button[type="submit"] {
          background-color: #38a169;
          color: white;
        }

        .form-actions button[type="submit"]:hover {
          background-color: #2f855a;
        }

        .form-actions button[type="button"] {
          background-color: #718096;
          color: white;
        }

        .form-actions button[type="button"]:hover {
          background-color: #4a5568;
        }

        /* 表格样式 */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1.5rem;
          background-color: var(--card-bg);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        th,
        td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        th {
          background-color: var(--border-light);
          font-weight: 600;
          color: var(--text-primary);
        }

        tr:hover {
          background-color: var(--border-light);
        }

        /* 统计卡片 */
        .total-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          padding: 2rem;
          background-color: var(--card-bg);
          border-radius: 12px;
          text-align: center;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .stat-card h3 {
          margin-bottom: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-card p {
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent-color);
        }

        /* 搜索框 */
        .search-container {
          margin-bottom: 2.5rem;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1.5rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 1rem;
          transition: var(--transition);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
        }

        /* 分页 */
        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2.5rem;
        }

        .pagination button {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-color);
          background-color: var(--card-bg);
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text-primary);
        }

        .pagination button:hover {
          background-color: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }

        .pagination button.active {
          background-color: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }

        /* 加载状态 */
        .loading {
          text-align: center;
          padding: 4rem;
          color: var(--text-secondary);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top-color: var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* 骨架屏 */
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s ease-in-out infinite;
          border-radius: 4px;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .skeleton-card {
          background-color: var(--card-bg);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          padding: 1.5rem;
        }

        .skeleton-title {
          height: 24px;
          margin-bottom: 1rem;
          width: 80%;
        }

        .skeleton-text {
          height: 16px;
          margin-bottom: 0.75rem;
          width: 100%;
        }

        .skeleton-text:last-child {
          width: 70%;
        }

        /* 错误提示 */
        .error-message {
          background-color: #fed7d7;
          color: #c53030;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-left: 4px solid #e53e3e;
        }

        /* 成功提示 */
        .success-message {
          background-color: #c6f6d5;
          color: #276749;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-left: 4px solid #38a169;
        }

        /* 页脚 */
        .footer {
          background-color: var(--primary-color);
          color: white;
          padding: 3rem 0;
          margin-top: 4rem;
        }

        .footer-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .footer-logo {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .footer-links {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: var(--transition);
        }

        .footer-links a:hover {
          color: var(--accent-color);
        }

        .footer-copyright {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .header {
            padding: 1rem 0;
          }

          .nav {
            position: fixed;
            top: 0;
            right: -100%;
            width: 80%;
            height: 100vh;
            background-color: var(--primary-color);
            flex-direction: column;
            justify-content: center;
            gap: 2rem;
            transition: var(--transition);
            z-index: 999;
          }

          .nav.active {
            right: 0;
          }

          .mobile-menu-btn {
            display: block;
            z-index: 1000;
          }

          .posts-grid {
            grid-template-columns: 1fr;
          }

          .post-detail {
            padding: 1.5rem;
          }

          .comment-form {
            padding: 1.5rem;
          }

          .login-container {
            padding: 1.5rem;
            margin: 2rem auto;
          }

          .admin-panel {
            padding: 1.5rem;
          }

          .total-stats {
            grid-template-columns: 1fr;
          }

          .main {
            padding: 2rem 0;
          }
        }

        /* 平滑滚动 */
        html {
          scroll-behavior: smooth;
        }

        /* 评论作者头像 */
        .comment-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .comment-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--accent-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        /* 后台评论管理 */
        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-color);
          background-color: var(--card-bg);
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .filter-btn:hover {
          background-color: var(--border-light);
        }

        .filter-btn.active {
          background-color: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-pending {
          background-color: #fef3c7;
          color: #d97706;
        }

        .status-approved {
          background-color: #d1fae5;
          color: #059669;
        }

        .status-rejected {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .approve-btn {
          background-color: #10b981;
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          margin-right: 0.5rem;
          transition: var(--transition);
        }

        .approve-btn:hover {
          background-color: #059669;
        }

        .reject-btn {
          background-color: #f59e0b;
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          margin-right: 0.5rem;
          transition: var(--transition);
        }

        .reject-btn:hover {
          background-color: #d97706;
        }

        .delete-btn {
          background-color: #ef4444;
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
          transition: var(--transition);
        }

        .delete-btn:hover {
          background-color: #dc2626;
        }

        /* 首页 hero 及关于区域 */
        .about-header {
          position: relative;
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 2rem 1rem;
          background: radial-gradient(circle at 20% 20%, rgba(74, 123, 157, 0.15), transparent 45%),
              radial-gradient(circle at 80% 30%, rgba(44, 82, 117, 0.12), transparent 50%),
              linear-gradient(135deg, #5a8fa3 0%, #3a5f7f 45%, #1a3a52 100%);
          overflow: visible;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          color: white;
          z-index: 1;
          border-radius: 0;
        }

        .about-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          z-index: 3;
        }

        .about-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 1px, transparent 2px, transparent 10px);
          animation: heroParticles 30s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        .about-header > * {
          position: relative;
          z-index: 2;
          max-width: 100%;
          padding: 0 1.5rem;
        }

        .about-avatar {
          width: clamp(100px, 20vw, 160px);
          height: clamp(100px, 20vw, 160px);
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 1.5rem;
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
          background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
          box-sizing: border-box;
        }

        .about-avatar img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          display: block;
          vertical-align: middle;
          border-radius: 50%;
        }

        .about-header h2 {
          font-size: clamp(1.8rem, 5.5vw, 3.5rem);
          font-weight: 800;
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
          text-shadow: 0 8px 20px rgba(0, 20, 40, 0.5);
        }

        .about-title {
          display: inline-block;
          padding: 0.6rem 1.4rem;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(8px);
        }

        .about-title span {
          font-size: clamp(0.9rem, 2vw, 1.1rem);
          font-weight: 500;
          color: rgba(238, 248, 255, 0.95);
        }

        .about-subtitle {
          font-size: clamp(0.95rem, 2.2vw, 1.2rem);
          color: rgba(225, 242, 255, 0.85);
          margin-bottom: 1rem;
        }

        .about-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.2rem;
          flex-wrap: wrap;
        }

        .primary-btn {
          padding: clamp(0.8rem, 2vw, 1rem) clamp(1.8rem, 4vw, 2.5rem);
          background: linear-gradient(120deg, rgba(90, 143, 163, 0.75), rgba(58, 95, 127, 0.75));
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: white;
          font-size: clamp(0.95rem, 2vw, 1.1rem);
          border-radius: 999px;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.25s ease;
          font-weight: 600;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(26, 58, 82, 0.35);
          background: linear-gradient(120deg, rgba(90, 143, 163, 0.95), rgba(58, 95, 127, 0.95));
        }

        @keyframes heroParticles {
          0% { transform: translate(0, 0); }
          50% { transform: translate(15px, -20px); }
          100% { transform: translate(0, 0); }
        }

        .about-page {
          min-height: auto;
          padding: 0;
        }

        .about-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 80%, rgba(56, 178, 172, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(250, 204, 21, 0.1) 0%, transparent 50%);
          z-index: 1;
        }

        .about-header > * {
          position: relative;
          z-index: 2;
        }

        .about-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #ffffff 0%, #a0aec0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .about-title {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .about-title span {
          font-size: 1.125rem;
          font-weight: 500;
          position: relative;
        }

        .about-title span::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-color);
          transform: scaleX(1);
          transition: transform 0.3s ease;
        }

        .about-subtitle {
          font-size: 1.125rem;
          color: #a0aec0;
          margin-bottom: 2rem;
        }

        .about-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .primary-btn {
          background-color: var(--accent-color);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .primary-btn:hover {
          background-color: #319795;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(56, 178, 172, 0.3);
        }

        .secondary-btn {
          background-color: transparent;
          color: white;
          border: 2px solid white;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .secondary-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-3px);
        }

        .scroll-hint {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          color: #a0aec0;
          font-size: 0.875rem;
          text-align: center;
          animation: fadeInUp 2s ease-in-out infinite;
        }

        .scroll-arrow {
          margin-top: 0.5rem;
          font-size: 1.5rem;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes fadeInUp {
          0%, 100% {
            opacity: 0.5;
            transform: translateX(-50%) translateY(10px);
          }
          50% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(10px);
          }
        }

        .about-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .about-content h3 {
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 2rem;
          color: var(--text-primary);
          text-align: center;
        }

        .about-message {
          background-color: var(--card-bg);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: var(--shadow-sm);
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 2px dashed var(--border-color);
        }

        .about-message p {
          color: var(--text-secondary);
          font-size: 1.125rem;
          font-style: italic;
        }

        /* 关于本站 */
        .site-info {
          margin: 3rem 0;
          padding: 2rem;
          background-color: var(--card-bg);
          border-radius: 12px;
          box-shadow: var(--shadow-sm);
        }

        .site-info h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .site-basic {
          margin-bottom: 2rem;
        }

        .site-basic h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }

        .site-basic p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .site-details {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background-color: var(--border-light);
          border-radius: 8px;
        }

        .site-item {
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
        }

        .site-label {
          font-weight: 500;
          color: var(--text-primary);
          min-width: 100px;
        }

        .site-value {
          color: var(--text-secondary);
        }

        .site-stats h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1.5rem;
        }

        .stat-item {
          text-align: center;
          padding: 1.5rem;
          background-color: var(--border-light);
          border-radius: 8px;
          transition: var(--transition);
        }

        .stat-item:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-sm);
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--accent-color);
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        /* 主题切换 */
        .theme-toggle {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: var(--transition);
          margin-right: 1rem;
        }

        .theme-toggle:hover {
          background-color: var(--border-light);
          transform: scale(1.1);
        }

        /* 夜间模式 */
        .app.dark-mode {
          --primary-color: #1a202c;
          --secondary-color: #2d3748;
          --text-primary: #e2e8f0;
          --text-secondary: #a0aec0;
          --text-light: #718096;
          --background-color: #1a202c;
          --card-bg: #2d3748;
          --border-color: #4a5568;
          --border-light: #2d3748;
          --accent-color: #4fd1c5;
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
          --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.5);
        }

        @media (max-width: 768px) {
          .about-header {
            padding: 3rem 1.5rem;
          }

          .about-header h2 {
            font-size: 2rem;
          }

          .about-buttons {
            flex-direction: column;
            align-items: center;
          }

          .primary-btn,
          .secondary-btn {
            width: 100%;
            max-width: 300px;
          }

          .about-content {
            padding: 0 1.5rem;
          }
        }

        /* 未登录提示 */
        .login-prompt {
          background-color: var(--border-light);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .login-prompt p {
          margin-bottom: 1rem;
          color: var(--text-secondary);
        }

        .login-prompt button {
          background-color: var(--accent-color);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: var(--transition);
        }

        .login-prompt button:hover {
          background-color: #319795;
        }
      `}</style>
    </div>
  );
}

export default App;