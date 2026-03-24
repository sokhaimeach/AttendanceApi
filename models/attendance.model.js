const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const StudentSchema = require("./student.model");
const TeacherSchema = require("./teacher.model");
const SubjcetSchema = require("./subject.model");

const AttendanceSchema = sequelize.define(
  "Attendance",
  {
    attendance_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "student_tbl",
        key: "student_id",
      },
    },
    subject_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "subject_tbl",
        key: "subject_id",
      },
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "teacher_tbl",
        key: "teacher_id",
      },
    },
    attendance_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
  },
  {
    tableName: "attendance_tbl",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

// Attendance belongs to Student
AttendanceSchema.belongsTo(StudentSchema, {
  foreignKey: 'student_id',
  as: 'student_info'
});

StudentSchema.hasMany(AttendanceSchema, {
  foreignKey: 'student_id',
  as: 'attendances'
});

// Subject belongs to Teacher
AttendanceSchema.belongsTo(TeacherSchema, {
  foreignKey: 'teacher_id',
  as: 'teacher_info'
});

TeacherSchema.hasMany(AttendanceSchema, {
  foreignKey: 'teacher_id',
  as: 'attendances'
});

// Acossiation Subject
AttendanceSchema.belongsTo(SubjcetSchema, {
  foreignKey: 'subject_id',
  as: 'subject_info'
});

SubjcetSchema.hasMany(AttendanceSchema, {
  foreignKey: 'subject_id',
  as: 'attendances'
});


module.exports = AttendanceSchema;