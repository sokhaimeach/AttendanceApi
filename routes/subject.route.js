const express = require("express");
const {
  getAllSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  importSubjectByFile,
} = require("../controllers/subject.controller");
const upload = require("../middleware/upload.middleware");
const excelToJson = require("../middleware/excelToJson");
const { protect } = require("../middleware/auth.middleware");
const { rolePermissions } = require("../middleware/role.middleware");
const router = express.Router();

router
  .route("/")
  .get(protect, getAllSubject)
  .post(protect, rolePermissions("admin"), createSubject);

router
  .route("/:id")
  .put(protect, rolePermissions("admin"), updateSubject)
  .delete(protect, rolePermissions("admin"), deleteSubject);

router.post(
  "/import",
  protect,
  rolePermissions("admin"),
  upload.single("file"),
  excelToJson,
  importSubjectByFile,
);

module.exports = router;
