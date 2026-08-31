const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const upload = require('../middlewares/upload.middleware');

router.post('/generate-plan', aiController.generatePlan);
router.post('/analyze-food', upload.single('image'), aiController.analyzeFood);
router.post('/chat', aiController.chat);

module.exports = router;
