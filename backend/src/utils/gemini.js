// utils/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Make sure it's in .env

const generate = async (input) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
  const result = await model.generateContent("why is the sky blue?");
  const response = await result.response;
  return response.text();
};

export default generate;