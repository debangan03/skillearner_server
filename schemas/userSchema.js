const mongoose = require("mongoose");
const courseSchema = require("./courseSchema");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    enrolledcourses: [courseSchema],
  },
  { timestamps: true }
);
module.exports = userSchema;
