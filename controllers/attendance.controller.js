const Attendance = require("../models/attendance.model");
const Student = require("../models/student.model");
const Teacher = require("../models/teacher.model");
const Subject = require("../models/subject.model");
const Class = require("../models/class.model");
const { col, Op, fn, Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");
const {
  successResponse,
  errorResponse,
  warningResponse,
} = require("../helpers/response.helper");
const { schedule, dayRange } = require("../helpers/schedule.helper");

// Create a new attendance record
const createAttendance = async (req, res) => {
  try {
    const { student_id, subject_id, teacher_id, status } = req.body;
    const newAttendance = await Attendance.create({
      student_id,
      subject_id,
      teacher_id,
      status,
    });
    res
      .status(201)
      .json({ message: "Attendance record created", data: newAttendance });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Bulk create attendances
const bulkCreateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.bulkCreate(req.body);

    successResponse(res, "Created attendace stuccessfully", attendance);
  } catch (err) {
    errorResponse(res, "Error Bulk create attendance", err.message);
  }
};

// Update attendance status
const updateAttendanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const attendanceId = parseInt(id);
    const attendanceStatus = parseInt(status);

    if(!attendanceStatus) {
      return warningResponse(res, "status is required", 400);
    }

    const attendance = await Attendance.findByPk(attendanceId);
    if(!attendance) return warningResponse(res, "This attendance not found", 404);

    attendance.status = attendanceStatus;

    await attendance.save();
    successResponse(res, "Update attendance status successfully", attendance);
  } catch(err) {
    errorResponse(res, "Error update attendance status", err.message);
  }
}

// Get schedule
const getSchedule = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      attributes: ["subject_id", "subject_name"],
    });

    const subjectByName = new Map(
      subjects.map((s) => [s.subject_name, s.toJSON()]),
    );

    const mapSchedule = schedule.map((day) => ({
      day: day.day,
      slots: day.subject.map((name) => {
        const subject = subjectByName.get(name);
        return subject
          ? { ...subject, attendance_date: "", status: 0, attendance_id: 0 }
          : {
              subject_id: null,
              subject_name: name,
              attendance_date: "",
              status: 0,
              attendance_id: 0,
            };
      }),
    }));

    successResponse(res, "Get schedule Successfully", mapSchedule);
  } catch (err) {
    errorResponse(res, "Get schedule", err.message);
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

// get attendance by class
const getAttendanceByClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, search, status } = req.query;
    const class_id = parseInt(id);
    const filterStatus = parseInt(status);
    const startDate = getStartOfWeek(date);
    const endDate = getEndOfWeek(date);

    const query = { class_id };
    if (search) {
      query[Op.or] = [
        { studentname_en: { [Op.substring]: search } },
        { studentname_kh: { [Op.substring]: search } },
      ];
    }

    const querAtt = { attendance_date: { [Op.between]: [startDate, endDate] } };
    if (filterStatus) {
      querAtt.status = filterStatus;
    }

    const rows = await Attendance.findAll({
      where: querAtt,
      include: [
        {
          model: Student,
          as: "student_info",
          required: true,
          where: query,
          attributes: [],
        },
      ],
      attributes: { exclude: ["created_at", "updated_at"] },
    });

    const students = await Student.findAll({
      where: query,
      attributes: { exclude: ["created_at", "updated_at"] },
    });

    const mapSchedule = await mergeSchedule();

    const attIndex = new Map();

    for (const r of rows) {
      const d = new Date(r.attendance_date);
      const day = d.getDay();
      const key = `${r.student_id}|${day}|${r.subject_id}`;

      attIndex.set(key, r);
    }

    let studentAttendance = await Promise.all(students.map(async (s) => {
      const sid = s.student_id ?? s.toJSON().student_id;
      const json = s.toJSON() ?? s;

      const attendance = mapSchedule.map((slot) => {
        const dayNum = dayRange[slot.day];
        const key = `${sid}|${dayNum}|${slot.subject_id}`;
        const att = attIndex.get(key);

        if (att) {
          return {
            attendance_id: att.attendance_id,
            subject_id: att.subject_id,
            status: att.status,
            attendance_date: att.attendance_date,
          };
        } else {
          return {
            attendance_id: 0,
            subject_id: slot.subject_id,
            status: 0,
            attendance_date: "",
          };
        }
      });

      const countAtt = await Attendance.findAll({
        where: {student_id: sid},
        attributes: ['status']
      });
      const total_p = countAtt.filter(a => a.status === 1).length;
      const total_a = countAtt.filter(a => a.status === 2).length;
      const total_ap = countAtt.filter(a => a.status === 3).length;
      const total_l = countAtt.filter(a => a.status === 4).length;
      const total = total_p + total_l;

      return { ...json, attendance, total_p, total_a, total_ap, total_l, total };
    })
  );

    if (filterStatus) {
      studentAttendance = studentAttendance.filter((s) =>
        s.attendance.find((a) => a.status === filterStatus) ? true : false,
      );
    }

    successResponse(res, "Attendance records fetched", studentAttendance);
  } catch (error) {
    errorResponse(res, "Error get student attendance by class", error.message);
  }
};

