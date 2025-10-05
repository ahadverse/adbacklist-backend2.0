const { Ads } = require("../models");

exports.addAds = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Product added successfully",
  };

  try {
    const newAd = new Ads(body);
    await newAd.save();
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getAds = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links updated successfully",
    data: [],
  };
  try {
    const ads = await Ads.find({}).sort({ createdAt: -1 });

    res.send(ads);
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getAdsbyCategory = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links updated successfully",
    data: {},
  };

  const category = req.query.category;

  try {
    const ads = await Ads.find({ category: category })
      .sort({ _id: -1 })
      .limit(5);

    res.status(200).json({ ads });
  } catch (error) {
    res.send(error);
  }
};

exports.updateAds = async (updateFields) => {
  const response = {
    code: 200,
    status: "success",
    message: "Links updated successfully",
    data: {},
  };

  try {
    const { id, ...data } = updateFields;
    const result = await Ads.findByIdAndUpdate(
      {
        _id: id,
      },
      data,
      {
        new: true,
      }
    );

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteAds = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete Product successfully",
  };

  try {
    const ads = await Ads.findByIdAndDelete({
      _id: id,
    });

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteMany = async (req, res) => {
  const ids = req.body;
  try {
    await Ads.deleteMany(
      {
        _id: {
          $in: ids,
        },
      },
      function (err, result) {
        if (err) {
          res.json(err);
        } else {
          res.json(result);
        }
      }
    );

    res
      .status(200)
      .json({ status: "success", message: "Deleted successfully" });
  } catch (e) {
    console.log(e);
    // res.status(500).json({ message: "Something went wrong in /edit-order" });
  }
};