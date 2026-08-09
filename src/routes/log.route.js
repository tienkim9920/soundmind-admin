const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller.js');

// 1. API Endpoint trả về JSON log (Cho Ajax / Fetch từ UI gọi)
router.get('/api', logController.getLogsApi);

// 2. View Route render giao diện trang Log Viewer
router.get('/', logController.renderLogPage);

module.exports = router;
