const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const ClassSchema = require("./class.model");

const StudentSchema = sequelize.define("Student", {
    student_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentname_kh: {
        type: DataTypes.STRING,
    },
    studentname_en: DataTypes.STRING,
    gender: DataTypes.STRING,
    class_id: {
        type: DataTypes.INTEGER,
        references: {
            model: "class_tbl",
            key: "class_id"
        }
    }
},
{
    tableName: 'student_tbl',
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
}
);

// Student belongs to Class
StudentSchema.belongsTo(ClassSchema, {
    foreignKey: 'class_id',
    as: 'class_info'
});

// Optional: Class has many Students
ClassSchema.hasMany(StudentSchema, {
    foreignKey: 'class_id',
    as: 'students'
});


module.exports = StudentSchema;