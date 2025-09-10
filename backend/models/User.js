const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "유효한 이메일"],
      unique: true,
    },
    isLoggedIn: { type: Boolean, default: false },

    passwordHash: { type: String, required: true },
    displayName: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 비번 비교
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// 안전 출력
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject({ versionKey: false });
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
