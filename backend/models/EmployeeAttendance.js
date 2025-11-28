const mongoose = require('mongoose');

const EmployeeAttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // This links to the Employee model
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half-day'],
    required: true,
  },
  hoursWorked: {
    type: Number,
    default: 0,
  },
  markedBy: { // Optional: You can track which manager marked the attendance
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
  }
}, { timestamps: true });

// To prevent duplicate records for the same employee on the same day
EmployeeAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeAttendance', EmployeeAttendanceSchema);