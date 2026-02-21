const express = require("express");
const {
  createStudent,
  getAllStudents,
  importStudentByFile,
  updateStudent,
  deleteStudent,
  getStudentByClassId,
  importByCSVFile,
  exportStudentByClass,
} = require("../controllers/student.controller");
const upload = require("../middleware/upload.middleware");
const excelToJson = require("../middleware/excelToJson");
const csvToJson = require("../middleware/csvToJson");
const { protect } = require("../middleware/auth.middleware");
const { rolePermissions } = require("../middleware/role.middleware");
const router = express.Router();

router.route("/").post(protect, rolePermissions("admin"), createStudent).get(protect, rolePermissions("admin"), getAllStudents);

router.post("/import",protect, rolePermissions("admin"), upload.single("file"), excelToJson, importStudentByFile);
router.post('/import-csv',protect, rolePermissions("admin"), upload.single("file"), csvToJson, importByCSVFile);
router.get('/export/:id',protect, rolePermissions("admin"), exportStudentByClass);

router
  .route("/:id")
  .put(updateStudent)
  .delete(deleteStudent)
  .get(getStudentByClassId);

module.exports = router;
