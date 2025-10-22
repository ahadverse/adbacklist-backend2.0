const express = require("express");
const { Posts, Blogs, User, Transactions } = require("../models");
const verifyAdmin = require("../middleware/adminCheck");
const router = express.Router();

router.get("/", verifyAdmin, async (req, res) => {
  try {
    // 🕒 Define once
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 🧠 Run all independent queries in parallel
    const [
      allProducts,
      allPremiumProducts,
      todayPost,
      allBlogs,
      allUsers,
      allCreditsAgg,
      allTodayTrans,
      todayTransAmountAgg,
      totalTransctionCreditsAgg,
      monthlySalesAgg,
    ] = await Promise.all([
      // count total posts
      Posts.countDocuments({}),

      // count premium posts
      Posts.countDocuments({ isPremium: true }),

      // today's posts
      Posts.countDocuments({ createdAt: { $gte: today } }),

      // blogs
      Blogs.countDocuments({}),

      // users
      User.countDocuments({}),

      // total credits
      User.aggregate([
        { $group: { _id: null, totalCredits: { $sum: "$credit" } } },
      ]),

      // today's transactions
      Transactions.countDocuments({ createdAt: { $gte: today } }),

      // today's transaction total
      Transactions.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, totalCredits: { $sum: "$amount" } } },
      ]),

      // total transaction credits
      Transactions.aggregate([
        { $group: { _id: null, totalCredits: { $sum: "$amount" } } },
      ]),

      // monthly sales chart
      Transactions.aggregate([
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const monthlySalesData = Array(12).fill(0);
    monthlySalesAgg.forEach((m) => {
      monthlySalesData[m._id - 1] = m.total;
    });

    const data = {
      allPost: allProducts,
      premiumPost: allPremiumProducts,
      today: todayPost,
      allBlogs,
      allCredits: allCreditsAgg[0]?.totalCredits || 0,
      allUsers,
      transactionsChart: monthlySalesData,
      allTodayTrans,
      todayTransAmount: todayTransAmountAgg[0]?.totalCredits || 0,
      totalTransctions: totalTransctionCreditsAgg[0]?.totalCredits || 0,
    };

    res.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
