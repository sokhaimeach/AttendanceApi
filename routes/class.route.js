const express = require('express');
const { getAllClass, createClass, updateClass, deleteClass, createClassByFile } = require('../controllers/class.controller');
const upload = require('../middleware/upload.middleware');
const excelToJson = require('../middleware/excelToJson');
const { protect } = require('../middleware/auth.middleware');
const { rolePermissions } = require('../middleware/role.middleware');
const router = express.Router();

router.get('/', protect, getAllClass);
router.post('/create-many',protect, rolePermissions("admin"), upload.single('file'), excelToJson, createClassByFile);
router.post('/',protect, rolePermissions("admin"), createClass);
router.put('/:id',protect, rolePermissions("admin"), updateClass);
router.delete('/:id',protect, rolePermissions("admin"), deleteClass);

module.exports = router;