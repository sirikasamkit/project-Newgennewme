const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { reportLimiter } = require('../middlewares/rateLimiter');

// Profile
router.get('/profile', authenticateToken, userController.getProfile);
router.get('/profile/image', authenticateToken, userController.getProfileImage);
router.put('/profile', authenticateToken, userController.updateProfile);

// History
router.get('/history', authenticateToken, userController.getHistory);
router.delete('/history/bmi/:id', authenticateToken, userController.deleteBmiHistory);
router.delete('/history/food/:id', authenticateToken, userController.deleteFoodHistory);
router.delete('/history/plan/:id', authenticateToken, userController.deletePlanHistory);

// Daily Tracking
router.get('/tracking', authenticateToken, userController.getDailyTracking);
router.post('/tracking', authenticateToken, userController.saveDailyTracking);

// Bug report / Feedback
router.post('/report', reportLimiter, userController.submitBugReport);

module.exports = router;
