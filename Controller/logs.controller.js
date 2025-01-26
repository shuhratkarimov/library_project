const { level } = require("winston");
const LogsModel = require("../Schemas/logs.schema");
const BaseError = require("../Utils/base_error");

async function getLogs(req, res, next) {
  try {
    const logs = await LogsModel.aggregate([
      {
        $group: {
          _id: "$level",
          logs: { $push: "$$ROOT" },
        },
      },
      { $sort: { id: -1 } },
    ]);
    if (!logs) {
      return next(BaseError.BadRequest(404, "Loglar hali mavjud emas!"));
    }
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
}
module.exports = getLogs;
