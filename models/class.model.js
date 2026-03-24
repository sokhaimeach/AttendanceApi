const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ClassSchema = sequelize.define("Class", {
   class_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
   },
   class_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
   }
},
{
    tableName: "class_tbl",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });

module.exports = ClassSchema;