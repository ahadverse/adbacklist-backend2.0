const express = require("express");
const { getLinksResponsive } = require("../responsive/service");
const {
  updateLinkResponsive,
  addLinkResponsive,
} = require("../responsive/controller");

const router = express.Router();

router.post("/", addLinkResponsive);
router.get("/", getLinksResponsive);
router.put("/:id", updateLinkResponsive);

module.exports = router;
