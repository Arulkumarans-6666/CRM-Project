const express = require("express");
const router = express.Router();
const Stack = require("../models/Stack");

// ➡️ Add new stack
router.post("/", async (req, res) => {
  try {
    const { stackId, material, totalQty, unit } = req.body;
    const newStack = new Stack({
      stackId,
      material,
      totalQty,
      usedQty: 0,
      unit,
      orders: [],
    });
    await newStack.save();
    res.json(newStack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ➡️ Get all stacks
router.get("/", async (req, res) => {
  try {
    const stacks = await Stack.find();
    res.json(stacks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ➡️ Add order to stack
router.post("/:id/orders", async (req, res) => {
  try {
    const { customerName, qty } = req.body;
    const stack = await Stack.findById(req.params.id);

    if (!stack) {
      return res.status(404).json({ error: "Stack not found" });
    }

    if (qty > stack.totalQty - stack.usedQty) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    // Add order
    stack.orders.push({ customerName, qty, date: new Date() });
    stack.usedQty += qty;

    await stack.save();
    res.json(stack);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
