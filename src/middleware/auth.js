const jwt = require("jsonwebtoken");

function authGuard(req, res, next) {
  try {
    console.log("Cookies received:", req.cookies); // ✅ Debug: see cookies

    const token = req.cookies?.token;
    if (!token) {
      console.log("No token found. Redirecting to login.");
      return res.redirect("/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT decoded successfully:", decoded); // ✅ Debug: decoded payload
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.redirect("/login"); // invalid or expired token
  }
}

module.exports = { authGuard };

