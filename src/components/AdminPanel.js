import React, { useState, useEffect } from 'react';
import { postApi, commentApi, statsApi } from '../api/api';
// import MarkdownEditor from './MarkdownEditor';

const AdminPanel = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [commentFilter, setCommentFilter] = useState('all');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    summary: '',
    categories: [],
    tags: []
  });

  // 获取文章列表
  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [activeTab]);

  // 获取评论列表
  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab, commentFilter]);

  // 获取统计数据
  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postApi.getPosts({ limit: 100 });
      setPosts(response.posts);
    } catch (err) {
      setError('获取文章失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (commentFilter !== 'all') {
        params.status = commentFilter;
      }
      const response = await commentApi.getAllComments(params);
      setComments(response.comments);
    } catch (err) {
      setError('获取评论失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsData, totalStats] = await Promise.all([
        statsApi.getStats({ days: 30 }),
        statsApi.getTotalStats()
      ]);
      setStats({ daily: statsData, total: totalStats });
    } catch (err) {
      setError('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await postApi.createPost(newPost);
      setNewPost({ title: '', content: '', summary: '', categories: [], tags: [] });
      fetchPosts();
      showSuccess('文章创建成功');
    } catch (err) {
      setError('创建文章失败');
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    try {
      await postApi.updatePost(editingPost._id, editingPost);
      setEditingPost(null);
      fetchPosts();
      showSuccess('文章更新成功');
    } catch (err) {
      setError('更新文章失败');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      try {
        await postApi.deletePost(postId);
        fetchPosts();
        showSuccess('文章删除成功');
      } catch (err) {
        setError('删除文章失败');
      }
    }
  };

  // 审核评论
  const handleReviewComment = async (commentId, status) => {
    try {
      await commentApi.reviewComment(commentId, status);
      fetchComments();
      showSuccess(status === 'approved' ? '评论已通过审核' : '评论已拒绝');
    } catch (err) {
      setError('审核评论失败');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('确定要删除这条评论吗？')) {
      try {
        await commentApi.deleteComment(commentId);
        fetchComments();
        showSuccess('评论删除成功');
      } catch (err) {
        setError('删除评论失败');
      }
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  // 获取状态显示文本
  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝'
    };
    return statusMap[status] || status;
  };

  // 获取状态样式
  const getStatusClass = (status) => {
    const classMap = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected'
    };
    return classMap[status] || '';
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>后台管理系统</h1>
        <button onClick={handleLogout} className="logout-btn">退出登录</button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          文章管理
        </button>
        <button 
          className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          评论管理
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          统计数据
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* 文章管理 */}
      {activeTab === 'posts' && (
        <div className="posts-tab">
          {/* 创建文章 */}
          <div className="create-post">
            <h2>创建新文章</h2>
            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <label htmlFor="title">标题</label>
                <input
                  type="text"
                  id="title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="summary">摘要</label>
                <textarea
                  id="summary"
                  value={newPost.summary}
                  onChange={(e) => setNewPost({ ...newPost, summary: e.target.value })}
                  rows="2"
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="content">内容（Markdown）</label>
                <textarea
                  id="content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows="10"
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="categories">分类（逗号分隔）</label>
                <input
                  type="text"
                  id="categories"
                  value={newPost.categories.join(', ')}
                  onChange={(e) => setNewPost({ ...newPost, categories: e.target.value.split(',').map(c => c.trim()) })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="tags">标签（逗号分隔）</label>
                <input
                  type="text"
                  id="tags"
                  value={newPost.tags.join(', ')}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value.split(',').map(t => t.trim()) })}
                />
              </div>
              <button type="submit">创建文章</button>
            </form>
          </div>

          {/* 文章列表 */}
          <div className="posts-list">
            <h2>文章列表</h2>
            {loading ? (
              <div className="loading">加载中...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>发布时间</th>
                    <th>浏览量</th>
                    <th>点赞数</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post._id}>
                      <td>{post.title}</td>
                      <td>{new Date(post.createdAt).toLocaleString()}</td>
                      <td>{post.viewCount}</td>
                      <td>{post.likeCount}</td>
                      <td>
                        <button onClick={() => setEditingPost(post)}>编辑</button>
                        <button onClick={() => handleDeletePost(post._id)}>删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 编辑文章 */}
          {editingPost && (
            <div className="edit-post">
              <h2>编辑文章</h2>
              <form onSubmit={handleUpdatePost}>
                <div className="form-group">
                  <label htmlFor="edit-title">标题</label>
                  <input
                    type="text"
                    id="edit-title"
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-summary">摘要</label>
                  <textarea
                    id="edit-summary"
                    value={editingPost.summary}
                    onChange={(e) => setEditingPost({ ...editingPost, summary: e.target.value })}
                    rows="2"
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-content">内容（Markdown）</label>
                  <textarea
                    id="edit-content"
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    rows="10"
                    required
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-categories">分类（逗号分隔）</label>
                  <input
                    type="text"
                    id="edit-categories"
                    value={editingPost.categories.join(', ')}
                    onChange={(e) => setEditingPost({ ...editingPost, categories: e.target.value.split(',').map(c => c.trim()) })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-tags">标签（逗号分隔）</label>
                  <input
                    type="text"
                    id="edit-tags"
                    value={editingPost.tags.join(', ')}
                    onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(',').map(t => t.trim()) })}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit">保存更改</button>
                  <button type="button" onClick={() => setEditingPost(null)}>取消</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 评论管理 */}
      {activeTab === 'comments' && (
        <div className="comments-tab">
          <div className="comments-header">
            <h2>评论列表</h2>
            <div className="filter-tabs">
              <button 
                className={`filter-btn ${commentFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCommentFilter('all')}
              >
                全部
              </button>
              <button 
                className={`filter-btn ${commentFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setCommentFilter('pending')}
              >
                待审核
              </button>
              <button 
                className={`filter-btn ${commentFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setCommentFilter('approved')}
              >
                已通过
              </button>
              <button 
                className={`filter-btn ${commentFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setCommentFilter('rejected')}
              >
                已拒绝
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <table className="comments-table">
              <thead>
                <tr>
                  <th>状态</th>
                  <th>昵称</th>
                  <th>邮箱</th>
                  <th>内容</th>
                  <th>评论时间</th>
                  <th>点赞数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {comments.map(comment => (
                  <tr key={comment._id}>
                    <td>
                      <span className={`status-badge ${getStatusClass(comment.status)}`}>
                        {getStatusText(comment.status)}
                      </span>
                    </td>
                    <td>{comment.nickname}</td>
                    <td>{comment.email}</td>
                    <td>{comment.content.substring(0, 50)}...</td>
                    <td>{new Date(comment.createdAt).toLocaleString()}</td>
                    <td>{comment.likeCount}</td>
                    <td>
                      {comment.status === 'pending' && (
                        <>
                          <button 
                            className="approve-btn"
                            onClick={() => handleReviewComment(comment._id, 'approved')}
                          >
                            通过
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => handleReviewComment(comment._id, 'rejected')}
                          >
                            拒绝
                          </button>
                        </>
                      )}
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {comments.length === 0 && !loading && (
            <div className="no-data">暂无评论</div>
          )}
        </div>
      )}

      {/* 统计数据 */}
      {activeTab === 'stats' && (
        <div className="stats-tab">
          <h2>网站统计</h2>
          {loading ? (
            <div className="loading">加载中...</div>
          ) : stats ? (
            <>
              <div className="total-stats">
                <div className="stat-card">
                  <h3>总页面访问</h3>
                  <p>{stats.total.totalPageViews}</p>
                </div>
                <div className="stat-card">
                  <h3>总独立访客</h3>
                  <p>{stats.total.totalUniqueVisitors}</p>
                </div>
                <div className="stat-card">
                  <h3>总文章浏览</h3>
                  <p>{stats.total.totalPostViews}</p>
                </div>
                <div className="stat-card">
                  <h3>总评论数</h3>
                  <p>{stats.total.totalComments}</p>
                </div>
              </div>
              <div className="daily-stats">
                <h3>近30天数据</h3>
                <table>
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>页面访问</th>
                      <th>独立访客</th>
                      <th>文章浏览</th>
                      <th>评论数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.daily.map(stat => (
                      <tr key={stat._id}>
                        <td>{new Date(stat.date).toLocaleDateString()}</td>
                        <td>{stat.pageViews}</td>
                        <td>{stat.uniqueVisitors}</td>
                        <td>{stat.postViews}</td>
                        <td>{stat.commentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="no-data">暂无统计数据</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
