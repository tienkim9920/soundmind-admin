const express = require('express');
const router = express.Router();
const multer = require('multer');

// Cấu hình Multer lưu file trực tiếp vào RAM (Memory) trước khi đẩy lên S3
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // Tăng giới hạn lên 10MB
    },
});

const storageController = require('../controllers/storage.controller');

router.get('/', storageController.index);
// Đổi 'file' thành 'files' và dùng upload.array
router.post('/upload-api', upload.array('files', 50), storageController.uploadApi);
router.post('/upload', upload.array('files', 50), storageController.upload);
router.post('/delete', storageController.delete);
router.post('/create-folder', storageController.createFolder);

// Route cho Web Form Redirect
router.post('/update-acl', storageController.updateAcl);

// Route cho Client/Frontend gọi API JSON
router.post('/update-acl-api', storageController.updateAclApi);

module.exports = router;