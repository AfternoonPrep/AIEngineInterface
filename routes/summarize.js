import express from "express";

// const processUserUploadedDocument = require("../../controllers/ai/processUserUploadedDocument");
const router = express.Router();
import multer from "multer";
import storage from "../utils/handleFileUploads.js";
import { handleBookSummarizer } from "../controllers/summarize.js";

const upload = multer({ storage });

// 🟢 ENDPOINT TO UPLOAD DOCUMENT AND PROCESS DOCUMENT

router.post("/", upload.single("file"), handleBookSummarizer);

export default router;
