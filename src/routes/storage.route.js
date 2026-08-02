const express = require('express');
const router = express.Router();
const multer = require('multer');

// Cấu hình Multer lưu file trực tiếp vào RAM (Memory) trước khi đẩy lên S3
const upload = multer({ storage: multer.memoryStorage() });

const storageController = require('../controllers/storage.controller');

router.get('/', storageController.index);
// Đổi 'file' thành 'files' và dùng upload.array
router.post('/upload', upload.array('files', 50), storageController.upload);
router.post('/delete', storageController.delete);
router.post('/create-folder', storageController.createFolder);

module.exports = router;