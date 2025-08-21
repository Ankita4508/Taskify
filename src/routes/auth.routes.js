const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { authGuard } = require("../middleware/auth");

const router = express.Router();

/* -----------------------------
   Helper: set auth cookie
-------------------------------- */
function setAuthCookie(res, user) {
  const payload = { id: user._id, email: user.email, name: user.name };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/* -----------------------------
   Mailer (Nodemailer)
-------------------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* -----------------------------
   Public Home
-------------------------------- */
router.get("/", (req, res) => {
  const user = req.cookies?.token ? true : false;
  res.render("index", { title: "Home", isAuthed: user });
});

/* -----------------------------
   Register
-------------------------------- */
router.get("/register", (req, res) => {
  res.render("register", { title: "Register", error: null, values: {} });
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).render("register", {
        title: "Register",
        error: "All fields are required.",
        values: { name, email },
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render("register", {
        title: "Register",
        error: "Passwords do not match.",
        values: { name, email },
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).render("register", {
        title: "Register",
        error: "Email already in use.",
        values: { name, email },
      });
    }

    // Use new User() + save() so pre("save") hook runs properly
    const user = new User({ name, email, password });
    await user.save();

    setAuthCookie(res, user);
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    return res.status(500).render("register", {
      title: "Register",
      error: "Server error. Try again.",
      values: {},
    });
  }
});

/* -----------------------------
   Login
-------------------------------- */
router.get("/login", (req, res) => {
  res.render("login", { title: "Login", error: null, values: {} });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).render("login", {
        title: "Login",
        error: "Email & password required.",
        values: { email },
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).render("login", {
        title: "Login",
        error: "Invalid credentials.",
        values: { email },
      });
    }

    const ok = await user.matchPassword(password);
    if (!ok) {
      return res.status(400).render("login", {
        title: "Login",
        error: "Invalid credentials.",
        values: { email },
      });
    }

    setAuthCookie(res, user);
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("❌ Login error:", err.message);
    return res.status(500).render("login", {
      title: "Login",
      error: "Server error. Try again.",
      values: {},
    });
  }
});

/* -----------------------------
   Forgot Password (Step 1: Send OTP)
-------------------------------- */
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    title: "Forgot Password",
    error: null,
    success: null,
  });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always redirect to verify page (don’t reveal if email exists)
    if (!user) {
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP is: <b>${otp}</b></p><p>It expires in 15 minutes.</p>`,
    });

    res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error("❌ Forgot password error:", err.message);
    res.render("forgot-password", {
      title: "Forgot Password",
      error: "Error sending OTP. Try again.",
      success: null,
    });
  }
});

/* -----------------------------
   Verify OTP + Reset Password (Step 2)
-------------------------------- */
router.get("/verify-otp", (req, res) => {
  const email = req.query.email || "";
  res.render("verify-otp", {
    title: "Verify OTP",
    email,
    otp: "",
    error: null,
    message: null,
    success: null,
  });
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("verify-otp", {
        title: "Verify OTP",
        email,
        otp: "",
        error: "Invalid or expired OTP.",
        message: null,
        success: null,
      });
    }

    if (password !== confirmPassword) {
      return res.render("verify-otp", {
        title: "Verify OTP",
        email,
        otp,
        error: "Passwords do not match.",
        message: null,
        success: null,
      });
    }

    // ✅ Let pre("save") handle hashing
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    await user.save();

    return res.redirect("/login");
  } catch (err) {
    console.error("❌ Verify OTP error:", err.message);
    res.render("verify-otp", {
      title: "Verify OTP",
      email: req.body.email || "",
      otp: "",
      error: "Server error. Try again.",
      message: null,
      success: null,
    });
  }
});

/* -----------------------------
   Dashboard (protected)
-------------------------------- */
router.get("/dashboard", authGuard, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.render("dashboard", { title: "Dashboard", user });
});

/* -----------------------------
   Logout
-------------------------------- */
router.get("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.redirect("/");
});

module.exports = router;
