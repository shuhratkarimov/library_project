const multer = require("multer");
const path = require("path");
const fs = require("fs");
const BooksModel = require("../Schemas/books.schema");
const AuthorsModel = require("../Schemas/authors.schema");

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const fileNewName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, fileNewName);
  },
});

const upload = multer({ storage });

async function uploadBookImage(req, res, next) {
  try {
    upload.single("picture")(req, res, async (err) => {
      if (err || !req.file) {
        return res.status(400).json({ message: "Rasm yuklanmadi, iltimos rasmni yuklang!" });
      }

      const bookId = req.params.bookId;
      const imgUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      const book = await BooksModel.findByIdAndUpdate(bookId, { img: imgUrl });

      if (!book) {
        return res.status(404).json({ message: "Kitob topilmadi!" });
      }

      res.status(200).json({
        message: "Rasm muvaffaqiyatli yuklandi!",
        img: { fileName: req.file.filename, link: imgUrl },
      });
    });
  } catch (error) {
    next(error);
  }
}

async function uploadAuthorImage(req, res, next) {
  try {
    upload.single("picture")(req, res, async (err) => {
      if (err || !req.file) {
        return res.status(400).json({ message: "Rasm yuklanmadi, iltimos rasmni yuklang!" });
      }

      const authorId = req.params.authorId;
      const imgUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      const author = await AuthorsModel.findByIdAndUpdate(authorId, { img: imgUrl });

      if (!author) {
        return res.status(404).json({ message: "Adib topilmadi!" });
      }

      res.status(200).json({
        message: "Rasm muvaffaqiyatli yuklandi!",
        img: { fileName: req.file.filename, link: imgUrl },
      });
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadBookImage, uploadAuthorImage };
