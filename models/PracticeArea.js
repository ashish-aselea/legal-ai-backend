const mongoose = require("mongoose");

const practiceAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    // Deactivated instead of deleted so existing lawyer records that already
    // reference this value (stored as plain text, not a foreign key) stay valid.
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const PracticeArea = mongoose.model("PracticeArea", practiceAreaSchema);

module.exports = { PracticeArea };
