const Teacher = require("../models/teacher.model");
const Student = require("../models/student.model");
const Subject = require("../models/subject.model");
const Class = require("../models/class.model");
const Attendance = require("../models/attendance.model");
const {
  errorResponse,
  successResponse,
} = require("../helpers/response.helper");
const { Op } = require("sequelize");

// kpis
const kpisReport = async (req, res) => {
  try {
    let kpis = [];

    const totalTeacher = await Teacher.findAll();
    const totalTeacherRole = totalTeacher.filter(
      (t) => t.role === "teacher",
    ).length;
    kpis.push({
      title: "Total Teachers",
      total: totalTeacher.length,
      text: `Teachers ${totalTeacherRole}`,
      icon: "bi-person-badge-fill",
      bg_color: "info-subtle",
      text_color: "text-info",
    });

    const totalStudent = await Student.findAll();
    const totalGril = totalStudent.filter((t) => t.gender === "F").length;
    kpis.push({
      title: "Total Students",
      total: totalStudent.length,
      text: `Grils ${totalGril}`,
      icon: "bi-people-fill",
      bg_color: "success-subtle",
      text_color: "text-success",
    });

    const totalClass = await Class.findAll();
    kpis.push({
      title: "Total Classes",
      total: totalClass.length,
      text: `All active`,
      icon: "bi-building-fill",
      bg_color: "danger-subtle",
      text_color: "text-danger",
    });

    const totalSubject = await Subject.findAll();
    kpis.push({
      title: "Total Subjects",
      total: totalSubject.length,
      text: `All in use`,
      icon: "bi-journal-bookmark-fill",
      bg_color: "warning-subtle",
      text_color: "text-warning",
    });

    successResponse(res, "Get Kpis successfully", kpis);
  } catch (err) {
    errorResponse(res, "Error kpis ", err.message);
  }
};

function getStartOfWeek(date) {
  const d = date ? new Date(date) : new Date();
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date) {
  const d = date ? new Date(date) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

const getAttendanceReport = async (req, res) => {
  try {
    const { class_id, date } = req.query;
    const startDate = getStartOfWeek(date);
    const endDate = getEndOfWeek(date);

    const where = {};
    if (class_id && Number(class_id) !== 0) {
        console.log(class_id, Number(class_id))
        where.class_id = Number(class_id);
    }

    const queryDate = {
      attendance_date: {
        [Op.between]: [startDate, endDate],
      },
    };

    const attendance = await Attendance.findAll({
      where: queryDate,
      include: [
        {
          model: Student,
          as: "student_info",
          required: true,
          where,
          attributes: [],
        },
      ],
      attributes: { exclude: ["created_at", "updated_at"] },
    });

    const p = [];
    const a = [];
    const ap = [];
    const l = [];
    const labels = [];
    const startDay = startDate.getUTCDate();

    for (let i = 0; i < 6; i++) {
      const d = `${startDate.getUTCDate()}-${startDate.getUTCMonth() + 1}-${startDate.getUTCFullYear()}`;
      labels.push(d);
      p.push(
        attendance.filter(
          (a) =>
            a.attendance_date.getUTCDate() === startDate.getUTCDate() &&
            a.status === 1,
        ).length,
      );
      a.push(
        attendance.filter(
          (a) =>
            a.attendance_date.getUTCDate() === startDate.getUTCDate() &&
            a.status === 2,
        ).length,
      );
      ap.push(
        attendance.filter(
          (a) =>
            a.attendance_date.getUTCDate() === startDate.getUTCDate() &&
            a.status === 3,
        ).length,
      );
      l.push(
        attendance.filter(
          (a) =>
            a.attendance_date.getUTCDate() === startDate.getUTCDate() &&
            a.status === 4,
        ).length,
      );

      startDate.setUTCDate(startDay + i + 1);
    }

    successResponse(res, "Get Attendance report successfully", {
      labels,
      p,
      a,
      ap,
      l,
    });
  } catch (err) {
    errorResponse(res, "Error get attendance report", err.message);
  }
};

module.exports = { kpisReport, getAttendanceReport };
