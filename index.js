import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sanitizeFilename from "sanitize-filename";
import crypto from "crypto";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swaggerConfig.js"; // Import the swaggerSpec from your configuration file

import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Multer configuration for file upload
const upload = multer();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a file
 *     description: Uploads a file to the server
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 fileName:
 *                   type: string
 *       '400':
 *         description: Invalid request or file type
 *       '500':
 *         description: Failed to upload file to server
 */
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

  const sanitizedFileName = sanitizeFilename(req.file.originalname);
  // Generate a unique filename using a cryptographic hash
  const fileName = crypto
    .createHash("md5")
    .update(sanitizedFileName)
    .digest("hex");
  const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  const s3Client = new S3Client({ region: process.env.S3_REGION, credentials });
  const bucketName = process.env.S3_BUCKET_NAME;

  try {
    // Upload to S3 which has an event notification for when a file is uploaded
    // to automatically send an email via SNS topic.
    // You can also setup the notification to send an email using SES via integrating Lambda
    // for a more customizable emails.
    // https://medium.com/@shubhangorei/triggering-s3-bucket-to-send-mail-via-aws-ses-via-integrating-lambda-37dad87f97f
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    // Log the file upload activity
    console.log(`File uploaded: ${fileName}`);

    res.status(200).json({ message: "File uploaded successfully", fileName });
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    res.status(500).json({ error: "Failed to upload file to S3" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
