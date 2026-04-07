import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const SUBSCRIBE_API = `${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/subscribe`;

const Footer = ({ settings }) => {
  const douyinUrl = settings?.douyinUrl || '#';
  const email = settings?.email || '';
  const icpNumber = settings?.icpNumber || '';
  const createdSince = settings?.createdSince || '2025';

  // 订阅区域状态
  const [subEmail, setSubEmail] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [subStatus, setSubStatus] = useState('idle'); // idle | loading | captcha | success | error
  const [subMsg, setSubMsg] = useState('');

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch(`${SUBSCRIBE_API}/captcha`);
      if (!res.ok) throw new Error('服务器错误');
      const data = await res.json();
      setCaptchaSvg(data.svg);
      setCaptchaId(data.sessionId);
      setCaptchaInput('');
      return true;
    } catch {
      setSubMsg('验证码加载失败，请确认后端服务已启动');
      setSubStatus('idle');
      return false;
    }
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subEmail.trim())) {
      setSubMsg('请输入有效的邮箱地址');
      return;
    }
    setSubMsg('');
    setSubStatus('loading');
    const ok = await fetchCaptcha();
    if (ok) setSubStatus('captcha');
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!captchaInput.trim()) {
      setSubMsg('请输入验证码');
      return;
    }
    setSubStatus('loading');
    try {
      const res = await fetch(SUBSCRIBE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail.trim(), sessionId: captchaId, captcha: captchaInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubStatus('success');
        setSubMsg(data.message || '订阅成功！');
      } else {
        await fetchCaptcha();
        setSubStatus('captcha');
        setSubMsg(data.message || '订阅失败，请重试');
      }
    } catch {
      setSubStatus('captcha');
      setSubMsg('网络错误，请重试');
    }
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>韶光的个人博客</h4>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: 250 }}>
              分享跨境电商学习日常与生活随笔
            </p>
          </div>
          <div className="footer-section">
            <h4>导航</h4>
            <div className="footer-links">
              <Link to="/">首页</Link>
              <Link to="/blog">博客</Link>
              <Link to="/essays">随笔</Link>
              <Link to="/messages">留言</Link>
            </div>
          </div>
          <div className="footer-section footer-subscribe-section">
            <h4>订阅更新</h4>
            {subStatus === 'success' ? (
              <p className="sub-success-msg">{subMsg}</p>
            ) : (
              <>
                {subStatus !== 'captcha' && (
                  <form className="sub-email-form" onSubmit={handleEmailSubmit}>
                    <input
                      type="email"
                      className="sub-input"
                      placeholder="输入您的邮箱"
                      value={subEmail}
                      onChange={e => { setSubEmail(e.target.value); setSubMsg(''); }}
                    />
                    <button type="submit" className="sub-btn" disabled={subStatus === 'loading'}>
                      {subStatus === 'loading' ? '…' : '继续'}
                    </button>
                  </form>
                )}
                {subStatus === 'captcha' && (
                  <form className="sub-captcha-form" onSubmit={handleSubscribe}>
                    <div className="captcha-row">
                      <span
                        className="captcha-svg"
                        dangerouslySetInnerHTML={{ __html: captchaSvg }}
                        title="点击刷新"
                        onClick={fetchCaptcha}
                        style={{ cursor: 'pointer' }}
                      />
                      <button type="button" className="captcha-refresh" onClick={fetchCaptcha} title="刷新验证码">↻</button>
                    </div>
                    <div className="sub-email-form" style={{ marginTop: 8 }}>
                      <input
                        type="text"
                        className="sub-input"
                        placeholder="输入验证码"
                        value={captchaInput}
                        onChange={e => { setCaptchaInput(e.target.value); setSubMsg(''); }}
                        autoFocus
                        maxLength={8}
                      />
                      <button type="submit" className="sub-btn" disabled={subStatus === 'loading'}>
                        {subStatus === 'loading' ? '…' : '订阅'}
                      </button>
                    </div>
                  </form>
                )}
                {subMsg && <p className="sub-error-msg">{subMsg}</p>}
              </>
            )}
          </div>
          <div className="footer-section">
            <h4>找到我</h4>
            <div className="footer-social">
              {douyinUrl && douyinUrl !== '#' && (
                <a href={douyinUrl} target="_blank" rel="noopener noreferrer" title="抖音">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.05-2.84-.4-4.04-1.19-1.94-1.28-3.27-3.46-3.45-5.81-.02-.65-.03-1.29.02-1.93.21-2.06 1.27-4 2.87-5.25 1.8-1.42 4.21-2.08 6.42-1.7.02 1.53-.01 3.07-.02 4.6-.84-.31-1.82-.33-2.64.03-.6.24-1.12.67-1.46 1.22-.49.72-.54 1.67-.29 2.48.43 1.38 1.97 2.33 3.43 2.09 1.03-.12 1.96-.72 2.52-1.55.18-.28.33-.58.37-.91.09-1.74.05-3.48.06-5.22V.02h.02z"/>
                  </svg>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} title="邮箱">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {createdSince}-{new Date().getFullYear()} 韶光的个人博客</span>
          {icpNumber && (
            <span style={{ marginLeft: 16 }}>
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--text-muted)' }}>{icpNumber}</a>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
