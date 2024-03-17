import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Multer configuration for file upload
const upload = multer();

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    return res.status(400).json({ error: "Invalid file size" });
  }

  const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  const s3Client = new S3Client({ region: process.env.S3_REGION, credentials });
  const bucketName = process.env.S3_BUCKET_NAME;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: req.file.originalname,
      Body: req.file.buffer,
    })
  );

  res.status(200).json({ message: "File uploaded successfully" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
