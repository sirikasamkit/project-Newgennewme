const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const aiRoutes = require('./ai.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');

// Modular API routes
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

// Root level backwards compatibility aliases for legacy frontend support
router.use('/', authRoutes);
router.use('/', aiRoutes);
router.use('/', userRoutes);

module.exports = router;
