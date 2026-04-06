const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, adminOnly } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|svg/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype.split('/')[1]);
  if (ext || mime) cb(null, true);
  else cb(new Error('不支持的文件类型'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

router.post('/', auth, adminOnly, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请选择文件' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ message: '上传失败' });
  }
});

router.post('/multiple', auth, adminOnly, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ message: '请选择文件' });
    const urls = req.files.map(f => ({ url: `/uploads/${f.filename}`, filename: f.filename }));
    res.json({ files: urls });
  } catch (error) {
    res.status(500).json({ message: '上传失败' });
  }
});

module.exports = router;
