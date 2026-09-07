const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { User, USER_ROLES } = require("../models/User");

const run = async () => {
  const mobile = process.argv[2];
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    console.error('Usage: npm run create:admin -- <10-digit-mobile> "Admin Name"');
    process.exit(1);
  }

  await connectDB();

  const admin = await User.findOneAndUpdate(
    { mobile },
    {
      mobile,
      role: USER_ROLES.ADMIN,
      name: process.argv[3] || "Admin",
      isProfileComplete: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin ready: ${admin.mobile} (${admin._id})`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
