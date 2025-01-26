const jwt = require("jsonwebtoken");
const BaseError = require("../Utils/base_error");
const { generateAccessToken } = require("../Utils/token_generators");

function verifyAccessToken(req, res, next) {
  try {
    const { accesstoken } = req.cookies;
    const decoded = jwt.verify(accesstoken, process.env.ACCESS_SECRET_KEY);
    req.user = decoded;
    const allowedRoles = ["admin", "superadmin", "teacher"];
    if (!allowedRoles.includes(decoded.role)) {
      return next(
        BaseError.BadRequest(
          403,
          "Siz admin, superadmin yoki teacher emassiz va shu sababli ma'lumotlar bilan ishlash qamrovi cheklangan!"
        )
      );
    }
    next();
  } catch (error) {
    next(error);
  }
}

function getNewAccessTokenUsingRefreshToken(req, res, next) {
  try {
    const { refreshtoken } = req.cookies;
    if (!refreshtoken) {
      return next(BaseError.BadRequest(404, "Refresh token topilmadi!"));
    }
    const decoded = jwt.verify(refreshtoken, process.env.REFRESH_SECRET_KEY)
    const payload = {
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
    const accesstoken = generateAccessToken(payload);
      res.cookie("accesstoken", accesstoken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
      });
      res.status(200).json({
        message: "Refresh token orqali yangi access token berildi!",
      });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  verifyAccessToken,
  getNewAccessTokenUsingRefreshToken
}