const mongoose = require("mongoose");

const OfficialLeaveSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  reason: { type: String, required: true },
});

module.exports = mongoose.model("OfficialLeave", OfficialLeaveSchema);
