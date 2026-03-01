const express = require('express');
const { sendResetPasswordToUser } = require('../controllers/email.controller');
const { protect } = require('../middleware/auth.middleware');
const { rolePermissions } = require('../middleware/role.middleware');
const router = express.Router();

router.post('/send', protect, rolePermissions("admin"), sendResetPasswordToUser);

module.exports = router;