const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// -----------------------------
// User Schema
// -----------------------------
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // Reset password (token flow)
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Reset password (OTP flow)
    resetPasswordOTP: String,
    resetPasswordOTPExpire: Date,
  },
  { timestamps: true }
);

// -----------------------------
// Middleware: Hash password before save
// -----------------------------
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// -----------------------------
// Methods
// -----------------------------

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Generate JWT Token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, name: this.name },
    process.env.JWT_SECRET || "default_secret", // fallback for dev
    { expiresIn: process.env.JWT_EXPIRES || "1h" }
  );
};

// Generate and hash password reset token (for reset link flow)
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
  return resetToken;
};

// Generate OTP for password reset (OTP flow)
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.resetPasswordOTP = otp;
  this.resetPasswordOTPExpire = Date.now() + 15 * 60 * 1000; // 15 mins
  return otp;
};

// -----------------------------
// Export model
// -----------------------------
const User = mongoose.model("User", userSchema);
module.exports = User;
