const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
    "attendance_db",   // DB name
    "root",         // DB user
    "mathematics",             // DB password
    {
        host: "localhost",
        port: 8020,
        dialect: "mysql",
        logging: false
    }
);

// TEST connection
sequelize.authenticate()
  .then(() => console.log("Sequelize connected.."))
  .catch(err => console.log("DB Error: ", err));

module.exports = sequelize;
