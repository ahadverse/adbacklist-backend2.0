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

exports.getPostsListService = async ({
  page = 1,
  limit = 10,
  cat,
  subCat,
  date,
  q,
  sortOrder = "desc",
  isApproved,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetched posts list successfully",
    data: [],
    pagination: {},
  };

  try {
    // Pagination setup
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipCount = (pageNumber - 1) * limitNumber;

    const query = {};

    if (isApproved === "true") {
      query.isApproved = true;
    } else {
      query.isApproved = false;
    }
    console.log(query);
    if (cat) query.category = new RegExp(cat, "i");
    if (subCat) query.subCategory = new RegExp(subCat, "i");

    let newDate;
    const today = moment();
    const startOfDay = today.startOf("day");
    const endOfDay = today.endOf("day");

    switch (date) {
      case "today":
        newDate = { $gte: startOfDay.toDate(), $lte: endOfDay.toDate() };
        break;
      case "yesterday":
        newDate = {
          $gte: today.subtract(1, "day").startOf("day").toDate(),
          $lt: startOfDay.toDate(),
        };
        break;
      case "last3days":
        newDate = { $gte: today.subtract(3, "day").startOf("day").toDate() };
        break;
      case "last7days":
        newDate = { $gte: today.subtract(7, "day").startOf("day").toDate() };
        break;
      case "thismonth":
        newDate = {
          $gte: today.startOf("month").toDate(),
          $lte: today.endOf("month").toDate(),
        };
        break;
      case "lastmonth":
        newDate = {
          $gte: today.subtract(1, "month").startOf("month").toDate(),
          $lt: today.startOf("month").toDate(),
        };
        break;
      case "thisyear":
        newDate = {
          $gte: today.startOf("year").toDate(),
          $lte: today.endOf("year").toDate(),
        };
        break;
      case "lastyear":
        newDate = {
          $gte: today.subtract(1, "year").startOf("year").toDate(),
          $lt: today.startOf("year").toDate(),
        };
        break;
    }
    if (newDate) query.createdAt = newDate;

    // if (q) {
    //   // const user = await User.findOne({ email: q });
    //   // if (user?._id) query.posterId = mongoose.Types.ObjectId(user._id);
    // }
    if (q) {
      const regex = new RegExp(q, "i");
      query.$or = [{ phone: regex }, { email: regex }, { name: regex }];
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const posts = await Posts.find(query)
      .sort({ createdAt: sortDirection })
      .skip(skipCount)
      .limit(limitNumber)
      .select({
        category: 1,
        name: 1,
        subCategory: 1,
        createdAt: 1,
        isPremium: 1,
        isApproved: 1,
        cities: 1,
      })
      .lean();

    const processedPosts = posts.map((p) => ({
      ...p,
      cityCount: Array.isArray(p.cities) ? p.cities.length : 0,
    }));

    const total = await Posts.countDocuments(query);
    const pagination = {
      total,
      page: pageNumber,
      limit: limitNumber,
    };

    response.data = processedPosts;
    response.pagination = pagination;

    return response;
  } catch (error) {
    console.error("Error in getPostsListService:", error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error while fetching posts list.";
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
    message: "Post updated successfully",
    data: {},
  };

  try {
    if (!id) {
      return {
        code: 400,
        status: "failed",
        message: "Post ID is required",
        data: {},
      };
    }

    if (typeof isApproved !== "boolean") {
      return {
        code: 400,
        status: "failed",
        message: "isApproved must be a boolean",
        data: {},
      };
    }

    const updatedPost = await Posts.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true }
    ).exec();

    if (!updatedPost) {
      return {
        code: 404,
        status: "failed",
        message: "No post found with the given ID",
        data: {},
      };
    }

    response.data.post = updatedPost;
    response.message = isApproved
      ? "Post approved successfully"
      : "Post disapproved successfully";

    return response;
  } catch (error) {
    console.error("Error updating post approval:", error);
    return {
      code: 500,
      status: "failed",
      message: "Internal server error. Please try again.",
      data: {},
    };
  }
};

exports.updateApproveMany = async (req, res) => {
  const { ids, isApproved } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "No post IDs provided",
    });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await Posts.updateMany(
        { _id: { $in: ids } },
        { $set: { isApproved } },
        { session }
      );
    });

    res.status(200).json({
      status: "success",
      message: `Posts ${isApproved ? "approved" : "unapproved"} successfully.`,
    });
  } catch (error) {
    console.error("Bulk approve error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong while updating posts.",
    });
  } finally {
    await session.endSession();
  }
};

exports.deleteMany = async (req, res) => {
  try {
    // Expect: { ids: [] }
    const { ids = [] } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No post IDs provided",
      });
    }

    const result = await Posts.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: "success",
      message: "Posts deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong while deleting posts.",
    });
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
  page = 1,
  limit = 10,
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
    pagination: {},
  };

  try {
    const pageNumber = page ? parseInt(page) : 1;
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

    response.pagination = {
      total: await Posts.find(forPage).countDocuments({}),
      page: Number(page),
      limit: Number(limit),
    };
    response.startIndex = skipCount + 1;
    response.data = {
      posts,
    };

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
