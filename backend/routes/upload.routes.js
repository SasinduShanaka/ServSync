import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${ts}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST /api/uploads  single file field name: file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const publicBase = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT||5000}`;
    const url = `${publicBase}/uploads/${encodeURIComponent(req.file.filename)}`;
    res.json({ fileUrl: url, fileName: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

export default router;
