const { Op } = require("sequelize");
const {
  successResponse,
  errorResponse,
  warningResponse,
} = require("../helpers/response.helper");
const Teacher = require("../models/teacher.model");
const fs = require('fs-extra');
const path = require("path");

// create new teacher
const createTeacher = async (req, res) => {
  try {
    const { teachername_kh, teachername_en, role, phone, password } = req.body;

    const image = req.file?.filename;
    const imageUrl = image
      ? `${req.protocol}://${req.get("host")}/images/${image}`
      : null;

    const teacher = new Teacher(
      {
        teachername_kh,
        teachername_en,
        role,
        phone,
        password,
        image_url: imageUrl,
      },
      { validate: true, isNewRecord: true },
    );
    await teacher.save();

    return successResponse(
      res,
      "Teacher created successfully",
      teacher,
      201,
    );
  } catch (err) {
    errorResponse(res, "Error create teacher", err.message);
  }
};

// get all teachers as json data
const getAllTeacher = async (req, res) => {
  try {
    const { search, role, status, page, pageSize } = req.query;
    const filterStatus =
      status === "true" ? true : status === "false" ? false : null;
    const limit = pageSize ? parseInt(pageSize) : 10;
    const offset = page ? (parseInt(page) - 1) * limit : 0;

    const where = {};
    if (search) {
      where[Op.or] = [
        { teachername_en: { [Op.substring]: search } },
        { teachername_kh: { [Op.substring]: search } },
        { phone: { [Op.substring]: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (filterStatus) {
      where.is_active = filterStatus;
    }

    const totalPages = Math.ceil((await Teacher.count()) / limit);

    const teachers = await Teacher.findAll({ where, limit, offset });
    if (teachers.length === 0) {
      return warningResponse(res, "Teacher not found", 404, []);
    }

    successResponse(
      res,
      "Get all teachers successfully",
      { data: teachers, page, totalPages },
      200,
    );
  } catch (err) {
    errorResponse(res, "Error get teacher", err.message);
  }
};

// get teacher by id
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return warningResponse(res, "Teacher not found", 404);
    }

    successResponse(res, "Get teacher by id successfully", teacher);
  } catch(err) {
    errorResponse(res, "Error get teacher by id", err.message);
  }
}

// get teacher report
const getTeacherReport = async (req, res) => {
  try {
    const { count, rows } = await Teacher.findAndCountAll();

    const totalTeacherRole = rows.filter((t) => t.role === "teacher").length;
    const totalAdminRole = rows.filter((t) => t.role === "admin").length;
    const totalActive = rows.filter((t) => t.is_active === true).length;

    successResponse(
      res,
      "Fetch Report teacher successfully",
      {
        totalTeacher: count,
        totalTeacherRole,
        totalAdminRole,
        totalActive,
      },
      200,
    );
  } catch (err) {
    errorResponse(res, "Error get teacher report", err.message);
  }
};

// update teacher info
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return warningResponse(res, "Teacher not found", 404);
    }
    const { teachername_kh, teachername_en, phone } = req.body;
    const image = req.file?.filename;
    const imageUrl = image
      ? `${req.protocol}://${req.get("host")}/images/${image}`
      : teacher.image_url;

    // remove old image
    if(image && teacher.image_url) {
      const originalName = teacher.image_url.split('/').pop();
      const filePath = path.join('public', 'images', originalName);
      await fs.removeSync(filePath);
    }

    Object.assign(teacher, { teachername_kh, teachername_en, phone, image_url: imageUrl });

    await teacher.save({ validate: true });

    successResponse(res, "Teacher updated successfully", teacher);
  } catch (err) {
    errorResponse(res, "Error update teacher", err.message);
  }
};

// update image of teacher
const updateTeacherImage = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);
    if(!teacher) {
      return warningResponse(res, "Teacher not found", 404);
    }

    const image = req.file?.filename;
    const imageUrl = image ? `${req.protocol}://${req.get("host")}/images/${image}`: teacher.image_url;
    // remove old image
    if(image && teacher.image_url) {
      const originalName = teacher.image_url.split('/').pop();
      const filePath = path.join('public', 'images', originalName);
      await fs.removeSync(filePath);
    }

    teacher.image_url = imageUrl;
    await teacher.save({ validate: true });

    successResponse(res, "Teacher image updated successfully", teacher);
  } catch (err) {
    errorResponse(res, "Error update teacher image", err.message);
  }
}

// update teacher status (active/inactive)
const updateTeacherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return warningResponse(res, "Teacher not found", 404);
    }

    teacher.is_active = is_active;
    await teacher.save({ validate: true }); 
    successResponse(res, "Teacher status updated successfully", teacher);
  } catch (err) {
    errorResponse(res, "Error update teacher status", err.message);
  }
}

// delete teacher by id
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return warningResponse(res, "Teacher not found", 404);
    }
    await teacher.destroy();
    successResponse(res, "Teacher deleted successfully", teacher);
  } catch (err) {
    errorResponse(res, "Error delete teacher", err.message);
  }
};

module.exports = {
  getAllTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherReport,
  getTeacherById,
  updateTeacherImage,
  updateTeacherStatus,
};
