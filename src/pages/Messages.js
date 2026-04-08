import React, { useState, useEffect } from 'react';

const API = '/api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nickname: '', email: '', content: '', website: '' });
  const [submitting, setSubmitting] = useState(false);

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
      ) : messages.length === 0 ? (
        <div className="no-data">暂无留言，快来写下第一条留言吧！</div>
      ) : (
        <div className="message-wall">
          {messages.map(msg => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
