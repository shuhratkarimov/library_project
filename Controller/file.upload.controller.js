const BackblazeB2 = require("backblaze-b2");
const multer = require("multer");
const Book = require("../Schemas/books.schema");
const BaseError = require("../Utils/base_error")
require("dotenv").config();
const b2 = new BackblazeB2({
  keyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

const storage = multer.memoryStorage();
const upload = multer({ storage }).array("pictures", 3);

async function uploadBookImages(req, res, next) {
  try {
    console.log(req.files); 
    if (!req.files || req.files.length !== 3) {
      return res.status(400).json({ message: "Iltimos, uchta rasm yuklang!" });
    }

    await b2.authorize();
    const bucketName = process.env.B2_BUCKET_NAME;

    const imageUrls = await Promise.all(
      req.files.map(async (file) => {
        const fileName = `${Date.now()}-${file.originalname}`;
        const response = await b2.uploadFile(bucketName, file.buffer, fileName, {
          "Content-Type": file.mimetype,
        });
        return response.data.fileUrl; 
      })
    );

    const bookId = req.params.bookId;
    const book = await Book.findByIdAndUpdate(bookId, { img: imageUrls }, { new: true });
    if (!book) {
      return res.status(404).json({ message: "Kitob topilmadi!" });
    }

    res.status(200).json({
      message: "Rasmlar muvaffaqiyatli yuklandi!",
      images: imageUrls,
    });
  } catch (error) {
    next(error)
  }
}

module.exports = {
  uploadBookImages,
  upload
}