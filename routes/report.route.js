const express = require('express');
const { kpisReport, getAttendanceReport } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.get('/kpis', protect, kpisReport);

router.get('/attendance-report', protect, getAttendanceReport);

module.exports = router;