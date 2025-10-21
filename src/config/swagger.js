import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./index.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Your API Name",
      version: "1.0.0",
      description: "A production-ready REST API built with Node.js, Express, and Prisma",
      //   contact: {
      //     name: "API Support",
      //     email: "support@apiapaapihehe.com",
      //     url: "https://bintangtitik.com",
      //   },
      //   license: {
      //     name: "MIT",
      //     url: "https://opensource.org/licenses/MIT",
      //   },
    },
    servers: [
      {
        url:
          env.NODE_ENV === "production"
            ? "https://api.yourapp.com" // You can change it with env.URLDEPLOYMENT -> Create first.
            : `http://localhost:${env.PORT}`,
        description: env.NODE_ENV === "production" ? "Production server" : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: "The specified resource was not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string", example: "Resource not found" },
                },
              },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  error: { type: "string", example: "Validation Error" },
                  details: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        path: { type: "string", example: "body.email" },
                        message: { type: "string", example: "Invalid email format" },
                        code: { type: "string", example: "invalid_string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication and authorization endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Health",
        description: "System health and status endpoints",
      },
    ],
  },
  // Paths to files containing JSDoc comments
  apis: ["./src/api/v1/**/*.router.js", "./src/api/v1/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
