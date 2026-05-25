const express = require('express');
const router = express.Router();

const authorController = require('../controllers/author.controller');

router.get('/', authorController.index);
router.get('/create', authorController.create);
router.post('/', authorController.store);

router.get('/:id', authorController.show);
router.get('/:id/edit', authorController.edit);

router.post('/:id', authorController.update);
router.post('/:id/delete', authorController.destroy);

module.exports = router;
