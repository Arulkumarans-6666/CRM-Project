// backend/routes/chatbotRoutes.js

const express = require("express");
const router = express.Router();
const Manager = require("../models/Manager"); // Import the Manager model

// This is the special route that Chatbase will call
// Example URL: /api/chatbot/get-manager-details/Saran
router.get("/get-manager-details/:name", async (req, res) => {
  try {
    const managerName = req.params.name;

    // Search the database for a manager with that name (case-insensitive)
    const manager = await Manager.findOne({
      name: { $regex: new RegExp(`^${managerName}$`, "i") },
    });

    if (!manager) {
      // If no manager is found, send this reply
      return res.status(404).json({
        reply: `Sorry, I couldn't find any manager named '${managerName}'.`,
      });
    }

    // If a manager is found, create a helpful reply message
    const replyMessage = `Here are the live details for ${manager.name}:
• **Email:** ${manager.email}
• **Shift:** ${manager.shift}
• **Experience:** ${manager.experience} years
• **Base Salary:** ₹${manager.baseSalary.toLocaleString('en-IN')}`;

    // Send the reply back to Chatbase
    res.json({
      reply: replyMessage,
    });

  } catch (error) {
    console.error("Chatbot API Error:", error);
    res.status(500).json({
      reply: "Sorry, something went wrong while getting the details.",
    });
  }
});

module.exports = router;