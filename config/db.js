const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
    process.env.DB_NAME,   // DB name
    process.env.DB_USER_NAME,         // DB user
    process.env.DB_PASSWORD,             // DB password
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "mysql",
        logging: false
    }
);

// TEST connection
sequelize.authenticate()
  .then(() => console.log("Sequelize connected.."))
  .catch(err => console.log("DB Error: ", err));

module.exports = sequelize;
