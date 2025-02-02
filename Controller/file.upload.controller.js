const multer = require("multer");
const path = require("path");
const fs = require("fs");
const BooksModel = require("../Schemas/books.schema");
const AuthorsModel = require("../Schemas/authors.schema");
const BaseError = require("../Utils/base_error");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer konfiguratsiyasi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileNewName = `${Date.now()}${fileExtension}`;
    cb(null, fileNewName);
  },
});

const upload = multer({ storage });

async function fileUploader(req, res, next) {
  upload.single("picture")(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(BaseError.BadRequest(400, "Fayl yuklanmadi!"));
    }

    const fileLink = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const { modelType, id } = req.params;

    let model;
    if (modelType === "book") {
      model = BooksModel;
    } else if (modelType === "author") {
      model = AuthorsModel;
    } else {
      return next(BaseError.BadRequest(400, "Noto‘g‘ri model turi!"));
    }

    const updatedItem = await model.findByIdAndUpdate(id, { img: fileLink }, { new: true });

    if (!updatedItem) {
      return res.status(404).json({ message: "Ma'lumot topilmadi!" });
    }

    res.status(201).json({
      message: "Rasm muvaffaqiyatli yuklandi",
      image: fileLink,
    });
  });
}

module.exports = fileUploader;
