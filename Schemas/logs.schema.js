const mongoose = require("mongoose");
const { level } = require("winston");
const { Schema } = mongoose;

const LogsSchema = new Schema({
  timestamp: {
    type: Date,
    default: `${new Date().getFullYear()}.${
      new Date().getMonth() + 1
    }.${new Date().getDate()}`,
  },
  level: {
    type: String,
  },
  message: {
    type: String,
  },
});

const LogsModel = mongoose.model("log", LogsSchema);
module.exports = LogsModel;
