// 共享的图形验证码工具（订阅、友链申请等公开表单共用）
const svgCaptcha = require('svg-captcha');

const store = new Map();
const TTL = 5 * 60 * 1000; // 5 分钟过期

// 定期清理过期验证码
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > TTL) store.delete(id);
  }
}, 60 * 1000);

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** 生成验证码，返回 { svg, sessionId } */
function generateCaptcha() {
  const captcha = svgCaptcha.create({ size: 4, noise: 2, color: true, background: '#f0f0f0' });
  const sessionId = genId();
  store.set(sessionId, { text: captcha.text.toLowerCase(), createdAt: Date.now() });
  return { svg: captcha.data, sessionId };
}

/** 校验验证码（用后即焚），返回 { ok, reason } reason: 'expired' | 'wrong' | null */
function verifyCaptcha(sessionId, input) {
  const entry = store.get(sessionId);
  if (!entry) return { ok: false, reason: 'expired' };
  store.delete(sessionId);
  const ok = entry.text === String(input || '').trim().toLowerCase();
  return { ok, reason: ok ? null : 'wrong' };
}

module.exports = { generateCaptcha, verifyCaptcha };
