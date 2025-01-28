const { attempt, number } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Foydalanuvchi nomi kiritilishi lozim!"],
    },
    email: {
      type: String,
      required: [true, "Email kiritilishi lozim!"],
    },
    password: {
      type: String,
      required: [true, "Parol kiritilishi lozim!"],
    },
    verification_code: {
      type: Number,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "user",
    },
    timestamp: {
      type: Date
    },
    password_recover_code: {
      type: Number,
      default: 0
    },
    attempts: {
      type: Number,
      default: 0
    },
    allowed_time: {
      type: Date,
      default: Date.now()
    }
  },
  { versionKey: false }
);
const userModel = mongoose.model("auth", UserSchema);

module.exports = userModel;
