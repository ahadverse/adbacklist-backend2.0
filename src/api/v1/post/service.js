const { default: mongoose } = require("mongoose");
const { User, Responsive, Rainbow, Posts } = require("../models");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const bucket_Name = process.env.BUCKET_NAME;
const bucket_Region = process.env.BUCKET_REGION;
const access_Key = process.env.ACCESS_KEY;
const secret_Access = process.env.SECRET_ACCESS;

const s3 = new S3Client({
  credentials: {
    accessKeyId: access_Key,
    secretAccessKey: secret_Access,
  },
  region: bucket_Region,
});

const moment = require("moment/moment");

// for today
const startOfDay = moment().startOf("day");
const endOfDay = moment().endOf("day");
// for yesterday
const today = moment();
const yesterday = moment().subtract(1, "days");

// last 3 days
const threeDaysAgo = moment().subtract(2, "days");
// last 7 days
const sevenDaysAgo = moment().subtract(6, "days");
// for this month
const startOfMonth = moment().startOf("month");
const endOfMonth = moment().endOf("month");
// last month
const currentMonthStartDate = moment().startOf("month");
const lastMonthStartDate = moment(currentMonthStartDate)
  .subtract(1, "months")
  .startOf("month");
// last 6 month
const sixMonthsAgo = moment().subtract(6, "months");

// this year
const startOfYear = moment().startOf("year");
const endOfYear = moment().endOf("year");
// last year
const startOfPreviousYear = moment().subtract(1, "year").startOf("year");
const endOfPreviousYear = moment().subtract(1, "year").endOf("year");

