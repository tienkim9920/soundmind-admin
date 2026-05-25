const express = require('express');
const router = express.Router();

const chapterController = require('../controllers/chapter.controller');

router.get('/', chapterController.index);
router.get('/create', chapterController.create);
router.post('/', chapterController.store);

router.get('/:id', chapterController.show);
router.get('/:id/edit', chapterController.edit);

router.post('/:id', chapterController.update);
router.post('/:id/delete', chapterController.destroy);

module.exports = router;
