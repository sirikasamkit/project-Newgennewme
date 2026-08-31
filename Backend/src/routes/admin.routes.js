const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateAdmin } = require('../middlewares/auth.middleware');

router.use(authenticateAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/bug-reports', adminController.getBugReports);
router.delete('/bug-reports/:id', adminController.deleteBugReport);

module.exports = router;
