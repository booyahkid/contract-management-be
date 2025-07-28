const express = require('express');
const router = express.Router();
const controller = require('./contract.controller');
const auth = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const { validateContract } = require('./contract.validation');

router.get('/', auth, controller.getAll);
router.get('/:id', auth, controller.getById);
router.post('/', auth, validateContract, controller.create);
router.put('/:id', auth, validateContract, controller.update);
router.delete('/:id', auth, controller.remove);

// Legacy upload route (keep for compatibility)
router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.status(200).json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
});

module.exports = router;