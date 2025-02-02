const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CarsModel = require("../Schemas/cars.schema");
const BaseError = require("../Utils/base_error");


const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function fileUploader(req, res, next) {
  try {
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

    const upload = multer({ storage: storage });

    upload.array("pictures", 3)(req, res, async (err) => {
      if (err) {
        return next(err);
      }
      if (req.files.length !== 3) {
        return next(BaseError.BadRequest(404, "Yuklanadigan rasmlar soni 3 ta bo'lishi kerak!"));
      }

      const fileLinks = req.files.map(
        (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      );

      const id = req.params.carId;
      const car = await CarsModel.findByIdAndUpdate(id, { img: fileLinks }, { new: true });

      if (!car) {
        return res.status(404).json({ message: "Avtomobil topilmadi!" });
      }

      res.status(201).json({
        message: "Rasmlar muvaffaqiyatli yuklandi",
        images: fileLinks,
      });
    });
  } catch (error) {
    next(error);
  }
}

module.exports = fileUploader;
