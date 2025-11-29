const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Manager" },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Absent", "Leave"], required: true },
  hoursWorked: { type: Number, default: 0 },
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
