import React, { useState, useEffect } from 'react';
import { commentApi } from '../api/api';

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newComment, setNewComment] = useState({ 
    nickname: '', 
    email: '', 
    content: '' 
  });
  const [submitting, setSubmitting] = useState(false);

  // 获取评论列表
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await commentApi.getComments(postId);
        setComments(response.comments);
      } catch (err) {
        setError('获取评论失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  // 验证邮箱格式
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 提交评论
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!newComment.nickname || !newComment.email || !newComment.content) {
      setError('请填写昵称、邮箱和评论内容');
      return;
    }

    // 验证邮箱格式
    if (!validateEmail(newComment.email)) {
      setError('请输入有效的邮箱地址（例如：example@email.com）');
      return;
    }

    // 验证评论长度
    if (newComment.content.length > 2000) {
      setError('评论内容不能超过2000字');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await commentApi.createComment({
        postId,
        nickname: newComment.nickname,
        email: newComment.email,
        content: newComment.content
      });
      
      // 显示成功提示
      setSuccess(response.message || '评论提交成功，等待审核后显示');
      
      // 清空表单
      setNewComment({ nickname: '', email: '', content: '' });
      
      // 3秒后清除成功提示
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      setError(err.message || '提交评论失败，请稍后重试');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 点赞评论
  const handleLikeComment = async (commentId) => {
    try {
      const response = await commentApi.likeComment(commentId);
      setComments(comments.map(comment => 
        comment._id === commentId 
          ? { ...comment, likeCount: response.likeCount }
          : comment
      ));
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  return (
    <div className="comment-section">
      <h3>评论 ({comments.length})</h3>
      
      {/* 评论表单 */}
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nickname">
              昵称 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="nickname"
              value={newComment.nickname}
              onChange={(e) => setNewComment({ ...newComment, nickname: e.target.value })}
              placeholder="你的昵称"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">
              邮箱 <span className="required">*</span>
              <span className="email-hint">（不会公开）</span>
            </label>
            <input
              type="email"
              id="email"
              value={newComment.email}
              onChange={(e) => setNewComment({ ...newComment, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="content">
            评论内容 <span className="required">*</span>
          </label>
          <textarea
            id="content"
            value={newComment.content}
            onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
            placeholder="写下你的想法...（支持换行，最多2000字）"
            rows="4"
            maxLength="2000"
            required
          ></textarea>
          <div className="char-count">
            {newComment.content.length} / 2000
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-footer">
          <span className="review-hint">评论经审核后显示，请文明交流。</span>
          <button type="submit" disabled={submitting} className="submit-btn">
            {submitting ? '提交中...' : '提交评论'}
          </button>
        </div>
      </form>

      {/* 评论列表 */}
      {loading ? (
        <div className="loading">加载评论中...</div>
      ) : (
        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="no-comments">暂无评论，快来发表第一条评论吧！</div>
          ) : (
            comments.map(comment => (
              <div key={comment._id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-author">
                    <div className="comment-avatar">
                      {comment.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="comment-nickname">{comment.nickname}</span>
                  </div>
                  <span className="comment-time">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="comment-content">{comment.content}</div>
                <div className="comment-footer">
                  <button 
                    className="like-btn"
                    onClick={() => handleLikeComment(comment._id)}
                  >
                    👍 {comment.likeCount}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
