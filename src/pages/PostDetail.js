import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const contentRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyForm, setReplyForm] = useState({ author: '', email: '', content: '' });
  const [replySubmitting, setReplySubmitting] = useState(false);

  const openLightbox = useCallback((src) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

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

  // 图片点击放大
  useEffect(() => {
    if (!post || !contentRef.current) return;
    const imgs = contentRef.current.querySelectorAll('img');
    const handlers = [];
    imgs.forEach(img => {
      img.style.cursor = 'zoom-in';
      const handler = () => openLightbox(img.src);
      img.addEventListener('click', handler);
      handlers.push({ img, handler });
    });
    return () => {
      handlers.forEach(({ img, handler }) => img.removeEventListener('click', handler));
    };
  }, [post, openLightbox]);

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

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyForm.author.trim() || !replyForm.email.trim() || !replyForm.content.trim()) {
      alert('请填写完整信息'); return;
    }
    setReplySubmitting(true);
    try {
      await fetch(`${API}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...replyForm, postId: id, parentId })
      });
      alert('回复已提交，等待审核');
      setReplyForm({ author: '', email: '', content: '' });
      setReplyingTo(null);
    } catch (err) {
      alert('提交失败');
    } finally {
      setReplySubmitting(false);
    }
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

        <div className="post-detail-content" ref={contentRef} dangerouslySetInnerHTML={{ __html: post.content }} />

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

          {comments.filter(c => !c.parentId).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>暂无评论，快来发表第一条评论吧！</p>
          ) : (
            comments.filter(c => !c.parentId).map(c => (
              <div key={c._id} className="comment-item">
                <span className="comment-author">{c.author}</span>
                <span className="comment-time">{new Date(c.createdAt).toLocaleDateString()}</span>
                <div className="comment-body">{c.content}</div>
                <div className="comment-actions">
                  <button className="action-btn" onClick={() => handleCommentLike(c._id)} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                    ❤️ {c.likeCount || 0}
                  </button>
                  <button className="action-btn" onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)}
                    style={{ padding: '4px 12px', fontSize: '0.8rem', marginLeft: 8 }}>
                    💬 {replyingTo === c._id ? '取消回复' : '回复'}
                  </button>
                </div>

                {/* 回复表单 */}
                {replyingTo === c._id && (
                  <form className="reply-form" onSubmit={e => handleReplySubmit(e, c._id)}>
                    <div className="reply-form-row">
                      <input placeholder="昵称 *" value={replyForm.author}
                        onChange={e => setReplyForm({...replyForm, author: e.target.value})} required />
                      <input type="email" placeholder="邮箱 *" value={replyForm.email}
                        onChange={e => setReplyForm({...replyForm, email: e.target.value})} required />
                    </div>
                    <textarea placeholder={`回复 @${c.author}...`} value={replyForm.content}
                      onChange={e => setReplyForm({...replyForm, content: e.target.value})} required rows="3" />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button type="submit" className="comment-submit-btn" disabled={replySubmitting}
                        style={{ padding: '6px 18px', fontSize: '0.83rem' }}>
                        {replySubmitting ? '提交中...' : '发表回复'}
                      </button>
                      <button type="button" onClick={() => setReplyingTo(null)}
                        style={{ padding: '6px 14px', fontSize: '0.83rem', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer' }}>
                        取消
                      </button>
                    </div>
                  </form>
                )}

                {/* 嵌套回复 */}
                {comments.filter(r => r.parentId && String(r.parentId) === String(c._id)).map(reply => (
                  <div key={reply._id} className="comment-reply">
                    <span className="comment-author" style={{ fontSize: '0.85rem' }}>{reply.author}</span>
                    <span className="comment-time">{new Date(reply.createdAt).toLocaleDateString()}</span>
                    <div className="comment-body" style={{ fontSize: '0.83rem' }}>{reply.content}</div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 图片灯箱 */}
      {lightboxSrc && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: '16px',
          }}
        >
          <img
            src={lightboxSrc}
            alt="放大图"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              userSelect: 'none',
            }}
          />
          <button
            onClick={closeLightbox}
            style={{
              position: 'fixed', top: 16, right: 20,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', fontSize: '1.6rem', cursor: 'pointer',
              borderRadius: '50%', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
            aria-label="关闭"
          >×</button>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
