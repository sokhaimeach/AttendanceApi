const express = require('express');
const { sendTelegramMessage, sendTelegramSoupport } = require('../controllers/telegram.controller');
const { protect } = require('../middleware/auth.middleware');
const { rolePermissions } = require('../middleware/role.middleware');
const router = express.Router();

router.post('/support', sendTelegramSoupport);
router.post('/send', protect, rolePermissions("admin"), sendTelegramMessage);

module.exports = router;