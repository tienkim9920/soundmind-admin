const express = require('express');
const router = express.Router();

const bookRoute = require('./book.route');
const categoryRoute = require('./category.route');
const authRoute = require('./auth.route');

router.use('/', authRoute);
router.use('/books', bookRoute);
router.use('/categories', categoryRoute);

module.exports = router;
