const {Router} = require("express")
const {getAuthors, getOneAuthor, searchAuthors, addAuthor, updateAuthor, deleteAuthor} = require("../Controller/authors.controller")
const authorsRouter = Router()
const AuthorsValidator = require("../Middlewares/authors_validation_middleware")
const {verifyAccessToken} = require("../Middlewares/verify_token_middleware")

authorsRouter.get("/get_authors", getAuthors)
authorsRouter.get("/get_one_author/:id", getOneAuthor)
authorsRouter.get("/search_authors", searchAuthors)
authorsRouter.post("/add_author", [AuthorsValidator, verifyAccessToken], addAuthor)
authorsRouter.put("/update_author/:id", verifyAccessToken, updateAuthor)
authorsRouter.delete("/delete_author/:id", verifyAccessToken, deleteAuthor)

module.exports = authorsRouter