const express = require('express');
const router = express.Router();

const bookRoute = require('./book.route');
const categoryRoute = require('./category.route');
const authorRoute = require('./author.route');
const userRoute = require('./user.route');
const chapterRoute = require('./chapter.route');
const authRoute = require('./auth.route');

router.use('/', authRoute);
router.use('/books', bookRoute);
router.use('/categories', categoryRoute);
router.use('/authors', authorRoute);
router.use('/users', userRoute);
router.use('/chapters', chapterRoute);

module.exports = router;
