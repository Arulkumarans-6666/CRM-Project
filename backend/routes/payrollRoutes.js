const express = require("express");
const router = express.Router();
const Manager = require("../models/Manager");
const Attendance = require("../models/Attendance");

// Generate payroll for manager
router.get("/manager/:id/:year/:month", async (req, res) => {
  const { id, year, month } = req.params;

  try {
    const manager = await Manager.findById(id);
    if (!manager) return res.status(404).json({ msg: "Manager not found" });

    const attendance = await Attendance.find({
      managerId: id,
      date: {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0)
      }
    });

    const totalDays = new Date(year, month, 0).getDate();
    const presentDays = attendance.filter(a => a.status === "Present").length;
    const leaveDays = attendance.filter(a => a.status === "Leave").length;
    const absentDays = totalDays - (presentDays + leaveDays);

    const dailySalary = manager.baseSalary / totalDays;
    const leaveDeduction = absentDays * dailySalary;

    const pfAmount = (manager.baseSalary * 12) / 100;
    const esiAmount = (manager.baseSalary * 0.75) / 100;

    const netSalary = manager.baseSalary - (pfAmount + esiAmount + leaveDeduction);

    res.json({
      name: manager.name,
      baseSalary: manager.baseSalary,
      presentDays,
      leaveDays,
      absentDays,
      pfAmount,
      esiAmount,
      leaveDeduction,
      netSalary
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
