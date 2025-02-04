const AuthModel = require("../Schemas/auth.schema");

async function cleanEntireAuthCollection(req, res, next) {
  try {
    await AuthModel.deleteMany();
    res.status(200).json({
      message: "Ro'yxatdan o'tish bilan bog'langan DB collection'i tozalandi!",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = cleanEntireAuthCollection
