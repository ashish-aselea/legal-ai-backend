const { User } = require("../models/User");

// Atomic conditional decrement — never lets a balance go negative, and safe
// under concurrent debits against the same wallet (e.g. two tabs, or a
// booking and a call billing tick landing at the same moment).
const debitWallet = async (userId, amount) => {
  const user = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true }
  );
  return { success: !!user, balance: user ? user.walletBalance : null };
};

const getWalletBalance = async (userId) => {
  const user = await User.findById(userId).select("walletBalance");
  return user ? user.walletBalance : 0;
};

module.exports = { debitWallet, getWalletBalance };
