const express = require('express');
const router = express.Router();
const metricController = require('../controllers/metric.controller.js');

// API Endpoint cho Ajax gọi
router.get('/api', metricController.getSystemMetricsApi);

// View Route render giao diện
router.get('/system', metricController.renderMetricPage);

module.exports = router;
