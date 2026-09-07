const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// GET /api/v1/health
router.get("/health", (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const dbState = dbStates[mongoose.connection.readyState] || "unknown";

  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbState,
  });
});

module.exports = router;
