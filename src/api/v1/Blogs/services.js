const { Blogs } = require("../models");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
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

exports.addBlogServices = async ({ body }) => {
  const response = {
    code: 201,
    status: "success",
    message: "Blog added successfully",
  };

  try {
    const newProduct = new Blogs(body);
    await newProduct.save();
    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getBlogsForSitemap = async () => {
  const response = {
    code: 201,
    status: "success",
    message: "Blog added successfully",
    data: {},
  };
  try {
    const blogs = await Blogs.find({}, "permalink");
    console.log(blogs.length);
    response.data = blogs;
    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.getBlogsServices = async ({
  page = 1,
  limit = 10,
  cat,
  subCat,
  q,
  sortOrder = "desc",
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetched blogs list successfully",
    data: [],
    pagination: {},
  };

  try {
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skipCount = (pageNumber - 1) * limitNumber;

    const query = {};

    if (cat) query.category = new RegExp(cat, "i");
    if (subCat) query.subCategory = new RegExp(subCat, "i");

    if (q) {
      const regex = new RegExp(q, "i");
      query.$or = [
        { title: regex },
        { category: regex },
        { subCategory: regex },
      ];
    }

    // ---- SORT ----
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // ---- FETCH ----
    const blogs = await Blogs.find(query)
      .sort({ createdAt: sortDirection })
      .skip(skipCount)
      .limit(limitNumber)
      .select({
        title: 1,
        category: 1,
        subCategory: 1,
        createdAt: 1,
        image: 1,
      })
      .lean();

    const total = await Blogs.countDocuments(query);

    const pagination = {
      total,
      page: pageNumber,
      limit: limitNumber,
    };

    response.data = blogs;
    response.pagination = pagination;

    return response;
  } catch (error) {
    console.error("Error in getBlogsServices:", error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error while fetching blogs list.";
    return response;
  }
};

exports.getBlogsAdminServices = async ({ q, page, cat, subCat }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Blog list successfully",
    data: {},
    page: 0,
    startIndex: 0,
  };

  const regex = new RegExp(q, "i");
  const catregex = new RegExp(cat, "i");
  try {
    const pageNumber = page ? parseInt(page) : 1;
    const limit = 6;
    const skipCount = (pageNumber - 1) * limit;

    let forPage = {};
    if (q && cat && subCat) {
      forPage = {
        category: catregex,
        title: regex,
        subCategory: subCat,
      };
    } else if (q && cat) {
      forPage = {
        category: catregex,
        title: regex,
      };
    } else if (q && subCat) {
      forPage = {
        title: regex,
        subCategory: subCat,
      };
    } else if (cat && subCat) {
      forPage = {
        category: catregex,
        subCategory: subCat,
      };
    } else if (q) {
      forPage = { title: regex };
    } else if (cat) {
      forPage = { category: catregex };
    } else if (subCat) {
      forPage = { subCategory: subCat };
    } else {
      forPage = {};
    }

    let matchStage = {};
    if (q && cat && subCat) {
      matchStage.$match = {
        category: catregex,
        title: regex,
        subCategory: subCat,
      };
    } else if (q && cat) {
      matchStage.$match = {
        category: catregex,
        title: regex,
      };
    } else if (q && subCat) {
      matchStage.$match = {
        title: regex,
        subCategory: subCat,
      };
    } else if (cat && subCat) {
      matchStage.$match = {
        category: catregex,
        subCategory: subCat,
      };
    } else if (q) {
      matchStage.$match = { title: regex };
    } else if (cat) {
      matchStage.$match = { category: catregex };
    } else if (subCat) {
      matchStage.$match = { subCategory: subCat };
    } else {
      matchStage.$match = {};
    }

    const blogs = await Blogs.aggregate([
      matchStage,
      {
        $sort: { _id: -1 },
      },
      { $skip: skipCount },
      {
        $limit: limit,
      },
      {
        $project: {
          title: 1,
          category: 1,
          status: 1,
          image: 1,
          subCategory: 1,
          createdAt: 1,
        },
      },
    ]);

    if (blogs.length === 0) {
      response.code = 404;
      response.status = "failded";
      response.message = "No Product data found";
      return response;
    }

    // const totalBlogs = await Blogs.countDocuments({}, { maxTimeMS: 20000 });
    const totalBlogs = await Blogs.find(forPage).countDocuments({});
    response.page = totalBlogs;
    response.startIndex = skipCount + 1;
    response.data = {
      blogs,
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

exports.singleBlogServices = async ({ q }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Blog list successfully",
    data: {},
    relatedBlogs: [],
  };

  try {
    const blog = await Blogs.findOne({ permalink: q });

    if (!blog) {
      response.code = 404;
      response.status = "failed";
      response.message = "Error. Try again";
      return response;
    }

    const relatedBlogs = await Blogs.find({
      category: blog?.category,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title category image permalink");

    response.relatedBlogs = relatedBlogs;
    response.data = { blog };

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

exports.singleBlogByIdServices = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Fetch Blog list successfully",
    data: {},
  };

  try {
    const blogs = await Blogs.find({ _id: id });

    if (!blogs) {
      response.code = 404;
      response.status = "failed";
      response.message = "Error. Try again";
      return response;
    }

    // console.log(blogs);
    response.data = { blogs };

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again a";
    return response;
  }
};

// update blogs
exports.updateBlogServices = async ({
  id,
  title,
  category,
  subCategory,
  desc,
  image,
  writer,
  status,
  permalink,
  metaDesc,
  metaKey,
}) => {
  const response = {
    code: 200,
    status: "success",
    message: "Blog  updated successfully",
    data: {},
  };

  try {
    const blog = await Blogs.findOne({
      _id: id,
    }).exec();
    if (!blog) {
      response.code = 422;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    blog.title = title ? title : blog.title;
    blog.permalink = permalink ? permalink : blog.permalink;
    blog.category = category ? category : blog.category;
    blog.subCategory = subCategory ? subCategory : blog.subCategory;
    blog.desc = desc ? desc : blog.desc;
    blog.image = image ? image : blog.image;
    blog.writer = writer ? writer : blog.writer;
    blog.status = status ? status : blog.status;
    blog.metaDesc = metaDesc ? metaDesc : blog.metaDesc;
    blog.metaKey = metaKey ? metaKey : blog.metaKey;

    await blog.save();

    response.data.blog = blog;

    return response;
  } catch (error) {
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteBlogServices = async ({ id }) => {
  const response = {
    code: 200,
    status: "success",
    message: "Delete Product successfully",
  };

  try {
    const blog = await Blogs.findOne({
      _id: id,
      isDelete: false,
    });

    if (!blog) {
      response.code = 404;
      response.status = "failed";
      response.message = "No Product data found";
      return response;
    }

    await Blogs.deleteOne({ _id: id }); // delete directly by id

    return response;
  } catch (error) {
    console.log(error);
    response.code = 500;
    response.status = "failed";
    response.message = "Error. Try again";
    return response;
  }
};

exports.deleteMany = async (req, res) => {
  const ids = req.body;

  try {
    await Blogs.deleteMany(
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

exports.updatePauseMany = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  const { data } = req.body;

  try {
    data.map((a) => {
      const f = Blogs.findByIdAndUpdate(
        a,
        { $set: { status: "paused" } },
        function (err, docs) {
          console.log(err);
        }
      );
    });
    res
      .status(200)
      .json({ status: "success", message: "Post updated successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong in /edit-order" });
  }
};

exports.updatePablishMany = async (req, res) => {
  const response = {
    code: 200,
    status: "success",
    message: "Product updated successfully",
    data: {},
  };

  const { data } = req.body;
  try {
    data.map((a) => {
      const f = Blogs.findByIdAndUpdate(
        a,
        { $set: { status: "published" } },
        function (err, docs) {
          console.log(err);
        }
      );
    });
    res
      .status(200)
      .json({ status: "success", message: "Post updated successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong in /edit-order" });
  }
};
