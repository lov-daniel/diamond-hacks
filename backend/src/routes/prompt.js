import express from "express";
import generate from "../utils/gemini.js";

const router = express.Router();

router.post("/questions", async (req, res) => {
  try {
    const input = req.body.prompt;
    console.log(`Trying to summarize ${input}`);
    const result = await generate(`
Create a short multiple-choice quiz in pure HTML. 
Each question should be wrapped in a <div class="question-block"> and have exactly one correct answer. 
Use four options (A, B, C, D) with <input type="radio"> elements, and group them using the same 'name' attribute (e.g. q1, q2).

At the end, include a <script> tag that defines a JavaScript object:
  window.correctAnswers = { q1: "B", q2: "D", ... };

Do not include any markdown or explanations — just clean HTML + JS.
Input content:
${input}
`);
    res.json({ summary: result });
  } catch (error) {
    console.error("Error in /prompt:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/summary", async (req, res) => {
  try {
    const input = req.body.prompt;
    console.log(`Trying to summarize ${input}`);
    const result = await generate(
      `summarize this test so that i can get a solid understanding	: ${input}`
    );
    res.json({ summary: result });
  } catch (error) {
    console.error("Error in /prompt:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
