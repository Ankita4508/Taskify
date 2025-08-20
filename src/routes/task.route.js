const express = require('express');
const Task = require('../models/Task');
const { authGuard } = require('../middleware/auth');
const router = express.Router();

// -----------------------------
// CREATE task
// -----------------------------
router.post('/', authGuard, async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    // Use defaults if missing (for voice bot)
    const task = new Task({ 
      title,
      description: description || "", // default empty string
      priority: priority || "Low",    // default Low
      dueDate: dueDate ? new Date(dueDate) : new Date(), // default to today
      user: req.user.id
    });

    await task.save();
    res.status(201).json(task); // send the saved task
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// READ all tasks
// -----------------------------
router.get('/', authGuard, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// READ single task
// -----------------------------
router.get('/:id', authGuard, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// UPDATE task
// -----------------------------
router.put('/:id', authGuard, async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        title,
        description: description || "",
        priority: priority || "Low",
        dueDate: dueDate ? new Date(dueDate) : new Date()
      },
      { new: true }
    );

    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------
// DELETE task
// -----------------------------
router.delete('/:id', authGuard, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
