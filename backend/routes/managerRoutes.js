const express = require("express");
const router = express.Router();
const Manager = require("../models/Manager");
const Attendance = require("../models/Attendance");
const bcrypt = require("bcryptjs");
const auth = require('../middleware/authMiddleware');

// ===================== CHATBOT ROUTE =====================
/// ✅ CHATBOT ROUTES (Place these before dynamic /:id routes)
router.get("/count", auth, async (req, res) => {
    try {
        const count = await Manager.countDocuments();
        res.json({ count });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.get("/find/by-name/:name", auth, async (req, res) => {
    try {
        const managers = await Manager.find({ name: { $regex: new RegExp(req.params.name, "i") } });
        if (!managers || managers.length === 0) return res.status(404).json({ msg: 'Manager not found' });
        res.json(managers);
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});
// ✅ END CHATBOT ROUTES

// ===================== MANAGER-SPECIFIC ROUTES =====================

// GET logged-in manager's details (Fixes Dashboard Error)
router.get("/me", auth, async (req, res) => {
    try {
        const manager = await Manager.findById(req.user.id).select("-password");
        if (!manager) {
            return res.status(404).json({ msg: "Manager not found" });
        }
        res.json(manager);
    } catch (err) {
        console.error("❌ ERROR fetching /api/managers/me:", err); 
        res.status(500).send("Server Error");
    }
});

// ===================== MANAGER CRUD (for Admin use) =====================

// POST Add Manager
router.post("/", auth, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = new Manager({ ...rest, password: hashedPassword });
    await newManager.save();
    res.status(201).json(newManager);
  } catch (err) {
    console.error("❌ Error saving manager:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all managers
router.get("/", auth, async (req, res) => {
  try {
    const managers = await Manager.find();
    res.json(managers);
  } catch (err) {
    console.error("❌ Error fetching all managers:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET manager by MongoDB `_id`
router.get("/:id", auth, async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ msg: "Manager not found by _id" });
    }
    res.json(manager);
  } catch (err) {
    console.error("❌ Error fetching manager by _id:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT Update manager
router.put("/:id", auth, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    let updateData = { ...rest };
    if (password && password !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const updatedManager = await Manager.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedManager);
  } catch (err) {
    console.error("❌ Error updating manager:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE manager
router.delete("/:id", auth, async (req, res) => {
  try {
    await Manager.findByIdAndDelete(req.params.id);
    res.json({ msg: "Manager deleted" });
  } catch (err) {
    console.error("❌ Error deleting manager:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===================== OLD ATTENDANCE ROUTES (for Admin to mark Manager attendance) =====================

// POST Add attendance
router.post("/attendance/:mid", auth, async (req, res) => {
  try {
    const { date, status, hoursWorked } = req.body;
    const newRecord = new Attendance({ managerId: req.params.mid, date, status, hoursWorked });
    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (err) {
    console.error("❌ Error adding attendance:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET attendance by managerId
router.get("/attendance/:mid", auth, async (req, res) => {
  try {
    const records = await Attendance.find({ managerId: req.params.mid }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET attendance by managerId (Alias route for consistency)
router.get("/attendance/byManagerId/:mid", auth, async (req, res) => {
  try {
    const records = await Attendance.find({ managerId: req.params.mid }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    console.error("❌ Error fetching attendance (alias):", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT Update attendance
router.put("/attendance/update/:attendanceId", auth, async (req, res) => {
  try {
    const { date, status, hoursWorked } = req.body;
    const updated = await Attendance.findByIdAndUpdate(
      req.params.attendanceId,
      { date, status, hoursWorked },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ msg: "Attendance not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating attendance:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE attendance
router.delete("/attendance/delete/:attendanceId", auth, async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.attendanceId);
    if (!deleted) {
      return res.status(404).json({ msg: "Attendance not found" });
    }
    res.json({ msg: "Attendance deleted" });
  } catch (err) {
    console.error("❌ Error deleting attendance:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;