const express = require('express');
const router = express.Router();

const authRoute = require('./auth.route');
const bookRoute = require('./book.route');
const categoryRoute = require('./category.route');
const authorRoute = require('./author.route');
const userRoute = require('./user.route');
const chapterRoute = require('./chapter.route');
const subscriptionRoute = require('./subscription.route');
const playlistRoute = require('./playlist.route');
const orderRoute = require('./order.route');
const storageRoute = require('./storage.route');
const logRoute = require('./log.route');
const metricRoute = require('./metric.route');

const authMiddleware = require('../middlewares/auth.middleware');

// ==========================================
// 1. PUBLIC ROUTES (Không bị protect chặn)
// ==========================================

// Nếu người dùng vào root (ví dụ: http://localhost:4000/admin hoặc /)
// Tự động điều hướng đến /books (nếu đã đăng nhập) hoặc /login (nếu chưa)
router.get('/', authMiddleware.redirectIfLoggedIn, (req, res) => {
    const rawAdminRoute = process.env.ADMIN_ROUTE || '/admin';
    const adminRoute = rawAdminRoute === '/' ? '' : rawAdminRoute.replace(/\/$/, '');
    res.redirect(`${adminRoute}/login`);
});

// Các route đăng nhập, đăng xuất
router.use('/', authRoute);

// ==========================================
// 2. CHẶN TẤT CẢ ROUTE BÊN DƯỚI NẾU CHƯA LOG IN
// ==========================================
router.use(authMiddleware.protect);

// ==========================================
// 3. PROTECTED ROUTES
// ==========================================
router.use('/books', bookRoute);
router.use('/categories', categoryRoute);
router.use('/authors', authorRoute);
router.use('/users', userRoute);
router.use('/chapters', chapterRoute);
router.use('/subscriptions', subscriptionRoute);
router.use('/playlists', playlistRoute);
router.use('/orders', orderRoute);
router.use('/storages', storageRoute);
router.use('/logs', logRoute);
router.use('/metrics', metricRoute);

module.exports = router;
