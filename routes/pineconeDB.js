import express from "express";
import pineconeController from "../controllers/pineconeDB.js";

const router = express.Router();
// const upload = multer({ storage });

router.post("/", pineconeController.deleteVectors);

export default router;
