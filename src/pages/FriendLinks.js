import React, { useState, useEffect, useCallback } from 'react';

const API = '/api';

const FriendLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 申请友链表单
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', avatar: '', description: '' });
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');
  const [applyDone, setApplyDone] = useState(false);

  useEffect(() => {
    fetch(`${API}/friendlinks`).then(r => r.json()).then(d => { setLinks(d.links || []); setLoading(false); }).catch(() => setLoading(false));
    fetch(`${API}/visitors/track`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ page: '/friends' }) }).catch(() => {});
  }, []);

  const defaultAvatar = (name) => `data:image/svg+xml;base64,${btoa(`<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#6366f1"/><text x="50" y="58" text-anchor="middle" fill="white" font-size="32" font-family="sans-serif">${name.charAt(0)}</text></svg>`)}`;

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch(`${API}/friendlinks/captcha`);
      const data = await res.json();
      setCaptchaSvg(data.svg);
      setCaptchaId(data.sessionId);
      setCaptchaInput('');
    } catch {
      setApplyMsg('验证码加载失败，请确认后端已启动');
    }
  }, []);

  const openForm = () => {
    setShowForm(true);
    setApplyDone(false);
    setApplyMsg('');
    fetchCaptcha();
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) { setApplyMsg('名称和网站链接必填'); return; }
    if (!captchaInput.trim()) { setApplyMsg('请输入验证码'); return; }
    setSubmitting(true);
    setApplyMsg('');
    try {
      const res = await fetch(`${API}/friendlinks/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sessionId: captchaId, captcha: captchaInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplyDone(true);
        setApplyMsg(data.message || '申请已提交，等待站长审核');
        setForm({ name: '', url: '', avatar: '', description: '' });
      } else {
        setApplyMsg(data.message || '提交失败');
        fetchCaptcha();
      }
    } catch {
      setApplyMsg('网络错误，请重试');
      fetchCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content container">
      <div className="section-header" style={{ marginBottom: 30 }}>
        <h2 className="section-title">友情链接</h2>
        <p className="section-subtitle">我的朋友们</p>
        <div className="section-divider" />
      </div>

      {loading ? (
        <div className="loading-spinner">加载中...</div>
      ) : links.length === 0 ? (
        <div className="no-data">暂无友链</div>
      ) : (
        <div className="friend-links-grid">
          {links.map(link => {
            const href = link.url && !/^https?:\/\//i.test(link.url) ? `https://${link.url}` : link.url;
            return (
            <a key={link._id} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="friend-card">
                <img src={link.avatar ? link.avatar : defaultAvatar(link.name)}
                  alt={link.name} className="friend-avatar" />
                <div className="friend-info">
                  <div className="friend-name">{link.name}</div>
                  {link.description && <div className="friend-desc">{link.description}</div>}
                  <div className="friend-url">{link.url}</div>
                </div>
              </div>
            </a>
            );
          })}
        </div>
      )}

      {/* 申请友链 */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        {!showForm && (
          <button className="btn-primary" onClick={openForm}>+ 申请加入友链</button>
        )}
      </div>
      {showForm && (
        <div className="glass-card" style={{ maxWidth: 580, margin: '20px auto', padding: 24 }}>
          {applyDone ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ color: '#4ade80', fontSize: '1rem', marginBottom: 14 }}>✓ {applyMsg}</p>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>关闭</button>
            </div>
          ) : (
            <form onSubmit={handleApply}>
              <h4 style={{ marginBottom: 16 }}>申请加入友链</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>名称 *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="你的网站名" />
                </div>
                <div className="form-group">
                  <label>网站链接 *</label>
                  <input className="form-input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://" />
                </div>
                <div className="form-group">
                  <label>头像 URL（选填）</label>
                  <input className="form-input" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} placeholder="头像图片链接" />
                </div>
                <div className="form-group">
                  <label>描述（选填）</label>
                  <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="一句话介绍" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label>验证码</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="captcha-svg" dangerouslySetInnerHTML={{ __html: captchaSvg }} onClick={fetchCaptcha} title="点击刷新" style={{ cursor: 'pointer' }} />
                  <button type="button" className="captcha-refresh" onClick={fetchCaptcha} title="刷新验证码">↻</button>
                  <input className="form-input" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} placeholder="输入验证码" maxLength={8} style={{ maxWidth: 160 }} />
                </div>
              </div>
              {applyMsg && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 4 }}>{applyMsg}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? '提交中...' : '提交申请'}</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendLinks;
