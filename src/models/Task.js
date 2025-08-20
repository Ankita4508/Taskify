const mongoose = require('mongoose');

// -----------------------------
// Task Schema
// -----------------------------
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" }, // Default empty description
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  dueDate: { type: Date, default: Date.now }, // Default to today's date if not provided
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Track if reminder email has been sent
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

// -----------------------------
// Export Task Model
// -----------------------------
module.exports = mongoose.model('Task', taskSchema);
