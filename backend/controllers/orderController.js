const Stack = require('../models/Stack');
const Order = require('../models/Order');

exports.addOrder = async (req, res) => {
  try {
    const { material, qty, pricePerUnit, type } = req.body;

    // save order
    const order = new Order({ material, qty, pricePerUnit, type });
    await order.save();

    // update stack
    let stack = await Stack.findOne({ material });
    if (!stack) {
      // if no stack, maybe return error or create automatically
      return res.status(404).json({ message: 'Stack not found' });
    }
    if (type === 'in') {
      stack.totalQty += qty;
      stack.remainingQty += qty;
    } else if (type === 'out') {
      stack.usedQty += qty;
      stack.remainingQty -= qty;
    }
    stack.lastUpdated = new Date();
    await stack.save();

    res.status(201).json({ order, stack });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
