const { Op } = require("sequelize");
const {
  errorResponse,
  successResponse,
  warningResponse,
} = require("../helpers/response.helper");
const Teacher = require("../models/teacher.model");
const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const whereClause = {};
    if (username) {
      whereClause[Op.or] = [
        { teachername_en: username },
        { teachername_kh: username },
      ];
    }
    const teacher = await Teacher.scope(null).findOne({
      where: whereClause,
      attributes: { exclude: ["created_at", "updated_at"] },
    });
    if (!teacher) {
      return warningResponse(
        res,
        "Login failed, Invalid username or password",
        404,
      );
    }
    console.log(teacher)
    if(!teacher.is_active) {
      return warningResponse(res, "Your account has been suspended. Please contact support.", 403);
    }

    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return warningResponse(res, "Invalid password", 400);
    }
    const token = generateToken(teacher.teacher_id, teacher.role);
    const { password: _, ...teacherData } = teacher.toJSON();
    successResponse(res, "Login successful", { ...teacherData, token });
  } catch (err) {
    errorResponse(res, "Error login", err.message);
  }
};

const getLoggedInAccountByToken = async (req, res) => {
  try {
    const teacher = req.user;
    if (!teacher) {
      return warningResponse(res, "Account Not Found", 404);
    }

    successResponse(res, "Get Logged In account successfully", teacher);
  } catch (err) {
    errorResponse(res, "Error get LoggedInAccountByToken", err.message);
  }
};

// reset teacher password
const resetTeacherPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return warningResponse(res, "Teacher not found", 404);
    }
    teacher.password = new_password;
    await teacher.save({ validate: true });
    successResponse(res, "Teacher password reset successfully", teacher);
  } catch (err) {
    errorResponse(res, "Error reset teacher password", err.message);
  }
};

// change teacher password
const changeTeacherPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { old_password, new_password } = req.body;
    console.log(old_password, new_password);
    const teacher = await Teacher.scope(null).findByPk(id);
    if (!teacher) {
      return warningResponse(res, "Teacher not found", 404);
    }
    const isMatch = await teacher.comparePassword(old_password);
    console.log("check password : ", isMatch);
    if (!isMatch) {
      return warningResponse(res, "Current password is incorrect", 400);
    }

    teacher.password = new_password;
    await teacher.save({ validate: true });
    successResponse(res, "Teacher password changed successfully", teacher);
  } catch (err) {
    errorResponse(res, "Error change teacher password", err.message);
  }
};

module.exports = {
  resetTeacherPassword,
  changeTeacherPassword,
  login,
  getLoggedInAccountByToken,
};
