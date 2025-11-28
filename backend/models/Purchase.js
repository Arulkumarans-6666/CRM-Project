// models/Purchase.js
const mongoose = require("mongoose");

const paymentMadeSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
}, { _id: false });

const deliveryReceivedSchema = new mongoose.Schema({
  qty: { type: Number, required: true },
  date: { type: Date, default: Date.now },
}, { _id: false });

const usageLogSchema = new mongoose.Schema({
    usedQty: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const purchaseOrderSchema = new mongoose.Schema({
  orderedQty: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  totalValue: Number,
  gstRate: { type: Number, default: 0 },
  gstAmount: Number,
  advancePaid: { type: Number, default: 0 },
  orderDate: { type: Date, default: Date.now },
  payments: [paymentMadeSchema],
  deliveriesReceived: [deliveryReceivedSchema],
});

// ✅ Intha block ore oru thadava thaan irukanum
const purchaseSchema = new mongoose.Schema({
  materialName: { type: String, required: true },
  supplierName: { type: String, required: true },
  unit: { type: String, required: true },
  purchaseOrders: [purchaseOrderSchema],
  usageLogs: [usageLogSchema],
  lowStockThreshold: { type: Number, default: 10 },
  lowStockAlertSent: { type: Boolean, default: false },
}, { timestamps: true });

purchaseSchema.index({ materialName: 1, supplierName: 1 }, { unique: true });

module.exports = mongoose.model("Purchase", purchaseSchema);