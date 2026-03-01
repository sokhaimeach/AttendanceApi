const { Op, col } = require("sequelize");
const ClassSchema = require("../models/class.model");
const Student = require("../models/student.model");
const exceljs = require("exceljs");
const { successResponse, warningResponse, errorResponse } = require("../helpers/response.helper");

// create new student one by one
const createStudent = async (req, res) => {
  try {
    const student = new Student(req.body, {
      validate: true,
      isNewRecord: true,
    });
    await student.save();

    return successResponse(res, `Add student name ${student.studentname_en} successfuly`, student, 201);
  } catch (error) {
    errorResponse(res, "Error create new student", error.message);
  }
};

// helper function to map class names to IDs and prepare student data
// also creates missing classes
// data: array of objects with student info including class name
const mappingClassNamesToIds = async (data) => {
  // Fill null class by unsign
  data = data.map((d) => {
    if (!d.class) d.class = "unasign";
    return d;
  });

  // Get unique class names from csv
  const classNames = [
    ...new Set(data.map((item) => (item.class || "").trim()).filter(Boolean)),
  ];

  // Find existing classes
  const existing = await ClassSchema.findAll({
    where: {
      class_name: { [Op.in]: classNames },
    },
    attributes: ["class_id", "class_name"],
  });

  // Build map from existing
  const classMap = {};
  existing.forEach((c) => {
    classMap[c.class_name] = c.class_id;
  });

  // Create missing classes
  const missing = classNames.filter((name) => !classMap[name]);

  if (missing.length > 0) {
    await ClassSchema.bulkCreate(
      missing.map((name) => ({ class_name: name })),
      { ignoreDuplicates: true }, // needs UNIQUE on class_name
    );
  }

  // Re-fetch to get IDs for newly created ones
  const all = await ClassSchema.findAll({
    where: {
      class_name: { [Op.in]: classNames },
    },
    attributes: ["class_id", "class_name"],
  });

  all.forEach((c) => {
    classMap[c.class_name] = c.class_id;
  });

  // Map student data
  const studentsData = data.map((item) => {
    const className = (item.class || "").trim();

    return {
      studentname_kh: item.first_name,
      studentname_en: item.last_name,
      gender: item.gender,
      class_id: classMap[className] || null, // or throw error if you want
    };
  });
  return studentsData;
};

// import student by excel file
const importStudentByFile = async (req, res) => {
  try {
    const data = req.excelData;
    const studentsData = await mappingClassNamesToIds(data);

    // 7) Create students
    // const created = await Student.bulkCreate(studentsData);
    const created = ['',""];

    successResponse(res, "Uploads successfully", {
      successCount: created.length,
      failCount: studentsData.length - created.length,});
  } catch (error) {
    errorResponse(res, "Error import file", error.message);
  }
};

// import student by csv file
const importByCSVFile = async (req, res) => {
  try {
    const data = req.csvData ? JSON.parse(req.csvData) : [];
    const studentsData = await mappingClassNamesToIds(data);

    // Create students
    const created = await Student.bulkCreate(studentsData, {
      ignoreDuplicates: true,
      validate: true,
    });

    successResponse(res, "CSV data parsed successfully", {createdCount: created.length});
  } catch (error) {
    errorResponse(res, "Error import csv file", error.message);
  }
};

// get all student as json data
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: ClassSchema,
          as: "class_info",
          attributes: ["class_id", "class_name"],
        },
      ],
      attributes: ["student_id", "studentname_kh", "studentname_en", "gender"],
    });

    if (students.length === 0) {
      warningResponse(res, "Student not found", 404, []);
    }

    successResponse(res, "Fetch students successfully", students);
  } catch (error) {
    errorResponse(res, "Error get all student", error.message);
  }
};

