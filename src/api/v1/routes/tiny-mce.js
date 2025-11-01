const express = require("express");
const { addLinkTinyMCE, updateLinkTinyMCE } = require("../tinymce/controller");
const { getLinksTinyMCE } = require("../tinymce/service");

const router = express.Router();

router.post("/", addLinkTinyMCE);
router.get("/", getLinksTinyMCE);
router.put("/:id", updateLinkTinyMCE);

module.exports = router;
