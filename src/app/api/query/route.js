import React from "react";
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const systemPrompt = `
You are a Retrieval-Augmented Generation (RAG) AI assistant. 
Your primary function is to provide accurate and relevant answers based 
solely on the context given to you.
 Follow these guidelines strictly

`;

export async function POST(req) {
  const data = await req.json();
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pc.Index("raggdrive");
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const text = data[data.length - 1].content;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const Result = await model.embedContent(text);
  const embeddings = Result.embedding;
  const results = await index.query({
    topK: 3,
    vector: embeddings["values"],
    includeMetadata: true,
  });

  const contextFromResults = results.matches.map((match) => ({
    author: match.metadata["pdf.info.Author"] || "N/A",
    creationDate: match.metadata["pdf.info.CreationDate"] || "N/A",
    text: match.metadata.text || "N/A",
  }));

  const lastMessage = data[data.length - 1];
  const lastMessageContent =
    lastMessage.content +
    "\n\nContext from vector DB:\n" +
    JSON.stringify(contextFromResults, null, 2);
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        { role: "system", content: systemPrompt },
        ...lastDataWithoutLastMessage,
        { role: "user", content: lastMessageContent },
      ],
    });

    const response = completion.choices[0].message.content;
    console.log(response);
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in OpenAI API call:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
