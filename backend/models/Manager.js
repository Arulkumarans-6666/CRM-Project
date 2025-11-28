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
  baseSalary: Number, // e.g., 40000
});

module.exports = mongoose.model("Manager", ManagerSchema);
