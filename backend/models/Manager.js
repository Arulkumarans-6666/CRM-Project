const mongoose = require("mongoose");

const ManagerSchema = new mongoose.Schema({
  managerId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  password: String,
  dob: Date,
  gender: String,
  aadhar: String,
  shift: String,
  experience: Number,
  baseSalary: Number,

  // ⚡ NEW PAYROLL FIELDS
  pfEnabled: { type: Boolean, default: true },
  esiEnabled: { type: Boolean, default: true },
  pfPercent: { type: Number, default: 12 },   // 12% Employee PF
  esiPercent: { type: Number, default: 0.75 } // 0.75% Employee ESI
});

module.exports = mongoose.model("Manager", ManagerSchema);
