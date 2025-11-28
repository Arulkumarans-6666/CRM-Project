// controllers/stackController.js
const Stack = require("../models/Stack");
const ExcelJS = require("exceljs");

// GET all stacks
exports.getAllStacks = async (req, res) => {
  try {
    const stacks = await Stack.find();
    res.json(stacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single stack by id
exports.getStackById = async (req, res) => {
  try {
    const { id } = req.params;
    const stack = await Stack.findById(id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });
    res.json(stack);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST add new stack
exports.addStack = async (req, res) => {
  try {
    const { stackId, material, totalQty, unit } = req.body;
    const newStack = new Stack({ stackId, material, totalQty, unit });
    await newStack.save();
    res.status(201).json(newStack);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE stack
exports.deleteStack = async (req, res) => {
  try {
    const { id } = req.params;
    await Stack.findByIdAndDelete(id);
    res.json({ message: "Stack deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update daily price
exports.updatePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    const stack = await Stack.findById(id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });

    stack.priceHistory.push({ price, date: new Date() });
    await stack.save();
    res.json(stack);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST add an order
exports.addOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { buyer, qty, advancePaid = 0, gstRate = 0 } = req.body;

    if (!buyer || typeof qty !== "number") {
      return res.status(400).json({ error: "Buyer and qty required" });
    }

    const stack = await Stack.findById(id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });

    const remaining = stack.totalQty - stack.usedQty;
    if (qty > remaining) {
      return res.status(400).json({ error: `Not enough stock. Remaining: ${remaining}` });
    }

    // get latest price
    const lastPriceObj = stack.priceHistory[stack.priceHistory.length - 1];
    const pricePerUnit = lastPriceObj ? lastPriceObj.price : 0;

    const totalValue = qty * pricePerUnit;
    const gstAmount = (totalValue * gstRate) / 100;
    const advance = advancePaid;
    const balance = totalValue + gstAmount - advance;

    const orderObj = {
      buyer,
      qty,
      pricePerUnit,
      totalValue,
      gstRate,
      gstAmount,
      advancePaid: advance,
      balance,
      date: new Date(),
    };

    stack.orders.push(orderObj);
    stack.usedQty += qty;
    await stack.save();

    res.json(stack);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET export orders as Excel
exports.exportOrdersExcel = async (req, res) => {
  try {
    const { id } = req.params;
    const stack = await Stack.findById(id);
    if (!stack) return res.status(404).json({ error: "Stack not found" });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    worksheet.columns = [
      { header: "Buyer", key: "buyer", width: 20 },
      { header: "Quantity", key: "qty", width: 10 },
      { header: "Price Per Unit", key: "pricePerUnit", width: 15 },
      { header: "Total Value", key: "totalValue", width: 15 },
      { header: "GST Rate (%)", key: "gstRate", width: 10 },
      { header: "GST Amount", key: "gstAmount", width: 15 },
      { header: "Advance Paid", key: "advancePaid", width: 15 },
      { header: "Balance", key: "balance", width: 15 },
      { header: "Date", key: "date", width: 20 },
    ];

    stack.orders.forEach((order) => {
      worksheet.addRow({
        buyer: order.buyer,
        qty: order.qty,
        pricePerUnit: order.pricePerUnit,
        totalValue: order.totalValue,
        gstRate: order.gstRate,
        gstAmount: order.gstAmount,
        advancePaid: order.advancePaid,
        balance: order.balance,
        date: order.date.toLocaleString(),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${stack.material}_orders.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


