/**
 * 邮件通知自检脚本 —— 在服务器上运行，定位"发布后收不到邮件"的原因。
 * 用法（在 backend 目录下）：
 *   node testEmail.js 你的收件邮箱@example.com
 * 不传收件邮箱时，会发给 SMTP_USER 自己。
 */
const path = require('path');
// 同时尝试从当前目录和仓库根目录加载 .env（dotenv 不覆盖已存在的变量）
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

function mask(v) {
  if (!v) return '(未设置!)';
  return String(v).replace(/(.{2}).*(@.*)?$/, (m, a, b) => a + '***' + (b || ''));
}

(async () => {
  console.log('========== 邮件通知自检 ==========\n');

  console.log('【1】SMTP 配置（来自服务器 .env）');
  console.log('  SMTP_HOST    =', process.env.SMTP_HOST || '(未设置!)');
  console.log('  SMTP_PORT    =', process.env.SMTP_PORT || '(未设置，默认465)');
  console.log('  SMTP_USER    =', mask(process.env.SMTP_USER));
  console.log('  SMTP_PASS    =', process.env.SMTP_PASS ? `已设置(${process.env.SMTP_PASS.length}位)` : '(未设置!)');
  console.log('  FRONTEND_URL =', process.env.FRONTEND_URL || '(未设置，邮件里的"阅读全文"会指向 localhost)');
  console.log('  MONGODB_URI  =', process.env.MONGODB_URI ? '已设置' : '(未设置，将用本地默认库)');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n  ⚠ 关键配置缺失！服务器上没有完整的 SMTP_* 变量，邮件一定发不出去。');
    console.log('    原因：.env 被 .gitignore 忽略，git 部署不会带过来，需要在服务器上手动补全 .env。');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  console.log('\n【2】验证 SMTP 连接与登录');
  try {
    await transporter.verify();
    console.log('  ✓ SMTP 登录成功，凭据有效');
  } catch (e) {
    console.log('  ✗ SMTP 失败:', e.message);
    console.log('    常见原因：QQ 邮箱 SMTP_PASS 必须用「授权码」（QQ邮箱设置→账号→开启SMTP获取），不是登录密码；');
    console.log('    或服务器到 smtp.qq.com:465 的出站端口被防火墙/安全组拦截。');
  }

  console.log('\n【3】数据库订阅者');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog');
    const Subscriber = require('./models/Subscriber');
    const subs = await Subscriber.find().sort({ subscribedAt: -1 });
    console.log('  订阅者数量:', subs.length);
    subs.forEach(s => console.log('   -', s.email));
    if (subs.length === 0) {
      console.log('  ⚠ 没有订阅者！发布文章时不会发任何邮件。请先去网站页脚用一个邮箱订阅。');
    }
  } catch (e) {
    console.log('  ✗ 连接数据库/查询订阅者失败:', e.message);
  }

  console.log('\n【4】发送一封测试邮件');
  const to = process.argv[2] || process.env.SMTP_USER;
  if (!to) {
    console.log('  跳过（未指定收件人，也没有 SMTP_USER）');
  } else {
    try {
      await transporter.sendMail({
        from: `"ShaoGuang 博客(自检)" <${process.env.SMTP_USER}>`,
        to,
        subject: '【自检】博客邮件通知测试',
        html: '<p>如果你收到这封邮件，说明服务器 SMTP 发送链路正常。<br>请同时检查<strong>垃圾箱</strong>。</p>',
      });
      console.log('  ✓ 测试邮件已发送至:', to);
      console.log('    → 去收件箱和垃圾箱看看。收到=发送链路OK；没收到（含垃圾箱）=被拦或地址有误。');
    } catch (e) {
      console.log('  ✗ 测试邮件发送失败:', e.message);
    }
  }

  console.log('\n========== 自检结束 ==========');
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
})();