// get student by class id
const getStudentByClassId = async (req, res) => {
  try {
    const class_id = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const filterGender = req.query.filterGender;
    const search = req.query.search;
    const sortOrder = req.query.sortOrder === "DESC" ? "DESC" : "ASC";

    // ======================
    // WHERE CONDITIONS
    // ======================
    const where = {};

    if (class_id) {
      where.class_id = class_id;
    }

    if (filterGender && !search) {
      where.gender = filterGender;
    }

    if (search) {
      where[Op.or] = [
        { studentname_kh: { [Op.like]: `%${search}%` } },
        { studentname_en: { [Op.like]: `%${search}%` } },
      ];
    }

    // ======================
    // COUNTS
    // ======================
    const countStudent = {};
    if(class_id){
      countStudent.where = {class_id};
    }
    const totalStudent = await Student.count(countStudent);

    const totalGirl = await Student.count({
      where: { ...where, gender: "F" },
    });

    // ======================
    // FIND DATA
    // ======================
    const students = await Student.findAll({
      where,
      order: [["studentname_en", sortOrder]],
      limit,
      offset,
      attributes: {
        exclude: ["created_at", "updated_at"],
      },
    });

    return successResponse(res, "Students fetched successfully", {
      totalStudent,
      totalGirl,
      totalBoy: totalStudent - totalGirl,
      page,
      limit,
      data: students,
    });
  } catch (error) {
    return errorResponse(res, "Error get student by class", error.message);
  }
};


// update student info
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      return warningResponse(res, "Student not found", 404);
    }
    Object.assign(student, req.body);

    await student.save({ validate: true });
    successResponse(res, "Update successfully", student);
  } catch (error) {
    errorResponse(res, "Error update student", error.message);
  }
};

// delete student by id
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      return warningResponse(res, "Student not found", 404);
    }
    await student.destroy();
    successResponse(res, "Student deleted successfully", student);
  } catch (error) {
    errorResponse(res, "Error delete student", error.message);
  }
};

//
// convert from json to excel file
//
// export student by class
const exportStudentByClass = async (req, res) => {
  try {
    const { id } = req.params;

    const students = await Student.findAll({
      where: {
        class_id: id,
      },
      include: {
        model: ClassSchema,
        as: "class_info",
        attributes: [],
      },
      attributes: [
        ["student_id", "Id"],
        ["studentname_kh", "First Name"],
        ["studentname_en", "Name"],
        ["gender", "Gender"],
        [col("class_info.class_name"), "Class"],
      ],
      raw: true,
    });

    // 📌 IMPORTANT HEADERS
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");

    // // write directly to response
    const workBook = writeExcelFile(students);
    await (await workBook).xlsx.write(res);
    res.end();
  } catch (err) {
    errorResponse(res, "Failed get export student by class", err.message);
  }
};

// helper function
// write excel file (from json to excel file)
// with design (border, font, color...) using exceljs
async function writeExcelFile(data) {
  // create workbook and sheet
  const workBook = new exceljs.Workbook();
  const sheet = workBook.addWorksheet("students");

  sheet.columns = [
    { header: "Id", key: "Id", width: 7 },
    { header: "First Name", key: "First Name", width: 20 },
    { header: "Name", key: "Name", width: 20 },
    { header: "Gender", key: "Gender", width: 12 },
    { header: "Class", key: "Class", width: 12 },
  ];

  // add data
  sheet.addRows(data);

  // Header Style
  sheet.getRow(1).height = 30;
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF2CC" },
    }; // soft yellow
    cell.font = { name: "Segoe UI", bold: true, size: 13 };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Rows style
  sheet.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    row.height = 30;
    row.eachCell((cell) => {
      cell.font = { name: "Segoe UI", size: 12 };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  sheet.getColumn(2).eachCell((cell, cellNum) => {
    if (cellNum === 1) return;

    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.font = { name: "Khmer OS Battambang", size: 12 };
  });

  // return workBook to get function
  return workBook;
}

module.exports = {
  createStudent,
  getAllStudents,
  getStudentByClassId,
  importStudentByFile,
  updateStudent,
  deleteStudent,
  importByCSVFile,
  exportStudentByClass,
};
