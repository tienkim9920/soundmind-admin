const express = require('express');
const router = express.Router();

const subscriptionController = require('../controllers/subscription.controller');

router.get('/', subscriptionController.index);
router.get('/create', subscriptionController.create);
router.post('/', subscriptionController.store);

router.get('/:id', subscriptionController.show);
router.get('/:id/edit', subscriptionController.edit);

router.post('/:id', subscriptionController.update);
router.post('/:id/delete', subscriptionController.destroy);

module.exports = router;