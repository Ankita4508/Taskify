const cron = require("node-cron");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const sendReminderEmail = require("../utils/mailer");
require("dotenv").config();

// -----------------------------
// Connect to MongoDB
// -----------------------------
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Scheduler connected to MongoDB"))
.catch(err => console.error("❌ Scheduler MongoDB connection error:", err));

// -----------------------------
// Cron job: Run every day at 8 AM
// -----------------------------
cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Running task reminder scheduler...");

    // Calculate tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const start = new Date(tomorrow.setHours(0, 0, 0, 0));
    const end = new Date(tomorrow.setHours(23, 59, 59, 999));

    try {
        // Find tasks due tomorrow where reminder has not been sent
        const tasks = await Task.find({
            dueDate: { $gte: start, $lte: end },
            reminderSent: false
        }).populate("user");

        // Send reminder emails
        for (let task of tasks) {
            const message = `Hi ${task.user.name},\n\nThis is a gentle reminder that your task "${task.title}" is due tomorrow.\n\nBest,\nTask Manager`;

            await sendReminderEmail(task.user.email, "Task Reminder", message);

            // Mark reminder as sent
            task.reminderSent = true;
            await task.save();
        }

        console.log(`✅ ${tasks.length} reminder(s) sent.`);
    } catch (err) {
        console.error("❌ Error in sending reminders:", err);
    }
});
