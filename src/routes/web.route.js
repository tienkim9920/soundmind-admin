const express = require('express');
const router = express.Router();

const bookRoute = require('./book.route');
const authRoute = require('./auth.route');

router.use('/', authRoute);
router.use('/books', bookRoute);

module.exports = router;