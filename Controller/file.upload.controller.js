const multer = require("multer");
const path = require("path");
module.exports = function fileUploader(req, res, next) {
  try {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
      },
      filename: (req, file, cb) => {
        const fileNewName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
        cb(null, fileNewName); 
      },
    });
    const upload = multer({ storage: storage });
    upload.single("picture")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: "Rasm yuklanmadi, iltimos rasmni yuklang!" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Rasm yuklanmadi, iltimos rasmni yuklang!" });
      }
      const fileInfo = {
        fileName: req.file.filename,
        link: `${req.protocol}://${req.get("host")}/${req.file.filename}`,
      };
      res.status(201).json({
        message: "Rasm muvaffaqiyatli yuklandi",
        file: fileInfo,
      });
    });
  } catch (error) {
    next(error);
  }
};
