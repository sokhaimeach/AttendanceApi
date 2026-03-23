const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const bcrypt = require("bcrypt");

const TeacherSchema = sequelize.define(
  "Teacher",
  {
    teacher_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    teachername_kh: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teachername_en: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      enum: ['teacher', 'admin'],
      defaultValue: 'teacher',
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    image_url: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    public_id: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: 'Teacher_tbl',
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    defaultScope: {
      attributes: {exclude: ['password', 'created_at', 'updated_at']}
    },
    hooks: {
      beforeCreate: async (teacher) => {
        const salt = await bcrypt.genSalt(10);
        teacher.password = await bcrypt.hash(teacher.password, salt);
      },

      beforeUpdate: async (teacher) => {
        if(teacher.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          teacher.password = await bcrypt.hash(teacher.password, salt);
        }
      }
    }
  }
);

TeacherSchema.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
}

module.exports = TeacherSchema;
