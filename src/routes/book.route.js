const express = require('express');
const router = express.Router();

const bookController = require('../controllers/book.controller');

router.get('/', bookController.index);
router.get('/create', bookController.create);
router.post('/', bookController.store);

router.get('/:id', bookController.show);
router.get('/:id/edit', bookController.edit);

router.post('/:id', bookController.update);
router.post('/:id/delete', bookController.destroy);

module.exports = router;