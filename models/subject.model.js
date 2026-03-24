const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SubjcetSchema = sequelize.define(
  "Subject",
  {
    subject_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    subject_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "subject_tbl",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = SubjcetSchema;
