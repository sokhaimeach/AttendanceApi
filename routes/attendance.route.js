const express = require("express");
const { createAttendance, getAttendanceByClass, exportWeeklyReport, getSchedule, bulkCreateAttendance, updateAttendanceStatus } = require("../controllers/attendance.controller");
const { protect } = require("../middleware/auth.middleware");
const router = express.Router();


router.get("/schedule", protect, getSchedule);
router.post("/bulk-create", protect, bulkCreateAttendance);
router.route("/").post( protect,createAttendance)

router.route("/:id").get(protect, getAttendanceByClass).put(protect, updateAttendanceStatus);

router.get("/export/:id",protect, exportWeeklyReport);


module.exports = router;