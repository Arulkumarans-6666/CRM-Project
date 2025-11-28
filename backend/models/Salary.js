const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  month: String,
  baseSalary: Number,
  workedDays: Number,
  totalSalary: Number
});

module.exports = mongoose.model('Salary', salarySchema);
