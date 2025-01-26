const { createLogger, format, transports } = require("winston");
const { combine, timestamp, prettyPrint, colorize, printf, json } = format;
const path = require('path');
require("winston-mongodb")
require("dotenv").config();
const logDirectory = path.join(__dirname, 'allLogs'); 
const errorLogDirectory = path.join(__dirname, 'errorLogs'); 

const fs = require('fs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}
if (!fs.existsSync(errorLogDirectory)) {
  fs.mkdirSync(errorLogDirectory);
}

const filename = path.join(logDirectory, `${new Date().getFullYear()}.${new Date().getMonth() + 1}.${new Date().getDate()}-logs.log`);
const errorFileName = path.join(errorLogDirectory, `${new Date().getFullYear()}.${new Date().getMonth() + 1}.${new Date().getDate()}-errorLogs.log`);
const customFormat = printf(({ level, message, timestamp }) => {
  return ` [${timestamp}]: (${level}): ${message} `;
});

const logger = createLogger({
  level: "debug",
  transports: [
    new transports.File({
      filename: filename,
      level: "debug",
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        json(),
        prettyPrint()
      ),
    }),
    new transports.File({
      filename: errorFileName,
      level: "error",
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        prettyPrint()
      ),
    }),
    new transports.Console({
      level: "info",
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        customFormat
      ),
    }),
    new transports.MongoDB({
      db: process.env.MONGO_URI,
      collection: "logs",
      level: "info"
    }),
  ],
});

module.exports = logger
