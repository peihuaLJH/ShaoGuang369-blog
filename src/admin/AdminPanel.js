import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// ===== 扩展 Quill Image Blot 以支持宽高调整 =====
const Quill = ReactQuill.Quill;
if (Quill) {
  const BaseImage = Quill.import('formats/image');
  class ResizableImage extends BaseImage {
    static formats(node) {
      const f = {};
      if (node.hasAttribute('width')) f.width = node.getAttribute('width');
      if (node.hasAttribute('height')) f.height = node.getAttribute('height');
      return f;
    }
    format(name, value) {
      if (name === 'width' || name === 'height') {
        if (value) this.domNode.setAttribute(name, value);
        else this.domNode.removeAttribute(name);
      } else {
        super.format(name, value);
      }
    }
  }
  Quill.register(ResizableImage, true);
}

// 工具栏按钮配置（在组件外部，保持引用稳定）
const TOOLBAR_CONTAINER = [
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'align': [] }],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  [{ 'indent': '-1' }, { 'indent': '+1' }],
  ['blockquote', 'code-block'],
  ['link', 'image', 'video'],
  ['clean'],
  ['format-painter', 'undo', 'redo']
];

const API = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

const AdminPanel = ({ user, onLogout, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { key: 'dashboard', label: '📊 仪表盘' },
    { key: 'blogs', label: '📝 文章管理' },
    { key: 'essays', label: '✍️ 随笔管理' },
    { key: 'categories', label: '📁 分类管理' },
    { key: 'comments', label: '💬 评论管理' },
    { key: 'messages', label: '📮 留言管理' },
    { key: 'friends', label: '🔗 友链管理' },
    { key: 'settings', label: '⚙️ 网站设置' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {tabs.map(t => (
          <div key={t.key} className={`admin-sidebar-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            <span>{t.label}</span>
          </div>
        ))}
        <div className="admin-sidebar-item" onClick={onLogout} style={{ marginTop: 20, color: '#ef4444' }}>
          <span>🚪 退出登录</span>
        </div>
      </aside>

      <main className="admin-main">
        {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'blogs' && <PostManager type="blog" showToast={showToast} />}
        {activeTab === 'essays' && <PostManager type="essay" showToast={showToast} />}
        {activeTab === 'categories' && <CategoryManager showToast={showToast} />}
        {activeTab === 'comments' && <CommentManager showToast={showToast} />}
        {activeTab === 'messages' && <MessageManager showToast={showToast} />}
        {activeTab === 'friends' && <FriendManager showToast={showToast} />}
        {activeTab === 'settings' && <SettingsManager showToast={showToast} onSettingsChange={onSettingsChange} />}
      </main>
    </div>
  );
};

/* ===== 仪表盘 ===== */
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/visitors/stats`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-dim)' }}>加载中…</div>;
  if (!stats) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-dim)' }}>数据加载失败</div>;

  const PALETTE = ['#7c6af7', '#4ade80', '#fb923c', '#38bdf8', '#f472b6', '#a3e635', '#94a3b8'];
  const DEVICE_LABEL = { desktop: '💻 电脑', android: '🤖 安卓', ios: '🍎 iOS', mobile: '📱 手机', tablet: '📟 平板' };
  const BROWSER_ICON = { Chrome: '🟡', Edge: '🔵', Firefox: '🟠', Safari: '⚪', Opera: '🔴', Other: '⚫' };

  const deviceData = (stats.deviceStats || []).map(d => ({
    label: DEVICE_LABEL[d._id] || d._id || '其他', value: d.count
  }));
  const browserData = (stats.browserStats || []).sort((a, b) => b.count - a.count);
  const trend = (stats.dailyTrend || []);
  const trendMax = Math.max(...trend.map(t => t.count), 1);
  const devTotal = deviceData.reduce((s, d) => s + d.value, 0);
  const brwTotal = browserData.reduce((s, d) => s + d.count, 0);

  /* ---- 带百分比的横向进度条 ---- */
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

  /* ---- SVG 甜甜圈图 ---- */
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
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {/* 背景圈 */}
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

  return (
    <div>
      <h2 className="admin-title">仪表盘</h2>

      {/* ── 概要卡片 ── */}
      <div className="stats-grid" style={{ marginTop: 20, marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-number">{stats.uniqueVisitors ?? 0}</div><div className="stat-label">独立访客 IP</div></div>
        <div className="stat-card"><div className="stat-number">{stats.totalVisitors ?? 0}</div><div className="stat-label">总访问次数</div></div>
        <div className="stat-card"><div className="stat-number">{stats.blogCount ?? 0}</div><div className="stat-label">博客文章</div></div>
        <div className="stat-card"><div className="stat-number">{stats.essayCount ?? 0}</div><div className="stat-label">随笔数量</div></div>
        <div className="stat-card"><div className="stat-number">{stats.totalLikes ?? 0}</div><div className="stat-label">总点赞</div></div>
        <div className="stat-card"><div className="stat-number">{stats.totalComments ?? 0}</div><div className="stat-label">总评论</div></div>
      </div>

      {/* ── 图表区 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>

        {/* 近7天访客趋势 —— 柱状图 */}
        <div className="glass-card" style={{ padding: '20px 24px', gridColumn: '1 / -1' }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: '0.95rem' }}>📈 近7天访客趋势</div>
          {trend.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130, paddingBottom: 24, borderBottom: '1px solid var(--border)', position: 'relative' }}>
              {trend.map((t, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 2 }}>{t.count}</span>
                  <div style={{
                    width: '70%', background: `linear-gradient(180deg, #a78bfa, #7c6af7)`,
                    borderRadius: '5px 5px 0 0',
                    height: `${Math.max((t.count / trendMax) * 80, 3)}px`,
                    transition: 'height 0.5s ease',
                    minHeight: 3
                  }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, position: 'absolute', bottom: 0 }}>{t._id}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.85rem' }}>暂无访问数据</div>
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
                : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>暂无数据</div>}
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
                : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>暂无数据</div>}
            </div>
          </div>
        </div>

        {/* Top 访客 IP */}
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, marginBottom: 14, fontSize: '0.95rem' }}>🌍 活跃访客 IP</div>
          {(stats.topIPs || []).length > 0 ? (
            <table style={{ width: '100%', fontSize: '0.83rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 0 8px', fontWeight: 500 }}>#</th>
                  <th style={{ textAlign: 'left', padding: '4px 0 8px', fontWeight: 500 }}>IP 地址</th>
                  <th style={{ textAlign: 'right', padding: '4px 0 8px', fontWeight: 500 }}>访问次数</th>
                </tr>
              </thead>
              <tbody>
                {stats.topIPs.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 0', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '7px 8px 7px 0', fontFamily: 'monospace', color: 'var(--text-main)' }}>{item._id || '—'}</td>
                    <td style={{ textAlign: 'right', padding: '7px 0', color: 'var(--accent)', fontWeight: 600 }}>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>暂无数据</div>
          )}
        </div>

      </div>
    </div>
  );
};

/* ===== 文章/随笔管理 ===== */
const PostManager = ({ type, showToast }) => {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null); // null=列表, 'new'=新建, post对象=编辑
  const [categories, setCategories] = useState([]);

  const fetchPosts = useCallback(() => {
    fetch(`${API}/posts/admin/all?type=${type}`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => {});
  }, [type]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => {
    if (type === 'blog') {
      fetch(`${API}/categories`).then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
    }
  }, [type]);

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除？')) return;
    await fetch(`${API}/posts/${id}`, { method: 'DELETE', headers: authHeaders() });
    showToast('已删除');
    fetchPosts();
  };

  if (editing !== null) {
    return <PostEditor
      type={type}
      post={editing === 'new' ? null : editing}
      categories={categories}
      onSave={() => { setEditing(null); fetchPosts(); showToast('保存成功'); }}
      onCancel={() => setEditing(null)}
      showToast={showToast}
    />;
  }

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">{type === 'blog' ? '文章管理' : '随笔管理'}</h2>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          + 新建{type === 'blog' ? '文章' : '随笔'}
        </button>
      </div>
      <table className="admin-table">
        <thead><tr><th>标题</th><th>状态</th>{type === 'blog' && <th>分类</th>}<th>浏览</th><th>点赞</th><th>日期</th><th>操作</th></tr></thead>
        <tbody>
          {posts.map(p => (
            <tr key={p._id}>
              <td style={{ fontWeight: 500 }}>{p.title}</td>
              <td><span style={{ color: p.status === 'published' ? '#22c55e' : 'var(--gold)' }}>
                {p.status === 'published' ? '已发布' : '草稿'}</span></td>
              {type === 'blog' && <td>{p.category || '-'}</td>}
              <td>{p.viewCount}</td>
              <td>{p.likeCount}</td>
              <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              <td className="actions">
                <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setEditing(p)}>编辑</button>
                <button className="btn-danger" onClick={() => handleDelete(p._id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {posts.length === 0 && <div className="no-data">暂无{type === 'blog' ? '文章' : '随笔'}</div>}
    </div>
  );
};

/* ===== 文章编辑器 ===== */
const PostEditor = ({ type, post, categories, onSave, onCancel, showToast }) => {
  const [form, setForm] = useState({
    title: post?.title || '',
    content: post?.content || '',
    summary: post?.summary || '',
    coverImage: post?.coverImage || '',
    category: post?.category || '',
    tags: post?.tags?.join(', ') || '',
    status: post?.status || 'published',
    type: type
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const autoSaveRef = useRef(null);
  const quillRef = useRef(null);
  const formatPainterRef = useRef({ active: false, formats: null });
  const lastSelectionRef = useRef(null);  // 追踪最后有效选区，工具栏点击后 getSelection() 返回 null
  const [imageResizer, setImageResizer] = useState(null);
  const [imageWidth, setImageWidth] = useState('');
  const imageUploadRef = useRef(null);

  // 自动保存草稿
  useEffect(() => {
    const draft = localStorage.getItem(`draft_${type}_${post?._id || 'new'}`);
    if (draft && !post) {
      const parsed = JSON.parse(draft);
      if (window.confirm('检测到未保存的草稿，是否恢复？')) {
        setForm(parsed);
      } else {
        localStorage.removeItem(`draft_${type}_${post?._id || 'new'}`);
      }
    }
  }, []);

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      localStorage.setItem(`draft_${type}_${post?._id || 'new'}`, JSON.stringify(form));
    }, 5000);
    return () => clearTimeout(autoSaveRef.current);
  }, [form, type, post]);

  // 工具栏按钮汉字提示
  useEffect(() => {
    const addTitles = () => {
      const toolbar = document.querySelector('.editor-container .ql-toolbar');
      if (!toolbar) return;
      const map = [
        { sel: 'span.ql-header',              title: '标题级别' },
        { sel: 'button.ql-bold',              title: '加粗 (Ctrl+B)' },
        { sel: 'button.ql-italic',            title: '斜体 (Ctrl+I)' },
        { sel: 'button.ql-underline',         title: '下划线 (Ctrl+U)' },
        { sel: 'button.ql-strike',            title: '删除线' },
        { sel: 'span.ql-color',               title: '文字颜色' },
        { sel: 'span.ql-background',          title: '背景颜色' },
        { sel: 'span.ql-align',               title: '对齐方式' },
        { sel: 'button.ql-list[value="ordered"]',  title: '有序列表' },
        { sel: 'button.ql-list[value="bullet"]',   title: '无序列表' },
        { sel: 'button.ql-indent[value="-1"]',     title: '减少缩进' },
        { sel: 'button.ql-indent[value="+1"]',     title: '增加缩进' },
        { sel: 'button.ql-blockquote',        title: '引用' },
        { sel: 'button.ql-code-block',        title: '代码块' },
        { sel: 'button.ql-link',              title: '插入链接' },
        { sel: 'button.ql-image',             title: '插入图片' },
        { sel: 'button.ql-video',             title: '插入视频' },
        { sel: 'button.ql-clean',             title: '清除格式' },
        { sel: 'button.ql-undo',              title: '撤销 (Ctrl+Z)' },
        { sel: 'button.ql-redo',              title: '恢复 (Ctrl+Y)' },
        { sel: 'button.ql-format-painter',    title: '格式刷' },
      ];
      map.forEach(({ sel, title }) => {
        toolbar.querySelectorAll(sel).forEach(el => { el.setAttribute('title', title); });
      });
    };
    const t = setTimeout(addTitles, 200);
    return () => clearTimeout(t);
  }, [previewMode]);

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`${API}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${getToken()}` },
          body: formData
        });
        const data = await res.json();
        if (data.url) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', `${API_HOST}${data.url}`);
          }
        }
      } catch (err) { showToast('上传失败: ' + err.message, 'error'); }
    };
    input.click();
  };
  imageUploadRef.current = handleImageUpload;

  const handleCoverUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData
      });
      const data = await res.json();
      if (data.url) setForm({ ...form, coverImage: data.url });
    } catch (err) { showToast('上传失败: ' + err.message, 'error'); }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showToast('标题和内容不能为空', 'error'); return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      const url = post ? `${API}/posts/${post._id}` : `${API}/posts`;
      const method = post ? 'PUT' : 'POST';
      const resData = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (!resData.ok) {
        const errorData = await resData.json();
        throw new Error(errorData.message || '保存失败');
      }
      localStorage.removeItem(`draft_${type}_${post?._id || 'new'}`);
      onSave();
    } catch (err) {
      console.error('保存错误:', err);
      showToast(err.message || '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 图片大小调整：应用宽度
  const applyImageSize = (width) => {
    if (!imageResizer?.img) return;
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const Q = ReactQuill.Quill;
    const blot = Q && Q.find(imageResizer.img);
    if (blot) {
      if (width === 'auto') {
        blot.format('width', false);
        blot.format('height', false);
        imageResizer.img.style.width = '';
        imageResizer.img.style.height = '';
      } else {
        blot.format('width', String(width));
        blot.format('height', false);
        imageResizer.img.style.width = width + 'px';
        imageResizer.img.style.height = 'auto';
      }
      quill.update('user');
    }
    setImageResizer(null);
  };

  // ===== 格式刷 + 图片点击：编辑器挂载后绑定 =====
  useEffect(() => {
    if (previewMode) return;
    let cleanup = null;
    const timer = setTimeout(() => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const INLINE_FORMATS = ['bold', 'italic', 'underline', 'strike', 'color', 'background', 'font', 'size', 'code'];

      const onSelChange = (range, _old, source) => {
        // 始终追踪最后有效选区（工具栏按钮点击会导致 getSelection() 失效）
        if (range != null) lastSelectionRef.current = range;

        if (!formatPainterRef.current.active || !range || range.length === 0) return;
        const fmts = formatPainterRef.current.formats;
        if (fmts) {
          // 先逐一清除所有内联格式，再应用源格式，避免残留旧格式
          INLINE_FORMATS.forEach(k => {
            quill.formatText(range.index, range.length, k, fmts[k] !== undefined ? fmts[k] : false, 'user');
          });
        }
        formatPainterRef.current.active = false;
        formatPainterRef.current.formats = null;
        const btn = document.querySelector('.ql-format-painter');
        if (btn) btn.classList.remove('ql-active');
      };

      const onEditorClick = (e) => {
        if (e.target.tagName === 'IMG') {
          const container = quill.root.closest('.editor-container');
          if (!container) return;
          const cRect = container.getBoundingClientRect();
          const iRect = e.target.getBoundingClientRect();
          setImageResizer({
            img: e.target,
            top: iRect.bottom - cRect.top + 6,
            left: iRect.left - cRect.left,
            currentWidth: e.target.offsetWidth,
            naturalWidth: e.target.naturalWidth,
          });
          setImageWidth(String(e.target.offsetWidth));
        } else if (!e.target.closest('.img-resize-popover')) {
          setImageResizer(null);
        }
      };

      quill.on('selection-change', onSelChange);
      quill.root.addEventListener('click', onEditorClick);
      cleanup = () => {
        quill.off('selection-change', onSelChange);
        quill.root.removeEventListener('click', onEditorClick);
      };
    }, 300);
    return () => { clearTimeout(timer); if (cleanup) cleanup(); };
  }, [previewMode]);

  useEffect(() => {
    if (!imageResizer) return;
    const handleDocClick = (e) => {
      if (!e.target.closest('.img-resize-popover') && e.target.tagName !== 'IMG') {
        setImageResizer(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [imageResizer]);

  // ===== 关键修复：useMemo 保持 modules 引用稳定，防止 History 被重置 =====
  const quillModules = useMemo(() => ({
    toolbar: {
      container: TOOLBAR_CONTAINER,
      handlers: {
        image: () => imageUploadRef.current?.(),
        undo: () => {
          const quill = quillRef.current?.getEditor();
          if (quill) { const h = quill.getModule('history'); if (h) h.undo(); }
        },
        redo: () => {
          const quill = quillRef.current?.getEditor();
          if (quill) { const h = quill.getModule('history'); if (h) h.redo(); }
        },
        'format-painter': () => {
          const quill = quillRef.current?.getEditor();
          if (!quill) return;
          const btn = document.querySelector('.ql-format-painter');
          if (formatPainterRef.current.active) {
            // 再次点击取消格式刷
            formatPainterRef.current.active = false;
            formatPainterRef.current.formats = null;
            if (btn) btn.classList.remove('ql-active');
          } else {
            // 使用 lastSelectionRef 而非 getSelection()：
            // 工具栏按钮点击瞬间编辑器失焦，getSelection() 返回 null
            const range = lastSelectionRef.current;
            if (!range) return;
            // 明确传入 index/length，读取源文字的完整内联格式
            formatPainterRef.current.formats = quill.getFormat(range.index, range.length);
            formatPainterRef.current.active = true;
            if (btn) btn.classList.add('ql-active');
          }
        }
      }
    },
    history: { delay: 1000, maxStack: 100, userOnly: true }
  }), []);

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">{post ? '编辑' : '新建'}{type === 'blog' ? '文章' : '随笔'}</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? '编辑' : '预览'}
          </button>
          <button className="btn-secondary" onClick={onCancel}>取消</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="glass-card" style={{ padding: 30 }}>
          <h1 style={{ marginBottom: 20 }}>{form.title || '无标题'}</h1>
          <div className="post-detail-content" dangerouslySetInnerHTML={{ __html: form.content }} />
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>标题</label>
            <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="输入标题" style={{ fontSize: '1.1rem', fontWeight: 600 }} />
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {type === 'blog' && (
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label>分类</label>
                <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="">选择分类</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label>标签（逗号分隔）</label>
              <input className="form-input" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
                placeholder="标签1, 标签2" />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
              <label>状态</label>
              <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="published">发布</option>
                <option value="draft">草稿</option>
              </select>
            </div>
          </div>

          {type === 'blog' && (
            <div className="form-group">
              <label>封面图片</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input className="form-input" value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})}
                  placeholder="输入图片URL，或上传图片" style={{ flex: 1 }} />
                <label className="btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  上传
                  <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                </label>
              </div>
              {form.coverImage && (
                <img src={form.coverImage.startsWith('http') ? form.coverImage : `${API_HOST}${form.coverImage}`}
                  alt="封面预览" style={{ maxHeight: 150, borderRadius: 8, marginTop: 8 }} />
              )}
            </div>
          )}

          <div className="form-group">
            <label>摘要</label>
            <textarea className="form-textarea" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})}
              placeholder="文章摘要（可选）" rows="2" />
          </div>

          <div className="form-group">
            <label>内容</label>
            <div className="editor-container">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={form.content}
                onChange={val => setForm({...form, content: val})}
                modules={quillModules}
                placeholder="开始编辑内容..."
              />
              {imageResizer && (
                <div className="img-resize-popover" style={{ top: imageResizer.top, left: imageResizer.left }}>
                  <div className="img-resize-title">调整图片大小</div>
                  <div className="img-resize-presets">
                    {[25, 50, 75, 100].map(pct => {
                      const w = Math.round(imageResizer.naturalWidth * pct / 100);
                      return (
                        <button key={pct} className="img-resize-preset-btn"
                          onClick={() => pct === 100 ? applyImageSize('auto') : applyImageSize(w)}>
                          {pct}%
                        </button>
                      );
                    })}
                  </div>
                  <div className="img-resize-custom">
                    <input type="number" className="img-resize-input" value={imageWidth}
                      onChange={e => setImageWidth(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyImageSize(parseInt(imageWidth))}
                      min="20" max="2000" />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>px</span>
                    <button className="img-resize-apply-btn"
                      onClick={() => applyImageSize(parseInt(imageWidth))}>应用</button>
                  </div>
                </div>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
              💡 快捷键：Ctrl+B 加粗 · Ctrl+I 斜体 · Ctrl+U 下划线 · Ctrl+Z 撤销 · Ctrl+Y 恢复 | 🖌️ 格式刷：先选中源文字点击格式刷，再选中目标文字 | 自动保存草稿：每5秒
            </p>
          </div>
        </>
      )}
    </div>
  );
};

