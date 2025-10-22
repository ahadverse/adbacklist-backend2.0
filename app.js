const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { readdirSync } = require("fs");
const cron = require("node-cron");
const { updateDataStatus } = require("./src/api/v1/service/premiumDays");
require("dotenv").config();

const app = express();
require("./src/api/v1/config").dbConnection();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: "10mb",
  })
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(cookieParser());
app.use(morgan("dev"));

readdirSync("./src/api/v1/routes").map((route) =>
  app.use(
    `/api/${route.split(".")[0]}`,
    require(`./src/api/v1/routes/${route}`)
  )
);

app.get("/", (req, res) => {
  res.json({ message: "server is running" });
});

cron.schedule("0 0 * * *", async () => {
  console.log(`[${new Date().toISOString()}] 🔄 Running daily update job...`);
  await updateDataStatus();
});

module.exports = app;
