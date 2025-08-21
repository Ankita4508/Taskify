const mongoose = require("mongoose");

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, {
      // Mongoose 7: no need for useNewUrlParser/useUnifiedTopology
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
