const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or use SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Step 1: Request OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // send mail
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    res.json({ msg: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Step 2: Verify OTP & Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ msg: "User not found" });
    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // clear otp
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
