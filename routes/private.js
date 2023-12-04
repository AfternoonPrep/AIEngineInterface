import express from "express";
import multer from "multer";
import storage from "../utils/handleFileUploads.js";
import { queryPrivateGPT, trainAndQuery } from "../controllers/private.js";

const router = express.Router();
// const upload = multer({ storage });

// 🟢 ENDPOINT TO UPLOAD DOCUMENT AND PROCESS DOCUMENT

router.post("/query", queryPrivateGPT);
router.post("/train", trainAndQuery);

export default router;
