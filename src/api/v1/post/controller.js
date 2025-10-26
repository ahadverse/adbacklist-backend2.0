const {
  addProductService,
  getProductsService,
  getAdminUserPosts,
  searchProductService,
  getProductService,
  deleteProductService,
  updateProductService,
  updateApproveService,
  getOnlyUserPosts,
  getUnApprovedService,
  getApprovedService,
  updateMany,
  updateApprove,
  getAllPosts,
  getPostForSitemap,
  getPostForSitemapSecond,
  getPostForSitemapthird,
  getPostForSitemapFourth,
  pendingPostService,
  deletePostService,
  updatePostService,
  runningPostService,
  rejectedPostService,
  getAllCategoryPost,
  getPostsListService,
} = require("./service");

// add Products
exports.addProduct = async (req, res) => {
  const { status, code, message } = await addProductService({
    body: req.body,
    ...req.body,
  });
  res.status(code).json({ code, status, message });
};

// update Products
exports.updateProduct = async (req, res) => {
  const { status, code, message, data } = await updateProductService({
    ...req.params,
    ...req.body,
  });
  if (data.product) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// update Products
exports.updateApprove = async (req, res) => {
  const { status, code, message, data } = await updateApproveService({
    ...req.params,
    ...req.body,
  });
  if (data.product) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// update Products
exports.updateManyById = async (req, res) => {
  const { status, code, message, data } = await updateApprove({
    ...req.params,
    ...req.body,
  });
  if (data.product) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// delete Products
exports.deleteProduct = async (req, res) => {
  const { status, code, message, data } = await deleteProductService({
    ...req.params,
  });
  res.status(code).json({ code, status, message, data });
};
exports.updatePost = async (req, res) => {
  const { status, code, message } = await updatePostService({
    ...req.params,
    data: req.body,
  });
  res.status(code).json({ code, status, message });
};

// get all Products
exports.getAdminPost = async (req, res) => {
  const { status, code, message, data, totalPost } = await getUnApprovedService(
    {
      ...req.query,
    }
  );
  if (data.products) {
    return res.status(code).json({ code, status, message, data, totalPost });
  }
  res.status(code).json({ code, status, message });
};

// get all Products
exports.getPosts = async (req, res) => {
  const { status, code, message, data, pagination } = await getPostsListService(
    {
      ...req.query,
    }
  );
  if (data) {
    return res.status(code).json({ code, status, message, data, pagination });
  }
  res.status(code).json({ code, status, message });
};

exports.getPostsSitemap = async (req, res) => {
  const { status, code, message, data } = await getPostForSitemap({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

exports.deletePost = async (req, res) => {
  const { status, code, message } = await deletePostService({
    ...req.params,
  });
  res.status(code).json({ code, status, message });
};

exports.getPostsSitemapSecond = async (req, res) => {
  const { status, code, message, data } = await getPostForSitemapSecond({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};
exports.getPostsSitemapThird = async (req, res) => {
  const { status, code, message, data } = await getPostForSitemapthird({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};
exports.getPostsSitemapFourth = async (req, res) => {
  const { status, code, message, data } = await getPostForSitemapFourth({
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// get all Products
exports.getAllPost = async (req, res) => {
  const { status, code, message, data, pages, total } = await getAllPosts({
    ...req.query,
  });
  if (data.products) {
    return res.status(code).json({ code, status, message, data, pages, total });
  }
  res.status(code).json({ code, status, message });
};

// get all Products
exports.getAllCategoryPost = async (req, res) => {
  const { status, code, message, data, pages, total } =
    await getAllCategoryPost({
      ...req.query,
    });
  if (data.products) {
    return res.status(code).json({ code, status, message, data, pages, total });
  }
  res.status(code).json({ code, status, message });
};

// get Products by search
exports.searchProduct = async (req, res) => {
  const { status, code, message, data } = await searchProductService({
    ...req.query,
  });
  if (data.products && data.products.length > 0) {
    return res.status(code).json({ code, status, message, data });
  }
  res.status(code).json({ code, status, message });
};

// get Products by search
exports.pendingPost = async (req, res) => {
  const { status, code, message, posts, startIndex, total } =
    await pendingPostService({
      ...req.query,
    });
  if (posts) {
    return res
      .status(code)
      .json({ code, status, message, posts, startIndex, total });
  }
  res.status(code).json({ code, status, message });
};
exports.runningPost = async (req, res) => {
  const { status, code, message, posts, startIndex, total } =
    await runningPostService({
      ...req.query,
    });
  if (posts) {
    return res
      .status(code)
      .json({ code, status, message, posts, startIndex, total });
  }
  res.status(code).json({ code, status, message });
};
exports.rejectedPost = async (req, res) => {
  const { status, code, message, posts, startIndex, total } =
    await rejectedPostService({
      ...req.query,
    });
  if (posts) {
    return res
      .status(code)
      .json({ code, status, message, posts, startIndex, total });
  }
  res.status(code).json({ code, status, message });
};

// get one Products
exports.getPosterPost = async (req, res) => {
  const { status, code, message, data, pagination } = await getOnlyUserPosts({
    ...req.params,
    ...req.query,
  });
  if (data) {
    return res.status(code).json({ code, status, message, data, pagination });
  }
  res.status(code).json({ code, status, message });
};

// get one Products
exports.getAdminPosterPost = async (req, res) => {
  const { status, code, message, data, page } = await getAdminUserPosts({
    ...req.params,
    ...req.query,
  });
  if (data.product) {
    return res.status(code).json({ code, status, message, data, page });
  }
  res.status(code).json({ code, status, message });
};

// get one Products
exports.getProduct = async (req, res) => {
  const { status, code, message, data, relatedPosts, responsiveads, rainbow } =
    await getProductService({
      ...req.params,
    });
  if (data.product) {
    return res.status(code).json({
      code,
      status,
      message,
      data,
      relatedPosts,
      responsiveads,
      rainbow,
    });
  }
  res.status(code).json({ code, status, message });
};
