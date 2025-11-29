const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// FINAL CORS CONFIG
const allowedOrigins = [
  "https://cement-project-five.vercel.app",  // main live frontend
  "http://localhost:5173",                   // local frontend
  "http://127.0.0.1:5173"                    // local fallback
];

const corsOptions = {
  origin: function (origin, callback) {
    const vercelPreviewRegex = /^https:\/\/cement-project-.*\.vercel\.app$/;

    if (
      !origin ||                           // Postman / Mobile apps
      allowedOrigins.includes(origin) ||   // exact allowed origins
      vercelPreviewRegex.test(origin)      // all preview builds
    ) {
      callback(null, true);
    } else {
      console.error("❌ CORS Blocked ->", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
const payrollRoutes = require("./routes/payrollRoutes");
app.use("/api/payroll", payrollRoutes);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/managers", require("./routes/managerRoutes"));
app.use("/api/stacks", require("./routes/stackRoutes"));
app.use("/api/purchases", require("./routes/purchaseRoutes"));
app.use("/api/salary", require("./routes/salaryRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/employee-attendance", require("./routes/employeeAttendanceRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
