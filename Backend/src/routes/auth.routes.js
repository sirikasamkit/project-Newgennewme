const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middlewares/rateLimiter');

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/check-email', forgotPasswordLimiter, authController.checkEmail);
router.post('/reset-password', forgotPasswordLimiter, authController.resetPassword);

module.exports = router;
