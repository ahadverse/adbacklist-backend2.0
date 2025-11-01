const express = require("express");
const { addLink, updateLink, getLink } = require("../links/controller");
const { getLinks } = require("../links/service");

const verifyAdmin = require("../middleware/adminCheck");

const router = express.Router();

router.post("/", addLink);
router.get("/", getLinks);
router.get("/header", getLink);
router.put("/:id", updateLink);

module.exports = router;
