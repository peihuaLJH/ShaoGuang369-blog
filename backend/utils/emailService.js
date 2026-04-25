const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // QQ 邮箱 465 端口使用 SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * 发送订阅成功通知给新订阅者
 */
async function sendSubscriptionConfirmation(email) {
  const mailOptions = {
    from: `"ShaoGuang 博客" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '订阅成功 - ShaoGuang 博客',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; border-bottom: 2px solid #6c63ff; padding-bottom: 10px;">订阅成功！</h2>
        <p style="color: #555; font-size: 15px;">您好，</p>
        <p style="color: #555; font-size: 15px;">
          感谢您订阅 <strong>ShaoGuang 博客</strong>！您的邮箱 <strong>${email}</strong> 已成功订阅。
        </p>
        <p style="color: #555; font-size: 15px;">
          今后每当博客发布新文章，我们都会第一时间通过邮件通知您，敬请期待！
        </p>
        <div style="background: #f9f9f9; border-left: 4px solid #6c63ff; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #666; font-size: 13px;">如果您不希望继续接收通知，可以忽略此邮件，或回复邮件申请退订。</p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">— ShaoGuang 博客</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ 订阅确认邮件已发送至: ${email}`);
  } catch (err) {
    console.error(`✗ 订阅确认邮件发送失败 (${email}):`, err.message);
  }
}

/**
 * 发布新文章后，通知所有订阅者
 */
async function sendNewPostNotification(subscribers, post) {
  if (!subscribers || subscribers.length === 0) return;

  const postUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/post/${post._id}`;
  const emailList = subscribers.map(sub => sub.email);

  const mailOptions = {
    from: `"ShaoGuang 博客" <${process.env.SMTP_USER}>`,
    bcc: emailList, // 使用密送，保护订阅者隐私
    subject: `新文章：${post.title} - ShaoGuang 博客`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; border-bottom: 2px solid #6c63ff; padding-bottom: 10px;">📝 新文章发布</h2>
        <p style="color: #555; font-size: 15px;">您好，</p>
        <p style="color: #555; font-size: 15px;">
          <strong>ShaoGuang 博客</strong> 刚刚发布了一篇新文章，赶快来看看吧！
        </p>
        <div style="background: #f5f5ff; border: 1px solid #d0caff; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px 0; color: #4a3fbf;">${post.title}</h3>
          ${post.summary ? `<p style="margin: 0; color: #666; font-size: 14px;">${post.summary}</p>` : ''}
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${postUrl}" style="background: #6c63ff; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 15px; display: inline-block;">
            阅读全文 →
          </a>
        </div>
        <div style="background: #f9f9f9; border-left: 4px solid #6c63ff; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #666; font-size: 13px;">您收到此邮件是因为您订阅了 ShaoGuang 博客。如需退订，请回复此邮件。</p>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">— ShaoGuang 博客</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ 新文章通知已发送给 ${emailList.length} 位订阅者`);
  } catch (err) {
    console.error('✗ 新文章通知邮件发送失败:', err.message);
  }
}

module.exports = { sendSubscriptionConfirmation, sendNewPostNotification };
