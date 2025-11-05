const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/files", upload.array("images", 5), async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = [];
    for (const file of files) {
      const fileExtention = path.extname(file.originalname);
      const fileName =
        file.originalname
          .replace(fileExtention, "")
          .toLowerCase()
          .split(" ")
          .join("-") +
        "-" +
        Date.now();

      const params = {
        Bucket: bucket_Name,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      uploadedFiles.push(`https://dk3vy6fruyw6l.cloudfront.net/${fileName}`);
      // uploadedFiles.push(`https://d1wxnh87mbrzoa.cloudfront.net/${fileName}`); arif
    }
    res.json(uploadedFiles);
  } catch (error) {
    console.error("Error uploading files to S3:", error);
    res.status(500).json({ error: "An error occurred while uploading files." });
  }
});
module.exports = router;
