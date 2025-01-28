const { Router } = require("express");
const fileUploadRouter = Router();
const {uploadBookImage, uploadAuthorImage} = require("../Controller/file.upload.controller");
const {verifyAccessToken} = require("../Middlewares/verify_token_middleware")
fileUploadRouter.post("/upload_book_image/:bookId", verifyAccessToken, uploadBookImage);
fileUploadRouter.post("/upload_author_image/:authorId", verifyAccessToken, uploadAuthorImage);
module.exports = fileUploadRouter;
