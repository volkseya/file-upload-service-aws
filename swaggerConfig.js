import swaggerJSDoc from "swagger-jsdoc";
import * as dotenv from "dotenv";
dotenv.config();

// Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Your API Documentation",
    version: "1.0.0",
    description: "API documentation for your Express.js application",
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT}`, // Change this to your server URL
      description: "Development server",
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Path to the API docs
  apis: ["./index.js"], // Specify the path to your route files
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
