const { Router } = require("express");
const {
  getBooks,
  getOneBook,
  searchBooks,
  addBook,
  updateBook,
  deleteBook,
} = require("../Controller/books.controller");
const BooksValidator = require("../Middlewares/books_validation_middleware");
const booksRouter = Router();
const {verifyAccessToken} = require("../Middlewares/verify_token_middleware")

booksRouter.get("/get_books", getBooks);
booksRouter.get("/get_one_book/:id", getOneBook);
booksRouter.get("/search_books", searchBooks);
booksRouter.post("/add_book", [BooksValidator, verifyAccessToken], addBook);
booksRouter.put("/update_book/:id", verifyAccessToken, updateBook);
booksRouter.delete("/delete_book/:id", verifyAccessToken, deleteBook);

module.exports = booksRouter;
