const app = require("./app");
const { connectDB } = require("./config/db");
const { env } = require("./config/env");
const { reapStaleCalls } = require("./controllers/call.controller");

const start = async () => {
  try {
    await connectDB();

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });

    // Settles calls that never got a proper end signal (unanswered invite,
    // or a webhook that never arrived) — see call.controller.js for details.
    setInterval(() => {
      reapStaleCalls().catch((err) => console.error("reapStaleCalls failed:", err));
    }, 60 * 1000);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
