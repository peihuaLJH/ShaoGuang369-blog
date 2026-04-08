import React, { useState, useEffect } from 'react';

const API = '/api';

const PALETTE = ['#7c6af7', '#4ade80', '#fb923c', '#38bdf8', '#f472b6', '#a3e635', '#94a3b8'];
const DEVICE_LABEL = { desktop: '💻 电脑', android: '🤖 安卓', ios: '🍎 iOS', mobile: '📱 手机', tablet: '📟 平板' };
const BROWSER_ICON = { Chrome: '🟡', Edge: '🔵', Firefox: '🟠', Safari: '⚪', Opera: '🔴', Other: '⚫' };

const DistBar = ({ label, value, total, color }) => {
  const pct = total ? Math.round(value / total * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 5 }}>
        <span style={{ color: 'var(--text-main)' }}>{label}</span>
        <span style={{ color: 'var(--text-dim)' }}>{value} 次 &nbsp;{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-main)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
};

const DonutChart = ({ data, total, size = 110 }) => {
  const r = 38; const cx = size / 2; const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map((d, i) => {
    const frac = total ? d.value / total : 0;
    const dash = frac * circumference;
    const gap = circumference - dash;
    const slice = { offset, dash, gap, color: PALETTE[i % PALETTE.length] };
    offset += dash;
    return slice;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-main)" strokeWidth="16" />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="16"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
        />
      ))}
      <text x={cx} y={cy + 5} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: 'var(--text-main)', fontSize: 13, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}>
        {total}
      </text>
    </svg>
  );
};

const About = ({ settings }) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/visitors/stats`).then(r => r.json()).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
    fetch(`${API}/visitors/track`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ page: '/about' }) }).catch(() => {});
  }, []);

  const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxMDAiIGZpbGw9IiM4YjVjZjYiLz48dGV4dCB4PSIxMDAiIHk9IjExMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iNTAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7phbY8L3RleHQ+PC9zdmc+';
  const avatarUrl = settings?.avatar ? `${settings.avatar}` : defaultAvatar;
  const quote = settings?.quote || '允许自己走慢点，但别停下';
  const siteDesc = settings?.siteDescription || '韶光的个人博客 - 分享跨境电商学习日常与生活随笔';

  const deviceData = (stats.deviceStats || []).map(d => ({ label: DEVICE_LABEL[d._id] || d._id || '其他', value: d.count }));
  const browserData = (stats.browserStats || []).sort((a, b) => b.count - a.count);
  const trend = stats.dailyTrend || [];
  const trendMax = Math.max(...trend.map(t => t.count), 1);
  const devTotal = deviceData.reduce((s, d) => s + d.value, 0);
  const brwTotal = browserData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="page-content container">
      <div className="section-header" style={{ marginBottom: 30 }}>
        <h2 className="section-title">关于</h2>
        <div className="section-divider" />
      </div>

      {/* 个人信息 */}
      <div className="glass-card about-profile">
        <img src={avatarUrl} alt="韶光" className="about-avatar" />
        <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>韶光</h2>
        <p className="about-quote">"{quote}"</p>
        <p style={{ color: 'var(--text-dim)', marginTop: 16, maxWidth: 500, margin: '16px auto 0', lineHeight: 1.8 }}>
          {siteDesc}
        </p>
      </div>

      {/* 统计数据 */}
      <h3 style={{ textAlign: 'center', margin: '36px 0 20px', color: 'var(--text-dim)', fontSize: '1rem', letterSpacing: 2 }}>📊 站点统计</h3>
      {loading ? (
        <div className="loading-spinner">加载中...</div>
      ) : (
        <>
          {/* 概要卡片 */}
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-number">{stats.uniqueVisitors ?? 0}</div><div className="stat-label">独立访客 IP</div></div>
            <div className="stat-card"><div className="stat-number">{stats.totalVisitors ?? 0}</div><div className="stat-label">总访问次数</div></div>
            <div className="stat-card"><div className="stat-number">{stats.blogCount ?? 0}</div><div className="stat-label">博客文章</div></div>
            <div className="stat-card"><div className="stat-number">{stats.essayCount ?? 0}</div><div className="stat-label">随笔数量</div></div>
            <div className="stat-card"><div className="stat-number">{stats.totalLikes ?? 0}</div><div className="stat-label">总点赞数</div></div>
            <div className="stat-card"><div className="stat-number">{stats.totalComments ?? 0}</div><div className="stat-label">总评论数</div></div>
          </div>

          {/* 图表区 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>

            {/* 近7天访客趋势 */}
            <div className="glass-card" style={{ padding: '20px 24px', gridColumn: '1 / -1' }}>
              <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>📈 近7天访客趋势</div>
              {trend.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130, paddingBottom: 24, borderBottom: '1px solid var(--border)', position: 'relative' }}>
                  {trend.map((t, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 2 }}>{t.count}</span>
                      <div style={{
                        width: '70%', background: 'linear-gradient(180deg, #a78bfa, #7c6af7)',
                        borderRadius: '5px 5px 0 0',
                        height: `${Math.max((t.count / trendMax) * 80, 3)}px`,
                        transition: 'height 0.5s ease', minHeight: 3
                      }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, position: 'absolute', bottom: 0 }}>{t._id}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '30px 0', fontSize: '0.85rem' }}>暂无访问数据</div>
              )}
            </div>

            {/* 设备分布 */}
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div style={{ fontWeight: 600, marginBottom: 14, fontSize: '0.95rem' }}>📱 设备分布</div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <DonutChart data={deviceData} total={devTotal} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {deviceData.length > 0
                    ? deviceData.map((d, i) => <DistBar key={i} label={d.label} value={d.value} total={devTotal} color={PALETTE[i % PALETTE.length]} />)
                    : <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>暂无数据</div>}
                </div>
              </div>
            </div>

            {/* 浏览器分布 */}
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div style={{ fontWeight: 600, marginBottom: 14, fontSize: '0.95rem' }}>🌐 浏览器分布</div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <DonutChart data={browserData.map(d => ({ value: d.count }))} total={brwTotal} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {browserData.length > 0
                    ? browserData.map((d, i) => (
                        <DistBar key={i}
                          label={`${BROWSER_ICON[d._id] || '⚫'} ${d._id || '其他'}`}
                          value={d.count} total={brwTotal} color={PALETTE[i % PALETTE.length]}
                        />
                      ))
                    : <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>暂无数据</div>}
                </div>
              </div>
            </div>

          </div>

          {/* 省份分布 */}
          {stats.provinceStats && stats.provinceStats.length > 0 && (
            <div className="glass-card" style={{ padding: 24, marginTop: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 14, fontSize: '0.95rem' }}>🗺️ 访客省份分布</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {stats.provinceStats.map(p => (
                  <span key={p._id} className="post-tag" style={{ padding: '4px 12px' }}>
                    {p._id} ({p.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default About;
