import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const streamingModel = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  streaming: true,
  verbose: true,
  temperature: 0,
});

export const nonStreamingModel = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  apiKey: process.env.GOOGLE_API_KEY,
  streaming: false,
  verbose: true,
  temperature: 0,
});