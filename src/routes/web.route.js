const express = require('express');
const router = express.Router();

const bookRoute = require('./book.route');
const categoryRoute = require('./category.route');
const authorRoute = require('./author.route');
const userRoute = require('./user.route');
const chapterRoute = require('./chapter.route');
const subscriptionRoute = require('./subscription.route');
const playlistRoute = require('./playlist.route');
const orderRoute = require('./order.route');
const authRoute = require('./auth.route');
const storageRoute = require('./storage.route');

router.use('/', authRoute);
router.use('/books', bookRoute);
router.use('/categories', categoryRoute);
router.use('/authors', authorRoute);
router.use('/users', userRoute);
router.use('/chapters', chapterRoute);
router.use('/subscriptions', subscriptionRoute);
router.use('/playlists', playlistRoute);
router.use('/orders', orderRoute);
router.use('/storages', storageRoute);

module.exports = router;
