const express = require("express");
const router = express.Router();
const { resetTeacherPassword, changeTeacherPassword, login, getLoggedInAccountByToken } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { rolePermissions } = require("../middleware/role.middleware");

router.post("/login", login);

router.put("/:id/reset-password", protect, rolePermissions("admin"), resetTeacherPassword);
router.put("/:id/change-password", protect, changeTeacherPassword);

router.get("/loggedIn", protect, getLoggedInAccountByToken);

module.exports = router;