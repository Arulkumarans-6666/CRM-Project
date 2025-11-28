const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Manager = require("../models/Manager");
const ExcelJS = require("exceljs");
const OfficialLeave = require("../models/OfficialLeave");

// ✅ Get attendance by managerId (fix for ManagerDetails.jsx)
router.get("/byManagerId/:managerId", async (req, res) => {
  try {
    const { managerId } = req.params;

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ error: "Invalid managerId" });
    }

    const records = await Attendance.find({ managerId })
      .populate("managerId", "name email phone salary") // manager details
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Helper: calculate working days (remove Sundays + 2nd & 4th Saturdays)
function getWorkingDays(year, month) {
  let workingDays = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const day = date.getDay(); // 0=Sun, 6=Sat

    if (day === 0) continue; // skip Sundays
    if (day === 6) {
      // check 2nd & 4th Saturday
      const weekNum = Math.ceil(d / 7);
      if (weekNum === 2 || weekNum === 4) continue;
    }

    workingDays.push(date.toISOString().split("T")[0]);
  }
  return workingDays;
}

// ✅ Mark attendance (any date allowed)
router.post("/mark", async (req, res) => {
  try {
    const { managerId, date, status, hoursWorked } = req.body;
    const inputDate = new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD

    let record = await Attendance.findOne({ managerId, date: inputDate });
    if (record) {
      record.status = status;
      record.hoursWorked = hoursWorked;
      await record.save();
    } else {
      record = new Attendance({ managerId, date: inputDate, status, hoursWorked });
      await record.save();
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get monthly attendance
router.get("/monthly/:managerId/:year/:month", async (req, res) => {
  try {
    const { managerId, year, month } = req.params;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const records = await Attendance.find({
      managerId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Download Excel Salary Report for one manager
router.get("/report/:managerId/:year/:month", async (req, res) => {
  try {
    const { managerId, year, month } = req.params;
    const manager = await Manager.findById(managerId);
    if (!manager) return res.status(404).json({ msg: "Manager not found" });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const records = await Attendance.find({
      managerId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // 🔥 Salary Calculation
    const workingDays = getWorkingDays(year, month);
    const totalWorkingDays = workingDays.length;
    const perDay = manager.salary / totalWorkingDays;

    let presentDays = 0, leaveDays = 0, totalHours = 0;

    records.forEach(r => {
      if (r.status === "Present") {
        presentDays++;
        totalHours += r.hoursWorked || 0;
      }
      if (r.status === "Leave") {
        leaveDays++;
      }
    });

    const expectedHours = presentDays * 8;
    const leaveSalary = leaveDays * perDay;
    const presentSalary = expectedHours > 0
      ? (presentDays * perDay) * (totalHours / expectedHours)
      : 0;

    const salary = presentSalary + leaveSalary;

    // ✅ Excel Report
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Salary Report");

    sheet.addRow(["Manager Salary Report"]);
    sheet.addRow([`Name: ${manager.name}`]);
    sheet.addRow([`Email: ${manager.email}`]);
    sheet.addRow([`Phone: ${manager.phone}`]);
    sheet.addRow([`Manager ID: ${manager.managerId}`]);
    sheet.addRow([`Month: ${month}-${year}`]);
    sheet.addRow([]);
    sheet.addRow(["Date", "Status", "Hours Worked"]);

    records.forEach(r => {
      sheet.addRow([
        new Date(r.date).toLocaleDateString(),
        r.status,
        r.hoursWorked || 0
      ]);
    });

    sheet.addRow([]);
    sheet.addRow([`Working Days: ${totalWorkingDays}`]);
    sheet.addRow([`Present Days: ${presentDays}`]);
    sheet.addRow([`Leave Days: ${leaveDays}`]);
    sheet.addRow([`Worked Hours: ${totalHours}`]);
    sheet.addRow([`Final Salary: ₹${salary.toFixed(2)}`]);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=salary_report.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Add official leave
router.post("/leave", async (req, res) => {
  try {
    const { date, reason } = req.body;
    const leave = new OfficialLeave({ date, reason });
    await leave.save();
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📅 Get official leaves by month
router.get("/leave/:year/:month", async (req, res) => {
  try {
    const { year, month } = req.params;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const leaves = await OfficialLeave.find({
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📜 Get all official leaves (entire history)
router.get("/leave", async (req, res) => {
  try {
    const leaves = await OfficialLeave.find().sort({ date: 1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
