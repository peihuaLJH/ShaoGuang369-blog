import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API = '/api';

const Essays = () => {
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch(`${API}/visitors/track`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ page: '/essays' }) }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/posts?type=essay&page=${page}&limit=10`)
      .then(r => r.json())
      .then(d => { setEssays(d.posts || []); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="page-content container">
      <div className="section-header" style={{ marginBottom: 30 }}>
        <h2 className="section-title">随笔</h2>
        <p className="section-subtitle">生活趣事与感悟随笔</p>
        <div className="section-divider" />
      </div>

      {loading ? (
        <div className="loading-spinner">加载中...</div>
      ) : essays.length === 0 ? (
        <div className="no-data">暂无随笔</div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 16 }}>
            {essays.map(essay => (
              <Link to={`/post/${essay._id}`} key={essay._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="essay-card">
                  <h3 className="essay-card-title">{essay.title}</h3>
                  <p className="essay-card-summary">{essay.summary || (essay.content || '').replace(/<[^>]+>/g, '').substring(0, 150)}</p>
                  <div className="essay-card-meta">
                    <span>📅 {new Date(essay.createdAt).toLocaleDateString()}</span>
                    <span>👁 {essay.viewCount}</span>
                    <span>👍 {essay.likeCount}</span>
                    <span>💬 {essay.commentCount || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}>上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Essays;
