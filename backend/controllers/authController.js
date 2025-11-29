// backend/controllers/authController.js

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ---------------- REGISTER ----------------
// (Register function la entha maathramum illa, apdiye irukkattum)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, shift } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      shift,
    });
    await user.save();
    res.status(201).json({ msg: "User registered successfully", user });
  } catch (err) {
    console.error("❌ Register Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};


// ---------------- LOGIN ----------------
// (Intha login function la thaan namma changes pannirukom)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("--- 🧾 New Login Attempt Received ---");
    
    // STEP 1: Find user by email
    console.log("STEP 1: Searching for user in database...");
    console.time("DATABASE_USER_SEARCH_TIME"); // Timer starts
    const user = await User.findOne({ email });
    console.timeEnd("DATABASE_USER_SEARCH_TIME"); // Timer ends and prints time

    if (!user) {
      console.log("❌ User not found with that email.");
      return res.status(404).json({ msg: "User not found" });
    }
    console.log("✅ User found:", user.email);

    // STEP 2: Compare passwords
    console.log("STEP 2: Comparing password...");
    console.time("BCRYPT_PASSWORD_COMPARE_TIME"); // Timer starts
    const isMatch = await bcrypt.compare(password, user.password);
    console.timeEnd("BCRYPT_PASSWORD_COMPARE_TIME"); // Timer ends and prints time

    if (!isMatch) {
      console.log("❌ Password does not match.");
      return res.status(401).json({ msg: "Invalid credentials" });
    }
    console.log("✅ Password matched successfully.");

    // STEP 3: Generate JWT
    console.log("STEP 3: Generating JWT token...");
    if (!process.env.JWT_SECRET) {
      console.error("❌ CRITICAL: Missing JWT_SECRET in .env file!");
      return res.status(500).json({ msg: "Server misconfiguration" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role, shift: user.shift },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("✅ JWT Token Generated.");
    
    console.log("--- ✅ Login Success! Sending response to user. ---");
    res.json({ token, user });

  } catch (err) {
    console.error("❌❌❌ UNEXPECTED LOGIN ERROR ❌❌❌:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};