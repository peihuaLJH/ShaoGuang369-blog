const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');

// 初始化测试文章
async function initTestPosts() {
  try {
    const count = await Post.countDocuments();
    if (count === 0) {
      const testPosts = [
        {
          title: '跨境电商平台选择指南',
          content: '# 跨境电商平台选择指南\n\n## 主流跨境电商平台对比\n\n### 亚马逊 (Amazon)\n\n**优势：**\n- 全球最大的电商平台，流量巨大\n- 完善的FBA物流体系\n- 成熟的买家群体\n- 品牌认可度高\n\n**劣势：**\n- 竞争激烈\n- 费用较高（佣金+FBA费用）\n- 规则严格，账号风险大\n- 对卖家的要求越来越高\n\n### 速卖通 (AliExpress)\n\n**优势：**\n- 对新手友好，入驻门槛低\n- 流量大，覆盖全球200多个国家\n- 物流选择多样\n- 后台操作简单，适合中国卖家\n\n**劣势：**\n- 价格竞争激烈\n- 利润空间相对较小\n- 客户期望值高但客单价低\n- 平台规则变动频繁\n\n### 独立站\n\n**优势：**\n- 完全自主可控，无平台规则限制\n- 品牌建设空间大\n- 客户数据完全掌握\n- 利润空间大\n\n**劣势：**\n- 需要自己引流，流量成本高\n- 物流和支付需要自己解决\n- 运营复杂度高\n- 前期投入大\n\n## 如何选择适合自己的平台\n\n1. **评估自身资源**\n2. **分析目标市场**\n3. **考虑产品特性**\n\n## 平台组合策略\n\n对于有条件的卖家，建议采用多平台布局策略：\n1. **主力平台**：选择一个最适合的平台作为主要运营阵地\n2. **辅助平台**：选择1-2个其他平台作为补充\n3. **独立站**：逐步建立自己的品牌独立站\n\n这样可以分散风险，扩大市场覆盖范围，同时为品牌建设打下基础。',
          summary: '跨境电商平台选择指南，对比亚马逊、速卖通和独立站的优劣势，帮助卖家选择适合自己的平台。',
          categories: ['跨境电商', '平台选择'],
          tags: ['亚马逊', '速卖通', '独立站'],
          viewCount: 1234,
          likeCount: 56,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          title: '跨境电商物流选择全攻略',
          content: '# 跨境电商物流选择全攻略\n\n## 主流物流方式对比\n\n### 国际快递\n\n**优势：**\n- 速度快，通常3-7天可达\n- 服务可靠，有详细的物流跟踪\n- 清关能力强\n\n**劣势：**\n- 费用高\n- 对产品重量和体积有限制\n\n### 国际专线\n\n**优势：**\n- 价格适中\n- 速度较快，通常7-15天可达\n- 适合特定国家和地区\n\n**劣势：**\n- 覆盖范围有限\n- 服务质量参差不齐\n\n### 邮政小包\n\n**优势：**\n- 价格便宜\n- 覆盖范围广\n- 对产品重量限制较小\n\n**劣势：**\n- 速度慢，通常15-30天可达\n- 物流跟踪信息不完善\n- 丢包率相对较高\n\n### 海外仓\n\n**优势：**\n- 配送速度快，可提供本地配送体验\n- 提高客户满意度\n- 降低物流成本\n\n**劣势：**\n- 需要提前备货\n- 仓储费用较高\n- 库存管理复杂\n\n## 如何选择适合的物流方式\n\n1. **根据产品特性选择**\n2. **根据目标市场选择**\n3. **根据订单量选择**\n4. **根据客户需求选择**\n\n## 物流优化策略\n\n1. **多种物流方式组合**\n2. **合理设置物流时效**\n3. **优化包装**\n4. **与物流服务商建立长期合作**\n\n选择合适的物流方式对于跨境电商的成功至关重要，需要根据自身情况综合考虑各方面因素。',
          summary: '跨境电商物流选择全攻略，对比国际快递、国际专线、邮政小包和海外仓的优劣势，帮助卖家选择适合的物流方式。',
          categories: ['跨境电商', '物流'],
          tags: ['国际快递', '海外仓', '物流优化'],
          viewCount: 987,
          likeCount: 45,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20')
        },
        {
          title: '跨境电商运营技巧分享',
          content: '# 跨境电商运营技巧分享\n\n## 产品选择技巧\n\n1. **市场调研**\n   - 使用工具分析市场需求\n   - 研究竞争对手\n   - 关注趋势变化\n\n2. **产品定位**\n   - 确定目标客户群体\n   - 突出产品差异化\n   - 制定合理的价格策略\n\n## 店铺运营技巧\n\n1. **listing优化**\n   - 标题优化：包含关键词，吸引眼球\n   - 图片优化：高质量图片，多角度展示\n   - 描述优化：详细介绍产品特点和优势\n   - 关键词优化：合理布局关键词\n\n2. **流量获取**\n   - 平台内流量：利用平台推广工具\n   - 站外流量：社交媒体、搜索引擎优化\n   - 联盟营销：与意见领袖合作\n\n3. **客户服务**\n   - 及时回复客户咨询\n   - 处理客户投诉和退换货\n   - 建立客户忠诚度计划\n\n## 数据分析与优化\n\n1. **销售数据**\n   - 分析销售趋势\n   - 识别热销产品\n   - 优化库存管理\n\n2. **流量数据**\n   - 分析流量来源\n   - 优化转化率\n   - 提高客户留存率\n\n3. **广告数据**\n   - 分析广告效果\n   - 优化广告投放\n   - 提高ROI\n\n## 运营常见问题及解决方案\n\n1. **流量不足**\n   - 优化listing\n   - 增加广告投放\n   - 拓展流量渠道\n\n2. **转化率低**\n   - 优化产品页面\n   - 提供更有竞争力的价格\n   - 改善客户评价\n\n3. **库存管理**\n   - 建立合理的库存预警机制\n   - 优化供应链\n   - 考虑使用海外仓\n\n跨境电商运营是一个需要不断学习和优化的过程，希望这些技巧能帮助你在跨境电商的道路上走得更远。',
          summary: '跨境电商运营技巧分享，包括产品选择、店铺运营、数据分析与优化等方面的实用技巧，帮助卖家提高运营效率和销售业绩。',
          categories: ['跨境电商', '运营技巧'],
          tags: ['产品选择', 'listing优化', '流量获取'],
          viewCount: 1567,
          likeCount: 78,
          createdAt: new Date('2024-01-25'),
          updatedAt: new Date('2024-01-25')
        }
      ];
      
      await Post.insertMany(testPosts);
      console.log('测试文章初始化完成');
    }
  } catch (error) {
    console.error('初始化测试文章失败:', error);
  }
}

// 调用初始化函数
initTestPosts();

// 验证token中间件
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: '未授权' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: '无效的token' });
  }
};

// 获取文章列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag } = req.query;
    
    let query = {};
    if (category) query.categories = category;
    if (tag) query.tags = tag;
    
    const posts = await Post.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    
    const total = await Post.countDocuments(query);
    
    res.json({ posts, total, page, limit });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单篇文章
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '文章不存在' });
    }
    
    // 增加浏览量
    post.viewCount++;
    await post.save();
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建文章
router.post('/', authMiddleware, async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新文章
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) {
      return res.status(404).json({ message: '文章不存在' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除文章
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '文章不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 点赞文章
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '文章不存在' });
    }
    
    post.likeCount++;
    await post.save();
    
    res.json({ likeCount: post.likeCount });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;