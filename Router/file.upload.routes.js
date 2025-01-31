const { Router } = require("express");
const fileUploadRouter = Router();
const {uploadBookImages, upload} = require("../Controller/file.upload.controller");
const {verifyAccessToken} = require("../Middlewares/verify_token_middleware")
fileUploadRouter.post("/upload_book_image/:bookId", [verifyAccessToken, upload], uploadBookImages);

module.exports = fileUploadRouter;
