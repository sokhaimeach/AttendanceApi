const {
  errorResponse,
  warningResponse,
  successResponse,
} = require("../helpers/response.helper");
const Teacher = require("../models/teacher.model");
const sendEmail = require("../services/email.service");

const sendResetPasswordToUser = async (req, res) => {
  try {
    const { email, teacher_id, password } = req.body;
    if(!email || !teacher_id || !password) {
        return warningResponse(res, "All info are required", 400);
    }

    const teacher = await Teacher.findByPk(teacher_id);
    if (!teacher) {
      return warningResponse(res, "The user not found", 404);
    }

    const response = await sendEmail(
      email,
      "Send new passowrd",
      `
        <h2>✅ Your Password Has Been Reset</h2>

        <p>Hello ${teacher.teachername_en},</p>

        <p>Your password reset request has been approved by the administrator.</p>

        <p><strong>Your New Login Details:</strong></p>
        <ul>
            <li>Username: ${teacher.teachername_en}</li>
            <li>New Password: <strong>${password}</strong></li>
        </ul>

        <p>Please login and change your password immediately for security purposes.</p>

        <br/>

        <p>Best regards,<br/>Attendance Management Website</p>
        `
    );

    successResponse(res, "Send Email successfully", response);
  } catch (err) {
    errorResponse(res, "Error send email", err.message);
  }
};

module.exports = {sendResetPasswordToUser};
