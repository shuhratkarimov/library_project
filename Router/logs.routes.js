const { Router } = require("express");
const getLogs = require("../Controller/logs.controller");
const {verifyAccessToken} = require("../Middlewares/verify_token_middleware")
const LogsRouter = Router()

LogsRouter.get("/get_logs", verifyAccessToken, getLogs)

module.exports = LogsRouter