import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = ({ settings, user, onAdminLogin, onLogout, theme, onThemeToggle }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '', phone: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAvatarClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      if (user) {
        navigate('/admin');
      } else {
        setShowLogin(true);
      }
      return;
    }
    clickTimerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 2000);
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '登录失败');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onAdminLogin(data.user);
      setShowLogin(false);
      setLoginData({ username: '', password: '', phone: '' });
      navigate('/admin');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const navItems = [
    { to: '/', label: '首页' },
    { to: '/blog', label: '博客' },
    { to: '/essays', label: '随笔' },
    { to: '/messages', label: '留言' },
    { to: '/friends', label: '友链' },
    { to: '/about', label: '关于' }
  ];

  const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiM4YjVjZjYiLz48dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjI4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+6Z+2PC90ZXh0Pjwvc3ZnPg==';
  const avatarUrl = settings?.avatar ? `${settings.avatar}` : defaultAvatar;

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <div className="navbar-brand" onClick={handleAvatarClick} title="连续点击5次进入管理后台">
            <img src={avatarUrl} alt="韶光" className="navbar-avatar" />
            <span className="navbar-name">韶光</span>
          </div>
          <div className={`navbar-links ${mobileOpen ? 'active' : ''}`}>
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={location.pathname === item.to ? 'active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user && user.role === 'admin' && (
              <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>
                管理
              </Link>
            )}
          </div>
          <button
            className={`theme-toggle-btn${spinning ? ' spinning' : ''}`}
            onClick={() => {
              setSpinning(true);
              setTimeout(() => setSpinning(false), 660);
              onThemeToggle();
            }}
            title={theme === 'dark' ? '切换白天模式' : '切换夜间模式'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {showLogin && (
        <div className="admin-login-overlay" onClick={() => setShowLogin(false)}>
          <div className="admin-login-modal" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowLogin(false)} style={{
              position: 'absolute', top: 12, right: 16, background: 'none',
              border: 'none', color: 'var(--text-dim)', fontSize: '1.5rem', cursor: 'pointer'
            }}>×</button>
            <h2>管理员登录</h2>
            {loginError && <div className="error-msg">{loginError}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>用户名</label>
                <input type="text" value={loginData.username}
                  onChange={e => setLoginData({...loginData, username: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>密码</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={loginData.password}
                    onChange={e => setLoginData({...loginData, password: e.target.value})} 
                    required 
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: '1.1rem'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>手机号</label>
                <input type="tel" value={loginData.phone}
                  onChange={e => setLoginData({...loginData, phone: e.target.value})} required />
              </div>
              <button type="submit" className="login-btn" disabled={loginLoading}>
                {loginLoading ? '登录中...' : '登 录'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
