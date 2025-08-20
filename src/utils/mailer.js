const nodemailer = require("nodemailer");

// -----------------------------
// Create transporter for Gmail
// -----------------------------
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,  // Your Gmail address
        pass: process.env.EMAIL_PASS   // Your Gmail App Password
    }
});

// -----------------------------
// Send reminder email
// -----------------------------
const sendReminderEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        });
        console.log(`✅ Email sent to ${to}`);
    } catch (err) {
        console.error("❌ Error sending email:", err);
    }
};

// -----------------------------
// Export sendReminderEmail function
// -----------------------------
module.exports = sendReminderEmail;
