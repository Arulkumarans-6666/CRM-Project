const Attendance = require("../models/Attendance");

// ➕ Add attendance
exports.addAttendance = async (req, res) => {
  try {
    const { managerId, date, status, hoursWorked } = req.body;

    const newRecord = new Attendance({
      managerId,
      date,
      status,
      hoursWorked,
    });

    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (err) {
    console.error("❌ Error adding attendance:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📃 Get all attendance records
exports.getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📅 Get attendance by managerId
exports.getAttendanceByManagerId = async (req, res) => {
  try {
    const { mid } = req.params;
    const records = await Attendance.find({ managerId: mid }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✏️ Update attendance
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status, hoursWorked } = req.body;

    const updated = await Attendance.findByIdAndUpdate(
      id,
      { date, status, hoursWorked },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ❌ Delete attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json({ message: "Attendance deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