/* ===== 分类管理 ===== */
const CategoryManager = ({ showToast }) => {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');

  const fetchCategories = () => {
    fetch(`${API}/categories`).then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
  };
  useEffect(fetchCategories, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch(`${API}/categories`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: newName }) });
    setNewName('');
    fetchCategories();
    showToast('分类已创建');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除此分类？')) return;
    await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchCategories();
    showToast('分类已删除');
  };

  return (
    <div>
      <h2 className="admin-title">分类管理</h2>
      <div style={{ display: 'flex', gap: 12, margin: '20px 0' }}>
        <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="新分类名称" style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
        <button className="btn-primary" onClick={handleCreate}>添加</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>名称</th><th>操作</th></tr></thead>
        <tbody>
          {categories.map(c => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td><button className="btn-danger" onClick={() => handleDelete(c._id)}>删除</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ===== 评论管理 ===== */
const CommentManager = ({ showToast }) => {
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchComments = useCallback(() => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    fetch(`${API}/comments${params}`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setComments(d.comments || [])).catch(() => {});
  }, [filter]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleStatus = async (id, status) => {
    await fetch(`${API}/comments/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }) });
    fetchComments();
    showToast(status === 'approved' ? '评论已通过' : '评论已拒绝');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除？')) return;
    await fetch(`${API}/comments/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchComments();
    showToast('评论已删除');
  };

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">评论管理</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`category-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? '全部' : s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝'}
            </button>
          ))}
        </div>
      </div>
      <table className="admin-table">
        <thead><tr><th>作者</th><th>内容</th><th>状态</th><th>日期</th><th>操作</th></tr></thead>
        <tbody>
          {comments.map(c => (
            <tr key={c._id}>
              <td>{c.author}</td>
              <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</td>
              <td style={{ color: c.status === 'approved' ? '#22c55e' : c.status === 'pending' ? 'var(--gold)' : '#ef4444' }}>
                {c.status === 'approved' ? '已通过' : c.status === 'pending' ? '待审核' : '已拒绝'}
              </td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              <td className="actions">
                {c.status !== 'approved' && <button className="btn-success" onClick={() => handleStatus(c._id, 'approved')}>通过</button>}
                {c.status !== 'rejected' && <button className="btn-danger" onClick={() => handleStatus(c._id, 'rejected')}>拒绝</button>}
                <button className="btn-danger" onClick={() => handleDelete(c._id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {comments.length === 0 && <div className="no-data">暂无评论</div>}
    </div>
  );
};

/* ===== 留言管理 ===== */
const MessageManager = ({ showToast }) => {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchMessages = useCallback(() => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    fetch(`${API}/messages/all${params}`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => {});
  }, [filter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleStatus = async (id, status) => {
    await fetch(`${API}/messages/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }) });
    fetchMessages();
    showToast(status === 'approved' ? '留言已通过' : '留言已拒绝');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除？')) return;
    await fetch(`${API}/messages/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchMessages();
    showToast('留言已删除');
  };

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">留言管理</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`category-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? '全部' : s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝'}
            </button>
          ))}
        </div>
      </div>
      <table className="admin-table">
        <thead><tr><th>昵称</th><th>邮箱</th><th>内容</th><th>状态</th><th>日期</th><th>操作</th></tr></thead>
        <tbody>
          {messages.map(m => (
            <tr key={m._id}>
              <td>{m.nickname}</td>
              <td>{m.email}</td>
              <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.content}</td>
              <td style={{ color: m.status === 'approved' ? '#22c55e' : m.status === 'pending' ? 'var(--gold)' : '#ef4444' }}>
                {m.status === 'approved' ? '已通过' : m.status === 'pending' ? '待审核' : '已拒绝'}
              </td>
              <td>{new Date(m.createdAt).toLocaleDateString()}</td>
              <td className="actions">
                {m.status !== 'approved' && <button className="btn-success" onClick={() => handleStatus(m._id, 'approved')}>通过</button>}
                {m.status !== 'rejected' && <button className="btn-danger" onClick={() => handleStatus(m._id, 'rejected')}>拒绝</button>}
                <button className="btn-danger" onClick={() => handleDelete(m._id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {messages.length === 0 && <div className="no-data">暂无留言</div>}
    </div>
  );
};

/* ===== 友链管理 ===== */
const FriendManager = ({ showToast }) => {
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState({ name: '', avatar: '', url: '', description: '' });
  const [editId, setEditId] = useState(null);

  const fetchLinks = () => {
    fetch(`${API}/friendlinks`).then(r => r.json()).then(d => setLinks(d.links || [])).catch(() => {});
  };
  useEffect(fetchLinks, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData
      });
      const data = await res.json();
      if (data.url) setForm({ ...form, avatar: data.url });
    } catch (err) { showToast('上传失败: ' + err.message, 'error'); }
  };

  const handleSave = async () => {
    if (!form.name || !form.url) { showToast('名称和链接必填', 'error'); return; }
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API}/friendlinks/${editId}` : `${API}/friendlinks`;
    await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
    setForm({ name: '', avatar: '', url: '', description: '' });
    setEditId(null);
    fetchLinks();
    showToast('保存成功');
  };

  const handleEdit = (link) => {
    setForm({ name: link.name, avatar: link.avatar, url: link.url, description: link.description });
    setEditId(link._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除？')) return;
    await fetch(`${API}/friendlinks/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchLinks();
    showToast('友链已删除');
  };

  return (
    <div>
      <h2 className="admin-title">友链管理</h2>
      <div className="glass-card" style={{ padding: 20, margin: '20px 0' }}>
        <h4 style={{ marginBottom: 12 }}>{editId ? '编辑友链' : '添加友链'}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>名称 *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>网站链接 *</label>
            <input className="form-input" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://" />
          </div>
          <div className="form-group">
            <label>头像</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" value={form.avatar} onChange={e => setForm({...form, avatar: e.target.value})} placeholder="URL或上传" style={{ flex: 1 }} />
              <label className="btn-secondary" style={{ cursor: 'pointer' }}>上传<input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} /></label>
            </div>
          </div>
          <div className="form-group">
            <label>描述</label>
            <input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn-primary" onClick={handleSave}>{editId ? '更新' : '添加'}</button>
          {editId && <button className="btn-secondary" onClick={() => { setEditId(null); setForm({ name: '', avatar: '', url: '', description: '' }); }}>取消</button>}
        </div>
      </div>

      <table className="admin-table">
        <thead><tr><th>头像</th><th>名称</th><th>链接</th><th>操作</th></tr></thead>
        <tbody>
          {links.map(l => (
            <tr key={l._id}>
              <td><img src={l.avatar ? (l.avatar.startsWith('http') ? l.avatar : `${API_HOST}${l.avatar}`) : ''} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} /></td>
              <td>{l.name}</td>
              <td><a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem' }}>{l.url}</a></td>
              <td className="actions">
                <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => handleEdit(l)}>编辑</button>
                <button className="btn-danger" onClick={() => handleDelete(l._id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ===== 网站设置 ===== */
const SettingsManager = ({ showToast, onSettingsChange }) => {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData
      });
      const data = await res.json();
      if (data.url) setSettings({ ...settings, avatar: data.url });
    } catch (err) { showToast('上传失败: ' + err.message, 'error'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/settings`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(settings) });
      if (!res.ok) throw new Error('保存失败');
      const data = await res.json();
      setSettings(data);
      if (onSettingsChange) onSettingsChange(data);
      showToast('设置已保存');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const avatarPreview = settings.avatar ? (settings.avatar.startsWith('http') ? settings.avatar : `${API_HOST}${settings.avatar}`) : '';

  return (
    <div>
      <div className="admin-header">
        <h2 className="admin-title">网站设置</h2>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <h4 style={{ marginBottom: 16 }}>个人信息</h4>
        <div className="form-group">
          <label>头像</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {avatarPreview && <img src={avatarPreview} alt="头像" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />}
            <div>
              <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                上传头像
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              </label>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 6 }}>此头像将用于首页、导航栏和关于页</p>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>首页语录</label>
          <input className="form-input" value={settings.quote || ''} onChange={e => setSettings({...settings, quote: e.target.value})} />
        </div>
        <div className="form-group">
          <label>站点介绍</label>
          <textarea className="form-textarea" value={settings.siteDescription || ''} onChange={e => setSettings({...settings, siteDescription: e.target.value})} rows="3" />
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <h4 style={{ marginBottom: 16 }}>社交信息</h4>
        <div className="form-group">
          <label>抖音主页链接</label>
          <input className="form-input" value={settings.douyinUrl || ''} onChange={e => setSettings({...settings, douyinUrl: e.target.value})} placeholder="https://www.douyin.com/user/..." />
        </div>
        <div className="form-group">
          <label>邮箱地址</label>
          <input className="form-input" value={settings.email || ''} onChange={e => setSettings({...settings, email: e.target.value})} placeholder="your@email.com" />
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <h4 style={{ marginBottom: 16 }}>网站信息</h4>
        <div className="form-group">
          <label>备案号</label>
          <input className="form-input" value={settings.icpNumber || ''} onChange={e => setSettings({...settings, icpNumber: e.target.value})} placeholder="京ICP备XXXXXXXX号" />
        </div>
        <div className="form-group">
          <label>建站年份</label>
          <input className="form-input" value={settings.createdSince || ''} onChange={e => setSettings({...settings, createdSince: e.target.value})} />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
