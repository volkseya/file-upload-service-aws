import request from "supertest";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import app from "./index";
import { mockClient } from "aws-sdk-client-mock";

const mockS3Client = mockClient(S3Client); // Mock S3Client

describe("File upload API", () => {
  test("Uploads a file successfully", async () => {
    const mockFileContent = "Mock file content for testing";
    const mockFileName = "mockfile.txt";

    // Mock S3 putObjectCommand call
    mockS3Client.on(PutObjectCommand);

    // Mock file upload
    const response = await request(app)
      .post("/upload")
      .attach("file", Buffer.from(mockFileContent), mockFileName);

    const s3PutObjectCommandStub = mockS3Client.commandCalls(PutObjectCommand);

    // Assert response status and message
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("File uploaded successfully");

    // s3PutObjectCommandStub[0] here refers to the first call of GetObjectCommand
    expect(s3PutObjectCommandStub[0].args[0].input).toEqual({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: mockFileName,
      Body: Buffer.from(mockFileContent),
    });
  });
});
