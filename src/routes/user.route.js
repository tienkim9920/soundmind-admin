const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');

router.get('/', userController.index);
router.get('/create', userController.create);
router.post('/', userController.store);

router.get('/:id', userController.show);
router.get('/:id/edit', userController.edit);

router.post('/:id', userController.update);
router.post('/:id/delete', userController.destroy);

module.exports = router;
