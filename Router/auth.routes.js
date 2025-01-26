const { Router } = require("express");
const { register, login, verify, logout } = require("../Controller/auth.controller");
const AuthValidator = require("../Middlewares/auth_validation_middleware.js");
const {
  getNewAccessTokenUsingRefreshToken,
} = require("../Middlewares/verify_token_middleware.js");
const AuthRouter = Router();

AuthRouter.post("/register", AuthValidator, register);
AuthRouter.post("/login", login);
AuthRouter.post("/verify", verify);
AuthRouter.post("/refresh", getNewAccessTokenUsingRefreshToken);
AuthRouter.post("/logout", logout);

module.exports = AuthRouter;
