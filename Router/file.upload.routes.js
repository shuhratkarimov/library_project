const { Router } = require("express");
const fileUploadRouter = Router();
const fileUploader = require("../Controller/file.upload.controller");
const {verifyAccessToken} = require("../Middlewares/verify_token_middleware")
fileUploadRouter.post("/upload/:modelType/:id", verifyAccessToken, fileUploader);

module.exports = fileUploadRouter;
