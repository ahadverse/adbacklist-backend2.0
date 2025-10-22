const { Posts } = require("../models");

exports.updateDataStatus = async () => {
  try {
    const products = await Posts.find({
      isDelete: false,
      premiumDay: { $gt: 0 },
    }).select("name premiumDay isPremium");

    await Promise.all(
      products.map(async (product) => {
        product.premiumDay = product.premiumDay - 24;

        if (product.premiumDay <= 0) {
          product.premiumDay = 0;
          product.isPremium = false;
        }

        await product.save();
      })
    );

    console.log("Premium day update completed successfully.");
  } catch (err) {
    console.error("Error updating product status:", err);
  }
};
