const bcrypt = require("bcryptjs");
const Manager = require("../models/Manager");

// 📃 Get all managers
exports.getManagers = async (req, res) => {
  try {
    const managers = await Manager.find();
    res.json(managers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➕ Create new manager
exports.createManager = async (req, res) => {
  try {
    const { managerId, name, email, password, dob, gender, aadhar, shift, experience, baseSalary } = req.body;

    const existing = await Manager.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = new Manager({
      managerId,
      name,
      email,
      password: hashedPassword,
      dob,
      gender,
      aadhar,
      shift,
      experience,
      baseSalary,
    });

    await manager.save();
    res.status(201).json(manager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✏️ Update manager
exports.updateManager = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const manager = await Manager.findByIdAndUpdate(id, updates, { new: true });
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.json(manager);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ❌ Delete manager
exports.deleteManager = async (req, res) => {
  try {
    const { id } = req.params;
    const manager = await Manager.findByIdAndDelete(id);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    res.json({ message: "Manager deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
