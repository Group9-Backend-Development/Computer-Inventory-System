const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'documents');

function ensureUploadDir() {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    const safe = `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, '_')}`;
    cb(null, safe);
  },
});

const uploadSingle = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { uploadSingle, uploadDir };
