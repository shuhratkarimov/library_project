const UserModel = require("../Schemas/auth.schema");
const BaseError = require("../Utils/base_error");
const bcryptjs = require("bcryptjs");
const { array, date } = require("joi");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../Utils/token_generators");
const logger = require("../service/logger");
const sendVerificationEmail = require("../Utils/verification_code_sender");
const sendForgotPasswordEmail = require("../Utils/forgot_password_code_sender");

async function register(req, res, next) {
  try {
    let { username, email, password } = req.body;
    const role =
      (await UserModel.countDocuments()) === 0 ? "superadmin" : "user";
    logger.info(`${username} register qilishga urindi!`);
    const foundUser = await UserModel.findOne({ email: email });
    if (foundUser) {
      logger.warn(
        `${username} ro'yxatdan o'tganligiga qaramasdan register qilishga urindi!`
      );
      return next(
        BaseError.BadRequest(
          403,
          "Siz oldin ro'yxatdan o'tgansiz, tizimga kirishingiz mumkin!"
        )
      );
    }
    const randomCode = Number(
      Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("")
    );
    await sendVerificationEmail(username, email, randomCode);
    logger.info(`${email} email manziliga tasdiqlash kodi yuborildi!`);
    const encodedPassword = await bcryptjs.hash(password, 12);
    const newUser = new UserModel({
      username: username,
      email: email,
      password: encodedPassword,
      verification_code: randomCode,
      role: role,
      timestamp: Date.now() + 2000 * 60,
    });
    await newUser.save();
    res.status(201).json({
      message: `Sizning ${email} elektron pochta manzilingizga tasdiqlash kodi jo'natildi!`,
    });
  } catch (error) {
    logger.error("Ro'yxatdan o'tish bilan bog'liq server xatosi yuzaga keldi!");
    next(error);
  }
}

async function verify(req, res, next) {
  try {
    const { email, code } = req.body;
    logger.info(`${email} egasi emailini tasdiqlashga urindi!`);
    const foundUser = await UserModel.findOne({ email: email });
    if (!foundUser) {
      return next(BaseError.BadRequest(404, "Bunday foydalanuvchi topilmadi!"));
    }
    if (
      Date.now() <= foundUser.timestamp &&
      code === foundUser.verification_code
    ) {
      await UserModel.findByIdAndUpdate(foundUser.id, {
        isVerified: true,
        verification_code: 0,
      });
      logger.info(`${email} email egasi emailini tasdiqlashdan o'tkazdi!`);
      return res.status(200).json({
        message: "Ro'yxatdan o'tish muvaffaqiyatli amalga oshirildi!",
      });
    } else {
      logger.warn(
        `Emailni tasdiqlashdan o'tkazish bo'yicha server xatoligi yuz berdi!`
      );
      return next(BaseError.BadRequest(401, "Kod tasdiqlanmadi!"))
    }
  } catch (error) {
    logger.error(`${req.body.email} email egasi register qilishga urindi!`);
    next(error);
  }
}

async function resendVerificationCode(req, res, next) {
  try {
    const { email } = req.body;
    const foundUser = await UserModel.findOne({ email: email });
    if (!foundUser) {
      return next(
        BaseError.BadRequest(
          404,
          "Siz ro'yxatdan o'tmagansiz, iltimos avval ro'yxatdan o'ting!"
        )
      );
    }
    if (foundUser.isVerified === true) {
      return next(
        BaseError.BadRequest(
          404,
          "Sizning emailingiz tasdiqlangan, tizimga kirishingiz mumkin!"
        )
      );
    }
    const randomCode = Number(
      Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("")
    );
    await sendVerificationEmail(foundUser.username, email, randomCode);
    foundUser.verification_code = randomCode;
    foundUser.timestamp = Date.now() + 2000 * 60;
    await foundUser.save();
    res.status(200).json({
      message: `Yangi tasdiqlash kodi ${email} ga yuborildi.`,
    });
  } catch (error) {
    logger.error("Qayta tasdiqlash kodi yuborishda xatolik yuzaga keldi.");
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const foundUser = await UserModel.findOne({ email: email });
    if (!foundUser) {
      return next(BaseError.BadRequest(404, "Foydalanuvchi topilmadi!"));
    }
    if (foundUser.isVerified === false) {
      return next(
        BaseError.BadRequest(
          404,
          "Sizning emailingiz tasdiqlanmagan, avval emailingizni tasdiqdan o'tkazing!"
        )
      );
    }
    const randomCode = Number(
      Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join("")
    );
    await sendForgotPasswordEmail(foundUser.username, email, randomCode);
    foundUser.timestamp = Date.now() + 2000 * 60;
    foundUser.password_recover_code = randomCode;
    await foundUser.save();
    res.status(200).json({
      message: `${email} ga  parolni tiklash uchun kod yuborildi.`,
    });
  } catch (error) {
    next(error);
  }
}

async function verifyForgotPasswordRecoverCode(req, res, next) {
  try {
    const { email, code } = req.body;
    logger.info(`${email} egasi parolini tiklashga tasdiqlashga urindi!`);
    const foundUser = await UserModel.findOne({ email });
    if (!foundUser) {
      return next(new BaseError(404, "Bunday foydalanuvchi topilmadi!"));
    }
    if (foundUser.allowed_time > Date.now()) {
      return next(
        new BaseError(429, "Siz ko'p marotaba noto'g'ri kod kiritgansiz! Keyinroq urinib ko'ring!")
      );
    }
    if (Date.now() <= foundUser.timestamp && code === foundUser.password_recover_code) {
      await UserModel.findByIdAndUpdate(foundUser._id, { password_recover_code: true });
      logger.info(`${email} email egasi parolni tiklash kodini tasdiqlashdan o'tkazdi!`);
      return res.status(200).json({ message: "Parolni tiklash kodi tasdiqlandi!" });
    }
    foundUser.attempts += 1;
    if (foundUser.attempts > 3) {
      foundUser.allowed_time = Date.now() + 1000 * 60 * 15;
      foundUser.attempts = 0;
      await foundUser.save();
      return next(
        new BaseError(429, "Siz juda ko'p noto'g'ri kod kiritdingiz! Iltimos, keyinroq urinib ko'ring!")
      );
    }
    await foundUser.save();
    logger.warn(`${email} egasi parolni tiklash kodini noto'g'ri kiritdi!`);
    return res.status(401).json({ message: "Kod tasdiqlanmadi!" });
  } catch (error) {
    next(error);
  }
}


