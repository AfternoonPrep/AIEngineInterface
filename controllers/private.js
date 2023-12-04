import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Tiktoken } from "@dqbd/tiktoken/lite";
import { load } from "@dqbd/tiktoken/load";
import registry from "@dqbd/tiktoken/registry.json" assert { type: "json" };
import models from "@dqbd/tiktoken/model_to_encoding.json" assert { type: "json" };
import BOOKTYPES from "../constants/index.js";
import axios from "axios";

import FormData from "form-data";

/**
 * @swagger
 * tags:
 *   name: AI Model Training (DOCS)
 *   description: Endpoints for training AI model and get Summarized version.
 * /api/v1/private-ai/train:
 *   post:
 *     tags: [AI Model Training (DOCS)]
 *     summary: Train AI Model and Summarize Document
 *     description: Upload files, train AI model, and get a summarized response.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: files
 *         in: formData
 *         type: file
 *         required: true
 *         description: Files to upload for training and querying.
 *       - name: Authorization
 *         in: header
 *         type: string
 *         required: true
 *         description: Bearer token for authentication.
 *       - name: title
 *         in: formData
 *         type: string
 *         required: true
 *         description: Title of the document.
 *       - name: author
 *         in: formData
 *         type: string
 *         required: true
 *         description: Author of the document.
 *       - name: type
 *         in: formData
 *         type: string
 *         required: true
 *         description: Type of the document "RESEARCH-PAPER | LITERATURE | TEXTBOOK"
 *         enum:
 *           - "RESEARCH-PAPER"
 *           - "LITERATURE"
 *           - "TEXTBOOK"
 *       - name: subject
 *         in: formData
 *         type: string
 *         required: false
 *         description: Subject of the document. Required for "TEXTBOOK" type.
 *       - name: gradeLevel
 *         in: formData
 *         type: string
 *         required: false
 *         description: Grade level of the document. Required for "TEXTBOOK" type.
 *       - name: genre
 *         in: formData
 *         type: string
 *         required: false
 *         description: Genre of the document. Required for "LITERATURE" type.
 *       - name: year
 *         in: formData
 *         type: string
 *         required: false
 *         description: Year of publication. Required for "RESEARCH-PAPER" type.
 *     responses:
 *       200:
 *         description: Successful response with AI model predictions.
 *       400:
 *         description: Bad request due to missing files or parameters.
 *       500:
 *         description: Internal server error.
 */

async function calculateCost(content) {
  const modelName = "text-embedding-ada-002";
  const modelKey = models[modelName];
  const model = await load(registry[modelKey]);
  const encoder = new Tiktoken(
    model.bpe_ranks,
    model.special_tokens,
    model.pat_str
  );
  const tokens = encoder.encode(JSON.stringify(content));
  const tokenCount = tokens.length;
  const ratePerThousandTokens = 0.0004;
  const cost = (tokenCount / 1000) * ratePerThousandTokens;
  encoder.free();
  console.log("cost:", cost);
}

const API_URL = process.env.PRIVATE_AI_ENGINE_URL;

export async function trainAndQuery(req, res) {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    const { title, author, type, subject, gradeLevel, genre, year } = req.body;

    if (!title || !author || !type) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const formData = new FormData();
    formData.append("files", req.files.files.data);
    formData.append("openAIApiKey", process.env.OPENAI_API_KEY);
    formData.append("modelName", "gpt-3.5-turbo");
    formData.append("temperature", 1);

    let question = "";

    if (type === BOOKTYPES.researchPaper) {
      if (!year) {
        return res
          .status(400)
          .json({ error: "Missing year for research paper." });
      }
      question = `Provide a summary of the research paper titled "${title}" by ${author}, published in ${year}.`;
    } else if (type === BOOKTYPES.literature) {
      if (!genre) {
        return res.status(400).json({ error: "Missing genre for literature." });
      }
      question = `Give me a summary of the literature "${title}" by ${author}, belonging to the ${genre} genre.`;
    } else if (type === BOOKTYPES.textbook) {
      if (!subject || !gradeLevel) {
        return res
          .status(400)
          .json({ error: "Missing subject or grade level for textbook." });
      }
      question = `Provide a summary of the textbook "${title}" by ${author}, which is related to ${subject} at the ${gradeLevel} grade level.`;
    } else {
      return res.status(400).json({ error: "Invalid document type." });
    }

    // Invoke the function to calculate the cost of tokenizing the documents
    await calculateCost(req.files.files.data);

    formData.append("question", question);

    const response = await axios.post(API_URL, formData, {
      headers: {
        Authorization: `Bearer ${process.env.BEARER_AUTH}`,
        // ...formData.getHeaders(),
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred." });
  }
}

/**
 * @swagger
 * tags:
 *   - name: AI Model Query (DOCS)
 *     description: Endpoints for further querying or questioning of the AI model based on trained/uploaded documents.
 * /api/v1/private-ai/query:
 *   post:
 *     summary: Query AI Model
 *     description: Query the AI model with a question to get predictions.
 *     requestBody:
 *       description: The question to ask the AI model.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful response with AI model predictions.
 *         content:
 *           application/json:
 *             example:
 *               prediction: "The AI model's prediction for the question."
 *       400:
 *         description: Bad request due to missing or invalid parameters.
 *         content:
 *           application/json:
 *             example:
 *               error: "Description of the error"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               error: "Description of the error"
 */

const query = async (data) => {
  try {
    //🟢 CALCULATE THE TOKEN COST OF USER QUERY OR SEARCH INPUT/REQUEST
    await calculateCost(data);
    console.log("QUERY TOKEN COST");

    const response = await axios.post(process.env.PRIVATE_AI_ENGINE_URL, data, {
      headers: {
        Authorization: `Bearer ${process.env.BEARER_AUTH}`,
        "Content-Type": "application/json",
      },
    });
    //🟢 CALCULATE THE TOKEN COST OF USER QUERY RESULT
    await calculateCost(response.data);
    console.log("RESULT TOKEN COST");
    return response.data;
  } catch (error) {
    // console.log(error);
    throw new Error(error);
  }
};

export const queryPrivateGPT = async (req, res) => {
  try {
    const { question } = req.body;
    console.log(req.body?.question);
    if (req.body?.question === undefined)
      return res.status(500).json({ error: "undefined body" });

    const data = { question };
    const response = await query(data);
    res.status(200).json(response);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: error.message });
  }
};
