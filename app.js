const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const lawyerRoutes = require("./routes/lawyer.routes");
const bookingRoutes = require("./routes/booking.routes");
const practiceAreaRoutes = require("./routes/practiceArea.routes");
const workingHoursRoutes = require("./routes/workingHours.routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/lawyers", lawyerRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/practice-areas", practiceAreaRoutes);
app.use("/api/v1/working-hours", workingHoursRoutes);

// 404 + error handling (must stay last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
