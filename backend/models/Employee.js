const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Half-day'], required: true },
  hoursWorked: { type: Number, default: 0 }
});

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  dob: String,
  gender: String,
  aadhar: String,
  experience: Number,
  shift: String,
  
  // ✨ THIS IS THE ONLY CHANGE IN THIS FILE ✨
  // We removed default: 20800
  baseSalary: { type: Number, required: true }, 

  // This is no longer used, as we have a separate EmployeeAttendance model
  // attendance: [attendanceRecordSchema] 
});

module.exports = mongoose.model('Employee', employeeSchema);