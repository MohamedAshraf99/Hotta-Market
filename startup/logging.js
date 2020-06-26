const winston = require("winston");
require("winston-mongodb");
require("express-async-errors");

module.exports = function () {
  winston.handleExceptions(
    new winston.transports.Console({ colorize: true, prettyPrint: true }),

    new winston.transports.File({ filename: "uncaughtExceptions.log" })
  );

  process.on("unhandledRejection", (ex) => {
    throw ex;
  });

  winston.add(winston.transports.File, { filename: "logfile.log" });
  winston.add(winston.transports.MongoDB, {
    // db: 'mongodb://admin2:mrMgr2020@173.212.224.29:27017/mrMgr',
    db: process.env.DB_URL,
    // db: 'mongodb://localhost:27017/mrMgr',
    level: "info",
  });
};
