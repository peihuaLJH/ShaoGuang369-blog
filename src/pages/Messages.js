import React, { useState, useEffect } from 'react';

const API = '/api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nickname: '', email: '', content: '', website: '' });
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyForm, setReplyForm] = useState({ nickname: '', email: '', content: '' });
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/messages`).then(r => r.json()).then(d => { setMessages(d.messages || []); setLoading(false); }).catch(() => setLoading(false));
    fetch(`${API}/visitors/track`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ page: '/messages' }) }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nickname.trim() || !form.email.trim() || !form.content.trim()) {
      alert('昵称、邮箱和内容为必填项'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('留言已提交，等待审核后发布');
      setForm({ nickname: '', email: '', content: '', website: '' });
      setShowForm(false);
    } catch (err) {
      alert(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyForm.nickname.trim() || !replyForm.email.trim() || !replyForm.content.trim()) {
      alert('昵称、邮箱和内容为必填项'); return;
    }
    setReplySubmitting(true);
    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...replyForm, parentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert('回复已提交，等待审核后发布');
      setReplyForm({ nickname: '', email: '', content: '' });
      setReplyingTo(null);
    } catch (err) {
      alert(err.message || '提交失败');
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="page-content container">
      <div className="section-header" style={{ marginBottom: 30 }}>
        <h2 className="section-title">留言板</h2>
        <p className="section-subtitle">写下你想说的话</p>
        <div className="section-divider" />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '收起' : '✏️ 写下留言'}
        </button>
      </div>

      {showForm && (
        <div className="message-form glass-card">
          <h3 style={{ marginBottom: 20, textAlign: 'center' }}>写下你的留言</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>昵称 *</label>
              <input className="form-input" value={form.nickname}
                onChange={e => setForm({...form, nickname: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>邮箱 *</label>
              <input type="email" className="form-input" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>留言内容 *</label>
              <textarea className="form-textarea" value={form.content}
                onChange={e => setForm({...form, content: e.target.value})} required rows="4" />
            </div>
            <div className="form-group">
              <label>你的博客网站（可选）</label>
              <input className="form-input" value={form.website} placeholder="https://"
                onChange={e => setForm({...form, website: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? '提交中...' : '提交留言'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">加载中...</div>
      ) : messages.filter(m => !m.parentId).length === 0 ? (
        <div className="no-data">暂无留言，快来写下第一条留言吧！</div>
      ) : (
        <div className="message-wall">
          {messages.filter(m => !m.parentId).map(msg => (
            <div key={msg._id} className="message-card">
              <div className="message-header">
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0 }}>
                  {msg.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="message-nickname">{msg.nickname}</div>
                  <div className="message-time">{new Date(msg.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="message-body">{msg.content}</div>
              {msg.website && (
                <div style={{ marginTop: 8 }}>
                  <a href={msg.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem' }}>
                    🔗 {msg.website}
                  </a>
                </div>
              )}

              {/* 回复列表 */}
              {messages.filter(r => r.parentId && String(r.parentId) === String(msg._id)).map(reply => (
                <div key={reply._id} className="message-reply">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '0.72rem', flexShrink: 0 }}>
                      {reply.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="message-reply-author">{reply.nickname}</span>
                    <span className="message-reply-time">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="message-reply-body">{reply.content}</div>
                </div>
              ))}

              {/* 回复按钮 */}
              <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <button onClick={() => setReplyingTo(replyingTo === msg._id ? null : msg._id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 0' }}>
                  💬 {replyingTo === msg._id ? '取消回复' : '回复'}
                </button>
              </div>

              {/* 回复表单 */}
              {replyingTo === msg._id && (
                <form className="message-reply-form" onSubmit={e => handleReplySubmit(e, msg._id)}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                    <input placeholder="昵称 *" value={replyForm.nickname}
                      onChange={e => setReplyForm({...replyForm, nickname: e.target.value})} required
                      style={{ flex: 1 }} />
                    <input type="email" placeholder="邮箱 *" value={replyForm.email}
                      onChange={e => setReplyForm({...replyForm, email: e.target.value})} required
                      style={{ flex: 1 }} />
                  </div>
                  <textarea placeholder={`回复 @${msg.nickname}...`} value={replyForm.content}
                    onChange={e => setReplyForm({...replyForm, content: e.target.value})} required rows="2" />
                  <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
                    <button type="submit" className="btn-primary" disabled={replySubmitting}
                      style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                      {replySubmitting ? '提交中...' : '发表回复'}
                    </button>
                    <button type="button" onClick={() => setReplyingTo(null)}
                      style={{ padding: '6px 12px', fontSize: '0.82rem', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer' }}>
                      取消
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
