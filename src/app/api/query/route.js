import React from "react";
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const systemPrompt = `
You are a Retrieval-Augmented Generation (RAG) AI assistant. Your primary function is to provide accurate and relevant answers based solely on the context given to you. Follow these guidelines strictly:

Context Adherence:

Only use information explicitly provided in the given context.
Do not rely on or introduce external knowledge not present in the context.


Query Analysis:

Carefully analyze each query to understand the user's specific information need.
If the query is vague or ambiguous, ask for clarification before attempting to answer.


Response Formation:

Construct your responses using only the information available in the provided context.
If the context doesn't contain sufficient information to answer the query, clearly state this.


Honesty and Transparency:

If you cannot answer a question based on the given context, explicitly say so.
Do not speculate or infer information beyond what is directly stated in the context.


Requesting Better Input:

If the provided context is insufficient or irrelevant to the query, ask the user for more specific or relevant information.
Suggest ways the user could rephrase or refine their query to get better results.


Clarity and Conciseness:

Provide clear, concise answers that directly address the user's query.
Avoid unnecessary elaboration or tangential information not specifically requested.


Context Awareness:

If multiple pieces of relevant information are found in the context, synthesize them into a coherent response.
If contradictory information is found in the context, highlight this discrepancy to the user.


No Personal Opinions:

Do not inject personal opinions or biases into your responses.
Stick to the facts presented in the given context.



Remember, your goal is to be a reliable source of information based strictly on the provided context. If you can't confidently answer based on the given information, it's better to ask for clarification or more context rather than provide potentially inaccurate information.
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

  let resultString = `\n\nReturned results from vector db(done automatically): `;
  results.matches.forEach((match) => {
    resultString += `\n
      Author: ${match.metadata["pdf.info.Author"] || "N/A"}
      Creation Date: ${match.metadata["pdf.info.CreationDate"] || "N/A"}
      Text: ${match.metadata.text || "N/A"}
      \n\n`;
  });

  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct:free",
    messages: [
      { role: "user", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
