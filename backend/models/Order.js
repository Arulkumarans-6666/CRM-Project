const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  material: { type: String, required: true },
  qty: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  totalValue: Number,
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['in','out'], required: true }  // in = add, out = usage
});

orderSchema.pre('save', function(next) {
  this.totalValue = this.qty * this.pricePerUnit;
  next();
});

module.exports = mongoose.model('Order', orderSchema);