exports.getApprovedService = async ({
  page,
  cat,
  subCat,
  date,
  searchText,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Posts list successfully",
    data: {},
    totalPost: 0,
    startIndex: 0,
  };

  const regex = new RegExp(cat, "i");
  const subRegex = new RegExp(subCat, "i");

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 10;
    const skipCount = (pageNumber - 1) * limit;

    let newDate;
    if (date == "today") {
      newDate = {
        $gte: startOfDay.toDate(),
        $lte: endOfDay.toDate(),
      };
    }
    if (date == "yesterday") {
      newDate = {
        $gte: yesterday.startOf("day").toDate(),
        $lt: today.startOf("day").toDate(),
      };
    }
    if (date == "last3days") {
      newDate = {
        $gte: threeDaysAgo.startOf("day").toDate(),
      };
    }
    if (date == "last3days") {
      newDate = {
        $gte: sevenDaysAgo.startOf("day").toDate(),
      };
    }

    if (date == "thismonth") {
      newDate = {
        $gte: startOfMonth.toDate(),
        $lte: endOfMonth.toDate(),
      };
    }
    if (date == "lastmonth") {
      newDate = {
        $gte: lastMonthStartDate.toDate(),
        $lt: currentMonthStartDate.toDate(),
      };
    }
    if (date == "last6month") {
      newDate = {
        $gte: sixMonthsAgo.toDate(),
        $lt: today.startOf("day").toDate(),
      };
    }
    if (date == "thisYear") {
      newDate = {
        $gte: startOfYear.toDate(),
        $lt: endOfYear.startOf("day").toDate(),
      };
    }
    if (date == "lastYear") {
      newDate = {
        $gte: startOfPreviousYear.toDate(),
        $lt: endOfPreviousYear.startOf("day").toDate(),
      };
    }

    const userData = await User.findOne({ email: searchText });
    const user = userData?._id?.toString();

    let forPage = {};

    if (cat && subCat && newDate && searchText) {
      forPage = {
        category: regex,
        subCategory: subRegex,
        createdAt: newDate,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (cat && subCat && searchText) {
      forPage = {
        category: regex,
        subCategory: subRegex,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (cat && newDate && searchText) {
      forPage = {
        category: regex,
        createdAt: newDate,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (newDate && subCat && searchText) {
      forPage = {
        createdAt: newDate,
        subCategory: subRegex,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (newDate && searchText) {
      forPage = {
        createdAt: newDate,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (cat && searchText) {
      forPage = {
        category: regex,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (subCat && searchText) {
      forPage = {
        subCategory: subRegex,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (searchText) {
      forPage = { posterId: mongoose.Types.ObjectId(user) };
    } else if (cat && subCat && newDate) {
      forPage = {
        category: regex,
        subCategory: subRegex,
        createdAt: newDate,
      };
    } else if (cat && subCat) {
      forPage = {
        category: regex,
        subCategory: subRegex,
      };
    } else if (cat && newDate) {
      forPage = {
        category: regex,
        createdAt: newDate,
      };
    } else if (newDate && subCat) {
      forPage = {
        createdAt: newDate,
        subCategory: subRegex,
      };
    } else if (newDate) {
      forPage = { createdAt: newDate };
    } else if (cat) {
      forPage = { category: regex };
    } else if (subCat) {
      forPage = { subCategory: subRegex };
    } else {
      forPage = {};
    }

    const matchStage = {};
    if (cat && subCat && newDate && searchText) {
      matchStage.$match = {
        category: regex,
        subCategory: subRegex,
        createdAt: newDate,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (cat && subCat && searchText) {
      matchStage.$match = {
        category: regex,
        subCategory: subRegex,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (cat && newDate && searchText) {
      matchStage.$match = {
        category: regex,
        createdAt: newDate,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (newDate && subCat && searchText) {
      matchStage.$match = {
        createdAt: newDate,
        subCategory: subRegex,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (newDate && searchText) {
      matchStage.$match = {
        createdAt: newDate,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (cat && searchText) {
      matchStage.$match = {
        category: regex,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (subCat && searchText) {
      matchStage.$match = {
        subCategory: subRegex,
        posterId: mongoose.Types.ObjectId(user),
      };
    } else if (searchText) {
      matchStage.$match = { posterId: mongoose.Types.ObjectId(user) };
    } else if (cat && subCat && newDate) {
      matchStage.$match = {
        category: regex,
        subCategory: subRegex,
        createdAt: newDate,
      };
    } else if (cat && subCat) {
      matchStage.$match = {
        category: regex,
        subCategory: subRegex,
      };
    } else if (cat && newDate) {
      matchStage.$match = {
        category: regex,
        createdAt: newDate,
      };
    } else if (newDate && subCat) {
      matchStage.$match = {
        createdAt: newDate,
        subCategory: subRegex,
      };
    } else if (newDate) {
      matchStage.$match = { createdAt: newDate };
    } else if (cat) {
      matchStage.$match = { category: regex };
    } else if (subCat) {
      matchStage.$match = { subCategory: subRegex };
    } else {
      matchStage.$match = {};
    }

    const posts = await Posts.aggregate([
      matchStage,
      {
        $match: {
          isApproved: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      { $skip: skipCount },
      {
        $limit: limit,
      },
      {
        $project: {
          category: 1,
          name: 1,
          subCategory: 1,
          createdAt: 1,
          isPremium: 1,
          cityCount: {
            $cond: {
              if: {
                $and: [
                  { $isArray: "$cities" },
                  { $ne: [{ $size: "$cities" }, 0] },
                ],
              },
              then: { $size: "$cities" },
              else: 0,
            },
          },
        },
      },
    ]);

    response.totalPost = await Posts.find(forPage).countDocuments({});
    response.startIndex = skipCount + 1;
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

// add Postss
exports.addProductService = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Product added successfully",
  };
  try {
    const newProduct = new Posts(body);
    await newProduct.save();
    return response;
  } catch (error) {
    console.error(error);

    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// update Postss
exports.updateProductService = async ({
  id,
  name,
  category,
  subCategory,
  description,
  city,
  cities,
  email,
  phone,
  imgOne,
  imgTwo,
  imgThree,
  imgFour,
  age,
  link,
  isDelete,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  try {
    const product = await Posts.findOne({
      _id: id,
    }).exec();
    if (!product) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Posts data found";
      return response;
    }

    // product.name = name ? name : product.name;
    // product.link = link ? link : product.link;
    // product.age = age ? age : product.age;
    // product.category = category ? category : product.category;
    // product.subCategory = subCategory ? subCategory : product.subCategory;
    // product.description = description ? description : product.description;
    // product.city = city ? city : product.city;
    // product.cities = cities ? cities : product.cities;
    // product.email = email ? email : product.email;
    // product.phone = phone ? phone : product.phone;

    // await product.save();

    // response.data.product = product;
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// update Posts
exports.updateApproveService = async ({ id, isApproved }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  try {
    const product = await Posts.findOne({
      _id: id,
    }).exec();
    if (!product) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Posts data found";
      return response;
    }
    if (isApproved == false) {
      product.isApproved = false;
      await product.save();
      response.data.product = product;
      return response;
    }
    product.isApproved = isApproved ? isApproved : product.isApproved;

    await product.save();
    response.data.product = product;
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.updateApproveMany = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  const data = req.body;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();
    const addCustomerToTheStores = data.map(async (id, index) => {
      await new Promise((resolve) => setTimeout(resolve, index * 500));

      const updatedStore = await Posts.findByIdAndUpdate(
        id,
        { $set: { isApproved: true } },
        { new: true }
      );
    });
    await session.commitTransaction();
    await session.endSession();

    setTimeout(() => {
      res
        .status(200)
        .json({ status: "success", message: "Post updated successfully" });
    }, data.length * 500);
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong in /edit-order" });
  }
};

exports.deleteMany = async (req, res) => {
  const ids = req.body;

  try {
    await Posts.deleteMany(
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

// delete Postss
exports.deleteProductService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Deleted post successfully",
  };

  try {
    const post = await Posts.findOne({ _id: id, isDelete: false });
    if (!post) {
      response.code = 404;
      response.status = "failed";
      response.message = "No post data found";
      return response;
    }

    const getKeyFromUrl = (url) => {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    };

    const deleteParams = {
      Bucket: bucket_Name,
      Delete: {
        Objects: post.images.map((url) => ({ Key: getKeyFromUrl(url) })),
      },
    };

    if (post.images.length > 0) {
      await s3.send(new DeleteObjectsCommand(deleteParams));
    }

    // Delete the post from MongoDB
    await post.deleteOne();

    return response;
  } catch (error) {
    console.error(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get all Postss
exports.getUnApprovedService = async ({ page, size }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Posts list successfully",
    data: {},
    totalPost: 0,
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = size ? parseInt(size) : 10;
    const skipCount = (pageNumber - 1) * limit;

    const products = await Posts.aggregate([
      { $sort: { isPremium: -1, _id: -1 } },
      {
        $match: {
          isApproved: false,
        },
      },
      { $skip: skipCount },
      {
        $limit: limit,
      },

      {
        $lookup: {
          from: "users",
          localField: "posterId",
          foreignField: "_id",
          as: "owner",
        },
      },
    ]);

    if (products.length === 0) {
      response.code = 404;
      response.status = "failded";
      response.message = "No Posts data found";
      return response;
    }

    response.totalPost = await Posts.find({
      isApproved: false,
    }).countDocuments({});

    response.data = {
      products,
    };

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

exports.getPostForSitemap = async () => {
  const response = {
    code: 200,
    status: "success",
    message: "Product added successfully",
    data: {},
  };

  try {
    const posts = await Posts.find({}, "category").limit(30000);
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getPostForSitemapSecond = async () => {
  const response = {
    code: 200,
    status: "success",
    message: "Product added successfully",
    data: {},
  };

  try {
    const posts = await Posts.find({}, "category").skip(30000).limit(30000);
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getPostForSitemapthird = async () => {
  const response = {
    code: 200,
    status: "success",
    message: "Product added successfully",
    data: {},
  };

  try {
    const posts = await Posts.find({}, "category").skip(60000).limit(30000);
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
exports.getPostForSitemapFourth = async () => {
  const response = {
    code: 200,
    status: "success",
    message: "Product added successfully",
    data: {},
  };

  try {
    const posts = await Posts.find({}, "category").skip(90000).limit(30000);
    response.data = posts;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// exports.getAllPosts = async ({ page, category, state, cat }) => {
//   const response = {
//     code: 200,
//     status: "success",
//     message: "Fetch Posts list successfully",
//     data: {},
//     pages: 0,
//   };

//   try {
//     const pageNumber = page ? parseInt(page) : 1;
//     const limit = 35;

//     const matching = {
//       subCategory: {
//         $regex: new RegExp(`^${category}$`, "i"),
//       },
//       cities: {
//         $elemMatch: {
//           $regex: new RegExp(`^${state}$`, "i"),
//         },
//       },
//       isApproved: true,
//     };

//     const totalDocs = await Posts.find(matching).countDocuments({});

//     const products = await Posts.aggregate([
//       { $sort: { isPremium: 1, _id: -1 } },
//       {
//         $match: matching,
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "posterId",
//           foreignField: "_id",
//           as: "owner",
//         },
//       },
//       { $skip: (pageNumber - 1) * limit },
//       { $limit: limit },
//       {
//         $project: {
//           name: 1,
//           _id: 1,
//           createdAt: 1,
//           isPremium: 1,
//           age: 1,
//           imgOne: 1,
//         },
//       },
//     ]);

//     if (products.length === 0) {
//       response.code = 404;
//       response.status = "failded";
//       response.message = "No Posts data found";
//       return response;
//     }
//     response.pages = totalDocs;

//     response.data = {
//       products,
//     };

//     return response;
//   } catch (error) {
//     console.log(error);
//     response.code = 500;
//     response.status = "failed";
//     response.message = "Error. Try again a";
//     return response;
//   }
// };

// get Postss by search
exports.getAllPosts = async ({ page, category, state }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Posts list successfully",
    data: {},
    pages: 0,
    total: 0,
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 35;

    const matching = {
      subCategory: { $regex: new RegExp(`^${category}$`, "i") },
      cities: { $elemMatch: { $regex: new RegExp(`^${state}$`, "i") } },
      isApproved: true,
    };

    // total counts
    const totalPremium = await Posts.countDocuments({
      ...matching,
      isPremium: true,
    });
    const totalFree = await Posts.countDocuments({
      ...matching,
      isPremium: false,
    });
    const totalDocs = totalPremium + totalFree;
    const totalPages = Math.ceil(totalDocs / limit);

    // calculate how many premium and free for this page
    const premiumConsumedBefore = (pageNumber - 1) * limit;

    let premiumToSkip = 0;
    let premiumToTake = 0;
    let freeToSkip = 0;
    let freeToTake = 0;

    if (premiumConsumedBefore < totalPremium) {
      premiumToSkip = premiumConsumedBefore;
      premiumToTake = Math.min(limit, totalPremium - premiumToSkip);
      freeToTake = limit - premiumToTake;
    } else {
      freeToSkip = premiumConsumedBefore - totalPremium;
      freeToTake = limit;
    }

    // fetch premium posts
    let premiumPosts = [];
    if (premiumToTake > 0) {
      premiumPosts = await Posts.find({ ...matching, isPremium: true })
        .sort({ _id: -1 })
        .skip(premiumToSkip)
        .limit(premiumToTake)
        .select({ name: 1, age: 1, images: 1, isPremium: 1 }) // only fetch necessary fields
        .lean();
    }

    // fetch free posts
    let freePosts = [];
    if (freeToTake > 0) {
      freePosts = await Posts.find({ ...matching, isPremium: false })
        .sort({ _id: -1 })
        .skip(freeToSkip)
        .limit(freeToTake)
        .select({ name: 1, age: 1, images: 1, isPremium: 1 })
        .lean();
    }

    // merge and map to required structure (title, age, one image)
    const products = [...premiumPosts, ...freePosts].map((p) => ({
      _id: p._id,
      title: p.name,
      age: p.age,
      isPremium: p.isPremium,
      imgOne: p.images && p.images.length > 0 ? p.images[0] : null,
    }));

    if (products.length === 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Posts data found";
      return response;
    }

    response.total = await Posts.countDocuments({
      ...matching,
      isApproved: true,
    });
    response.pages = totalPages;
    response.data = { products };

    return response;
  } catch (error) {
    console.error(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again later";
    return response;
  }
};

exports.getAllCategoryPost = async ({ page, category, state }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Posts list successfully",
    data: {},
    pages: 0,
    total: 0,
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 35;

    const matching = {
      category: { $regex: new RegExp(`^${category}$`, "i") },
      cities: { $elemMatch: { $regex: new RegExp(`^${state}$`, "i") } },
      isApproved: true,
    };

    // total counts
    const totalPremium = await Posts.countDocuments({
      ...matching,
      isPremium: true,
    });
    const totalFree = await Posts.countDocuments({
      ...matching,
      isPremium: false,
    });
    const totalDocs = totalPremium + totalFree;
    const totalPages = Math.ceil(totalDocs / limit);

    // calculate how many premium and free for this page
    const premiumConsumedBefore = (pageNumber - 1) * limit;

    let premiumToSkip = 0;
    let premiumToTake = 0;
    let freeToSkip = 0;
    let freeToTake = 0;

    if (premiumConsumedBefore < totalPremium) {
      premiumToSkip = premiumConsumedBefore;
      premiumToTake = Math.min(limit, totalPremium - premiumToSkip);
      freeToTake = limit - premiumToTake;
    } else {
      freeToSkip = premiumConsumedBefore - totalPremium;
      freeToTake = limit;
    }

    // fetch premium posts
    let premiumPosts = [];
    if (premiumToTake > 0) {
      premiumPosts = await Posts.find({ ...matching, isPremium: true })
        .sort({ _id: -1 })
        .skip(premiumToSkip)
        .limit(premiumToTake)
        .select({ name: 1, age: 1, images: 1, isPremium: 1 }) // only fetch necessary fields
        .lean();
    }

    // fetch free posts
    let freePosts = [];
    if (freeToTake > 0) {
      freePosts = await Posts.find({ ...matching, isPremium: false })
        .sort({ _id: -1 })
        .skip(freeToSkip)
        .limit(freeToTake)
        .select({ name: 1, age: 1, images: 1, isPremium: 1 })
        .lean();
    }

    // merge and map to required structure (title, age, one image)
    const products = [...premiumPosts, ...freePosts].map((p) => ({
      _id: p._id,
      title: p.name,
      age: p.age,
      isPremium: p.isPremium,
      imgOne: p.images && p.images.length > 0 ? p.images[0] : null,
    }));

    if (products.length === 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Posts data found";
      return response;
    }

    response.total = await Posts.countDocuments({
      ...matching,
      isApproved: true,
    });
    response.pages = totalPages;
    response.data = { products };

    return response;
  } catch (error) {
    console.error(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again later";
    return response;
  }
};
exports.searchProductService = async ({ q }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product data found successfully",
    data: {},
  };

  try {
    let query = { isDelete: false };
    if (q !== "undefined" || q !== undefined || q) {
      let regex = new RegExp(q, "i");
      query = {
        ...query,
        $or: [{ name: regex }, { category: regex }],
      };
    }

    response.data.products = await Posts.find(query)
      .select("-__v -isDelete")
      .sort({ _id: -1 });

    if (response.data.products.length === 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Posts data found";
    }

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get one Postss by id
exports.getOnlyUserPosts = async ({
  id,
  page,
  status,
  category,
  searchText,
  sort,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Posts successfully",
    data: {},
    pages: 0,
    startIndex: 0,
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 10;
    const skipCount = (pageNumber - 1) * limit;
    const regex = new RegExp(searchText, "i");

    let forPage = {};
    if (searchText && category && status) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        category: category,
        name: regex,
      };
    } else if (category && status) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        category: category,
      };
    } else if (searchText && status) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        name: regex,
      };
    } else if (category && searchText) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        category: category,
        name: regex,
      };
    } else if (category) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        category: category,
      };
    } else if (status) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
      };
    } else if (searchText) {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        name: regex,
      };
    } else {
      forPage = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
      };
    }

    const matchStage = {};
    if (searchText && category && status) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        category: category,
        name: regex,
      };
    } else if (category && status) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        category: category,
      };
    } else if (searchText && status) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
        name: regex,
      };
    } else if (category && searchText) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        category: category,
        name: regex,
      };
    } else if (category) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        category: category,
      };
    } else if (status) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        isPremium: status == "true" ? true : false,
      };
    } else if (searchText) {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
        name: regex,
      };
    } else {
      matchStage.$match = {
        $expr: { $eq: ["$posterId", { $toObjectId: `${id}` }] },
      };
    }

    let sortFilter = {};
    if (sort == "desc") {
      sortFilter = { _id: -1 };
    } else {
      sortFilter = { _id: 1 };
    }

    const posts = await Posts.aggregate([
      matchStage,
      { $sort: sortFilter },
      { $skip: skipCount },
      { $limit: limit },
      {
        $project: {
          name: 1,
          isPremium: 1,
          category: 1,
          subCategory: 1,
          createdAt: 1,
        },
      },
    ]);

    if (posts.length == 0) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Posts found";
      return response;
    }

    response.startIndex = skipCount + 1;
    response.data = {
      posts,
    };
    response.pages = await Posts.find(forPage).countDocuments({});

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getAdminUserPosts = async ({ id, page }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Posts successfully",
    data: {},
    page: 0,
  };
  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 8;

    const allPosts = await Posts.find({
      posterId: id,
      isDelete: false,
    }).countDocuments({});

    response.data.product = await Posts.find({
      posterId: id,
      isDelete: false,
    })

      .sort({ _id: -1 })
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .select("-__v -isDelete")
      .exec();

    if (!response.data.product) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Posts found";
      return response;
    }

    response.page = allPosts;
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

// get one Postss by id
exports.getProductService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Posts successfully",
    data: {},
    relatedPosts: [],
    responsiveads: {},
    rainbow: {},
  };

  try {
    const products = await Posts.aggregate([
      { $match: { $expr: { $eq: ["$_id", { $toObjectId: `${id}` }] } } },
      {
        $lookup: {
          from: "users",
          localField: "posterId",
          foreignField: "_id",
          as: "owner",
        },
      },
    ]);

    if (!products) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Posts found";
      return response;
    }

    response.relatedPosts = await Posts.find({
      subCategory: products?.[0]?.subCategory,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name subCategory images category");
    response.data.product = products;

    response.responsiveads = await Responsive.findOne({
      _id: "668f8208163ce73cd95acd97",
    });
    response.rainbow = await Rainbow.findOne({
      _id: "668f7f80a9e744f659d792f5",
    });

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.pendingPostService = async ({ email, page, size }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Posts successfully",
    posts: {},
    startIndex: 0,
    total: 0,
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = size ? parseInt(size) : 10;
    const skipCount = (pageNumber - 1) * limit;

    const regexEmail = new RegExp(email, "i");

    const products = await Posts.aggregate([
      {
        $match: {
          isApproved: false,
          status: { $ne: "rejected" },
          ...(regexEmail ? { name: regexEmail } : {}),
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skipCount },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "posterId",
          foreignField: "_id",
          as: "owner",
        },
      },
    ]);

    if (!products) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Posts found";
      return response;
    }

    const query = {
      isApproved: false,
      status: { $ne: "rejected" },
      ...(regexEmail ? { email: regexEmail } : {}),
    };

    response.posts = products;
    response.total = await Posts.find(query).countDocuments({});
    response.startIndex = skipCount + 1;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
exports.runningPostService = async ({ email, page, size }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Posts successfully",
    posts: {},
    startIndex: 0,
    total: 0,
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = size ? parseInt(size) : 10;
    const skipCount = (pageNumber - 1) * limit;

    const regexEmail = new RegExp(email, "i");

    const products = await Posts.aggregate([
      {
        $match: {
          isApproved: true,
          status: { $ne: "rejected" },
          ...(regexEmail ? { name: regexEmail } : {}),
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skipCount },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "posterId",
          foreignField: "_id",
          as: "owner",
        },
      },
    ]);

    if (!products) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Posts found";
      return response;
    }

    const query = {
      isApproved: true,
      status: { $ne: "rejected" },
      ...(regexEmail ? { name: regexEmail } : {}),
    };

    response.posts = products;
    response.total = await Posts.find(query).countDocuments({});
    response.startIndex = skipCount + 1;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
exports.rejectedPostService = async ({ email, page, size }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch deatiled Posts successfully",
    posts: {},
    startIndex: 0,
    total: 0,
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = size ? parseInt(size) : 10;
    const skipCount = (pageNumber - 1) * limit;

    const regexEmail = new RegExp(email, "i");

    const products = await Posts.aggregate([
      {
        $match: {
          status: "rejected",
          ...(regexEmail ? { name: regexEmail } : {}),
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skipCount },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "posterId",
          foreignField: "_id",
          as: "owner",
        },
      },
    ]);

    if (!products) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Posts found";
      return response;
    }

    const query = {
      status: "rejected",
      ...(regexEmail ? { name: regexEmail } : {}),
    };

    response.posts = products;
    response.total = await Posts.find(query).countDocuments({});
    response.startIndex = skipCount + 1;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deletePostService = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product Delete successfully",
  };

  try {
    const posts = await Posts.findByIdAndDelete(id);
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.updatePostService = async ({ id, data }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product Updated successfully",
  };

  try {
    const posts = await Posts.findByIdAndUpdate(id, data);
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};