async function resendRecoverForgotPasswordCode(req, res, next) {
  try {
    const { email } = req.body;
    logger.info(`Parolni tiklash kodi qayta yuborilishi so'raldi: ${email}`);
    const foundUser = await UserModel.findOne({ email });
    if (!foundUser) {
      return next(new BaseError(404, "Bunday foydalanuvchi topilmadi!"));
    }
    if (Date.now() <= foundUser.allowed_time && foundUser.attempts >= 3) {
      const waitTime = Math.ceil((foundUser.allowed_time - Date.now()) / 1000 / 60);
      return next(
        new BaseError(
          429,
          `Siz juda ko'p urinish qildingiz. Iltimos, ${waitTime} minutdan so'ng qayta urinib ko'ring!`
        )
      );
    }
    const randomCode = Number(
      Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join("")
    );
    foundUser.password_recover_code = randomCode;
    foundUser.timestamp = Date.now() + 2000 * 60;
    foundUser.attempts = 0; 
    foundUser.allowed_time = Date.now();
    await foundUser.save();
    try {
      await sendForgotPasswordEmail(foundUser.username, email, randomCode);
      logger.info(`Tasdiqlash kodi ${email} ga muvaffaqiyatli yuborildi!`);
    } catch (emailError) {
      logger.error(`Email yuborishda xatolik yuz berdi: ${email}`);
      return next(new BaseError(500, "Tasdiqlash kodi yuborilmadi. Keyinroq urinib ko'ring."));
    }
    res.status(200).json({
      message: `${email} ga parolni tiklash uchun kod qayta yuborildi.`,
    });
  } catch (error) {
    next(error);
  }
}




async function addNewPassword(req, res, next) {
  try {
    const { email, newPassword } = req.body;
    logger.info(`${email} egasi yangi parol kiritishga urindi!`);
    const foundUser = await UserModel.findOne({ email: email });
    if (!foundUser) {
      return next(BaseError.BadRequest(404, "Bunday foydalanuvchi topilmadi!"));
    }
    if (foundUser.password_recover_code === 1) {
      if (newPassword.toString().length < 5) {
        return next(
          BaseError.BadRequest(403,
          "Yangi parol kamida 5 ta belgidan iborat bo'lishi lozim!")
        );
      }
      const newHashPassword = await bcryptjs.hash(newPassword, 12);
      foundUser.password = newHashPassword;
      await foundUser.save();
      logger.warn(`${email} email egasi parolini yangiladi!`);
      return res.status(200).json({
        message: "Parolingiz yangilandi!",
      });
    } else {
      logger.warn(`Parolni yangilash bo'yicha server xatoligi yuz berdi!`);
      return res.status(401).json({
        message: "Parolni yangilash kodingiz tasdiqlanmagan!",
      });
    }
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const foundUser = await UserModel.findOne({ email: email });
    logger.info(`${email} email egasi login qilishga urindi!`);
    if (!foundUser) {
      logger.warn(`${email} egasi ro'yxatdan o'tmasdan login qilishga urindi!`);
      return next(
        BaseError.BadRequest(
          401,
          "Siz ro'yxatdan o'tmagansiz, avval ro'yxatdan o'tishingiz lozim!"
        )
      );
    }
    const checkPassword = await bcryptjs.compare(password, foundUser.password);
    if (!checkPassword) {
      logger.warn(
        `${email} login qilishga urinishi davomida noto'g'ri parol kiritdi!`
      );
      return next(BaseError.BadRequest(401, "Parol noto'g'ri kiritildi!"));
    }
    const payload = {
      username: foundUser.username,
      email: foundUser.email,
      role: foundUser.role,
    };
    const accesstoken = generateAccessToken(payload);
    const refreshtoken = generateRefreshToken(payload);
    if (foundUser.isVerified === true) {
      res.cookie("accesstoken", accesstoken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
      });
      
      // Refresh tokenni localStorage-ga yozish uchun frontendga jo'natish
      res.status(200).json({
        message: "Tizimga kirish muvaffaqiyatli amalga oshirildi!",
        refreshtoken, // Frontendda localStorage-ga yoziladi
      });
      
      logger.info(`${foundUser.username} tizimga kirdi!`);
    } else {
      next(BaseError.BadRequest(401, "Sizning emailingiz tasdiqlanmagan!"));
    }
  } catch (error) {
    next(error);
  }
}

function logout(req, res, next) {
  try {
    const refreshToken = req.body.refreshtoken; // Frontend refresh tokenni yuboradi
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token topilmadi!" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    res.clearCookie("accesstoken");
    
    logger.info(`${decoded.username} tizimdan chiqdi!`);
    res.status(200).json({
      message: "Tokenlar o'chirib tashlandi!",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  verify,
  logout,
  resendVerificationCode,
  forgotPassword,
  verifyForgotPasswordRecoverCode,
  resendRecoverForgotPasswordCode,
  addNewPassword,
};
