const sequelize = require("./config/db");

const Class = require('./models/class.model');
const Subject = require('./models/subject.model');
const Teacher = require('./models/teacher.model');
const Student = require('./models/student.model');
const Attendance = require('./models/attendance.model');


(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    await sequelize.sync({ alter: true });
    console.log("Migration completed successfully");

    process.exit();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
})();
