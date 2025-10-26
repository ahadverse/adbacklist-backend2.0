const router = require("express").Router();

const verifyAdmin = require("../middleware/adminCheck");
const verifyToken = require("../middleware/checkLogin");
const {
  addProduct,
  getProducts,
  searchProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  updatePremium,
  getPosterPost,
  getAdminPost,
  getPosts,
  updateApprove,
  updateManyById,
  getAllPost,
  getAdminPosterPost,
  getPostsSitemap,
  getPostsSitemapSecond,
  getPostsSitemapThird,
  getPostsSitemapFourth,
  pendingPost,
  deletePost,
  updatePost,
  runningPost,
  rejectedPost,
  getAllCategoryPost,
} = require("../post/controller");
const {
  updateApproveMany,
  deleteMany,
  updatePostService,
} = require("../post/service");

router.post("/", addProduct);

router.patch("/:id", updateProduct);
router.get("/posterid/:id", getPosterPost);
router.get("/admin", verifyAdmin, getAdminPost);

router.get("/sitemap", getPostsSitemap);
router.get("/sitemap2", getPostsSitemapSecond);
router.get("/sitemap3", getPostsSitemapThird);
router.get("/sitemap4", getPostsSitemapFourth);

router.put("/approved/:id", verifyAdmin, updateApprove);

router.post("/many", updateApproveMany);

router.post("/deleteMany", deleteMany);

router.get("/", getPosts);

router.get("/all", getAllPost);

router.get("/all-category", getAllCategoryPost);

router.delete("/:id", deleteProduct);

router.get("/search", searchProduct);
router.get("/pending", pendingPost);
router.get("/running", runningPost);
router.get("/rejected", rejectedPost);

router.get("/:id", getProduct);
router.get("/update/:id", getProduct);
router.get("/admin-user/:id", getAdminPosterPost);
router.delete("/post/:id", deletePost);
router.put("/post/:id", updatePost);

module.exports = router;
