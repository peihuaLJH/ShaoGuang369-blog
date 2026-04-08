import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';const API = '/api';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState({ author: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/posts/${id}`)
      .then(r => r.json())
      .then(d => { setPost(d); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`${API}/comments/post/${id}`)
      .then(r => r.json())
      .then(d => setComments(d.comments || []))
      .catch(() => {});
    fetch(`${API}/visitors/track`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ page: `/post/${id}` }) }).catch(() => {});
  }, [id]);

  const handleLike = async () => {
    if (liked) return;
    try {
      const res = await fetch(`${API}/posts/${id}/like`, { method: 'POST' });
      const data = await res.json();
      setPost(p => ({ ...p, likeCount: data.likeCount }));
      setLiked(true);
    } catch (e) {}
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.author.trim() || !newComment.email.trim() || !newComment.content.trim()) {
      alert('请填写完整信息'); return;
    }
    setSubmitting(true);
    try {
      await fetch(`${API}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newComment, postId: id })
      });
      alert('评论已提交，等待审核');
      setNewComment({ author: '', email: '', content: '' });
    } catch (err) {
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const res = await fetch(`${API}/comments/${commentId}/like`, { method: 'POST' });
      const data = await res.json();
      setComments(comments.map(c => c._id === commentId ? { ...c, likeCount: data.likeCount } : c));
    } catch (e) {}
  };

  if (loading) return <div className="page-content container"><div className="loading-spinner">加载中...</div></div>;
  if (!post) return <div className="page-content container"><div className="no-data">文章不存在</div></div>;

  return (
    <div className="page-content container">
      <div className="post-detail">
        <button className="back-btn" onClick={() => navigate(post.type === 'essay' ? '/essays' : '/blog')}>
          ← 返回{post.type === 'essay' ? '随笔' : '博客'}
        </button>

        <h1 className="post-detail-title">{post.title}</h1>
        <div className="post-detail-meta">
          <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
          <span>👁 浏览 {post.viewCount}</span>
          <span>👍 点赞 {post.likeCount}</span>
          {post.category && <span>📁 {post.category}</span>}
        </div>

        <div className="post-detail-content" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="post-actions">
          <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
            {liked ? '❤️' : '🤍'} 点赞 ({post.likeCount})
          </button>
        </div>

        {/* 评论区 */}
        <div className="comments-section">
          <h3 className="comments-title">评论 ({comments.length})</h3>

          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <div className="comment-form-row">
              <input placeholder="昵称 *" value={newComment.author}
                onChange={e => setNewComment({...newComment, author: e.target.value})} required />
              <input type="email" placeholder="邮箱 *" value={newComment.email}
                onChange={e => setNewComment({...newComment, email: e.target.value})} required />
            </div>
            <textarea placeholder="写下你的评论..." value={newComment.content}
              onChange={e => setNewComment({...newComment, content: e.target.value})} required rows="4" />
            <button type="submit" className="comment-submit-btn" disabled={submitting}>
              {submitting ? '提交中...' : '发表评论'}
            </button>
          </form>

          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>暂无评论，快来发表第一条评论吧！</p>
          ) : (
            comments.map(c => (
              <div key={c._id} className="comment-item">
                <span className="comment-author">{c.author}</span>
                <span className="comment-time">{new Date(c.createdAt).toLocaleDateString()}</span>
                <div className="comment-body">{c.content}</div>
                <div className="comment-actions">
                  <button className="action-btn" onClick={() => handleCommentLike(c._id)} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                    ❤️ {c.likeCount || 0}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
