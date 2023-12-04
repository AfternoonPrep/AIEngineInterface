import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pinecone from "./routes/pineconeDB.js";
import summarize from "./routes/summarize.js";
import privateGPT from "./routes/private.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import fileUpload from "express-fileupload";
import { authenticate } from "./middleware/swaggerAuth.js";

dotenv.config({ path: "./config/.env" });

const PORT = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use(cors({ allowedHeaders: "*" }));
app.options("*", cors());

app.use("/api/v1/summarize", summarize);
app.use("/api/v1/delete-vectors", pinecone);

app.use(fileUpload());
app.use("/api/v1/private-ai", privateGPT);

const options = {
  failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
  definition: {
    openapi: "3.0.0",
    servers: [
      {
        url: "http://localhost:8000/",
      },
      {
        url: "https://afternoon-prep-backend.onrender.com/",
      },
    ],
    info: {
      title: "AfternoonPrep AI Engine Docs",
      version: "1.0.0",
      description:
        "This is a high level afternoonprep's AI Engine backend API documentation + test integration",
      contact: {
        name: "AfternoonPrep",
        email: "auraqule@gmail.com",
        url: "https://www.afternoonprep.com",
      },
      // basePath: "/api/v1",
    },
    // components: {
    //   securitySchemes: {
    //     BearerAuth: {
    //       type: "http",
    //       scheme: "bearer",
    //       bearerFormat: "JWT",
    //     },
    //   },
    // },

    // security: [
    //   {
    //     BearerAuth: [],
    //   },
    // ],
  },
  apis: ["./routes*.js", "./controllers/*.js", "./models/*.js"],
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJSDoc(options);

app.use(
  "/api-docs",
  // authenticate,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

const server = app.listen(PORT, () =>
  console.log(`Server running in development mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(err);
  console.log(`Error: ${err.message}`.red);
  // Close server and exit process
  server.close(() => process.exit(10));
});