// helper function to mapSchedule
async function mergeSchedule() {
  const subjects = await Subject.findAll({
    attributes: { exclude: ["created_at", "updated_at"] },
  });

  const subjectByName = new Map(
    subjects.map((s) => [s.subject_name, s.toJSON()]),
  );

  const slotList = schedule.flatMap((sche) => {
    return sche.subject.map((name) => {
      const subject = subjectByName.get(name);
      return { ...subject, day: sche.day };
    });
  });

  return slotList;
}

// export weekly report by class id
const exportWeeklyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const class_id = parseInt(id);

    const students = await Student.findAll({
      where: { class_id },
      attributes: [
        "student_id",
        "studentname_kh",
        "studentname_en",
        "gender",
        [col("class_info.class_name"), "class"],
      ],
      include: [
        {
          model: Class,
          as: "class_info",
          attributes: [],
        },
      ],
    });

    const rows = await Attendance.findAll({
      include: [
        {
          model: Student,
          as: "student_info",
          attributes: { exclude: ["created_at", "updated_at"] },
          required: true,
          where: { class_id },
        },
      ],
      attributes: { exclude: ["created_at", "updated_at"] },
      raw: true,
      nest: true,
    });

    const subjects = await Subject.findAll({
      attributes: ["subject_id", "subject_name"],
    });

    const subjectByName = new Map(
      subjects.map((s) => [s.subject_name, s.toJSON()]),
    );

    const slotList = schedule.flatMap((sche) => {
      return sche.subject.map((name) => {
        const subject = subjectByName.get(name);
        return { ...subject, day: sche.day };
      });
    });

    const attIndex = new Map();

    for (const r of rows) {
      const d = new Date(r.attendance_date);
      const day = d.getDay();
      const key = `${r.student_id}|${day}|${r.subject_id}`;
      // if duplicates exist, keep latest or first—your choice
      attIndex.set(key, r);
    }

    const studentWithScore = students.map((s) => {
      const sid = s.student_id ?? s.toJSON().student_id;
      const json = s.toJSON() ? s.toJSON() : s;
      let arrAtt = [];

      const score = slotList.map((slot) => {
        const dayNum = dayRange[slot.day];
        const key = `${sid}|${dayNum}|${slot.subject_id}`;
        const att = attIndex.get(key);
        if (att) {
          arrAtt.push(att);
        }

        if (att) {
          if (att.status === 1) {
            return "P";
          } else if (att.status === 2) {
            return "A";
          } else if (att.status === 3) {
            return "AP";
          } else {
            return "L";
          }
        } else {
          return 0;
        }
      });
      const total_p = arrAtt.filter((a) => a.status === 1).length;
      const total_a = arrAtt.filter((a) => a.status === 2).length;
      const total_ap = arrAtt.filter((a) => a.status === 3).length;
      const total_l = arrAtt.filter((a) => a.status === 4).length;

      return { ...json, total_a, total_p, total_ap, total_l, score };
    });

    const buffer = await exportAttendanceScoreStyle(studentWithScore, slotList);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ExportAttendent.xlsx"',
    );
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    errorResponse(res, "Error export weekly report", err.message);
  }
};

// Helper: apply thin border to a cell
function setThinBorder(cell) {
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
}

