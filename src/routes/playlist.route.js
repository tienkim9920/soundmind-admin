const express = require('express');
const router = express.Router();

const playlistController = require('../controllers/playlist.controller');

router.get('/', playlistController.index);
router.get('/create', playlistController.create);
router.post('/', playlistController.store);

router.get('/:id', playlistController.show);
router.get('/:id/edit', playlistController.edit);

router.post('/:id', playlistController.update);
router.post('/:id/delete', playlistController.destroy);

module.exports = router;