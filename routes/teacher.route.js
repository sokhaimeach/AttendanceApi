const express = require("express");
const {
  getAllTeacher,
  createTeacher,
  importTeacherByFile,
  updateTeacher,
  deleteTeacher,
  getTeacherReport,
  getTeacherById,
  updateTeacherImage,
  updateTeacherStatus,
} = require("../controllers/teacher.controller");
const upload = require("../middleware/upload.middleware");
const excelToJson = require("../middleware/excelToJson");
const uploadImage = require("../middleware/uploadImage.middleware");
const { protect } = require("../middleware/auth.middleware");
const { rolePermissions } = require("../middleware/role.middleware");
const router = express.Router();

router
  .route("/")
  .get(protect, rolePermissions("admin"), getAllTeacher)
  .post(
    protect,
    rolePermissions("admin"),
    uploadImage.single("image"),
    createTeacher,
  );

router.get("/report", protect, getTeacherReport);

router
  .route("/:id")
  .put(
    protect,
    rolePermissions("admin"),
    uploadImage.single("image"),
    updateTeacher,
  )
  .delete(protect, rolePermissions("admin"), deleteTeacher)
  .get(protect, getTeacherById);

router.put(
  "/:id/image",
  protect,
  uploadImage.single("image"),
  updateTeacherImage,
);
router.put(
  "/:id/status",
  protect,
  rolePermissions("admin"),
  updateTeacherStatus,
);

module.exports = router;