async function exportAttendanceScoreStyle(data, slotList = []) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Sheet1");

  // ========= constants =========
  const START_COL_SCORE = 6; // F
  const SCORE_COLS = 18; // 18 slots
  const TOTAL_COLS = 4; // P, A, AP, L
  const TOTAL_COL_START = START_COL_SCORE + SCORE_COLS; // X (24)
  const LAST_COL = TOTAL_COL_START + TOTAL_COLS - 1; // AA (27)

  const startRow = 4; // data starts here

  // ========= columns (A..AA = 27 cols) =========
  // widths: adjust as you like
  ws.columns = [
    { key: "no", width: 5 }, // A
    { key: "kh", width: 25 }, // B
    { key: "en", width: 25 }, // C
    { key: "gender", width: 10 }, // D
    { key: "class", width: 13 }, // E
    ...Array.from({ length: SCORE_COLS }, (_, i) => ({
      key: `s${i + 1}`,
      width: 6, // umber, not boolean
    })),
    { key: "p", width: 8 }, // X
    { key: "a", width: 8 }, // Y
    { key: "ap", width: 8 }, // Z
    { key: "l", width: 8 }, // AA
  ];

  // ========= row heights =========
  ws.getRow(1).height = 74.25;
  ws.getRow(2).height = 16.5;
  ws.getRow(3).height = 16.5;

  // ========= title =========
  ws.mergeCells(`B1:${ws.getColumn(LAST_COL).letter}1`);
  const titleCell = ws.getCell("B1");
  titleCell.value = "វិទ្យាស្ថានស៊ីតិច";
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.font = { name: "Khmer OS Muol", size: 24 };

  // ========= header styles =========
  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE7E6E6" },
  };
  const headerFont = { name: "Arial Narrow", size: 11 };

  // merge fixed headers A..E rows 2-3
  ["A", "B", "C", "D", "E"].forEach((col) => ws.mergeCells(`${col}2:${col}3`));

  ws.getCell("A2").value = "No";
  ws.getCell("B2").value = "Student Name";
  ws.getCell("C2").value = "English Name";
  ws.getCell("D2").value = "Gender";
  ws.getCell("E2").value = "Class";

  // Days header (row2) across 3 columns each => total 18 cols (F..W)
  const days = [
    { name: "Monday", start: "F", end: "H" },
    { name: "Tuesday", start: "I", end: "K" },
    { name: "Wednesday", start: "L", end: "N" },
    { name: "Thursday", start: "O", end: "Q" },
    { name: "Friday", start: "R", end: "T" },
    { name: "Saturday", start: "U", end: "W" },
  ];

  for (const d of days) {
    ws.mergeCells(`${d.start}2:${d.end}2`);
    const cell = ws.getCell(`${d.start}2`);
    cell.value = d.name;
    cell.alignment = { horizontal: "center", vertical: "middle" };
  }

  // totals header (row2-3 merged)
  const totals = [
    { label: "P", col: "X" },
    { label: "A", col: "Y" },
    { label: "AP", col: "Z" },
    { label: "L", col: "AA" },
  ];
  totals.forEach((t) => {
    ws.mergeCells(`${t.col}2:${t.col}3`);
    ws.getCell(`${t.col}2`).value = t.label;
    ws.getCell(`${t.col}2`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  });

  // style row2 + row3 (A..AA)
  for (let col = 1; col <= LAST_COL; col++) {
    [2, 3].forEach((r) => {
      const cell = ws.getRow(r).getCell(col);
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      setThinBorder(cell);
    });
  }

  // put at most 18 slots into F..W
  slotList.slice(0, SCORE_COLS).forEach((slot, idx) => {
    const col = ws.getCell(`${ws.getColumn(START_COL_SCORE + idx).letter}3`);
    col.value = slot.subject_name;
    col.font = { name: "Calibri", size: 10 };
  });

  // ========= data rows =========
  data.forEach((s, idx) => {
    const rowIndex = startRow + idx;
    const r = ws.getRow(rowIndex);
    r.height = 25.5;

    // style row
    for (let col = 1; col <= LAST_COL; col++) {
      const cell = r.getCell(col);
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.font = { name: "Calibri", size: 12 };
      setThinBorder(cell);
    }

    r.getCell(1).value = idx + 1;
    r.getCell(2).value = s.studentname_kh ?? "";
    r.getCell(3).value = s.studentname_en ?? "";
    r.getCell(4).value = s.gender ?? "";
    r.getCell(5).value = s.class ?? "";

    const score = Array.isArray(s.score) ? s.score : [];
    score.forEach((s, i) => {
      r.getCell(START_COL_SCORE + i).value = s ?? 0;
      let textColor = "000000";
      let textBold = false;
      if (s === "P") {
        textColor = "FF00B050";
        textBold = true;
      } else if (s === "A") {
        textColor = "FF0000";
        textBold = true;
      } else if (s === "AP") {
        textColor = "538DD5";
        textBold = true;
      } else if (s === "L") {
        textColor = "CC9900";
        textBold = true;
      }
      r.getCell(START_COL_SCORE + i).font = {
        color: { argb: textColor },
        bold: textBold,
      };
    });

    const firstColLetter = ws.getColumn(START_COL_SCORE).letter;
    const lastColLetter = ws.getColumn(START_COL_SCORE + SCORE_COLS - 1).letter;

    const range = `${firstColLetter}${rowIndex}:${lastColLetter}${rowIndex}`;

    // P = Present
    r.getCell(TOTAL_COL_START + 0).value = {
      formula: `COUNTIF(${range},"P")`,
    };

    // A = Absent
    r.getCell(TOTAL_COL_START + 1).value = {
      formula: `COUNTIF(${range},"A")`,
    };

    // AP = Permission/Absent with Permission (your meaning)
    r.getCell(TOTAL_COL_START + 2).value = {
      formula: `COUNTIF(${range},"AP")`,
    };

    // L = Late
    r.getCell(TOTAL_COL_START + 3).value = {
      formula: `COUNTIF(${range},"L")`,
    };

    for (let x = 0; x < 4; x++) {
      r.getCell(TOTAL_COL_START + x).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };
    }

    r.getCell(2).font = { name: "Khmer OS Siemreap", size: 12 };

    // optional align names
    r.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
  });

  // ========= total row =========
  const totalRowIndex = startRow + data.length;
  const totalRow = ws.getRow(totalRowIndex);
  totalRow.height = 26.1;

  ws.mergeCells(`A${totalRowIndex}:E${totalRowIndex}`);
  const totalLabelCell = ws.getCell(`A${totalRowIndex}`);
  totalLabelCell.value = "Total";
  totalLabelCell.alignment = { horizontal: "center", vertical: "middle" };

  const totalFont = {
    name: "Aptos Narrow",
    size: 16,
    color: { argb: "FFFF0000" },
  };

  for (let col = 1; col <= LAST_COL; col++) {
    const cell = totalRow.getCell(col);
    cell.fill = headerFill;
    cell.font = totalFont;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    setThinBorder(cell);
  }

  // formulas for F..AA
  const firstData = startRow;
  const lastData = totalRowIndex - 1;

  for (let col = START_COL_SCORE; col <= LAST_COL; col++) {
    const letter = ws.getColumn(col).letter;
    totalRow.getCell(col).value = {
      formula: `COUNTIF(${letter}${firstData}:${letter}${lastData}, "P")`,
    };
  }

  // ws.views = [{ state: "frozen", ySplit: 3 }];

  return workbook.xlsx.writeBuffer();
}

