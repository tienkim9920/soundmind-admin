const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');

router.get('/', categoryController.index);
router.get('/create', categoryController.create);
router.post('/', categoryController.store);

router.get('/:id', categoryController.show);
router.get('/:id/edit', categoryController.edit);

router.post('/:id', categoryController.update);
router.post('/:id/delete', categoryController.destroy);

module.exports = router;
