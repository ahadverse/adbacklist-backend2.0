const { Product } = require("../models");

const router = require("express").Router();

router.get("/", async (req, res) => {
  await updateDataStatus();
});

module.exports = router;