module.exports = {
  createAttendance,
  bulkCreateAttendance,
  getAttendanceByClass,
  exportWeeklyReport,
  getSchedule,
  updateAttendanceStatus
};

// const getAttendanceByClass = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const class_id = parseInt(id);

//     const rows = await Attendance.findAll({
//       include: [
//         {
//           model: Student,
//           as: "student_info",
//           attributes: { exclude: ["created_at", "updated_at"] },
//           required: true,
//           where: { class_id },
//         },
//       ],
//       // where: {col('student_info.class_id'): class_id},
//       attributes: [
//         [Sequelize.col("Attendance.student_id"), "student_id"],
//         [
//           Sequelize.literal(`
//         JSON_ARRAYAGG(
//           JSON_OBJECT(
//             'attendance_id', Attendance.attendance_id,
//             'attendance_date', Attendance.attendance_date,
//             'status', Attendance.status,
//             'subject_id', Attendance.subject_id
//           )
//         )
//       `),
//           "attendances",
//         ],
//       ],
//       group: ["Attendance.student_id", "student_info.student_id"],
//       order: [[Sequelize.col("Attendance.student_id"), "ASC"]],
//       raw: true,
//       nest: true,
//     });

//     // MySQL returns JSON as string sometimes, so parse it
//     // const result = rows.map((r) => ({
//     //   ...r,
//     //   attendances:
//     //     typeof r.attendances === "string"
//     //       ? JSON.parse(r.attendances)
//     //       : r.attendances,
//     // }));

//     // get subject and order by schedule
//     const subjects = await Subject.findAll({
//       attributes: ["subject_id", "subject_name"],
//     });

//     const subjectByName = new Map(
//       subjects.map((s) => [s.subject_name, s.toJSON()]),
//     );

//     const mapSchedule = schedule.map((day) => ({
//       day: day.day,
//       attendances: day.subject.map((name) => {
//         const subject = subjectByName.get(name);
//         return subject
//           ? { ...subject, attendance_date: "", status: 0, attendance_id: 0 }
//           : {
//               subject_id: null,
//               subject_name: name,
//               attendance_date: "",
//               status: 0,
//               attendance_id: 0,
//             };
//       }),
//     }));

//     const data = rows.map((row) => {
//       const attendanceIndex = new Map(
//         row.attendances.map((a) => [
//           `${a.subject_id}|${new Date(a.attendance_date).getUTCDay()}`,
//           a,
//         ]),
//       );

//       const weekly_attendance = mapSchedule.map((sche) => ({
//         day: sche.day,
//         attendances: sche.attendances.map((a) => {
//           const found = attendanceIndex.get(
//             `${a.subject_id}|${dayRange[sche.day]}`,
//           );
//           return found
//             ? {
//                 subject_id: a.subject_id,
//                 subject_name: a.subject_name,
//                 attendance_date: found.attendance_date,
//                 status: found.status,
//                 attendance_id: found.attendance_id,
//               }
//             : a;
//         }),
//       }));

//       return { student_info: row.student_info, weekly_attendance };
//     });

//     successResponse(res, "Attendance records fetched", data);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };
