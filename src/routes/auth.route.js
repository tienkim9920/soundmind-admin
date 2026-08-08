const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Trang login
router.get('/login', authMiddleware.redirectIfLoggedIn, authController.loginPage);

// Submit Form login
router.post('/login', authMiddleware.redirectIfLoggedIn, authController.handleLogin);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
