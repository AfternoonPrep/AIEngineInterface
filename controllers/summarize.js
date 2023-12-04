import { PineconeClient } from "@pinecone-database/pinecone";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { createPineconeIndex } from "../utils/createPineconeIndex.js";
import { updatePinecone } from "../utils/updatePinecone.js";
import { queryPineconeVectorStoreAndQueryLLM } from "../utils/queryPinecone&GPT.js";
import fs from "fs-extra";
import path from "path";

export const handleBookSummarizer = async (req, res) => {
  console.log(req.file);
  try {
    const { originalname, mimetype } = req.file;

    const supportedFormats = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!supportedFormats.includes(mimetype)) {
      throw new Error("Unsupported file format");
    }

    const filePath = path.join(process.cwd(), "uploads", originalname);

    // Check if the file already exists in the destination folder
    if (fs.existsSync(filePath)) {
      throw new Error("File already exists");
    }

    // Move the uploaded file to a local directory for processing
    await fs.move(req.file.path, filePath);

    // ========== 🟢 REST OF PROGRAMMING LOGIC GOES IN HERE ========================
    // 1. Set up DirectoryLoader to load documents from the ./uploads directory
    const loader = new DirectoryLoader(path.join(process.cwd(), "uploads"), {
      ".txt": (path) => new TextLoader(path),
      ".pdf": (path) => new PDFLoader(path),
    });

    // console.log("DOCS: ", loader);
    // // 8. Set up variables for the filename, question, and index settings
    const question =
      "Give me a summary of the document systematic review for multi-factor authentication";
    const indexName = "afternoonprep-pinecone";
    const vectorDimension = 1536;
    // // 9. Initialize Pinecone client with API key and environment
    const client = new PineconeClient();
    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
    // 10. Run the main async function
    (async () => {
      ``;
      // 11. Check if Pinecone index exists and create if necessary
      await createPineconeIndex(client, indexName, vectorDimension);
      // 12. Update Pinecone vector store with document embeddings
      // await updatePinecone(client, indexName, docss);
      // 13. Query Pinecone vector store and GPT model for an answer
      const result = await queryPineconeVectorStoreAndQueryLLM(
        client,
        indexName,
        question
      );
      res.status(201).json({ message: result });
    })();

    // console.log(originalname);
  } catch (error) {
    console.error(error);
    if (error.message === "File already exists") {
      res.status(409).json({ message: "File already exists" });
    } else {
      res.status(500).json({ message: error });
    }
  }
};

// export default handleBookSummarizer;
