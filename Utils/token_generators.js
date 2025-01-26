const jwt = require("jsonwebtoken")

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_SECRET_KEY, {expiresIn: process.env.ACCESS_EXPIRING_TIME})
}

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_SECRET_KEY, {expiresIn: process.env.REFRESH_EXPIRING_TIME})
}

module.exports = {
    generateAccessToken,
    generateRefreshToken
}