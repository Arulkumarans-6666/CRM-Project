// models/Stack.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  qty: { type: Number, required: true },
  date: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyer: String,
  qty: Number,
  pricePerUnit: Number,
  totalValue: Number,
  gstRate: Number,
  gstAmount: Number,
  advancePaid: { type: Number, default: 0 }, // legacy / initial advance
  balance: Number,
  date: { type: Date, default: Date.now },

  // NEW:
  payments: [paymentSchema],    // subsequent payments
  deliveries: [deliverySchema],// partial delivery records
});

const priceSchema = new mongoose.Schema({
  price: Number,
  gstRate: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
});

const stackSchema = new mongoose.Schema({
  stackId: { type: String, required: true, unique: true },
  material: { type: String, required: true },
  totalQty: { type: Number, required: true },
  usedQty: { type: Number, default: 0 }, // kept for backward compatibility
  unit: { type: String, required: true },
  orders: [orderSchema],
  priceHistory: [priceSchema],

  // Optional invoice fields
  customerName: { type: String },
  state: { type: String },
  stateCode: { type: String },
  orderNo: { type: String },
  dcNo: { type: String },
  recipientCode: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Stack", stackSchema);