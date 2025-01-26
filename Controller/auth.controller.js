const UserModel = require("../Schemas/auth.schema");
const BaseError = require("../Utils/base_error");
const bcryptjs = require("bcryptjs");
const { array } = require("joi");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../Utils/token_generators");
const logger = require("../service/logger");

async function register(req, res, next) {
  try {
    const { username, email, password, role } = req.body;
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
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.VERIFIER_EMAIL,
        pass: process.env.VERIFIER_GOOGLE_PASS_KEY,
      },
    });

    const randomCode = Number(
      Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("")
    );
    async function verifierEmail() {
      const info = await transporter.sendMail({
        from: `Verifying service of ${process.env.VERIFIER_EMAIL}>`,
        to: email,
        subject: "Verifying email",
        text: "to sign up",
        html: `     <div
      class="main"
      style="
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;
        text-align: center;
        background-color: rgb(128, 186, 157);
        max-width: 900px;
        margin: 0 auto;
        border-radius: 20px;
        box-shadow: 10px 10px 30px rgb(0, 0, 0);
        height: 500px;
        font-family: Fira Sans;
      "
    >
      <div class="verCode" style="font-size: 33px; font-weight: 700">
        <p>Sizning tasdiqlash kodingiz:</p>
        <p
          style="
            background-color: white;
            width: 300px;
            height: 50px;
            padding-top: 18px;
            margin-left: 120px;
            border-radius: 10px;
          "
        >${randomCode}</p>
      </div>
    </div>`,
      });
      console.log("Message sent: %s", info.messageId);
    }
    logger.info(`${email} email manziliga tasdiqlash kodi yuborildi!`);
    const encodedPassword = await bcryptjs.hash(password, 12);
    const newUser = new UserModel({
      username: username,
      email: email,
      password: encodedPassword,
      verification_code: randomCode,
    });
    await newUser.save();
    await verifierEmail().catch((err) => next(err));
    setTimeout(async () => {
      await UserModel.findByIdAndUpdate(newUser._id, { verification_code: 0 });
    }, 60 * 1000);
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
      return next(BaseError.BadRequest(404), "Bunday foydalanuvchi topilmadi!");
    }
    if (code === foundUser.verification_code) {
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
      return res.status(401).json({
        message: "Kod tasdiqlanmadi!",
      });
    }
  } catch (error) {
    logger.error(`${req.body.email} email egasi register qilishga urindi!`);
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
      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      logger.info(`${foundUser.username} tizimga kirdi!`);
      res.status(200).json({
        message: "Tizimga kirish muvaffaqiyatli amalga oshirildi!",
      });
    } else {
      next(BaseError.BadRequest(401, "Sizning emailingiz tasdiqlanmagan!"));
    }
  } catch (error) {
    next(error);
  }
}

function logout(req, res, next) {
  const decoded = jwt.verify(
    req.cookies.refreshtoken,
    process.env.REFRESH_SECRET_KEY
  );
  res.clearCookie("accesstoken");
  res.clearCookie("refreshtoken");
  logger.info(`${decoded.username} tizimdan chiqdi!`);
  res.status(200).json({
    message: "Tokenlar o'chirib tashlandi!",
  });
}

module.exports = {
  register,
  login,
  verify,
  logout,
};
