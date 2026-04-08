import React, { useState, useEffect } from 'react';

const API = '/api';

const FriendLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/friendlinks`).then(r => r.json()).then(d => { setLinks(d.links || []); setLoading(false); }).catch(() => setLoading(false));
    fetch(`${API}/visitors/track`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ page: '/friends' }) }).catch(() => {});
  }, []);

  const defaultAvatar = (name) => `data:image/svg+xml;base64,${btoa(`<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#6366f1"/><text x="50" y="58" text-anchor="middle" fill="white" font-size="32" font-family="sans-serif">${name.charAt(0)}</text></svg>`)}`;

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
          {links.map(link => (
            <a key={link._id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendLinks;
